/* eslint-disable @typescript-eslint/no-explicit-any */

import mongoose from 'mongoose';
import users from '../user/user.model';
import conversations from './conversation.model';
import QueryBuilder from '../../builder/QueryBuilder';
import messages from '../message/message.model';
import AppError from '../../errors/AppError';
import status from 'http-status';
import { CHAT_TYPE } from './conversation.constant';
import followups from '../followup/followup.model';




const getConversation = async (
  profileId: string,
  query: Record<string, unknown>,
) => {
  const profileObjectId = new mongoose.Types.ObjectId(profileId);
  const searchTerm = query.searchTerm as string;

  let userSearchFilter = {};

  if (searchTerm) {
    const matchingUsers = await users.find(
      { name: { $regex: searchTerm, $options: 'i' } },
      '_id',
    );

    const matchingUserIds = matchingUsers.map((user) => user._id);
    userSearchFilter = {
      participants: { $in: matchingUserIds },
    };
  }
  const currentUserConversationQuery = new QueryBuilder(
    conversations.find({
      participants: profileObjectId,
      ...userSearchFilter,
    })
      .sort({ updatedAt: -1 })
      .populate({ path: 'participants', select: 'name photo _id email' })
      .populate('lastMessage'),
    query,
  )
    .fields()
    .filter()
    .paginate()
    .sort();

  const currentUserConversation = await currentUserConversationQuery.modelQuery;

  const conversationList = await Promise.all(
    currentUserConversation.map(async (conv: any) => {
      const otherUser = conv.participants.find(
        (user: any) => user._id.toString() !== profileId,
      );

      const unseenCount = await messages.countDocuments({
        conversationId: conv._id,
        msgByUserId: { $ne: profileObjectId },
        seen: false,
      });

      return {
        _id: conv._id,
        userData: {
          _id: otherUser?._id,
          name: otherUser?.name,
          profileImage: otherUser?.photo,
          email: otherUser?.email,
        },
        unseenMsg: unseenCount,
        lastMsg: conv.lastMessage,
      };
    }),
  );

  const meta = await currentUserConversationQuery.countTotal();

  return {
    meta,
    result: conversationList,
  };
};

const allConversationIntoDb=async(eventId:string)=>{

  try{

    return eventId

  }
  catch(error:any){
    throw new AppError(status.INTERNAL_SERVER_ERROR,'server error all conversation','')
  }

      
}

/* {
      chat: CHAT_TYPE.singlechat,
      participants: { $all: [currentUserId, data.receiverId], $size: 2 },
    }*/


const getSingleConversationListIntoDb = async (
  currentUserId: string,
  query: Record<string, unknown>
) => {
  try {
    const seenFilter =
      query.seen !== undefined ? query.seen === "true" : undefined;

    /* 1️⃣ Base query */
    const baseQuery = conversations
      .find({
        chat: CHAT_TYPE.singlechat,
        participants: currentUserId,
      })
      .populate([
        {
          path: "participants",
          match: { _id: { $ne: currentUserId } },
          select: "name photo email",
        },
        {
          path: "lastMessage",
          select: "text createdAt seen",
        },
      ])
      .sort({ updatedAt: -1 });

    
    const { seen, ...safeQuery } = query as any;

    const conversationQuery = new QueryBuilder(baseQuery, safeQuery)
      .filter()
      .sort()
      .paginate()
      .fields();

    let allConversations = await conversationQuery.modelQuery;
   const meta = await conversationQuery.countTotal();


    /* 2️⃣ FILTER BY seen/unseen (CORRECT PLACE) */
    if (seenFilter !== undefined) {
      allConversations = allConversations.filter(
        (conv: any) => conv.lastMessage?.seen === seenFilter
      );
    }


    /* 4️⃣ Block logic */
    const participantIds = allConversations
      .map((conv: any) => conv.participants[0]?._id?.toString())
      .filter(Boolean);

    const blocks = await followups
      .find({
        isBlock: true,
        $or: [
          { userId: currentUserId, followupId: { $in: participantIds } },
          { userId: { $in: participantIds }, followupId: currentUserId },
        ],
      })
      .select("userId followupId");

    const blockedMap = new Set(
      blocks.map(
        (b) => `${b.userId.toString()}_${b.followupId.toString()}`
      )
    );

    const conversationsWithBlockStatus = allConversations?.map((conv: any) => {
      const participant = conv?.participants[0];
      let isBlocked = false;

      if (participant) {
        const pid = participant._id.toString();
        if (
          blockedMap.has(`${currentUserId}_${pid}`) ||
          blockedMap.has(`${pid}_${currentUserId}`)
        ) {
          isBlocked = true;
        }
      }

      return {
        ...conv.toObject(),
        isBlocked,
      };
    });

    return {
      meta,
      allConversations: conversationsWithBlockStatus,
    };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      error.message ||
        "Issue while fetching single conversation list — server unavailable"
    );
  }
};




// group conversation list
 
const getGroupConversationListIntoDb = async (eventId: string, currentUserId:string, query:  Record<string, unknown>) => {
  try {
    const baseQuery = conversations
      .find({
        eventId
      }).populate([
          {
             path: "participants",
       
        select: "name photo email",
          },
         {
          path: "lastMessage",
          select: "text  createdAt",
         
        },
        ]) 
   
      .sort({ updatedAt: -1 })
      

    const conversationQuery = new QueryBuilder(baseQuery, query)
      .filter()
      .sort()
      .paginate()
      .fields();

    const allConversations = await conversationQuery.modelQuery;
    const meta = await conversationQuery.countTotal();

    return { meta, allConversations };
  } catch (error: any) {
    
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      error.message || 'Issue while fetching conversation list — server unavailable'
    );
  }
};







const ConversationService = {
  getConversation,
  allConversationIntoDb,
   getSingleConversationListIntoDb,
   getGroupConversationListIntoDb
};

export default ConversationService;

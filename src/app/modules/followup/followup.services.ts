
import mongoose from "mongoose";
import status from "http-status";
import AppError from "../../errors/AppError";
import { TFollowup } from "./followup.interface";
import eventposts from "../event_post/event_post.model";
import followups from "./followup.model";
import QueryBuilder from "../../builder/QueryBuilder";
import users from "../user/user.model";
import NotificationServices from "../notification/notification.services";
import notifications from "../notification/notification.model";

import conversations from "../conversation/conversation.model";
import { CHAT_TYPE } from "../conversation/conversation.constant";



const recordedFollowUpIntoDb = async (
  payload: Partial<TFollowup>,
  userId: string
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const existingFollowup = await followups
      .findOne({
        userId,
        followupId:payload.followupId,
        isDelete: false,
      })
      .session(session);

    let message = "";
    let statusResult = true;

    if (existingFollowup) {
      await followups.deleteOne({ _id: existingFollowup._id }).session(session);
      

      message = "Successfully unfollowed";
      statusResult = false;
    } else {
      // FOLLOW
      await followups.create(
        [
          {
            ...payload,
            userId,
            isFollowUp: true,
          },
        ],
        { session }
      );

      message = "Successfully followed";
    }

    await session.commitTransaction();

    return { status: statusResult, message };
  } catch (error: any) {
    await session.abortTransaction();
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      error?.message || "Failed to record follow-up"
    );
  } finally {
    session.endSession();
  }
};


const findByEventSocialFeedFolloweWiseFilteringIntoDb = async (
  query: Record<string, unknown>,
  userId: string
) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const name = query?.name?.toString().trim();

  const currentUserObjectId = new mongoose.Types.ObjectId(userId);

  // ✅ Get followed user IDs (ObjectId[] from .distinct())
  const followedUsers: mongoose.Types.ObjectId[] = await followups
    .find({ userId, isDelete: false, isFollowUp: true })
    .distinct("followupId");

  const makePostPipeline = (matchStage: Record<string, any>, feedType: string) => [
    { $match: matchStage },

    // ---------- USER INFO ----------
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
        pipeline: [
          ...(name
            ? [
                {
                  $match: {
                    name: { $regex: new RegExp("^" + name, "i") },
                  },
                },
              ]
            : []),
          { $project: { _id: 1, name: 1, photo: 1, subname: 1 } },
        ],
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: false } },

    // ---------- TAG PEOPLE ----------
    {
      $lookup: {
        from: "users",
        localField: "tag_people",
        foreignField: "_id",
        as: "tag_people",
        pipeline: [{ $project: { _id: 1, name: 1 } }],
      },
    },

    // ---------- REACTION INFO ----------
    {
      $lookup: {
        from: "reacteventposts",
        let: {
          postId: "$_id",
          currentUserId: currentUserObjectId,
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$eventpostId", "$$postId"] },
                  { $eq: ["$userId", "$$currentUserId"] },
                  { $eq: ["$isDelete", false] },
                ],
              },
            },
          },
        ],
        as: "reactInfo",
      },
    },

    // ---------- FOLLOW STATUS ----------
    {
      $lookup: {
        from: "followups",
        let: {
          currentUserId: currentUserObjectId,
          postUserId: "$userId",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$userId", "$$currentUserId"] },
                  { $eq: ["$followupId", "$$postUserId"] },
                  { $eq: ["$isFollowUp", true] },
                  { $eq: ["$isDelete", false] },
                ],
              },
            },
          },
        ],
        as: "followInfo",
      },
    },

    // ---------- COMPUTED FIELDS ----------
    {
      $addFields: {
        isReact: {
          $cond: [
            { $gt: [{ $size: "$reactInfo" }, 0] },
            { $arrayElemAt: ["$reactInfo.isReact", 0] },
            false,
          ],
        },
        isFollowUp: { $gt: [{ $size: "$followInfo" }, 0] },
        feedType: { $literal: feedType },
      },
    },

    { $project: { reactInfo: 0, followInfo: 0 } },
  ];

  // ---------- MAIN PIPELINE ----------
  // Partition logic (mutually exclusive by construction, no dedup needed):
  //
  // followedPosts = posts by (followedUsers ∪ self)
  // randomPosts   = posts by everyone else (NOT followed, NOT self)
  //
  // "self" is included in followedPosts so the viewer sees their own
  // posts in their feed, same as Facebook/Instagram. If you don't want
  // that, remove `currentUserObjectId` from the $in array below and add
  // it back to randomPosts' $nin array (see commented alternative).
  const pipeline = [
    {
      $facet: {
        followedPosts: makePostPipeline(
          {
            isDelete: false,
            eventId: { $exists: false },
            userId: { $in: [...followedUsers, currentUserObjectId] },
          },
          "followed"
        ),

        randomPosts: makePostPipeline(
          {
            isDelete: false,
            eventId: { $exists: false },
            userId: { $nin: [...followedUsers, currentUserObjectId] },
          },
          "suggested"
        ),
      },
    },

    { $project: { allPosts: { $concatArrays: ["$followedPosts", "$randomPosts"] } } },
    { $unwind: "$allPosts" },
    { $replaceRoot: { newRoot: "$allPosts" } },
    { $sort: { createdAt: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ];

  const result = await eventposts.aggregate(pipeline as any);

  // ---------- TOTAL COUNT ----------
  // Matches the full universe covered by followedPosts + randomPosts above
  // (i.e. every non-deleted, non-event post — everyone, including self).
  const total = await eventposts.countDocuments({
    isDelete: false,
    eventId: { $exists: false },
  });

  return {
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    data: result,
  };
};






 //   const followedUsers = await followups
//     .find({ userId, isDelete: false, isFollowUp: true })
//     .distinct("userId");

const  findMyFollowedListIntoDb=async(userId:string, query: Record<string, unknown>)=>{


     try{
      const baseQuery = followups
      .find({ userId}).populate([
        {
          path: "followupId",
          select: "name  photo",
        },
      ])
     
      .select("-isDelete  -updatedAt -eventpostId -eventId -followupId -followupId").lean()
    ;

    const allFollowupListQuery = new QueryBuilder(baseQuery, query)
      .search(["userId.name"])
      .filter()
      .sort()
      .paginate()
      .fields();

    const all_my_followupList = await allFollowupListQuery.modelQuery;
    const meta = await allFollowupListQuery.countTotal();

  

    return { meta,all_my_followupList };
     }
     catch(error:any){
        throw new AppError(status.SERVICE_UNAVAILABLE,'issues by the  findMyFollowedListIntoDb server unavaliable')
     }


};

const myFollowingAndFollowerListIntoDb = async (
  userId: string,
  receiverId: string
) => {
  try {
    
    if (
      !mongoose.Types.ObjectId.isValid(receiverId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      throw new AppError(status.BAD_REQUEST, "Invalid user or receiver ID");
    }

    // ⚡ Fetch all essential info in parallel
    const [followingCount, followerCount, totalPosts, userInfo, followRecord, conversation] =
      await Promise.all([
        followups.countDocuments({ userId, isDelete: false }),
        followups.countDocuments({ followupId: userId, isDelete: false }),
        eventposts.countDocuments({ userId, isDelete: false }),
        users.findById(receiverId).select("name photo").lean(),
        followups.findOne({ userId, followupId: receiverId }).select("isFollowUp isBlock").lean(),
        conversations.findOne({
          participants: {
            $all: [
              new mongoose.Types.ObjectId(receiverId),
              new mongoose.Types.ObjectId(userId),
            ],
          },
          $expr: { $eq: [{ $size: "$participants" }, 2] },
          chat: CHAT_TYPE.singlechat,
        }).select("_id").lean(),
      ]);

    // 🧠 Validate user existence
    if (!userInfo) {
      throw new AppError(status.NOT_FOUND, "User not found");
    };


    

// &name=Sohel Host
    const isFollowups = !!followRecord?.isFollowUp;
    const isBlock=!!followRecord?.isBlock

    // ✅ Final structured response
    return {
      user: userInfo,
      conversationId: conversation?._id || null,
      isFollowups,
      isBlock,
      stats: {
        following: followingCount,
        followers: followerCount,
        totalPosts,
      },
    };
  } catch (error: any) {
    console.error("❌ myFollowingAndFollowerListIntoDb Error:", error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "Server unavailable while fetching user stats",
      error.message
    );
  }
};




interface InvitationNotification {
  title: string;
  content: string;
  invitasationList: string[];
  route?: string;
  senderId?: string;
  groupId?: string;

}

const sendInvitasationNotificationIntoDb = async (
  senderUserId: string,
  invitationData: InvitationNotification
) => {
  try {
    const { title, content, invitasationList, route, senderId, groupId } = invitationData;

      console.log({ title, content, invitasationList, route, senderId, groupId })
  
   
    for (const userId of invitasationList) {
      const newNotification = new notifications({
        userId,
        title,
        content,
        route,
        senderId, 
        groupId
      });

      // Save notification to DB
      const savedNotification = await newNotification.save();

      if (!savedNotification) {
        console.error(`Failed to save notification for userId: ${userId}`);
        continue; // Skip sending push notification if save failed
      }

      // Send push notification
      const pushResult = await NotificationServices.sendPushNotification(
        userId.toString(),
        { title, content }
      );

      if (!pushResult) {
        console.error(`Failed to send push notification for userId: ${userId}`);
      }
    }
  } catch (error: any) {
    console.error("Error sending invitation notifications:", error);
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "Server unavailable: sendInvitationNotificationIntoDb"
    );
  }
};



const findMyFollowingListIntoDb=async(userId:string, query: Record<string, unknown>)=>{


     try{
      const baseQuery = followups
      .find({followupId:userId}).populate([
        {
          path: "userId",
          select: "name  photo",
        },
      ])
     
      .select("-isDelete  -updatedAt -eventpostId -eventId -followupId -followupId").lean()
    ;

    const allFollowupListQuery = new QueryBuilder(baseQuery, query)
      .search(["userId.name"])
      .filter()
      .sort()
      .paginate()
      .fields();

    const all_my_followupList = await allFollowupListQuery.modelQuery;
    const meta = await allFollowupListQuery.countTotal();

  

    return { meta,all_my_followupList };
     }
     catch(error:any){
        throw new AppError(status.SERVICE_UNAVAILABLE,'issues by the   findMyFollowingListIntoDb server unavaliable')
     }


};

// delete my follower list 



const deleteFollowerListIntoDb=async(id:string)=>{

    try{
    

       const isExistFollowup=await followups.exists({_id:id});
       if(!isExistFollowup){
          throw new AppError(status.NOT_FOUND,'not founded this id','')
       }

       const result=await followups.findByIdAndDelete(id);
       if(!result){
        throw new AppError(status.NOT_EXTENDED,'issues by the delete follower section')
       };
       return {
         status:true , 
         message:"successfully delete"
       }

    }
     catch(error:any){
        throw new AppError(status.SERVICE_UNAVAILABLE,'issues by the    delete Follower List IntoDb server unavaliable')
     }
}




const isBlockFollowerAndFollowingIntoDb = async (
  userId: string,
  blockedUserId: string
) => {
  const result = await followups.findOneAndUpdate(
    {
      userId,
      followupId: blockedUserId,
      isDelete: false,
    },
    [
      {
        $set: {
          isBlock: { $not: "$isBlock" },
        },
      },
    ],
    { new: true }
  );

  if (!result) {
    throw new AppError(status.NOT_FOUND, "Follow relation not found");
  }

  return {
    status: true,
    message: result.isBlock
      ? "Successfully blocked user"
      : "Successfully unblocked user",
    data: {
      userId,
      blockedUserId,
      isBlock: result.isBlock,
    },
  };
};


// block user list

const getBlockedUsersIntoDb = async (userId: string) => {
  const blockedUsers = await followups
    .find({
      userId,
      isBlock: true,
      isDelete: false,
    })
    .sort({ createdAt: -1 })
    .populate("followupId", "name photo email")
    .select("followupId createdAt");

  return {
    status: true,
    message: "Blocked users fetched successfully",
    data: blockedUsers,
  };
};


const findBySpecificFollowingUserIntoDb=async(followupId:string)=>{

  try{


      return await followups.findOne({followupId}).select("isBlock");


  }
  catch (error) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "Follower block/unblock operation failed"
    );
  }

   
}




const FollowUpServices = {
  recordedFollowUpIntoDb,
  findByEventSocialFeedFolloweWiseFilteringIntoDb,
  findMyFollowedListIntoDb,
  myFollowingAndFollowerListIntoDb,
  sendInvitasationNotificationIntoDb,
   findMyFollowingListIntoDb,
   deleteFollowerListIntoDb,
   isBlockFollowerAndFollowingIntoDb,
   findBySpecificFollowingUserIntoDb,
   getBlockedUsersIntoDb

};

export default FollowUpServices;


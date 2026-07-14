import status from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import chatrooms, { chatroomusers } from "./event_chatroom.model";
import AppError from "../../errors/AppError";
import { ChatRoomUseResponse, TChatRoom } from "./event_chatroom.interface";
import mongoose, { Types } from "mongoose";
import joingroups, { joinusers } from "../join_event_group/join_event_group.model";


const findByMyEventChatRoomIntoDb = async (
  hostId: string,
  query: Record<string, unknown>
) => {
  try {
    const baseQuery = chatrooms
      .find({ hostId, isDelete: false })
      .select("-isDelete -createdAt -updatedAt")
      .populate([
        {
          path: "eventId",
          select: "photo",
        },
      ]);

    const allMyEventChatRoomQuery = new QueryBuilder(baseQuery, query)
      .search([])
      .filter()
      .sort()
      .paginate()
      .fields();

    const chatroomsData = await allMyEventChatRoomQuery.modelQuery;
    const meta = await allMyEventChatRoomQuery.countTotal();

   

    // 🔥 NORMALIZE RESPONSE HERE
    const formattedChatRooms = chatroomsData.map((room: any) => {
      const hasEvent = room.eventId && room.eventId._id;

      return {
        ...room.toObject(),

        chatroomId: hasEvent ? room.eventId._id : room._id,

        photo: hasEvent
          ? room.eventId.photo
          : room.photo ?? null,

        eventId: hasEvent ? room.eventId._id : null, // optional (cleaner)
      };
    });

    return {
      meta,
      all_event_chatroom: formattedChatRooms,
    };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "findByMyEventChatRoomIntoDb server unavailable",
      error
    );
  }
};



interface PopulatedEvent {
  _id: Types.ObjectId;
  photo?: string;
}

const findBySpecificMyChatRoomIntoDb = async (id: string) => {
  try {
    // 1️⃣ Try find by chatroom _id
    let room = await chatrooms
      .findOne({ _id: id, isDelete: false })
      .select("-isDelete -createdAt -updatedAt -hostId")
      .populate("eventId", "photo");

    // 2️⃣ If not found, try find by eventId
    if (!room) {
      room = await chatrooms
        .findOne({ eventId: id, isDelete: false })
        .select("-isDelete -createdAt -updatedAt -hostId")
        .populate("eventId", "photo");
    }

    if (!room) {
      throw new AppError(status.NOT_FOUND, "Chatroom not found");
    }

    // ✅ FIX: safely cast populated event
    const event = room.eventId as unknown as PopulatedEvent | null;
    const hasEvent = !!event?._id;

    // 3️⃣ Normalize response
    return {
      ...room.toObject(),
      chatroomId: hasEvent ? event!._id : room._id,
      photo: hasEvent ? event?.photo ?? null : room.photo ?? null,
      eventId: hasEvent ? event!._id : null,
    };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "findBySpecificMyChatRoomIntoDb server unavailable",
      error
    );
  }
};



const updateMyChatRoomIntoDb = async (
  id: string,
  payload: Partial<TChatRoom>
) => {
  try {
    const result = await chatrooms.findByIdAndUpdate(
      id,
      { chatRoomName: payload.chatRoomName },
      { new: true, upsert: true }
    );
    if (!result) {
      throw new AppError(
        status.NOT_FOUND,
        "NOT FOUNDED  CHAT ROOM UPDATE ISSUES"
      );
    }
    return {
      status: true,
      message: "successfully  update",
    };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "updateMyJoinGroupIntoDb server unavailable",
      error
    );
  }
};

const joinChatRoomIntoDb = async (
  userId: string,
  chatRoomId: string
): Promise<ChatRoomUseResponse> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const isExistEvent: any = await chatrooms
      .findOne({ _id: chatRoomId, isDelete: false })
      .select("eventId")
      .session(session);

    if (!isExistEvent) {
      throw new AppError(status.NOT_FOUND, "Chat room details not found");
    }

    const isAlreadyJoined = await chatroomusers
      .findOne({
        eventChatRoomId: chatRoomId,
        eventId: isExistEvent.eventId,
        userId,
        isDelete: false,
      })
      .select("_id")
      .session(session);

    if (isAlreadyJoined) {
      await session.abortTransaction();
      return {
        status: false,
        message: "Already joined",
      };
    }

    await chatroomusers.create(
      [
        {
          eventChatRoomId: chatRoomId,
          eventId: isExistEvent?.eventId,
          userId,
          isDelete: false,
        },
      ],
      { session }
    );

    await chatrooms.findByIdAndUpdate(
      chatRoomId,
      { $inc: { totalMember: 1 } },
      { new: true, session }
    );

    await session.commitTransaction();

    return {
      status: true,
      message: "Successfully joined Event ChatRoom",
    };
  } catch (error: any) {
    await session.abortTransaction();
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "joinChatRoomIntoDb server unavailable, transaction rolled back",
      error
    );
  } finally {
    session.endSession();
  }
};

const deleteEventChatRoomIntoDb = async (
  userId: string,
  chatRoomUsersId: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const joinRecord: any = await chatroomusers
      .findOne({
        _id: chatRoomUsersId,
        userId,
        isDelete: false,
      })
      .session(session)
      .lean();

    if (!joinRecord) {
      await session.abortTransaction();
      session.endSession();
      return {
        status: false,
        message: "Join record not found or already removed",
      };
    }

    await chatroomusers.findByIdAndUpdate(
      chatRoomUsersId,
      { isDelete: true },
      { session }
    );

    const updatedChatRoom = await chatrooms.findOneAndUpdate(
      {
        _id: joinRecord.eventChatRoomId,
        isDelete: false,
        totalMember: { $gt: 0 },
      },
      { $inc: { totalMember: -1 } },
      { new: true, session }
    );

    if (!updatedChatRoom) {
      throw new AppError(
        status.NOT_FOUND,
        "Chat room not found or already at 0 members"
      );
    }

    await session.commitTransaction();
    session.endSession();

    return {
      status: true,
      message: "Successfully left the chat room",
      userId,
      chatRoomUsersId,
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "deleteEventChatRoomIntoDb server unavailable, transaction rolled back",
      error
    );
  }
};


const findByEventChatRoomIntoDb = async (
  query: Record<string, unknown>
) => {
  try {
    const baseQuery = chatrooms
      .find({  })
      .select("-isDelete -createdAt -updatedAt")
      .populate([
        {
          path: "eventId",
          select: "photo",
        },
      ]);

    const allMyEventChatRoomQuery = new QueryBuilder(baseQuery, query)
      .search([])
      .filter()
      .sort()
      .paginate()
      .fields();

    const all_event_chatroom = await allMyEventChatRoomQuery.modelQuery;
    const meta = await allMyEventChatRoomQuery.countTotal();

    return { meta, all_event_chatroom };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "findByMyEventChatRoomIntoDb server unavailable",
      error
    );
  }
};


const findByAllEventChatRoomIntoDb = async (
  query: Record<string, unknown>
) => {
  try {
    const baseQuery = chatrooms
      .find({})
      .select("-isDelete  -updatedAt")
      .populate([
        {
          path: "eventId",
          select: "photo audience_settings.max_capacity event_title createdAt date starting_time ending_time audience_settings.price hostId event_category",
           populate: {
            path: "hostId", 
            select: "name email phoneNumber", 
          },
        },
      ]);

    const allMyEventChatRoomQuery = new QueryBuilder(baseQuery, query)
      .search(['chatRoomName'])
      .filter()
      .sort()
      .paginate()
      .fields();

    const all_event_chatroom = await allMyEventChatRoomQuery.modelQuery;
    const meta = await allMyEventChatRoomQuery.countTotal();

    return { meta, all_event_chatroom };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "find By All Event ChatRoom IntoDb server unavailable",
      error
    );
  }
};



const thrillseekersEventChatRoomIntoDb = async (
  userId: string,
  query: Record<string, unknown>
) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  // -----------------------------
  // Joined groups query
  // -----------------------------
  const myCharRoomQuery = new QueryBuilder(
    joinusers.find({ userId }).populate([
      {
        path: "eventGroupId",
        select: "groupName totalMember photo hostId eventId",
        
      },
    ]),
    query
  )
    .search([])
    .filter()
    .sort()
    .paginate()
    .fields();

  const rawChatrooms = await myCharRoomQuery.modelQuery;
  const meta = await myCharRoomQuery.countTotal();

  

  // -----------------------------
  // My created groups
  // -----------------------------
  const myCreateGroup = await joingroups.find({ hostId: userId }).lean();

  

  // -----------------------------
  // Normalize JOINED chatrooms
  // -----------------------------
  const joinedChatrooms = rawChatrooms?.map((item: any) => {
    const group = item.eventGroupId;

    console.log(item?.eventGroupId?._id, "item");

  

    return {
      _id: item._id,
      groupName: group?.groupName ?? null,
      totalMember: group?.totalMember ?? 0,
      photo: group?.photo ?? null,
      hostId: group?.hostId ?? null,
      isJoin: item.isJoin,
      isDelete: item.isDelete,
      createdAt: item.createdAt,
      groupId: group?._id ?? null,
      chatroomId: item?.eventGroupId?.eventId ?? null,
      source: "joined",
    };
  });

  // console.log(myCreateGroup, "myCreateGroup");

  // -----------------------------
  // Normalize CREATED chatrooms
  // -----------------------------
  const createdChatrooms = myCreateGroup.map((g: any) => ({
    _id: g._id,
    groupName: g.groupName,
    totalMember: g.totalMember,
    photo: g.photo,
    hostId: g.hostId,
    isJoin: true,
    isDelete: g.isDelete,
    createdAt: g.createdAt,
    groupId: g._id,
    chatroomId: g._id,
    source: "created",
  }));

  
  const chatrooms = [...createdChatrooms, ...joinedChatrooms];

  return {
    meta,
    chatrooms,
  };
};










const EventChatRoomServices = {
  findByMyEventChatRoomIntoDb,
  findBySpecificMyChatRoomIntoDb,
  updateMyChatRoomIntoDb,
  joinChatRoomIntoDb,
  deleteEventChatRoomIntoDb,
  findByEventChatRoomIntoDb,
  findByAllEventChatRoomIntoDb,
  thrillseekersEventChatRoomIntoDb
};

export default EventChatRoomServices;

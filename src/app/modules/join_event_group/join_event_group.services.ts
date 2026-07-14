import status from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import joingroups, { joinusers } from "./join_event_group.model";
import AppError from "../../errors/AppError";
import {
  JoinGroupResponse,
  JoinUseResponse,
  TJoinGroup,
} from "./join_event_group.interface";
import mongoose from "mongoose";
import notifications from "../notification/notification.model";
import NotificationServices from "../notification/notification.services";
import chatrooms from "../event_chatroom/event_chatroom.model";
import { RequestWithFile } from "./join_event_group.constant";
// import AggregationQueryBuilder from "../../builder/AggregationQueryBuilder";


const findByMyJoinEventGroupIntoDb = async (
  hostId: string,
  query: Record<string, unknown>
) => {
  try {
    const baseQuery = joingroups
      .find({ hostId })
      .select("-isDelete -createdAt -updatedAt")
      .populate([
        {
          path: "eventId",
          select: "photo",
        },
      ])
      .lean(); // ✅ important

    const allMyJoinEventQuery = new QueryBuilder(baseQuery, query)
      .search([])
      .filter()
      .sort()
      .paginate()
      .fields();

    const groups = await allMyJoinEventQuery.modelQuery;
    const meta = await allMyJoinEventQuery.countTotal();

    // 🔥 NORMALIZE RESPONSE
    const formattedGroups = groups.map((group: any) => {
      const hasEvent = group.eventId && group.eventId._id;

      return {
        ...group,

        groupId: hasEvent ? group.eventId._id : group._id,

        photo: hasEvent
          ? group.eventId.photo ?? null
          : group.photo ?? null,

        eventId: hasEvent ? group.eventId._id : null,
      };
    });

    return {
      meta,
      all_my_join_event: formattedGroups,
    };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "findByMyJoinEventGroupIntoDb server unavailable",
      error
    );
  }
};



import { Types } from "mongoose";
import { join } from "path";

interface PopulatedEvent {
  _id: Types.ObjectId;
  photo?: string;
}

const findBySpecificMyJoinGroupIntoDb = async (id: string) => {
  try {
    // 1️⃣ Try find by join group _id
    let group = await joingroups
      .findOne({ _id: id, isDelete: false })
      .select("-isDelete -createdAt -updatedAt -hostId")
      .populate("eventId", "photo")
      .lean();

    // 2️⃣ If not found, try find by eventId
    if (!group) {
      group = await joingroups
        .findOne({ eventId: id, isDelete: false })
        .select("-isDelete -createdAt -updatedAt -hostId")
        .populate("eventId", "photo")
        .lean();
    }

    if (!group) {
      throw new AppError(status.NOT_FOUND, "Join group not found");
    }

    // ✅ FIX: cast populated event
    const event = group.eventId as unknown as PopulatedEvent | null;
    const hasEvent = !!event?._id;

    // 3️⃣ Normalize response
    return {
      ...group,
      groupId: hasEvent ? event!._id : group._id,
      photo: hasEvent ? event?.photo ?? null : (group as any).photo ?? null,
      eventId: hasEvent ? event!._id : null,
    };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "findBySpecificMyJoinGroupIntoDb server unavailable",
      error
    );
  }
};


const updateMyJoinGroupIntoDb = async (
  id: string,
  payload: Partial<TJoinGroup>
): Promise<JoinGroupResponse> => {
  try {
    const result = await joingroups.findByIdAndUpdate(
      id,
      { groupName: payload.groupName },
      { new: true, upsert: true }
    );
    if (!result) {
      throw new AppError(
        status.NOT_FOUND,
        "NOT FOUNDED JOIN  GROUP UPDATE ISSUES"
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

const joinGroupIntoDb = async (
  userId: string,
  groupId: string
): Promise<JoinUseResponse> => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const group = await joingroups
      .findById(groupId)
      .select("_id")
      .session(session);

    if (!group) {
      throw new AppError(status.NOT_FOUND, "Group not found");
    }

 

    const alreadyJoined = await joinusers
      .findOne({ eventGroupId: groupId, userId })
      .select("_id")
      .session(session);

    if (alreadyJoined) {
      await session.abortTransaction();
      session.endSession();

      return {
        status: false,
        message: "This user already joined this group",
      };
    }

    await joinusers.create(
      [{ userId, eventGroupId: groupId, isJoin: true }],
      { session }
    );

    // 4️⃣ Atomic increment (NO race condition)
    await joingroups.findByIdAndUpdate(
      groupId,
      { $inc: { totalMember: 1 } },
      { session }
    );

    // 5️⃣ Commit transaction
    await session.commitTransaction();
    session.endSession();

    return {
      status: true,
      message: "Successfully joined the event group",
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "joinGroupIntoDb transaction failed, rolled back",
      error
    );
  }
};

const deleteJoinEventGroupIntoDb = async (
  userId: string,
  joinUsersId: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const joinRecord: any = await joinusers
      .findOne({
        _id: joinUsersId,
        userId
        
      })
      .lean()
      .session(session);


    if (!joinRecord) {
      await session.abortTransaction();
      session.endSession();
      return {
        status: false,
        message: "Join record not found or already removed",
      };
    }

    await joinusers.findByIdAndDelete(joinUsersId, { session });

    const updatedGroup = await joingroups.findOneAndUpdate(
      { eventId: joinRecord.eventId, isDelete: false, totalMember: { $gt: 0 } },
      { $inc: { totalMember: -1 } },
      { new: true, session }
    );

    if (!updatedGroup) {
      throw new AppError(
        status.NOT_FOUND,
        "some issues by the event join group delete   section"
      );
    }

    await session.commitTransaction();
    session.endSession();

    return {
      status: true,
      message: "Successfully left the event group",
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "deleteJoinEventGroupIntoDb server unavailable, transaction rolled back",
      error
    );
  }
};




const findByUserJoinEventGroupIntoDb = async (
  query: Record<string, unknown>
) => {
  try {
    const baseQuery = joingroups
      .find({})
      .select("-isDelete -updatedAt") // we can include isJoin
      .populate([
        {
          path: "eventId",
          select: "photo", 
        },
      ])
      .lean();

    const allMyJoinEventQuery = new QueryBuilder(baseQuery, query)
      .search([])
      .filter()
      .sort()
      .paginate()
      .fields();

    let all_my_join_event = await allMyJoinEventQuery.modelQuery;

 

    const meta = await allMyJoinEventQuery.countTotal();

    return { meta, all_my_join_event };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "findByMyJoinEventGroupIntoDb server unavailable",
      error
    );
  }
};



const findByAllJoinEventGroupIntoDb = async (
  query: Record<string, unknown>
) => {
  try {
    const baseQuery = joingroups
      .find({ })
      .select("-isDelete -createdAt -updatedAt")
      .populate([
        {
          path: "eventId",
          select: "photo audience_settings.max_capacity event_title createdAt date starting_time ending_time audience_settings.price hostId event_category",
           populate: {
            path: "hostId", 
            select: "name email phoneNumber", 
          },
        },
      ])
      .lean();

    const allMyJoinEventQuery = new QueryBuilder(baseQuery, query)
      .search(["groupName"])
      .filter()
      .sort()
      .paginate()
      .fields();

    const all_my_join_event = await allMyJoinEventQuery.modelQuery;
    const meta = await allMyJoinEventQuery.countTotal();

    return { meta, all_my_join_event };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "find By All Join Event Group IntoDb server unavailable",
      error
    );
  }
};


const find_my_join_group_IntoDb = async (
  query: Record<string, unknown>,
  userId: string
) => {
  try {
    // -----------------------------
    // My created groups
    // -----------------------------
    const my_created_groups = await joingroups
      .find({ hostId: userId, chatRoomId: { $exists: true, $ne: null } })
      .populate([
        {
          path: "chatRoomId",
          select: "chatRoomName totalMember",
        },
      ])
      .lean();

    // -----------------------------
    // My joined groups base query
    // -----------------------------
    const baseQuery = joinusers
      .find({ userId })
      .select("-updatedAt -userId -eventId")
      .populate([
        {
          path: "eventGroupId",
          select: "groupName totalMember photo eventId hostId",
          populate: {
            path: "eventId",
            select: "photo",
          },
        },
      ])
      .lean();

    const allMyJoinEventQuery = new QueryBuilder(baseQuery, query)
      .search([])
      .filter()
      .sort()
      .paginate()
      .fields();

    const joinedGroupsRaw = await allMyJoinEventQuery.modelQuery;
    const meta = await allMyJoinEventQuery.countTotal();

    // -----------------------------
    // Normalize CREATED groups
    // -----------------------------
    const created = my_created_groups.map((g: any) => ({
      _id: g._id,
      eventGroupId: {
        _id: g._id,
        hostId: g.hostId,
        groupName: g.groupName,
        totalMember: g.totalMember,
        photo: g.photo,
      },
      isJoin: true,
      isDelete: g.isDelete,
      createdAt: g.createdAt,
      groupId: g._id,
      source: "created",
    }));

    // -----------------------------
    // Normalize JOINED groups (SAFE)
    // -----------------------------
    const joined = joinedGroupsRaw
      .filter((j: any) => j?.eventGroupId) // ❗ broken/null data remove
      .map((j: any) => {
        const eventGroup = { ...j.eventGroupId };

        const eventIdObj = eventGroup?.eventId || null;
        const hasEvent = eventIdObj?._id || null;

        // override photo if event exists
        if (hasEvent && eventIdObj?.photo) {
          eventGroup.photo = eventIdObj.photo;
        }

        // remove nested eventId safely
        delete eventGroup.eventId;

        return {
          _id: j._id,
          eventGroupId: eventGroup,
          isJoin: j.isJoin,
          isDelete: j.isDelete,
          createdAt: j.createdAt,

          // ✅ SAFE ACCESS (no crash)
          groupId: hasEvent
            ? eventIdObj?._id
            : eventGroup?._id,

          source: "joined",
        };
      });

    // -----------------------------
    // Final response
    // -----------------------------
    return {
      meta,
      groups: [...created, ...joined],
    };
  } catch (error: any) {
    console.error("find_my_join_group_IntoDb error:", error);

    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "find my join group IntoDb server unavailable",
      error
    );
  }
};






const additionallyCreateNewGroupIntoDb = async (
  payload: Partial<TJoinGroup>,
  userId: string,
  file?: Express.Multer.File
) => {
  if (!payload.groupName) {
    throw new AppError(status.BAD_REQUEST, "Group name is required");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // -----------------------
    // Check duplicate group name (case-insensitive)
    // -----------------------
    const existingGroup = await joingroups.findOne(
      {
        groupName: {
          $regex: `^${payload.groupName}$`,
          $options: "i",
        },
       
      }
    ).session(session);

    if (existingGroup) {
      throw new AppError(
        status.CONFLICT,
        "Group name already exists. Please choose another name."
      );
    }

    // -----------------------
    // Check group limit
    // -----------------------
    const activeGroupCount = await joingroups.countDocuments({
      hostId: userId,
      chatRoomId: { $exists: true, $ne: null },
      eventId: null,
    }).session(session);

    const MAX_GROUP_LIMIT = 5;

    if (activeGroupCount >= MAX_GROUP_LIMIT) {
      throw new AppError(
        status.FORBIDDEN,
        "Your group limit has been reached. Please delete a group to create a new one."
      );
    }

    const photo = file?.path?.replace(/\\/g, "/") ?? null;

    // -----------------------
    // Create Chat Room
    // -----------------------
    const [chatRoom] = await chatrooms.create(
      [
        {
          chatRoomName: payload.groupName,
          hostId: userId,
          photo,
        },
      ],
      { session }
    );

    if (!chatRoom?._id) {
      throw new AppError(
        status.INTERNAL_SERVER_ERROR,
        "Failed to create chat room"
      );
    }

    // -----------------------
    // Create Join Group
    // -----------------------
    const [joinGroup] = await joingroups.create(
      [
        {
          groupName: payload.groupName,
          hostId: userId,
          chatRoomId: chatRoom._id,
          photo,
        },
      ],
      { session }
    );

    if (!joinGroup?._id) {
      throw new AppError(
        status.INTERNAL_SERVER_ERROR,
        "Failed to create join group"
      );
    }

    // -----------------------
    // Insert group users safely
    // -----------------------
    const userList = Array.isArray(payload.userList)
      ? [...new Set(payload.userList)] // remove duplicates
      : [];

    if (userList.length > 0) {
      const joinUserDocs = userList.map((user) => ({
        eventGroupId: joinGroup._id,
        userId: user,
      }));

      await joinusers.insertMany(joinUserDocs, { session });
    }

    // -----------------------
    // Update total members
    // -----------------------
    await joingroups.findByIdAndUpdate(
      joinGroup._id,
      { totalMember: userList.length },
      { new: true, session }
    );

    // -----------------------
    // Commit Transaction
    // -----------------------
    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      message: "Group created successfully",
      data: {
        groupId: joinGroup._id,
        chatRoomId: chatRoom._id,
        photo,
      },
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    console.error("Group creation failed:", error);

    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      error?.message || "Group creation failed"
    );
  }
};









const deleteAdditionalGroupIntoDb = async (
  groupId: string,
  userId: string
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // 1️⃣ Validate ownership & fetch chatRoomId (single query)
    const group = await joingroups.findOne(
      {
        _id: groupId,
        hostId: userId,
        chatRoomId: { $exists: true, $ne: null },
      },
      { chatRoomId: 1 },
      { session }
    );

    if (!group) {
      throw new AppError(
        status.NOT_FOUND,
        "Group not found or you are not authorized"
      );
    };

// 3️⃣ Hard delete chat room
    const chatRoomDeleted = await chatrooms.findByIdAndDelete(
      group.chatRoomId,
      { session }
    );

    if (!chatRoomDeleted) {
      throw new AppError(
        status.NOT_FOUND,
        "Associated chat room not found"
      );
    }

    await joingroups.findByIdAndDelete(groupId, { session });

    await session.commitTransaction();
    session.endSession();

    return {
      status: true,
      message: "Group permanently deleted",
    };
  } catch (error: any) {
    // 🔁 Rollback on failure
    await session.abortTransaction();
    session.endSession();

    throw new AppError(
      error.statusCode || status.INTERNAL_SERVER_ERROR,
      error.message || "Hard delete failed"
    );
  }
};

const additionalGroupImageUploadIntoDb = async (
  req: RequestWithFile,
  groupId: string,
  userId: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const file = req.file;

    if (!file) {
      throw new AppError(status.BAD_REQUEST, "Image file is required");
    }

    const photo = file.path.replace(/\\/g, "/");

    // 1️⃣ Check group existence
    const isGroupExist = await joingroups
      .findOne(
        { _id: groupId, hostId: userId },
        { chatRoomId: 1 }
      )
      .session(session);

    if (!isGroupExist) {
      throw new AppError(status.NOT_FOUND, "Group not found");
    }

    // 2️⃣ Update group photo
    const groupResult = await joingroups.findOneAndUpdate(
      { _id: groupId, hostId: userId },
      { $set: { photo } },
      { new: true, session }
    );

    if (!groupResult) {
      throw new AppError(
        status.NOT_ACCEPTABLE,
        "Failed to update group photo"
      );
    }

    // 3️⃣ Update chatroom photo
    const chatroomResult = await chatrooms.findOneAndUpdate(
      { _id: isGroupExist.chatRoomId },
      { $set: { photo } },
      { new: true, session }
    );

    if (!chatroomResult) {
      throw new AppError(
        status.NOT_ACCEPTABLE,
        "Failed to update chatroom photo"
      );
    }

    // ✅ Commit transaction
    await session.commitTransaction();
    session.endSession();

    return {
      status: true,
      message: "Successfully uploaded group image",
    };
  } catch (error: any) {
    // 🔄 Rollback
    await session.abortTransaction();
    session.endSession();

    throw new AppError(
      error.statusCode || status.INTERNAL_SERVER_ERROR,
      error.message || "Group image upload failed"
    );
  }
};









const findBySpecificJoinEventGroupIntoDb = async (
  eventId: string,
  userId: string
) => {
  try {
    if (!Types.ObjectId.isValid(eventId)) {
      throw new AppError(status.BAD_REQUEST, "Invalid event id");
    }

    const data = await joingroups.aggregate([
      // 1️⃣ Match group by eventId
      {
        $match: {
          eventId: new Types.ObjectId(eventId),
        },
      },

      // 2️⃣ Lookup event info
      {
        $lookup: {
          from: "events",
          localField: "eventId",
          foreignField: "_id",
          as: "event",
        },
      },
      { $unwind: "$event" },

      // 3️⃣ Lookup join status
      {
        $lookup: {
          from: "joinusers",
          let: { groupId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$eventGroupId", "$$groupId"] },
                    { $eq: ["$userId", new Types.ObjectId(userId)] },
                    { $eq: ["$isJoin", true] },
                  ],
                },
              },
            },
            { $project: { _id: 1 } },
          ],
          as: "joinedUser",
        },
      },

      // 4️⃣ Add isJoin field
      {
        $addFields: {
          isJoin: {
            $gt: [{ $size: "$joinedUser" }, 0],
          },
        },
      },

      // 5️⃣ Project only the required fields (strict)
      {
        $project: {
          _id: 1,
          hostId: 1,
          groupName: 1,
          totalMember: 1,
          chatRoomId: 1,
          photo: 1,
          __v: 1,
          isJoin: 1,
          eventId: {
            _id: "$event._id",
            event_title: "$event.event_title",
            photo: "$event.photo",
          },
        },
      },

      { $limit: 1 }, // safety: only 1 group
    ]);

    if (!data.length) {
      throw new AppError(status.NOT_FOUND, "Group not found");
    }

    // ✅ Wrap output exactly as you expect
    return  data[0]
  } catch (error: any) {
    throw new AppError(
      error.statusCode || status.INTERNAL_SERVER_ERROR,
      error.message || "Failed to fetch event group"
    );
  }
};











const JoinEventGroupServices = {
  findByMyJoinEventGroupIntoDb,
  findBySpecificMyJoinGroupIntoDb,
  updateMyJoinGroupIntoDb,
  joinGroupIntoDb,
  deleteJoinEventGroupIntoDb,
   findByUserJoinEventGroupIntoDb,
   findByAllJoinEventGroupIntoDb,
   find_my_join_group_IntoDb,
   additionallyCreateNewGroupIntoDb,
   deleteAdditionalGroupIntoDb,
   additionalGroupImageUploadIntoDb,
   findBySpecificJoinEventGroupIntoDb
};




export default JoinEventGroupServices;

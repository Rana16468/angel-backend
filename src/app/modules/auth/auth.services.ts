import mongoose from "mongoose";
import users from "../user/user.model";
import { USER_ACCESSIBILITY, USER_ROLE } from "../user/user.constant";
import httpStatus from "http-status";
import fs from "fs";
import { user_search_filed } from "./auth.constant";
import AppError from "../../errors/AppError";
import { jwtHelpers } from "../../helper/jwtHelpers";
import config from "../../config";
import { ProfileUpdateResponse, RequestWithFile } from "./auth.interface";
import QueryBuilder from "../../builder/QueryBuilder";
import events from "../event/event.model";
import { TUser } from "../user/user.interface";
import path from "path";
import { loveemojimemoriesevents, uploadmemorieseventsnts } from "../upload_memories_event/upload_memories_event.model";
import socialfeeds from "../social_feed/social_feed.model";
import socialfeedreports from "../socialfeedreport/socialfeedreport.model";
import reacteventposts, { commanteventposts, liveeventcomments, shareeventcomments } from "../react_event_post/react_event_post.model";
import { reportlikes } from "../report/report.model";
import replyeventposts from "../event_replies_comment/event_replies_comment.model";
import ratings from "../rating/rating.model";
import pointsystems from "../pointsystem/pointsystem.model";
import paymentgateways from "../payment_gateway/payment_gateway.model";
import notifications from "../notification/notification.model";
import messages from "../message/message.model";
import { joinusers } from "../join_event_group/join_event_group.model";
import followups from "../followup/followup.model";
import favoriteevents from "../favorite_event/favorite_event.model";
import eventposts from "../event_post/event_post.model";
import conversations from "../conversation/conversation.model";
import chatrooms, { chatroomusers } from "../event_chatroom/event_chatroom.model";

const loginUserIntoDb = async (payload: {
  email: string;
  password: string;
  fcm?: string;
}) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const isUserExist = await users.findOne(
      {
        $and: [
          { email: payload.email },
          { isVerify: true },
          { status: USER_ACCESSIBILITY.isProgress },
          { isDelete: false },
        ],
      },
      { password: 1, _id: 1, isVerify: 1, email: 1, role: 1 },
      { session }
    );

    if (!isUserExist) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found", "");
    }

    const checkedFcm = await users.findOneAndUpdate(
      { email: payload.email },
      {
        $set: {
          fcm: payload?.fcm,
        },
      },
      { new: true, upsert: true, session }
    );

    if (!checkedFcm) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "issues by the fcm token updatation",
        ""
      );
    }

    if (
      !(await users.isPasswordMatched(payload?.password, isUserExist.password))
    ) {
      throw new AppError(httpStatus.FORBIDDEN, "This Password Not Matched", "");
    }

    const jwtPayload = {
      id: isUserExist.id,
      role: isUserExist.role,
      email: isUserExist.email,
    };

    let accessToken: string | null = null;
    let refreshToken: string | null = null;

    if (isUserExist.isVerify) {
      accessToken = jwtHelpers.generateToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.expires_in as string
      );

      refreshToken = jwtHelpers.generateToken(
        jwtPayload,
        config.jwt_refresh_secret as string,
        config.refresh_expires_in as string
      );
    }
    await session.commitTransaction();

    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const refreshTokenIntoDb = async (token: string) => {
  try {
    const decoded = jwtHelpers.verifyToken(
      token,
      config.jwt_refresh_secret as string
    );

    const { id } = decoded;

    const isUserExist = await users.findOne(
      {
        $and: [
          { _id: id },
          { isVerify: true },
          { status: USER_ACCESSIBILITY.isProgress },
          { isDelete: false },
        ],
      },
      { _id: 1, isVerify: 1, email: 1 }
    );

    if (!isUserExist) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found", "");
    }
    let accessToken: string | null = null;
    if (isUserExist.isVerify) {
      const jwtPayload = {
        id: isUserExist.id,
        role: isUserExist.role,
        email: isUserExist.email,
      };
      accessToken = jwtHelpers.generateToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.expires_in as string
      );
    }

    return {
      accessToken,
    };
  } catch (error: any) {
    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      "refresh Token generator error",
      error
    );
  }
};

const myprofileIntoDb = async (id: string) => {
  try {
    return await users
      .findById(id)
      .select("name email phoneNumber dateOfBirth photo");
  } catch (error: any) {
    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      "issues by the get my profile section server  error",
      error
    );
  }
};

/**
 * @param req
 * @param id
 * @returns
 */
const changeMyProfileIntoDb = async (
  req: RequestWithFile,
  id: string
): Promise<ProfileUpdateResponse> => {
  try {
    const file = req.file;
    const { name, address, phoneNumber, dateOfBirth } = req.body as {
      name?: string;
      address?: string;
      phoneNumber?: string;
      dateOfBirth?: string;
    };

    const updateData: {
      name?: string;
      photo?: string;
      address?: string;
      phoneNumber?: string;
      dateOfBirth?: string;
    } = {};

    if (name) {
      updateData.name = name;
    }
    if (address) {
      updateData.address = address;
    }
    if (phoneNumber) {
      updateData.phoneNumber = phoneNumber;
    }
    if (dateOfBirth) {
      updateData.dateOfBirth = dateOfBirth;
    }

    if (file) {
      updateData.photo = file?.path?.replace(/\\/g, "/");
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "No data provided for update",
        ""
      );
    }

    const result = await users.findByIdAndUpdate(
      id,
      { $set: { ...updateData } },
      {
        new: true,
        upsert: true,
      }
    );

    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found", "");
    }

    return {
      status: true,
      message: "Successfully updated profile",
    };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      "Profile update failed",
      error.message
    );
  }
};

const findByAllUsersAdminIntoDb = async (query: Record<string, unknown>) => {
  try {
    const allUsersdQuery = new QueryBuilder(
      users.find({ isVerify: true, isDelete: false }).select("name email phoneNumber dateOfBirth photo createdAt status"),
      query
    )
      .search(user_search_filed)
      .filter()
      .sort()
      .paginate()
      .fields();

    const all_users = await allUsersdQuery.modelQuery;
    const meta = await allUsersdQuery.countTotal();

    return { meta, all_users };
  } catch (error: any) {
    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      "find By All User Admin IntoDb server unavailable",
      error
    );
  }
};


const deleteFiles = (filePaths: string[] | string | undefined) => {
  if (!filePaths) return;
  const files = Array.isArray(filePaths) ? filePaths : [filePaths];
  files.forEach((filePath) => {
    try {
      const fullPath = path.resolve(filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`Deleted file: ${fullPath}`);
      }
    } catch (err) {
      console.error(`Failed to delete file ${filePath}:`, err);
    }
  });
};

export const deleteAccountIntoDb = async (id: string) => {
  try {

const user = await users.findOne(
  {
    _id: id,
    isDelete: false,
    isVerify: true,
    status: USER_ACCESSIBILITY.isProgress,
  },
  { photo: 1, role: 1 }
);

if (!user) {
  throw new AppError(httpStatus.NOT_FOUND, "User account not found for deletion.");
}

// Prevent Super Admin deletion
if (user.role === USER_ROLE.superAdmin) {
  throw new AppError(
    httpStatus.FORBIDDEN,
    "Super Admin accounts cannot be deleted."
  );
}

    deleteFiles(user.photo);
    const [socialFeeds, memories, userEvents, userEventPosts, hostEventPosts] = await Promise.all([
      socialfeeds.find({ userId: id }).select("content"),
      uploadmemorieseventsnts.find({ userId: id }).select("photo"),
      events.find({ hostId: id }).select("photo"),
      eventposts.find({ userId: id }).select("content"),
      eventposts.find({ hostId: id }).select("photo"),
    ]);

    // 4️⃣ Delete all images
    socialFeeds.forEach(feed => deleteFiles(feed.content));
    memories.forEach((memory: any) => deleteFiles(memory.photo));
    userEvents.forEach((ev: any) => deleteFiles(ev.photo));
    userEventPosts.forEach((post: { content?: string | string[] }) => deleteFiles(post.content));
    hostEventPosts.forEach((post: any) => deleteFiles(post.photo));

    await Promise.all([
      users.deleteOne({ _id: id }),
      uploadmemorieseventsnts.deleteMany({ userId: id }),
      socialfeeds.deleteMany({ userId: id }),
      socialfeedreports.deleteMany({ userId: id }),
      shareeventcomments.deleteMany({ userId: id }),
      reportlikes.deleteMany({ userId: id }),
      replyeventposts.deleteMany({ userId: id }),
      reacteventposts.deleteMany({ userId: id }),
      ratings.deleteMany({ userId: id }),
      pointsystems.deleteMany({ userId: id }),
      paymentgateways.deleteMany({ userId: id }),
      notifications.deleteMany({ userId: id }),
      messages.deleteMany({ userId: id }),
      loveemojimemoriesevents.deleteMany({ userId: id }),
      liveeventcomments.deleteMany({ userId: id }),
      joinusers.deleteMany({ hostId: id }),
      followups.deleteMany({ $or:[
        {userId: id},{followupId:id}
      ] }),
      favoriteevents.deleteMany({ userId: id }),
      events.deleteMany({ hostId: id }),
      eventposts.deleteMany({ userId: id }),
      eventposts.deleteMany({ hostId: id }),
      conversations.deleteMany({ participants: { $in: [id] } }),
      commanteventposts.deleteMany({ userId: id }),
      chatroomusers.deleteMany({ userId: id }),
      chatrooms.deleteMany({ hostId: id }),
    ]);

    return {
      status:true,
       message:"successfully  delete"
    };

  } catch (error: any) {
    console.error("Delete account error:", error);
    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      "Delete Account Into DB server unavailable",
      error
    );
  }
};


/**
 * @param req
 * @param id
 * @returns
 */

const tagUserIntoDb = async (query: Record<string, unknown>) => {
  try {
    const allUsersdQuery = new QueryBuilder(users.find().select("name photo subname"), query)
      .search(user_search_filed)
      .filter()
      .sort()
      .paginate()
      .fields();

    const all_users = await allUsersdQuery.modelQuery;
    const meta = await allUsersdQuery.countTotal();

    return { meta, all_users };
  } catch (error: any) {
    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      "find By All User Admin IntoDb server unavailable",
      error
    );
  }
};

// dashboard count 

const dashboardCountIntoDb=async()=>{

     try{
          const totalHost=await users.countDocuments({role:USER_ROLE.host});
          const totalThrillseekers=await users.countDocuments({role:USER_ROLE.thrillseekers});
          const totalEvent=await events.countDocuments();
          const totalBlockAccount=await events.countDocuments({role: USER_ROLE.thrillseekers})
          return {
            totalHost, 
             totalThrillseekers,
             totalEvent, 
             totalBlockAccount
          }

     }
     catch (error: any) {
    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      "dashboard Count IntoDb server unavailable",
      error
    );
  }
};

const getUserGrowthIntoDb = async (query: { year?: string }) => {
 try {
    const year = query.year ? parseInt(query.year) : new Date().getFullYear();

    const stats = await users.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01T00:00:00.000Z`),
            $lte: new Date(`${year}-12-31T23:59:59.999Z`),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          month: "$_id.month",
          count: 1,
          _id: 0,
        },
      },
      {
        $group: {
          _id: null,
          data: { $push: { month: "$month", count: "$count" } },
        },
      },

      {
        $project: {
          months: {
            $map: {
              input: { $range: [1, 13] },
              as: "m",
              in: {
                year: year,
                month: "$$m",
                count: {
                  $let: {
                    vars: {
                      matched: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$data",
                              as: "d",
                              cond: { $eq: ["$$d.month", "$$m"] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: { $ifNull: ["$$matched.count", 0] },
                  },
                },
              },
            },
          },
        },
      },
      { $unwind: "$months" },
      { $replaceRoot: { newRoot: "$months" } },
    ]);

    return { monthlyStats: stats };
  } catch (error: any) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to fetch user creation stats",
      error
    );
  }
};


const isBlockAccountIntoDb = async (
  id: string,
  payload: Partial<TUser>
) => {
 

  try {
    const result = await users.findByIdAndUpdate(
      id,
      { status: payload.status },
      { new: true } 
    );

    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    return {
      success: true,
      message: `User successfully ${payload.status}`,
  
    };
  } catch (error: any) {
    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      "Block account operation failed",
      error
    );
  }
};











const AuthServices = {
  loginUserIntoDb,
  refreshTokenIntoDb,
  myprofileIntoDb,
  changeMyProfileIntoDb,
  findByAllUsersAdminIntoDb,
  deleteAccountIntoDb,
  tagUserIntoDb,
  dashboardCountIntoDb,
  getUserGrowthIntoDb,
  isBlockAccountIntoDb
 
};

export default AuthServices;

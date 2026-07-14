import status from "http-status";
import AppError from "../../errors/AppError";
import { RequestWithFile } from "./event_post.constant";
import events from "../event/event.model";
import eventposts from "./event_post.model";
import { EventPostResponse, TEvent_Post } from "./event_post.interface";
import QueryBuilder from "../../builder/QueryBuilder";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import reacteventposts, { commanteventposts } from "../react_event_post/react_event_post.model";
import { loveemojimemoriesevents } from "../upload_memories_event/upload_memories_event.model";
import notifications from "../notification/notification.model";
import replyeventposts from "../event_replies_comment/event_replies_comment.model";


const createEventPostIntoDb = async (
  req: RequestWithFile,
  userId: string
): Promise<EventPostResponse> => {
  try {
    const file = req.file;
    let photo;
    if (file) {
      photo = file?.path?.replace(/\\/g, "/");
    }
    const data = req.body as any;

    // const isExistEvent = await events.exists({
    //   _id: data?.eventId,
    //   isDelete: false,
    // });
    // if (!isExistEvent) {
    //   throw new AppError(
    //     status.NOT_EXTENDED,
    //     "ISSUES BY THE EVENT NOT FOUNDED",
    //     ""
    //   );
    // }

    const eventPostBuilder = new eventposts({
      ...data,
      userId,
      content: photo,
    });
  
    const result = await eventPostBuilder.save();
    if (!result) {
      throw new AppError(
        status.NOT_EXTENDED,
        "issues by the create event post section "
      );
    };


    
    return {
      status: true,
      message: "successfully  create post event",
    };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      error.message || "Failed to create event post into db"
    );
  }
};

const findByAllSpecificEventPostListIntoDb = async (
  query: Record<string, unknown>,
  eventId: string,
  currentUserId: string  
) => {
  try {
    let eventIdFilter: any = eventId;
    if (mongoose.Types.ObjectId.isValid(eventId)) {
      eventIdFilter = new mongoose.Types.ObjectId(eventId);
    }

  
    const allEventPostQuery = new QueryBuilder(
      eventposts
        .find({ eventId: eventIdFilter, isDelete: false })
        .populate([
          {
            path: "userId",
            select: "name photo subname createdAt",
          },
          
        ])
        .select("content caption react comment share followup createdAt"),
      query
    )
      .search([])
      .filter()
      .sort()
      .paginate()
      .fields();

    const all_event_post = await allEventPostQuery.modelQuery;
    const meta = await allEventPostQuery.countTotal();

    if (!all_event_post || all_event_post.length === 0) {
      return { meta: { total: 0 }, all_event_post: [] };
    }


    const postIds = all_event_post?.map((post: any) => post._id);

    const userReacts = await reacteventposts.find({
      eventpostId: { $in: postIds },
      userId: currentUserId,
      isReact: true,
      isDelete: false,
    });

    const reactedPostIds = new Set(
      userReacts.map((react) => react.eventpostId.toString())
    );

    const postsWithIsReact = all_event_post.map((post: any) => ({
      ...post.toObject(),
      isReact: reactedPostIds.has(post._id.toString()),
    }));

    return { meta, all_event_post: postsWithIsReact };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "findByAllSpecificEventPostListIntoDb server unavailable",
      error
    );
  }
};

const deleteEventPostIntoDb = async (
  id: string,
  userId: string
): Promise<EventPostResponse> => {
  try {
    const existingEvent = await eventposts
      .findById(id)
      .select("content userId");

    if (!existingEvent) {
      throw new AppError(status.NOT_FOUND, "Event not found", "");
    }

    
    await Promise.all([
      commanteventposts.deleteMany({ userId }),
      loveemojimemoriesevents.deleteMany({ userId }),
      notifications.deleteMany({ userId }),
      replyeventposts.deleteMany({ userId }),
    ]);

  
    const deleteEvent = await eventposts.findByIdAndDelete(id);
    if (!deleteEvent) {
      throw new AppError(status.NOT_EXTENDED, "Event post delete failed", "");
    }

    if (existingEvent.content && fs.existsSync(existingEvent.content)) {
      fs.unlinkSync(path.resolve(existingEvent.content));
    }

    return {
      status: true,
      message: "Successfully deleted event post and all related data",
    };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "Delete Event Post Into DB failed",
      error
    );
  }
};

const createEventSocialFeedPostIntoDb = async (
  req: RequestWithFile,
  userId: string
): Promise<EventPostResponse> => {
  try {
    const file = req.file;
    const data = req.body as any;

    let photo: string | undefined = undefined;
    if (file) {
      photo = file?.path?.replace(/\\/g, "/"); 
    }

    const eventPostBuilder = new eventposts({
      ...data,
      userId,
      ...(photo && { content: photo }),
    });

    const result = await eventPostBuilder.save();
    if (!result) {
      throw new AppError(
        status.NOT_EXTENDED,
        "Issues in the create event post section"
      );
    }

    return {
      status: true,
      message: "Successfully uploaded event social feed post",
    };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      error.message || "Failed to create event post into DB"
    );
  }
};


const findByEventSocialFeedFilteringIntoDb = async (query: Record<string, unknown>) => {
  try {
    
    const page = Number(query.page) || 1; 
    const limit = Number(query.limit) || 10; 
    const skip = (page - 1) * limit;

    const result = await eventposts.aggregate([
      {
        $match: {
          isDelete: false,
        },
      },
      {
        $lookup: {
          from: "events",
          localField: "eventId",
          foreignField: "_id",
          as: "event",
        },
      },
      {
        $unwind: {
          path: "$event",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
     
      {
        $lookup: {
          from: "users",
          localField: "tag_people",
          foreignField: "_id",
          as: "taggedUsers",
        },
      },
      {
        $project: {
          _id: 1,
          content: 1,
          caption: 1,
          createdAt: 1,
          updatedAt: 1,
          react:1,
          comment:1,
          share:1,
          followup:1,
          "event._id": 1,
          "event.event_title": 1,
          "event.photo": 1,
          "user._id": 1,
          "user.name": 1,
          "user.photo": 1,
          
          // taggedUsers: { _id: 1, name: 1, photo: 1 },
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalCount = await eventposts.countDocuments({ isDelete: false });

    return {
      data: result,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      error.message || "Failed to find By Event Social Feed Filtering Into Db"
    );
  }
};

/*
   _id: 1,
          content: 1,
          caption: 1,
          createdAt: 1,
          updatedAt: 1,
          react:1,
          comment:1,
          share:1,
          followup:1,
          "event._id": 1,
          "event.event_title": 1,
          "event.photo": 1,
          "user._id": 1,
          "user.name": 1,
          "user.photo": 1,

*/

const findBySpecificEventPostIntoDb=async(id:string)=>{

    try{
      
        const result =eventposts
        .findOne({_id:id })
        .populate([
          {
            path: "userId",
            select: "name photo createdAt",
          },
         
        ])
        .select("content caption  createdAt updatedAt react comment share");
        return result

    }
    catch(error:any){
      throw new AppError(status.INTERNAL_SERVER_ERROR,'issues by the specific event post','followup');
    }
}

/*
   _id: 1,
          content: 1,
          caption: 1,
          createdAt: 1,
          updatedAt: 1,
          react:1,
          comment:1,
          share:1,
          followup:1,
          "event._id": 1,
          "event.event_title": 1,
          "event.photo": 1,
          "user._id": 1,
          "user.name": 1,
          "user.photo": 1,

*/


const findMyAllEventPostListIntoDb = async (
  userId: string,
  query: Record<string, unknown>
) => {
  try {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // =========================
    // 1️⃣ MATCH (OWN + TAGGED POSTS)
    // =========================
    const matchStage = {
      $match: {
        isDelete: false,
        $or: [
          { userId: userObjectId },
          { tag_people: userObjectId },
        ],
      },
    };

    const aggregatePipeline = [
      matchStage,

      // =========================
      // 2️⃣ USER INFO (POST OWNER)
      // =========================
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [
            { $project: { name: 1, photo: 1, subname: 1 } },
          ],
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      // =========================
      // 3️⃣ TAGGED USERS INFO 🔥
      // =========================
      {
        $lookup: {
          from: "users",
          localField: "tag_people",
          foreignField: "_id",
          as: "taggedUsers",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1
              },
            },
          ],
        },
      },

      // =========================
      // 4️⃣ REACTION INFO
      // =========================
      {
        $lookup: {
          from: "reacteventposts",
          let: { postId: "$_id", currentUserId: userObjectId },
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
            { $project: { isReact: 1 } },
          ],
          as: "reactInfo",
        },
      },

      // =========================
      // 5️⃣ FOLLOW INFO
      // =========================
      {
        $lookup: {
          from: "followups",
          let: {
            currentUserId: userObjectId,
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

      // =========================
      // 6️⃣ COMPUTED FIELDS
      // =========================
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

          isTagged: {
            $in: [userObjectId, "$tag_people"],
          },
        },
      },

      // =========================
      // 7️⃣ FINAL RESPONSE
      // =========================
      {
        $project: {
          content: 1,
          caption: 1,
          react: 1,
          comment: 1,
          share: 1,

          // 🔥 REPLACED: IDs → FULL USER INFO
          tag_people: "$taggedUsers",

          userId: 1,
          "user.name": 1,
          "user.photo": 1,
          "user.subname": 1,

          isReact: 1,
          isFollowUp: 1,
          isTagged: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },

      // =========================
      // 8️⃣ SORT + PAGINATION
      // =========================
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    // =========================
    // 9️⃣ EXECUTE
    // =========================
    const [all_event_post, total] = await Promise.all([
      eventposts.aggregate(aggregatePipeline as any),
      eventposts.countDocuments({
        isDelete: false,
        $or: [
          { userId: userObjectId },
          { tag_people: userObjectId },
        ],
      }),
    ]);

    return {
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: all_event_post,
    };
  } catch (error: any) {
    console.error("❌ Error:", error);
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Server error while fetching event posts",
      error.message
    );
  }
};









const  completedEventPostMediaFileIntoDb=async(eventId:string, query:Record<string, unknown>)=>{
  try{

     const allEventMediaQuery = new QueryBuilder(
      eventposts
        .find({  eventId, isDelete: false })
        .select("content    createdAt"),
      query
    )
      .search([])
      .filter()
      .sort()
      .paginate()
      .fields();

    const all_event_media = await  allEventMediaQuery.modelQuery;
    const meta = await  allEventMediaQuery.countTotal();
    return {
     
      meta,
      all_event_media
    }


  }
  catch(error:any){
 throw new AppError(status.INTERNAL_SERVER_ERROR,'issues by the find My All Event Post List IntoDb ');
  }
    
}
  

const updateEventPostIntoDb=async(id:string, payload:Partial<TEvent_Post>)=>{

     try{
         const isExistEventPost=await eventposts.exists({_id:id});
         if(!isExistEventPost){
          throw new AppError(status.NOT_FOUND,'not founded event post','');
         };

         const result=await eventposts.findByIdAndUpdate(id,payload,{new:true, upsert:true});
         if(!result){
          throw new AppError(status.NOT_EXTENDED, 'issues by the update event post section','');

         }

      return {
         status:true , message:"successfully recorded"
      }

     }
      catch(error:any){
       throw new AppError(status.INTERNAL_SERVER_ERROR,'issues by the  update Event Post IntoDb ');
  }
}



const eventPostServices = {
  createEventPostIntoDb,
  findByAllSpecificEventPostListIntoDb,
  deleteEventPostIntoDb,
  createEventSocialFeedPostIntoDb,
  findByEventSocialFeedFilteringIntoDb,
   findBySpecificEventPostIntoDb,
   findMyAllEventPostListIntoDb,
   completedEventPostMediaFileIntoDb,
   updateEventPostIntoDb

};

export default eventPostServices;

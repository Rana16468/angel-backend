import status from "http-status";
import AppError from "../../errors/AppError";
import { TCommantEventPost, TLiveEventComment, TReactEventPost, TShareEventComment } from "./react_event_post.interface";
import eventposts from "../event_post/event_post.model";
import reacteventposts, { commanteventposts, liveemojireactions, liveeventcomments, shareeventcomments } from "./react_event_post.model";
import mongoose, { Types } from "mongoose";
import QueryBuilder from "../../builder/QueryBuilder";
import events from "../event/event.model";
import notifications from "../notification/notification.model";
import NotificationServices from "../notification/notification.services";


const recordedReactEventPostIntoDb = async (
  payload: TReactEventPost,
  userId: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {

    const eventPost = await eventposts.findById(payload.eventpostId);
    if (!eventPost) {
      throw new AppError(status.NOT_FOUND, "Event post not found", "");
    }
    const existingReact = await reacteventposts.findOne({
      eventpostId: payload.eventpostId,
      userId,
      isDelete: false
    });

    if (existingReact) {
      await reacteventposts.findByIdAndDelete(existingReact._id, { session });
      await eventposts.findByIdAndUpdate(
        payload.eventpostId,
        { $inc: { react: -1 } },
        { session }
      );
    } else {
      await reacteventposts.create([{
        eventpostId: payload.eventpostId,
        userId: new Types.ObjectId(userId),
        isReact: true,
        isDelete: false
      }], { session });
      
      await eventposts.findByIdAndUpdate(
        payload.eventpostId,
        { $inc: { react: 1 } },
        { session }
      );
    }

    await session.commitTransaction();
    return { success: true, message: "Reaction recorded successfully" };
    
  } catch (error: any) {
    await session.abortTransaction();
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "Service unavailable",
      error
    );
  } finally {
    session.endSession();
  }
};


const recordedEventCommentIntoDb = async (
  payload: Partial<TCommantEventPost>,
  userId: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // -----------------------------
    // 1️⃣ Check if event post exists
    // -----------------------------
    const isExistEventPost = await eventposts
      .findOne({ _id: payload.eventpostId, isDelete: false })
      .session(session)
      .lean();

    if (!isExistEventPost) {
      throw new AppError(status.NOT_ACCEPTABLE, "Event post not found", "");
    }

    // -----------------------------
    // 2️⃣ Save new comment
    // -----------------------------
    const comment = new commanteventposts({
      ...payload,
      userId,
      createdAt: new Date(),
    });

    const commentResult = await comment.save({ session });
    if (!commentResult) {
      throw new AppError(status.NOT_EXTENDED, "Failed to record comment", "");
    }

    // -----------------------------
    // 3️⃣ Increment comment count in event post
    // -----------------------------
    const eventPostResult = await eventposts.findByIdAndUpdate(
      payload.eventpostId,
      { $inc: { comment: 1 } },
      { new: true, session }
    );

    if (!eventPostResult) {
      throw new AppError(
        status.NOT_EXTENDED,
        "Failed to update event post comment count",
        ""
      );
    }

    // -----------------------------
    // 4️⃣ Create notification
    // -----------------------------
    const notificationData = {
      userId: isExistEventPost.userId, // send to post owner
      title: "Comment on Your Event Post",
      content: "A new comment was added to your event post.",
      groupId: payload.groupId ? new Types.ObjectId(payload.groupId) : null,
      senderId: new Types.ObjectId(userId),
      priority: "medium",
      createdAt: new Date(),
    };

    const savedNotification = await notifications.create(
      [notificationData],
      { session }
    );

    if (!savedNotification || savedNotification.length === 0) {
      throw new AppError(
        status.INTERNAL_SERVER_ERROR,
        "Failed to save notification"
      );
    }

    // -----------------------------
    // 5️⃣ Send push notification
    // -----------------------------
    // const pushResult = await NotificationServices.sendPushNotification(
    //   isExistEventPost.userId.toString(), // send to event owner
    //   {
    //     title: notificationData.title,
    //     content: notificationData.content,
    //   }
    // );

    // if (!pushResult) {
    //   throw new AppError(
    //     status.INTERNAL_SERVER_ERROR,
    //     "Failed to send push notification"
    //   );
    // }

    // -----------------------------
    // 6️⃣ Commit transaction
    // -----------------------------
    await session.commitTransaction();

    return {
      status: true,
      message: "Comment recorded successfully",
    };
  } catch (error: any) {
    await session.abortTransaction();
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      error.message || "Server unavailable while recording event comment"
    );
  } finally {
    session.endSession();
  }
};



const deleteReactEventPostIntoDb = async (userId: string, id: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
   
    const isExistEventPost = await commanteventposts
      .findOne({ _id: id, userId, isDelete: false })
      .select("eventpostId")
      .session(session)
      .lean();

    if (!isExistEventPost) {
      throw new AppError(status.NOT_FOUND, "Event post not found", "");
    }

   
    const eventPostResult = await eventposts.findByIdAndUpdate(
      isExistEventPost.eventpostId,
      { $inc: { comment: -1 } },
      { new: true, upsert: false, session }
    );

    if (!eventPostResult) {
      throw new AppError(
        status.NOT_EXTENDED,
        "Issue while decrementing event post comment count",
        ""
      );
    }


    const deleteEventPost = await commanteventposts.findOneAndDelete(
      { _id: id, userId, isDelete: false },
      { session }
    );

    if (!deleteEventPost) {
      throw new AppError(
        status.NOT_EXTENDED,
        "Issue while deleting comment",
        ""
      );
    }

    
    await session.commitTransaction();
    session.endSession();

    return {
      status: true,
      message: "Successfully deleted",
    };
  } catch (error: any) {
   
    await session.abortTransaction();
    session.endSession();

    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "Server unavailable delete React Event Post IntoDb",
      ""
    );
  }
};


  const recordedLiveEventIntoDb=async(userId:string, payload:Partial<TLiveEventComment>)=>{

      try{

        const isExistEvent=await events.exists({_id:payload.eventId}).lean();
        if(!isExistEvent){
          throw new AppError(status.NOT_FOUND, 'not founded event','');
        };
        const result=await liveeventcomments.create({userId, ...payload});
        if(!result){
          throw new AppError(status.NOT_EXTENDED, 'not extended live event comments','');
        }
        return {
          status:true , 
          message:"successfully recorded"
        }

      }
      catch (error: any) {

    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "Server unavailable recorded Live Event Into Db",
      ""
    );
  }
  };

  const findSpecificByLiveEventIntoDb=async(eventId:string, query: Record<string, unknown> )=>{

     try{

         const allLiveEventQuery = new QueryBuilder(
          liveeventcomments.find({eventId,isDelete:false}).populate([
            { 
            path: "userId",
            select: "name photo",
            }
        ]).select("-eventId -isDelete -updatedAt").lean(),
      query     
    )
      .search([]) 
      .filter()                          
      .sort()                            
      .paginate()                       
      .fields(); 

    const liveEvent = await allLiveEventQuery .modelQuery;
    const meta = await allLiveEventQuery .countTotal();

    return { meta,  liveEvent };

     }
      catch(error:any){
        throw new AppError(status.INTERNAL_SERVER_ERROR, ' issues buy the find Specific By Live Event IntoDb server unavailable')
      }
     
  }




export const deleteLiveCommendIntoDb = async (id: string) => {
  try {
  

    // 1️⃣ Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError(status.BAD_REQUEST, 'Invalid comment ID');
    }

    // 2️⃣ Check if the comment exists (in the correct model)
    const isExist = await liveeventcomments.exists({ _id: id });
    if (!isExist) {
      throw new AppError(status.NOT_FOUND, 'Comment not found', '');
    }

    // 3️⃣ Delete the comment
    const result = await liveeventcomments.findByIdAndDelete(id);
    if (!result) {
      throw new AppError(status.BAD_REQUEST, 'Failed to delete comment', '');
    }

    // 4️⃣ Return success response
    return {
      status: true,
      message: 'Successfully deleted live event comment',
    };
  } catch (error: any) {
    console.error('🔥 deleteLiveCommendIntoDb error:', error);
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      error.message || 'Server unavailable while deleting live comment'
    );
  }
};



const recordLiveEmojiIntoDb = async (
  userId: string,
  payload: { eventId: string; emoji: string }
) => {
  try {
    const isExistEvent = await events.exists({ _id: payload.eventId });
    if (!isExistEvent) {
      throw new AppError(status.NOT_FOUND, "Event not found");
    }

    await liveemojireactions.create({
      userId,
      eventId: payload.eventId,
      emoji: payload.emoji,
    });

    return {
      status: true,
      message: "Emoji reaction saved",
    };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "Server unavailable while recording emoji"
    );
  }
};

const findSpecificByLiveEmojiIntoDb = async (
  eventId: string,
  query: Record<string, unknown>
) => {
  try {
    const emojis = await liveemojireactions
      .find({
        eventId: new Types.ObjectId(eventId),
        isDelete: false,
      })
      .sort({ createdAt: -1 }) 
      .select("emoji -_id"); 

    return {
      meta: {
        total: emojis.length,
      },
      emojis,
    };
  } catch (error: any) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Issue fetching live emoji reactions"
    );
  }
};




 const recordedShareCountIntoDb = async (
  userId: string,
  payload: Partial<TShareEventComment>
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ✅ 1. Check event post existence
    const eventPost = await eventposts.findById(payload.eventpostId).lean();
    if (!eventPost) {
      throw new AppError(status.NOT_FOUND, "Event post not found");
    }


    // ✅ 2. Record the share action
    await shareeventcomments.create(
      [
        {
          eventpostId: payload.eventpostId, // ✅ fixed field name
          userId: new Types.ObjectId(userId),
          share: 1,
          isDelete: false,
        },
      ],
      { session }
    );

    // ✅ 3. Increment event post share count
    await eventposts.findByIdAndUpdate(
      payload.eventpostId,
      { $inc: { share: 1 } },
      { session }
    );

    // ✅ 4. Commit transaction
    await session.commitTransaction();

    return { success: true, message: "Share recorded successfully" };
  } catch (error: any) {
    await session.abortTransaction();
    throw new AppError(status.SERVICE_UNAVAILABLE, "Service unavailable", error);
  } finally {
    session.endSession();
  }
};

// view event media 


const ReactEventPostServices = {
  recordedReactEventPostIntoDb,
   recordedEventCommentIntoDb,
   deleteReactEventPostIntoDb,
   recordedLiveEventIntoDb,
    findSpecificByLiveEventIntoDb,
     deleteLiveCommendIntoDb,
     recordedShareCountIntoDb,
     recordLiveEmojiIntoDb,
     findSpecificByLiveEmojiIntoDb
};

export default ReactEventPostServices;
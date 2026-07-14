import status from "http-status";
import AppError from "../../errors/AppError";
import { TReply } from "./event_replies_comment.interface";
import { commanteventposts } from "../react_event_post/react_event_post.model";
import replyeventposts from "./event_replies_comment.model";
import QueryBuilder from "../../builder/QueryBuilder";



const recordedEventRepliesCommentIntoDb=async(userId:string, payload:Partial<TReply>)=>{

       try{
        const isExistEventRepliesComment=await commanteventposts.exists({ _id:payload.commentEventPostId}).lean();
        if(!isExistEventRepliesComment){
            throw new AppError(status.NOT_EXTENDED, 'comment ways this post not exist')
        };


        const   eventReplierBuilder= new replyeventposts({userId, ...payload});


        const result=await eventReplierBuilder.save();
        if(!result){
            throw new AppError(status.NOT_ACCEPTABLE, 'issues by the  reply event post');
        }


        return {
           status:true , 
           message:"successfully recorded"
        }

       }
       catch (error: any) {
           throw new AppError(
             status.SERVICE_UNAVAILABLE,
             "Server unavailable recorded Event Replies CommentIntoDb",
             ""
           );
         }
};


const findBySpecificEventCommentFilteringIntoDb = async (
  eventpostId: string,
  query: Record<string, unknown>
) => {
  try {
    const baseQuery = commanteventposts
      .find({ eventpostId, isDelete: false }).populate({
            path: "userId",
            select: "name photo",
          })
      .select("-createdAt -updatedAt -isDelete")
      .lean();

    const commentQuery = new QueryBuilder(baseQuery, query)
      .search([])
      .filter()
      .sort()
      .paginate()
      .fields();

    const [all_comment_post, meta] = await Promise.all([
      commentQuery.modelQuery,
      commentQuery.countTotal(),
    ]);

    return { meta, all_comment_post };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "Error while listing event comments",
      ""
    );
  }
};


const findBySpecificCommentReplyFilteringIntoDb=async(commentEventPostId:string, query: Record<string, unknown> )=>{

   try{

     const baseQuery = replyeventposts
      .find({ commentEventPostId, isDelete: false }).populate([
            {
            path: "userId",
            select: "name photo",
          }
        
      ])
      .select("-createdAt -updatedAt -isDelete")
      .lean();

    const commentQuery = new QueryBuilder(baseQuery, query)
      .search([])
      .filter()
      .sort()
      .paginate()
      .fields();

    const [reply, meta] = await Promise.all([
      commentQuery.modelQuery,
      commentQuery.countTotal(),
    ]);
     return { meta, reply };

   }
   catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "Error find By Specific Comment Reply Filtering IntoDb",
      ""
    );
  }

};




const deleteReplyIntoDb=async(id:string, userId:string)=>{

     try{

         const isExistReply=await replyeventposts.exists({_id:id, userId, isDelete:false}).lean();
         if(!isExistReply){
            throw new AppError(status.NOT_FOUND, 'not founded ')
         };
         const result=await replyeventposts.deleteOne({_id:id, userId, isDelete:false});
         if(!result){
            throw new AppError(status.NOT_EXTENDED, 'some issues by the reply delete section ','')
         };
         return {
            status:true,
            message:"successfully delete"
         }

     }
        catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "Error delete Reply IntoDb",
      ""
    );
  }
}





const eventRepliesCommentServices={
     recordedEventRepliesCommentIntoDb,
    findBySpecificEventCommentFilteringIntoDb,
    findBySpecificCommentReplyFilteringIntoDb,
     deleteReplyIntoDb
};

export default eventRepliesCommentServices;
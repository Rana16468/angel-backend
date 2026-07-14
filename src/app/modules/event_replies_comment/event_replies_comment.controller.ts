import { RequestHandler } from "express";
import catchAsync from "../../utils/asyncCatch";
import eventRepliesCommentServices from "./event_replies_comment.services";
import sendResponse from "../../utils/sendResponse";
import status from "http-status";




const recordedEventRepliesComment:RequestHandler=catchAsync(async(req , res)=>{


       const result=await  eventRepliesCommentServices.recordedEventRepliesCommentIntoDb(req.user.id, req.body);
        sendResponse(res, {
           success: true,
           statusCode: status.OK,
           message: "Successfully Recorded Replies",
           data: result,
         });
});

const  findBySpecificEventCommentFiltering:RequestHandler=catchAsync(async(req , res)=>{

      const result=await eventRepliesCommentServices.findBySpecificEventCommentFilteringIntoDb(req.params.eventpostId, req.query);
      sendResponse(res, {
           success: true,
           statusCode: status.OK,
           message: "Successfully Recorded Replies",
           data: result,
         });
});

const findBySpecificCommentReplyFiltering:RequestHandler=catchAsync(async(req , res)=>{


      const result=await eventRepliesCommentServices.findBySpecificCommentReplyFilteringIntoDb(req.params.commentEventPostId, req.query);
      sendResponse(res, {
           success: true,
           statusCode: status.OK,
           message: "Successfully Recorded Replies",
           data: result,
         });
});



const  deleteReply:RequestHandler=catchAsync(async(req , res)=>{


       const result=await eventRepliesCommentServices.deleteReplyIntoDb(req.params.replyId, req.user.id);
       sendResponse(res, {
           success: true,
           statusCode: status.OK,
           message: "Successfully Delete Reply",
           data: result,
         });
})


const eventRepliesCommentController={
    recordedEventRepliesComment,
    findBySpecificEventCommentFiltering,
    findBySpecificCommentReplyFiltering,
    deleteReply
};

export default eventRepliesCommentController;
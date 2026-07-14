import { RequestHandler } from "express";
import catchAsync from "../../utils/asyncCatch";
import ReactEventPostServices from "./react_event_post.services";
import sendResponse from "../../utils/sendResponse";
import status from "http-status";



const recordedReactEventPost:RequestHandler=catchAsync(async(req , res)=>{

      const result=await ReactEventPostServices.recordedReactEventPostIntoDb(req.body, req.user.id);
    sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Recorded React Event Post",
    data: result,
  });

});



const recordedEventComment:RequestHandler=catchAsync(async(req , res)=>{
   


  const result=await ReactEventPostServices.recordedEventCommentIntoDb(req.body, req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Commend Recorded",
    data: result,
  });
});


  const deleteReactEventPost:RequestHandler=catchAsync(async(req , res)=>{

      const result=await ReactEventPostServices.deleteReactEventPostIntoDb(req.user.id,req.params.eventPostId);
        sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Delete React Event Post",
    data: result,
  });
  });


  const   recordedLiveEvent:RequestHandler=catchAsync(async(req , res)=>{

        const result=await ReactEventPostServices.recordedLiveEventIntoDb(req.user.id, req.body);
      sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Recorded Live Command",
    data: result,
  });
  });


  const findSpecificByLiveEvent:RequestHandler=catchAsync(async(req , res)=>{

      const result=await ReactEventPostServices.  findSpecificByLiveEventIntoDb(req.params.eventId, req.query);
          sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Find By Live Event",
    data: result,
  });
  });



  const  deleteLiveCommend:RequestHandler=catchAsync(async(req , res)=>{

      const result=await ReactEventPostServices.deleteLiveCommendIntoDb(req.params.id);
        sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Delete",
    data: result,
  });
  });


const recordLiveEmoji: RequestHandler = catchAsync(async (req, res) => {
  const result = await ReactEventPostServices.recordLiveEmojiIntoDb(
    req.user.id,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Emoji reaction recorded successfully",
    data: result,
  });
});

const findSpecificByLiveEmoji: RequestHandler = catchAsync(async (req, res) => {
  const result =
    await ReactEventPostServices.findSpecificByLiveEmojiIntoDb(
      req.params.eventId,
      req.query
    );

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully fetched live emoji reactions",
    data: result,
  });
});




  const  recordedShareCount:RequestHandler=catchAsync(async(req , res)=>{

        const result=await ReactEventPostServices. recordedShareCountIntoDb(req.user.id, req.body);
                sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Recorded",
    data: result,
  });
  })







const  ReactEventPostController={
    recordedReactEventPost,
     recordedEventComment,
     deleteReactEventPost,
      recordedLiveEvent,
      findSpecificByLiveEvent,
       deleteLiveCommend,
       recordedShareCount,
       findSpecificByLiveEmoji,
       recordLiveEmoji
    
};
export default ReactEventPostController;
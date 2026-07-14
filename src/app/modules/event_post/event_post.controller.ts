import { RequestHandler } from "express";
import catchAsync from "../../utils/asyncCatch";
import eventPostServices from "./event_post.services";
import sendResponse from "../../utils/sendResponse";
import status from "http-status";

const createEventPost: RequestHandler = catchAsync(async (req, res) => {
  const result = await eventPostServices.createEventPostIntoDb(
    req as any,
    req.user.id
  );
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully create post event",
    data: result,
  });
});

const findByAllSpecificEventPostList: RequestHandler = catchAsync(
  async (req, res) => {

    const result = await eventPostServices.findByAllSpecificEventPostListIntoDb(
      req.query,
      req.params.eventId,
      req.user.id
    );
    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Successfully Find By All Specific Event Post",
      data: result,
    });
  }
);


const deleteEventPost:RequestHandler=catchAsync(async(req , res)=>{
  const  result=await eventPostServices.deleteEventPostIntoDb(req.params.id, req.user.id);
    sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Delete",
    data: result,
  });
});


const createEventSocialFeedPost:RequestHandler=catchAsync(async(req , res)=>{

    const result=await eventPostServices.createEventSocialFeedPostIntoDb(req as any,
    req.user.id);
     sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Uplode Yor Event Socail Feed",
    data: result,
  });
});

const findByEventSocialFeedFiltering:RequestHandler=catchAsync(async(req , res)=>{

    const result=await eventPostServices.findByEventSocialFeedFilteringIntoDb(req.query);
     sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Find  By Social Feed",
    data: result,
  });
});

const findBySpecificEventPost:RequestHandler=catchAsync(async(req , res)=>{

   const result=await eventPostServices.findBySpecificEventPostIntoDb(req.params.id);
        sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully  Find By Specific Event",
    data: result,
  });
});

const findMyAllEventPostList:RequestHandler=catchAsync(async(req , res)=>{

     const result=await eventPostServices. findMyAllEventPostListIntoDb(req.params.userId, req.query);
             sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Find My Event Post List",
    data: result,
  });
});


const completedEventPostMediaFile:RequestHandler=catchAsync(async(req , res)=>{

    const result=await eventPostServices.completedEventPostMediaFileIntoDb(req.params.eventId, req.query);
                sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Find By All Media File",
    data: result,
  });
});

 const updateEventPost:RequestHandler=catchAsync(async(req , res)=>{


     const result=await eventPostServices.updateEventPostIntoDb(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Updated Event ",
    data: result,
  });


    
 })

const eventPostController = {
  createEventPost,
  findByAllSpecificEventPostList,
   deleteEventPost,
   createEventSocialFeedPost,
   findByEventSocialFeedFiltering,
   findBySpecificEventPost,
   findMyAllEventPostList,
    completedEventPostMediaFile,
     updateEventPost

};

export default eventPostController;

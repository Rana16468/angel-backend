import { RequestHandler } from "express";
import catchAsync from "../../utils/asyncCatch";
import FavoriteEventServices from "./favorite_event.services";
import sendResponse from "../../utils/sendResponse";
import status from "http-status";



const recordedMyFavoriteEvent:RequestHandler=catchAsync(async(req , res)=>{


     const result=await FavoriteEventServices.recordedMyFavoriteEventIntoDb(req.body, req.user.id);
         sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully  Recorded",
    data: result,
  });
});


const  findByAllMyFavoriteEvent:RequestHandler=catchAsync(async(req , res)=>{

      const result=await FavoriteEventServices.findByAllMyFavoriteEventIntoDb(req.query, req.user.id);
       sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: "Successfully Find By All My Favorite Event",
        data: result,
  });
});


const deleteMyFavoriteEvent:RequestHandler=catchAsync(async(req , res)=>{

      const result=await FavoriteEventServices.deleteMyFavoriteEventIntoDb(req.user.id, req.params.id);
      sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: "Successfully Delete",
        data: result,
  });
});

const  findBySpecificMyFavoriteEvent:RequestHandler=catchAsync(async(req ,  res)=>{

      const result=await FavoriteEventServices.  findBySpecificMyFavoriteEventIntoDb(req.params.id, req.user.id);
      sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: "Successfully Find Favorite Event Details",
        data: result,
  });
})



const recordedMyFavoriteEventController={
     recordedMyFavoriteEvent,
     findByAllMyFavoriteEvent,
     deleteMyFavoriteEvent,
     findBySpecificMyFavoriteEvent
};

export default  recordedMyFavoriteEventController;
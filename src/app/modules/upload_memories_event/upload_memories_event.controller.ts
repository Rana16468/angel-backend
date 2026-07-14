import { RequestHandler } from "express";
import catchAsync from "../../utils/asyncCatch";
import UploadMemoriesEventServices from "./upload_memories_event.services";
import sendResponse from "../../utils/sendResponse";
import status from "http-status";



const  UploadMemoriesEvent:RequestHandler=catchAsync(async(req , res)=>{

      const  result=await UploadMemoriesEventServices.UploadMemoriesEventIntoDb(req as any , req.user.id);

        sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: "Successfully Upload Memories Event",
        data: result,
  });
});


const findMyUploadMemoriesEvent:RequestHandler=catchAsync(async(req , res)=>{

      const result =await UploadMemoriesEventServices.findMyUploadMemoriesEventIntoDb(req.query, req.user.id);
             sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: "Successfully Find My Memories Event",
        data: result,
  });
});


const  LoveEemojiMemoriesEventCount:RequestHandler=catchAsync(async(req , res)=>{

       const  result=await UploadMemoriesEventServices.LoveEemojiMemoriesEventCountIntoDb(req.body, req.user.id);
         sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: "Successfully Recorded",
        data: result,
  });
})


const UploadMemoriesEventController={
     UploadMemoriesEvent,
     findMyUploadMemoriesEvent,
     LoveEemojiMemoriesEventCount
};

export default UploadMemoriesEventController;
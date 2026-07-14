import { RequestHandler } from "express";
import catchAsync from "../../utils/asyncCatch";
import RatingServices from "./rating.services";
import sendResponse from "../../utils/sendResponse";
import status from "http-status";



const recordedRating:RequestHandler=catchAsync(async(req , res)=>{

      const result=await  RatingServices.recordedRatingIntoDb(req.user.id, req.body);
     sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Successfully Find Event Payment List',
    data: result,
    });
});


const  RatingController={
    recordedRating
};

export default RatingController;
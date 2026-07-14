import { RequestHandler } from "express";
import catchAsync from "../../utils/asyncCatch";
import PaymentSystemServices from "./pointsystem.services";
import sendResponse from "../../utils/sendResponse";
import status from "http-status";



const recordedPointSystem:RequestHandler=catchAsync(async(req , res)=>{
       const result=await  PaymentSystemServices.recordedPointSystemIntoDb(req.user.id, req.body);
       sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Successfully Recorded',
    data: result,
  });
});


const  findMyAveragePointSystem:RequestHandler=catchAsync(async(req , res)=>{

       const result=await PaymentSystemServices.findMyAveragePointSystemIntoDb(req.user.id);
              sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Successfully Find My Average Point',
    data: result,
  });
})


const PaymentSystemController={
    recordedPointSystem,
    findMyAveragePointSystem
};

export default PaymentSystemController; 
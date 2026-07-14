import { RequestHandler } from "express";
import catchAsync from "../../utils/asyncCatch";
import SupportServices from "./support.services";
import sendResponse from "../../utils/sendResponse";
import status from "http-status";



const sendSupportMessage : RequestHandler=catchAsync(async(req , res)=>{

      const  result=await  SupportServices.sendSupportMessageIntoDB(req.user.id, req.body);
      sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Recorded",
    data: result,
  });

});


const  findByAllSupportAdmin:RequestHandler=catchAsync(async(req , res)=>{

      const  result=await SupportServices.findByAllSupportAdminIntoDb(req.query);
      sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully  Find By All  Issues",
    data: result,
  });

});


const deleteSupport:RequestHandler=catchAsync(async(req , res)=>{

      const result=await SupportServices.deleteSupportIntoDb(req.params.id);
       sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Delete",
    data: result,
  });   
});


const solveSupportIssues:RequestHandler=catchAsync(async(req , res)=>{

    const result=await SupportServices.solveSupportIssuesIntoDb(req.params.id, req.body);

           sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Updated",
    data: result,
  });   
})





const SupportController ={
     sendSupportMessage,
      findByAllSupportAdmin,
      deleteSupport,
      solveSupportIssues
};

export default SupportController;


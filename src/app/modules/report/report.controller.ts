import { RequestHandler } from "express";
import catchAsync from "../../utils/asyncCatch";
import ReportServices from "./report.services";
import sendResponse from "../../utils/sendResponse";
import status from "http-status";



const  recordedReport:RequestHandler=catchAsync(async(req , res)=>{

       const result=await ReportServices.recordedReportIntoDb(req as any , req.user.id);
         sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: "Successfully Recorded",
        data: result,
  });

});


const findByAllReport:RequestHandler=catchAsync(async(req , res)=>{

      const result=await ReportServices.findByAllReportIntoDb(req.query);
        sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: "Successfully Find By Report",
        data: result,
  });
});

const  deleteReport:RequestHandler=catchAsync(async(req , res)=>{

      const result = await  ReportServices.deleteReportIntoDb(req.params.id);
          sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: "Successfully Delete Report",
        data: result,
  });
});


const reportLikeUser:RequestHandler=catchAsync(async(req , res)=>{

    const result=await ReportServices.reportLikeUserInToDb(req.body, req.user.id);
    sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: "Successfully Recorded",
        data: result,
  });

})


const ReportController={
    recordedReport,
     findByAllReport,
      deleteReport,
      reportLikeUser
};

export default ReportController;




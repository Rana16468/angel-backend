import status from "http-status";
import AppError from "../../errors/AppError";
import { RequestWithFile, TReportLike } from "./report.interface";
import reports, { reportlikes } from "./report.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { Http2ServerRequest } from "http2";
import mongoose from "mongoose";



const recordedReportIntoDb=async(req: RequestWithFile, userId:string)=>{

    try{
   const file = req.file;
    let photo;
    if (file) {
      photo = file?.path?.replace(/\\/g, "/");
    }
    const data = req.body as any;

    const reportBuilder= new reports({...data, photo, userId});
    const result=await  reportBuilder.save();
    if(!result){
        throw new  AppError(status.NOT_EXTENDED, 'issues by the Report Recording  section Into Db')
    }
    return {
         status:true,
         message:"successfully recorded"
    }

    }
    catch(error:any){
        throw new AppError(status.SERVICE_UNAVAILABLE,'issues  by the recorded Report Into Db server unavailable')
    }
};


const findByAllReportIntoDb=async(query: Record<string, unknown>)=>{

    try{
const allReportQuery = new QueryBuilder(
     reports.find({}).populate([
{ 
            path: "userId",
            select: "name photo",
            }
     ]).select("-updatedAt -isDelete").lean(),
      query     
    )
      .search([]) 
      .filter()                          
      .sort()                            
      .paginate()                       
      .fields(); 

    const allreport = await allReportQuery  .modelQuery;
    const meta = await allReportQuery  .countTotal();

    return { meta,  allreport };


    }
     catch(error:any){
        throw new AppError(status.SERVICE_UNAVAILABLE,'issues  by the find By All Report Into Db unavailable')
    }

};


const   deleteReportIntoDb=async(id:string)=>{

      try{
          const deleteResult=await reports.findByIdAndDelete(id);
          if(!deleteResult){
              throw new AppError(status.SERVICE_UNAVAILABLE,'issues by the delete Report Into Db server unavailable')
          };
          return {
            status:true ,
            message:"successfully delete"
          }

      }
       catch(error:any){
        throw new AppError(status.SERVICE_UNAVAILABLE,'issues  by the delete Report IntoDb Db unavailable')
    }
};




const reportLikeUserInToDb = async (payload: Partial<TReportLike>, userId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const report = await reports.findById(payload.reportId).session(session);
    if (!report) {
      throw new AppError(status.NOT_FOUND, "Report not found", "");
    }

    const existingLike = await reportlikes
      .findOne({ userId, reportId: payload.reportId })
      .session(session);

    if (existingLike) {
      await reportlikes.deleteOne({ userId, reportId: payload.reportId }).session(session);
      await reports.findByIdAndUpdate(payload.reportId, { $inc: { isLike: -1 } }, { session });
    } else {
    
      const newLike = new reportlikes({ ...payload, userId, isLike: true });
      await newLike.save({ session });
      await reports.findByIdAndUpdate(payload.reportId, { $inc: { isLike: 1 } }, { session });
    }

    await session.commitTransaction();
    return { status: true, message: "Successfully toggled like" };
  } catch (error: any) {
    await session.abortTransaction();
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      error.message || "Transaction failed in reportLikeUserInToDb"
    );
  } finally {
    session.endSession();
  }
};



const ReportServices={
     recordedReportIntoDb,
     findByAllReportIntoDb,
     deleteReportIntoDb,
     reportLikeUserInToDb
};
export default ReportServices;
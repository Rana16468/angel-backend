import status from "http-status";
import AppError from "../../errors/AppError";
import socialfeedreports from "./socialfeedreport.model";
import eventposts from "../event_post/event_post.model";
import { TSocialFeedReport } from "./socialfeedreport.interface";
import QueryBuilder from "../../builder/QueryBuilder";


const recordedSocialFeedReportIntoDb=async(userId:string, payload:TSocialFeedReport)=>{

      try{
        
        const isExistEventPost=await eventposts.exists({_id:payload.event_postId}).lean();
        if(!isExistEventPost){
            throw new AppError(status.NOT_FOUND,'not founded event post data')
        }
          const reportBuilder= new  socialfeedreports({ ...payload, userId});
          const  result=await reportBuilder.save();
          if(!result){
            throw new AppError(status.NOT_EXTENDED, 'issues by the social feed report6 recording section','')
          };
          return {
            status:true ,
            message:"successfully recorded"
          };

      }
      catch(error:any){
        throw new AppError(status.SERVICE_UNAVAILABLE, 'ISSUES BY THE recorded Social FeedReport IntoDb')
      }
};


const findByAllSocialFeedReportIntoDb = async (query: Record<string, unknown>) => {
  try {
    const baseQuery = socialfeedreports
      .find({})
      .populate([
        {
          path: "userId",
          select: "name photo email phoneNumber",
        },
        {
          path: "event_postId",
          select: "userId", 
          populate: {
            path: "userId",
            select: "name photo email phoneNumber", 
          },
        },
      ]);

    const messagerQuery = new QueryBuilder(baseQuery, query)
      .search(["userId.name", "event_postId.userId.name reason"]) 
      .filter()
      .sort()
      .paginate()
      .fields();

    const allmessage = await messagerQuery.modelQuery;
    const meta = await messagerQuery.countTotal();

    return { meta, allmessage };
  } catch (error: any) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Error finding social feed reports",
      error,
    );
  }
};

const deleteSocialFeedReportIntoDb=async(id:string)=>{

       try{


        const isExist=await socialfeedreports.exists({_id:id}).lean();
        if(!isExist){
            throw new AppError(status.NOT_FOUND, 'not founded');
        };

         const result=await socialfeedreports.findByIdAndDelete(id);
         if(!result){
            throw new AppError(status.NOT_EXTENDED,'not extended social deed report section');
         };
         return {
            status:true ,
            message:"successfully delete"
         }

       }
       catch (error: any) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Error delete Social Feed Report IntoDb",
      error,
    );
  }
}


const socialFeedReportServices={
     recordedSocialFeedReportIntoDb,
     findByAllSocialFeedReportIntoDb,
     deleteSocialFeedReportIntoDb
};

export default socialFeedReportServices
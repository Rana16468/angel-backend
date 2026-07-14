import status from "http-status"
import AppError from "../errors/AppError"



const auto_delete_notification=async()=>{


     try{
        const currentTime = new Date();
const timeThreshold = new Date();
timeThreshold.setMonth(currentTime.getMonth() - 1);




     }
     catch(error:any){
        throw new AppError(status.SERVICE_UNAVAILABLE,'issues by the auto_delete_notification server section','');
     }
};

export default  auto_delete_notification;
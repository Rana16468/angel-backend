import { RequestHandler } from "express";
import catchAsync from "../../utils/asyncCatch";
import NotificationServices from "./notification.services";
import sendResponse from "../../utils/sendResponse";
import status from "http-status";

const sendPushNotification :RequestHandler=catchAsync(async(req , res)=>{
  

  const result=await NotificationServices.sendPushNotification(req.user.id, req.body);
  sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: 'Successfully Recoded  User Seen Notification Info',
      data: result,
    });

});


const specificUserNotificationList:RequestHandler=catchAsync(async(req , res)=>{


  const result=await NotificationServices.specificUserNotificationListIntoDb(req.user.id, req.query);
   sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: 'Successfully  Find My ALL Notification',
      data: result,
    });
}
);


const  findByUserNotification:RequestHandler=catchAsync(async(req , res)=>{

   const result=await NotificationServices.findByUserNotificationIntoDb(req.user.id);
     sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: 'Successfully  Find My ALL Notification',
      data: result,
    });
});

const changeNotificationStatus:RequestHandler=catchAsync(async(req , res)=>{

     const result=await NotificationServices.changeNotificationStatusIntoDb(req.user.id,req.body.notificationId );
        sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: 'Successfully Change Notification Status',
      data: result,
    });
});


const NotificationController = {
  sendPushNotification,
 specificUserNotificationList,
 findByUserNotification,
 changeNotificationStatus

};
export default  NotificationController;

import { RequestHandler } from "express";
import catchAsync from "../../utils/asyncCatch";
import FollowUpServices from "./followup.services";
import sendResponse from "../../utils/sendResponse";
import status from "http-status";




const  recordedFollowUp:RequestHandler=catchAsync(async(req , res)=>{

      const result=await FollowUpServices.recordedFollowUpIntoDb(req.body, req.user.id);
          sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully  Recorded",
    data: result,
  });

});


const findByEventSocialFeedFolloweWiseFiltering:RequestHandler=catchAsync(async(req , res)=>{


      const result=await FollowUpServices.findByEventSocialFeedFolloweWiseFilteringIntoDb(req.query, req.user.id);
               sendResponse(res, {
               success: true,
               statusCode: status.OK,
               message: "Successfully Find By My Social Feed",
               data: result,
             });
});

const  findMyFollowedList:RequestHandler=catchAsync(async(req , res)=>{

      const result=await FollowUpServices. findMyFollowedListIntoDb(req.user.id, req.query);
        sendResponse(res, {
               success: true,
               statusCode: status.OK,
               message: "Successfully Find My Followed List",
               data: result,
             });
});

const myFollowingAndFollowerList:RequestHandler=catchAsync(async(req , res)=>{

     const result=await FollowUpServices.myFollowingAndFollowerListIntoDb(req.user.id,req.params.userId);
        sendResponse(res, {
               success: true,
               statusCode: status.OK,
               message: "Successfully Find My Followed and Following List",
               data: result,
             });
});



 const sendInvitasationNotification:RequestHandler=catchAsync(async(req , res)=>{

    const result=await FollowUpServices.sendInvitasationNotificationIntoDb(req.user.id, req.body);
          sendResponse(res, {
               success: true,
               statusCode: status.OK,
               message: "Successfully  Send Notification",
               data: result,
             });

});

const findMyFollowingList:RequestHandler=catchAsync(async(req , res)=>{

     const result=await FollowUpServices.findMyFollowingListIntoDb(req.user.id, req.query);
        sendResponse(res, {
               success: true,
               statusCode: status.OK,
               message: "Successfully Find My Following List",
               data: result,
             });


});


const deleteFollowerList:RequestHandler=catchAsync(async(req , res)=>{

      const result=await FollowUpServices.deleteFollowerListIntoDb(req.params.id);
       sendResponse(res, {
               success: true,
               statusCode: status.OK,
               message: "Successfully  Delete",
               data: result,
             });
});

const isBlockFollowerAndFollowing: RequestHandler = catchAsync(
  async (req, res) => {
    const userId = req.user.id; 
    const { blockedUserId } = req.body;

    const result =
      await FollowUpServices.isBlockFollowerAndFollowingIntoDb(
        userId,
        blockedUserId
      );

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: result.message,
      data: result.data,
    });
  }
);


// block user
const getBlockedUsers: RequestHandler = catchAsync(
  async (req, res) => {
    const userId = req.user.id;

    const result = await FollowUpServices.getBlockedUsersIntoDb(userId);

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: result.message,
      data: result.data,
    });
  }
);



const findBySpecificFollowingUser:RequestHandler=catchAsync(async(req , res)=>{

      const result=await FollowUpServices.findBySpecificFollowingUserIntoDb(req.user.id);
sendResponse(res, {
               success: true,
               statusCode: status.OK,
               message: "Successfully Identify",
               data: result,
             });

})







 const  FollowUpController={
     recordedFollowUp,
     findByEventSocialFeedFolloweWiseFiltering,
     findMyFollowedList,
     myFollowingAndFollowerList,
     sendInvitasationNotification,
     findMyFollowingList,
     deleteFollowerList,
     isBlockFollowerAndFollowing,
     findBySpecificFollowingUser,
     getBlockedUsers
  
 };

 export default FollowUpController;
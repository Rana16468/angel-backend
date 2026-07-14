import { RequestHandler } from "express";
import catchAsync from "../../utils/asyncCatch";
import JoinEventGroupServices from "./join_event_group.services";
import sendResponse from "../../utils/sendResponse";
import status from "http-status";

const findByMyJoinEventGroup: RequestHandler = catchAsync(async (req, res) => {
  const result = await JoinEventGroupServices.findByMyJoinEventGroupIntoDb(
    req.user.id,
    req.query
  );
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Find My Join Event Group",
    data: result,
  });
});

const findBySpecificMyJoinGroup: RequestHandler = catchAsync(
  async (req, res) => {
    const result = await JoinEventGroupServices.findBySpecificMyJoinGroupIntoDb(
      req.params.id
    );
    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Successfully Find By Specific My Join Group",
      data: result,
    });
  }
);

const updateMyJoinGroup: RequestHandler = catchAsync(async (req, res) => {
  const result = await JoinEventGroupServices.updateMyJoinGroupIntoDb(
    req.params.id,
    req.body
  );
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Update",
    data: result,
  });
});

const joinGroup: RequestHandler = catchAsync(async (req, res) => {
  const result = await JoinEventGroupServices.joinGroupIntoDb(
    req.user.id,
    req.params.groupId
  );
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Join Event Group",
    data: result,
  });
});

const deleteJoinEventGroup: RequestHandler = catchAsync(async (req, res) => {
  const result = await JoinEventGroupServices.deleteJoinEventGroupIntoDb(
    req.user.id,
    req.params.joinUsersId
  );
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully delete join event group",
    data: result,
  });
});


const findByUserJoinEventGroup:RequestHandler=catchAsync(async(req , res)=>{


  const result=await JoinEventGroupServices. findByUserJoinEventGroupIntoDb(req.query);
    sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully  Find All Join Event Group",
    data: result,
  });

    
});


const findByAllJoinEventGroup:RequestHandler=catchAsync(async(req , res)=>{

     const result= await JoinEventGroupServices. findByAllJoinEventGroupIntoDb(req.query);
         sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully  Find  By All Join Event",
    data: result,
  });
});


const  find_my_join_group:RequestHandler=catchAsync(async(req , res)=>{


  const result=await JoinEventGroupServices. find_my_join_group_IntoDb(req.query, req.user.id);
           sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully  Find  My All Join Event Group",
    data: result,
  });
});


// const additionallyCreateNewGroup:RequestHandler=catchAsync(async(req , res)=>{

//   const result=await JoinEventGroupServices.additionallyCreateNewGroupIntoDb(req.body, req.user.id);
//           sendResponse(res, {
//     success: true,
//     statusCode: status.OK,
//     message: "Successfully Create Group ",
//     data: result,
//   });
// });

const additionallyCreateNewGroup: RequestHandler = catchAsync(
  async (req, res) => {
    // ✅ Pass req.body, user id, and uploaded file (if any)
    const result = await JoinEventGroupServices.additionallyCreateNewGroupIntoDb(
      req.body,
      req.user.id,
      req.file // multer file object
    );

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Successfully created group",
      data: result,
    });
  }
);

const deleteAdditionalGroup:RequestHandler=catchAsync(async(req , res)=>{

    const result=await JoinEventGroupServices.deleteAdditionalGroupIntoDb(req.params.groupId, req.user.id);
    sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Delete Group",
    data: result,
  });

});


const additionalGroupImageUpload:RequestHandler=catchAsync(async(req , res)=>{

     const result=await JoinEventGroupServices.additionalGroupImageUploadIntoDb(req as any,req.params.groupId, req.user.id );
        sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Update Group Images",
    data: result,
  });
});


const findBySpecificJoinEventGroup:RequestHandler=catchAsync(async(req , res)=>{


     const result=await JoinEventGroupServices.findBySpecificJoinEventGroupIntoDb(req.params.eventId, req.user.id);
    sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully  Find Specific Join Group",
    data: result,
  });

})

const JoinEventGroupController = {
  findByMyJoinEventGroup,
  findBySpecificMyJoinGroup,
  updateMyJoinGroup,
  joinGroup,
  deleteJoinEventGroup,
   findByUserJoinEventGroup,
   findByAllJoinEventGroup,
   find_my_join_group,
   additionallyCreateNewGroup,
   deleteAdditionalGroup,
   additionalGroupImageUpload,
   findBySpecificJoinEventGroup
};
export default JoinEventGroupController;

import { RequestHandler } from "express";
import catchAsync from "../../utils/asyncCatch";
import EventChatRoomServices from "./event_chatroom.services";
import sendResponse from "../../utils/sendResponse";
import status from "http-status";

const findByMyEventChatRoom: RequestHandler = catchAsync(async (req, res) => {
  const result = await EventChatRoomServices.findByMyEventChatRoomIntoDb(
    req.user.id,
    req.params
  );
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully find my event chatroom",
    data: result,
  });
});
const findBySpecificMyChatRoom: RequestHandler = catchAsync(
  async (req, res) => {
    const result = await EventChatRoomServices.findBySpecificMyChatRoomIntoDb(
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

const updateMyChatRoom: RequestHandler = catchAsync(async (req, res) => {
  const result = await EventChatRoomServices.updateMyChatRoomIntoDb(
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

const joinChatRoom: RequestHandler = catchAsync(async (req, res) => {
  const result = await EventChatRoomServices.joinChatRoomIntoDb(
    req.user.id,
    req.params.chatRoomId
  );
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Join Chat Room",
    data: result,
  });
});

const deleteEventChatRoom: RequestHandler = catchAsync(async (req, res) => {
  const result = await EventChatRoomServices.deleteEventChatRoomIntoDb(
    req.user.id,
    req.params.chatRoomUsersId
  );
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "successfully delete event chat room  user",
    data: result,
  });
});


const findByEventChatRoom:RequestHandler=catchAsync(async(req , res)=>{


  const result=await EventChatRoomServices.findByEventChatRoomIntoDb(req.query);
   sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "successfully find by all chat room",
    data: result,
  });

});

const findByAllEventChatRoom:RequestHandler=catchAsync(async(req , res)=>{

     const result=await EventChatRoomServices.findByAllEventChatRoomIntoDb(req.query);
      sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "successfully find by all chat room",
    data: result,
  });
});

const thrillseekersEventChatRoom:RequestHandler=catchAsync(async(req , res)=>{

     const result=await EventChatRoomServices.thrillseekersEventChatRoomIntoDb(req.user.id, req.query);
           sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "successfully find by my chat room list",
    data: result,
  });
});


const EventChatRoomController = {
  findByMyEventChatRoom,
  findBySpecificMyChatRoom,
  updateMyChatRoom,
  joinChatRoom,
   deleteEventChatRoom,
    findByEventChatRoom,
    findByAllEventChatRoom,
    thrillseekersEventChatRoom
};

export default EventChatRoomController;

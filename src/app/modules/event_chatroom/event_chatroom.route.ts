import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../user/user.constant";
import EventChatRoomController from "./event_chatroom.controller";
import validationRequest from "../../middlewares/validationRequest";
import chatRoomEventValidation from "./event_chatroom.validation";

const route = express.Router();

// added route

route.get(
  "/find_by_my_event_chatroom",
  auth(USER_ROLE.host),
  EventChatRoomController.findByMyEventChatRoom
);

route.get(
  "/find_by_specific_my_chatRoom/:id",
  auth(USER_ROLE.host),
  EventChatRoomController.findBySpecificMyChatRoom
);
route.patch(
  "/update_my_join_group/:id",
  auth(USER_ROLE.host),
  validationRequest(chatRoomEventValidation.chatRoomEventSchema),
  EventChatRoomController.updateMyChatRoom
);

route.get(
  "/join_event_chatroom/:chatRoomId",
  auth(USER_ROLE.host, USER_ROLE.thrillseekers),
  EventChatRoomController.joinChatRoom
);

route.delete(
  "/delete_event_chatroom/:chatRoomUsersId",
  auth(USER_ROLE.host, USER_ROLE.thrillseekers),
  EventChatRoomController.deleteEventChatRoom
);

route.get("/find_by_event_chat_room", auth(USER_ROLE.host,USER_ROLE.thrillseekers), EventChatRoomController. findByEventChatRoom);
route.get("/find_by_all_event_chatroom", auth(USER_ROLE.admin,USER_ROLE.superAdmin), EventChatRoomController.findByAllEventChatRoom);
route.get("/my_event_chatroom",auth(USER_ROLE.thrillseekers, USER_ROLE.host), EventChatRoomController.thrillseekersEventChatRoom);


const eventChatRoomRoutes = route;
export default eventChatRoomRoutes;

import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../user/user.constant";
import JoinEventGroupController from "./join_event_group.controller";
import validationRequest from "../../middlewares/validationRequest";
import JoinEventValidation from "./join_event_group.validation";
import upload from "../../utils/uploadFile";
import AppError from "../../errors/AppError";
import status from "http-status";

const route = express.Router();

// added route
route.get(
  "/find_by_my_join_event_Group",
  auth(USER_ROLE.host),
  JoinEventGroupController.findByMyJoinEventGroup
);
route.get(
  "/find_by_specific_my_join_group/:id",
  JoinEventGroupController.findBySpecificMyJoinGroup
);
route.patch(
  "/update_my_join_group/:id",
  auth(USER_ROLE.host),
  validationRequest(JoinEventValidation.joinEventSchema),
  JoinEventGroupController.updateMyJoinGroup
);

route.get(
  "/join_event_group/:groupId",
  auth(USER_ROLE.host, USER_ROLE.thrillseekers),
  JoinEventGroupController.joinGroup
);

route.delete(
  "/delete_join_event_group/:joinUsersId",
  auth(USER_ROLE.host, USER_ROLE.thrillseekers),
  JoinEventGroupController.deleteJoinEventGroup
);

route.get("/find_by_all_event_group", auth(USER_ROLE.host,USER_ROLE.thrillseekers), JoinEventGroupController.findByUserJoinEventGroup);
route.get("/find_by_all_join_eventgroup", auth(USER_ROLE.admin,USER_ROLE.superAdmin), JoinEventGroupController.findByAllJoinEventGroup);
route.get("/find_my_join_group", auth(USER_ROLE.host,USER_ROLE.thrillseekers),JoinEventGroupController.find_my_join_group );


route.post(
  "/create_new_group",
  auth(USER_ROLE.host, USER_ROLE.thrillseekers),
  upload.single("photo"), // ✅ handle photo upload
   (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body.data && typeof req.body.data === "string") {
        req.body = JSON.parse(req.body.data);
      }
      next();
    } catch (error) {
      next(new AppError(status.BAD_REQUEST, "Invalid JSON data", ""));
    }
  }, 
  validationRequest(JoinEventValidation.joinEventSchema),
  JoinEventGroupController.additionallyCreateNewGroup
)
route.delete("/delete_additional_group/:groupId", auth(USER_ROLE.host,USER_ROLE.thrillseekers), JoinEventGroupController.deleteAdditionalGroup)
//additionalGroupImageUpload


route.patch("/upload_group_photo/:groupId", auth(USER_ROLE.host, USER_ROLE.thrillseekers),  upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body.data && typeof req.body.data === "string") {
        req.body = JSON.parse(req.body.data);
      }
      next();
    } catch (error) {
      next(new AppError(status.BAD_REQUEST, "Invalid JSON data", ""));
    }
  }, validationRequest(JoinEventValidation.additionalGroupImageSchema), JoinEventGroupController.additionalGroupImageUpload);

  route.get("/find_by_specific_join_event_group/:eventId", auth(USER_ROLE.thrillseekers), JoinEventGroupController.findBySpecificJoinEventGroup);


const joinEventGroupRoutes = route;
export default joinEventGroupRoutes;

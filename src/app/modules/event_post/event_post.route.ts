import express, { NextFunction, Request, Response } from "express";

import { USER_ROLE } from "../user/user.constant";
import upload from "../../utils/uploadFile";
import AppError from "../../errors/AppError";
import status from "http-status";
import auth from "../../middlewares/auth";
import eventPostController from "./event_post.controller";
import validationRequest from "../../middlewares/validationRequest";
import eventPostValidation from "./event_post.validation";

const route = express.Router();

route.post(
  "/create_post_event",
  auth(USER_ROLE.host, USER_ROLE.thrillseekers),
  upload.single("file"),
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
  validationRequest(eventPostValidation.createEventPostSchema),
  eventPostController.createEventPost
);

route.get(
  "/find_by_all_specific_event_post_list/:eventId",
  auth(USER_ROLE.host, USER_ROLE.thrillseekers),
  eventPostController.findByAllSpecificEventPostList
);

route.delete(
  "/delete_event_post/:id",
  auth(USER_ROLE.host,USER_ROLE.admin,USER_ROLE.superAdmin,USER_ROLE.thrillseekers),
  eventPostController.deleteEventPost
);


route.post(
  "/create_social_feed_post_event",
  auth(USER_ROLE.host, USER_ROLE.thrillseekers),
  upload.single("file"), // file is optional
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
  validationRequest(eventPostValidation.createEventSocialFeedPostSchema),
  eventPostController.createEventSocialFeedPost
);

route.get("/find_by_all_social_feed_event", auth(USER_ROLE.host,USER_ROLE.thrillseekers),  eventPostController.findByEventSocialFeedFiltering);
route.get("/find_by_specific_event_post/:id", eventPostController.findBySpecificEventPost);
route.get("/find_my_all_event_post_list/:userId", auth(USER_ROLE.host,USER_ROLE.thrillseekers), eventPostController.findMyAllEventPostList);
route.get("/completed_live_event_post_media_file/:eventId",auth(USER_ROLE.host,USER_ROLE.thrillseekers),eventPostController.completedEventPostMediaFile)
route.patch("/update_event_post/:id", auth(USER_ROLE.host,USER_ROLE.thrillseekers), validationRequest(eventPostValidation.updateEventPostSchema), eventPostController.updateEventPost)
const eventPosts = route;
export default eventPosts;

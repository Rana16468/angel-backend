import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../user/user.constant";
import validationRequest from "../../middlewares/validationRequest";
import EventValidationSchema from "./event.validation";
import EventController from "./event.controller";
import upload from "../../utils/uploadFile";
import AppError from "../../errors/AppError";
import status from "http-status";

const route = express.Router();

route.post(
  "/create_event",
  auth(USER_ROLE.host),
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
  validationRequest(EventValidationSchema.createEventZodSchema),
  EventController.createEvent
);

route.get(
  "/find_my_event_list",
  auth(USER_ROLE.host),
  EventController.MyEventList
);

route.get(
  "/my_event_dashboard",
  auth(USER_ROLE.host),
  EventController.MyEventDashboard
);
route.get(
  "/my_event_type_ways_filtering",
  auth(USER_ROLE.host),
  EventController.MyEventTypeWaysFiltering
);

route.get(
  "/find_by_specific_event/:id",
  auth(USER_ROLE.host,USER_ROLE.thrillseekers),
  EventController.findBySpecificEvent
);

route.patch(
  "/update_event/:id",
  auth(USER_ROLE.host),
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
  validationRequest(EventValidationSchema.updateEventZodSchema),
  EventController.updateEvent
);

route.delete(
  "/delete_event/:id",
  auth(USER_ROLE.host),
  EventController.deleteEvent
);

route.get("/find_my_nearest_event", auth(USER_ROLE.thrillseekers), EventController.findByUserSearchAllEvent);
route.get("/nearest_location_ways_non_event", auth(USER_ROLE.host,USER_ROLE.thrillseekers), EventController.SearchingNearestLocationWaysNonEvent);
route.get("/find_by_all_live_event_filtering", auth(USER_ROLE.thrillseekers),EventController. findByAllLiveEventFiltering)
route.get("/find_by_all_upcomming_and_past_event", auth(USER_ROLE.thrillseekers),EventController.findByUpcommingAndPastEventFiltering );
route.get("/find_by_nearest_event", EventController.findByNearestEvent );
route.get("/get_event_growth", auth(USER_ROLE.admin,USER_ROLE.superAdmin), EventController.getEventGrowth);
route.get("/find_by_all_event", auth(USER_ROLE.admin, USER_ROLE.superAdmin), EventController.findByAllEvent);
route.delete("/admin_delete_event/:eventId", auth(USER_ROLE.admin,USER_ROLE.superAdmin), EventController.adminDeleteEvent);
route.get("/host_all_event_avg_rating", auth(USER_ROLE.host,USER_ROLE.thrillseekers), EventController.hostAllEventAvgRating)
route.get("/agora_access_token/:eventId", EventController.agoraAccessToken);



const RoueEvents = route;

export default RoueEvents;

import express, { NextFunction, Request, Response } from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import upload from '../../utils/uploadFile';
import status from 'http-status';
import AppError from '../../errors/AppError';
import validationRequest from '../../middlewares/validationRequest';
import uploadMemoriesEventValidation from './upload_memories_event.validation';
import UploadMemoriesEventController from './upload_memories_event.controller';

const route = express.Router();

route.post(
  "/memories_post_event",
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
  validationRequest(uploadMemoriesEventValidation.uploadMemoriesEventZodSchema),
UploadMemoriesEventController.UploadMemoriesEvent
);
route.get("/find_my_upload_memories_event", auth(USER_ROLE.host,USER_ROLE.thrillseekers), UploadMemoriesEventController.findMyUploadMemoriesEvent);

route.post("/love_eemoji_memories_event_count", auth(USER_ROLE.host,USER_ROLE.thrillseekers), UploadMemoriesEventController.LoveEemojiMemoriesEventCount)


const MemoriesEventRoutes=route;

export default MemoriesEventRoutes;

import express, { NextFunction, Request, Response } from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import upload from '../../utils/uploadFile';
import AppError from '../../errors/AppError';
import status from 'http-status';
import validationRequest from '../../middlewares/validationRequest';
import SocialFeedValidation from './social_feed.validation';
import SocialFeedController from './social_feed.controller';




const route=express.Router();
route.post(
  "/social_feed",
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
  validationRequest(SocialFeedValidation.SocialFeedSchema),
  SocialFeedController.createSocialFeed
);



route.get("/find_my_follow_waie_social_feed", auth(USER_ROLE.host,USER_ROLE.thrillseekers), SocialFeedController?.findByFollowWaieSocialFeed);
route.delete("/delete_social_feed/:id",auth(USER_ROLE.host,USER_ROLE.thrillseekers),SocialFeedController.deleteSocialFeed );



  const SocialFeedRoute=route;

  export default SocialFeedRoute;

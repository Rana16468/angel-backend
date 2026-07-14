import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import validationRequest from '../../middlewares/validationRequest';
import followUpValidation from './followup.validation';
import FollowUpController from './followup.controller';

const router=express.Router();
router.post("/recorded_followup", auth(USER_ROLE.host,USER_ROLE.thrillseekers), validationRequest(followUpValidation.followUpSchema), FollowUpController.recordedFollowUp);
router.get("/find_by_my_event_social_feed", auth(USER_ROLE.host,USER_ROLE.thrillseekers), FollowUpController.findByEventSocialFeedFolloweWiseFiltering);
router.get("/find_my_followed_list", auth(USER_ROLE.host,USER_ROLE.thrillseekers), FollowUpController.findMyFollowedList);
// myFollowingAndFollowerList
router.get("/find_my_following_and_followed_list/:userId", auth(USER_ROLE.host,USER_ROLE.thrillseekers), FollowUpController.myFollowingAndFollowerList);
router.post("/send_invitasation_notification", auth(USER_ROLE.host,USER_ROLE.thrillseekers), validationRequest(followUpValidation.invitasationNotificationSchema), FollowUpController.sendInvitasationNotification);
router.get("/find_my_following_list", auth(USER_ROLE.host,USER_ROLE.thrillseekers), FollowUpController.findMyFollowingList);
router.delete("/delete_follower_list/:id", auth(USER_ROLE.host,USER_ROLE.thrillseekers), FollowUpController.deleteFollowerList);

router.patch(
  "/user_block",
  auth(USER_ROLE.thrillseekers, USER_ROLE.host),
  validationRequest(followUpValidation.blockUserSchema),
  FollowUpController.isBlockFollowerAndFollowing
);

router.get("/is_book_user", auth(USER_ROLE.host,USER_ROLE.thrillseekers), FollowUpController.findBySpecificFollowingUser);

router.get(
  "/blocked-users",
  auth(USER_ROLE.thrillseekers, USER_ROLE.host),
  FollowUpController.getBlockedUsers
);


const FollowupRouters= router;
export  default FollowupRouters;

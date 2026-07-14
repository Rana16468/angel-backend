import express from 'express';

import { USER_ROLE } from '../user/user.constant';
import validationRequest from '../../middlewares/validationRequest';
import auth from '../../middlewares/auth';
import reactEventPostValidation from './react_event_post.validation';
import ReactEventPostController from './react_event_post.controller';




const route = express.Router();


route.post("/react_event", auth(USER_ROLE.host, USER_ROLE.thrillseekers), validationRequest(reactEventPostValidation.reactEventPostSchema),ReactEventPostController.recordedReactEventPost );
route.post("/event_comment", auth(USER_ROLE.host, USER_ROLE.thrillseekers), validationRequest(reactEventPostValidation.commantEventPostSchema), ReactEventPostController.recordedEventComment);
route.delete("/delete_event_post/:eventPostId", auth(USER_ROLE.host, USER_ROLE.thrillseekers), ReactEventPostController.deleteReactEventPost);
// live event command 
route.post("/live_event_comment", auth(USER_ROLE.host,USER_ROLE.thrillseekers),validationRequest(reactEventPostValidation.liveEventCommentSchema),ReactEventPostController. recordedLiveEvent);
route.get("/find_by_specific_live_comment/:eventId", auth(USER_ROLE.host,USER_ROLE.thrillseekers),ReactEventPostController.findSpecificByLiveEvent );
route.delete("/delete_live_commend/:id", auth(USER_ROLE.host, USER_ROLE.thrillseekers), ReactEventPostController.  deleteLiveCommend);
//  eventShareCountPostSchema
route.post("/event_share", auth(USER_ROLE.host,USER_ROLE.thrillseekers), validationRequest(reactEventPostValidation.eventShareCountPostSchema), ReactEventPostController.recordedShareCount)
const eventSocialPost=route;


route.post(
  "/live_event_emoji",
  auth(USER_ROLE.host, USER_ROLE.thrillseekers),
  validationRequest(reactEventPostValidation.liveEmojiSchema),
  ReactEventPostController.recordLiveEmoji
);

route.get(
  "/find_by_specific_live_emoji/:eventId",
  auth(USER_ROLE.host, USER_ROLE.thrillseekers),
  ReactEventPostController.findSpecificByLiveEmoji
);


export default eventSocialPost;
import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import validationRequest from '../../middlewares/validationRequest';
import eventRepliesCommentValidation from './event_replies_comment.validation';
import eventRepliesCommentController from './event_replies_comment.controller';

const route = express.Router();


route.post("/reply", auth(USER_ROLE.host, USER_ROLE.superAdmin, USER_ROLE.thrillseekers), validationRequest( eventRepliesCommentValidation.eventRepliesCommentSchema), eventRepliesCommentController.recordedEventRepliesComment);
route.get("/find_by_specific_event_comment_filtering/:eventpostId",auth(USER_ROLE.host,USER_ROLE.thrillseekers), eventRepliesCommentController.findBySpecificEventCommentFiltering);
route.get("/find_by_specific_event_reply_filtering/:commentEventPostId", auth(USER_ROLE.host,USER_ROLE.thrillseekers), eventRepliesCommentController.findBySpecificCommentReplyFiltering);
route.delete("/delete_reply/:replyId", auth(USER_ROLE.host,USER_ROLE.thrillseekers),eventRepliesCommentController.deleteReply)
const eventRepliersCommentRoute=route;

export default eventRepliersCommentRoute;



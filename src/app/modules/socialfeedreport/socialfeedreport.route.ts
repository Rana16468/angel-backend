
import express from 'express';

import { USER_ROLE } from '../user/user.constant';
import auth from '../../middlewares/auth';
import validationRequest from '../../middlewares/validationRequest';
import socialFeedReportValidation from './socialfeedreport.validation';
import socialFeedReportController from './socialfeedreport.controller';

const route=express.Router();

route.post("/recorded_report", auth(USER_ROLE.host,USER_ROLE.thrillseekers),validationRequest(socialFeedReportValidation.createSocialFeedReportZodSchema), socialFeedReportController.recordedSocialFeedReport);
route.get("/find_by_all_social_feed_report", auth(USER_ROLE.admin,USER_ROLE.superAdmin), socialFeedReportController.findByAllSocialFeedReport);
route.delete("/delete_social_feed_report/:id", auth(USER_ROLE.admin,USER_ROLE.superAdmin),socialFeedReportController.deleteSocialFeedReport)
const SocialFeedReportRoute=route;
export default SocialFeedReportRoute;
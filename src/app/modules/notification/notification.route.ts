import express from 'express';

import { USER_ROLE } from '../user/user.constant';
import auth from '../../middlewares/auth';
import NotificationController from './notification.controller';
import validationRequest from '../../middlewares/validationRequest';
import NotificationValidationSchema from './notification.validation';


const router = express.Router();

router.post("/sendPushNotification", auth(USER_ROLE.host,USER_ROLE.thrillseekers), NotificationController.sendPushNotification)
router.get("/specific_user_notification_list", auth(USER_ROLE.host,USER_ROLE.thrillseekers), NotificationController.specificUserNotificationList)
router.get("/find_my_notification", auth(USER_ROLE.host,USER_ROLE.thrillseekers), NotificationController.findByUserNotification);
router.patch("/change_notification_status", auth(USER_ROLE.host,USER_ROLE.thrillseekers),validationRequest(NotificationValidationSchema.changeNotificationStatusSchema), NotificationController.changeNotificationStatus)
const NotificationRoutes = router;

export default NotificationRoutes;

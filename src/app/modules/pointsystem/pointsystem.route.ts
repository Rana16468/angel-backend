import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import validationRequest from '../../middlewares/validationRequest';
import PointSystemValidation from './pointsystem.validation';
import PaymentSystemController from './pointsystem.controller';


const router = express.Router();

// Record generic/custom point
router.post(
  "/recorded_point_system",
  auth(USER_ROLE.host, USER_ROLE.thrillseekers),
  validationRequest(PointSystemValidation.PointSystemValidationSchema),
  PaymentSystemController.recordedPointSystem
);

// Record engagement point (comment: 0.5, photo: 1.0, video: 1.5 with per-event cap)
router.post(
  "/record_engagement_point",
  auth(USER_ROLE.host, USER_ROLE.thrillseekers),
  validationRequest(PointSystemValidation.recordEngagementPointSchema),
  PaymentSystemController.recordEngagementPoint
);

// Calculate partial redemption value (Cash-equivalent preview before checkout)
router.post(
  "/calculate_redemption",
  auth(USER_ROLE.host, USER_ROLE.thrillseekers),
  validationRequest(PointSystemValidation.calculateRedemptionSchema),
  PaymentSystemController.calculateRedemption
);

// Redeem points toward ticket purchase (first 5 per event cap)
router.post(
  "/redeem_points",
  auth(USER_ROLE.host, USER_ROLE.thrillseekers),
  validationRequest(PointSystemValidation.redeemPointsSchema),
  PaymentSystemController.redeemPoints
);
//test
// Get user points balance & stats
router.get(
  "/my_avg_point",
  auth(USER_ROLE.host, USER_ROLE.thrillseekers),
  PaymentSystemController.findMyAveragePointSystem
);

// Point rules (Rich text HTML matching Thrillio spec)
router.get(
  "/point_rules",
  auth(
    USER_ROLE.host,
    USER_ROLE.thrillseekers,
    USER_ROLE.admin,
    USER_ROLE.superAdmin
  ),
  PaymentSystemController.findPointRules
);

const PointSystemRouter = router;

export default PointSystemRouter;



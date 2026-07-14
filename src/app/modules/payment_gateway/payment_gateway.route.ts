import bodyParser from 'body-parser';
// payment_gateway.routes.ts
import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import paypalPaymentController from './payment_gateway.controller';
import validationRequest from '../../middlewares/validationRequest';
import PaymentValidation from './payment_gateway.validation';

const router = express.Router();

router.post(
  "/payment_onboarding",
  // auth(USER_ROLE.thrillseekers), // Uncomment if authentication needed
  paypalPaymentController.paypalPayment
);

// PayPal redirects here after user approves payment
router.get(
  "/complete-order",
  paypalPaymentController.completeOrder
);

// PayPal redirects here if user cancels
router.get(
  "/cancel-order",
  paypalPaymentController.cancelOrder
);

// Verify payment status
router.get(
  "/verify/:orderId",
  paypalPaymentController.verifyPayment
);
/*
-------------------------------------
stripe payment routes 
-------------------------------------
*/


router.get(
  '/create-onboarding-link',
  auth(USER_ROLE.thrillseekers),
  paypalPaymentController.createConnectedAccountAndOnboardingLink,
);

router.post(
  '/refresh-onboarding-link',
  auth(USER_ROLE.thrillseekers),
  validationRequest(PaymentValidation.refreshOnboardingLink),
 paypalPaymentController.refreshOnboardingLink,
);

// Routes for payment processing
router.post(
  '/create-payment-intent',
  auth(USER_ROLE.thrillseekers),
  validationRequest(PaymentValidation.createPaymentIntent),
 paypalPaymentController.createPaymentIntent,
);

router.get(
  '/payment-status/:paymentIntentId',
  auth(USER_ROLE.thrillseekers, USER_ROLE.admin, USER_ROLE.superAdmin),
 paypalPaymentController.getPaymentStatus,
);

// Checkout session routes
router.post(
  '/create-checkout-session',
  auth(USER_ROLE.thrillseekers),
  validationRequest(PaymentValidation.createCheckoutSession),
  paypalPaymentController.createCheckoutSession,
);

// Webhook route for Stripe events
// Webhook route for Stripe events
router.post(
  '/webhook',
  bodyParser.raw({ type: 'application/json' }),
  paypalPaymentController.handleWebhook,
);


// all payment list router

router.get(
  '/find_by_all_payment',
  paypalPaymentController.find_by_all_payment,
);

router.get("/find_my_payment_history", auth(USER_ROLE.host,USER_ROLE.thrillseekers), paypalPaymentController.findByMyPaymentHistory);

router.get("/completed_event_past_list", auth(USER_ROLE.host,USER_ROLE.thrillseekers),paypalPaymentController. payableEventPayment);

router.get("/is_live_event_payment_exist/:eventId", auth(USER_ROLE.host,USER_ROLE.thrillseekers), paypalPaymentController.isLiveEventPaymentExist)


const paymentRoutes = router;

export default paymentRoutes;
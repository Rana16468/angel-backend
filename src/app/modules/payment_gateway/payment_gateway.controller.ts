
import { Request, RequestHandler, Response } from "express";
import catchAsync from "../../utils/asyncCatch";
import PaymentService from "./payment_gateway.services";
import sendResponse from "../../utils/sendResponse";
import status from "http-status";
import config from "../../config";
import Stripe from "stripe";
import AppError from "../../errors/AppError";

const paypalPayment: RequestHandler = catchAsync(async (req, res) => {
  const { amount, currency, itemName, itemDescription, orderId } = req.body;

  if (!amount) {
    return sendResponse(res, {
      success: false,
      statusCode: status.BAD_REQUEST,
      message: "Amount is required",
      data: null,
    });
  }

  const result = await PaymentService.paypalPaymentIntoDb({
    amount,
    currency,
    itemName,
    itemDescription,
    orderId,
    userId: req.user?.id, 
  });

  // Extract approval URL
  const approvalUrl = result.data.links.find(link => link.rel === "approve")?.href;

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Payment order created successfully",
    data: {
      orderId: result.data.id,
      status: result.data.status,
      approvalUrl,
      fullResponse: result.data,
    },
  });
});

const completeOrder: RequestHandler = catchAsync(async (req, res) => {
  const { token } = req.query; 

  if (!token || typeof token !== 'string') {
    return sendResponse(res, {
      success: false,
      statusCode: status.BAD_REQUEST,
      message: "Order ID (token) is required",
      data: null,
    });
  }

  const captureData = await PaymentService.capturePaypalPayment(token);

  if (captureData.status === "COMPLETED") {
  
    return res.redirect(`${config.payment_getway_credentials.frontend_url}/payment-success?orderId=${captureData.id}`);
    
    // Or send JSON response:
    // return sendResponse(res, {
    //   success: true,
    //   statusCode: status.OK,
    //   message: "Payment completed successfully",
    //   data: {
    //     orderId: captureData.id,
    //     status: captureData.status,
    //     amount: captureData.purchase_units[0].payments.captures[0].amount,
    //     payer: captureData.payer,
    //   },
    // });
  } else {
    return sendResponse(res, {
      success: false,
      statusCode: status.PAYMENT_REQUIRED,
      message: "Payment not completed",
      data: captureData,
    });
  }
});

const cancelOrder: RequestHandler = catchAsync(async (req, res) => {
  const { token } = req.query;

 
  return res.redirect(`${config.payment_getway_credentials.frontend_url}/payment-cancelled?orderId=${token}`);

  // Or send JSON response:
  // return sendResponse(res, {
  //   success: false,
  //   statusCode: status.OK,
  //   message: "Payment was cancelled by user",
  //   data: { orderId: token },
  // });
});

const verifyPayment: RequestHandler = catchAsync(async (req, res) => {
  const { orderId } = req.params;

  if (!orderId) {
    return sendResponse(res, {
      success: false,
      statusCode: status.BAD_REQUEST,
      message: "Order ID is required",
      data: null,
    });
  }

  const paymentDetails = await PaymentService.verifyPaypalPayment(orderId);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Payment details retrieved successfully",
    data: paymentDetails,
  });
});


const stripe = new Stripe(
  config.stripe_payment_gateway.stripe_secret_key as string,
);

const webhook = config.stripe_payment_gateway.stripe_webhook_secret;

const createConnectedAccountAndOnboardingLink:RequestHandler = catchAsync(
  async (req,  res) => {
    const result =
      await PaymentService.createConnectedAccountAndOnboardingLinkIntoDb(
        req.user,
      );

     sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: 'Onboarding link created successfully',
      data: { onboardingUrl: result },
    });
  },
);

const refreshOnboardingLink:RequestHandler = catchAsync(
  async (req, res) => {
  

    const result =
      await PaymentService.updateOnboardingLinkIntoDb(req.user.id);

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: 'Onboarding link refreshed successfully',
      data: result,
    });
  },
);

const createPaymentIntent:RequestHandler = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { price, eventId, description } = req.body;

  const result = await PaymentService.createPaymentIntent(userId, {
    price,
    eventId,
    description,
  });

   sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Payment intent created successfully',
    data: result,
  });
});

const getPaymentStatus :RequestHandler= catchAsync(async (req, res) => {
  const { paymentIntentId } = req.params;

  const result =
    await PaymentService.retrievePaymentStatus(paymentIntentId);

 sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Payment status retrieved successfully',
    data: result,
  });
});

const createCheckoutSession:RequestHandler= catchAsync(
  async (req, res) => {
    const userId = req.user.id;
    const { price, eventId, ticketCount, description } = req.body;

    const result =
      await PaymentService.createCheckoutSessionForSubscription(
        userId,
        { price,eventId, ticketCount, description },
      );

   sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: 'Checkout session created successfully',
      data: result,
    });
  },
);

const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    throw new AppError(status.BAD_REQUEST, 'Missing stripe signature', '');
  }

  let event;

  try {
    if (!req.rawBody) {
      throw new AppError(status.BAD_REQUEST, 'Raw body not available', '');
    }

    event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      webhook as string,
    );
  } catch (err: any) {
    throw new AppError(
      status.BAD_REQUEST,
      `Webhook Error: ${err.message}`,
      '',
    );
  }

  const result = await PaymentService.handleWebhookIntoDb(event);

 sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Webhook received',
    data: { received: true, result },
  });
});

const findByMyPaymentHistory:RequestHandler=catchAsync(async(req , res)=>{


     const result=await PaymentService.findByMyPaymentHistoryIntoDb(req.user.id, req.query);
      sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'successfully find my payment history ',
    data: { received: true, result },
  });
})


const find_by_all_payment:RequestHandler=catchAsync(async(req , res)=>{

  const result=await  PaymentService.find_by_all_payment_IntoDb(req.query);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Successfully Find By The All Payamnt Data',
    data: result,
  });
});



const payableEventPayment:RequestHandler=catchAsync(async(req , res)=>{

     const result=await PaymentService. payableEventPaymentIntoDb(req.user.id, req.query);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Successfully Find Event Payment List',
    data: result,
  });

});

const isLiveEventPaymentExist:RequestHandler=catchAsync(async(req , res)=>{

     const result=await PaymentService.isLiveEventPaymentExistIntoDb(req.user.id, req.params.eventId);
       sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Successfully Find By Live Event Payment',
    data: result,
  });
})



const paypalPaymentController = {
  paypalPayment,
  completeOrder,
  cancelOrder,
  verifyPayment,
    createConnectedAccountAndOnboardingLink,
  refreshOnboardingLink,
  createPaymentIntent,
  getPaymentStatus,
  createCheckoutSession,
  handleWebhook,
  find_by_all_payment,
  findByMyPaymentHistory,
  payableEventPayment,
  isLiveEventPaymentExist
};

export default paypalPaymentController;
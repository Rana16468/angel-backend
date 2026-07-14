import { status} from 'http-status';
import Stripe from 'stripe';
import axios from "axios";
import generatePaypalAccessToken, { PaypalTokenResponse } from "../../utils/generatePaypalAccessToken";
import config from "../../config";
import users from '../user/user.model';
import { USER_ACCESSIBILITY } from '../user/user.constant';
import { JwtPayload } from 'jsonwebtoken';
import AppError from '../../errors/AppError';
import mongoose, { Types } from 'mongoose';
import events from '../event/event.model';
import paymentgateways from './payment_gateway.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { payment_status } from './payment_gateway.constant';
import notifications from '../notification/notification.model';
import NotificationServices from '../notification/notification.services';

const stripe = new Stripe(
  config.stripe_payment_gateway.stripe_secret_key as string,
);

interface PaymentDetails {
  price: number;
  eventId: string;
  ticketCount:number;
  description?: string;
}



export interface PaypalOrderResponse {
  id: string;
  status: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export interface PaypalCaptureResponse {
  id: string;
  status: string;
  purchase_units: Array<{
    reference_id: string;
    payments: {
      captures: Array<{
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
      }>;
    };
  }>;
  payer: {
    email_address: string;
    payer_id: string;
    name: {
      given_name: string;
      surname: string;
    };
  };
}

export interface PaymentPayload {
  amount: string;
  currency?: string;
  itemName?: string;
  itemDescription?: string;
  userId?: string;
  orderId?: string;
}

const paypalPaymentIntoDb = async (
  paymentData: PaymentPayload
): Promise<{ access_token: string; data: PaypalOrderResponse }> => {
  
  const { access_token }: PaypalTokenResponse = await generatePaypalAccessToken();

  const amount = parseFloat(paymentData.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Invalid payment amount");
  }

  const formattedAmount = amount.toFixed(2);
  const currency = paymentData.currency || "USD";
  const itemName = paymentData.itemName || "Product Purchase";
  const itemDescription = paymentData.itemDescription || "Payment for product/service";

  const baseUrl = (config.payment_getway_credentials.paypal_base_url as string).trim().replace(/\/+$/, "");

  const orderPayload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: paymentData.orderId || "default",
        items: [
          {
            name: itemName,
            description: itemDescription,
            quantity: "1",
            unit_amount: {
              currency_code: currency,
              value: formattedAmount,
            },
          },
        ],
        amount: {
          currency_code: currency,
          value: formattedAmount,
          breakdown: {
            item_total: {
              currency_code: currency,
              value: formattedAmount,
            },
          },
        },
      },
    ],
    application_context: {
      return_url: `${config.payment_getway_credentials.frontend_url}/api/v1/payment/complete-order`,
      cancel_url: `${config.payment_getway_credentials.frontend_url}/api/v1/payment/cancel-order`,
      shipping_preference: "NO_SHIPPING",
      user_action: "PAY_NOW",
      brand_name:  "manfra.io",
    },
  };

//   console.log("Creating PayPal order with payload:", JSON.stringify(orderPayload, null, 2));

  try {
    const response = await axios.post<PaypalOrderResponse>(
      `${baseUrl}/v2/checkout/orders`,
      orderPayload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    // console.log("PayPal order created successfully:", response.data.id);

    return {
      access_token,
      data: response.data,
    };
  } catch (error: any) {
    console.error("PayPal API Error:", error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 
      error.response?.data?.details?.[0]?.description ||
      "Failed to create PayPal order"
    );
  }
};

const capturePaypalPayment = async (
  orderId: string
): Promise<PaypalCaptureResponse> => {
  
  const { access_token }: PaypalTokenResponse = await generatePaypalAccessToken();

  const baseUrl = (config.payment_getway_credentials.paypal_base_url as string).trim().replace(/\/+$/, "");

  console.log(`Capturing payment for order: ${orderId}`);

  try {
    const response = await axios.post<PaypalCaptureResponse>(
      `${baseUrl}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    console.log("Payment captured successfully:", response.data);

    return response.data;
  } catch (error: any) {
    console.error("PayPal Capture Error:", error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 
      error.response?.data?.details?.[0]?.description ||
      "Failed to capture PayPal payment"
    );
  }
};

const verifyPaypalPayment = async (
  orderId: string
): Promise<any> => {
  
  const { access_token }: PaypalTokenResponse = await generatePaypalAccessToken();

  const baseUrl = (config.payment_getway_credentials.paypal_base_url as string).trim().replace(/\/+$/, "");

  console.log(`Verifying payment for order: ${orderId}`);

  try {
    const response = await axios.get(
      `${baseUrl}/v2/checkout/orders/${orderId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    console.log("Payment verified:", response.data);

    return response.data;
  } catch (error: any) {
    console.error("PayPal Verify Error:", error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 
      "Failed to verify PayPal payment"
    );
  }
};
 /*
 ..........................
     stripe  account  started 
 ..........................
  */

const createConnectedAccountAndOnboardingLinkIntoDb = async (
  userData: JwtPayload,
) => {
  try {
    const normalUser: any = await users.findOne(
      {
        $and: [
          { _id: userData.id },
          { isDelete: false },
          { isVerify: true },
          { status: USER_ACCESSIBILITY.isProgress },
        ],
      },
      { _id: 1, stripeAccountId: 1, email: 1 },
    );

    if (!normalUser) {
      throw new AppError(
        status.NOT_FOUND,
        'This user is restricted due to some issues',
        '',
      );
    }

    if (normalUser?.stripeAccountId) {
      const account = await stripe.accounts.retrieve(normalUser.stripeAccountId);
      if (
        account?.capabilities?.card_payments === 'inactive' &&
        account?.capabilities?.transfers === 'inactive'
      ) {
        await users.findOneAndUpdate(
          {
            _id: userData?.id,
            isVerify: true,
            status: USER_ACCESSIBILITY.isProgress,
            isDelete: false,
          },
          { $unset: { stripeAccountId: '' } },
          { new: true },
        );

        return await createNewStripeAccountAndLink(normalUser?.email, userData?.id);
      }

      return {

        card_payments: account.capabilities?.card_payments,
        transfers: account.capabilities?.transfers,

      };
    }

    return await createNewStripeAccountAndLink(normalUser?.email, userData?.id);
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      'createConnectedAccountAndOnboardingLinkIntoDb server unavailable',
      '',
    );
  }
};
const createNewStripeAccountAndLink = async (email: string, userId: string) => {
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    country: 'US',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual',
    settings: {
      payouts: { schedule: { interval: 'manual' } },
    },
  });

  const onboardingLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${config.stripe_payment_gateway.onboarding_refresh_url}?accountId=${account.id}`,
    return_url: config.stripe_payment_gateway.onboarding_return_url,
    type: 'account_onboarding',
  });

  const updatedUser = await users.findOneAndUpdate(
    {
      _id: userId,
      isVerify: true,
      status: USER_ACCESSIBILITY.isProgress,
      isDelete: false,
    },
    { $set: { stripeAccountId: account.id } },
    { new: true, upsert: true },
  );

  if (!updatedUser) {
    throw new AppError(
      status.NOT_EXTENDED,
      'Issue storing Stripe account ID in DB',
      '',
    );
  }

  // ✅ Always return URL for new accounts
  return { onboardingUrl: onboardingLink?.url };
};





const updateOnboardingLinkIntoDb = async (userId: string) => {
  try {
    const normalUser = await users.findOne(
      {
        $and: [
          {
            _id: userId,
            isDelete: false,
            isVerify: true,
            status: USER_ACCESSIBILITY.isProgress,
          },
        ],
      },
      { _id: 1, stripeAccountId: 1 },
    );

    if (!normalUser) {
      throw new AppError(
        status.NOT_FOUND,
        'this user restrict by the some issues ',
        '',
      );
    }
    const stripAccountId = normalUser?.stripeAccountId;
    const accountLink = await stripe.accountLinks.create({
      account: stripAccountId as string,
      refresh_url: `${config.stripe_payment_gateway.onboarding_refresh_url}?accountId=${stripAccountId}`,
      return_url: config.stripe_payment_gateway.onboarding_return_url,
      type: 'account_onboarding',
    });

    return { link: accountLink.url };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      'update Onboarding Link IntoDb server server unavalable',
      '',
    );
  }
};

const createPaymentIntent = async (
  userId: string,
  paymentDetails: Partial<PaymentDetails>,
) => {
  try {
    const {
      price,
      eventId,
      description = 'Truck service payment',
    } = paymentDetails;

    if (!price || price <= 0) {
      throw new AppError(
        status.BAD_REQUEST,
        'Price must be a positive number',
        '',
      );
    }

    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new AppError(
        status.BAD_REQUEST,
        'Valid truck ID is required',
        '',
      );
    }

    if (!eventId || Types.ObjectId.isValid(eventId)) {
      throw new AppError(
        status.BAD_REQUEST,
        'Valid Subscription ID is required',
        '',
      );
    }

    //isTruck  exist

    // Calculate amount in cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(price * 100);

    // Create a payment intent details for debugging

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        description: description,
        metadata: {
          eventId: eventId,
          userId: userId,
        },
        application_fee_amount: Math.round(amountInCents * 0.05), // 5% platform fee
        transfer_data: {
          destination: '',
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (stripeError: any) {
      throw new AppError(
        status.BAD_REQUEST,
        `Stripe error: ${stripeError.message}`,
        '',
      );
    }
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      `Payment service unavailable: ${error.message || 'Unknown error'}`,
      '',
    );
  }
};

const retrievePaymentStatus = async (paymentIntentId: string) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100, // Convert back to dollars
      metadata: paymentIntent.metadata,
      created: new Date(paymentIntent.created * 1000).toISOString(),
    };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      'Could not retrieve payment information',
      '',
    );
  }
};

const createCheckoutSessionForSubscription = async (
  userId: string,
  paymentDetails: PaymentDetails,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      price,
      eventId,
       ticketCount,
      description = 'subscription payment',
    } = paymentDetails;

    if (!price || price <= 0) {
      throw new AppError(
        status.BAD_REQUEST,
        'Price must be a positive number',
        '',
      );
    }

    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new AppError(
        status.BAD_REQUEST,
        'Valid truck ID is required',
        '',
      );
    }

    const user = await users
      .findOne(
        {
          _id: userId,
          isDelete: false,
          isVerify: true,
          status: USER_ACCESSIBILITY.isProgress,
        },
        { stripeAccountId: 1, email: 1 },
      ).lean()
      .session(session); // <- bind to session

    if (!user) {
      throw new AppError(
        status.NOT_FOUND,
        'User not found or not verified',
        '',
      );
    }

    const isExistEventId = await events
      ?.exists({
        _id: paymentDetails.eventId,
      })
      .session(session); // <- bind to session

    if (!isExistEventId) {
      throw new AppError(status.NOT_FOUND, 'Subscription not found', '');
    }

const sessionStripe: any = await stripe.checkout.sessions.create({
  payment_method_types: ['card'], // Apple Pay + Google Pay comes via CARD

  payment_method_options: {
    card: {
      request_three_d_secure: 'automatic',
    },
  },

  line_items: [
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'subscription services',
          description: description,
          metadata: {
            userId: userId,
          },
        },
        unit_amount: Math.round(price * 100),
      },
      quantity: 1,
    },
  ],

  metadata: {
    eventId: eventId,
    userId: userId,
  },

  mode: 'payment',
  success_url: `${config.stripe_payment_gateway.checkout_success_url}?sessionId={CHECKOUT_SESSION_ID}`,
  cancel_url: config.stripe_payment_gateway.checkout_cancel_url,
});



    const paymentBuilder = new paymentgateways({
      currency: sessionStripe.currency,
      sessionId: sessionStripe.id,
      userId: sessionStripe.metadata.userId,
      subscriptionId: isExistEventId._id,
      eventId:sessionStripe.metadata.eventId,
      paymentmethod: sessionStripe.payment_method_types[0],
      payment_statu: sessionStripe.payment_status,
      price: paymentDetails.price,
      description: paymentDetails.description,
      ticketCount
    });

    const paymentResult = await paymentBuilder.save({ session }); // <- save in transaction

    if (!paymentResult) {
      throw new AppError(
        status.NOT_IMPLEMENTED,
        'issues by the stripe checked session',
        '',
      );
    }

    await session.commitTransaction();
    session.endSession();

    return {
      checkoutUrl: sessionStripe.url,
      sessionId: sessionStripe.id,
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
   status.SERVICE_UNAVAILABLE,
      `Checkout service unavailable: ${error.message || 'Unknown error'}`,
      '',
    );
  }
};


const handleWebhookIntoDb = async (event: Stripe.Event) => {
 
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    let result = {
      status: false,
      message: 'Unhandled event type',
    };


    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        if (!paymentIntent?.id) {
          throw new AppError(
            status.NOT_FOUND,
            'Missing PaymentIntent ID',
            '',
          );
        }

        result = {
          status: true,
          message: 'Payment successful',
        };
        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;

        if (!account?.id) {
          throw new AppError(
           status.NOT_FOUND,
            'Missing Stripe account ID',
            '',
          );
        }

        result = {
          status: true,
          message: 'Account updated',
        };
        break;
      }

      case 'checkout.session.completed': {
        const sessionData = event.data.object as Stripe.Checkout.Session;

        if (
          !sessionData?.metadata?.userId ||
          !sessionData?.metadata?.eventId
        ) {
          throw new AppError(
            status.BAD_REQUEST,
            'Invalid checkout session metadata',
            '',
          );
        }

        const recordedPayment = await paymentgateways.findOneAndUpdate(
          {
            userId: sessionData.metadata.userId,
            eventId: sessionData.metadata.eventId,
            sessionId: sessionData.id,
          },
          {
            $set: {
              payable_name: sessionData.customer_details?.name || '',
              payable_email: sessionData.customer_details?.email || '',
              payment_intent: sessionData.payment_intent,
              payment_status: sessionData.payment_status,
              country: sessionData.customer_details?.address?.country || '',
            },
          },
          { new: true, upsert: true, session },
        );

        if (!recordedPayment) {
          throw new AppError(
            status.INTERNAL_SERVER_ERROR,
            'Failed to update payment details',
            '',
          );
        }
        // send  notification
         const notificationData = {
          title: 'Tricket Payment',
          content: 'Payment completed successfully.',
          time: new Date(),
        };

        const notification = new notifications({
          userId: sessionData.metadata.userId,
          title: notificationData.title,
          content: notificationData.content,
          createdAt: notificationData.time,
        });

        const savedNotification = await notification.save({ session });

        if (!savedNotification) {
          throw new AppError(
            status.INTERNAL_SERVER_ERROR,
            'Notification save failed',
            '',
          );
        }

        const pushResult = await NotificationServices.sendPushNotification(
          sessionData.metadata.userId.toString(),
          notificationData,
        );

        if (!pushResult) {
          throw new AppError(
            status.INTERNAL_SERVER_ERROR,
            'Push notification failed',
            '',
          );
        }
        result = {
          status: true,
          message: 'Checkout session successfully recorded',
        };
        break;
      }

      default:
        console.warn(`⚠️ Unhandled Stripe event type: ${event.type}`);
        break;
    }

    await session.commitTransaction();
    return result;
  } catch (error: any) {
    await session.abortTransaction();
    console.error('❌ Stripe Webhook Error:', error?.message || error);

    throw new AppError(
    status.SERVICE_UNAVAILABLE,
      'Server unavailable – webhook handler failed',
      error,
    );
  } finally {
    await session.endSession();
  }
};

// Method 1: Array of populate objects (RECOMMENDED)
const find_by_all_payment_IntoDb = async (query: Record<string, unknown>) => {
  try {
    const allPaymentQuery = new QueryBuilder(
   paymentgateways
        .find({ payment_status: payment_status.paid })
        .populate([
          {
            path: 'userId',
            select: 'name email phoneNumber photo',
          },
          {
            path: 'eventId',
            select: 'event_title photo'
          },
          // need to event  under hostId ways host information 
          
        ]).select("country payable_email payable_name paymentmethod"),
      query,
    )
      .search([])
      .filter()
      .sort()
      .paginate()
      .fields();

    const all_payments = await allPaymentQuery.modelQuery;
    const meta = await allPaymentQuery.countTotal();
    return { meta, all_payments };
  } catch (error: any) {
    throw new AppError(
      status.NOT_FOUND,
      'issues by the find all payment into db',
      error,
    );
  }
};


const findByMyPaymentHistoryIntoDb=async(userId:string,query: Record<string, unknown>)=>{

     try{
 const allPaymentQuery = new QueryBuilder(
   paymentgateways
        .find({userId, payment_status: payment_status.paid })
        .populate([
          {
            path: 'userId',
            select: 'name email  photo',
          },
          {
            path: 'eventId',
            select: 'event_title  date starting_time ending_time'
          },
          
          
        ]).select("price ticketCount  country payable_email payable_name createdAt"),
      query,
    )
      .search([])
      .filter()
      .sort()
      .paginate()
      .fields();

    const my_payments = await allPaymentQuery.modelQuery;
    const meta = await allPaymentQuery.countTotal();
    return { meta, my_payments};
     }
     catch (error: any) {
    throw new AppError(
      status.NOT_FOUND,
      'error by the find By My Payment HistoryIntoDb',
      error,
    );
  }
};

/*

events
            .find({
              userId,
              isDelete: false,
              $expr: {
                $lt: [
                  {
                    $dateFromString: {
                      dateString: { $concat: ["$date", " ", "$starting_time"] },
                    },
                  },
                  now,
                ],
              },
            })
            .select(
              "photo audience_settings.max_capacity event_title createdAt date starting_time ending_time audience_settings.price"
            )


*/

const payableEventPaymentIntoDb = async (
  userId: string,
  query: Record<string, unknown>
) => {
  const now = new Date();

  try {
    const allPastEventQuery = new QueryBuilder(
      paymentgateways
        .find({
          userId,
          payment_status: payment_status.paid,
        })
        .populate([
          {
            path: "eventId",
            match: {
              isDelete: false,
              $expr: {
                $lt: [
                  {
                    $dateFromString: {
                      dateString: {
                        $concat: ["$date", " ", "$starting_time"],
                      },
                    },
                  },
                  now,
                ],
              },
            },
            select:
              "photo audience_settings.max_capacity event_title createdAt date starting_time ending_time audience_settings.price",
          },
        ])
        .select("country payable_email payable_name createdAt"),
      query
    )
      .search([])
      .filter()
      .sort()
      .paginate()
      .fields();

    let past_event_list = await allPastEventQuery.modelQuery;

    
    past_event_list = past_event_list.filter(
      (item: any) => item.eventId !== null
    );


    const meta = {
      ...(await allPastEventQuery.countTotal()),
      total: past_event_list.length,
      totalPage: Math.ceil(
        past_event_list.length / (query.limit ? Number(query.limit) : 10)
      ),
    };
    

    return { meta, past_event_list };
  } catch (error: any) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Error while finding past payment history",
      error
    );
  }
};

const isLiveEventPaymentExistIntoDb = async (userId: string, eventId: string) => {
  try {
    // 1️⃣ Validate eventId exists


    const isExistEvent = await events.findById(eventId).select("_id").lean();
    if (!isExistEvent) {
      throw new AppError(status.NOT_FOUND, "Event not found");
    }


    const result = await paymentgateways
      .findOne(
        {
          eventId: new Types.ObjectId(eventId),
          userId: new Types.ObjectId(userId),
        },
        {
          payment_status: 1,
          _id: 0,
        }
      )
      .lean();

      

    if (!result) {


       return {
        status:false,
        payment_status: payment_status.unpaid
       }
    }

    // 3️⃣ Clean response
    return {
      status: true,
      payment_status: result.payment_status,
    };
  } catch (error: any) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Error while checking payment history",
      error
    );
  }
};


const PaymentService = {
  paypalPaymentIntoDb,
  capturePaypalPayment,
  verifyPaypalPayment,
  createConnectedAccountAndOnboardingLinkIntoDb,
  updateOnboardingLinkIntoDb,
  createPaymentIntent,
  retrievePaymentStatus,
  createCheckoutSessionForSubscription,
  handleWebhookIntoDb,
  find_by_all_payment_IntoDb,
  findByMyPaymentHistoryIntoDb,
   payableEventPaymentIntoDb,
   isLiveEventPaymentExistIntoDb
};
export default PaymentService;
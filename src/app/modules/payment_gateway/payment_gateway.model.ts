// payment.model.ts (Optional - for storing payment records)
/*import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  orderId: string;
  paypalOrderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  itemName: string;
  itemDescription: string;
  payerEmail?: string;
  payerId?: string;
  payerName?: string;
  captureId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    orderId: { type: String, required: true, unique: true },
    paypalOrderId: { type: String, required: true },
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    itemName: { type: String, required: true },
    itemDescription: { type: String },
    payerEmail: { type: String },
    payerId: { type: String },
    payerName: { type: String },
    captureId: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);*/

// Example: Save payment to database function
/*
import { Payment } from './payment.model';

async function savePaymentToDatabase(captureData: PaypalCaptureResponse, orderData: any) {
  const payment = await Payment.create({
    orderId: orderData.orderId,
    paypalOrderId: captureData.id,
    userId: orderData.userId,
    amount: parseFloat(captureData.purchase_units[0].payments.captures[0].amount.value),
    currency: captureData.purchase_units[0].payments.captures[0].amount.currency_code,
    status: 'completed',
    itemName: orderData.itemName,
    itemDescription: orderData.itemDescription,
    payerEmail: captureData.payer.email_address,
    payerId: captureData.payer.payer_id,
    payerName: `${captureData.payer.name.given_name} ${captureData.payer.name.surname}`,
    captureId: captureData.purchase_units[0].payments.captures[0].id,
  });

  return payment;
}*/


import  { Schema, model } from "mongoose";
import { PaymentGateWayModel, TStripePaymentGateWay } from "./payment_gateway.interface";
import { payment_method, payment_status } from "./payment_gateway.constant";


const TPaymentGateWaySchema = new Schema<
  TStripePaymentGateWay,
  PaymentGateWayModel
>(
  {
      userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: [true, "userId is required"],
      index:true
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "events",
      required: [true, "eventId is required"],
      index:true
    },
     ticketCount:{
         type:Number,
         required:[true ,'ticket count is required']
     },
    price: {
      type: Number,
      required: [true, "price is required"],
    },
    description: {
      type: String,
      required: [false, "description is required"],
    },
    currency: {
      type: String,
      required: [false, "currency is not required "],
    },
    sessionId: {
      type: String,
      required: [false, "session is not  required"],
      unique: true,
    },
    paymentmethod: {
      type: String,
      enum: {
        values: [payment_method.cash, payment_method.card],
        message: "{VALUE} is not a valid provider",
      },
      required: [false, "payment method is not Required"],
      default: payment_method.card,
    },
    payment_status: {
      type: String,
      index:true,
      enum: {
        values: [payment_status.unpaid, payment_status.paid],
        message: "{VALUE} is not a valid provider",
      },
      required: [false, "payment status is not  required"],
      default: payment_status.unpaid,
    },
    payable_name: {
      type: String,
      required: [false, "payable name is not required"],
    },
    payable_email: {
      type: String,
      required: [false, "payable email is not required"],
    },
    payment_intent: {
      type: String,
      required: [false, "payment intent is not required"],
    },
    country: {
      type: String,
      required: [false, "country is not required"],
    },

    isDelete: {
      type: Boolean,
      required: [false, "isDelete not requirted"],
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
    },
  }
);



// midlewere
TPaymentGateWaySchema.pre("find", function (next) {
  this.find({ isDelete: { $ne: true } });
  next();
});

TPaymentGateWaySchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { isDelete: { $ne: true } } });
  next();
});

TPaymentGateWaySchema.pre("findOne", function (next) {
  this.findOne({ isDelete: { $ne: true } });
  next();
});

// Static method
TPaymentGateWaySchema.statics.isPaymentGateWayExistByCustomId =
  async function (id: string) {
    return this.findOne({ _id: id });
  };
const paymentgateways = model<TStripePaymentGateWay, PaymentGateWayModel>(
  "paymentgateways",
TPaymentGateWaySchema
);

export default paymentgateways;

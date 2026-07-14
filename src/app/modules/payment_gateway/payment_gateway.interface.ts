
import { Model, Types } from "mongoose";

export interface TStripePaymentGateWay {
  userId: Types.ObjectId;
  eventId?: Types.ObjectId;
  price: Number;
  ticketCount:Number;
  description?: String;
  currency?: String;
  sessionId?: String;
  paymentmethod?: "card" | "cash";
  payment_status?: "unpaid" | "paid";
  payable_name?: String;
  payable_email?: String;
  payment_intent?: String;
  country?: String;
  isDelete?: Boolean;
}
export interface PaymentGateWayModel extends Model<TStripePaymentGateWay> {

  isPaymentGateWayExistByCustomId(id: string): Promise<TStripePaymentGateWay>;
}
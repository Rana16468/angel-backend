import { Model } from "mongoose";

export type TPointActionType = "comment" | "photo" | "video" | "redemption" | "custom";

export interface TPointSystem {
  userId: string;
  eventId: string;
  actionType: TPointActionType;
  point: number;
  ticketCashPrice?: number;
  ticketPointsPrice?: number;
  discountAmount?: number;
  cashPaid?: number;
  description?: string;
  isDelete: boolean;
}

export interface PointSystemModel extends Model<TPointSystem> {
  isPointSystemCustomId(id: string): Promise<TPointSystem>;
}


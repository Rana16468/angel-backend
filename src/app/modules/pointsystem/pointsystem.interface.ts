import { Model } from "mongoose";

export interface TPointSystem {
     userId:string;
     eventId:string;
     point:number;
     isDelete: boolean;
};
export interface PointSystemModel extends Model<TPointSystem> {
  isPointSystemCustomId(id: string): Promise<TPointSystem>;
}
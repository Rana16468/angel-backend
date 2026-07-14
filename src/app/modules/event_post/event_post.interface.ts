import { Model, Types } from "mongoose";

export interface TEvent_Post {
  eventId: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
  caption: string;
  tag_people: Types.ObjectId[];
  react?:Number;
  comment?:Number;
  share?:Number;
  followup?:Number;
  isDelete:boolean;


}

export interface EventPostModel extends Model<TEvent_Post> {
  isEventPostCustomId(id: string): Promise<TEvent_Post>;
}

export interface EventPostResponse {
  status: boolean;
  message: string;
};
 
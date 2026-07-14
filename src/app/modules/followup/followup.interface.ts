import { Model, Types } from "mongoose";

export interface TFollowup {

     eventpostId: Types.ObjectId;
     userId: Types.ObjectId;
     eventId?: Types.ObjectId;
     followupId:Types.ObjectId;
     isFollowUp: Boolean;
     isBlock: Boolean;
     isDelete:Boolean;
     

};

export interface FollowupModel extends Model<TFollowup> {
  isFollowupCustomId(id: string): Promise<TFollowup>;
}

export interface FollowupResponse {
  status: boolean;
  message: string;
};
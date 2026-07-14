import { Model, Types } from "mongoose";

export interface TSupport {
    name :String
    email:String;
    subject:String;
    userId: Types.ObjectId
    isSolve: Boolean;
    message:String;
    isDelete:Boolean;

}

export interface SupportModel extends Model<TSupport> {
  isSupportCustomId(id: string): Promise<TSupport>;
};


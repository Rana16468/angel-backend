import { Model, Types } from "mongoose";

export interface TJoinGroup {
  eventId: Types.ObjectId;
  hostId: Types.ObjectId;
  groupName: String;
  totalMember: Number;
  chatRoomId: Types.ObjectId;
  photo:String;
  userList?:String[]
  isDelete: Boolean;
}

export interface JoinGroupModel extends Model<TJoinGroup> {
  isJoinGroupCustomId(id: string): Promise<TJoinGroup>;
}

export interface JoinGroupResponse {
  status: boolean;
  message: string;
}

export interface TJoinUser {
  eventId: Types.ObjectId;
  eventGroupId: Types.ObjectId;
  userId: Types.ObjectId;
  isJoin:Boolean;
  isDelete: Boolean;
}

export interface JoinUserModel extends Model<TJoinUser> {
  isJoinUserCustomId(id: string): Promise<TJoinUser>;
}

export interface JoinUseResponse {
  status: boolean;
  message: string;
}

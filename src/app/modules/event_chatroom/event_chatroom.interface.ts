import { Model, Types } from "mongoose";

export interface TChatRoom {
  eventId: Types.ObjectId;
  hostId: Types.ObjectId;
  chatRoomName: String;
  totalMember: Number;
  photo:String;
  isDelete: Boolean;
}

export interface ChatRoomModel extends Model<TChatRoom> {
  isChatRoomCustomId(id: string): Promise<TChatRoom>;
};



export interface TChatRoomUser {
  eventId: Types.ObjectId;
  eventChatRoomId: Types.ObjectId;
  userId: Types.ObjectId;
  isDelete: Boolean;
}

export interface ChatRoomUserModel extends Model<TChatRoomUser> {
  isChatRoomUserCustomId(id: string): Promise<TChatRoomUser>;
}

export interface ChatRoomUseResponse {
  status: boolean;
  message: string;
}

import { Model, Types } from "mongoose";

export interface TReply {
  userId: Types.ObjectId;
  commentEventPostId:Types.ObjectId;
  comment: string;
  isDelete: boolean;
};

export interface ReplyEventPostModel extends Model<TReply> {
  isReplyEventPostCustomId(id: string): Promise<TReply | null>;
};

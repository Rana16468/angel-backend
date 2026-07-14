import { Model, Types } from "mongoose";

export interface TSocialFeed {
      userId: Types.ObjectId;
      message:string;
      content:string;
      isDelete:Boolean;
};

export interface SocialFeedModel extends Model<TSocialFeed> {
  isSocialFeedCustomId(id: string): Promise<TSocialFeed>;
}

export interface SocialFeedResponse {
  status: boolean;
  message: string;
};
export interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}
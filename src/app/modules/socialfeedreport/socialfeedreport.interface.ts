import { Model, Types } from "mongoose";



export interface TSocialFeedReport {
    userId:Types.ObjectId;
    event_postId:Types.ObjectId;
    reason:string;
    details:string;
    isDelete:boolean;
};

export interface SocialFeedReportModel extends Model<TSocialFeedReport> {
  isSocialFeedReportCustomId(id: string): Promise<TSocialFeedReport>;
};




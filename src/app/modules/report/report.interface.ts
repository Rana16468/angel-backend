import { Model, Types } from "mongoose";

export interface TReport {
     userId:Types.ObjectId;
     category:'Traffic' | 'Lost Item' | 'Queue' |  'Other' 
     description:String;
     photo:String;
     location:String;
     isLike:Number;
     isComment:Number;
     isDelete:Boolean;
};

export interface ReportModel extends Model<TReport> {
  isReportCustomId(id: string): Promise<TReport>;
};

export interface RequestWithFile extends Request {
  file?: Express.Multer.File;
};

export interface TReportLike {
      userId:Types.ObjectId;
      reportId: Types.ObjectId;
      isLike:Boolean;
      isDelete: Boolean;
}

export interface ReportLikeModel extends Model<TReportLike> {
  isReportLikeCustomId(id: string): Promise<TReportLike>;
};



export interface ReportResponse {
  status: boolean;
  message: string;
};



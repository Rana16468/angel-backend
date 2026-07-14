import { Schema, model, Types } from "mongoose";
import { ReportLikeModel, ReportModel, TReport, TReportLike } from "./report.interface";

const TReportSchema = new Schema<TReport, ReportModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "users", required: [true, "userId is required"] },

    category: {
      type: String,
      enum: ["Traffic", "Lost Item", "Queue", "Other"],
      required: [true, "category is required"],
    },

    description: { type: String, required: [true, "description is required"] },

    photo: { type: String, required: false },

    location: { type: String, required: [true, "location is required"] },
    isLike:{type:Number, required:[false, 'is like  not required'], default:0},
    isComment:{type:Number, required:[false ,'is comment not required'], default:0},
    isDelete: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);


TReportSchema.pre("find", function (next) {
  this.find({ isDelete: { $ne: true } });
  next();
});

TReportSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { isDelete: { $ne: true } } });
  next();
});

TReportSchema.pre("findOne", function (next) {
  this.where({ isDelete: { $ne: true } });
  next();
});


TReportSchema.statics.isReportCustomId = async function (id: string) {
  return this.findById(id).exec();
};

 const reports = model<TReport, ReportModel>("reports", TReportSchema);

 export default reports;

 // report like  --- schema 

 const TReportLikeSchema = new Schema<TReportLike, ReportLikeModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: [true, 'userId is required'],
      index:true,
      ref: "users",
    },
    reportId: {
      type: Schema.Types.ObjectId,
      required: [true, 'reportId is required'],
      index:true,
      ref: "reports",
    },
    isLike: {
      type: Boolean,
      required:[false ,'isLike is not required'],
      default: false,
    },
    isDelete: {
      type: Boolean,
       required:[false ,'isDelete is not required'],
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

TReportLikeSchema.pre("find", function (next) {
  this.find({ isDelete: { $ne: true } });
  next();
});

TReportLikeSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { isDelete: { $ne: true } } });
  next();
});

TReportLikeSchema.pre("findOne", function (next) {
  this.where({ isDelete: { $ne: true } });
  next();
});


TReportLikeSchema .statics.isReportLikeCustomId = async function (
  id: string
): Promise<TReportLike | null> {
  return this.findById(id);
};

export const reportlikes = model<TReportLike, ReportLikeModel>(
  "reportlikes",
TReportLikeSchema 
);



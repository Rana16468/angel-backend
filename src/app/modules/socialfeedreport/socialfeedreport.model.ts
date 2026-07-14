import { Schema, model, Model, Types } from "mongoose";
import { SocialFeedReportModel, TSocialFeedReport } from "./socialfeedreport.interface";


const TSocialFeedReportSchema = new Schema<TSocialFeedReport>(
  {
    userId: {
      type:  Schema.Types.ObjectId,
      ref: "users", 
      required: true,
      indexe:true
    },
    event_postId: {
      type:  Schema.Types.ObjectId,
      ref: "eventposts", 
      required: true,
      index:true
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: String,
      required: false,
      trim: true,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, 
  }
);


// middlewere
TSocialFeedReportSchema.pre('find', function (next) {
  this.find({ isDelete: { $ne: true } });
  next();
});

TSocialFeedReportSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDelete: { $ne: true } } });
  next();
});

TSocialFeedReportSchema.pre('findOne', function (next) {
  this.findOne({ isDelete: { $ne: true } });
  next();
});




TSocialFeedReportSchema.statics.isSocialFeedReportCustomId = async function (
  id: string
) {
  const report = await this.findById(id);
  return report;
};

const socialfeedreports = model<TSocialFeedReport, SocialFeedReportModel>(
  "socialfeedreports",
  TSocialFeedReportSchema
);

export default socialfeedreports;

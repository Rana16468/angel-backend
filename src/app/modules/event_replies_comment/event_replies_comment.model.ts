import { Schema, model, Types } from "mongoose";
import { ReplyEventPostModel, TReply } from "./event_replies_comment.interface";
import { TEvent_Post } from "../event_post/event_post.interface";


const TReplyEventPostSchema = new Schema<TReply, ReplyEventPostModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users", 
      required: [true  , 'userId is required'],
    },
    commentEventPostId: {
      type: Schema.Types.ObjectId,
      ref: "commanteventposts",
      required: [true, 'commentEventPostId is required'],
    },
    comment: {
      type: String,
      required: true,
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

TReplyEventPostSchema.pre("find", function (next) {
  this.find({ isDelete: { $ne: true } });
  next();
});

TReplyEventPostSchema.pre("findOne", function (next) {
  this.findOne({ isDelete: { $ne: true } });
  next();
});

TReplyEventPostSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { isDelete: { $ne: true } } });
  next();
});

TReplyEventPostSchema.statics.isEventPostCustomId = async function (
  id: string
): Promise<TEvent_Post | null> {
  return this.findOne({ _id: id });
};

TReplyEventPostSchema.statics.isReplyEventPostCustomId = async function (
  id: string
): Promise<TReply | null> {
  return this.findById(id).exec();
};


 const replyeventposts = model<TReply, ReplyEventPostModel>(
  "replyeventposts",
TReplyEventPostSchema
);

export default replyeventposts;

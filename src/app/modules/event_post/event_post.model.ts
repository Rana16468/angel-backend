import { Schema, model } from "mongoose";
import { EventPostModel, TEvent_Post } from "./event_post.interface";

const TEventPostSchema = new Schema<TEvent_Post, EventPostModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: [true, "thrillseekersId is required"],
    },
    eventId:{
     type: Schema.Types.ObjectId,
     ref: "events",
     required: [false, "thrillseekersId is required"],
    },
    content: {
      type: String,
      required: [false, "content is not required"],
      trim: true,
    },
    caption: {
      type: String,
      required: [false, "caption is not  required"],
      trim: true,
    },
    tag_people: {
      type: [Schema.Types.ObjectId], required:[false, 'tag people is not required'],
      ref: "users", 
      default: [],
    },
     react:{
      type:Number,
      required:[false, 'react is not required'],
      default:0

     },
     comment:{
      type:Number,
      required:[false, 'comment is not required'],
       default:0
     },
      share:{
        type:Number, 
        required:[false, 'share is not required'], 
        default:0
      },
       followup:{
        type:Number,
        required:[false ,' followup is not required'],
        default:0,
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


// --- Hooks: always exclude soft-deleted docs
TEventPostSchema.pre("find", function (next) {
  this.find({ isDelete: { $ne: true } });
  next();
});

TEventPostSchema.pre("findOne", function (next) {
  this.findOne({ isDelete: { $ne: true } });
  next();
});

TEventPostSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { isDelete: { $ne: true } } });
  next();
});

// --- Static method
TEventPostSchema.statics.isEventPostCustomId = async function (
  id: string
): Promise<TEvent_Post | null> {
  return this.findOne({ _id: id });
};

// --- Model
const eventposts = model<TEvent_Post, EventPostModel>(
  "eventposts",
  TEventPostSchema
);

export default eventposts;

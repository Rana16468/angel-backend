import { Schema, model, Types } from "mongoose";
import { SocialFeedModel, TSocialFeed } from "./social_feed.interface";


// Define Schema
const TSocialFeedSchema = new Schema<TSocialFeed, SocialFeedModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "users", required: [true , ' userId is required'] },
    message: { type: String, required: [false , 'message  is not required'], trim: true },
    content: { type: String, required: [false , 'content is not required'], trim: true },
    isDelete: { type: Boolean, required:[false , 'isDelete is not required'], default: false },
  },
  {
    timestamps: true, 
  }
);

TSocialFeedSchema.pre("find", function (next) {
  this.find({ isDelete: { $ne: true } });
  next();
});

TSocialFeedSchema.pre("findOne", function (next) {
  this.findOne({ isDelete: { $ne: true } });
  next();
});

TSocialFeedSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { isDelete: { $ne: true } } });
  next();
});

TSocialFeedSchema.statics.isSocialFeedCustomId = async function (
  id: string
): Promise<TSocialFeed | null> {
  return this.findById(id).lean();
};


 const socialfeeds= model<TSocialFeed, SocialFeedModel>(
  "socialfeeds",
  TSocialFeedSchema
);


 export default socialfeeds;

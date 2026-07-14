import { Schema, model, Types } from "mongoose";
import { CommantEventPostModel, LiveEventCommentModel, ReactEventPostModel, ShareEventCommentModel, TCommantEventPost, TLiveEventComment, TReactEventPost, TShareEventComment } from "./react_event_post.interface";


const TreactEventPostSchema = new Schema<TReactEventPost, ReactEventPostModel>(
  {
    eventpostId: {
      type: Schema.Types.ObjectId,
      ref: "eventposts", 
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users", 
      required: true,
    },
    isReact:{
        type: Boolean,
        required:[true ,'isReact is required'],
        default:false

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

TreactEventPostSchema.pre("find", function (next) {
  this.find({ isDelete: { $ne: true } });
  next();
});

TreactEventPostSchema.pre("findOne", function (next) {
  this.findOne({ isDelete: { $ne: true } });
  next();
});

TreactEventPostSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { isDelete: { $ne: true } } });
  next();
});


TreactEventPostSchema.statics.isReactEventPostCustomId = async function (
  id: string
): Promise<TReactEventPost | null> {
  return this.findOne({ _id: id, isDelete: false });
};

 const reacteventposts= model<TReactEventPost, ReactEventPostModel>(
  "reacteventposts",
 TreactEventPostSchema
);

export default reacteventposts;







const TcommantEventPostSchema = new Schema<TCommantEventPost, CommantEventPostModel>(
  {
    eventpostId: {
      type: Schema.Types.ObjectId,
      ref: "eventposts",
      required: [true, "eventpostId is required"],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: [true, "userId is required"],
    },
    comment: {
      type: String,
      required: [true, "commant is required"],
      trim: true,
    },
    isDelete: {
      type: Boolean,
      required:[false , 'isDelete is not  required'],
      default: false,
    }
   
  },
  {
    timestamps: true, 
  }
);

TcommantEventPostSchema.pre("find", function (next) {
  this.find({ isDelete: { $ne: true } });
  next();
});

TcommantEventPostSchema.pre("findOne", function (next) {
  this.findOne({ isDelete: { $ne: true } });
  next();
});

TcommantEventPostSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { isDelete: { $ne: true } } });
  next();
});


TcommantEventPostSchema.statics.isCommentEventPostCustomId = async function (
  id: string
): Promise<TCommantEventPost | null> {
  return this.findOne({ _id: id, isDelete: false });
};

export const commanteventposts = model<TCommantEventPost, CommantEventPostModel>(
  "commanteventposts",
  TcommantEventPostSchema
);



const TLiveEventCommentSchema = new Schema<TLiveEventComment>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'events',
      index:true,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      index:true,
      required: true,
    },
    comments: {
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
  },
);


TLiveEventCommentSchema.pre("find", function (next) {
  this.find({ isDelete: { $ne: true } });
  next();
});

TLiveEventCommentSchema.pre("findOne", function (next) {
  this.findOne({ isDelete: { $ne: true } });
  next();
});

TLiveEventCommentSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { isDelete: { $ne: true } } });
  next();
});


TcommantEventPostSchema.statics.isCommentEventPostCustomId = async function (
  id: string
): Promise<TCommantEventPost | null> {
  return this.findOne({ _id: id, isDelete: false });
};


TLiveEventCommentSchema.statics.isTLiveEventCommentCustomId = async function (
  id: string,
): Promise<TLiveEventComment | null> {
  return this.findById(id);
};


export const liveeventcomments = model<TLiveEventComment, LiveEventCommentModel>(
  'liveeventcomments',
  TLiveEventCommentSchema,
);



// 🔹 Define the schema
const TShareEventCommentSchema = new Schema<TShareEventComment>(
  {
    eventpostId: {
      type:Schema.Types.ObjectId,
      ref: "eventposts", // adjust collection name if different
      required: true,
      index:true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users", // adjust collection name if different
      required: true,
      index:true
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



TShareEventCommentSchema.pre("find", function (next) {
  this.find({ isDelete: { $ne: true } });
  next();
});

TShareEventCommentSchema.pre("findOne", function (next) {
  this.findOne({ isDelete: { $ne: true } });
  next();
});

TShareEventCommentSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { isDelete: { $ne: true } } });
  next();
})

TShareEventCommentSchema.statics.isTShareEventCommentCustomId = async function (
  id: string
): Promise<TShareEventComment | null> {
  return this.findById(id);
};


const liveEmojiSchema = new Schema(
  {
    eventId: {
      type: Types.ObjectId,
      ref: "Event",
      required: true,
    },
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    emoji: {
      type: String, // ❤️ 😂 🔥 👍 etc.
      required: true,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const liveemojireactions = model(
  "LiveEmojiReaction",
  liveEmojiSchema
);

// 🔹 Create the model
export const shareeventcomments = model<TShareEventComment, ShareEventCommentModel>(
  "shareeventcomments",
  TShareEventCommentSchema
);



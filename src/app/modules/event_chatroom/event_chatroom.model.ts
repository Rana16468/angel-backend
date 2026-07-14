import { Schema, model } from "mongoose";
import {
  TChatRoom,
  ChatRoomModel,
  TChatRoomUser,
  ChatRoomUserModel,
} from "./event_chatroom.interface";

const ChatRoomSchema = new Schema<TChatRoom, ChatRoomModel>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "events",
      required: [false, "eventId is required"],
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: [true, "userId is required"],
    },
    chatRoomName: {
      type: String,
      required: [true, "chat room name is required"],
      unique:true, 
      trim: true,
    },
    totalMember: {
      type: Number,
      default: 0,
      min: [0, "totalMember cannot be negative"],
    },
    photo:{
      type: String,
      required:[false, 'photo is not required'],
      default: null
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

ChatRoomSchema.pre("find", function (next) {
  this.find({ isDelete: { $ne: true } });
  next();
});

ChatRoomSchema.pre("findOne", function (next) {
  this.findOne({ isDelete: { $ne: true } });
  next();
});

ChatRoomSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { isDelete: { $ne: true } } });
  next();
});

ChatRoomSchema.statics.isChatRoomCustomId = async function (
  id: string
): Promise<TChatRoom | null> {
  return this.findById(id);
};

const chatrooms = model<TChatRoom, ChatRoomModel>("chatrooms", ChatRoomSchema);

export default chatrooms;

const TChatRoomUserSchema = new Schema<TChatRoomUser, ChatRoomUserModel>(
  {
    eventChatRoomId: {
      type: Schema.Types.ObjectId,
      ref: "chatrooms",
      required: [true, "eventChatRoomId is required"], // ✅ fixed message
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "events",
      required: [true, "eventId is required"],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: [true, "userId is required"],
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

// Filters out deleted docs automatically
TChatRoomUserSchema.pre("find", function (next) {
  this.find({ isDelete: { $ne: true } });
  next();
});

TChatRoomUserSchema.pre("findOne", function (next) {
  this.findOne({ isDelete: { $ne: true } });
  next();
});

TChatRoomUserSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { isDelete: { $ne: true } } });
  next();
});


TChatRoomUserSchema.statics.isJoinUserCustomId = async function (
  id: string
): Promise<TChatRoomUser | null> {
  return this.findById(id);
};

export const chatroomusers = model<TChatRoomUser, ChatRoomUserModel>(
  "chatroomusers",
  TChatRoomUserSchema
);
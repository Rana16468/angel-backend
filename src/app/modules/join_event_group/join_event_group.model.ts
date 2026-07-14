import { Schema, model } from "mongoose";
import {
  JoinGroupModel,
  JoinUserModel,
  TJoinGroup,
  TJoinUser,
} from "./join_event_group.interface";

// Define Schema
const TJoinGroupSchema = new Schema<TJoinGroup, JoinGroupModel>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "events",
      required: [false, "eventId is required"],
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      index:true,
      required: [true, "userId is required"],
    },
    groupName: {
      type: String,
      required: [true, "group name is required"],
      unique:true,
      trim: true,
    },
    totalMember: {
      type: Number,
      required: [false, "total member is required"],
      default: 0,
    },
    chatRoomId:{
      type: Schema.Types.ObjectId,
      ref:"chatrooms",
      required:[true , 'chat room is  not required']

    },
    photo:{

      type: String,
      required:[false , 'photo is not required'],
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

TJoinGroupSchema.pre("find", function (next) {
  this.find({ isDelete: { $ne: true } });
  next();
});

TJoinGroupSchema.pre("findOne", function (next) {
  this.findOne({ isDelete: { $ne: true } });
  next();
});

TJoinGroupSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { isDelete: { $ne: true } } });
  next();
});

TJoinGroupSchema.statics.isJoinGroupCustomId = async function (
  id: string
): Promise<TJoinGroup | null> {
  return this.findById(id);
};

const joingroups = model<TJoinGroup, JoinGroupModel>(
  "joingroups",
  TJoinGroupSchema
);

export default joingroups;

const TJoinUserSchema = new Schema<TJoinUser, JoinUserModel>(
  {
    eventGroupId: {
      type: Schema.Types.ObjectId,
      ref: "joingroups",
      required: [true, "event group Id is Required"],
      index:true
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "events",
      required: [false, "eventId is required"],
      index:true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      index:true,
      required: [true, "userId is required"],
    },
    isJoin:{
      type:Boolean,
      required:[false, 'is Join is not required'],
      default:true
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

TJoinUserSchema.pre("find", function (next) {
  this.find({ isDelete: { $ne: true } });
  next();
});

TJoinUserSchema.pre("findOne", function (next) {
  this.findOne({ isDelete: { $ne: true } });
  next();
});

TJoinUserSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { isDelete: { $ne: true } } });
  next();
});

TJoinUserSchema.statics.isJoinUserCustomId = async function (
  id: string
): Promise<TJoinUser | null> {
  return this.findById(id);
};

export const joinusers = model<TJoinUser, JoinUserModel>(
  "joinusers",
  TJoinUserSchema
);

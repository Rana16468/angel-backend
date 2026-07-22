import mongoose, { Schema, Document, Model, Types } from "mongoose";
import {
  AudienceSettings,
  BaseEvent,
  EventLocation,
  EventModel,
  NotificationSettings,
  PointSystem,
  SocialMedia,
  VenueFacility,
} from "./event.interface";
import {
  EventCategoryConstant,
  EventFeaturesConstant,
  ticketPriceConstant,
  VenueFacilityConstant,
  visibilityConstant,
} from "./event.constant";

const VenueFacilitySchema = new Schema<VenueFacility>(
  {
    type: {
      type: String,
      enum: VenueFacilityConstant,
      required: false,
    },
    available: { type: Boolean, required: false },
    description: { type: String, required: false},
  },
  { _id: true }
);

const SocialMediaSchema = new Schema<SocialMedia>(
  {
    content: { type: Boolean },
    gallery: { type: Boolean },
    sharing: { type: Boolean },
    streaming: { type: Boolean },
  },
  { _id: true }
);

const NotificationSchema = new Schema<NotificationSettings>(
  {
    livechat: { type: Boolean },
    push_notifications: { type: Boolean },
    event_countdown: { type: Boolean },
  },
  { _id: true }
);

const PointSystemSchema = new Schema<PointSystem>(
  {
    people: { type: Number, required: true },
    point: { type: Number, required: true },
  },
  { _id: true }
);

const EventLocationSchema = new Schema<EventLocation>(
  {
    lat: { type: String, required: true },
    lon: { type: String, required: true },
  },
  { _id: true }
);

const AudienceSettingsSchema = new Schema<AudienceSettings>(
  {
    age: { type: Schema.Types.Mixed, required: true, index:true },
    max_capacity: { type: Number, required: true },
    visibility: { type: String, enum: visibilityConstant, required: true, index:true },
    email: {
      type: String,
      required:false
      
    
    },
    social_media: { type: SocialMediaSchema },
    notification: { type: NotificationSchema },
    point_system: { type: PointSystemSchema, required: true },
    ticket_price: { type: String, enum: ticketPriceConstant, required: true, index:true },
    price: {
      type: Number,
      index:true,
      required: function (this: AudienceSettings) {
        return this.ticket_price === "paid";
      },
      validate: {
        validator: function (this: AudienceSettings, v: number) {
          if (this.ticket_price === "free" && v) return false;
          return true;
        },
        message: "Price must only exist if ticket_price is 'paid'",
      },
    },
    event_location: { type: EventLocationSchema, required: true },
  },
  { _id: true }
);

const TEventSchema = new Schema<BaseEvent, EventModel>(
  {
    hostId: {
      type: Schema.Types.ObjectId,
      ref:"users",
      required: true,
    },
    event_title: { type: String, required: true },
    description: { type: String, required: true },
    photo: { type: String },
    date: { type: String, required: true, index:true },
    starting_time: { type: String, required: true },
    ending_time: { type: String, required: true },
    venue_facilities: { type: [VenueFacilitySchema], default: [] },
    event_category: {
      type: String,
      enum: EventCategoryConstant,
      required: true,
      index:true
    },
    event_features: {
      type: String,
      enum: EventFeaturesConstant,
      required: true,
    },
    audience_settings: { type: AudienceSettingsSchema, required: true },
    emailList: { type: [String], default: [],index:true },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

TEventSchema.pre("find", function (next) {
  this.find({ isDelete: { $ne: true } });
  next();
});

TEventSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { isDelete: { $ne: true } } });
  next();
});

TEventSchema.pre("findOne", function (next) {
  this.findOne({ isDelete: { $ne: true } });
  next();
});

// added event model
TEventSchema.statics.isEventCustomId = async function (id: string) {
  return await events.findOne({ id });
};
const events = mongoose.model<BaseEvent, EventModel>("events", TEventSchema);
export default events;

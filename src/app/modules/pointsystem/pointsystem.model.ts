import { Schema, model } from "mongoose";
import { PointSystemModel, TPointSystem } from "./pointsystem.interface";



const TPointSystemSchema = new Schema<TPointSystem, PointSystemModel>(
  {
    userId: {
      type: String,
      required: [true, 'userId is required'],
      trim: true,
      index: true,
    },
    eventId: {
      type: String,
      required: [true, 'eventId is required'],
      trim: true,
      index: true,
    },
    actionType: {
      type: String,
      enum: ['comment', 'photo', 'video', 'redemption', 'custom'],
      default: 'custom',
      index: true,
    },
    point: {
      type: Number,
      required: [true, 'point is required'],
      default: 0,
    },
    ticketCashPrice: {
      type: Number,
      default: null,
    },
    ticketPointsPrice: {
      type: Number,
      default: null,
    },
    discountAmount: {
      type: Number,
      default: null,
    },
    cashPaid: {
      type: Number,
      default: null,
    },
    description: {
      type: String,
      default: null,
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



// midlewere
 TPointSystemSchema.pre("find", function (next) {
  this.find({ isDelete: { $ne: true } });
  next();
});

 TPointSystemSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { isDelete: { $ne: true } } });
  next();
});

 TPointSystemSchema.pre("findOne", function (next) {
  this.findOne({ isDelete: { $ne: true } });
  next();
});

 TPointSystemSchema .statics.isPointSystemCustomId = async function (id: string) {
  const result = await this.findById(id);
  return result;
};


const pointsystems = model<TPointSystem, PointSystemModel>(
  "pointsystems",
   TPointSystemSchema 
);

export default pointsystems;





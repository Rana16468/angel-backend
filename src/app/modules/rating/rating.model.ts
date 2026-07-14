import { Schema, model, Types } from "mongoose";
import { RatingModel, TRating } from "./rating.interface";

const TRatingSchema = new Schema<TRating, RatingModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: [true ,'userId is required'],
      index:true
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "events",
      required: [true ,'eventId is required'],
      index:true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
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
 TRatingSchema.pre("find", function (next) {
  this.find({ isDelete: { $ne: true } });
  next();
});

 TRatingSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { isDelete: { $ne: true } } });
  next();
});

 TRatingSchema.pre("findOne", function (next) {
  this.findOne({ isDelete: { $ne: true } });
  next();
});


TRatingSchema.statics.isRatingCustomId = async function (id: string) {
  const rating = await this.findById(id);
  return rating;
};


const ratings = model<TRating, RatingModel>("ratings", TRatingSchema);

export default ratings;

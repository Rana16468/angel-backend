import { Schema, model } from "mongoose";
import { FavoriteEventModel, TFavoriteEvent } from "./favorite_event.interface";


const TFavoriteEventSchema = new Schema<TFavoriteEvent, FavoriteEventModel>({
   id :{ type: String, required: [false, "id is required"]},
    userId:{ type: Schema.Types.ObjectId,
      ref: "users",
      required: [false, "eventId is required"]},
  name: { type: String, required: [true, 'name is required'] },
  address: { type: String, required: [true , 'address is required'] },
  rating: { type: Number, required: [true , 'rating is required'] },
  totalRatings: { type: Number, required:  [true , 'total rating is required'] },
  location: {
    lat: { type: Number, required: [true , 'lat is required'] },
    lng: { type: Number, required: [true , 'lng is required'] },
  },
  placeId: { type: String, required: [false , 'placeId is required']},
  openNow: { type: Boolean, default: null },
  types: { type: [String], default: [] },
  image: { type: String, default: null },
  isReact:{type:Boolean, required:[false,'is React is not required'], default:false},
  isDelete:{type:Boolean, required:[false , 'is delete is not  required']}
},{
    timestamps:true
});


TFavoriteEventSchema.pre("find", function (next) {
  this.find({ isDelete: { $ne: true } });
  next();
});

TFavoriteEventSchema.pre("findOne", function (next) {
  this.findOne({ isDelete: { $ne: true } });
  next();
});

TFavoriteEventSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { isDelete: { $ne: true } } });
  next();
});


TFavoriteEventSchema.statics.isFavoriteEventCustomId = async function (
  id: string
) {
  return this.findOne({ placeId: id });
};

 const favoriteevents = model<TFavoriteEvent, FavoriteEventModel>(
  "favoriteevents",
  TFavoriteEventSchema
);
export default favoriteevents;

import { Schema, model, Model, Types, Document } from "mongoose";
import { StoreReactModel, TStoreReactProps } from "./stote_react.interface";


const StoreReactSchema = new Schema<TStoreReactProps, StoreReactModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "users", required: true , index: true},
    storeId: { type: Schema.Types.ObjectId, ref: "socialfeeds", required: true , index: true},
    isReact: { type: Boolean, default: false },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true }
);


StoreReactSchema.pre("find", function (next) {
  this.find({ isDelete: { $ne: true } });
  next();
});

StoreReactSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { isDelete: { $ne: true } } });
  next();
});

StoreReactSchema.pre("findOne", function (next) {
  this.findOne({ isDelete: { $ne: true } });
  next();
});




StoreReactSchema.statics.isStoreReactCustomId = async function (id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return this.findById(id).exec();
};




const storereacts = model<TStoreReactProps, StoreReactModel>(
  "storereacts",
  StoreReactSchema
);

export default storereacts;
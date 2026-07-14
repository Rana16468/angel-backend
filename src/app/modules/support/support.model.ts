import { Schema, model } from "mongoose";
import { SupportModel, TSupport } from "./support.interface";



const supportSchema = new Schema<TSupport, SupportModel>(
  {
    name: {
      type: String,
      required: [true , 'name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      lowercase: true,
      index:true,
      trim: true,
    },
    subject: {
      type: String,
      required: [true , 'subject is required'],
      trim: true,
    },
    isSolve:{
      type: Boolean,
      required:false ,
      default:false, 
      index:true
    }, 
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users", 
      index:true,
      required: [true  ,'userId is required'],
    },
    message: {
      type: String,
      required: [true , 'message is required'],
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true
  }
);

 supportSchema.pre("find", function (next) {
  this.find({ isDelete: { $ne: true } });
  next();
});

 supportSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { isDelete: { $ne: true } } });
  next();
});

 supportSchema.pre("findOne", function (next) {
  this.findOne({ isDelete: { $ne: true } });
  next();
});


supportSchema.statics.isSupportCustomId = async function (id: string) {
  return await this.findById(id);
};


 const supports = model<TSupport, SupportModel>(
  "supports",
  supportSchema
);

export default supports;
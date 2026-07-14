import { Schema, model } from "mongoose";
import { LovEemojiMemoriesEventModel, TLovEemojiMemoriesEvent, TUplodMemoriesEvent, UplodMemoriesEventModel } from "./upload_memories_event.interface";


const TUploadMemoriesEventSchema = new Schema<TUplodMemoriesEvent, UplodMemoriesEventModel>(
{
userId: {type: Schema.Types.ObjectId,ref: "users",required: [true , 'userId is required'],index: true,},
favoriteeventId:{type:Schema.Types.ObjectId, ref:"favoriteevents", required:[true , 'favoriteeventId is required']},
content: {type: String,required: [true ,'content is required'],trim: true,},
contentType: {type: String,enum: ["photo", "video"],required: [true , 'content Type is required'], index: true},
description: {type: String, required:[false , 'description is required'],trim: true},
isDelete: {type: Boolean,default: false},
isFavorite:{type:Number, require:[false, 'isFavorite not required'], default:0},
},
{
timestamps: true,
versionKey: false,
}
);

TUploadMemoriesEventSchema.pre("find", function (next) {
  this.find({ isDelete: { $ne: true } });
  next();
});

TUploadMemoriesEventSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { isDelete: { $ne: true } } });
  next();
});

TUploadMemoriesEventSchema.pre("findOne", function (next) {
  this.where({ isDelete: { $ne: true } });
  next();
});


TUploadMemoriesEventSchema.statics.isUploadMemoriesEventCustomId = async function (id: string) {
return this.findById(id);
};

export const uploadmemorieseventsnts = model<TUplodMemoriesEvent, UplodMemoriesEventModel>(
"uploadmemoriesevents",
TUploadMemoriesEventSchema
);





const TLovEemojiMemoriesEventSchema = new Schema<TLovEemojiMemoriesEvent, LovEemojiMemoriesEventModel>(
  {
    userId: { type:  Schema.Types.ObjectId, required: [true , 'userId is required'], ref: "users" },
    uploadMemorieSeventId: { type:  Schema.Types.ObjectId, required: [true , 'uploadmemoriesevents is required'], ref: "uploadmemoriesevents" },
    isLove:{type:Boolean, required:[false, 'is love is not   required'], default :true},
    isDelete: {type: Boolean,default: false},
  },
  {
    timestamps: true, 
  }
);

TLovEemojiMemoriesEventSchema.pre("find", function (next) {
  this.find({ isDelete: { $ne: true } });
  next();
});

TLovEemojiMemoriesEventSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { isDelete: { $ne: true } } });
  next();
});

TLovEemojiMemoriesEventSchema.pre("findOne", function (next) {
  this.where({ isDelete: { $ne: true } });
  next();
});


TLovEemojiMemoriesEventSchema.statics.isLovEemojiMemoriesEventModelCustomId = async function (id: string) {
  return this.findById(id).exec();
};


export const loveemojimemoriesevents = model<TLovEemojiMemoriesEvent, LovEemojiMemoriesEventModel>(
  "loveemojimemoriesevents",
 TLovEemojiMemoriesEventSchema
);

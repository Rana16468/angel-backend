import { model, Schema } from "mongoose";
import { FollowupModel, TFollowup } from "./followup.interface";


const TFollowupSchema = new Schema<TFollowup, FollowupModel>(
  {
    eventpostId: { type: Schema.Types.ObjectId, index:true, ref: "eventposts", required: [false , 'eventpostId is required'] },
    userId: { type: Schema.Types.ObjectId, index:true,  ref: "users", required: [true , 'userId is  requirted'] },
    followupId:{type:Schema.Types.ObjectId, index:true , ref:"users", required:[true , 'followupId is required']},
    isFollowUp:{type:Boolean, required:[false , 'isFollowUp is not required'], default:false},
    isBlock:{type:Boolean, required:[false ,'is Block is not required'], default: false},

    
    isDelete:{type:Boolean, required:[false, 'isDelete is not required'], default:false}
    
  },
  {
    timestamps: true,
  }
);

TFollowupSchema .pre("find", function (next) {
  this.find({ isDelete: { $ne: true } });
  next();
});

TFollowupSchema .pre("findOne", function (next) {
  this.findOne({ isDelete: { $ne: true } });
  next();
});

TFollowupSchema .pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { isDelete: { $ne: true } } });
  next();
});


TFollowupSchema.statics.isFollowupCustomId = async function (
  id: string
): Promise<TFollowup | null> {
  return this.findById(id);
};

 const followups = model<TFollowup, FollowupModel>("followups", TFollowupSchema);

 export default followups;


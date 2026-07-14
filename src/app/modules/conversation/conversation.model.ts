
import { model, Schema } from 'mongoose';
import { IConversation } from './conversation.interface';
import { CHAT_TYPE } from './conversation.constant';



const conversationSchema = new Schema<IConversation>(
  {
    eventId: {
      type:Schema.Types.ObjectId,
      required:[false,'eventId is required'],
      ref:"events",
      index:true
    },
    participants: {
      type: [Schema.Types.ObjectId],
      ref: 'users',
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'messages',
      default: null
    },
     chat:{
            type: String,
            index:true,
            enum: {
              values: [
                CHAT_TYPE.groupchat,
                CHAT_TYPE.singlechat
              ],
              message: "{VALUE} is Not Required",
            },
            required: [true, "chat  is not  Required"],
            default: CHAT_TYPE.groupchat,
          
     },
    isDelete:{
      type: Boolean,
      required:[false,'isDelete is not required'],
      default:false
    }
  },
  {
    timestamps: true,
  },
);




const conversations = model<IConversation>('conversations', conversationSchema);

export default conversations;
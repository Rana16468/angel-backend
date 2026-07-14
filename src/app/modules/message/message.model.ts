import mongoose, { model, Schema } from 'mongoose';
import { IMessage } from './message.interface';



const messageSchema = new Schema<IMessage>(
  {
    text: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: [String],
      default: [],
    },
    storyUrl:{
      type: String,
      required: false

    },
    audioUrl: {
     type: String,
     required: false,
     default: "",
    },
    seen: {
      type: Boolean,
      index:true,
      default: false,
    },
    msgByUserId: {
      type: mongoose.Schema.ObjectId,
      required: true,
      index:true,
      ref: 'users',
    },
    conversationId: {
      type: mongoose.Schema.ObjectId,
      required: true,
      index:true,
      ref: 'conversations',
    },
  },
  {
    timestamps: true,
    versionKey:false
  },
);

const messages = model<IMessage>('messages', messageSchema);

export default messages;

import { Model, Types } from "mongoose";



export interface TReactEventPost {
    eventpostId: Types.ObjectId;
    userId:Types.ObjectId;
    isReact:Boolean;
    isDelete:Boolean;

};

export interface ReactEventPostModel extends Model<TReactEventPost> {
  isReactEventPostCustomId(id: string): Promise<TReactEventPost>;
}

export interface ReactEventPostResponse {
  status: Boolean;
  message: String;
};

// export interface TReply {
//   userId: Types.ObjectId;
//   commant: string;
//   isDelete: boolean;
// }

export interface TCommantEventPost {
  eventpostId: Types.ObjectId;
  userId: Types.ObjectId;
      comment: string;
  isDelete: boolean;
  groupId?: Types.ObjectId;
  senderId?: Types.ObjectId;
  // replies?: TReply[];
}

export interface CommantEventPostModel extends Model<TCommantEventPost> {
  isCommentEventPostCustomId(id: string): Promise<TCommantEventPost | null>;
}

export interface  TLiveEventComment {
  eventId:Types.ObjectId;
  userId:Types.ObjectId;
   comments: string;
  isDelete: boolean;

};

export interface LiveEventCommentModel extends Model<TLiveEventComment> {
  isTLiveEventCommentCustomId(id: string): Promise<TLiveEventComment | null>;
}




export interface  TShareEventComment {
   eventpostId: Types.ObjectId;
  userId:Types.ObjectId; 
  isDelete: boolean;

};

export interface ShareEventCommentModel extends Model<TShareEventComment> {
  isTShareEventCommentCustomId(id: string): Promise<TShareEventComment | null>;
}



export interface CommantEventPostResponse {
  status: Boolean;
  message: String;
};


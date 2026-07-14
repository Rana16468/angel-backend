import { Model, Types } from "mongoose";




export interface TUplodMemoriesEvent {
     userId:Types.ObjectId;
     favoriteeventId:Types.ObjectId;
     content:String;
     contentType:'photo' | 'video';
     description:String,
     isFavorite:Number,
     isDelete:Boolean;
    
};

export interface UplodMemoriesEventModel extends Model<TUplodMemoriesEvent> {
  isUplodMemoriesEventustomId(id: string): Promise<TUplodMemoriesEvent>;
};

export interface UplodMemoriesEventResponse {
  status: boolean;
  message: string;
};
export interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}


export  interface TLovEemojiMemoriesEvent {

     userId:Types.ObjectId;
     uploadMemorieSeventId: Types.ObjectId;
     isLove:Boolean;
     isDelete:Boolean;
     
}
export interface LovEemojiMemoriesEventModel extends Model<TLovEemojiMemoriesEvent> {
  isLovEemojiMemoriesEventModelCustomId(id: string): Promise<TLovEemojiMemoriesEvent>;
};



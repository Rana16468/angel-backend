import { Model, Types } from "mongoose";

export interface TFavoriteEvent {
id:String;
 userId: Types.ObjectId;
  name: string;
  address: string;
  rating: number;
  totalRatings: number;
  location: {
    lat: number;
    lng: number;
  };
  placeId: string;
  openNow: boolean | null;
  types: string[];
  image: string | null;
  isDelete: boolean;
  isReact:Boolean;
};

export interface FavoriteEventModel extends Model<TFavoriteEvent> {
  isFavoriteEventCustomId(id: string): Promise<TFavoriteEvent>;
};
export interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}

export interface FavoriteEventResponse {
  status: boolean;
  message: string;
};

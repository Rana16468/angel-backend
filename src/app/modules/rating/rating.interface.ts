import { Model, Types } from "mongoose";


export interface TRating {

      userId:Types.ObjectId;
      eventId:Types.ObjectId;
      rating:number;
      isDelete:Boolean;
};
export interface RatingModel extends Model<TRating > {
  isRatingCustomId(id: string): Promise<TRating >;
}
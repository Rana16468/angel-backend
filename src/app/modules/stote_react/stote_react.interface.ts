import { Model, Types } from "mongoose";

export interface TStoreReactProps {
  userId: Types.ObjectId;
  storeId: Types.ObjectId;
  isReact: boolean;
  isDelete: boolean;
};

export interface StoreReactModel extends Model< TStoreReactProps> {
  isStoreReactCustomId(id: string): Promise< TStoreReactProps>;
}

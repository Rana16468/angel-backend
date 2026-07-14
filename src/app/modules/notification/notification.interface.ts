import { Model, Types } from 'mongoose';

export interface TNotification {
  userId?: Types.ObjectId;
  driverId?: Types.ObjectId;
  requestId?:Types.ObjectId;
  title: String;
  content: String;
  icon?: String;
  status: 'unread' | 'read';
  route?: String;
  priority: 'low' | 'medium' | 'high';
       senderId: Types.ObjectId;
     groupId?: Types.ObjectId;
  isDelete: Boolean
};


export interface TPushNotification {
  title:String;
  isNotification?: Boolean;


}

export interface NotificationResponse {
  status: boolean;
  message: string;
}

export interface NotificationModel extends Model<TNotification> {
  // eslint-disable-next-line no-unused-vars
  isNotification(id: string): Promise<TNotification>;
}




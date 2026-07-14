
import { USER_ACCESSIBILITY } from "../user/user.constant";
import users from "../user/user.model";
import status from "http-status";
import firebaseAdmin from "../../config/firebase";
import AppError from "../../errors/AppError";
import notifications, { pushnotifications } from "./notification.model";
import QueryBuilder from "../../builder/QueryBuilder";

const sendPushNotification = async (
  userId: string,
  data: {
    title: string;
    content: string;
    time?: Date;
  }
) => {
  try {
    const user = await users.findOne(
      {
        _id: userId,
        isVerify: true,
        isDelete: false,
        status: USER_ACCESSIBILITY.isProgress,
      },
      { fcm: 1 }
    );

    if (!user || !user.fcm) {
      throw new AppError(status.NOT_EXTENDED, "No FCM token found for user");
    }

    const timestamp = (data.time ?? new Date()).toISOString();

    const message = {
      notification: {
        title: data.title,
        body: data.content,
      },
      data: {
        userId: userId.toString(),
        timestamp,
      },
      token: user.fcm,
    };
   

    const response = await firebaseAdmin.messaging().send(message);
    console.log("✅ FCM Send Success:", response);
    return response;
  } catch (error: any) {
    console.error("🔥 FCM Error:", error);
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "issues by the firebase notification section",
      error
    );
  }
};

const specificUserNotificationListIntoDb = async (
  userId: string,
  query: Record<string, unknown>,
) => {
  try {
    const allNotificationQuery = new QueryBuilder(
      notifications
        .find({ userId }).populate([
          {
            path: "senderId",
            select: "photo name ",
          },
          
        ])
        .select('title content createdAt  groupId'),

      query,
    )
      .filter()
      .sort()
      .paginate()
      .fields();

    const driverNotification = await allNotificationQuery.modelQuery;
    const meta = await allNotificationQuery.countTotal();

    return { meta, driverNotification };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      'speciifc driver notification  server unavailable issues',
      error,
    );
  }
};

const findByUserNotificationIntoDb=async(userId:string)=>{

    try{

      return await users.findById(userId).select("pushNotification " );

    }
    catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      'speciifc driver notification  server unavailable issues',
      error,
    );
  }
}

const changeNotificationStatusIntoDb = async (
  userId: string,
  notificationId: string
) => {

  const user = await users.findOne(
    { _id: userId, "pushNotification._id": notificationId },
    { "pushNotification.$": 1 }
  ) as any;

  if (!user) {
    throw new Error("Notification not found");
  }

  const current = user.pushNotification[0].isNotification;

  const result = await users.findOneAndUpdate(
    {
      _id: userId,
      "pushNotification._id": notificationId,
    },
    {
      $set: {
        "pushNotification.$.isNotification": !current,   
      }
    },
    { new: true }
  );

  if (!result) {
    throw new AppError(status.NOT_EXTENDED,'issue updating notification');
  }

  return {
    status: true,
    message: "Successfully changed status"
  };
};
















const NotificationServices = {
  sendPushNotification,
  specificUserNotificationListIntoDb,
  findByUserNotificationIntoDb,
  changeNotificationStatusIntoDb 

  
};

export default NotificationServices;


import status from 'http-status';
import AppError from '../../errors/AppError';
import { TPointSystem } from './pointsystem.interface';
import pointsystems from './pointsystem.model';
import mongoose from 'mongoose';


const recordedPointSystemIntoDb = async (
  userId: string,
  payload: Partial<TPointSystem>
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { eventId } = payload;
    if (!eventId) {
      throw new AppError(status.BAD_REQUEST, "eventId is required", "");
    }

    const existingCount = await pointsystems.countDocuments({
      eventId,
      userId
    });

    //
    const point = existingCount < 5 ? 10 : 0;


    const alreadyGiven = await pointsystems.findOne({
      userId,
      eventId,
      isDelete: false,
    });

    if (alreadyGiven) {
      throw new AppError(
        status.CONFLICT,
        "You have already received points for this event",
        ""
      );
    }

    const newPointRecord = await pointsystems.create(
      [
        {
          userId,
          eventId,
          point,
          isDelete: false,
        },
      ],
      { session }
    );
    if(!newPointRecord){
        throw new AppError(status.NOT_EXTENDED,'issues by the new point record not extended')
    }

    await session.commitTransaction();
    session.endSession();

    return {
      status: true,
      message:
        point > 0
          ? true
          : false
      
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      error.message || "Server unavailable while recording point system",
      ""
    );
  }
};


 const findMyAveragePointSystemIntoDb = async (userId: string) => {
  try {
    const [result] = await pointsystems.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalPoints: { $sum: "$point" },
          totalEvents: { $sum: 1 },
          averagePoint: { $avg: "$point" },
        },
      },
    ]);

    if (!result) {
      return {
        success: true,
        message: "No points found for this user",
        data: { totalPoints: 0, totalEvents: 0, averagePoint: 0 },
      };
    }

    return {
      success: true,
      message: "Successfully found your average points",
      data: {
        totalPoints: result.totalPoints,
        totalEvents: result.totalEvents,
        averagePoint: Number(result.averagePoint.toFixed(2)),
      },
    };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      error.message || "Error while finding average points",
      ""
    );
  }
};


 



const PaymentSystemServices={
    recordedPointSystemIntoDb,
     findMyAveragePointSystemIntoDb
};

export default  PaymentSystemServices;
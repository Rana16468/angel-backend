import status from 'http-status';
import AppError from '../../errors/AppError';
import { TPointSystem } from './pointsystem.interface';
import pointsystems from './pointsystem.model';
import mongoose from 'mongoose';

const POINT_RULES_HTML = `<h2>1. Overview of Reward Points</h2>
<p>The Angel Event Platform rewards users for actively participating and attending community events. Points contribute directly to your platform standing and activity metrics.</p>

<h2>2. How to Earn Points</h2>
<p>Points are allocated based on verified event participation:</p>
<ul>
    <li><strong>Event Participation:</strong> Users earn <strong>10 reward points</strong> for each eligible event they participate in.</li>
    <li><strong>Activity Count Rule:</strong> Standard point earnings apply for your initial event participation records before reaching the threshold.</li>
    <li><strong>Eligible Roles:</strong> Both Event Hosts and Thrillseekers are eligible to receive reward points upon verified event completion.</li>
</ul>

<h2>3. Single Reward Restriction</h2>
<p>To ensure fair participation across the platform, the following rule is enforced:</p>
<ul>
    <li><strong>One Reward Per Event:</strong> A user can only receive reward points <strong>once</strong> for any specific event. Duplicate claims for the same event are restricted.</li>
    <li><strong>Soft Delete & Status Checks:</strong> Only active, non-deleted point records count towards your total reward metrics.</li>
</ul>

<h2>4. Average Points & Summary</h2>
<p>Your profile metrics dynamically compute and display:</p>
<ul>
    <li><strong>Total Points:</strong> The cumulative sum of all reward points earned across completed events.</li>
    <li><strong>Total Events:</strong> The count of verified events where points were successfully awarded.</li>
    <li><strong>Average Points:</strong> The calculated average points per event (rounded to 2 decimal places).</li>
</ul>

<h2>5. Inquiries & Support</h2>
<p>If you encounter any issues regarding point recording or eligibility, please reach out to our platform support team at <a href="mailto:support@angelevent.com">support@angelevent.com</a>.</p>`;


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

const findPointRulesIntoDb = async () => {
  return {
    pointRules: POINT_RULES_HTML,
  };
};

const PaymentSystemServices={
    recordedPointSystemIntoDb,
    findMyAveragePointSystemIntoDb,
    findPointRulesIntoDb,
};

export default  PaymentSystemServices;
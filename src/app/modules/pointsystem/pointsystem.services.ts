import status from 'http-status';
import AppError from '../../errors/AppError';
import { TPointActionType, TPointSystem } from './pointsystem.interface';
import pointsystems from './pointsystem.model';
import mongoose from 'mongoose';
import events from '../event/event.model';

const THRILLIO_POINT_RULES_HTML = `<h2>1. Overview</h2>
<p>Thrillio includes a points-based engagement and rewards system available to <strong>ThrillSeekers</strong> (attendees). Points are earned by engaging with events and can optionally be redeemed toward ticket purchases, entirely at each Host's discretion.</p>
<p>There is no platform-wide points-to-dollar exchange rate. Each Host independently sets the points price (if any) for their own tickets, alongside the ticket's standard cash price.</p>

<h2>2. Roles</h2>
<ul>
    <li><strong>Host:</strong> Event organizer. Sets ticket cash price and, optionally, a points price.</li>
    <li><strong>ThrillSeeker:</strong> Event attendee. Earns points through engagement and may redeem them toward tickets.</li>
</ul>

<h2>3. Earning Points</h2>
<p>ThrillSeekers earn points by submitting content related to a specific event, subject to per-person caps that apply per event (not lifetime):</p>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 15px 0;">
    <thead>
        <tr style="background-color: #f2f2f2;">
            <th>Action</th>
            <th>Points Earned</th>
            <th>Max Per Person, Per Event</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>Comment</strong></td>
            <td>0.5 pts</td>
            <td>5 comments (max 2.5 pts)</td>
        </tr>
        <tr>
            <td><strong>Photo</strong></td>
            <td>1 pt</td>
            <td>5 photos (max 5 pts)</td>
        </tr>
        <tr>
            <td><strong>Video</strong></td>
            <td>1.5 pts</td>
            <td>2 videos (max 3 pts)</td>
        </tr>
    </tbody>
</table>

<p><strong>Key Earning Rules:</strong></p>
<ul>
    <li>These caps reset per event — a ThrillSeeker can earn this same set of points again at a different event.</li>
    <li>Earned points are added to the ThrillSeeker's account-wide point balance and are no longer tied to the event where they were earned.</li>
    <li><strong>Display:</strong> The UI displays fractional point values (e.g., “12.5 points”). Points are not rounded for display.</li>
    <li><strong>Host-Specific Redemption Limit:</strong> Only the <strong>first 5 ThrillSeekers</strong>, per event, to redeem points at a given Host's event are eligible to do so. This cap resets for each new event.</li>
</ul>

<h2>4. Redeeming Points</h2>
<p>Hosts independently set a points price for their own tickets (optional, per ticket). A ticket with no points price set cannot be purchased with points.</p>
<ul>
    <li>Every points-enabled ticket must also have a cash price set. Points act as a discount mechanism against that cash price — not as a separate, standalone currency.</li>
    <li><strong>Partial redemption</strong> is allowed. A ThrillSeeker may apply any portion of their point balance toward a ticket and pay the remaining balance in cash.</li>
    <li>No minimum or maximum cap is enforced by Thrillio on what a Host can set as their ticket's points price.</li>
</ul>

<h3>4.1 Partial Redemption — Cash-Equivalent Formula</h3>
<p>The value of a point is derived implicitly from each individual ticket's cash price and points price:</p>
<p style="background-color: #f7f7f7; padding: 10px; border-left: 4px solid #ff4b6e; font-family: monospace;">
    Value per point (for this ticket) = Cash Price &divide; Points Price
</p>
<p><strong>Worked Example:</strong></p>
<ul>
    <li>A Host sets a ticket at $30 cash / 20 points &rarr; value per point = $30 &divide; 20 = $1.50.</li>
    <li>A ThrillSeeker with 12 points wants this ticket:</li>
    <li>Points cover: 12 &times; $1.50 = $18.00</li>
    <li>Remaining cash due: $30.00 &minus; $18.00 = $12.00</li>
</ul>
<p><strong>Rounding Rule:</strong> Round the cash-equivalent value to the nearest cent in the ThrillSeeker's favor (round down on amount owed).</p>

<h2>5. Financial Handling</h2>
<p>When a ThrillSeeker redeems points toward a ticket, the Host receives reduced revenue on that sale. The discount comes out of the Host's payout. Thrillio does not reimburse Hosts for point-based discounts. Points have no cash value and cannot be transferred or sold.</p>

<h2>6. Cancellations & Refunds</h2>
<ul>
    <li><strong>Host cancels the event:</strong> Any points redeemed toward that ticket are refunded in full back to the ThrillSeeker's point balance.</li>
    <li><strong>ThrillSeeker cancels:</strong> Follows Thrillio's standard refund policy. Points are refunded if the cash refund is granted under that policy.</li>
</ul>

<h2>7. Expiration</h2>
<p>Points never expire. There is no time-based decay or forfeiture of unused points.</p>`;

const ENGAGEMENT_POINT_RULES: Record<
  string,
  { pointsPerAction: number; maxCountPerEvent: number; maxTotalPoints: number }
> = {
  comment: { pointsPerAction: 0.5, maxCountPerEvent: 5, maxTotalPoints: 2.5 },
  photo: { pointsPerAction: 1.0, maxCountPerEvent: 5, maxTotalPoints: 5.0 },
  video: { pointsPerAction: 1.5, maxCountPerEvent: 2, maxTotalPoints: 3.0 },
};

const findPointRulesIntoDb = async (): Promise<string> => {
  return THRILLIO_POINT_RULES_HTML;
};

const recordEngagementPointIntoDb = async (
  userId: string,
  payload: { eventId: string; actionType: TPointActionType }
) => {
  const { eventId, actionType } = payload;
  if (!eventId) {
    throw new AppError(status.BAD_REQUEST, 'eventId is required', '');
  }

  const rule = ENGAGEMENT_POINT_RULES[actionType];
  if (!rule) {
    throw new AppError(
      status.BAD_REQUEST,
      `Invalid actionType. Must be 'comment', 'photo', or 'video'`,
      ''
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingRecords = await pointsystems.find(
      {
        userId,
        eventId,
        actionType,
        isDelete: false,
      },
      null,
      { session }
    );

    if (existingRecords.length >= rule.maxCountPerEvent) {
      throw new AppError(
        status.BAD_REQUEST,
        `You have reached the maximum ${actionType} points cap (${rule.maxTotalPoints} pts / ${rule.maxCountPerEvent} ${actionType}s) for this event.`,
        ''
      );
    }

    const earnedPoint = rule.pointsPerAction;

    const newRecord = await pointsystems.create(
      [
        {
          userId,
          eventId,
          actionType,
          point: earnedPoint,
          description: `Earned ${earnedPoint} pts for ${actionType} on event`,
          isDelete: false,
        },
      ],
      { session }
    );

    if (!newRecord || newRecord.length === 0) {
      throw new AppError(
        status.INTERNAL_SERVER_ERROR,
        'Failed to record engagement points',
        ''
      );
    }

    await session.commitTransaction();
    session.endSession();

    return {
      status: true,
      earnedPoint,
      actionType,
      currentActionCount: existingRecords.length + 1,
      maxActionCount: rule.maxCountPerEvent,
      message: `Successfully awarded ${earnedPoint} points for ${actionType}.`,
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      error.message || 'Points recording error',
      error
    );
  }
};

const calculateRedemptionIntoDb = async (
  userId: string,
  payload: {
    eventId: string;
    ticketCashPrice: number;
    ticketPointsPrice: number;
    pointsToRedeem: number;
  }
) => {
  const { eventId, ticketCashPrice, ticketPointsPrice, pointsToRedeem } = payload;

  if (ticketPointsPrice <= 0 || ticketCashPrice <= 0) {
    throw new AppError(
      status.BAD_REQUEST,
      'This ticket does not have points redemption enabled.',
      ''
    );
  }

  const eventRedeemerCount = await pointsystems.countDocuments({
    eventId,
    actionType: 'redemption',
    isDelete: false,
  });

  const remainingSlots = Math.max(0, 5 - eventRedeemerCount);
  if (remainingSlots <= 0) {
    return {
      eligible: false,
      reason: 'The first 5 points redemption limit has been reached for this event.',
      remainingRedeemerSlots: 0,
      cashDue: ticketCashPrice,
    };
  }

  const userPointStats = await pointsystems.aggregate([
    { $match: { userId, isDelete: false } },
    { $group: { _id: null, totalPoints: { $sum: '$point' } } },
  ]);

  const userBalance = userPointStats.length > 0 ? userPointStats[0].totalPoints : 0;

  if (userBalance < 0.1) {
    return {
      eligible: false,
      reason: 'You do not have enough points to redeem.',
      userBalance,
      cashDue: ticketCashPrice,
    };
  }

  const maxRedeemablePoints = Math.min(userBalance, ticketPointsPrice);
  const actualPointsToRedeem = Math.min(pointsToRedeem, maxRedeemablePoints);

  const valuePerPoint = ticketCashPrice / ticketPointsPrice;

  const discountAmount = Math.floor(actualPointsToRedeem * valuePerPoint * 100) / 100;
  const cashDue = Math.max(0, Math.round((ticketCashPrice - discountAmount) * 100) / 100);

  return {
    eligible: true,
    userBalance,
    pointsToRedeem: actualPointsToRedeem,
    valuePerPoint: Math.round(valuePerPoint * 10000) / 10000,
    discountAmount,
    cashDue,
    remainingRedeemerSlots: remainingSlots,
  };
};

const redeemPointsIntoDb = async (
  userId: string,
  payload: {
    eventId: string;
    ticketCashPrice: number;
    ticketPointsPrice: number;
    pointsToRedeem: number;
  }
) => {
  const { eventId, ticketCashPrice, ticketPointsPrice, pointsToRedeem } = payload;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const eventRedeemerCount = await pointsystems.countDocuments(
      {
        eventId,
        actionType: 'redemption',
        isDelete: false,
      },
      { session }
    );

    if (eventRedeemerCount >= 5) {
      throw new AppError(
        status.CONFLICT,
        'Point redemption is limited to the first 5 ThrillSeekers per event and is now closed.',
        ''
      );
    }

    const userPointStats = await pointsystems.aggregate(
      [
        { $match: { userId, isDelete: false } },
        { $group: { _id: null, totalPoints: { $sum: '$point' } } },
      ],
      { session }
    );

    const currentBalance = userPointStats.length > 0 ? userPointStats[0].totalPoints : 0;

    if (currentBalance < pointsToRedeem) {
      throw new AppError(
        status.BAD_REQUEST,
        `Insufficient points balance. You have ${currentBalance} points but tried to redeem ${pointsToRedeem}.`,
        ''
      );
    }

    const valuePerPoint = ticketCashPrice / ticketPointsPrice;
    const discountAmount = Math.floor(pointsToRedeem * valuePerPoint * 100) / 100;
    const cashPaid = Math.max(0, Math.round((ticketCashPrice - discountAmount) * 100) / 100);

    const redemptionRecord = await pointsystems.create(
      [
        {
          userId,
          eventId,
          actionType: 'redemption',
          point: -Math.abs(pointsToRedeem),
          ticketCashPrice,
          ticketPointsPrice,
          discountAmount,
          cashPaid,
          description: `Redeemed ${pointsToRedeem} points for $${discountAmount} ticket discount`,
          isDelete: false,
        },
      ],
      { session }
    );

    if (!redemptionRecord || redemptionRecord.length === 0) {
      throw new AppError(
        status.INTERNAL_SERVER_ERROR,
        'Failed to process point redemption',
        ''
      );
    }

    await session.commitTransaction();
    session.endSession();

    return {
      status: true,
      pointsRedeemed: pointsToRedeem,
      discountAmount,
      cashPaid,
      newPointBalance: Math.round((currentBalance - pointsToRedeem) * 10) / 10,
      message: `Successfully applied $${discountAmount} discount using ${pointsToRedeem} points.`,
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      error.message || 'Point redemption failed',
      error
    );
  }
};

const recordedPointSystemIntoDb = async (
  userId: string,
  payload: Partial<TPointSystem>
) => {
  return recordEngagementPointIntoDb(userId, {
    eventId: payload.eventId as string,
    actionType: (payload.actionType as TPointActionType) || 'comment',
  });
};

const findMyAveragePointSystemIntoDb = async (userId: string) => {
  try {
    const summary = await pointsystems.aggregate([
      { $match: { userId, isDelete: false } },
      {
        $group: {
          _id: null,
          totalPoints: { $sum: '$point' },
          totalEvents: { $addToSet: '$eventId' },
          totalRecords: { $sum: 1 },
          earnedPoints: {
            $sum: { $cond: [{ $gt: ['$point', 0] }, '$point', 0] },
          },
          redeemedPoints: {
            $sum: { $cond: [{ $lt: ['$point', 0] }, { $abs: '$point' }, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalPoints: { $round: ['$totalPoints', 2] },
          earnedPoints: { $round: ['$earnedPoints', 2] },
          redeemedPoints: { $round: ['$redeemedPoints', 2] },
          eventCount: { $size: '$totalEvents' },
          totalRecords: 1,
          avgPointsPerEvent: {
            $cond: [
              { $gt: [{ $size: '$totalEvents' }, 0] },
              {
                $round: [
                  { $divide: ['$totalPoints', { $size: '$totalEvents' }] },
                  2,
                ],
              },
              0,
            ],
          },
        },
      },
    ]);

    const result =
      summary.length > 0
        ? summary[0]
        : {
            totalPoints: 0,
            earnedPoints: 0,
            redeemedPoints: 0,
            eventCount: 0,
            totalRecords: 0,
            avgPointsPerEvent: 0,
          };

    return result;
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      error.message || 'Error while finding average points',
      ''
    );
  }
};

const PaymentSystemServices = {
  recordedPointSystemIntoDb,
  recordEngagementPointIntoDb,
  calculateRedemptionIntoDb,
  redeemPointsIntoDb,
  findMyAveragePointSystemIntoDb,
  findPointRulesIntoDb,
};

export default PaymentSystemServices;

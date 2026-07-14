import { status } from 'http-status';
import AppError from "../errors/AppError";
import { payment_status } from "../modules/payment_gateway/payment_gateway.constant";
import paymentgateways from "../modules/payment_gateway/payment_gateway.model";

const handle_unpaid_payment = async () => {
 
  try {
    const currentTime = new Date();
    const timeThreshold = new Date(
      currentTime.getTime() - 30 * 60 * 1000, 
    );

    const result = await paymentgateways.aggregate([
      {
        $match: {
          payment_status: payment_status.unpaid,
          isDelete: false,
          createdAt: { $lt: timeThreshold },
        }
      },
      {
        $group: {
          _id: null,
          ids: { $push: "$_id" }
        }
      }
    ]);

    if (!result.length || !result[0].ids.length) {
      return { deletedCount: 0, message: 'No unpaid payments to delete' };
    }

    const deleteResult = await paymentgateways.deleteMany({
      _id: { $in: result[0].ids },
    });

    console.log(`Deleted ${deleteResult.deletedCount} unpaid payments`);

    return {
      deletedCount: deleteResult.deletedCount,
      message: `Deleted ${deleteResult.deletedCount} unpaid payments`
    };
  } catch (error: any) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      'unpaid payment cron under issues',
      error,
    );
  }
};

export default handle_unpaid_payment;

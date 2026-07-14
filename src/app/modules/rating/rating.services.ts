import status from "http-status";
import AppError from "../../errors/AppError";
import { TRating } from "./rating.interface";
import ratings from "./rating.model";

const recordedRatingIntoDb = async (userId: string, payload: TRating) => {
  try {
    // ✅ Prevent duplicate rating by same user for same event
    const isAlreadyRated = await ratings.exists({
      userId,
      eventId: payload.eventId
     
    });

    if (isAlreadyRated) {
      throw new AppError(
        status.CONFLICT,
        "You have already rated this event."
      );
    }

    // ✅ Create new rating
    const result = await ratings.create({
      userId,
      eventId: payload.eventId,
      rating: payload.rating
      
    });

    if (!result) {
      throw new AppError(
        status.INTERNAL_SERVER_ERROR,
        "Failed to create rating."
      );
    }

    return {
      success: true,
      message: "Rating successfully recorded."
     
    };
  } catch (error: any) {
    if (error instanceof AppError) throw error;

    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "Server unavailable while recording rating.",
      error.message
    );
  }
};




const RatingServices = {
  recordedRatingIntoDb,
};

export default RatingServices;

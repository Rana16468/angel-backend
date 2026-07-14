import status from 'http-status';
import AppError from '../../errors/AppError';
import { RequestWithFile, TLovEemojiMemoriesEvent, UplodMemoriesEventModel } from './upload_memories_event.interface';
import favoriteevents from '../favorite_event/favorite_event.model';
import { loveemojimemoriesevents, uploadmemorieseventsnts } from './upload_memories_event.model';
import mongoose from 'mongoose';


const UploadMemoriesEventIntoDb = async (
  req: RequestWithFile,
  userId: string
) => {
  try {
    const { favoriteeventId, description, contentType, content } = req.body as any;

    const isExistFavoriteEvent = await favoriteevents.exists({ _id: favoriteeventId });
    if (!isExistFavoriteEvent) {
      throw new AppError(status.NOT_FOUND, 'Favorite event not found', '');
    }


    let fileContent: string | undefined;
    if (req.file) {
      fileContent = req.file.path.replace(/\\/g, '/');
    }
     

    const uploadMemoriesBuilder = new uploadmemorieseventsnts({
      userId,
      favoriteeventId,
      description,
      contentType,
      content: fileContent ?? content,
    });

    const result = await uploadMemoriesBuilder.save();

    if (!result) {
      throw new AppError(status.NOT_EXTENDED, 'Issue saving memory event in DB');
    }

    return {
      status: true,
      message: 'Successfully uploaded'
    };
  } catch (error: any) {
    console.error('UploadMemoriesEventIntoDb error:', error); // <-- log actual error
    if (error.name === 'ValidationError') {
      throw new AppError(status.BAD_REQUEST, error.message);
    }
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      'Issue while uploading memories event, server unavailable'
    );
  }
};

const findMyUploadMemoriesEventIntoDb = async (
  query: Record<string, unknown>,
  userId: string
) => {
  try {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    // ✅ Build match filter dynamically
    const matchStage: any = {
      userId: new mongoose.Types.ObjectId(userId),
      isDelete: false,
    };

    if (query?.contentType && query.contentType !== "all") {
      matchStage.contentType = query.contentType;
    }

    // ✅ Aggregation pipeline
    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "loveemojimemoriesevents",
          let: { memoryId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$uploadMemorieSeventId", "$$memoryId"] },
                    { $eq: ["$userId", new mongoose.Types.ObjectId(userId)] },
                    { $eq: ["$isLove", true] },
                    { $ne: ["$isDelete", true] },
                  ],
                },
              },
            },
          ],
          as: "loveStatus",
        },
      },

      {
        $addFields: {
          isLove: { $gt: [{ $size: "$loveStatus" }, 0] },
        },
      },

      {
        $project: {
          favoriteeventId: 0,
          userId: 0,
          isDelete: 0,
          loveStatus: 0,
          updatedAt: 0,
        },
      },
      { $sort: { createdAt: -1 } },

      { $skip: skip },
      { $limit: limit },
    ];

    const my_memories_event = await uploadmemorieseventsnts.aggregate(pipeline as any);

    const totalDocuments = await uploadmemorieseventsnts.countDocuments(matchStage);

    const meta = {
      page,
      limit,
      total: totalDocuments,
      totalPages: Math.ceil(totalDocuments / limit),
    };

    return { meta, my_memories_event };
  } catch (error: any) {
    console.error(error);
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Issues in finding My Upload Memories Event, server unavailable"
    );
  }
};





const LoveEemojiMemoriesEventCountIntoDb = async (
  payload: TLovEemojiMemoriesEvent,
  userId: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

 

  try {
    const memoryEvent = await uploadmemorieseventsnts
      .findById(payload.uploadMemorieSeventId)
      .session(session);

    if (!memoryEvent) {
      throw new AppError(status.NOT_FOUND, "Memory event not found");
    }

    // Check if user already reacted
    const existingEmoji = await loveemojimemoriesevents
      .findOne({ userId, uploadMemorieSeventId: payload.uploadMemorieSeventId })
      .session(session);

    let updatedEvent;

    if (existingEmoji) {
      // 🔹 User already reacted → remove emoji
      const deleteResult = await loveemojimemoriesevents.deleteOne(
        { _id: existingEmoji._id },
        { session }
      );

      if (!deleteResult.deletedCount) {
        throw new AppError(status.BAD_REQUEST, "Failed to remove emoji record");
      }

      updatedEvent = await uploadmemorieseventsnts.findByIdAndUpdate(
        payload.uploadMemorieSeventId,
        { $inc: { isFavorite: -1 } },
        { new: true, session }
      );

      

      await session.commitTransaction();
      return {
        status: true,
        message: "Emoji removed successfully",
        isFavoriteCount: updatedEvent?.isFavorite ?? 0,
      };
    } else {
      // 🔹 User hasn’t reacted → add emoji
      await loveemojimemoriesevents.create([{ ...payload, userId }], { session });

      updatedEvent = await uploadmemorieseventsnts.findByIdAndUpdate(
        payload.uploadMemorieSeventId,
        { $inc: { isFavorite: 1 } },
        { new: true, session }
      );

      await session.commitTransaction();
      return {
        status: true,
        message: "Emoji added successfully",
        isFavoriteCount: updatedEvent?.isFavorite ?? 0,
      };
    }
  } catch (error: any) {
    await session.abortTransaction();
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Error processing Love Emoji Memories Event Count",
      error
    );
  } finally {
    session.endSession();
  }
};





const UploadMemoriesEventServices = {
  UploadMemoriesEventIntoDb,
  findMyUploadMemoriesEventIntoDb,
    LoveEemojiMemoriesEventCountIntoDb
};

export default UploadMemoriesEventServices;

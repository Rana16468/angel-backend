// import status from "http-status";
// import AppError from "../errors/AppError";
// import socialfeeds from "../modules/social_feed/social_feed.model";

// const autoDeleteStoryAfter24Hours = async (): Promise<void> => {
//   try {
//     // ✅ Get current time and define 24-hour cutoff
//     const currentTime = new Date();
//     const timeThreshold = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);

//     console.log("⏰ Deleting stories older than:", timeThreshold);

//     // ✅ Find expired stories
//     const expiredStories = await socialfeeds
//       .find({ createdAt: { $lt: timeThreshold } })
//       .select("_id")
//       .lean();

//     console.log("🧾 Found expired story IDs:", expiredStories);

//     // ✅ Delete them
//     const result = await socialfeeds.deleteMany({
//       createdAt: { $lt: timeThreshold },
//     });

//     if (result?.deletedCount && result.deletedCount > 0) {
//       console.log(`✅ Successfully deleted ${result.deletedCount} expired stories`);
//     } else {
//       console.log("ℹ️ No expired stories found to delete.");
//     }
//   } catch (error: any) {
//     throw new AppError(
//       status.INTERNAL_SERVER_ERROR,
//       "Error while auto deleting stories",
//       error
//     );
//   }
// };

// export default autoDeleteStoryAfter24Hours;
import fs from "fs";
import path from "path";
import httpStatus from "http-status";
import socialfeeds from "../modules/social_feed/social_feed.model";
import storereacts from "../modules/stote_react/stote_react.model";
import AppError from "../errors/AppError";

 const autoDeleteStoryAfter24Hours = async () => {
  try {
    const timeThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);


  
    const expiredStories = await socialfeeds.aggregate([
      {
        $match: {
          createdAt: { $lt: timeThreshold },
        },
      },
      {
        $lookup: {
          from: "storereacts", 
          localField: "_id",
          foreignField: "storeId",
          as: "reacts",
        },
      },
      {
        $project: {
          _id: 1,
          content: 1,
          reactIds: "$reacts._id",
        },
      },
    ]);

    if (!expiredStories.length) {
      console.log("ℹ️ No expired stories found.");
      return;
    }

    console.log(`🧾 Found ${expiredStories.length} expired stories`);

    for (const story of expiredStories) {
      const storyId = story._id;

      // ✅ 1. Delete file
      if (story.content) {
        const fullPath = path.resolve(story.content);

        if (fs.existsSync(fullPath)) {
          await fs.promises.unlink(fullPath); // async version ✅
          console.log(`🗑️ Deleted file: ${fullPath}`);
        }
      }

      // ✅ 2. Delete all related reacts (bulk)
      if (story.reactIds?.length) {
        await storereacts.deleteMany({
          _id: { $in: story.reactIds },
        });

        console.log(
          `🧹 Deleted ${story.reactIds.length} reacts for story: ${storyId}`
        );
      }

      // ✅ 3. Delete story
      await socialfeeds.deleteOne({ _id: storyId });

      console.log(`✅ Deleted story: ${storyId}`);
    }

    console.log("🚀 Auto delete completed successfully");
  } catch (error: any) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Error while auto deleting stories",
      error instanceof Error ? error.message : String(error)
    );
  }
};export default autoDeleteStoryAfter24Hours;
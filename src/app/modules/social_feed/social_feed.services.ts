import status from "http-status";
import AppError from "../../errors/AppError";
import { RequestWithFile, SocialFeedResponse, TSocialFeed } from "./social_feed.interface";
import socialfeeds from "./social_feed.model";
import followups from "../followup/followup.model";
import mongoose from "mongoose";



const createSocialFeedIntoDb=async(req:RequestWithFile, userId:string):Promise<SocialFeedResponse >=>{
    try{
     const file = req.file;
    let content;
    if (file) {
      content = file?.path?.replace(/\\/g, "/");
    }
    const data = req.body as any; 

     const   socialFeedBuilder= new socialfeeds({...data, content, userId});
     const result=await  socialFeedBuilder.save();
     if(!result){
        throw new AppError(status.NOT_EXTENDED, 'issues by the social feed store section ');
     };
     return {
         status:true , 
         message :"successfully upload social feed"
     }
        
    }
    catch(error:any){
        throw new AppError(status.SERVICE_UNAVAILABLE, 'server  unavailable  createSocialFeedIntoDb section')
    }
};


const findByFollowWaieSocialFeedIntoDb = async (
  query: Record<string, unknown>,
  userId: string
) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const userObjectId = new mongoose.Types.ObjectId(userId);

  const result = await followups.aggregate([
    { $limit: 1 },

    // Step 1: আমি যাদের follow করি তাদের id বের করো
    // followup model এ userId = আমি, followupId = যাকে follow করি
    {
      $lookup: {
        from: "followups",
        let: { uid: userObjectId },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$userId", "$$uid"] }, // ✅ আমার userId দিয়ে খুঁজবো
              isFollowUp: true,
              isDelete: false,
            },
          },
          {
            $group: {
              _id: null,
              followedUserIds: { $addToSet: "$followupId" }, // ✅ followupId = যাকে follow করি
            },
          },
        ],
        as: "followedUsers",
      },
    },

    {
      $addFields: {
        followedUserIds: {
          $ifNull: [
            { $arrayElemAt: ["$followedUsers.followedUserIds", 0] },
            [],
          ],
        },
      },
    },

    // Step 2: Followed users এর social feeds
    {
      $lookup: {
        from: "socialfeeds",
        let: { ids: "$followedUserIds" },
        pipeline: [
          {
            $match: {
              $expr: { $in: ["$userId", "$$ids"] },
              isDelete: false,
            },
          },
        ],
        as: "followedFeeds",
      },
    },

    // Step 3: নিজের social feeds
    {
      $lookup: {
        from: "socialfeeds",
        pipeline: [
          {
            $match: {
              userId: userObjectId,
              isDelete: false,
            },
          },
        ],
        as: "ownFeeds",
      },
    },

    // Step 4: ✅ Stories — শুধু আমি যাদের follow করি + আমি নিজে
    {
      $lookup: {
        from: "userstores",
        let: {
          ids: "$followedUserIds", // আমি যাদের follow করি
          myId: userObjectId,      // আমি নিজে
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $in: ["$userId", "$$ids"] }, // followed users এর story
                  { $eq: ["$userId", "$$myId"] }, // নিজের story
                ],
              },
              isDelete: false,
            },
          },
          // Story র সাথে user info যোগ করো
          {
            $lookup: {
              from: "users",
              let: { sid: "$userId" },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$_id", "$$sid"] },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    name: 1,
                    photo: 1,
                  },
                },
              ],
              as: "userInfo",
            },
          },
          {
            $addFields: {
              userId: { $arrayElemAt: ["$userInfo", 0] },
            },
          },
          {
            $project: {
              userInfo: 0,
            },
          },
          // Latest story আগে দেখাবে
          { $sort: { createdAt: -1 } },
        ],
        as: "stories",
      },
    },

    // Step 5: Feeds একসাথে merge করো
    {
      $addFields: {
        allFeeds: {
          $concatArrays: ["$followedFeeds", "$ownFeeds"],
        },
      },
    },

    // Step 6: Feed এর user info
    {
      $lookup: {
        from: "users",
        let: { userIds: "$allFeeds.userId" },
        pipeline: [
          {
            $match: {
              $expr: { $in: ["$_id", "$$userIds"] },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              photo: 1,
            },
          },
        ],
        as: "feedUsers",
      },
    },

    // Step 7: Feed এর userId কে {_id, name, photo} দিয়ে replace করো
    {
      $addFields: {
        allFeeds: {
          $map: {
            input: "$allFeeds",
            as: "feed",
            in: {
              $mergeObjects: [
                "$$feed",
                {
                  userId: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$feedUsers",
                          as: "u",
                          cond: { $eq: ["$$u._id", "$$feed.userId"] },
                        },
                      },
                      0,
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    },

    // Step 8: Sort + Pagination
    {
      $addFields: {
        feeds: {
          $slice: [
            {
              $sortArray: {
                input: "$allFeeds",
                sortBy: { createdAt: -1 },
              },
            },
            skip,
            limit,
          ],
        },
      },
    },

    // Step 9: Final output
    {
      $project: {
        _id: 0,
        feeds: 1,
        stories: 1,
      },
    },
  ]);

  return {
    success: true,
    message: "Successfully Find My Social Feed",
    data: result[0] ?? { feeds: [], stories: [] },
  };
};





const deleteSocialFeedIntoDb=async(userId: string, id:string)=>{


  try{
   

      const result=await  socialfeeds.findOneAndDelete({userId, _id:id});

      if(!result){
        throw new AppError(status.NOT_EXTENDED,'issues by the delete social feed server section')
      };

      return{
        status:true ,
        message:"successfully delete"
      }

  }
  catch(error){
    throw new AppError(status.SERVICE_UNAVAILABLE, 'issues by the delete social feed')
  }

}





const SocialFeedServices={
    createSocialFeedIntoDb,
    findByFollowWaieSocialFeedIntoDb,
     deleteSocialFeedIntoDb
};

// added more information   my flower  ways data filtering in my  social feed  (user section)

export default SocialFeedServices;
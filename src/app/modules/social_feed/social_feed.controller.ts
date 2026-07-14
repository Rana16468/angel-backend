import { RequestHandler } from "express";
import catchAsync from "../../utils/asyncCatch";
import SocialFeedServices from "./social_feed.services";
import sendResponse from "../../utils/sendResponse";
import status from "http-status";




const createSocialFeed:RequestHandler=catchAsync(async(req , res)=>{

       const result=await SocialFeedServices.createSocialFeedIntoDb(req as any, req.user.id);
       sendResponse(res, {
    success: true,
    statusCode: status.CREATED,
    message: "Successfully Upload Social Feed",
    data: result,
  });
});


const findByFollowWaieSocialFeed:RequestHandler=catchAsync(async(req , res)=>{

    const result=await SocialFeedServices.findByFollowWaieSocialFeedIntoDb(req.query, req.user.id);
      sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Find My Social Feed",
    data: result,
  });
});

const deleteSocialFeed:RequestHandler=catchAsync(async(req , res)=>{

    const result=await SocialFeedServices.deleteSocialFeedIntoDb(req.user.id, req.params.id);
     sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Delete Social Feed",
    data: result,
  });
})

const SocialFeedController={
    createSocialFeed,
    findByFollowWaieSocialFeed,
     deleteSocialFeed
};

export default SocialFeedController;
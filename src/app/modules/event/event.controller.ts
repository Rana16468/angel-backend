import { RequestHandler } from "express";
import catchAsync from "../../utils/asyncCatch";
import EventServices from "./event.services";
import sendResponse from "../../utils/sendResponse";
import status from "http-status";
import events from "./event.model";

const createEvent: RequestHandler = catchAsync(async (req, res) => {
  const result = await EventServices.createEventIntoDb(req as any, req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully create event",
    data: result,
  });
});

const MyEventList: RequestHandler = catchAsync(async (req, res) => {
  const result = await EventServices.MyEventListIntoDb(req.user.id, req.query);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully fetched event list",
    data: result,
  });
});

const MyEventDashboard: RequestHandler = catchAsync(async (req, res) => {
  const result = await EventServices.MyEventDashboardIntoDb(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Find By My Event Dashboard",
    data: result,
  });
});

const MyEventTypeWaysFiltering: RequestHandler = catchAsync(
  async (req, res) => {
    const result = await EventServices.MyEventTypeWaysFilteringIntoDb(
      req.user.id,
      req.query
    );
    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Successfully Event Type Ways Filtering",
      data: result,
    });
  }
);

const findBySpecificEvent: RequestHandler = catchAsync(async (req, res) => {
  const result = await EventServices.findBySpecificEventIntoDb(
    req?.params?.id
  
  );
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Find By Specific Event",
    data: result,
  });
});

const updateEvent: RequestHandler = catchAsync(async (req, res) => {
  const result = await EventServices.updateEventIntoDb(
    req.params.id,
    req as any
  );
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Update Event",
    data: result,
  });
});

const deleteEvent: RequestHandler = catchAsync(async (req, res) => {
  const result = await EventServices.deleteEventIntoDb(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Delete Event",
    data: result,
  });
});


const findByUserSearchAllEvent:RequestHandler=catchAsync(async(req , res)=>{

      const result=await EventServices.findByUserSearchAllEventIntoDb(req.query);
       sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Find  By Nearest event",
    data: result,
  });
});

const SearchingNearestLocationWaysNonEvent: RequestHandler = catchAsync(async (req, res) => {
  const result = await EventServices.SearchingNearestLocationWaysNonEventIntoDb(
    Number(req.query.latitude),
    Number(req.query.longitude),
    10000,
    req.query.type as string
  );

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Find  By Nearest event",
    data: result,
  });
});

const findByAllLiveEventFiltering:RequestHandler=catchAsync(async(req , res)=>{

    const result=await EventServices. findByAllLiveEventFilteringIntoDb(req.query);
      sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Find  By all live event",
    data: result,
  });

});

const findByUpcommingAndPastEventFiltering:RequestHandler=catchAsync(async(req , res)=>{

  const result= await EventServices.findByUpcommingAndPastEventFilteringIntoDb (req.query);
     sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Find  All Upcomming and Past event",
    data: result,
  });

});

const findByNearestEvent:RequestHandler=catchAsync(async(req , res)=>{

      const result=await EventServices.findByNearestEventIntoDb(req.query);
        sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Find By My Location Wise Nearest Event ",
    data: result,
  });
});

const   getEventGrowth:RequestHandler=catchAsync(async(req , res)=>{

    const result=await EventServices.getEventGrowthIntoDb(req.query);
            sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Find By All Event Growth ",
    data: result,
  });
});

const findByAllEvent:RequestHandler=catchAsync(async(req , res)=>{

     const result=await EventServices.findByAllEventIntoDb(req.query);
                 sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Find By All Event ",
    data: result,
  });
});


const adminDeleteEvent:RequestHandler=catchAsync(async(req , res)=>{

     const result=await EventServices.adminDeleteEventIntoDb(req.params.eventId);
   sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Delete Event ",
    data: result,
  });

});


const hostAllEventAvgRating:RequestHandler=catchAsync(async(req , res)=>{
    


  const result=await EventServices.hostAllEventAvgRatingIntoDb(req.user.id);
    sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Fin My Rating ",
    data: result,
  });
});


const agoraAccessToken:RequestHandler=catchAsync(async(req , res)=>{

console.log("Debug===================================")
  console.log('Received request for Agora Access Token for eventId:', req.params.eventId);
 

  const  result=await EventServices.agoraAccessTokenIntoDb(req.params.eventId);
   sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Successfully Find By Token ",
    data: result,
  });

    
})

const EventController = {
  createEvent,
  MyEventList,
  MyEventDashboard,
  MyEventTypeWaysFiltering,
  updateEvent,
  findBySpecificEvent,
  deleteEvent,
  findByUserSearchAllEvent,
  SearchingNearestLocationWaysNonEvent,
  findByAllLiveEventFiltering,
  findByUpcommingAndPastEventFiltering,
  findByNearestEvent,
   getEventGrowth,
   findByAllEvent,
   adminDeleteEvent,
   hostAllEventAvgRating,
   agoraAccessToken
};
export default EventController;

import status from "http-status";
import AppError from "../../errors/AppError";
import dayjs from "dayjs";
import { RequestWithFile } from "../auth/auth.interface";
import events from "./event.model";
import { EventResponse } from "./event.interface";
import QueryBuilder from "../../builder/QueryBuilder";
import { searching_event } from "./event.constant";
import fs from "fs";
import path from "path";
import joingroups from "../join_event_group/join_event_group.model";
import chatrooms from "../event_chatroom/event_chatroom.model";
import mongoose, { PipelineStage } from "mongoose";
import axios from "axios";
import conversations from "../conversation/conversation.model";
import messages from "../message/message.model";
import pointsystems from "../pointsystem/pointsystem.model";
import ratings from "../rating/rating.model";
import customParseFormat from "dayjs/plugin/customParseFormat";
;
import eventposts from "../event_post/event_post.model";
import agoraAccessToken from "../../utils/agoraAccessToken/agoraAccessToken";
import { validateAndGetEventUTCInterval } from "../../utils/toISODateTime";

dayjs.extend(customParseFormat);

const createEventIntoDb = async (
  req: RequestWithFile,
  hostId: string
): Promise<EventResponse> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const file = req.file;
    let photo: string | undefined;

    if (file) {
      photo = file.path.replace(/\\/g, "/");
    }

    const data = req.body as any;

    // ⚡ ১. তারিখ ও সময় ভ্যালিডেশন এবং UTC ISO কনভার্সন
    if (!data?.date || !data?.starting_time || !data?.ending_time) {
      throw new AppError(
        status.BAD_REQUEST,
        "Date, starting_time, and ending_time are required"
      );
    }

    // আপনার নতুন হেল্পার ফাংশন দিয়ে ৩টি আর্গুমেন্ট পাস করা হচ্ছে
    const { startDateTime, endDateTime } = validateAndGetEventUTCInterval(
      data.date,
      data.starting_time,
      data.ending_time
    );

    // অবজেক্টে সঠিক UTC ISO ভ্যালু সেট করা
    data.starting_time = startDateTime;
    data.ending_time = endDateTime;

    // 2️⃣ Create Event
    const eventBuilder = new events({ ...data, photo, hostId });
    const eventResult = await eventBuilder.save({ session });

    if (!eventResult) {
      throw new AppError(
        status.NOT_ACCEPTABLE,
        "Some issues in the event creation section"
      );
    }

    // 3️⃣ Create Chat Room FIRST
    const createChatRoomBuilder = new chatrooms({
      eventId: eventResult._id,
      chatRoomName: data?.event_title,
      hostId,
      photo: photo,
    });

    const chatRoomResult = await createChatRoomBuilder.save({ session });

    if (!chatRoomResult) {
      throw new AppError(
        status.NOT_ACCEPTABLE,
        "Some issues in the chat room creation section"
      );
    }

    // 4️⃣ Create Join Group WITH chatRoomId
    const createJoinGroupBuilder = new joingroups({
      eventId: eventResult._id,
      groupName: data?.event_title,
      hostId,
      chatRoomId: chatRoomResult._id, // ✅ REQUIRED FIELD
      photo: photo,
    });

    const joinGroupResult = await createJoinGroupBuilder.save({ session });

    if (!joinGroupResult) {
      throw new AppError(
        status.NOT_ACCEPTABLE,
        "Some issues in the join group section"
      );
    }

    // ✅ Commit Transaction
    await session.commitTransaction();

    return {
      status: true,
      message: "Successfully recorded",
    };
  } catch (error: any) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      `Event creation failed, rolled back: ${error.message}`,
      error
    );
  } finally {
    session.endSession();
  }
};


const MyEventListIntoDb = async (
  hostId: string,
  query: Record<string, unknown>
) => {
  try {
    let baseQuery: any;
    baseQuery = events
      .find({
        hostId
      ,
      })
      .select(
        "photo audience_settings.max_capacity event_title createdAt date starting_time ending_time audience_settings.price audience_settings.ticket_price"
      );

    const queryBuilder = new QueryBuilder(baseQuery, query)
      .search(searching_event)
      .filter()
      .sort()
      .paginate()
      .fields();

    // Execute queries
    const myEvent = await queryBuilder.modelQuery;
    const meta = await queryBuilder.countTotal();

    return { meta, myEvent };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "Failed to fetch event list"
    );
  }
};
// panding

const MyEventDashboardIntoDb = async (hostId: string) => {
  try {
    return {
      hostId,
    };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "Failed to fetch event dashboard list"
    );
  }
};

const MyEventTypeWaysFilteringIntoDb = async (
  hostId: string,
  query: Record<string, unknown>
) => {
  try {
    const { searchTerm } = query;
    let myEvent: any[] = [];
    let meta: any;

    // Current UTC time
    const now = new Date();

    // -------------------------------
    // Parse UTC date
    // -------------------------------
    const parseUtcDate = (iso: string) => new Date(iso);

    // -------------------------------
    // Determine event status
    // -------------------------------
    const getEventStatus = (startTime: string, endTime: string) => {
      const start = parseUtcDate(startTime);
      const end = parseUtcDate(endTime);

      if (now < start) return "upcoming";
      if (now >= start && now <= end) return "live";
      return "past";
    };

    switch (searchTerm) {
      case "all": {
        const allEventListQuery = new QueryBuilder<any>(
          events
            .find({ hostId })
            .select(
              "photo audience_settings.max_capacity event_title createdAt date starting_time ending_time audience_settings.price audience_settings.event_location.lat audience_settings.event_location.lon"
            ),
          query
        )
          .search([])
          .filter()
          .sort()
          .paginate()
          .fields();

        myEvent = await allEventListQuery.modelQuery;
        meta = await allEventListQuery.countTotal();

        myEvent = myEvent.map(event => {
          const e = event.toObject ? event.toObject() : event;
          const type = getEventStatus(e.starting_time, e.ending_time);
          return { ...e, type };
        });

        break;
      }

      case "upcoming":
      case "live":
      case "past": {
        const filterFn = (e: any) => {
          const type = getEventStatus(e.starting_time, e.ending_time);
          return type === searchTerm;
        };

        const eventListQuery = new QueryBuilder<any>(
          events
            .find({ hostId })
            .select(
              "photo audience_settings.max_capacity event_title createdAt date starting_time ending_time audience_settings.price audience_settings.event_location.lat audience_settings.event_location.lon"
            ),
          query
        )
          .search([])
          .filter()
          .sort()
          .paginate()
          .fields();

        const eventsResult = await eventListQuery.modelQuery;
        meta = await eventListQuery.countTotal();

        myEvent = eventsResult
          .map(e => (e.toObject ? e.toObject() : e))
          .filter(filterFn)
          .map(e => ({ ...e, type: searchTerm }));

        break;
      }

      default:
        throw new AppError(status.BAD_REQUEST, "Invalid search term");
    }

    return { meta, myEvent };
  } catch (error: any) {
    console.error("Error in MyEventTypeWaysFilteringIntoDb:", error);
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "Failed to fetch events with time-based filtering"
    );
  }
};


/**
 * Add event type dynamically for "all" case
 */
const addEventType = (events: any[]) => {
  const now = new Date();
  const localNow = new Date(now.getTime() + 6 * 60 * 60 * 1000); // UTC+6

  return events.map(event => {
    const e = event.toObject ? event.toObject() : event;

    const startTime = new Date(e.starting_time);
    const endTime = new Date(e.ending_time);

    const localStart = new Date(startTime.getTime() + 6 * 60 * 60 * 1000);
    const localEnd = new Date(endTime.getTime() + 6 * 60 * 60 * 1000);

    let type: string;
    if (localNow < localStart) type = "upcoming";
    else if (localNow >= localStart && localNow <= localEnd) type = "live";
    else type = "past";

    return { ...e, type };
  });
};


const updateEventIntoDb = async (id: string, req: RequestWithFile) => {
  try {
    const data = req.body as any;
    const file = req.file;

    // ১. বিদ্যমান ইভেন্ট চেক করা
    const existingEvent = await events.findById(id);
    if (!existingEvent) {
      throw new AppError(status.NOT_FOUND, "Event not found");
    }

    const updateData: Record<string, any> = {};

    // বেসিক ফিল্ডস
    if (data.event_title) updateData.event_title = data.event_title;
    if (data.description) updateData.description = data.description;
    if (data.date) updateData.date = data.date;

    // ⚡ ২. তারিখ ফিল্টার (YYYY-MM-DD ফরম্যাট নিশ্চিতকরণ)
    let rawDate = data.date || existingEvent.date;

    if (typeof rawDate === "string" && rawDate.includes("T")) {
      rawDate = rawDate.split("T")[0];
    } else if (rawDate instanceof Date) {
      rawDate = rawDate.toISOString().split("T")[0];
    }

    const targetDate = rawDate;

   
    let finalStartUTC = existingEvent.starting_time;
    let finalEndUTC = existingEvent.ending_time;

    
     if (!data?.date || !data?.starting_time || !data?.ending_time) {
      throw new AppError(
        status.BAD_REQUEST,
        "Date, starting_time, and ending_time are required"
      );
    }

    
    const { startDateTime, endDateTime } = validateAndGetEventUTCInterval(
      data.date,
      data.starting_time,
      data.ending_time
    );

   
    data.starting_time = startDateTime;
    data.ending_time = endDateTime;

    // ⚡ ৪. স্টার্ট এবং এন্ড টাইমের পারস্পরিক সময় ভ্যালিডেশন Check
    if (new Date(finalEndUTC) <= new Date(finalStartUTC)) {
      throw new AppError(
        status.BAD_REQUEST,
        "Ending time must be after starting time"
      );
    }

    // ৫. Audience settings nested fields
    if (data.audience_settings) {
      const aud = data.audience_settings;

      if (aud.event_location?.lat)
        updateData["audience_settings.event_location.lat"] = aud.event_location.lat;
      if (aud.event_location?.lon)
        updateData["audience_settings.event_location.lon"] = aud.event_location.lon;

      if (aud.point_system) {
        if (aud.point_system.people !== undefined)
          updateData["audience_settings.point_system.people"] = aud.point_system.people;
        if (aud.point_system.point !== undefined)
          updateData["audience_settings.point_system.point"] = aud.point_system.point;
      }

      if (aud.notification) {
        if (aud.notification.livechat !== undefined)
          updateData["audience_settings.notification.livechat"] = aud.notification.livechat;
        if (aud.notification.push_notifications !== undefined)
          updateData["audience_settings.notification.push_notifications"] =
            aud.notification.push_notifications;
        if (aud.notification.event_countdown !== undefined)
          updateData["audience_settings.notification.event_countdown"] =
            aud.notification.event_countdown;
      }

      if (aud.social_media) {
        if (aud.social_media.content !== undefined)
          updateData["audience_settings.social_media.content"] = aud.social_media.content;
        if (aud.social_media.gallery !== undefined)
          updateData["audience_settings.social_media.gallery"] = aud.social_media.gallery;
        if (aud.social_media.sharing !== undefined)
          updateData["audience_settings.social_media.sharing"] = aud.social_media.sharing;
        if (aud.social_media.streaming !== undefined)
          updateData["audience_settings.social_media.streaming"] = aud.social_media.streaming;
      }

      if (aud.ticket_price) updateData["audience_settings.ticket_price"] = aud.ticket_price;
      if (aud.price !== undefined) updateData["audience_settings.price"] = aud.price;
    }

    // ⚡ ৬. নতুন ফটো আপডেট ও পুরোনো ফটো ফাইল নিরাপদভাবে ডিলিট
    if (file?.path) {
      if (existingEvent.photo) {
        try {
          const resolvedPath = path.resolve(existingEvent.photo);
          if (fs.existsSync(resolvedPath)) {
            fs.unlinkSync(resolvedPath);
          }
        } catch (fileErr) {
          console.error("Failed to delete old event image:", fileErr);
        }
      }
      updateData.photo = file.path.replace(/\\/g, "/");
    }

    // ৭. ডাটাবেজে আপডেট
    const updatedEvent = await events
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .lean();

    if (!updatedEvent) {
      throw new AppError(status.SERVICE_UNAVAILABLE, "Server issues in event update");
    }

    return { status: true, message: "Successfully updated" };
  } catch (error: any) {
    if (error instanceof AppError) throw error;

    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      error.message || "Failed to update event in db"
    );
  }
};




const findBySpecificEventIntoDb = async (id: string) => {
  try {
    const result = await joingroups
      .findOne({ eventId: id }, { _id: 1 })
      .populate(
        "eventId",
        "event_title description photo date starting_time ending_time audience_settings.age venue_facilities price audience_settings.event_location audience_settings.ticket_price audience_settings.price"
      )
      .lean(); // convert to plain object

    if (!result || !result.eventId) {
      return null;
    }

    const eventData = result.eventId as any;

    // reshape output
    const formattedData = {
      ...eventData,              
      groupId: result._id        
    };

    return formattedData;
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "Failed to fetch find By Specific Event"
    );
  }
};


const deleteEventIntoDb = async (id: string): Promise<EventResponse> => {
  try {
    const isExist = await events.exists({ _id: id });
    if (!isExist) {
      throw new AppError(status.NOT_FOUND, "NOT FOUNDED", "");
      
    };


    await joingroups.deleteMany({ eventId: id });
    await chatrooms.deleteMany({ eventId: id });
     const findByAllConversations = await conversations.find({ eventId: id }, { _id: 1 });
    await conversations.deleteMany({ eventId: id });
    await messages.deleteMany({ conversationId: { $in: findByAllConversations.map(c => c._id) } });
    await eventposts.deleteMany({ eventId: id });
    await pointsystems.deleteMany({ eventId: id });
    await ratings.deleteMany({ eventId: id });
    
    const result = await events.findByIdAndDelete(id);
    if (!result) {
      throw new AppError(
        status.NOT_IMPLEMENTED,
        "issues by the event delete section",
        ""
      );
    };

    return {
      status: true,
      message: "successfully delete",
    };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      error.message || "Failed to delete event into db"
    );
  }
};


// const findByUserSearchAllEventIntoDb = async (query: Record<string, unknown>) => {
//   try {

//     // console.log(query)
//     const allEventPostQuery = new QueryBuilder(
//       events.find({}),
//       {}         
//     )
//       .search(["title", "description"]) 
//       .filter()                          
//       .sort()                            
//       .paginate()                       
//       .fields(); 

//     const all_event_post = await allEventPostQuery.modelQuery;
//     const meta = await allEventPostQuery.countTotal();

//     return { meta, all_event_post };
//   } catch (error: any) {
    
//     throw new AppError(
//       status.SERVICE_UNAVAILABLE,
//       "find By All Specific Event Post List IntoDb server unavailable",
//       error.message
//     );
//   }
// };


// const findByUserSearchAllEventIntoDb = async (query: Record<string, any>) => {
//   try {
//     const { lat, lon, radius = 5 } = query; // radius in km

//     let mongoQuery: any = {};

//     if (lat && lon) {
//       const latNum = parseFloat(lat);
//       const lonNum = parseFloat(lon);

//       // Approximate range in degrees (~1 degree ≈ 111 km)
//       const radiusInDegree = radius / 111; 

//       mongoQuery["audience_settings.event_location.lat"] = {
//         $gte: (latNum - radiusInDegree).toString(),
//         $lte: (latNum + radiusInDegree).toString(),
//       };
//       mongoQuery["audience_settings.event_location.lon"] = {
//         $gte: (lonNum - radiusInDegree).toString(),
//         $lte: (lonNum + radiusInDegree).toString(),
//       };
//     }

//     const allEventPostQuery = new QueryBuilder(
//       events.find(mongoQuery),
//       {}
//     )
//       .search(["event_title", "description"])
//       .filter()
//       .sort()
//       .paginate()
//       .fields();

//     const all_event_post = await allEventPostQuery.modelQuery;
//     const meta = await allEventPostQuery.countTotal();

//     return { meta, all_event_post };
//   } catch (error: any) {
//     throw new AppError(
//       status.SERVICE_UNAVAILABLE,
//       "find By All Specific Event Post List IntoDb server unavailable",
//       error.message
//     );
//   }
// };

const findByUserSearchAllEventIntoDb = async (query: Record<string, any>) => {
  try {
    const { lat, lon, page = 1, limit = 10 } = query;

    if (!lat || !lon) {
      throw new AppError(400, "Latitude and longitude are required");
    }

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    const piDiv180 = Math.PI / 180;

    const pipeline: PipelineStage[] = [
      {
        $addFields: {
          latNum: { $toDouble: "$audience_settings.event_location.lat" },
          lonNum: { $toDouble: "$audience_settings.event_location.lon" },
        },
      },
      {
        $addFields: {
          distance: {
            $multiply: [
              6371,
              {
                $acos: {
                  $let: {
                    vars: {
                      cosValue: {
                        $add: [
                          {
                            $multiply: [
                              { $sin: { $multiply: [latNum, piDiv180] } },
                              { $sin: { $multiply: ["$latNum", piDiv180] } },
                            ],
                          },
                          {
                            $multiply: [
                              { $cos: { $multiply: [latNum, piDiv180] } },
                              { $cos: { $multiply: ["$latNum", piDiv180] } },
                              {
                                $cos: {
                                  $subtract: [
                                    { $multiply: ["$lonNum", piDiv180] },
                                    lonNum * piDiv180,
                                  ],
                                },
                              },
                            ],
                          },
                        ],
                      },
                    },
                    in: {
                      $cond: [
                        { $gt: ["$$cosValue", 1] },
                        1,
                        {
                          $cond: [
                            { $lt: ["$$cosValue", -1] },
                            -1,
                            "$$cosValue",
                          ],
                        },
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      },
      { $match: { isDelete: { $ne: true } } },
      { $sort: { distance: 1 } }, // nearest first
      { $limit: 1 },               // ONLY ONE
      {
        $project: {
          _id: 1,
          "audience_settings.event_location": 1,
          
event_title:1
        },
      },
    ];

    const eventsList = await events.aggregate(pipeline);

    return {
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: eventsList.length,
        totalPage: eventsList.length ? 1 : 0,
      },
      eventsList,
    };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "Failed to find nearest event",
      error.message
    );
  }
};










// const GOOGLE_MAPS_API_KEY = "AIzaSyCHBKvR2Wgc4eF53nYTlGYxULSQuVpb9t4"; // IMPORTANT: Get a new key with proper restrictions
const GOOGLE_MAPS_API_KEY = "AIzaSyAODtcJ_j1MZIqCBQtmpbCf6e4agmIzoJM";
const SearchingNearestLocationWaysNonEventIntoDb = async (
  latitude: number,
  longitude: number,
  radius: number = 1000,
  type: string = "bar"
) => {
  try {
    // ✅ Validate inputs
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      throw new Error("Latitude and longitude must be numbers");
    }

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error("Invalid latitude or longitude values");
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new Error("Latitude or longitude out of valid range");
    }

    const url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";

    const params = {
      location: `${latitude},${longitude}`,
      radius: String(radius),
      // type: type || "restaurant",
      keyword: type || "restaurant",
      key: GOOGLE_MAPS_API_KEY,
    };

    const response = await axios.get(url, { params });

    // ✅ Check Google API status
    if (
      response.data.status !== "OK" &&
      response.data.status !== "ZERO_RESULTS"
    ) {
      throw new Error(
        `Google API Error: ${response.data.status} - ${
          response.data.error_message || "Unknown error"
        }`
      );
    }

    const places = response.data.results || [];

    const formattedPlaces = places.map((place: any) => {
      const photoRef = place.photos?.[0]?.photo_reference;
      const imageUrl = photoRef
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${GOOGLE_MAPS_API_KEY}`
        : null;

      return {
        id: place.place_id,
        name: place.name || "N/A",
        address: place.vicinity || "N/A",
        rating: place.rating ?? 0,
        totalRatings: place.user_ratings_total ?? 0,
        location: place.geometry?.location || { lat: 0, lng: 0 },
        openNow: place.opening_hours?.open_now ?? null,
        types: place.types || [],
        image: imageUrl,
      };
    });

    return {
      success: true,
      count: formattedPlaces.length,
      data: formattedPlaces,
    };
  } catch (error: any) {
    console.error("Error fetching nearby places:", error);
    console.error("Error response:", error.response?.data);

    return {
      success: false,
      message: "Failed to fetch nearby places.",
      error: error.message,
      details: error.response?.data || null,
    };
  }
};
// const findByAllLiveEventFilteringIntoDb = async (
//   query: Record<string, any>
// ) => {
//   try {
//     const { searchTerm, eventDate } = query; 

//     if (!eventDate) {
//       throw new AppError(status.BAD_REQUEST, "eventDate is required");
//     }

//     switch (searchTerm) {
//       // 
//       case "live": {
//             const now = new Date();
//     const todayStr = `${String(now.getDate()).padStart(2, "0")}-${String(
//       now.getMonth() + 1
//     ).padStart(2, "0")}-${now.getFullYear()}`;
//     console.log("Today is:", todayStr);
//         const eventsList = await events
//           .find({})
//           .select(
//             "photo audience_settings.max_capacity event_title createdAt date starting_time ending_time audience_settings.price audience_settings.ticket_price audience_settings.event_location.lat audience_settings.event_location.lon"
//           )
//           .lean();
//           console.log(eventsList, "eventsList")


//           const filteredEvents = eventsList.filter((ev) => {
//   // ensure ev.date exists and is string
//   if (!ev.date || typeof ev.date !== "string") return false;

//   // trim spaces
//   const evDateStr = ev.date.trim();
//   const targetDateStr = eventDate.trim();

//   const evDate = dayjs(evDateStr, "DD-MM-YYYY");
//     console.log(evDate, "evDate")
//   const targetDate = dayjs(targetDateStr, "DD-MM-YYYY");
//   console.log(targetDate, "eventsList")
//   // check if valid dates
//   if (!evDate.isValid() || !targetDate.isValid()) return false;

//   // compare day only
//   return evDate.isSame(targetDate, "day");
// });

//         // const filteredEvents = eventsList.filter((ev) => {
//         //   const evDate = dayjs(ev.date, "DD-MM-YYYY");
//         //   console.log(evDate, "evDate")
//         //   const targetDate = dayjs(eventDate, "DD-MM-YYYY");
//         //   console.log(targetDate, "targetDate")

//         //   return evDate.isSame(targetDate, "day");
//         // });
// console.log(filteredEvents, "filteredEvents")

//         const page = Number(query.page) || 1;
//         const limit = Number(query.limit) || 10;
//         const total = filteredEvents.length;
//         const totalPage = Math.ceil(total / limit);

//         const paginated = filteredEvents.slice((page - 1) * limit, page * limit);

//         return {
//           meta: { page, limit, total, totalPage },
//           myEvent: paginated,
//         };
//       };

//       default:
//         throw new AppError(status.BAD_REQUEST, "Invalid search term");
//     }
//   } catch (error: any) {
//     console.error("Error in findByAllLiveEventFilteringIntoDb:", error);
//     throw new AppError(
//       status.SERVICE_UNAVAILABLE,
//       "Failed to fetch events with type/ways filtering"
//     );
//   }
// };

const findByAllLiveEventFilteringIntoDb = async (query: Record<string, any>) => {
  try {
    const { searchTerm = "live", page: pageStr, limit: limitStr } = query;

    if (searchTerm !== "live") {
      throw new AppError(status.BAD_REQUEST, "Invalid search term");
    }

    const now = new Date(); // current UTC time

    // -----------------------------
    // Pagination
    // -----------------------------
    const page = Number(pageStr) || 1;
    const limit = Number(limitStr) || 10;
    const skip = (page - 1) * limit;

    // -----------------------------
    // Base Query
    // -----------------------------
    const baseQuery = new QueryBuilder<any>(
      events.find({}).select(
        "photo audience_settings.max_capacity event_title createdAt date starting_time ending_time audience_settings.price audience_settings.ticket_price audience_settings.event_location.lat audience_settings.event_location.lon"
      ),
      {}
    )
      .search([]) // add search fields if needed
      .filter()
      .sort()
      .fields(); // removed paginate here

    const eventsResult = await baseQuery.modelQuery;

    // -----------------------------
    // Filter live events
    // -----------------------------
    const liveEvents = eventsResult
      .map((e: any) => {
        const eventObj = e.toObject ? e.toObject() : e;
        const isLive =
          new Date(eventObj.starting_time) <= now &&
          new Date(eventObj.ending_time) > now;

        return isLive ? { ...eventObj, type: "live" } : null;
      })
      .filter((e) => e !== null);

    // -----------------------------
    // Apply pagination AFTER filtering
    // -----------------------------
    const paginatedEvents = liveEvents.slice(skip, skip + limit);

    const meta = {
      total: liveEvents.length,
      page,
      limit,
      totalPage: Number(Math.ceil(liveEvents.length / limit)),
    };

    return {
      meta,
      myEvent: paginatedEvents,
    };
  } catch (error: any) {
    console.error("Error in findByAllLiveEventFilteringIntoDb:", error);
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "Failed to fetch live events"
    );
  }
};

const findByUpcommingAndPastEventFilteringIntoDb = async (
  query: Record<string, unknown>
) => {
  try {
    const { searchTerm = "all" } = query;

    let myEvent: any[] = [];
    let meta: any;

    // -----------------------------
    // Current UTC time
    // -----------------------------
    const now = new Date(); // always UTC internally

    // -----------------------------
    // Determine event status
    // -----------------------------
    const getEventStatus = (startTime: string, endTime: string) => {
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (now < start) return "upcoming";
      if (now >= start && now <= end) return "live";
      return "past";
    };

    // -----------------------------
    // Base Query
    // -----------------------------
    const baseQuery = new QueryBuilder<any>(
      events.find({}).select(
        "photo audience_settings.max_capacity event_title createdAt date starting_time ending_time audience_settings.price audience_settings.event_location.lat audience_settings.event_location.lon"
      ),
      query
    )
      .search([])
      .filter()
      .sort()
      .paginate()
      .fields();

    const eventsResult = await baseQuery.modelQuery;
    meta = await baseQuery.countTotal();

    // -----------------------------
    // Add event type
    // -----------------------------
    myEvent = eventsResult
      .map((e: any) => {
        const eventObj = e.toObject ? e.toObject() : e;

        const type = getEventStatus(
          eventObj.starting_time,
          eventObj.ending_time
        );

        return { ...eventObj, type };
      })
      .filter((e) => e.type !== "live"); // remove live events

    // -----------------------------
    // Filter by searchTerm
    // -----------------------------
    if (searchTerm === "upcoming" || searchTerm === "past") {
      myEvent = myEvent.filter((e) => e.type === searchTerm);
    } else if (searchTerm !== "all") {
      throw new AppError(status.BAD_REQUEST, "Invalid search term");
    }

    // -----------------------------
    // Sort events
    // -----------------------------
    myEvent.sort((a, b) => {
      const order: Record<string, number> = {
        upcoming: 1,
        past: 2,
      };

      if (a.type === b.type) {
        return (
          new Date(a.starting_time).getTime() -
          new Date(b.starting_time).getTime()
        );
      }

      return order[a.type] - order[b.type];
    });

    return {
      meta,
      myEvent,
    };
  } catch (error: any) {
    console.error(
      "Error in findByUpcommingAndPastEventFilteringIntoDb:",
      error
    );

    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "Failed to fetch events with time-based filtering"
    );
  }
};




// find by my location waise nearest event 

const findByNearestEventIntoDb = async (query: Record<string, any>) => {
  try {
    const now = new Date();

    const { page: pageStr, limit: limitStr } = query;

    // -----------------------------
    // Pagination
    // -----------------------------
    const page = Number(pageStr) || 1;
    const limit = Number(limitStr) || 10;
    const skip = (page - 1) * limit;

    // -----------------------------
    // Base Query (NO pagination here)
    // -----------------------------
    const baseQuery = new QueryBuilder<any>(
      events.find({}).select(
        "photo audience_settings.max_capacity event_title createdAt date starting_time ending_time audience_settings.price audience_settings.ticket_price audience_settings.event_location.lat audience_settings.event_location.lon"
      ),
      {}
    )
      .search([
        "event_category",
        "audience_settings.ticket_price",
        "date",
        "audience_settings.age",
        "audience_settings.visibility",
        "event_features",
        "event_title",
      ])
      .filter()
      .sort()
      .fields(); // ❗ paginate removed

    const eventsResult = await baseQuery.modelQuery;

    // -----------------------------
    // Filter LIVE + UPCOMING
    // -----------------------------
    const filteredEvents = eventsResult
      .map((e: any) => {
        const eventObj = e.toObject ? e.toObject() : e;

        const start = new Date(eventObj.starting_time);
        const end = new Date(eventObj.ending_time);

        let type: "live" | "upcoming" | null = null;

        if (now < start) type = "upcoming";
        else if (now >= start && now <= end) type = "live";

        return type ? { ...eventObj, type } : null;
      })
      .filter((e) => e !== null);

    // -----------------------------
    // Pagination AFTER filtering
    // -----------------------------
    const paginatedEvents = filteredEvents.slice(skip, skip + limit);

    const meta = {
      total: filteredEvents.length,
      page,
      limit,
      totalPage: Math.ceil(filteredEvents.length / limit),
    };

    return {
      meta,
      eventsList: paginatedEvents,
    };
  } catch (error: any) {
    console.error("Error in findByNearestEventIntoDb:", error);

    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "issues finding the nearest event in DB",
      error.message
    );
  }
};



const getEventGrowthIntoDb = async (query: { year?: string }) => {
 try {
    const year = query.year ? parseInt(query.year) : new Date().getFullYear();

    const stats = await events.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01T00:00:00.000Z`),
            $lte: new Date(`${year}-12-31T23:59:59.999Z`),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          month: "$_id.month",
          count: 1,
          _id: 0,
        },
      },
      {
        $group: {
          _id: null,
          data: { $push: { month: "$month", count: "$count" } },
        },
      },

      {
        $project: {
          months: {
            $map: {
              input: { $range: [1, 13] },
              as: "m",
              in: {
                year: year,
                month: "$$m",
                count: {
                  $let: {
                    vars: {
                      matched: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$data",
                              as: "d",
                              cond: { $eq: ["$$d.month", "$$m"] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: { $ifNull: ["$$matched.count", 0] },
                  },
                },
              },
            },
          },
        },
      },
      { $unwind: "$months" },
      { $replaceRoot: { newRoot: "$months" } },
    ]);

    return { monthlyStats: stats };
  } catch (error: any) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Failed to fetch event creation stats",
      error
    );
  }
};


const findByAllEventIntoDb = async (
  query: Record<string, unknown>
) => {
  try {
    const baseQuery = events
      .find({ })
      .select("photo audience_settings.max_capacity event_title createdAt date starting_time ending_time audience_settings.price hostId event_category ").populate([
        {
          path: "hostId",
          select: "name email",
        },
      ]);

    const allEventQuery = new QueryBuilder(baseQuery, query)
      .search(['event_title','event_category' ])
      .filter()
      .sort()
      .paginate()
      .fields();

    const all_event = await  allEventQuery.modelQuery;
    const meta = await  allEventQuery.countTotal();

    return { meta, all_event };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "find By All Event IntoDb server unavailable",
      error
    );
  }
};


const adminDeleteEventIntoDb = async (eventId: string) => {
  try {
    const isExistEvent = await events.findById(eventId).select("photo");
    if (!isExistEvent) {
      throw new AppError(status.NOT_FOUND, "Event not found");
    }

    if (isExistEvent.photo) {
      const photos = Array.isArray(isExistEvent.photo) ? isExistEvent.photo : [isExistEvent.photo];
      photos.forEach((photoPath) => {
        try {
          const fullPath = path.resolve(photoPath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        } catch (err) {
          console.error(`Failed to delete file ${photoPath}:`, err);
        }
      });
    }


    await Promise.all([
      events.deleteMany({ _id: eventId }),
      chatrooms.deleteMany({ eventId }),
      joingroups.deleteMany({ eventId }), 
      pointsystems.deleteMany({ eventId }),
      ratings.deleteMany({ eventId }),
    ]);
    const isExistConversation = await conversations.findOne({ eventId });
    if (isExistConversation) {
      await Promise.all([
        conversations.findByIdAndDelete(isExistConversation._id),
        messages.deleteMany({ conversationId: isExistConversation._id }),
      ]);
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting event:", error);
    throw new AppError(status.SERVICE_UNAVAILABLE, "Issue while deleting event in DB");
  }
};


const hostAllEventAvgRatingIntoDb = async (hostId: string) => {
  try {
    const [result] = await events.aggregate([
      {
        $match: { hostId: new mongoose.Types.ObjectId(hostId) },
      },
      {
        $lookup: {
          from: "ratings",
          localField: "_id",
          foreignField: "eventId",
          as: "ratings",
        },
      },
      {
        $addFields: {
          avgRating: {
            $round: [
              { $ifNull: [{ $avg: "$ratings.rating" }, 0] },
              1,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          events: {
            $push: {
              eventId: "$_id",
              event_title: "$event_title",
              avgRating: "$avgRating",
            },
          },
          totalAvgRating: { $avg: "$avgRating" },
        },
      },
      {
        $project: {
          _id: 0,
          totalAvgRating: { $round: ["$totalAvgRating", 1] },
          // events: 1,
        },
      },
    ]);

    return result || { events: [], totalAvgRating: 0 };
  } catch (error: any) {
    console.error("Error fetching host all event avg rating:", error);
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "Issue while fetching host all event average rating."
    );
  }
};


const agoraAccessTokenIntoDb=async(eventId: string)=>{

    try{



      const result=await agoraAccessToken(`${eventId}`, eventId);

      console.log("Result from agoraAccessTokenIntoDb:", result);

      return result

    }
    catch(error){
       throw new AppError(
        status.SERVICE_UNAVAILABLE,
        "Issue while fetching host all event average rating."
    );
    }
    
}





const EventServices = {
  createEventIntoDb,
  MyEventListIntoDb,
  MyEventDashboardIntoDb,
  MyEventTypeWaysFilteringIntoDb,
  updateEventIntoDb,
  findBySpecificEventIntoDb,
  deleteEventIntoDb,
  findByUserSearchAllEventIntoDb,
   SearchingNearestLocationWaysNonEventIntoDb,
   findByAllLiveEventFilteringIntoDb,
    findByUpcommingAndPastEventFilteringIntoDb ,
    findByNearestEventIntoDb,
    getEventGrowthIntoDb,
     findByAllEventIntoDb,
     adminDeleteEventIntoDb,
     hostAllEventAvgRatingIntoDb,
     agoraAccessTokenIntoDb
};

export default EventServices;

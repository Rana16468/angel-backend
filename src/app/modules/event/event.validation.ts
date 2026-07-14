import { z } from "zod";
import {
  EventCategoryConstant,
  EventFeaturesConstant,
  ticketPriceConstant,
  VenueFacilityConstant,
  visibilityConstant,
} from "./event.constant";

const VenueFacilityEnum = z.enum(VenueFacilityConstant, {
  message: "Invalid venue facility type",
});

const EventCategoryEnum = z.enum(EventCategoryConstant, {
  message: "Invalid event category",
});

const EventFeaturesEnum = z.enum(EventFeaturesConstant, {
  message: "Invalid event feature",
});

const TicketPriceEnum = z.enum(ticketPriceConstant, {
  message: "Invalid ticket price type",
});

const VisibilityEnum = z.enum(visibilityConstant, {
  message: "Invalid visibility type",
});

// Venue facility schema
const VenueFacilitySchema = z.object({
  type: VenueFacilityEnum,
  available: z.boolean({ message: "Availability is required" }),
  description: z.string({ message: "Description is required" }),
}).optional();

// Social media schema
const SocialMediaSchema = z.object({
  content: z.boolean().optional(),
  gallery: z.boolean().optional(),
  sharing: z.boolean().optional(),
  streaming: z.boolean().optional(),
});

// Notification schema
const NotificationSchema = z.object({
  livechat: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  event_countdown: z.boolean().optional(),
});

// Point system schema
const PointSystemSchema = z.object({
  people: z.number({ message: "People count is required" }),
  point: z.number({ message: "Point is required" }),
});

// Event location schema
const EventLocationSchema = z.object({
  lat: z.string({ message: "Latitude is required" }),
  lon: z.string({ message: "Longitude is required" }),
});

// Audience settings schema with conditional validation
const AudienceSettingsSchema = z
  .object({
    age: z.any(),
    max_capacity: z.number({
      message: "Max capacity is required",
    }),
    visibility: VisibilityEnum,
    email: z.string().email("Invalid email format").optional(),
    social_media: SocialMediaSchema.optional(),
    notification: NotificationSchema.optional(),
    point_system: PointSystemSchema,
    ticket_price: TicketPriceEnum,
    price: z.number().optional(),
    event_location: EventLocationSchema,
  })
  .superRefine((data, ctx) => {
    if (data.visibility === "Private" && !data.email) {
      ctx.addIssue({
        path: ["email"],
        code: z.ZodIssueCode.custom,
        message: "Email is required when visibility is Private",
      });
    }
    if (data.visibility === "Public" && data.email) {
      ctx.addIssue({
        path: ["email"],
        code: z.ZodIssueCode.custom,
        message: "Email is not allowed when visibility is Public",
      });
    }

    if (data.ticket_price === "paid" && typeof data.price !== "number") {
      ctx.addIssue({
        path: ["price"],
        code: z.ZodIssueCode.custom,
        message: "Price is required when ticket_price is 'paid'",
      });
    }
    if (data.ticket_price === "free" && data.price) {
      ctx.addIssue({
        path: ["price"],
        code: z.ZodIssueCode.custom,
        message: "Price must not exist when ticket_price is 'free'",
      });
    }
  });

/**
 * ✅ Create Event Schema (all required)
 */
const createEventZodSchema = z.object({
  body: z.object({
    event_title: z.string({ message: "Event title is required" }),
    description: z.string({ message: "Description is required" }),
    photo: z.string({message:"photo is required"}).optional(),
    date: z.string({ message: "Date is required" }),
    starting_time: z.string({ message: "Starting time is required" }),
    ending_time: z.string({ message: "Ending time is required" }),
    venue_facilities: z.array(VenueFacilitySchema).optional().default([]),
    event_category: EventCategoryEnum,
    event_features: EventFeaturesEnum,
    audience_settings: AudienceSettingsSchema,
    isDelete: z.boolean().default(false),
  }),
});

/**
 * ✏️ Update Event Schema (all fields optional)
 */
const updateEventZodSchema = z.object({
  body: z.object({
    event_title: z.string().optional(),
    description: z.string().optional(),
    photo: z.string().optional(),
    date: z.string().optional(),
    starting_time: z.string().optional(),
    ending_time: z.string().optional(),
    venue_facilities: z.array(VenueFacilitySchema).optional(),
    event_category: EventCategoryEnum.optional(),
    event_features: EventFeaturesEnum.optional(),
    audience_settings: AudienceSettingsSchema.partial().optional(),
    isDelete: z.boolean().optional(),
  }),
});

const EventValidationSchema = {
  createEventZodSchema,
  updateEventZodSchema,
};

export default EventValidationSchema;

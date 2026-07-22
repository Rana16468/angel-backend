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

// ----------------------------------------------------
// Venue Facility
// ----------------------------------------------------

const VenueFacilitySchema = z.object({
  type: VenueFacilityEnum,
  available: z.boolean({
    message: "Availability is required",
  }),
  description: z.string({
    message: "Description is required",
  }),
});

// ----------------------------------------------------
// Social Media
// ----------------------------------------------------

const SocialMediaSchema = z.object({
  content: z.boolean().optional(),
  gallery: z.boolean().optional(),
  sharing: z.boolean().optional(),
  streaming: z.boolean().optional(),
});

// ----------------------------------------------------
// Notification
// ----------------------------------------------------

const NotificationSchema = z.object({
  livechat: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  event_countdown: z.boolean().optional(),
});

// ----------------------------------------------------
// Point System
// ----------------------------------------------------

const PointSystemSchema = z.object({
  people: z.number({
    message: "People count is required",
  }),
  point: z.number({
    message: "Point is required",
  }),
});

// ----------------------------------------------------
// Event Location
// ----------------------------------------------------

const EventLocationSchema = z.object({
  lat: z.string({
    message: "Latitude is required",
  }),
  lon: z.string({
    message: "Longitude is required",
  }),
});

// ----------------------------------------------------
// Audience Settings
// ----------------------------------------------------

const AudienceSettingsSchema = z
  .object({
    age: z.any(),

    max_capacity: z.number({
      message: "Max capacity is required",
    }),

    visibility: VisibilityEnum,

    social_media: SocialMediaSchema.optional(),

    notification: NotificationSchema.optional(),

    point_system: PointSystemSchema,

    ticket_price: TicketPriceEnum,

    price: z.number().optional(),

    event_location: EventLocationSchema,
  })
  .superRefine((data, ctx) => {
    // Paid event must have price
    if (
      data.ticket_price === "paid" &&
      typeof data.price !== "number"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["price"],
        message: "Price is required when ticket_price is 'paid'",
      });
    }

    // Free event cannot have price
    if (
      data.ticket_price === "free" &&
      data.price !== undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["price"],
        message: "Price must not exist when ticket_price is 'free'",
      });
    }
  });

// ----------------------------------------------------
// Create Event
// ----------------------------------------------------

const createEventZodSchema = z
  .object({
    body: z.object({
      event_title: z.string({
        message: "Event title is required",
      }),

      description: z.string({
        message: "Description is required",
      }),

      photo: z
        .string({
          message: "Photo is required",
        })
        .optional(),

      date: z.string({
        message: "Date is required",
      }),

      starting_time: z.string({
        message: "Starting time is required",
      }),

      ending_time: z.string({
        message: "Ending time is required",
      }),

      venue_facilities: z
        .array(VenueFacilitySchema)
        .optional()
        .default([]),

      event_category: EventCategoryEnum,

      event_features: EventFeaturesEnum,

      audience_settings: AudienceSettingsSchema,

      emailList: z
        .array(
          z.string()
        )
        .optional(),

      isDelete: z.boolean().default(false),
    }),
  })
  .superRefine((data, ctx) => {
    const visibility = data.body.audience_settings.visibility;
    const emails = data.body.emailList;

    // Private => emailList required
    if (
      visibility === "Private" &&
      (!emails || emails.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["body", "emailList"],
        message:
          "Email list is required when visibility is Private",
      });
    }

    // Public => emailList not allowed
    if (
      visibility === "Public" &&
      emails &&
      emails.length > 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["body", "emailList"],
        message:
          "Email list is not allowed when visibility is Public",
      });
    }
  });

// ----------------------------------------------------
// Update Event
// ----------------------------------------------------

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

    emailList: z
      .array(z.string().email("Invalid email address"))
      .optional(),

    isDelete: z.boolean().optional(),
  }),
});

const EventValidationSchema = {
  createEventZodSchema,
  updateEventZodSchema,
};

export default EventValidationSchema;
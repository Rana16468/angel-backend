import { z } from "zod";

const createEventPostSchema = z.object({
  body: z.object({
    eventId:z.string({error:"eventId is required"}).optional(),
    content: z.string().optional(),
    caption: z.string().optional(),
    tag_people: z
      .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid userId"))
      .optional()
      .default([]),
  }),
});
const createEventSocialFeedPostSchema = z.object({
  body: z.object({
    caption: z.string().optional(),
    tag_people: z
      .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid userId"))
      .optional()
      .default([]).optional(),
  }),
});

const updateEventPostSchema = z.object({
  body: z.object({
     eventId:z.string({error:"eventId is required"}).optional(),
    content: z.string().optional(),
    caption: z.string().optional(),
    tag_people: z
      .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid userId"))
      .optional()
      .default([]),
  }),
});




const eventPostValidation = {
  createEventPostSchema,
  updateEventPostSchema,
  createEventSocialFeedPostSchema 
};
export default eventPostValidation;

import { z } from "zod";


 const createSocialFeedReportZodSchema = z.object({
  body: z.object({
    event_postId: z.string({ error: "event_postId is required" }),
    reason: z
      .string({ error: "reason is required" })
      .min(3, "reason must be at least 3 characters long"),
    details: z.string().optional(),
  }),
});

 const updateSocialFeedReportZodSchema = z.object({
  body: z.object({
    reason: z.string().optional(),
    details: z.string().optional(),
    isDelete: z.boolean().optional(),
  }),
});


const socialFeedReportValidation={
    createSocialFeedReportZodSchema,
    updateSocialFeedReportZodSchema
};

export default socialFeedReportValidation;

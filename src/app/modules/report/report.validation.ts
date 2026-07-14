import { reportlikes } from './report.model';
import { z } from "zod";

const createReportZodSchema = z.object({
  body: z.object({
   
    category: z.enum(["Traffic", "Lost Item", "Queue", "Other"])
      .refine((val) => ["Traffic", "Lost Item", "Queue", "Other"].includes(val), {
        message: "Category must be Traffic, Lost Item, Queue, or Other",
      }),

    description: z.string().min(1, { message: "Description is required" }),

    photo: z.string().url({ message: "Photo must be a valid URL" }).optional(),

    location: z.string().min(1, { message: "Location is required" }),

    isDelete: z.boolean().optional(), 
  }),
});

const reportLikeUserSchema= z.object({
    body: z.object({
       reportId: z.string({error:"reportId is required"}),
       isLike: z.boolean({error:"isLike is not required"}).optional()
    })
})

const ReportValidation = {
  createReportZodSchema,
  reportLikeUserSchema
};

export default ReportValidation;

import { z } from "zod";

 const uploadMemoriesEventZodSchema = z.object({
  body : z.object({
  favoriteeventId: z.string().nonempty("userId is required"), 
  content: z.string().trim().min(1, "content is required"),
  contentType: z.enum(["photo", "video"]),
  description: z.string().trim().optional(),
  isDelete: z.boolean().optional().default(false),
  isFavorite: z.number().int().min(0).optional().default(0),
  })
});





const LovEemojiMemoriesEventZodSchema = z.object({

    body : z.object ({
          uploadMemorieSeventId: z .string()
         .min(1, "uploadMemorieSeventId is required"),
         isLove: z.boolean().optional().default(false),
         isDelete: z.boolean().optional().default(false),
    })
});

// Example: validation for request body
// const validatedData = LovEemojiMemoriesEventZodSchema.parse(req.body);



const uploadMemoriesEventValidation={
    uploadMemoriesEventZodSchema,
    LovEemojiMemoriesEventZodSchema
};

export default  uploadMemoriesEventValidation;



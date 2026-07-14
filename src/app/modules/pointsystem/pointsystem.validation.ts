import { z } from "zod";

 const PointSystemValidationSchema = z.object({

    body: z.object({
         eventId: z
    .string({
      error: "eventId is required",
    })
    .trim(),

  point: z
    .number({
      error: "point is required"
     
    })
    .min(0, { message: "point cannot be negative" })
    .default(10).optional(),

  isDelete: z.boolean().optional().default(false),
    })
});


const PointSystemValidation={
    PointSystemValidationSchema 
};
export default PointSystemValidation;






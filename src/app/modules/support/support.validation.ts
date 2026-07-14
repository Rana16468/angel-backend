import { z } from "zod";

const createSupportValidationSchema = z.object({
  body: z.object({
    name: z
      .string({ error: "Name is required" })
      .min(1, "Name cannot be empty")
      .trim(),

    email: z
      .string({ error: "Email is required" })
      .email("Invalid email format")
      .trim()
      .toLowerCase(),

    subject: z
      .string({ error: "Subject is required" })
      .min(1, "Subject cannot be empty")
      .trim(),

    message: z
      .string({ error: "Message is required" })
      .min(1, "Message cannot be empty")
  }),
});


const supportIssuesSchema=z.object({

    body: z.object({
        isSolve: z.boolean({error:" isSolve is Required"})
    })
})


const SupportValidation  ={
    createSupportValidationSchema,
    supportIssuesSchema
};

export default  SupportValidation ;


import { z } from "zod";

const joinEventSchema = z.object({
  body: z.object({
    groupName: z.string({
      message: "group name is required",
    }),
    userList: z.array(z.string({error:"user list is  not  required"}))
  }),
});


const additionalGroupImageSchema=z.object({
  body: z.object({
    photo: z.string({error:"photo is not  required"}).optional()
  })
})

const JoinEventValidation = {
  joinEventSchema,
  additionalGroupImageSchema
};

export default JoinEventValidation;

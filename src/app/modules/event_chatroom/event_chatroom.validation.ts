import { z } from "zod";

const chatRoomEventSchema = z.object({
  body: z.object({
    chatRoomName: z.string({
      message: "chat room event  is required",
    }),
  }),
});

const chatRoomEventValidation = {
  chatRoomEventSchema
};

export default chatRoomEventValidation;
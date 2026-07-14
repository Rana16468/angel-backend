import {z} from 'zod';


const reactEventPostSchema=z.object({
    body:z.object({

        eventpostId:z.string({error:"eventpostId is  required"}),
        isReact:z.boolean({error:"is React required "}).optional()
    })
});

 const commantEventPostSchema = z.object({
  body: z.object({
    eventpostId: z.string({
      error: "eventpostId is required",
    }),
      comment: z
      .string({
        error: "commant is required",
      })
      .min(1, "commant cannot be empty")
      .trim(),
      groupId: z.string().optional(),
        senderId: z.string().optional(),
    isDelete: z
      .boolean({
       error: "isDelete must be a boolean",
      })
      .optional()
      .default(false),
  }),
});

const liveEventCommentSchema= z.object({
  body:z.object({
     eventId:z.string({error:"eventId is required"}),
     comments: z.string({error:"comment is required"})

  })
});


 const eventShareCountPostSchema = z.object({
  body: z.object({
    eventpostId: z.string({
      error: "eventpostId is required",
    })
  }),
});

const liveEmojiSchema = z.object({
  body: z.object({
    eventId: z.string({
      error: "eventId is required",
    }),
    emoji: z.string({
      error: "emoji is required",
    }),
  }),
});





const reactEventPostValidation={
    reactEventPostSchema,
    commantEventPostSchema,
     liveEventCommentSchema,
     eventShareCountPostSchema,
     liveEmojiSchema
    
};

export default  reactEventPostValidation;
import {z } from 'zod';

const eventRepliesCommentSchema=z.object({
    body:z.object({
        commentEventPostId:z.string({error:"commentEventPostId is requited"}),
        comment: z.string({error:"comment is required"})

    })
});


const eventRepliesCommentValidation={
    eventRepliesCommentSchema
};

export default  eventRepliesCommentValidation;
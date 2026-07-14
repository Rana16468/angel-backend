import {z } from 'zod';


const   RatingSchema=z.object({
    body:z.object({
        eventId:z.string({error:"eventId is required"}),
        rating: z.number({error:"rating is required"})

    })
});


const RatingValidation={
      RatingSchema
};

export default RatingValidation;
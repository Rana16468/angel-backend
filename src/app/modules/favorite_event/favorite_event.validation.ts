 import { z } from "zod";
 
 const FavoriteEventZodSchema = z.object({
    body: z.object({
         id: z.string().optional(),
        name: z.string({ error: "name is required" }),
  address: z.string({ error: "address is required" }),
  rating: z.number({ error: "rating is required" }),
  totalRatings: z.number({ error: "total rating is required" }),
  location: z.object({
    lat: z.number({ error: "lat is required" }),
    lng: z.number({ error: "lng is required" }),
  }),
  placeId: z.string({ error: "placeId is required" }).optional(),
  openNow: z.boolean().nullable().optional(),
  types: z.array(z.string()).optional().default([]),
  image: z.string().nullable().optional(),
  
  isDelete: z.boolean().optional().default(false),
    })
});


const FavoriteEventValidation={
    FavoriteEventZodSchema
};

export default FavoriteEventValidation
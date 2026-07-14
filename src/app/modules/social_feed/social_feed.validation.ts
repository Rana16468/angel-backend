import { z } from "zod";


 const SocialFeedSchema  = z.object({
   body: z.object({
   message: z.string().optional(), 
   content: z.string().optional(),
   isDelete: z.boolean().optional().default(false),
   })
});


  const  SocialFeedValidation={
     SocialFeedSchema 
  };

  export default SocialFeedValidation;


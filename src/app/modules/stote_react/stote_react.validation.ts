import {z} from "zod";

const createStoreReactValidationSchema = z.object({
    body: z.object({
     storeId: z.string().trim().nonempty("Store ID is required"),
    isReact: z.boolean(),
    })
});



const StoreReactValidation = {
    createStoreReactValidationSchema
};

export default StoreReactValidation;



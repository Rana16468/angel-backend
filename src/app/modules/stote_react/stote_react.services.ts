import status from "http-status";
import AppError from "../../errors/AppError";
import { TStoreReactProps } from "./stote_react.interface";
import storereacts from "./stote_react.model";
import socialfeeds from "../social_feed/social_feed.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { Types } from "mongoose";
import fs from "fs";
import path from "path";

const recordedStoreReactIntoDb = async (userId:string,payload: TStoreReactProps):Promise<{ status: boolean; message: string }> => {


   try{

       const isExistStore=await socialfeeds.findById(payload.storeId).select("_id").lean()  ;

       if(!isExistStore){   
        throw new AppError(status.NOT_FOUND, 'Store not found');
       }
         const isExistReact=await storereacts.findOne({userId:userId,storeId:payload.storeId}).select("_id isReact").lean()  ;
         if(isExistReact){  
            await storereacts.findByIdAndUpdate(isExistReact._id,{isReact:payload.isReact},{new:true}).lean()  ;
         };
            if(!isExistReact){ 
                await storereacts.create({...payload,userId:userId})  ;
            }   ;


            return{
                status: true , 
                message: "Store react recorded successfully"
            }


   }
   catch(error){
    throw new AppError(status.INTERNAL_SERVER_ERROR, 'Error recording store react', error instanceof Error ? error.message : String(error));
   }
};



const findMyAllStoreReactsIntoDb = async (
  storeId: string,
  query: Record<string, any>
) => {
  try {
    // Validate storeId
    if (!Types.ObjectId.isValid(storeId)) {
      throw new AppError(status.BAD_REQUEST, "Invalid storeId");
    }

    console.log("Query parameters:", storeId); // Debug log for query parameters  

    const allUsersQuery = new QueryBuilder(
      storereacts.find({ storeId }).populate([
        {
          path: "userId",
          select: "name photo",
        },
      ]).select("-storeId -__v"),
      query
    )
      .search(["userId.name"]) 
      .filter()
      .sort()
      .paginate()
      .fields();

    const all_users = await allUsersQuery.modelQuery;
    const meta = await allUsersQuery.countTotal();

    return { meta, all_users };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "Failed to fetch store reacts",
      error
    );
  }
};


const deleteStoreReactIntoDb = async (
  id: string
): Promise<{ status: boolean; message: string }> => {
  try {
    // 1. Check if StoreReact exists
    const storeReact = await storereacts.findOne({storeId: id}).select("_id storeId").lean();
    if (!storeReact) {
      throw new AppError(status.NOT_FOUND, "Store React not found");
    }

    // 2. Find the related social feed to delete its content file
    const socialFeed = await socialfeeds.findById(storeReact.storeId)
      .select("_id content")
      .lean();

    if (socialFeed && socialFeed.content) {
      const fullPath = path.resolve(socialFeed.content);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath); // Consider fs.promises.unlink for async
        console.log(`Deleted file: ${fullPath}`);
      }
    }

    // 3. Delete the StoreReact document
    
    await storereacts.deleteOne({ storeId: storeReact.storeId }).lean();
    await socialfeeds.deleteOne({ _id: storeReact.storeId }).lean();

    return { status: true, message: "Store React deleted successfully" };
  } catch (error: any) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Error deleting store react",
      error instanceof Error ? error.message : String(error)
    );
  }
};




const StoreReactServices = {
    recordedStoreReactIntoDb,
     findMyAllStoreReactsIntoDb,
     deleteStoreReactIntoDb
};


export default  StoreReactServices; 
import status from "http-status";
import AppError from "../../errors/AppError";
import { FavoriteEventResponse, TFavoriteEvent } from "./favorite_event.interface";
import favoriteevents from "./favorite_event.model";
import QueryBuilder from "../../builder/QueryBuilder";
import geolib, { getDistance } from 'geolib';


const recordedMyFavoriteEventIntoDb=async(payload:TFavoriteEvent, userId:string):Promise<FavoriteEventResponse>=>{

      try{
         const isExistMyFavoriteList=await  favoriteevents.exists({id:payload?.id})
         if(isExistMyFavoriteList){
           return{
            status:false, 
            message:"exist in your favorite list  "
           }
         };
         const favoriteListBuilder= new favoriteevents({ ...payload,userId, isReact:true});
         const result=await favoriteListBuilder.save();
         if(!result){
            throw new AppError(status.NOT_EXTENDED, 'issues by the  recordedMyFavoriteEventIntoDb  server section ')
         };
         return {
            status:true, 
            message:"Successfully Recorded"
           }

      }
      catch(error:any){
        throw new AppError(status.INTERNAL_SERVER_ERROR, ' issues bu the recordedMyFavoriteEventIntoDb server unavailable')
      }
};


 const findByAllMyFavoriteEventIntoDb = async (
  query: Record<string, unknown>,
  userId: string
) => {
  try {
   
    const currentLat = Number(query.lat);
    const currentLng = Number(query.lng);

    // Your existing query builder
    const allMyFavoriteEventQuery = new QueryBuilder(
      favoriteevents
        .find({ userId, isDelete: false })
        .select(" -totalRatings -createdAt -updatedAt -userId")
        .lean(),
        
    { page: query.page ,limit: query.limit}
    )
      .search([])
      .filter()
      .sort()
      .paginate()
      .fields();

    const my_favorite_event = await allMyFavoriteEventQuery.modelQuery;
    const meta = await allMyFavoriteEventQuery.countTotal();

    // ✅ Add distance (in km) to each event
    const updatedEvents = my_favorite_event.map((event: any) => {
      if (event?.location?.lat && event?.location?.lng) {
        const distanceInMeters = getDistance(
          { latitude: currentLat, longitude: currentLng },
          { latitude: event.location.lat, longitude: event.location.lng }
        );

        const distanceInKm = (distanceInMeters / 1000).toFixed(2); 
        return { ...event, distance: `${distanceInKm} km` };
      } else {
        return { ...event, distance: null };
      }
    });

    return { meta, my_favorite_event: updatedEvents };
  } catch (error: any) {
    console.error(error);
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Issue in findByAllMyFavoriteEventIntoDb: server unavailable"
    );
  }
};





    const  deleteMyFavoriteEventIntoDb=async(userId:string, id:string):Promise<FavoriteEventResponse>=>{

     try{

        const isExist=await  favoriteevents.exists({userId, _id:id}).lean();
        if(!isExist){
            throw new AppError(status.NOT_FOUND, 'NOT FOUNDED ')
        };

         const result=await favoriteevents.findOneAndDelete({userId, _id:id });
         if(!result){
            throw new AppError(status.NOT_EXTENDED, 'ISSUES BY THE DELETE FAVORITE EVENT SECTION  ')
         };
         return {
             status:true , 
              message:"successfully delete"
         }

     }
        catch(error:any){
        throw new AppError(status.INTERNAL_SERVER_ERROR, ' issues bu the deleteMyFavoriteEventIntoDb server unavailable')
      }   

         
    };

    // my favorite event details 

  const findBySpecificMyFavoriteEventIntoDb=async(id:string, userId:string)=>{

     try{

        return await favoriteevents.findOne({_id:id, userId}).populate([
            { 
            path: "userId",
            select: "name photo",
            }
            // use another filtering  populate
        ]).select("-openNow").lean();

     }
      catch(error:any){
        throw new AppError(status.INTERNAL_SERVER_ERROR, ' issues bu the find By Specific My Favorite Event IntoDb server unavailable','');
      }   

  };

// uploadMemoriesForSpecificEventIntoDB

const FavoriteEventServices={
    recordedMyFavoriteEventIntoDb,
    findByAllMyFavoriteEventIntoDb,
     deleteMyFavoriteEventIntoDb,
      findBySpecificMyFavoriteEventIntoDb,
};
export default FavoriteEventServices;
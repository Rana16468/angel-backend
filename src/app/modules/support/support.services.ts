import status from "http-status";
import AppError from "../../errors/AppError";
import { TSupport } from "./support.interface";
import supports from "./support.model";
import { startOfDay, endOfDay } from "date-fns";
import QueryBuilder from "../../builder/QueryBuilder";
import { user_search_filed } from "./support.constant";


const sendSupportMessageIntoDB = async (
  userId: string,
  payload: Partial<TSupport>
) => {
  try {
    // 📅 Get today's start and end time
    const start = startOfDay(new Date());
    const end = endOfDay(new Date());

    // 🔍 Count today's messages for this user
    const todayCount = await supports.countDocuments({
      userId,
      createdAt: {
        $gte: start,
        $lte: end,
      },
      isDelete: false,
    });

    // 🚫 Limit check (max 5 per day)
    if (todayCount >= 5) {
      throw new AppError(
        status.BAD_REQUEST,
        "You can send only 5 support messages per day"
      );
    }

    // ✅ Create support message
    const result = await supports.create({
      userId,
      ...payload,
    });

    if (!result) {
      throw new AppError(
        status.NOT_EXTENDED,
        "Issue in support message recording"
      );
    }

    return {
      status: true,
      message: "Successfully recorded",
    };
  } catch (error) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "Support message service error"
    );
  }
};



const findByAllSupportAdminIntoDb = async (
  query: Record<string, unknown>
) => {
  try {
    const allSupportQuery = new QueryBuilder(
      supports
        .find({ isSolve: false})
        .populate([
          {
            path: "userId",
            select: "name email phoneNumber", // show useful user info
          },
        ]),
      query
    )
      .search(["name", "email", "subject", "message"]) // 🔍 searchable fields
      .filter()
      .sort()
      .paginate()
      .fields();

    const supportsData = await allSupportQuery.modelQuery;
    const meta = await allSupportQuery.countTotal();

    return {
      meta,
      data: supportsData,
    };
  } catch (error: any) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      "Failed to fetch support messages",
      error
    );
  }
};


const deleteSupportIntoDb=async(id:string)=>{

    try{


      const result=await supports.findByIdAndDelete(id);

       if(!result){
        throw new AppError(status.NOT_EXTENDED ,'issues by the delete support section ')
       };

       return {
           status: true , 
           message:"successfully delete"
       }



    }
    catch(error: any){
      throw new AppError( status.SERVICE_UNAVAILABLE, 'Failed to fetch support messages', error)
    }
};


const solveSupportIssuesIntoDb = async (
  id: string,
  payload: { isSolve: boolean }
) => {
  try {
  
    if (!id) {
      throw new AppError(status.BAD_REQUEST, "Support ID is required");
    }

    if (typeof payload.isSolve !== "boolean") {
      throw new AppError(status.BAD_REQUEST, "isSolve must be a boolean");
    }


    const result = await supports.findByIdAndUpdate(
      id,
      { isSolve: payload.isSolve },
      { new: true }
    );

    if (!result) {
      throw new AppError(status.NOT_FOUND, "Support issue not found");
    }

    return {
      status: true,
      message: "Support issue updated successfully"
    };
  } catch (error: any) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Failed to update support issue",
      error
    );
  }
};



const SupportServices={
    sendSupportMessageIntoDB,
   findByAllSupportAdminIntoDb,
   deleteSupportIntoDb,
    solveSupportIssuesIntoDb
};

export default SupportServices;

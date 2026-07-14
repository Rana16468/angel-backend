import { RequestHandler } from "express";
import catchAsync from "../../utils/asyncCatch"
import StoreReactServices from "./stote_react.services";
import sendResponse from "../../utils/sendResponse";
import status from "http-status";


const recordedStoreReact: RequestHandler = catchAsync(
  async (req, res) => {
    // Call service method
    const result = await StoreReactServices.recordedStoreReactIntoDb(
      req.user.id,
      req.body
    );

    // Send response
    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Successfully Recorded Store React",
      data: result,
    });
  }
);


const findMyAllStoreReacts: RequestHandler = catchAsync(
  async (req, res) => {
    // Call service method
    const result = await StoreReactServices.findMyAllStoreReactsIntoDb(
      req.params.storeId,
      req.query
    );

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Successfully retrieved all store reacts",
      data: result
    });
  }
);


const deleteStoreReact: RequestHandler = catchAsync(
  async (req, res) => {
    // Call service method  
    const result = await StoreReactServices.deleteStoreReactIntoDb(
        req.params.storeId);

sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Successfully deleted store react",
      data: result
    });
  }
);


const StoreReactController = {
    recordedStoreReact, 
    findMyAllStoreReacts,
    deleteStoreReact
};

export default StoreReactController;


import { RequestHandler } from "express";
import catchAsync from "../../utils/asyncCatch";
import PaymentSystemServices from "./pointsystem.services";
import sendResponse from "../../utils/sendResponse";
import status from "http-status";

const recordedPointSystem: RequestHandler = catchAsync(async (req, res) => {
  const result = await PaymentSystemServices.recordedPointSystemIntoDb(
    req.user.id,
    req.body
  );
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Congratulations! You have successfully earned reward points.',
    data: result,
  });
});

const recordEngagementPoint: RequestHandler = catchAsync(async (req, res) => {
  const result = await PaymentSystemServices.recordEngagementPointIntoDb(
    req.user.id,
    req.body
  );
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const calculateRedemption: RequestHandler = catchAsync(async (req, res) => {
  const result = await PaymentSystemServices.calculateRedemptionIntoDb(
    req.user.id,
    req.body
  );
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Successfully calculated point redemption value.',
    data: result,
  });
});

const redeemPoints: RequestHandler = catchAsync(async (req, res) => {
  const result = await PaymentSystemServices.redeemPointsIntoDb(
    req.user.id,
    req.body
  );
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const findMyAveragePointSystem: RequestHandler = catchAsync(async (req, res) => {
  const result = await PaymentSystemServices.findMyAveragePointSystemIntoDb(
    req.user.id
  );
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Successfully found your points balance and statistics.',
    data: result,
  });
});

const findPointRules: RequestHandler = catchAsync(async (req, res) => {
  const result = await PaymentSystemServices.findPointRulesIntoDb();
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Successfully retrieved Thrillio Point Rules',
    data: result,
  });
});

const PaymentSystemController = {
  recordedPointSystem,
  recordEngagementPoint,
  calculateRedemption,
  redeemPoints,
  findMyAveragePointSystem,
  findPointRules,
};

export default PaymentSystemController;


 
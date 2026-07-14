import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLE } from '../user/user.constant';
import auth from '../../middlewares/auth';
import upload from '../../utils/uploadFile';
import AppError from '../../errors/AppError';
import status from 'http-status';
import validationRequest from '../../middlewares/validationRequest';
import ReportValidation from './report.validation';
import ReportController from './report.controller';


const route = express.Router();

route.post(
  "/report_recording",
  auth(USER_ROLE.host, USER_ROLE.thrillseekers),
  upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body.data && typeof req.body.data === "string") {
        req.body = JSON.parse(req.body.data);
      }
      next();
    } catch (error) {
      next(new AppError(status.BAD_REQUEST, "Invalid JSON data", ""));
    }
  },
  validationRequest(ReportValidation.createReportZodSchema),
 ReportController.recordedReport
);

route.get("/find_by_all_report", auth(USER_ROLE.host, USER_ROLE.thrillseekers), ReportController. findByAllReport);

route.delete("/delete_report/:id", auth(USER_ROLE.thrillseekers, USER_ROLE.host), ReportController.deleteReport);
route.post("/report_like", auth(USER_ROLE.host, USER_ROLE.thrillseekers), validationRequest(ReportValidation.reportLikeUserSchema),  ReportController.reportLikeUser);
const ReportRoutes=route;

export default ReportRoutes;
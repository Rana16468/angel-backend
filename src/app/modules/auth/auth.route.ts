import express, { NextFunction, Request, Response } from "express";

import AuthController from "./auth.controller";
import LoginValidationSchema from "./auth.validation";

import { USER_ROLE } from "../user/user.constant";

import httpStatus from "http-status";
import validationRequest from "../../middlewares/validationRequest";
import auth from "../../middlewares/auth";
import upload from "../../utils/uploadFile";
import AppError from "../../errors/AppError";

const router = express.Router();

router.post(
  "/login_user",
  validationRequest(LoginValidationSchema.LoginSchema),
  AuthController.loginUser
);

router.post(
  "/refresh-token",
  validationRequest(LoginValidationSchema.requestTokenValidationSchema),
  AuthController.refreshToken
);

router.get(
  "/myprofile",
  auth(
    USER_ROLE.host,
    USER_ROLE.thrillseekers,
    USER_ROLE.superAdmin,
    USER_ROLE.admin
  ),
  AuthController.myprofile
);

// Routes file
router.patch(
  "/update_my_profile",
  auth(
    USER_ROLE.host,
    USER_ROLE.thrillseekers,
    USER_ROLE.superAdmin,
    USER_ROLE.admin
  ),
  upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body.data && typeof req.body.data === "string") {
        req.body = JSON.parse(req.body.data);
      }
      next();
    } catch (error) {
      next(new AppError(httpStatus.BAD_REQUEST, "Invalid JSON data", ""));
    }
  },
  validationRequest(LoginValidationSchema.changeMyProfileSchema),
  AuthController.chnageMyProfile
);

router.get(
  "/find_by_admin_all_users",
  auth(USER_ROLE.admin, USER_ROLE.superAdmin),
  AuthController.findByAllUsersAdmin
);

router.get(
  "/tag_user",
  auth(USER_ROLE.host, USER_ROLE.thrillseekers),
  AuthController.tagUser
);

router.delete(
  "/delete_account/:id",
  auth(
    USER_ROLE.admin,
    USER_ROLE.host,
    USER_ROLE.superAdmin,
    USER_ROLE.thrillseekers
  ),
  AuthController.deleteAccount
);

router.get("/dashboard_count", auth(USER_ROLE.admin,USER_ROLE.superAdmin), AuthController.dashboardCount);
router.get("/user_graph", auth(USER_ROLE.admin,USER_ROLE.superAdmin), AuthController.getUserGrowth);


router.patch(
  "/change_status/:id",
  auth(USER_ROLE.admin, USER_ROLE.superAdmin),
  validationRequest(LoginValidationSchema.changeUserAccountStatus),
  AuthController.isBlockAccount
);





const AuthRouter = router;
export default AuthRouter;

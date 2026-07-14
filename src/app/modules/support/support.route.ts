import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import SupportController from './support.controller';
import validationRequest from '../../middlewares/validationRequest';
import SupportValidation from './support.validation';

const route=express.Router();

route.post("/contact", auth(USER_ROLE.thrillseekers,  USER_ROLE.host),validationRequest(SupportValidation.createSupportValidationSchema), SupportController.sendSupportMessage );

route.get("/find_by_all_issues", SupportController.findByAllSupportAdmin);

route.delete("/delete_support/:id", SupportController.deleteSupport);
route.patch("/resolve_issues/:id", validationRequest(SupportValidation.supportIssuesSchema),SupportController.solveSupportIssues);




const SupportRouter=route;

export default SupportRouter;


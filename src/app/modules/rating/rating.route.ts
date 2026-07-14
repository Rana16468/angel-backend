import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import validationRequest from '../../middlewares/validationRequest';
import RatingValidation from './rating.validation';
import RatingController from './rating.controller';

const route=express.Router();

route.post("/record_rating_event",auth(USER_ROLE.host,USER_ROLE.thrillseekers),validationRequest(RatingValidation.RatingSchema), RatingController.recordedRating);


const RatingRouter=route;

export default RatingRouter;
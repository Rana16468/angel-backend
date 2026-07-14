import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import validationRequest from '../../middlewares/validationRequest';
import FavoriteEventValidation from './favorite_event.validation';
import recordedMyFavoriteEventController from './favorite_event.controller';

const route=express.Router();
route.post("/recorded_my_favorite_event", auth(USER_ROLE.host,USER_ROLE.thrillseekers), validationRequest( FavoriteEventValidation.FavoriteEventZodSchema),recordedMyFavoriteEventController.recordedMyFavoriteEvent);
route.get("/find_by_all_my_favorite_event", auth(USER_ROLE.thrillseekers), recordedMyFavoriteEventController.findByAllMyFavoriteEvent);
route.delete("/delete_my_favorite_event/:id", auth(USER_ROLE.host,USER_ROLE.thrillseekers
), recordedMyFavoriteEventController.deleteMyFavoriteEvent);

 route.get("/find_by_specific_my_favorite_event/:id", auth(USER_ROLE.host,USER_ROLE.thrillseekers), recordedMyFavoriteEventController.findBySpecificMyFavoriteEvent)

const FavoriteEventRoutes=route;

export default FavoriteEventRoutes;
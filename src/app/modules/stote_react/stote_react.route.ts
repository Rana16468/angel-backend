import express from "express";
import StoreReactController from "./stote_react.controller";
import auth from "../../middlewares/auth";  
import { USER_ROLE } from "../user/user.constant";
import validationRequest from "../../middlewares/validationRequest";
import StoreReactValidation from "./stote_react.validation";


const route = express.Router();
route.post("/record_store_react", auth(USER_ROLE.thrillseekers, USER_ROLE.host), validationRequest(StoreReactValidation.createStoreReactValidationSchema),  StoreReactController.recordedStoreReact);
route.get("/find_my_all_store_reacts/:storeId", auth(USER_ROLE.thrillseekers, USER_ROLE.host), StoreReactController.findMyAllStoreReacts);
route.delete("/delete_store_react/:storeId", auth(USER_ROLE.thrillseekers, USER_ROLE.host), StoreReactController.deleteStoreReact);

const storeReactRoute = route;

export default storeReactRoute;


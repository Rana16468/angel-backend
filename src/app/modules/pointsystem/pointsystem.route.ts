import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import validationRequest from '../../middlewares/validationRequest';
import PointSystemValidation from './pointsystem.validation';
import PaymentSystemController from './pointsystem.controller';


const router=express.Router();



router.post("/recorded_point_system", auth(USER_ROLE.host,USER_ROLE.thrillseekers), validationRequest( PointSystemValidation.PointSystemValidationSchema), PaymentSystemController.recordedPointSystem);
router.get("/my_avg_point", auth(USER_ROLE.host,USER_ROLE.thrillseekers), PaymentSystemController.findMyAveragePointSystem);

const PointSystemRouter=router;

export default PointSystemRouter;
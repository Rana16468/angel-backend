import admin from 'firebase-admin';
import dotenv from 'dotenv';
import config from './index';
import httpStatus from 'http-status';
import AppError from '../errors/AppError';


dotenv.config();

if (
  !config.firebase_account_key.clientEmail ||
  !config.firebase_account_key.privateKey ||
  !config.firebase_account_key.projectId 
  
) {
  throw new AppError(
    httpStatus.NOT_FOUND,
    'Missing Firebase configuration in environment variables',
    '',
  );
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: config.firebase_account_key.projectId,
     clientEmail: config.firebase_account_key.clientEmail,
   privateKey: config.firebase_account_key.privateKey.replace(/\\n/g, '\n'),

  } as admin.ServiceAccount),
});



const firebaseAdmin=admin


export default  firebaseAdmin;

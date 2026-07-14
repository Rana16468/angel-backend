import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  port: process.env.PORT || 5000,
  database_url: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  send_email: {
    nodemailer_email: process.env.NODEMAILER_EMAIL,
    nodemailer_password: process.env.NODEMAILER_PASSWORD,
  },
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  expires_in: process.env.EXPIRES_IN,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  refresh_expires_in: process.env.REFRESH_EXPIRES_IN,
firebase_account_key: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  },
   file_path: process.env.FILE_PATH,
   host: process.env.HOST,
   google_maps_api_key:process.env.GOOGLE_MAPS_API_KEY,
   google_maps_api: process.env.GOOGLE_MAP_API,
   payment_getway_credentials:{
     paypal_client_id: process.env.PAYPAL_CLIENT_ID,
     paypal_client_secret: process.env.PAYPAL_CLIENT_SECRET,
      paypal_base_url: process.env.PAYPAL_BASE_URL, 
      frontend_url:process.env.FRONTEND_URL
   },
     stripe_payment_gateway: {
    stripe_secret_key: process.env.STRIPE_SECRET_KEY,
    stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
    onboarding_refresh_url: process.env.ONBOARDING_REFRESH_URL,
    onboarding_return_url: process.env.ONBOARDING_RETURN_URL,
    checkout_success_url: process.env.CHECKOUT_SUCCESS_URL,
    checkout_cancel_url: process.env.CHECKOUT_CANCEL_URL,

    
  },
  agoraToken:{
    appId:process.env.APP_ID,
    app_certificate: process.env.APP_CERTIFICATE

  }
};

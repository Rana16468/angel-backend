import cors from "cors";
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import path from "path";

import router from "./app/routes";
import notFound from "./app/middlewares/notFound";
import globalErrorHandelar from "./app/middlewares/globalErrorHandler";
import auto_delete_unverifyed_user from "./app/utils/auto_delete_unverifyed_user";
import AppError from "./app/errors/AppError";
import status from "http-status";
import cron from "node-cron";

import handle_unpaid_payment from "./app/utils/handle_unpaid_payment";
import createOrUpdateSuperAdmin from "./app/utils/superAdmin";
import autoDeleteSupport from "./app/utils/autoDeleteSupport";
import autoDeleteStoryAfter24Hours from "./app/utils/autoDeleteStoryAfter24Hours";
import systemArtc from "./app/utils/metrics/systemArtc";
import monitorRouter from "./app/utils/metrics/metricsMiddleware";
import paypalPaymentController from "./app/modules/payment_gateway/payment_gateway.controller";

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

const app = express();




app.use(cookieParser());

app.use(
  bodyParser.json({
    verify: function (
      req: express.Request,
      res: express.Response,
      buf: Buffer,
    ) {
      req.rawBody = buf;
    },
  }),
);


app.post(
  "/api/v1/payment/webhook",
  express.raw({ type: "application/json" }),
  paypalPaymentController.handleWebhook
);


app.use(bodyParser.json());

app.use(express.urlencoded({ extended: true }));
// রুট ডিরেক্টরি থেকে সরাসরি public ফোল্ডারকে সার্ভ করা
app.use(
  '/src/public',
  express.static(path.resolve(process.cwd(), 'src', 'public'))
);

app.use(
  cors({
    credentials: true,
     origin:true,
    
  }),
);

// Deep Linking verification endpoints (.well-known)
app.get('/.well-known/assetlinks.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "co.thrillio.app",
        sha256_cert_fingerprints: [
          "10:ED:C9:F4:79:AB:05:43:D9:D2:C3:7E:11:AA:68:55:0C:BF:CF:DC:1D:93:33:DE:78:37:D5:CD:DE:28:EA:3A"
        ]
      }
    }
  ]);
});

app.get('/.well-known/apple-app-site-association', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    applinks: {
      apps: [],
      details: [
        {
          appID: "YOUR_APPLE_TEAM_ID.co.thrillio.app",
          paths: ["*"]
        }
      ]
    }
  });
});

// delete expaire subscription auto delete

app.get("/", (_req, res) => {
  res.send(systemArtc());
});

// auto_delete_unverifyed_user
cron.schedule("*/30 * * * *", async () => {
  try {
    await auto_delete_unverifyed_user();
  } catch (error: any) {
    throw new AppError(
      status.BAD_REQUEST,
      "Issues in the notification cron job (every 30 minutes)",
      error
    );
  }
});
cron.schedule("*/30 * * * *", async () => { 
  try {
    await autoDeleteStoryAfter24Hours();
  } catch (error: any) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      'Error while auto deleting stories:',
      error
    );
  }
});

cron.schedule('*/30 * * * *', async () => {
  try {
    await handle_unpaid_payment();
  } catch (error: any) {
     throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      'Error while auto delete payment issues',
      error
    );
  }
});

// Run createOrUpdateSuperAdmin every 2 minutes
cron.schedule('*/30 * * * *', async () => {
  try {
    await createOrUpdateSuperAdmin();
  } catch (error: any) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      'Error while running Super Admin auto-update task',
      error?.message || error
    );
  }
});



cron.schedule('*/30 * * * *', async () => {
  console.log('⏱ Auto-delete task started at', new Date().toISOString());
  try {
    await autoDeleteSupport();
  } catch (error: any) {
    console.error('❌ Error in Super Admin auto-update task:', error);
  } finally {
    console.log('✅ Auto-delete task finished at', new Date().toISOString());
  }
});

app.use("/api/v1", router);
app.use("/api/v1/monitor", monitorRouter); // ← metrics endpoint

app.use(notFound);
app.use(globalErrorHandelar);

export default app;

// new password aws : 3NmSy:mL8KFU6WDF
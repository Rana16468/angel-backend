import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import cron from "node-cron";
import status from "http-status";

import config from "./app/config";
import router from "./app/routes";

import notFound from "./app/middlewares/notFound";
import globalErrorHandelar from "./app/middlewares/globalErrorHandler";

import paypalPaymentController from "./app/modules/payment_gateway/payment_gateway.controller";

import auto_delete_unverifyed_user from "./app/utils/auto_delete_unverifyed_user";
import handle_unpaid_payment from "./app/utils/handle_unpaid_payment";
import createOrUpdateSuperAdmin from "./app/utils/superAdmin";
import autoDeleteSupport from "./app/utils/autoDeleteSupport";
import autoDeleteStoryAfter24Hours from "./app/utils/autoDeleteStoryAfter24Hours";

import systemArtc from "./app/utils/metrics/systemArtc";
import monitorRouter from "./app/utils/metrics/metricsMiddleware";

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

const app = express();

/**
 * ------------------------------------
 * Stripe / PayPal Webhook
 * IMPORTANT:
 * Must be BEFORE express.json()
 * ------------------------------------
 */
app.post(
  "/api/v1/payment/webhook",
  express.raw({ type: "application/json" }),
  paypalPaymentController.handleWebhook
);

/**
 * ------------------------------------
 * Middlewares
 * ------------------------------------
 */

app.use(cookieParser());

app.use(
  express.json({
    verify: (req: Request, _res: Response, buf: Buffer) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    credentials: true,
    origin:
      config.NODE_ENV === "production"
        ? [
            "https://thrillio.co",
            "https://www.thrillio.co",
          ]
        : true,
  })
);

/**
 * ------------------------------------
 * Static Folder
 * ------------------------------------
 */

app.use(
  "/public",
  express.static(path.join(process.cwd(), "src", "public"))
);

/**
 * ------------------------------------
 * Health Check
 * ------------------------------------
 */

app.get("/", (_req, res) => {
  res.status(200).send(systemArtc());
});

/**
 * ------------------------------------
 * Cron Jobs
 * ------------------------------------
 */

const EVERY_30_MINUTES = "*/30 * * * *";

/**
 * Auto Delete Unverified Users
 */
cron.schedule(EVERY_30_MINUTES, async () => {
  console.log("Running Auto Delete Unverified User Job...");

  try {
    await auto_delete_unverifyed_user();
    console.log("Auto Delete Unverified User Completed");
  } catch (error) {
    console.error("Auto Delete Unverified User Failed:", error);
  }
});

/**
 * Auto Delete Stories
 */
cron.schedule(EVERY_30_MINUTES, async () => {
  console.log("Running Story Cleanup...");

  try {
    await autoDeleteStoryAfter24Hours();
    console.log("Story Cleanup Completed");
  } catch (error) {
    console.error("Story Cleanup Failed:", error);
  }
});

/**
 * Handle Unpaid Payments
 */
cron.schedule(EVERY_30_MINUTES, async () => {
  console.log("Running Unpaid Payment Handler...");

  try {
    await handle_unpaid_payment();
    console.log("Unpaid Payment Handler Completed");
  } catch (error) {
    console.error("Unpaid Payment Handler Failed:", error);
  }
});

/**
 * Super Admin Update
 */
cron.schedule(EVERY_30_MINUTES, async () => {
  console.log("Running Super Admin Update...");

  try {
    await createOrUpdateSuperAdmin();
    console.log("Super Admin Updated");
  } catch (error) {
    console.error("Super Admin Update Failed:", error);
  }
});

/**
 * Auto Delete Support
 */
cron.schedule(EVERY_30_MINUTES, async () => {
  console.log("Running Support Cleanup...");

  try {
    await autoDeleteSupport();
    console.log("Support Cleanup Completed");
  } catch (error) {
    console.error("Support Cleanup Failed:", error);
  }
});

/**
 * ------------------------------------
 * Routes
 * ------------------------------------
 */

app.use("/api/v1/monitor", monitorRouter);
app.use("/api/v1", router);

/**
 * ------------------------------------
 * Error Handlers
 * ------------------------------------
 */

app.use(notFound);
app.use(globalErrorHandelar);

export default app;
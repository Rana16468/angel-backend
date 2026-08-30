import { z } from "zod";

const PointSystemValidationSchema = z.object({
  body: z.object({
    eventId: z
      .string({
        error: "eventId is required",
      })
      .trim(),
    point: z
      .number({
        error: "point must be a number",
      })
      .min(0, { message: "point cannot be negative" })
      .optional(),
    actionType: z
      .enum(["comment", "photo", "video", "redemption", "custom"])
      .optional()
      .default("custom"),
    isDelete: z.boolean().optional().default(false),
  }),
});

const recordEngagementPointSchema = z.object({
  body: z.object({
    eventId: z
      .string({
        error: "eventId is required",
      })
      .trim(),
    actionType: z.enum(["comment", "photo", "video"], {
      error: "actionType must be one of 'comment', 'photo', or 'video'",
    }),
  }),
});

const calculateRedemptionSchema = z.object({
  body: z.object({
    eventId: z.string({ error: "eventId is required" }).trim(),
    ticketCashPrice: z
      .number({ error: "ticketCashPrice is required" })
      .min(0.01, { message: "Cash price must be greater than zero" }),
    ticketPointsPrice: z
      .number({ error: "ticketPointsPrice is required" })
      .min(0.01, { message: "Points price must be greater than zero" }),
    pointsToRedeem: z
      .number({ error: "pointsToRedeem is required" })
      .min(0.1, { message: "Must redeem at least 0.1 points" }),
  }),
});

const redeemPointsSchema = z.object({
  body: z.object({
    eventId: z.string({ error: "eventId is required" }).trim(),
    ticketCashPrice: z
      .number({ error: "ticketCashPrice is required" })
      .min(0.01, { message: "Cash price must be greater than zero" }),
    ticketPointsPrice: z
      .number({ error: "ticketPointsPrice is required" })
      .min(0.01, { message: "Points price must be greater than zero" }),
    pointsToRedeem: z
      .number({ error: "pointsToRedeem is required" })
      .min(0.1, { message: "Must redeem at least 0.1 points" }),
  }),
});

const PointSystemValidation = {
  PointSystemValidationSchema,
  recordEngagementPointSchema,
  calculateRedemptionSchema,
  redeemPointsSchema,
};

export default PointSystemValidation;







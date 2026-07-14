import { body } from 'express-validator';

import { z } from "zod";

/* ---------- FOLLOW / UNFOLLOW ---------- */
const followUpSchema = z.object({
  body: z.object({
    followupId: z.string().optional(),
    eventpostId: z.string().optional(),
  }),
});

/* ---------- INVITATION ---------- */
const invitasationNotificationSchema = z.object({
  body: z.object({
    title: z.string().min(1, "title is required"),
    content: z.string().min(1, "content is required"),
    invitasationList: z.array(z.string().min(1)),
    route: z.string().min(1, "route is required").optional(),
    groupId: z.string().optional(),
    senderId: z.string().optional()

  }),
});

/* ---------- FOLLOWUP ID (OTHER ROUTES) ---------- */
const followupIdSchema = z.object({
  body: z.object({
    followupId: z.string().min(1, "followupId is required"),
  }),
});

/* ---------- BLOCK / UNBLOCK USER ---------- */
const blockUserSchema = z.object({
  body: z.object({
    blockedUserId: z.string().min(1, "blockedUserId is required"),
  }),
});

/* ---------- EXPORT ---------- */
const followUpValidation = {
  followUpSchema,
  invitasationNotificationSchema,
  followupIdSchema,
  blockUserSchema,
};

export default followUpValidation;

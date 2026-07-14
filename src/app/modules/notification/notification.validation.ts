import { z } from 'zod';
import { Types } from 'mongoose';
import { NotificationPriority, NotificationStatus } from '../followup/followup.constant';


const isValidObjectId = (value: string) => {
  return Types.ObjectId.isValid(value);
};

const notificationzodSchema = z.object({
  body: z.object({
    userId: z
      .string()
      .optional()
      .refine((val) => !val || isValidObjectId(val), {
        message: 'Invalid userId format',
      }),
    driverId: z
      .string()
      .optional()
      .refine((val) => !val || isValidObjectId(val), {
        message: 'Invalid driverId format',
      }),
    title: z.string({
      error: 'Title is required',
    }),
    content: z.string({
      error: 'Content is required',
    }),
    icon: z.string().optional(),
    status: z
      .enum([NotificationStatus.read, NotificationStatus.unread])
      .default(NotificationStatus.unread),
    route: z.string().optional(),
    priority: z
      .enum([
        NotificationPriority.low,
        NotificationPriority.medium,
        NotificationPriority.high,
      ])
      .default(NotificationPriority.medium),
  }),
});
const seenNotificationZodSchema = z.object({
  body: z.object({
    route: z.string({ error: 'route is required' }),
  }),
});


const  changeNotificationStatusSchema=z.object({
  body: z.object({
    notificationId: z.string({error:"notificationId is required"})
  })
})

const NotificationValidationSchema = {
  notificationzodSchema,
  seenNotificationZodSchema,
  changeNotificationStatusSchema
};

export default NotificationValidationSchema;
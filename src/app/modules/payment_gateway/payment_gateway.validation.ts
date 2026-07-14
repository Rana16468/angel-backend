import { z } from 'zod';

// Validation schema for refreshing onboarding link
const refreshOnboardingLink = z.object({
  body: z.object({}).strict(),
});

// Validation schema for creating payment intent
const createPaymentIntent = z.object({
  body: z.object({
    price: z
      .number({
        error: 'Price is required'
        
      })
      .positive('Price must be positive'),
      eventId: z
      .string({
        error: 'SubscriptionId is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid truck ID format'),

    description: z.string().optional(),
  }),
});

// Validation schema for creating checkout session
const createCheckoutSession = z.object({
  body: z.object({
    price: z
      .number({
        error: 'Price is required'
       
      })
      .positive('Price must be positive'),
      eventId: z
      .string({
        error: 'SubscriptionId is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid truck ID format'),
      ticketCount:z.number({error:'ticket count is  required'}),
    
    description: z.string().optional(),
  }),
});

const cashPaymentSchema = z.object({
  body: z.object({
    price: z
      .number({
        error: 'Price is required'
      
      })
      .positive('Price must be positive'),

    description: z.string().optional(),
  }),
});

// Need to export as an object, not default export
 const PaymentValidation = {
  refreshOnboardingLink,
  createPaymentIntent,
  createCheckoutSession,
  cashPaymentSchema,
};

export default  PaymentValidation;

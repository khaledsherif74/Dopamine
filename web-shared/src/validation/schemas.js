import { z } from 'zod';

// Same rules as the backend (Joi) and the mobile app. Messages are i18n KEYS
// (namespace validation.*) — translate them in the UI with t(message).

export const password = z
  .string()
  .min(8, 'validation.passwordMin')
  .max(72, 'validation.passwordMin')
  .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'validation.passwordRule');

export const phone = z.string().regex(/^\+?[1-9]\d{7,14}$/, 'validation.phoneInvalid');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'validation.nameShort').max(80, 'validation.nameShort'),
  email: z.string().trim().email('validation.emailInvalid'),
  phone,
  password,
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'validation.termsRequired' }) }),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'validation.identifierRequired'),
  password: z.string().min(1, 'validation.passwordRequired'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('validation.emailInvalid'),
});

export const resetPasswordSchema = z.object({ newPassword: password });

export const otpSchema = z.object({
  code: z.string().length(6, 'validation.otpLength').regex(/^\d+$/, 'validation.otpDigits'),
});

export const addressSchema = z.object({
  label: z.string().trim().min(1, 'validation.addressLabel').max(50),
  line1: z.string().trim().min(3, 'validation.addressLine1').max(255),
  city: z.string().trim().min(2, 'validation.addressCity').max(100),
});

export const reviewSchema = z.object({
  rating: z.number({ invalid_type_error: 'validation.ratingRequired' }).min(1, 'validation.ratingRequired').max(5),
  comment: z.string().max(500).optional(),
});

export const TICKET_CATEGORIES = ['ORDER', 'PAYMENT', 'DELIVERY', 'ACCOUNT', 'REFUND', 'OTHER'];

export const ticketSchema = z.object({
  subject: z.string().trim().min(3, 'validation.ticketSubject').max(140, 'validation.ticketSubject'),
  body: z.string().trim().min(10, 'validation.ticketBody').max(4000, 'validation.ticketBody'),
  category: z.enum(TICKET_CATEGORIES),
  orderId: z.string().uuid().optional(),
});

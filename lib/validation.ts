// path: lib/validation.ts
// Zod-схемы для input validation всех API routes

import { z } from 'zod';

// ---------- общие ----------

export const uuidSchema = z.string().uuid();

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected date in YYYY-MM-DD format');

export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected time in HH:MM format (24h)');

const phoneRegex = /^\+?[0-9\s\-()]{6,20}$/;

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// ---------- auth ----------

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72), // 72 — лимит bcrypt
});

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().regex(phoneRegex, 'Invalid phone number').optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72)
    .regex(/[a-zA-Z]/, 'Password must contain a letter')
    .regex(/[0-9]/, 'Password must contain a digit'),
});

// ---------- services ----------

export const serviceCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  duration_minutes: z.coerce.number().int().positive().max(24 * 60),
  price: z.coerce.number().positive().max(99999),
  description: z.string().trim().max(2000).optional(),
  photo_url: z.string().trim().url().optional(),
});

export const serviceUpdateSchema = serviceCreateSchema
  .partial()
  .refine((o) => Object.keys(o).length > 0, 'Nothing to update');

// ---------- time slots ----------

const timeSlotSchema = z.object({
  date: dateSchema,
  start_time: timeSchema,
  duration_minutes: z.coerce.number().int().positive().max(8 * 60),
});

// принимает один слот ИЛИ { slots: [...] } для массового создания
export const timeSlotsCreateSchema = z.union([
  timeSlotSchema,
  z.object({ slots: z.array(timeSlotSchema).min(1).max(100) }),
]);

export const timeSlotsQuerySchema = paginationSchema.extend({
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  available: z.enum(['true', 'false']).optional(),
});

// ---------- bookings ----------

export const bookingCreateSchema = z.object({
  service_id: uuidSchema,
  time_slot_id: uuidSchema,
  client_name: z.string().trim().min(2).max(100),
  client_phone: z.string().trim().regex(phoneRegex, 'Invalid phone number'),
  client_email: z.string().trim().toLowerCase().email().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const bookingUpdateSchema = z
  .object({
    status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
    notes: z.string().trim().max(1000).nullable().optional(),
    amount_received: z.coerce.number().min(0).max(99999).optional(),
    no_show: z.boolean().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, 'Nothing to update');

export const bookingsQuerySchema = paginationSchema.extend({
  status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
});

export const availableSlotsQuerySchema = z.object({
  service_id: uuidSchema,
  date: dateSchema,
});

// ---------- clients ----------

export const clientCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(phoneRegex, 'Invalid phone number'),
  email: z.string().trim().toLowerCase().email().optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  notes: z.string().trim().max(5000).optional(),
});

export const clientUpdateSchema = clientCreateSchema
  .partial()
  .refine((o) => Object.keys(o).length > 0, 'Nothing to update');

export const clientsQuerySchema = paginationSchema.extend({
  search: z.string().trim().min(1).max(100).optional(),
  tag: z.string().trim().min(1).max(50).optional(),
  min_spent: z.coerce.number().min(0).optional(),
});

// ---------- expenses ----------

export const expenseCreateSchema = z.object({
  category_id: uuidSchema,
  amount: z.coerce.number().positive().max(999999),
  description: z.string().trim().min(1).max(500),
  date: dateSchema,
});

export const expenseUpdateSchema = expenseCreateSchema
  .partial()
  .refine((o) => Object.keys(o).length > 0, 'Nothing to update');

export const expensesQuerySchema = paginationSchema.extend({
  category_id: uuidSchema.optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
});

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(2).max(50),
});

// ---------- finances ----------

export const financeReportQuerySchema = z.object({
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  format: z.enum(['json', 'csv']).default('json'),
});

// ---------- audit ----------

export const auditLogsQuerySchema = paginationSchema.extend({
  action: z.string().trim().min(1).max(50).optional(),
  entity_type: z.string().trim().min(1).max(50).optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
});

/** searchParams → plain object для Zod */
export function queryToObject(searchParams: URLSearchParams): Record<string, string> {
  return Object.fromEntries(searchParams.entries());
}

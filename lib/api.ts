// path: lib/api.ts
// Общие helpers для API routes: ошибки, HTTP-ответы, метаданные запроса

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return jsonError(error.status, error.message);
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Validation failed', details: error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  if (error instanceof SyntaxError) {
    // невалидный JSON в body
    return jsonError(400, 'Invalid JSON body');
  }
  console.error('[api] unhandled error:', error);
  return jsonError(500, 'Internal server error');
}

/** Диапазон строк для supabase .range() */
export function paginate(page: number, limit: number) {
  const from = (page - 1) * limit;
  return { from, to: from + limit - 1 };
}

/** Маппинг ошибок Postgres → HTTP */
export function throwDbError(error: { code?: string; message?: string }): never {
  switch (error.code) {
    case '23505': // unique_violation
      throw new ApiError(409, 'Record already exists (duplicate)');
    case '23P01': // exclusion_violation (double-booking guard)
      throw new ApiError(409, 'Time slot is already booked');
    case 'P0001': // raise exception из триггеров
      throw new ApiError(409, error.message ?? 'Conflict');
    case '23503': // foreign_key_violation
      throw new ApiError(400, 'Referenced record does not exist');
    case '23514': // check_violation
      throw new ApiError(400, 'Value violates a constraint (e.g. date in the past)');
    default:
      console.error('[db]', error.code, error.message);
      throw new ApiError(500, 'Database error');
  }
}

/** IP и user-agent для audit trail */
export function getRequestMeta(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for');
  return {
    ip: forwarded ? forwarded.split(',')[0].trim() : null,
    userAgent: req.headers.get('user-agent'),
  };
}

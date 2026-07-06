// path: app/api/auth/logout/route.ts
// GET /api/auth/logout — очистка auth cookie

import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';
import { handleApiError } from '@/lib/api';

export async function GET() {
  try {
    clearAuthCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

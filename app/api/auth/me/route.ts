// path: app/api/auth/me/route.ts
// GET /api/auth/me — текущий юзер (свежие данные из БД, без password_hash)

import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { handleApiError, ApiError } from '@/lib/api';
import { requireAuth, sanitizeUser } from '@/lib/auth';

export async function GET() {
  try {
    const auth = await requireAuth();

    const { data: user, error } = await db()
      .from('users')
      .select('id, email, role, phone, name, verified, user_metadata, created_at')
      .eq('id', auth.id)
      .maybeSingle();

    if (error) throw new ApiError(500, 'Database error');
    if (!user) throw new ApiError(401, 'User no longer exists');

    return NextResponse.json({ user: sanitizeUser(user) });
  } catch (error) {
    return handleApiError(error);
  }
}

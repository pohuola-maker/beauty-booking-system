// path: app/api/auth/register/route.ts
// POST /api/auth/register — создание админ-аккаунта (мастер салона)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { handleApiError, ApiError } from '@/lib/api';
import { hashPassword, signToken, setAuthCookie, sanitizeUser } from '@/lib/auth';
import { registerSchema } from '@/lib/validation';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = registerSchema.parse(await req.json());

    // email уже занят?
    const { data: existing, error: lookupError } = await db()
      .from('users')
      .select('id')
      .eq('email', body.email)
      .maybeSingle();

    if (lookupError) throw new ApiError(500, 'Database error');
    if (existing) throw new ApiError(409, 'Email already registered');

    const passwordHash = await hashPassword(body.password);

    const { data: user, error: insertError } = await db()
      .from('users')
      .insert({
        email: body.email,
        password_hash: passwordHash,
        name: body.name,
        phone: body.phone ?? null,
        role: 'admin',
        verified: false,
      })
      .select('*')
      .single();

    if (insertError || !user) {
      throw new ApiError(500, 'Failed to create account');
    }

    // сразу логиним после регистрации
    const token = await signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
    setAuthCookie(token);

    await logAudit({
      userId: user.id,
      action: 'login',
      entityType: 'user',
      entityId: user.id,
      newValue: { event: 'register', email: user.email },
      req,
    });

    return NextResponse.json({ user: sanitizeUser(user) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

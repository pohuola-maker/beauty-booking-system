// path: app/api/auth/register/route.ts
// POST /api/auth/register — создание админ-аккаунта (мастер салона)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { handleApiError, ApiError, throwDbError } from '@/lib/api';
import { hashPassword, signToken, setAuthCookie, sanitizeUser } from '@/lib/auth';
import { registerSchema } from '@/lib/validation';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = registerSchema.parse(await req.json());

    // Регистрация закрыта: разрешён только самый первый аккаунт (bootstrap).
    // Открыть обратно можно флагом ALLOW_REGISTRATION=true в env.
    if (process.env.ALLOW_REGISTRATION !== 'true') {
      const { count, error: countError } = await db()
        .from('users')
        .select('id', { count: 'exact', head: true });
      if (countError) throwDbError(countError);
      if ((count ?? 0) > 0) {
        throw new ApiError(
          403,
          'Registration is closed. Ask the administrator to create your account.'
        );
      }
    }

    // email уже занят?
    const { data: existing, error: lookupError } = await db()
      .from('users')
      .select('id')
      .eq('email', body.email)
      .maybeSingle();

    if (lookupError) throwDbError(lookupError); // реальная причина попадёт в Vercel Logs
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
      throwDbError(insertError ?? { message: 'insert returned no row' });
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

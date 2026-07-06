// path: lib/auth.ts
// JWT (jose) + bcrypt + httpOnly cookie. Работает в Node runtime route handlers.

import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { ApiError } from './api';

export const AUTH_COOKIE = 'auth_token';
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 дней
const BCRYPT_ROUNDS = 12;

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'client';
  name: string;
}

function jwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET env var must be set (min 32 chars)');
  }
  return new TextEncoder().encode(secret);
}

// ---------- пароли ----------

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ---------- JWT ----------

export async function signToken(user: AuthUser): Promise<string> {
  return new SignJWT({ email: user.email, role: user.role, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(jwtSecret());
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    if (!payload.sub || !payload.email || !payload.role) return null;
    return {
      id: payload.sub,
      email: payload.email as string,
      role: payload.role as 'admin' | 'client',
      name: (payload.name as string) ?? '',
    };
  } catch {
    return null; // истёк / подделан / невалиден
  }
}

// ---------- cookies ----------

export function setAuthCookie(token: string): void {
  cookies().set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_TTL_SECONDS,
  });
}

export function clearAuthCookie(): void {
  cookies().set(AUTH_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

// ---------- guards для route handlers ----------

/** Бросает 401, если запрос не аутентифицирован */
export async function requireAuth(): Promise<AuthUser> {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) throw new ApiError(401, 'Not authenticated');
  const user = await verifyToken(token);
  if (!user) throw new ApiError(401, 'Invalid or expired token');
  return user;
}

/** Бросает 401/403, если не админ */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== 'admin') throw new ApiError(403, 'Admin access required');
  return user;
}

/** Убирает password_hash из объекта users перед отдачей в ответ */
export function sanitizeUser(user: any) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    phone: user.phone,
    name: user.name,
    verified: user.verified,
    created_at: user.created_at,
  };
}

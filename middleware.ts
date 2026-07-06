// path: middleware.ts
// Edge middleware: проверяет JWT на всех /api/* кроме публичных.
// Роли (admin/client) проверяются внутри routes через requireAdmin/requireAuth.

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const AUTH_COOKIE = 'auth_token';

// Публичные endpoints: [regex пути, разрешённые методы]
const PUBLIC_API: Array<[RegExp, string[]]> = [
  [/^\/api\/auth\/(login|register)$/, ['POST']],
  [/^\/api\/auth\/logout$/, ['GET']],
  [/^\/api\/services$/, ['GET']], // клиенты смотрят услуги перед записью
  [/^\/api\/bookings\/available-slots$/, ['GET']], // свободные слоты
  [/^\/api\/bookings$/, ['POST']], // клиентская самозапись
];

function isPublic(pathname: string, method: string): boolean {
  return PUBLIC_API.some(
    ([pattern, methods]) => pattern.test(pathname) && methods.includes(method)
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname, req.method)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // Пробрасываем данные юзера в route handlers через headers
    const headers = new Headers(req.headers);
    headers.set('x-user-id', payload.sub ?? '');
    headers.set('x-user-email', String(payload.email ?? ''));
    headers.set('x-user-role', String(payload.role ?? ''));

    return NextResponse.next({ request: { headers } });
  } catch {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ['/api/:path*'],
};

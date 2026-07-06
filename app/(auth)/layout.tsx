// path: app/(auth)/layout.tsx
// Layout для /login и /register: центрированная форма, лого сверху, без навигации
'use client';

import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-8">
      <div className="mb-8 text-center">
        <span className="text-2xl font-semibold tracking-tight text-gray-900">
          Beauty<span className="text-blue-600">Book</span>
        </span>
        <p className="mt-1 text-sm text-gray-500">Записи, клиенты и финансы — в одном месте</p>
      </div>

      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}

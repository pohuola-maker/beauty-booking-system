// path: components/Auth/LoginForm.tsx
// Форма логина: клиентская валидация, POST /api/auth/login, редирект на /admin

'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/Common/Card';
import Input from '@/components/Common/Input';
import Button from '@/components/Common/Button';
import ErrorMessage from '@/components/Common/ErrorMessage';
import { useApi } from '@/hooks/useApi';
import type { AuthUser } from '@/hooks/useAuth';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clientErrors, setClientErrors] = useState<{ email?: string; password?: string }>({});

  const emailRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { request, loading, error, clearError } = useApi<{ user: AuthUser }>();

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  function validate(): boolean {
    const errors: typeof clientErrors = {};
    if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email';
    if (!password) errors.password = 'Enter your password';
    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();
    if (!validate()) return;

    const result = await request('/api/auth/login', {
      method: 'POST',
      body: { email: email.trim(), password },
    });

    if (result) {
      router.replace('/admin');
      router.refresh();
    }
  }

  return (
    <Card className="p-6">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Log in</h1>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {error && <ErrorMessage message={error} />}

        <Input
          ref={emailRef}
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={clientErrors.email}
          disabled={loading}
        />

        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={clientErrors.password}
          disabled={loading}
        />

        <Button type="submit" fullWidth size="lg" loading={loading}>
          Log in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        No account?{' '}
        <Link href="/register" className="font-medium text-blue-600 hover:text-blue-700">
          Sign up
        </Link>
      </p>
    </Card>
  );
}

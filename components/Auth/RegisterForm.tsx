// path: components/Auth/RegisterForm.tsx
// Форма регистрации админа: клиентская валидация (зеркалит backend Zod),
// password strength checklist, fieldErrors с сервера, редирект на /admin

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
const PHONE_RE = /^\+?[0-9\s\-()]{6,20}$/;

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
}

/** правила пароля — те же, что в backend registerSchema */
function passwordChecks(password: string) {
  return [
    { label: 'Минимум 8 символов', ok: password.length >= 8 },
    { label: 'Хотя бы одна буква', ok: /[a-zA-Z]/.test(password) },
    { label: 'Хотя бы одна цифра', ok: /[0-9]/.test(password) },
  ];
}

export default function RegisterForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [clientErrors, setClientErrors] = useState<FormErrors>({});

  const nameRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { request, loading, error, fieldErrors, clearError } = useApi<{ user: AuthUser }>();

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const checks = passwordChecks(form.password);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function validate(): boolean {
    const errors: FormErrors = {};
    if (form.name.trim().length < 2) errors.name = 'Имя — минимум 2 символа';
    if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Введи корректный email';
    if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) {
      errors.phone = 'Некорректный номер телефона';
    }
    if (!checks.every((c) => c.ok)) errors.password = 'Пароль не соответствует требованиям';
    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  }

  /** ошибка поля: сначала клиентская, потом серверная (Zod из useApi.fieldErrors) */
  function fieldError(field: keyof FormErrors): string | undefined {
    return clientErrors[field] ?? fieldErrors?.[field]?.[0];
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();
    if (!validate()) return;

    const result = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      },
    });

    if (result) {
      router.replace('/admin');
      router.refresh();
    }
  }

  return (
    <Card className="p-6">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Регистрация</h1>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {error && <ErrorMessage message={error} />}

        <Input
          ref={nameRef}
          label="Имя"
          type="text"
          name="name"
          autoComplete="name"
          placeholder="Анна Иванова"
          value={form.name}
          onChange={set('name')}
          error={fieldError('name')}
          disabled={loading}
        />

        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={set('email')}
          error={fieldError('email')}
          disabled={loading}
        />

        <Input
          label="Телефон (необязательно)"
          type="tel"
          name="phone"
          autoComplete="tel"
          placeholder="+353 87 123 4567"
          value={form.phone}
          onChange={set('phone')}
          error={fieldError('phone')}
          disabled={loading}
        />

        <div>
          <Input
            label="Пароль"
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.password}
            onChange={set('password')}
            error={fieldError('password')}
            disabled={loading}
          />

          {/* password strength checklist */}
          <ul className="mt-2 space-y-1" aria-label="Требования к паролю">
            {checks.map((check) => (
              <li
                key={check.label}
                className={`flex items-center gap-1.5 text-xs ${
                  check.ok ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {check.ok ? (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="8" />
                  </svg>
                )}
                {check.label}
              </li>
            ))}
          </ul>
        </div>

        <Button type="submit" fullWidth size="lg" loading={loading}>
          Создать аккаунт
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Уже есть аккаунт?{' '}
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
          Войди
        </Link>
      </p>
    </Card>
  );
}

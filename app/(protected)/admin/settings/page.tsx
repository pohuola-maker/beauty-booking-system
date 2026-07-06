// path: app/(protected)/admin/settings/page.tsx
// Settings: профиль (имя/телефон), смена пароля, выход

'use client';

import { useState, useEffect, type FormEvent } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import Card from '@/components/Common/Card';
import Input from '@/components/Common/Input';
import Button from '@/components/Common/Button';
import ErrorMessage from '@/components/Common/ErrorMessage';
import Toast, { type ToastType } from '@/components/Common/Toast';
import { SkeletonRows } from '@/components/Common/Loading';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';

function passwordChecks(password: string) {
  return [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'At least one letter', ok: /[a-zA-Z]/.test(password) },
    { label: 'At least one digit', ok: /[0-9]/.test(password) },
  ];
}

export default function SettingsPage() {
  const { user, loading: authLoading, refetch, logout } = useAuth();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // --- профиль ---
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const profile = useApi<{ user: unknown }>();

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone ?? '');
    }
  }, [user]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return;
    const result = await profile.request('/api/auth/profile', {
      method: 'PUT',
      body: { name: name.trim(), phone: phone.trim() },
    });
    if (result) {
      setToast({ message: 'Profile saved', type: 'success' });
      void refetch();
    }
  }

  // --- пароль ---
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const password = useApi<{ success: boolean }>();

  const checks = passwordChecks(newPassword);

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    password.clearError();

    if (!oldPassword) return setPasswordError('Enter your current password');
    if (!checks.every((c) => c.ok)) return setPasswordError('New password does not meet the requirements');
    if (newPassword !== confirmPassword) return setPasswordError('Passwords do not match');

    const result = await password.request('/api/auth/change-password', {
      method: 'PUT',
      body: { old_password: oldPassword, new_password: newPassword },
    });

    if (result) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setToast({ message: 'Password changed', type: 'success' });
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-lg space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>

        {authLoading || !user ? (
          <Card>
            <SkeletonRows rows={3} />
          </Card>
        ) : (
          <>
            {/* профиль */}
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-gray-900">Profile</h2>
              <form onSubmit={saveProfile} noValidate className="space-y-3">
                {profile.error && <ErrorMessage message={profile.error} />}

                <Input label="Email" type="email" value={user.email} disabled />
                <Input
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={profile.fieldErrors?.name?.[0]}
                  disabled={profile.loading}
                />
                <Input
                  label="Phone"
                  type="tel"
                  placeholder="+353 87 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  error={profile.fieldErrors?.phone?.[0]}
                  disabled={profile.loading}
                />
                <Button type="submit" loading={profile.loading}>
                  Save
                </Button>
              </form>
            </Card>

            {/* пароль */}
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-gray-900">Change password</h2>
              <form onSubmit={savePassword} noValidate className="space-y-3">
                {(passwordError || password.error) && (
                  <ErrorMessage message={passwordError ?? password.error ?? ''} />
                )}

                <Input
                  label="Current password"
                  type="password"
                  autoComplete="current-password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  disabled={password.loading}
                />
                <Input
                  label="New password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={password.loading}
                />

                <ul className="space-y-1" aria-label="Password requirements">
                  {checks.map((c) => (
                    <li
                      key={c.label}
                      className={`text-xs ${c.ok ? 'text-green-600' : 'text-gray-400'}`}
                    >
                      {c.ok ? '✓' : '○'} {c.label}
                    </li>
                  ))}
                </ul>

                <Input
                  label="Repeat new password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={password.loading}
                />
                <Button type="submit" loading={password.loading}>
                  Change password
                </Button>
              </form>
            </Card>

            {/* выход */}
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Log out of account</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <Button variant="danger" size="sm" onClick={logout}>
                  Log out
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}

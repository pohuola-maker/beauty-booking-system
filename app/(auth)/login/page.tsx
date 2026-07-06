// path: app/(auth)/login/page.tsx

import type { Metadata } from 'next';
import LoginForm from '@/components/Auth/LoginForm';

export const metadata: Metadata = {
  title: 'Log in — BeautyBook',
};

export default function LoginPage() {
  return <LoginForm />;
}

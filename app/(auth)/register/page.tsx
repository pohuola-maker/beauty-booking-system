// path: app/(auth)/register/page.tsx

import type { Metadata } from 'next';
import RegisterForm from '@/components/Auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Sign up — BeautyBook',
};

export default function RegisterPage() {
  return <RegisterForm />;
}

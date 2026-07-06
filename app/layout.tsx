import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Beauty Booking System',
  description: 'Professional booking system for beauty salons',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
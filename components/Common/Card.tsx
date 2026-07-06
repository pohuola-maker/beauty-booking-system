// path: components/Common/Card.tsx
// Карточка: border + мягкая тень + rounded. Основа dashboard-карточек и списков.

import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** убрать дефолтный p-4 (когда внутри таблица на всю ширину) */
  noPadding?: boolean;
}

export default function Card({ children, noPadding = false, className = '', ...rest }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white shadow-sm ${
        noPadding ? '' : 'p-4'
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

// path: components/Dashboard/SummaryCard.tsx
// Summary-карточка: лейбл, большое число, опциональный тренд и иконка

import type { ReactNode } from 'react';
import Card from '@/components/Common/Card';

export interface SummaryCardProps {
  label: string;
  value: string;
  /** подпись под числом, например "+5% за неделю" */
  trend?: string;
  trendPositive?: boolean;
  icon?: ReactNode;
}

export default function SummaryCard({
  label,
  value,
  trend,
  trendPositive = true,
  icon,
}: SummaryCardProps) {
  return (
    <Card className="relative">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold text-gray-900">{value}</p>

      {trend && (
        <p
          className={`mt-1 text-xs font-medium ${trendPositive ? 'text-green-600' : 'text-red-600'}`}
        >
          {trend}
        </p>
      )}

      {icon && (
        <span className="absolute right-4 top-4 text-gray-300" aria-hidden="true">
          {icon}
        </span>
      )}
    </Card>
  );
}

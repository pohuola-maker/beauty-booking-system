// path: components/Finances/PeriodSelector.tsx
// Переключатель периода: [Day][Week][Month][Всё] → диапазон from/to

'use client';

export type Period = 'day' | 'week' | 'month' | 'all';

export const PERIOD_LABELS: Record<Period, string> = {
  day: 'Today',
  week: 'Week',
  month: 'Month',
  all: 'All time',
};

/** локальная дата → YYYY-MM-DD */
function toISODate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** период → диапазон дат для API */
export function periodRange(period: Period): { from: string; to: string } {
  const now = new Date();
  const to = toISODate(now);
  switch (period) {
    case 'day':
      return { from: to, to };
    case 'week':
      return { from: toISODate(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)), to };
    case 'month':
      return { from: `${to.slice(0, 8)}01`, to };
    case 'all':
      return { from: '2000-01-01', to };
  }
}

interface PeriodSelectorProps {
  value: Period;
  onChange: (period: Period) => void;
}

export default function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div
      role="tablist"
      aria-label="Period"
      className="flex w-full rounded-lg border border-gray-300 bg-white p-0.5 sm:w-auto"
    >
      {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
        <button
          key={p}
          type="button"
          role="tab"
          aria-selected={value === p}
          onClick={() => onChange(p)}
          className={`flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium
            transition-colors sm:flex-none ${
              value === p ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
          {PERIOD_LABELS[p]}
        </button>
      ))}
    </div>
  );
}

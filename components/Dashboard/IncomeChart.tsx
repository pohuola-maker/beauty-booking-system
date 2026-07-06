// path: components/Dashboard/IncomeChart.tsx
// Бар-график дохода за 7 дней: чистый CSS/Tailwind, tooltip по hover/focus

'use client';

import Card from '@/components/Common/Card';

export interface DayIncome {
  date: string; // YYYY-MM-DD
  day: string; // "пн", "вт"...
  amount: number;
}

export default function IncomeChart({ data }: { data: DayIncome[] }) {
  const max = Math.max(...data.map((d) => d.amount), 1); // 1 — чтобы не делить на 0
  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <Card>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Income this week</h2>
        <span className="text-sm font-semibold text-gray-900">€{total.toFixed(2)}</span>
      </div>

      <div
        className="flex h-36 items-end gap-2"
        role="img"
        aria-label={`Income this week: ${data.map((d) => `${d.day} — ${d.amount} euro`).join(', ')}`}
      >
        {data.map((d) => {
          const heightPct = Math.max((d.amount / max) * 100, d.amount > 0 ? 4 : 2);
          const isToday = d === data[data.length - 1];
          return (
            <div key={d.date} className="group relative flex flex-1 flex-col items-center gap-1.5">
              {/* tooltip */}
              <span
                className="pointer-events-none absolute -top-7 z-10 hidden whitespace-nowrap rounded-md
                  bg-gray-900 px-2 py-1 text-xs font-medium text-white group-hover:block group-focus-within:block"
              >
                €{d.amount.toFixed(2)}
              </span>

              <button
                type="button"
                aria-label={`${d.day}: €${d.amount.toFixed(2)}`}
                className="flex h-28 w-full items-end focus-visible:outline-none"
              >
                <span
                  style={{ height: `${heightPct}%` }}
                  className={`w-full rounded-t-md transition-colors ${
                    isToday
                      ? 'bg-blue-600 group-hover:bg-blue-700'
                      : 'bg-blue-200 group-hover:bg-blue-300'
                  }`}
                />
              </button>

              <span className={`text-xs ${isToday ? 'font-semibold text-blue-600' : 'text-gray-500'}`}>
                {d.day}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

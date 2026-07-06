// path: components/Common/Loading.tsx
// Skeleton-загрузчики (не spinners): строки таблиц, карточки, произвольные блоки

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} aria-hidden="true" />;
}

/** Строки таблицы / списка */
export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-3.5 w-14" />
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** Dashboard summary-карточки */
export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      role="status"
      aria-label="Loading"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
          <Skeleton className="mb-3 h-3 w-1/2" />
          <Skeleton className="h-7 w-2/3" />
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** Один большой блок (график, календарь) */
export function SkeletonBlock({ height = 'h-64' }: { height?: string }) {
  return (
    <div role="status" aria-label="Loading">
      <Skeleton className={`w-full rounded-xl ${height}`} />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

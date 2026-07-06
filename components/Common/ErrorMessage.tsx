// path: components/Common/ErrorMessage.tsx
// Красный блок ошибки с иконкой и опциональной кнопкой Retry

'use client';

export interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center"
    >
      <svg
        className="h-5 w-5 shrink-0 text-red-600"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
      </svg>

      <p className="flex-1 text-sm font-medium text-red-700">{message}</p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium
            text-red-700 transition-colors hover:bg-red-100
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          Повторить
        </button>
      )}
    </div>
  );
}

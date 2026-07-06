// path: components/Common/Toast.tsx
// Уведомление внизу экрана: success/error/info, auto-dismiss 3 сек, кнопка закрытия.
// Управляется снаружи: держи в state строку и тип, рендери <Toast .../> при наличии.

'use client';

import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  /** мс до автозакрытия; 0 = не закрывать автоматически */
  duration?: number;
}

const typeStyles: Record<ToastType, { box: string; icon: JSX.Element }> = {
  success: {
    box: 'bg-green-600',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    box: 'bg-red-600',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
      </svg>
    ),
  },
  info: {
    box: 'bg-blue-600',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 16v-4m0-4h.01" />
      </svg>
    ),
  },
};

export default function Toast({ message, type = 'info', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose, message]);

  const { box, icon } = typeStyles[type];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-20 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2
        items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg
        md:bottom-6 ${box}`}
    >
      {icon}
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="rounded p-1 hover:bg-white/20"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}

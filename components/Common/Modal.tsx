// path: components/Common/Modal.tsx
// Модалка: overlay + dialog, Escape и клик по backdrop закрывают,
// блокировка прокрутки body, фокус на кнопку закрытия при открытии.
// На мобильном — bottom sheet, на десктопе — по центру.

'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** закрывать по клику на backdrop (default true) */
  closeOnBackdrop?: boolean;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  closeOnBackdrop = true,
}: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();
    document.body.style.overflow = 'hidden';

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/50 transition-opacity"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-white shadow-xl
          sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-6">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 sm:px-6">{children}</div>

        {footer && (
          <div className="flex justify-end gap-2 border-t border-gray-100 px-4 py-3 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

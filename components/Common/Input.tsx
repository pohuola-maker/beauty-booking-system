// path: components/Common/Input.tsx
// Текстовый input: label, error, prefix/suffix иконки, все нативные атрибуты

'use client';

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefixIcon?: ReactNode;
  suffixIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, prefixIcon, suffixIcon, id, className = '', ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="relative">
        {prefixIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
            {prefixIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900
            placeholder:text-gray-400 transition-colors
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400
            ${prefixIcon ? 'pl-10' : ''} ${suffixIcon ? 'pr-10' : ''}
            ${
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
            } ${className}`}
          {...rest}
        />

        {suffixIcon && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
            {suffixIcon}
          </span>
        )}
      </div>

      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;

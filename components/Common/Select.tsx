// path: components/Common/Select.tsx
// Dropdown select: label, error, options списком или через children

'use client';

import { forwardRef, useId, type SelectHTMLAttributes, type ReactNode } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: SelectOption[];
  /** текст первой пустой опции, например "Выбери категорию" */
  placeholder?: string;
  children?: ReactNode;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, options, placeholder, id, className = '', children, ...rest },
  ref
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const errorId = `${selectId}-error`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`w-full appearance-none rounded-lg border bg-white px-3 py-2.5 pr-10 text-sm
            text-gray-900 transition-colors
            focus:outline-none focus:ring-2
            disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400
            ${
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
            } ${className}`}
          {...rest}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
          {children}
        </select>

        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </div>

      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});

export default Select;

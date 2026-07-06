// path: components/Clients/ClientsFilter.tsx
// Фильтры: тег + минимальная потраченная сумма + Reset

'use client';

import { useState, useEffect } from 'react';
import Select from '@/components/Common/Select';
import Input from '@/components/Common/Input';

export const PRESET_TAGS = ['new', 'regular', 'inactive'];

export interface ClientFilters {
  tag: string;
  minSpent: string; // строка из input; '' = не фильтровать
}

interface ClientsFilterProps {
  filters: ClientFilters;
  onChange: (filters: ClientFilters) => void;
}

export default function ClientsFilter({ filters, onChange }: ClientsFilterProps) {
  const [minSpentLocal, setMinSpentLocal] = useState(filters.minSpent);

  // debounce для суммы, чтобы не дёргать API на каждую цифру
  useEffect(() => {
    const timer = setTimeout(() => {
      if (minSpentLocal !== filters.minSpent) onChange({ ...filters, minSpent: minSpentLocal });
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minSpentLocal]);

  const hasFilters = filters.tag !== '' || filters.minSpent !== '';

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="w-40">
        <Select
          label="Tag"
          value={filters.tag}
          onChange={(e) => onChange({ ...filters, tag: e.target.value })}
          placeholder="All"
          options={PRESET_TAGS.map((t) => ({ value: t, label: t }))}
        />
      </div>

      <div className="w-36">
        <Input
          label="Spent from €"
          type="number"
          min="0"
          inputMode="numeric"
          placeholder="0"
          value={minSpentLocal}
          onChange={(e) => setMinSpentLocal(e.target.value)}
        />
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            setMinSpentLocal('');
            onChange({ tag: '', minSpent: '' });
          }}
          className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors
            hover:bg-gray-100 hover:text-gray-700"
        >
          Reset
        </button>
      )}
    </div>
  );
}

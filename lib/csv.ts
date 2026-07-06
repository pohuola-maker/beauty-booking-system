// path: lib/csv.ts
// CSV export, готовый для Excel / Google Sheets (UTF-8 BOM, CRLF, экранирование)

import { NextResponse } from 'next/server';

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => unknown;
}

function escapeCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = Array.isArray(v) ? v.join('; ') : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines = [columns.map((c) => escapeCell(c.header)).join(',')];
  for (const row of rows) {
    lines.push(columns.map((c) => escapeCell(c.value(row))).join(','));
  }
  // BOM — чтобы Excel корректно открыл UTF-8 (кириллица в именах клиентов)
  return '﻿' + lines.join('\r\n');
}

export function csvResponse(csv: string, filename: string): NextResponse {
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

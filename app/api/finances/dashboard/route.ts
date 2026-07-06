// path: app/api/finances/dashboard/route.ts
// GET /api/finances/dashboard — данные для главной страницы админа:
// счётчики за сегодня, клиенты, profit margin (текущий месяц),
// ближайшие 5 букингов, последние 3 клиента, доход за 7 дней.
// Доход = confirmed букинги без no_show (по дате слота).

import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { handleApiError, throwDbError } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

interface SlotJoin {
  date: string;
  start_time: string;
}

export async function GET() {
  try {
    const auth = await requireAdmin();

    const now = new Date();
    const today = isoDate(now);
    const weekAgo = isoDate(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
    const monthStart = `${today.slice(0, 8)}01`;

    // --- параллельные запросы ---
    const [weekIncomeRes, monthIncomeRes, monthExpensesRes, clientsCountRes, upcomingRes, recentClientsRes] =
      await Promise.all([
        // confirmed-доход за последние 7 дней (для графика + "доход сегодня")
        db()
          .from('bookings')
          .select('amount_received, time_slots!inner ( date )')
          .eq('user_id', auth.id)
          .eq('status', 'confirmed')
          .eq('no_show', false)
          .gte('time_slots.date', weekAgo)
          .lte('time_slots.date', today),

        // доход за текущий месяц (для profit margin)
        db()
          .from('bookings')
          .select('amount_received, time_slots!inner ( date )')
          .eq('user_id', auth.id)
          .eq('status', 'confirmed')
          .eq('no_show', false)
          .gte('time_slots.date', monthStart),

        // расходы за текущий месяц
        db().from('expenses').select('amount').eq('user_id', auth.id).gte('date', monthStart),

        // всего активных клиентов
        db()
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', auth.id)
          .is('deleted_at', null),

        // кандидаты в "предстоящие" (сортируем в JS: PostgREST не сортирует parent по embedded)
        db()
          .from('bookings')
          .select('id, client_name, status, services ( name ), time_slots!inner ( date, start_time )')
          .eq('user_id', auth.id)
          .neq('status', 'cancelled')
          .gte('time_slots.date', today)
          .limit(50),

        // последние клиенты
        db()
          .from('clients')
          .select('id, name, phone, total_visits, total_spent')
          .eq('user_id', auth.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(3),
      ]);

    for (const res of [weekIncomeRes, monthIncomeRes, monthExpensesRes, clientsCountRes, upcomingRes, recentClientsRes]) {
      if (res.error) throwDbError(res.error);
    }

    // --- недельный график: 7 дней подряд, включая пустые ---
    const incomeByDate = new Map<string, number>();
    for (const row of weekIncomeRes.data ?? []) {
      const slot = row.time_slots as unknown as SlotJoin;
      incomeByDate.set(
        slot.date,
        (incomeByDate.get(slot.date) ?? 0) + Number(row.amount_received ?? 0)
      );
    }

    const weekdayFormat = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' });
    const weeklyIncome = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      const date = isoDate(d);
      return {
        date,
        day: weekdayFormat.format(d), // "пн", "вт"...
        amount: round2(incomeByDate.get(date) ?? 0),
      };
    });

    const incomeToday = weeklyIncome[weeklyIncome.length - 1].amount;

    // --- букинги сегодня (не отменённые) ---
    const upcomingRaw = (upcomingRes.data ?? []).map((b) => ({
      id: b.id as string,
      client_name: b.client_name as string,
      status: b.status as string,
      service_name: (b.services as unknown as { name: string } | null)?.name ?? '',
      time_slot_date: (b.time_slots as unknown as SlotJoin).date,
      start_time: (b.time_slots as unknown as SlotJoin).start_time,
    }));

    const bookingsToday = upcomingRaw.filter((b) => b.time_slot_date === today).length;

    const upcomingBookings = upcomingRaw
      .sort((a, b) =>
        (a.time_slot_date + a.start_time).localeCompare(b.time_slot_date + b.start_time)
      )
      .slice(0, 5);

    // --- profit margin за текущий месяц ---
    const monthIncome = (monthIncomeRes.data ?? []).reduce(
      (s, r) => s + Number(r.amount_received ?? 0),
      0
    );
    const monthExpenses = (monthExpensesRes.data ?? []).reduce(
      (s, r) => s + Number(r.amount ?? 0),
      0
    );
    const profitMargin =
      monthIncome > 0 ? Math.round(((monthIncome - monthExpenses) / monthIncome) * 100) : 0;

    return NextResponse.json({
      bookings_today: bookingsToday,
      income_today: incomeToday,
      total_clients: clientsCountRes.count ?? 0,
      profit_margin: profitMargin,
      upcoming_bookings: upcomingBookings,
      recent_clients: recentClientsRes.data ?? [],
      weekly_income: weeklyIncome,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

import { FeeScheduleTerm, MonthlyDueDateConfig, MonthDueDateItem } from '../types';

export interface AcademicYearDates {
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
  academicYear: string;
}

export function formatDateIso(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function parseDateIso(str: string): Date | null {
  if (!str) return null;
  const parts = str.split('-').map(p => parseInt(p, 10));
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function generateTermsFromAcademicYear(
  ay: AcademicYearDates,
  numberOfTerms: number,
  dueDateOffsetDays: number = 45,
  existingTerms?: FeeScheduleTerm[]
): FeeScheduleTerm[] {
  const n = Math.max(1, Math.min(12, numberOfTerms || 4));
  const safeOffset = Math.max(0, isNaN(dueDateOffsetDays) ? 45 : dueDateOffsetDays);
  const start = parseDateIso(ay.startDate);
  const end = parseDateIso(ay.endDate);

  if (!start || !end || end <= start) {
    const fallbackStart = parseDateIso(ay.startDate || '2026-06-01') || new Date(2026, 5, 1);
    const fallbackEnd = new Date(fallbackStart);
    fallbackEnd.setFullYear(fallbackStart.getFullYear() + 1);
    return generateTermsFromDates(fallbackStart, fallbackEnd, n, ay.academicYear, safeOffset, existingTerms);
  }

  return generateTermsFromDates(start, end, n, ay.academicYear, safeOffset, existingTerms);
}

function generateTermsFromDates(
  start: Date,
  end: Date,
  numberOfTerms: number,
  ayName: string,
  dueDateOffsetDays: number,
  existingTerms?: FeeScheduleTerm[]
): FeeScheduleTerm[] {
  const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const baseDays = Math.floor(totalDays / numberOfTerms);
  const remainderDays = totalDays % numberOfTerms;

  const result: FeeScheduleTerm[] = [];
  let currentStart = new Date(start);

  for (let i = 1; i <= numberOfTerms; i++) {
    const termDuration = baseDays + (i <= remainderDays ? 1 : 0);
    const termStart = new Date(currentStart);

    let termEnd: Date;
    if (i === numberOfTerms) {
      termEnd = new Date(end);
    } else {
      termEnd = new Date(termStart);
      termEnd.setDate(termStart.getDate() + termDuration - 1);
    }

    const existingMatch = existingTerms?.find(t => t.sequence === i);
    const mode = existingMatch?.dueDateMode === 'MANUAL' ? 'MANUAL' : 'AUTO';

    let dueDateStr: string;
    if (mode === 'MANUAL' && existingMatch?.dueDate) {
      dueDateStr = existingMatch.dueDate;
    } else {
      const calculatedDue = new Date(termStart);
      calculatedDue.setDate(termStart.getDate() + dueDateOffsetDays);
      dueDateStr = formatDateIso(calculatedDue);
    }

    const termName = existingMatch?.termName || (numberOfTerms === 1
      ? 'Term 1 (Annual)'
      : numberOfTerms === 2
      ? `Term ${i} (Semester ${i})`
      : numberOfTerms === 3
      ? `Term ${i} (Tri-Semester ${i})`
      : numberOfTerms === 4
      ? `Term ${i} (Quarter ${i})`
      : numberOfTerms === 6
      ? `Term ${i} (Bi-monthly ${i})`
      : `Term ${i}`);

    result.push({
      id: existingMatch?.id || `T${i}-${ayName.replace(/\s+/g, '')}`,
      sequence: i,
      termName,
      startDate: formatDateIso(termStart),
      endDate: formatDateIso(termEnd),
      dueDate: dueDateStr,
      dueDateMode: mode,
      dueDateOffsetDays,
      status: 'Active',
      percentageShare: Math.round((100 / numberOfTerms) * 100) / 100,
    });

    currentStart = new Date(termEnd);
    currentStart.setDate(termEnd.getDate() + 1);
  }

  return result;
}

export function generateMonthlyDatesFromAcademicYear(
  ay: AcademicYearDates,
  dueDay: number = 10
): MonthlyDueDateConfig {
  const start = parseDateIso(ay.startDate) || new Date(2026, 5, 1);
  const end = parseDateIso(ay.endDate) || new Date(2027, 5, 1);
  const safeDueDay = Math.min(31, Math.max(1, dueDay || 10));

  const monthDueDates: MonthDueDateItem[] = [];
  let currentMonth = new Date(start.getFullYear(), start.getMonth(), 1);
  const lastMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  let idx = 0;
  while (currentMonth <= lastMonth) {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const targetDay = Math.min(safeDueDay, daysInMonth);

    let calculatedDue = new Date(year, month, targetDay);
    if (calculatedDue < start) calculatedDue = new Date(start);
    if (calculatedDue > end) calculatedDue = new Date(end);

    const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    monthDueDates.push({
      monthIndex: idx,
      monthName,
      dueDate: formatDateIso(calculatedDue),
    });

    currentMonth.setMonth(currentMonth.getMonth() + 1);
    idx++;
  }

  return {
    applySameDayToAllMonths: true,
    dueDay: safeDueDay,
    monthDueDates,
  };
}

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
  const clean = String(str).trim().split(/[T ]/)[0];
  const parts = clean.split(/[-/.]/).map(p => parseInt(p, 10));
  if (parts.length < 3 || parts.some(p => isNaN(p))) return null;

  if (parts[0] > 1000) {
    // YYYY-MM-DD
    return new Date(parts[0], parts[1] - 1, parts[2]);
  } else if (parts[2] > 1000) {
    const num1 = parts[0];
    const num2 = parts[1];
    const y = parts[2];
    if (num1 > 12) {
      // num1 is day, num2 is month (DD-MM-YYYY)
      return new Date(y, num2 - 1, num1);
    } else if (num2 > 12) {
      // num2 is day, num1 is month (MM-DD-YYYY)
      return new Date(y, num1 - 1, num2);
    } else {
      if (clean.includes('/')) {
        // MM/DD/YYYY
        return new Date(y, num1 - 1, num2);
      } else {
        // DD-MM-YYYY
        return new Date(y, num2 - 1, num1);
      }
    }
  }

  return null;
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
    return [];
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
  const result: FeeScheduleTerm[] = [];

  if (numberOfTerms === 12) {
    let currentStart = new Date(start);

    for (let i = 1; i <= 12; i++) {
      const termStart = new Date(currentStart);
      let termEnd: Date;

      if (i === 12) {
        termEnd = new Date(end);
      } else {
        const nextMonthStart = new Date(start.getFullYear(), start.getMonth() + i, start.getDate());
        termEnd = new Date(nextMonthStart);
        termEnd.setDate(nextMonthStart.getDate() - 1);
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

      const monthLabel = termStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const termName = existingMatch?.termName || `Term ${i} (${monthLabel})`;

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
        percentageShare: Math.round((100 / 12) * 100) / 100,
      });

      if (i < 12) {
        currentStart = new Date(start.getFullYear(), start.getMonth() + i, start.getDate());
      }
    }

    return result;
  }

  const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const baseDays = Math.floor(totalDays / numberOfTerms);
  const remainderDays = totalDays % numberOfTerms;

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
  const start = parseDateIso(ay.startDate);
  const end = parseDateIso(ay.endDate);
  const safeDueDay = Math.min(31, Math.max(1, dueDay || 10));

  if (!start || !end || end <= start) {
    return {
      applySameDayToAllMonths: true,
      dueDay: safeDueDay,
      monthDueDates: [],
    };
  }

  const monthDueDates: MonthDueDateItem[] = [];
  let currentMonth = new Date(start.getFullYear(), start.getMonth(), 1);

  // If academic year end date is on the 1st of a month (e.g., 2027-06-01), the final installment month is May 2027
  let effectiveEnd = new Date(end);
  if (effectiveEnd.getDate() === 1 && (effectiveEnd.getFullYear() > start.getFullYear() || effectiveEnd.getMonth() > start.getMonth())) {
    effectiveEnd = new Date(effectiveEnd.getFullYear(), effectiveEnd.getMonth(), 0);
  }

  const lastMonth = new Date(effectiveEnd.getFullYear(), effectiveEnd.getMonth(), 1);

  let idx = 0;
  // Limit to exactly 12 monthly installments for a 1-year schedule
  while (currentMonth <= lastMonth && idx < 12) {
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

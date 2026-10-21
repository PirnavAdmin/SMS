export interface DateParts {
  year: number;
  month: number; // 1-12
  day: number;   // 1-31
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

export function getDaysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

/**
 * Safely parses any date string, timestamp, or Date object into { year, month, day }
 * without UTC/local timezone shifts or off-by-one errors.
 */
export function parseDateOnly(dateInput?: string | Date | number | null): DateParts | null {
  if (!dateInput) return null;

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return null;
    return {
      year: dateInput.getFullYear(),
      month: dateInput.getMonth() + 1,
      day: dateInput.getDate(),
    };
  }

  if (typeof dateInput === 'number') {
    if (dateInput < 100000) {
      // Excel serial date
      const utcDays = Math.floor(dateInput - 25569);
      const d = new Date(utcDays * 86400 * 1000);
      if (isNaN(d.getTime())) return null;
      return {
        year: d.getUTCFullYear(),
        month: d.getUTCMonth() + 1,
        day: d.getUTCDate(),
      };
    }
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
    };
  }

  const str = String(dateInput).trim();
  if (!str) return null;

  const clean = str.split(/[T ]/)[0];
  const parts = clean.split(/[-/.]/);
  if (parts.length !== 3) return null;

  let y = 0, m = 0, d = 0;

  if (parts[0].length === 4) {
    // YYYY-MM-DD or YYYY/MM/DD
    y = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
    d = parseInt(parts[2], 10);
  } else if (parts[2].length === 4) {
    const num0 = parseInt(parts[0], 10);
    const num1 = parseInt(parts[1], 10);
    y = parseInt(parts[2], 10);

    if (num0 > 12) {
      // DD-MM-YYYY or DD/MM/YYYY
      d = num0;
      m = num1;
    } else if (num1 > 12) {
      // MM/DD/YYYY or MM-DD-YYYY
      m = num0;
      d = num1;
    } else {
      // Default to DD-MM-YYYY / DD/MM/YYYY as standard across SMS
      d = num0;
      m = num1;
    }
  } else {
    return null;
  }

  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  if (m < 1 || m > 12) return null;
  const maxDays = getDaysInMonth(y, m);
  if (d < 1 || d > maxDays) return null;
  if (y < 1900 || y > 2200) return null;

  return { year: y, month: m, day: d };
}

/**
 * Compares two dates. Returns:
 * < 0 if d1 < d2
 *   0 if d1 === d2
 * > 0 if d1 > d2
 */
export function compareDates(d1: DateParts, d2: DateParts): number {
  if (d1.year !== d2.year) return d1.year - d2.year;
  if (d1.month !== d2.month) return d1.month - d2.month;
  return d1.day - d2.day;
}

/**
 * Calculates completed exact age (years, months, days) between date of birth and target date.
 */
export function calculateExactAge(dob: DateParts, atDate: DateParts): { years: number; months: number; days: number } {
  let years = atDate.year - dob.year;
  let months = atDate.month - dob.month;
  let days = atDate.day - dob.day;

  if (days < 0) {
    months--;
    const prevMonth = atDate.month === 1 ? 12 : atDate.month - 1;
    const prevYear = atDate.month === 1 ? atDate.year - 1 : atDate.year;
    days += getDaysInMonth(prevYear, prevMonth);
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months, days };
}

/**
 * Gets the configured or standard minimum age requirement for a given class.
 */
export function getMinimumAgeForClass(
  className?: string | null,
  academicClasses?: any[]
): number | null {
  if (!className || typeof className !== 'string') return null;
  const clean = className.trim();
  if (!clean || clean.toLowerCase() === 'select' || clean.toLowerCase() === 'select class') return null;

  // 1. Check if explicitly configured in academicClasses master list
  if (Array.isArray(academicClasses) && academicClasses.length > 0) {
    const matched = academicClasses.find(
      (c) => c && (
        c.name?.toLowerCase().trim() === clean.toLowerCase() ||
        c.className?.toLowerCase().trim() === clean.toLowerCase()
      )
    );
    if (matched && typeof matched.minimumAge === 'number' && matched.minimumAge >= 0) {
      return matched.minimumAge;
    }
  }

  // 2. Standard school grade progression defaults
  const lower = clean.toLowerCase();
  if (lower.includes('play') || lower.includes('nursery') || lower.includes('pre-nursery')) {
    return 3;
  }
  if (lower.includes('lkg') || lower.includes('pp1') || lower.includes('pre-kg') || lower.includes('junior kg')) {
    return 4;
  }
  if (lower.includes('ukg') || lower.includes('pp2') || lower.includes('senior kg') || lower.includes('kg')) {
    return 5;
  }

  // Check numbered classes: Class 1 -> 6, Class 2 -> 7, ..., Class 12 -> 17
  const numMatch = lower.match(/\b(?:class|grade)?\s*(\d+)(?:st|nd|rd|th)?\b/) || lower.match(/(\d+)/);
  if (numMatch) {
    const gradeNum = parseInt(numMatch[1], 10);
    if (!isNaN(gradeNum) && gradeNum >= 1 && gradeNum <= 12) {
      return gradeNum + 5;
    }
  }

  return null;
}

export type StudentAgeErrorCode =
  | 'MISSING_DOB'
  | 'INVALID_DOB'
  | 'MISSING_ADMISSION_DATE'
  | 'INVALID_ADMISSION_DATE'
  | 'ADMISSION_BEFORE_DOB'
  | 'MISSING_CLASS'
  | 'UNDERAGE';

export interface StudentAgeValidationResult {
  isValid: boolean;
  errorCode?: StudentAgeErrorCode | null;
  message?: string;
  ageYears?: number;
  ageMonths?: number;
  ageDays?: number;
  minimumAge?: number;
  className?: string;
}

export interface ValidateStudentAgeParams {
  dateOfBirth?: string | Date | number | null;
  dateOfAdmission?: string | Date | number | null;
  className?: string | null;
  classId?: string | number | null;
  academicClasses?: any[];
}

/**
 * Validates a student's age eligibility for admission.
 * Validation priority:
 * 1. Invalid / missing DOB
 * 2. Invalid / missing Admission Date
 * 3. Admission Date before DOB
 * 4. Missing Class
 * 5. Minimum age violation
 * 6. Valid
 */
export function validateStudentAge(params: ValidateStudentAgeParams): StudentAgeValidationResult {
  const { dateOfBirth, dateOfAdmission, className, classId, academicClasses } = params;

  // 1. Missing / Invalid Date of Birth
  if (!dateOfBirth || (typeof dateOfBirth === 'string' && !dateOfBirth.trim())) {
    return {
      isValid: false,
      errorCode: 'MISSING_DOB',
      message: 'Date of birth is required.',
    };
  }

  const dobParts = parseDateOnly(dateOfBirth);
  if (!dobParts) {
    return {
      isValid: false,
      errorCode: 'INVALID_DOB',
      message: 'Date of birth must be a valid date.',
    };
  }

  const now = new Date();
  const todayParts: DateParts = {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };

  if (compareDates(dobParts, todayParts) >= 0) {
    return {
      isValid: false,
      errorCode: 'INVALID_DOB',
      message: 'Date of birth must be a past date (today or future dates are not allowed).',
    };
  }

  // 2. Missing / Invalid Date of Admission
  if (!dateOfAdmission || (typeof dateOfAdmission === 'string' && !dateOfAdmission.trim())) {
    return {
      isValid: false,
      errorCode: 'MISSING_ADMISSION_DATE',
      message: 'Date of admission is required.',
    };
  }

  const admParts = parseDateOnly(dateOfAdmission);
  if (!admParts) {
    return {
      isValid: false,
      errorCode: 'INVALID_ADMISSION_DATE',
      message: 'Date of admission must be a valid date.',
    };
  }

  // 3. Date of Admission cannot be earlier than Date of Birth
  if (compareDates(admParts, dobParts) < 0) {
    return {
      isValid: false,
      errorCode: 'ADMISSION_BEFORE_DOB',
      message: 'Date of Admission cannot be earlier than Date of Birth.',
    };
  }

  // 4. Missing Class
  let targetClass = className?.trim() || '';
  if ((!targetClass || targetClass === 'Select' || targetClass === 'Select Class') && classId && Array.isArray(academicClasses)) {
    const found = academicClasses.find((c) => String(c.id) === String(classId) || String(c.classId) === String(classId));
    if (found) {
      targetClass = found.name || found.className || '';
    }
  }

  if (!targetClass || targetClass === 'Select' || targetClass === 'Select Class') {
    return {
      isValid: false,
      errorCode: 'MISSING_CLASS',
      message: 'Please select a class.',
    };
  }

  // 5. Minimum age check
  const exactAge = calculateExactAge(dobParts, admParts);
  const minAge = getMinimumAgeForClass(targetClass, academicClasses);

  if (minAge !== null && minAge > 0) {
    if (exactAge.years < minAge) {
      return {
        isValid: false,
        errorCode: 'UNDERAGE',
        message: 'Student does not meet the minimum age requirement for the selected class.',
        ageYears: exactAge.years,
        ageMonths: exactAge.months,
        ageDays: exactAge.days,
        minimumAge: minAge,
        className: targetClass,
      };
    }
  } else if (exactAge.years === 0 && exactAge.months === 0 && exactAge.days === 0) {
    return {
      isValid: false,
      errorCode: 'UNDERAGE',
      message: 'Student does not meet the minimum age requirement for the selected class.',
      ageYears: 0,
      ageMonths: 0,
      ageDays: 0,
      minimumAge: 3,
      className: targetClass,
    };
  }

  // 6. Valid
  return {
    isValid: true,
    errorCode: null,
    message: '',
    ageYears: exactAge.years,
    ageMonths: exactAge.months,
    ageDays: exactAge.days,
    minimumAge: minAge ?? 0,
    className: targetClass,
  };
}

/**
 * Validates a Date of Birth string in exact DD-MM-YYYY format.
 * - Must match DD-MM-YYYY or DD/MM/YYYY pattern.
 * - Year must be exactly 4 digits.
 * - Must be a valid calendar date (checking leap years and month lengths).
 */
export function validateDOB(dateStr: string): { isValid: boolean; error?: string } {
  if (!dateStr || typeof dateStr !== 'string') {
    return { isValid: false, error: 'Date of birth is required.' };
  }

  const clean = dateStr.trim();
  const parts = clean.split(/[-/]/);
  if (parts.length !== 3) {
    return { isValid: false, error: 'Must use DD-MM-YYYY format (e.g., 15-08-2012 with a 4-digit year).' };
  }

  let day = 0, month = 0, year = 0;

  if (parts[0].length === 4) {
    // YYYY-MM-DD format
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  } else if (parts[2].length === 4) {
    // DD-MM-YYYY or DD/MM/YYYY format
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
  } else {
    return { isValid: false, error: 'Must use DD-MM-YYYY format (e.g., 15-08-2012 with a 4-digit year).' };
  }

  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    return { isValid: false, error: 'Must use DD-MM-YYYY format (e.g., 15-08-2012 with a 4-digit year).' };
  }

  if (month < 1 || month > 12) {
    return { isValid: false, error: 'Invalid month. Month must be between 01 and 12.' };
  }

  // Check for past date restriction (cannot be today or future dates)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDate = new Date(year, month - 1, day);
  selectedDate.setHours(0, 0, 0, 0);

  if (selectedDate >= today) {
    return { isValid: false, error: 'Date of birth must be a past date (today or future dates are not allowed).' };
  }

  if (year < 1900) {
    return { isValid: false, error: 'Year must be 1900 or later.' };
  }

  // Days in each month
  const daysInMonth = [31, (isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  if (day < 1 || day > daysInMonth[month - 1]) {
    return { isValid: false, error: `Invalid day for month ${month}. Must be between 01 and ${daysInMonth[month - 1]}.` };
  }

  return { isValid: true };
}

/**
 * Converts standard YYYY-MM-DD or DD/MM/YYYY input date to DD-MM-YYYY format
 */
export function formatToDDMMYYYY(isoDate: string, separator: string = '-'): string {
  if (!isoDate) return '';
  const clean = isoDate.trim();
  const parts = clean.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD -> DD-MM-YYYY
      return `${parts[2].padStart(2, '0')}${separator}${parts[1].padStart(2, '0')}${separator}${parts[0]}`;
    } else if (parts[2].length === 4) {
      // DD-MM-YYYY or MM-DD-YYYY
      return `${parts[0].padStart(2, '0')}${separator}${parts[1].padStart(2, '0')}${separator}${parts[2]}`;
    }
  }
  return clean;
}

/**
 * Converts DD-MM-YYYY or DD/MM/YYYY to YYYY-MM-DD for standard HTML date input
 */
export function formatToISO(ddmmyyyy: string): string {
  if (!ddmmyyyy) return '';
  const parts = ddmmyyyy.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) return ddmmyyyy; // already ISO YYYY-MM-DD
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return ddmmyyyy;
}

/**
 * Converts any date string, timestamp, or Date object to standard DD-MM-YYYY format for display.
 * Example: 2026-06-01 -> 01-06-2026, 06/01/2026 -> 01-06-2026
 */
export function formatDateForDisplay(dateInput?: string | Date | number | null, fallback: string = ''): string {
  if (!dateInput) return fallback;

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return fallback;
    const d = String(dateInput.getDate()).padStart(2, '0');
    const m = String(dateInput.getMonth() + 1).padStart(2, '0');
    const y = dateInput.getFullYear();
    return `${d}-${m}-${y}`;
  }

  const str = String(dateInput).trim();
  if (!str) return fallback;

  // If ISO string like 2026-06-01T00:00:00 or 2026-06-01 00:00:00, take the date part
  const cleanDateStr = str.split(/[T ]/)[0];
  const parts = cleanDateStr.split(/[-/.]/);

  if (parts.length === 3) {
    let d = 0, m = 0, y = 0;

    if (parts[0].length === 4) {
      // YYYY-MM-DD or YYYY/MM/DD
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      d = parseInt(parts[2], 10);
    } else if (parts[2].length === 4) {
      // Could be DD-MM-YYYY or MM/DD/YYYY or DD/MM/YYYY
      const num1 = parseInt(parts[0], 10);
      const num2 = parseInt(parts[1], 10);
      y = parseInt(parts[2], 10);

      if (num1 > 12) {
        // num1 is Day (e.g. 16/06/2026 or 30-06-2026)
        d = num1;
        m = num2;
      } else if (num2 > 12) {
        // num2 is Day (e.g. 06/16/2026 or 06-30-2026)
        m = num1;
        d = num2;
      } else {
        // Both <= 12 (e.g. 01-06-2026 or 06/01/2026)
        if (cleanDateStr.includes('/')) {
          // MM/DD/YYYY format (US style) -> num1=Month, num2=Day
          m = num1;
          d = num2;
        } else {
          // DD-MM-YYYY format -> num1=Day, num2=Month
          d = num1;
          m = num2;
        }
      }
    }

    if (!isNaN(d) && !isNaN(m) && !isNaN(y) && d > 0 && m > 0 && m <= 12 && y > 1000) {
      const dayStr = String(d).padStart(2, '0');
      const monthStr = String(m).padStart(2, '0');
      return `${dayStr}-${monthStr}-${y}`;
    }
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const d = String(parsed.getDate()).padStart(2, '0');
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const y = parsed.getFullYear();
    return `${d}-${m}-${y}`;
  }

  return cleanDateStr.replace(/\//g, '-') || fallback;
}

/**
 * Legacy/compatibility wrapper mapping to formatDateForDisplay
 */
export function formatDateDDMMYYYY(dateStr?: string | null): string {
  return formatDateForDisplay(dateStr, 'N/A');
}

export interface HolidayCheckResult {
  isHoliday: boolean;
  type: 'Sunday' | 'Holiday' | null;
  name: string;
}

/**
 * Checks if a given date (YYYY-MM-DD or DD-MM-YYYY) is a Sunday or declared Holiday
 */
export function checkSundayOrHoliday(dateStr?: string | null, holidays: any[] = []): HolidayCheckResult {
  if (!dateStr || typeof dateStr !== 'string') {
    return { isHoliday: false, type: null, name: '' };
  }

  const iso = formatToISO(dateStr.trim());
  if (!iso || iso.length < 10) {
    return { isHoliday: false, type: null, name: '' };
  }

  const parts = iso.split('-');
  if (parts.length !== 3) {
    return { isHoliday: false, type: null, name: '' };
  }

  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);

  const dateObj = new Date(y, m, d);
  if (isNaN(dateObj.getTime())) {
    return { isHoliday: false, type: null, name: '' };
  }

  // 1. Sunday check
  if (dateObj.getDay() === 0) {
    return { isHoliday: true, type: 'Sunday', name: 'Sunday' };
  }

  // 2. Declared Holiday check from holidays array
  if (Array.isArray(holidays) && holidays.length > 0) {
    const matched = holidays.find(h => {
      if (!h || h.status === 'Inactive' || h.status === 'Cancelled') return false;
      const sRaw = h.startDate || h.date || '';
      const eRaw = h.endDate || h.startDate || h.date || '';
      const s = formatToISO(String(sRaw).split('T')[0].trim());
      const e = formatToISO(String(eRaw).split('T')[0].trim());
      if (!s) return false;
      return iso >= s && iso <= (e || s);
    });

    if (matched) {
      return {
        isHoliday: true,
        type: 'Holiday',
        name: matched.name || matched.title || 'School Holiday'
      };
    }
  }

  return { isHoliday: false, type: null, name: '' };
}

export interface AcademicYearRangeInfo {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  minMonth: string;  // YYYY-MM
  maxMonth: string;  // YYYY-MM
  startYear: number;
  startMonth: number; // 0-indexed
  endYear: number;
  endMonth: number;   // 0-indexed
}

export function parseAcademicYearRange(
  selectedAcademicYear?: string,
  academicYears: any[] = []
): AcademicYearRangeInfo {
  const cleanSel = String(selectedAcademicYear || '')
    .replace(/\s+/g, '')
    .replace('–', '-')
    .toLowerCase();

  // 1. Search in academicYears master
  const matched = (academicYears || []).find((ay) => {
    if (!ay) return false;
    const val = String(ay.academicYear || ay.year || ay.academicYearName || '')
      .replace(/\s+/g, '')
      .replace('–', '-')
      .toLowerCase();
    if (cleanSel && val === cleanSel) return true;
    const p1 = cleanSel.split('-');
    const p2 = val.split('-');
    if (p1.length === 2 && p2.length === 2) {
      const s1 = p1[0];
      const s2 = p2[0];
      const e1 = p1[1].length === 2 ? `20${p1[1]}` : p1[1];
      const e2 = p2[1].length === 2 ? `20${p2[1]}` : p2[1];
      if (s1 === s2 && e1 === e2) return true;
    }
    return false;
  });

  let sDate = matched?.startDate ? String(matched.startDate).split('T')[0].trim() : '';
  let eDate = matched?.endDate ? String(matched.endDate).split('T')[0].trim() : '';

  // 2. Parse from selectedAcademicYear string if not found or dates missing
  if ((!sDate || !eDate) && cleanSel) {
    const parts = cleanSel.split('-');
    if (parts.length === 2) {
      const sy = parseInt(parts[0], 10);
      const ey = parts[1].length === 2 ? parseInt(`20${parts[1]}`, 10) : parseInt(parts[1], 10);
      if (!isNaN(sy) && !isNaN(ey)) {
        sDate = `${sy}-06-01`;
        eDate = `${ey}-05-31`;
      }
    }
  }

  // Fallback to active year or current year
  if (!sDate || !eDate) {
    const activeAY = (academicYears || []).find(
      (ay) => ay && (ay.isCurrentAcademicYear || ay.status === 'Active')
    );
    if (activeAY?.startDate && activeAY?.endDate) {
      sDate = String(activeAY.startDate).split('T')[0].trim();
      eDate = String(activeAY.endDate).split('T')[0].trim();
    } else {
      const curYear = new Date().getFullYear();
      sDate = `${curYear}-06-01`;
      eDate = `${curYear + 1}-05-31`;
    }
  }

  const startYear = parseInt(sDate.slice(0, 4), 10) || new Date().getFullYear();
  const startMonth = Math.max(0, (parseInt(sDate.slice(5, 7), 10) || 6) - 1);
  const endYear = parseInt(eDate.slice(0, 4), 10) || startYear + 1;
  const endMonth = Math.max(0, (parseInt(eDate.slice(5, 7), 10) || 5) - 1);

  return {
    startDate: sDate,
    endDate: eDate,
    minMonth: sDate.slice(0, 7),
    maxMonth: eDate.slice(0, 7),
    startYear,
    startMonth,
    endYear,
    endMonth,
  };
}

export function getTargetMonthInAY(
  desiredMonth0to11: number,
  ayInfo: AcademicYearRangeInfo
): { year: number; month: number; monthStr: string } {
  const mStr = String(desiredMonth0to11 + 1).padStart(2, '0');

  // Try start year
  const candStart = `${ayInfo.startYear}-${mStr}`;
  if (candStart >= ayInfo.minMonth && candStart <= ayInfo.maxMonth) {
    return { year: ayInfo.startYear, month: desiredMonth0to11, monthStr: candStart };
  }

  // Try end year
  const candEnd = `${ayInfo.endYear}-${mStr}`;
  if (candEnd >= ayInfo.minMonth && candEnd <= ayInfo.maxMonth) {
    return { year: ayInfo.endYear, month: desiredMonth0to11, monthStr: candEnd };
  }

  // Fallback to minMonth
  return { year: ayInfo.startYear, month: ayInfo.startMonth, monthStr: ayInfo.minMonth };
}


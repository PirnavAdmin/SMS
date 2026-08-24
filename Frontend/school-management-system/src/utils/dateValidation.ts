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

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
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
 * Converts any date string (YYYY-MM-DD or DD-MM-YYYY) to standard DD-MM-YYYY format
 */
export function formatDateDDMMYYYY(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== 'string') return 'N/A';
  const clean = dateStr.trim();
  if (!clean) return 'N/A';
  
  const parts = clean.split(/[-/]/);
  if (parts.length !== 3) return clean;

  let day = '', month = '', year = '';

  if (parts[0].length === 4) {
    // YYYY-MM-DD format -> convert to DD-MM-YYYY
    year = parts[0];
    month = parts[1].padStart(2, '0');
    day = parts[2].padStart(2, '0');
    return `${day}-${month}-${year}`;
  } else if (parts[2].length === 4) {
    // Already DD-MM-YYYY format
    day = parts[0].padStart(2, '0');
    month = parts[1].padStart(2, '0');
    year = parts[2];
    return `${day}-${month}-${year}`;
  }

  return clean;
}


/**
 * Validates a Date of Birth string in exact DD/MM/YYYY format.
 * - Must strictly match DD/MM/YYYY pattern.
 * - Year must be exactly 4 digits.
 * - Must be a valid calendar date (checking leap years and month lengths).
 */
export function validateDOB(dateStr: string): { isValid: boolean; error?: string } {
  if (!dateStr || typeof dateStr !== 'string') {
    return { isValid: false, error: 'Date of birth is required.' };
  }

  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = dateStr.trim().match(regex);

  if (!match) {
    return { isValid: false, error: 'Must use DD/MM/YYYY format (e.g., 15/08/2012 with a 4-digit year).' };
  }

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  if (month < 1 || month > 12) {
    return { isValid: false, error: 'Invalid month. Month must be between 01 and 12.' };
  }

  if (year < 1900 || year > new Date().getFullYear()) {
    return { isValid: false, error: `Year must be between 1900 and ${new Date().getFullYear()}.` };
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
 * Converts standard YYYY-MM-DD input date to DD/MM/YYYY format
 */
export function formatToDDMMYYYY(isoDate: string): string {
  if (!isoDate) return '';
  if (isoDate.includes('/')) return isoDate;
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
  }
  return isoDate;
}

/**
 * Converts DD/MM/YYYY to YYYY-MM-DD for standard HTML date input
 */
export function formatToISO(ddmmyyyy: string): string {
  if (!ddmmyyyy) return '';
  const parts = ddmmyyyy.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return ddmmyyyy;
}

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const;
export const CASTE_CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS', 'Others'] as const;
export const BRANCHES = ['Main Campus', 'North Branch', 'West Campus', 'Hyderabad'] as const;
export const RELIGIONS = ['Hinduism', 'Islam', 'Christianity', 'Sikhism', 'Buddhism', 'Jainism', 'Zoroastrianism', 'Judaism', 'Other'] as const;

/**
 * Validates a mobile number to ensure it contains exactly 10 numeric digits.
 */
export function validate10DigitPhone(phone: string): { isValid: boolean; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Mobile number is required.' };
  }

  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  if (!/^\d{10}$/.test(cleaned)) {
    return { isValid: false, error: 'Mobile number must contain exactly 10 digits (e.g., 9876543210).' };
  }

  return { isValid: true };
}

/**
 * Validates an email address and its domain format.
 */
export function validateEmail(email: string, required: boolean = false): { isValid: boolean; error?: string } {
  if (!email || typeof email !== 'string' || !email.trim()) {
    if (required) {
      return { isValid: false, error: 'Email address is required.' };
    }
    return { isValid: true };
  }

  const trimmed = email.trim();

  // 1. Basic RFC 5322 structure regex (user@domain.tld), TLD 2 to 6 characters
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g., name@gmail.com).' };
  }

  // 2. Extract domain part
  const parts = trimmed.toLowerCase().split('@');
  if (parts.length !== 2) {
    return { isValid: false, error: 'Invalid email format.' };
  }

  const domain = parts[1];

  // 3. Domain formatting checks: consecutive dots or leading/trailing dots
  if (domain.includes('..') || domain.startsWith('.') || domain.endsWith('.')) {
    return { isValid: false, error: 'Invalid email domain format.' };
  }

  // 4. Well-known email provider strict domain validation
  // Gmail domain validation
  if (domain === 'gmail' || domain.startsWith('gmail.')) {
    if (domain !== 'gmail.com' && domain !== 'gmail.co.in' && domain !== 'googlemail.com') {
      return { isValid: false, error: 'Invalid domain format. Gmail email addresses must end with @gmail.com or @gmail.co.in.' };
    }
  }

  // Yahoo domain validation
  if (domain === 'yahoo' || domain.startsWith('yahoo.')) {
    const validYahoo = ['yahoo.com', 'yahoo.co.in', 'yahoo.co.uk', 'yahoo.ca', 'yahoo.fr', 'yahoo.in'];
    if (!validYahoo.includes(domain)) {
      return { isValid: false, error: 'Invalid domain format. Yahoo email addresses must end with @yahoo.com or @yahoo.co.in.' };
    }
  }

  // Hotmail / Outlook / Live / iCloud domain validation
  if (domain === 'hotmail' || domain.startsWith('hotmail.')) {
    if (domain !== 'hotmail.com' && domain !== 'hotmail.co.uk' && domain !== 'hotmail.fr' && domain !== 'hotmail.es') {
      return { isValid: false, error: 'Invalid domain format. Hotmail email addresses must end with @hotmail.com.' };
    }
  }
  if (domain === 'outlook' || domain.startsWith('outlook.')) {
    if (domain !== 'outlook.com' && domain !== 'outlook.co.uk' && domain !== 'outlook.in') {
      return { isValid: false, error: 'Invalid domain format. Outlook email addresses must end with @outlook.com.' };
    }
  }
  if (domain === 'icloud' || domain.startsWith('icloud.')) {
    if (domain !== 'icloud.com') {
      return { isValid: false, error: 'Invalid domain format. iCloud email addresses must end with @icloud.com.' };
    }
  }

  // Common provider typos
  const typoDomains: Record<string, string> = {
    'gmai.com': 'Invalid domain format. Did you mean gmail.com?',
    'gmal.com': 'Invalid domain format. Did you mean gmail.com?',
    'yaho.com': 'Invalid domain format. Did you mean yahoo.com?'
  };

  if (typoDomains[domain]) {
    return { isValid: false, error: typoDomains[domain] };
  }

  // 5. General TLD validation (must be 2-6 alphabetic chars)
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2 || tld.length > 6 || !/^[a-zA-Z]+$/.test(tld)) {
    return { isValid: false, error: 'Invalid email domain format. Domain extension is invalid (e.g., .com, .co.in).' };
  }

  // Disallow repetitive dummy TLDs like "innnnnn", "aaaaaa"
  if (/^(.)\1+$/.test(tld)) {
    return { isValid: false, error: 'Invalid email domain extension.' };
  }

  return { isValid: true };
}

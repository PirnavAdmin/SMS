export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const;
export const CASTE_CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS', 'Others'] as const;
export const BRANCHES = ['Main Campus', 'North Branch', 'West Campus', 'Hyderabad'] as const;
export const RELIGIONS = ['Hinduism', 'Islam', 'Christianity', 'Sikhism', 'Buddhism', 'Jainism', 'Zoroastrianism', 'Judaism', 'Other'] as const;

/**
 * Validates a mobile number to ensure it contains exactly 10 numeric digits.
 */
export function validate10DigitPhone(phone: string): { isValid: boolean; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Enter a valid phone number.' };
  }

  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  if (!/^\d{10}$/.test(cleaned)) {
    return { isValid: false, error: 'Enter a valid phone number.' };
  }

  return { isValid: true };
}

/**
 * Validates an email address and its domain format.
 */
export function validateEmail(email: string, required: boolean = false): { isValid: boolean; error?: string } {
  if (!email || typeof email !== 'string' || !email.trim()) {
    if (required) {
      return { isValid: false, error: 'Enter a valid email address.' };
    }
    return { isValid: true };
  }

  const trimmed = email.trim();

  // 1. Basic RFC 5322 structure regex (user@domain.tld), TLD 2 to 6 characters
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }

  // 2. Extract domain part
  const parts = trimmed.toLowerCase().split('@');
  if (parts.length !== 2) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }

  const domain = parts[1];

  // 3. Domain formatting checks: consecutive dots or leading/trailing dots
  if (domain.includes('..') || domain.startsWith('.') || domain.endsWith('.')) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }

  // 4. Well-known email provider strict domain validation
  // Gmail domain validation
  if (domain === 'gmail' || domain.startsWith('gmail.')) {
    if (domain !== 'gmail.com' && domain !== 'gmail.co.in' && domain !== 'googlemail.com') {
      return { isValid: false, error: 'Enter a valid email address.' };
    }
  }

  // Yahoo domain validation
  if (domain === 'yahoo' || domain.startsWith('yahoo.')) {
    const validYahoo = ['yahoo.com', 'yahoo.co.in', 'yahoo.co.uk', 'yahoo.ca', 'yahoo.fr', 'yahoo.in'];
    if (!validYahoo.includes(domain)) {
      return { isValid: false, error: 'Enter a valid email address.' };
    }
  }

  // Hotmail / Outlook / Live / iCloud domain validation
  if (domain === 'hotmail' || domain.startsWith('hotmail.')) {
    if (domain !== 'hotmail.com' && domain !== 'hotmail.co.uk' && domain !== 'hotmail.fr' && domain !== 'hotmail.es') {
      return { isValid: false, error: 'Enter a valid email address.' };
    }
  }
  if (domain === 'outlook' || domain.startsWith('outlook.')) {
    if (domain !== 'outlook.com' && domain !== 'outlook.co.uk' && domain !== 'outlook.in') {
      return { isValid: false, error: 'Enter a valid email address.' };
    }
  }
  if (domain === 'icloud' || domain.startsWith('icloud.')) {
    if (domain !== 'icloud.com') {
      return { isValid: false, error: 'Enter a valid email address.' };
    }
  }

  // Common provider typos
  const typoDomains: Record<string, string> = {
    'gmai.com': 'Enter a valid email address.',
    'gmal.com': 'Enter a valid email address.',
    'yaho.com': 'Enter a valid email address.'
  };

  if (typoDomains[domain]) {
    return { isValid: false, error: typoDomains[domain] };
  }

  // 5. General TLD validation (must be 2-6 alphabetic chars)
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2 || tld.length > 6 || !/^[a-zA-Z]+$/.test(tld)) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }

  // Disallow repetitive dummy TLDs like "innnnnn", "aaaaaa"
  if (/^(.)\1+$/.test(tld)) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }

  return { isValid: true };
}

/**
 * Validates a person's full name to ensure it contains only valid alphabets, spaces, hyphens, and dots.
 */
export function validateFullName(name: string, required: boolean = true): { isValid: boolean; error?: string } {
  if (!name || typeof name !== 'string' || !name.trim()) {
    if (required) {
      return { isValid: false, error: 'Enter a valid full name.' };
    }
    return { isValid: true };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Enter a valid full name.' };
  }

  // Permit only alphabets, spaces, hyphens, dots, apostrophes
  if (!/^[a-zA-Z\s\-\.\']+$/.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid full name.' };
  }

  return { isValid: true };
}

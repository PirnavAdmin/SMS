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
 * Validates a phone number ensuring it contains exactly 10 digits.
 */
export function validatePhoneNumber(phone: string, required: boolean = false): { isValid: boolean; error?: string } {
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    if (required) {
      return { isValid: false, error: 'Enter a valid 10-digit phone number.' };
    }
    return { isValid: true };
  }

  const trimmed = phone.trim();

  const digitCount = (trimmed.match(/\d/g) || []).length;
  if (digitCount !== 10) {
    return { isValid: false, error: 'Phone number must be exactly 10 digits.' };
  }

  return { isValid: true };
}

/**
 * Sanitizes phone input text allowing digits only, while limiting length to 10 digits.
 */
export function sanitizePhoneInput(input: string, maxDigits: number = 10): string {
  if (!input) return '';
  const digitsOnly = input.replace(/\D/g, '');
  return digitsOnly.slice(0, maxDigits);
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
 * Validates a person's full name to ensure it contains only valid alphabetic words, spaces, hyphens, and dots,
 * and rejects random gibberish or keyboard-mashing character patterns.
 */
export function validateFullName(name: string, required: boolean = true): { isValid: boolean; error?: string } {
  if (!name || typeof name !== 'string' || !name.trim()) {
    if (required) {
      return { isValid: false, error: 'Enter a valid full name.' };
    }
    return { isValid: true };
  }

  const trimmed = name.trim();

  // 1. Min length check
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Full name must be at least 2 characters.' };
  }

  // 2. Max length check
  if (trimmed.length > 70) {
    return { isValid: false, error: 'Full name cannot exceed 70 characters.' };
  }

  // 3. Allowed characters check (alphabets, spaces, hyphens, dots, apostrophes)
  if (!/^[a-zA-Z\s\-\.\']+$/.test(trimmed)) {
    return { isValid: false, error: 'Full name contains invalid characters.' };
  }

  // 4. Reject 3 or more consecutive identical characters (e.g., "fff", "ggg", "aaa")
  if (/(.)\1{2,}/i.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid name without repetitive characters.' };
  }

  // 5. Reject repeated character patterns (e.g., "asdasdasd", "gdgdgdgd", "abcabcabc")
  if (/(..)\1{2,}/i.test(trimmed) || /(...)\1{2,}/i.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid name without repeating patterns.' };
  }

  // 6. Reject common keyboard row mashing (e.g., "qwerty", "asdfgh", "zxcvbn", "dfghjk", "fghjkl")
  if (/(qwerty|wertyu|ertyui|rtyuio|tyuiop|asdfgh|sdfghj|dfghjk|fghjkl|zxcvbn|xcvbnm)/i.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid name without keyboard-mash patterns.' };
  }

  // 7. Inspect individual words
  const words = trimmed.split(/\s+/);
  const validAbbreviations = new Set(['mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'fr', 'pr']);

  for (const word of words) {
    const cleanWord = word.replace(/[\.\-\']/g, '');
    if (!cleanWord) continue;

    const lower = cleanWord.toLowerCase();

    // Rejection: single word too long (> 25 chars without space)
    if (cleanWord.length > 25) {
      return { isValid: false, error: 'Enter a valid full name.' };
    }

    // Must contain at least one vowel for words > 2 chars (unless standard abbreviation)
    if (cleanWord.length > 2 && !validAbbreviations.has(lower)) {
      const hasVowel = /[aeiouy]/i.test(cleanWord);
      if (!hasVowel) {
        return { isValid: false, error: 'Enter a valid name with recognizable words.' };
      }
    }

    // Rejection: 6 or more consecutive consonants (e.g., "ffgdggdgddgdhgd")
    if (/[bcdfghjklmnpqrstvwxz]{6,}/i.test(cleanWord)) {
      return { isValid: false, error: 'Enter a valid name without random character sequences.' };
    }

    // Rejection: Low vowel ratio in words length >= 6 (e.g., < 20% vowels)
    if (cleanWord.length >= 6) {
      const vowelsCount = (cleanWord.match(/[aeiouy]/gi) || []).length;
      if (vowelsCount / cleanWord.length < 0.20) {
        return { isValid: false, error: 'Enter a valid name without random character sequences.' };
      }

      // Rejection: Dominant single character making up > 45% of the word
      const charCounts: Record<string, number> = {};
      for (const char of lower) {
        charCounts[char] = (charCounts[char] || 0) + 1;
      }
      const maxCharCount = Math.max(...Object.values(charCounts));
      if (maxCharCount / cleanWord.length > 0.45) {
        return { isValid: false, error: 'Enter a valid name without repetitive characters.' };
      }
    }
  }

  return { isValid: true };
}

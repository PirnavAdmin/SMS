export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const;
export const CASTE_CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS', 'Others'] as const;
export const BRANCHES = ['Main Campus', 'North Branch', 'West Campus', 'Hyderabad'] as const;
export const RELIGIONS = ['Hinduism', 'Islam', 'Christianity', 'Sikhism', 'Buddhism', 'Jainism', 'Zoroastrianism', 'Judaism', 'Other'] as const;

function checkMobileNumberRules(cleaned: string): { isValid: boolean; error?: string } {
  if (cleaned.length !== 10) {
    return { isValid: false, error: 'Phone number must be exactly 10 digits.' };
  }
  if (!/^[6-9]/.test(cleaned)) {
    return { isValid: false, error: 'Mobile number must start with 6, 7, 8, or 9.' };
  }
  if (/^(\d)\1{9}$/.test(cleaned)) {
    return { isValid: false, error: 'Enter a valid mobile number (repeated digits not allowed).' };
  }
  return { isValid: true };
}

/**
 * Validates a mobile number to ensure it contains exactly 10 numeric digits starting with 6-9 without repeated digits.
 */
export function validate10DigitPhone(phone: string): { isValid: boolean; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Enter a valid 10-digit mobile number.' };
  }

  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false, error: 'Phone number must contain digits only.' };
  }

  return checkMobileNumberRules(cleaned);
}

/**
 * Validates a phone number ensuring it contains 10 digits starting with 6-9 without repeated digits.
 */
export function validatePhoneNumber(phone: string, required: boolean = false): { isValid: boolean; error?: string } {
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    if (required) {
      return { isValid: false, error: 'Enter a valid 10-digit mobile number.' };
    }
    return { isValid: true };
  }

  const trimmed = phone.trim();
  const cleaned = trimmed.replace(/\D/g, '');

  return checkMobileNumberRules(cleaned);
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

  // 1. Basic RFC 5322 structure regex (user@domain.tld), TLD 2 to 24 characters
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }

  // 2. Extract local and domain parts
  const parts = trimmed.toLowerCase().split('@');
  if (parts.length !== 2) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }

  const [localPart, domain] = parts;

  // Local part formatting checks
  if (!localPart || localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }

  if (!/^[a-zA-Z0-9._%+-]+$/.test(localPart)) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }

  // 3. Domain formatting checks: consecutive dots or leading/trailing dots or hyphens
  if (!domain || domain.includes('..') || domain.startsWith('.') || domain.endsWith('.')) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }

  const domainParts = domain.split('.');
  if (domainParts.length < 2) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }

  // Each domain segment must be valid hostname label
  for (const seg of domainParts) {
    if (!seg || seg.startsWith('-') || seg.endsWith('-') || !/^[a-zA-Z0-9-]+$/.test(seg)) {
      return { isValid: false, error: 'Enter a valid email address.' };
    }
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

  // Common provider & domain typos
  const typoDomains: Record<string, string> = {
    'gmai.com': 'Enter a valid email address.',
    'gmal.com': 'Enter a valid email address.',
    'gamil.com': 'Enter a valid email address.',
    'gmial.com': 'Enter a valid email address.',
    'yaho.com': 'Enter a valid email address.',
    'yahooo.com': 'Enter a valid email address.',
    'hotmial.com': 'Enter a valid email address.',
    'hotmaill.com': 'Enter a valid email address.',
    'outlok.com': 'Enter a valid email address.',
    'outllok.com': 'Enter a valid email address.'
  };

  if (typoDomains[domain]) {
    return { isValid: false, error: typoDomains[domain] };
  }

  // 5. TLD validation
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }

  // Disallow any character repeated 3 or more times anywhere in TLD (e.g. "commmm", "orggg", "innn")
  if (/(.)\1{2,}/.test(tld)) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }

  // Disallow repetitive dummy TLDs like "innnnnn", "aaaaaa"
  if (/^(.)\1+$/.test(tld)) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }

  // Disallow typos/variations of standard TLDs:
  if (/^co+m+$/.test(tld) && tld !== 'com') {
    return { isValid: false, error: 'Enter a valid email address.' };
  }
  if (/^or+g+$/.test(tld) && tld !== 'org') {
    return { isValid: false, error: 'Enter a valid email address.' };
  }
  if (/^ne+t+$/.test(tld) && tld !== 'net') {
    return { isValid: false, error: 'Enter a valid email address.' };
  }
  if (/^ed+u+$/.test(tld) && tld !== 'edu') {
    return { isValid: false, error: 'Enter a valid email address.' };
  }
  if (/^go+v+$/.test(tld) && tld !== 'gov') {
    return { isValid: false, error: 'Enter a valid email address.' };
  }

  const typoTLDs = new Set([
    'comm', 'commm', 'commmm', 'commmmm', 'coom', 'coomm', 'con', 'cmo', 'cm', 'xom',
    'edus', 'eduu', 'eduuu', 'orgg', 'orggg', 'nett', 'nettt', 'gmai', 'innd'
  ]);
  if (typoTLDs.has(tld)) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }

  // List of recognized valid standard ICANN gTLDs and ccTLDs
  const VALID_TLDS = new Set([
    // Generic & Business
    'com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'info', 'biz', 'pro', 'name', 'coop', 'aero', 'museum',
    // Education & Academy
    'school', 'academy', 'college', 'university', 'institute', 'education', 'training', 'learn',
    // Modern / Tech / Business
    'io', 'ai', 'app', 'dev', 'tech', 'cloud', 'digital', 'online', 'site', 'website', 'store', 'shop',
    'blog', 'live', 'news', 'space', 'club', 'global', 'world', 'network', 'systems', 'solutions',
    'services', 'center', 'hub', 'xyz', 'me', 'tv', 'cc', 'fm', 'to', 'link', 'agency', 'today', 'group',
    'foundation', 'community', 'international', 'management', 'consulting',
    // Country codes (ccTLDs)
    'in', 'co', 'uk', 'us', 'ca', 'au', 'nz', 'de', 'fr', 'es', 'it', 'nl', 'be', 'ch', 'at', 'se',
    'no', 'fi', 'dk', 'ie', 'pl', 'cz', 'ru', 'ua', 'za', 'br', 'mx', 'ar', 'cl', 'jp', 'cn', 'kr',
    'sg', 'my', 'id', 'th', 'vn', 'ph', 'pk', 'bd', 'lk', 'np', 'ae', 'sa', 'qa', 'kw', 'om', 'bh',
    'eg', 'ng', 'ke', 'gh', 'eu', 'ac', 'pt', 'gr', 'ro', 'hu', 'il', 'hk', 'tw', 'tr', 'asia'
  ]);

  if (!VALID_TLDS.has(tld)) {
    return { isValid: false, error: 'Enter a valid email address.' };
  }

  return { isValid: true };
}

/**
 * Sanitizes email input by stripping invalid email characters (e.g. colons, semicolons, quotes, spaces).
 */
export function sanitizeEmailInput(input: string): string {
  if (!input) return '';
  return input.replace(/[^a-zA-Z0-9@._%+-]/g, '');
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

    // Rejection: Dominant single character making up > 60% of the word (length >= 5)
    if (cleanWord.length >= 5) {
      const charCounts: Record<string, number> = {};
      for (const char of lower) {
        charCounts[char] = (charCounts[char] || 0) + 1;
      }
      const maxCharCount = Math.max(...Object.values(charCounts));
      if (maxCharCount / cleanWord.length > 0.60) {
        return { isValid: false, error: 'Enter a valid name without repetitive characters.' };
      }
    }
  }

  return { isValid: true };
}

/**
 * Validates a Campus / Branch Name to ensure it is a valid name,
 * restricts invalid special characters, enforces a 2-50 character limit,
 * and rejects random gibberish character patterns.
 */
export function validateCampusName(name: string, required: boolean = true): { isValid: boolean; error?: string } {
  if (!name || typeof name !== 'string' || !name.trim()) {
    if (required) {
      return { isValid: false, error: 'Enter a valid campus name.' };
    }
    return { isValid: true };
  }

  const trimmed = name.trim();

  // 1. Min length check
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Campus name must be at least 2 characters.' };
  }

  // 2. Max length check (50 chars)
  if (trimmed.length > 50) {
    return { isValid: false, error: 'Campus name cannot exceed 50 characters.' };
  }

  // 3. Allowed characters: Alphabets, digits, spaces, hyphens, ampersands, dots, commas, parentheses
  if (!/^[a-zA-Z0-9\s\-\.\,\&\(\)]+$/.test(trimmed)) {
    return { isValid: false, error: 'Campus name contains invalid special characters.' };
  }

  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(trimmed)) {
    return { isValid: false, error: 'Campus name must contain letters.' };
  }

  // 4. Reject 3 or more consecutive identical characters (e.g. "aaa", "fff")
  if (/(.)\1{2,}/i.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid campus name without repetitive characters.' };
  }

  // 5. Reject repeated character patterns (e.g. "asdasdasd", "gdgdgdgd")
  if (/(..)\1{2,}/i.test(trimmed) || /(...)\1{2,}/i.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid campus name without repeating patterns.' };
  }

  // 6. Reject common keyboard row mashing (e.g., "qwerty", "asdfgh", "zxcvbn")
  if (/(qwerty|wertyu|ertyui|rtyuio|tyuiop|asdfgh|sdfghj|dfghjk|fghjkl|zxcvbn|xcvbnm)/i.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid campus name without keyboard-mash patterns.' };
  }

  // 7. Word inspection for gibberish
  const words = trimmed.split(/\s+/);
  for (const word of words) {
    const cleanWord = word.replace(/[^a-zA-Z]/g, '');
    if (!cleanWord) continue;

    const lower = cleanWord.toLowerCase();

    // Rejection: single word > 25 chars
    if (cleanWord.length > 25) {
      return { isValid: false, error: 'Enter a valid campus name.' };
    }

    // Must contain at least one vowel for words > 2 chars
    if (cleanWord.length > 2) {
      const hasVowel = /[aeiouy]/i.test(cleanWord);
      if (!hasVowel) {
        return { isValid: false, error: 'Enter a valid campus name with recognizable words.' };
      }
    }

    // Rejection: 6 or more consecutive consonants
    if (/[bcdfghjklmnpqrstvwxz]{6,}/i.test(cleanWord)) {
      return { isValid: false, error: 'Enter a valid campus name without random character sequences.' };
    }

    // Rejection: Dominant single character making up > 60% of the word (length >= 5)
    if (cleanWord.length >= 5) {
      const charCounts: Record<string, number> = {};
      for (const char of lower) {
        charCounts[char] = (charCounts[char] || 0) + 1;
      }
      const maxCharCount = Math.max(...Object.values(charCounts));
      if (maxCharCount / cleanWord.length > 0.60) {
        return { isValid: false, error: 'Enter a valid campus name without repetitive characters.' };
      }
    }
  }

  return { isValid: true };
}

/**
 * Validates a Campus Code ensuring it contains 2 to 10 alphanumeric characters/hyphens/underscores
 * and restricts invalid characters or excessive length.
 */
export function validateCampusCode(code: string, required: boolean = true): { isValid: boolean; error?: string } {
  if (!code || typeof code !== 'string' || !code.trim()) {
    if (required) {
      return { isValid: false, error: 'Enter a valid campus code.' };
    }
    return { isValid: true };
  }

  const trimmed = code.trim();

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Campus code must be at least 2 characters.' };
  }

  if (trimmed.length > 10) {
    return { isValid: false, error: 'Campus code cannot exceed 10 characters.' };
  }

  if (!/^[a-zA-Z0-9\-\_]+$/.test(trimmed)) {
    return { isValid: false, error: 'Campus code can only contain letters, numbers, hyphens, and underscores.' };
  }

  return { isValid: true };
}

/**
 * Validates a custom role title to ensure it contains recognizable words, valid letters, spaces,
 * and limited allowed special characters, while rejecting random gibberish or keyboard mashing.
 */
export function validateRoleTitle(title: string, required: boolean = true): { isValid: boolean; error?: string } {
  if (!title || typeof title !== 'string' || !title.trim()) {
    if (required) {
      return { isValid: false, error: 'Enter a valid role title.' };
    }
    return { isValid: true };
  }

  const trimmed = title.trim();

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Role title must be at least 2 characters.' };
  }

  if (trimmed.length > 50) {
    return { isValid: false, error: 'Role title cannot exceed 50 characters.' };
  }

  if (!/^[a-zA-Z0-9\s\-\/\&\(\)\,\.]+$/.test(trimmed)) {
    return { isValid: false, error: 'Role title contains invalid special characters.' };
  }

  const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
  if (letterCount < 2) {
    return { isValid: false, error: 'Role title must contain valid alphabetic words.' };
  }

  if (/(.)\1{2,}/i.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid role title without repetitive characters.' };
  }

  if (/(..)\1{2,}/i.test(trimmed) || /(...)\1{2,}/i.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid role title without repeating patterns.' };
  }

  if (/(qwerty|wertyu|ertyui|rtyuio|tyuiop|asdfgh|sdfghj|dfghjk|fghjkl|zxcvbn|xcvbnm)/i.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid role title without keyboard-mash patterns.' };
  }

  const words = trimmed.split(/\s+/);
  for (const word of words) {
    const cleanWord = word.replace(/[^a-zA-Z]/g, '');
    if (!cleanWord) continue;
    const lower = cleanWord.toLowerCase();

    if (/[bcdfghjklmnpqrstvwxz]{5,}/i.test(cleanWord)) {
      return { isValid: false, error: 'Enter a valid role title (random character sequences not allowed).' };
    }

    if (cleanWord.length > 3 && !/[aeiouy]/i.test(cleanWord)) {
      return { isValid: false, error: 'Enter a valid role title with recognizable words.' };
    }

    if (cleanWord.length >= 5) {
      const charCounts: Record<string, number> = {};
      for (const char of lower) {
        charCounts[char] = (charCounts[char] || 0) + 1;
      }
      const maxCharCount = Math.max(...Object.values(charCounts));
      if (maxCharCount / cleanWord.length > 0.60) {
        return { isValid: false, error: 'Enter a valid role title without repetitive characters.' };
      }
    }
  }

  return { isValid: true };
}

/**
 * Automatically formats string into Title Case (capitalizing the first letter of each word),
 * while preserving acronyms and handling hyphens and slashes.
 */
export function formatTitleCase(str: string): string {
  if (!str) return '';
  return str.replace(/(?:^|[\s\-\/\.])([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Validates a Certificate Type Name, rejecting empty input, gibberish/keyboard-mashing,
 * repeating character sequences, and invalid special characters.
 */
export function validateCertificateTypeName(name: string, required: boolean = true): { isValid: boolean; error?: string } {
  if (!name || typeof name !== 'string' || !name.trim()) {
    if (required) {
      return { isValid: false, error: 'Certificate name is required.' };
    }
    return { isValid: true };
  }

  const trimmed = name.trim();

  if (trimmed.length < 3) {
    return { isValid: false, error: 'Certificate name must be at least 3 characters.' };
  }

  if (trimmed.length > 60) {
    return { isValid: false, error: 'Certificate name cannot exceed 60 characters.' };
  }

  if (!/^[a-zA-Z0-9\s\-\.\,\&\(\)\/\']+$/.test(trimmed)) {
    return { isValid: false, error: 'Certificate name contains invalid special characters.' };
  }

  if (!/[a-zA-Z]/.test(trimmed)) {
    return { isValid: false, error: 'Certificate name must contain letters.' };
  }

  // Reject 4 or more identical consecutive characters
  if (/(.)\1{3,}/i.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid certificate name without repetitive characters.' };
  }

  // Reject repeating patterns
  if (/(..)\1{3,}/i.test(trimmed) || /(...)\1{3,}/i.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid certificate name without repeating patterns.' };
  }

  // Reject keyboard row mashing
  if (/(qwerty|wertyu|ertyui|rtyuio|tyuiop|asdfgh|sdfghj|dfghjk|fghjkl|zxcvbn|xcvbnm)/i.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid certificate name without keyboard-mash patterns.' };
  }

  // Word inspections
  const words = trimmed.split(/\s+/);
  for (const word of words) {
    const cleanWord = word.replace(/[^a-zA-Z]/g, '');
    if (!cleanWord) continue;

    const lower = cleanWord.toLowerCase();

    // Single word > 25 chars without space is almost certainly gibberish
    if (cleanWord.length > 25) {
      return { isValid: false, error: 'Enter a valid certificate name with recognizable words.' };
    }

    if (cleanWord.length > 2) {
      const hasVowel = /[aeiouy]/i.test(cleanWord);
      if (!hasVowel) {
        return { isValid: false, error: 'Enter a valid certificate name with recognizable words.' };
      }
    }

    // 6 or more consecutive consonants
    if (/[bcdfghjklmnpqrstvwxz]{6,}/i.test(cleanWord)) {
      return { isValid: false, error: 'Enter a valid certificate name without random character sequences.' };
    }

    // Dominant single character > 60%
    if (cleanWord.length >= 5) {
      const charCounts: Record<string, number> = {};
      for (const char of lower) {
        charCounts[char] = (charCounts[char] || 0) + 1;
      }
      const maxCharCount = Math.max(...Object.values(charCounts));
      if (maxCharCount / cleanWord.length > 0.60) {
        return { isValid: false, error: 'Enter a valid certificate name without repetitive characters.' };
      }
    }
  }

  return { isValid: true };
}

/**
 * Validates a Certificate Short Code (2 to 10 characters, alphanumeric & hyphens).
 */
export function validateCertificateTypeCode(code: string, required: boolean = true): { isValid: boolean; error?: string } {
  if (!code || typeof code !== 'string' || !code.trim()) {
    if (required) {
      return { isValid: false, error: 'Short code is required.' };
    }
    return { isValid: true };
  }

  const trimmed = code.trim().toUpperCase();

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Short code must be at least 2 characters.' };
  }

  if (trimmed.length > 10) {
    return { isValid: false, error: 'Short code cannot exceed 10 characters.' };
  }

  if (!/^[A-Z0-9\-]+$/.test(trimmed)) {
    return { isValid: false, error: 'Short code can only contain uppercase letters, numbers, and hyphens.' };
  }

  return { isValid: true };
}

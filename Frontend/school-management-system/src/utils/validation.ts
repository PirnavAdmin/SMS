export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const;
export const CASTE_CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS', 'Others'] as const;
export const BRANCHES: readonly string[] = [];
export const RELIGIONS = ['Hinduism', 'Islam', 'Christianity', 'Sikhism', 'Buddhism', 'Jainism', 'Zoroastrianism', 'Judaism', 'Other'] as const;
export const MARITAL_STATUSES = ['Married', 'Unmarried'] as const;

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

  // Reject random gibberish / keyboard mashing in localPart (e.g. "vadgvgjhasgdvhshj")
  if (
    /([a-zA-Z])\1{3,}/i.test(localPart) ||
    /([a-zA-Z]{2,3})\1{2,}/i.test(localPart) ||
    /[bcdfghjklmnpqrstvwxz]{6,}/i.test(localPart) ||
    /(qwerty|wertyu|ertyui|rtyuio|tyuiop|asdfgh|sdfghj|dfghjk|fghjkl|zxcvbn|xcvbnm)/i.test(localPart)
  ) {
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

const KEYBOARD_MASH_REGEX =
  /(qwerty|wertyu|ertyui|rtyuio|tyuiop|asdfgh|sdfghj|dfghjk|fghjkl|zxcvbn|xcvbnm|poiuyt|lkjhgf|mnbvcx|asdf|fdsa|zxcv|vcxz)/i;

const VALID_SHORT_TOKENS = new Set([
  // Personal titles & honorifics
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'fr', 'pr',
  // Teacher designations & school roles
  'pgt', 'tgt', 'prt', 'hod', 'pet', 'ntt', 'hr', 'it', 'ai', 'gk', 'evs',
  // Roman numerals
  'ii', 'iii', 'iv', 'vi', 'vii', 'viii', 'ix', 'xi', 'xii',
  // Academic degrees & qualifications
  'bsc', 'msc', 'bed', 'med', 'phd', 'ba', 'ma', 'bcom', 'mcom', 'bba', 'mba', 'bca', 'mca',
  'btech', 'mtech', 'be', 'me', 'llb', 'llm', 'mbbs', 'bds', 'md', 'ms', 'ca', 'cs', 'cma',
  // Educational boards, councils & institutions
  'cbse', 'icse', 'cisce', 'ib', 'igcse', 'nios', 'state',
  'ugc', 'aicte', 'naac', 'ncte', 'ncert', 'scert', 'kvs', 'nvs', 'dps', 'dav',
  'iit', 'nit', 'iiit', 'iim', 'aiims', 'nift', 'nid', 'bits', 'vit', 'srm', 'mit',
  'du', 'jnu', 'bhu', 'amu', 'ignou', 'vtu', 'jntu',
  // Corporates, universities, enterprises & organizations
  'klm', 'tcs', 'pwc', 'hcl', 'ibm', 'wipro', 'cts', 'infy', 'accenture', 'capgemini',
  'hdfc', 'icici', 'hsbc', 'kpmg', 'ey', 'deloitte', 'cbre', 'jll',
  'sbi', 'rbi', 'pnb', 'bob', 'canara', 'lic', 'gic', 'uti',
  'bsnl', 'mtnl', 'ntpc', 'bhel', 'bel', 'hal', 'ongc', 'iocl', 'bpcl', 'hpcl', 'gail', 'sail',
  'isro', 'drdo', 'barc', 'csir', 'icmr', 'icar',
  'ndtv', 'bbc', 'cnn', 'cctv', 'bmw', 'kfc', 'mrf', 'tvs', 'dhl', 'ups', 'fedex', 'dlf',
  'ksrtc', 'tsrtc', 'apsrtc', 'msrtc', 'upsrtc', 'dtc', 'bmtc', 'best',
  // Tech & common short tokens
  'html', 'css', 'sql', 'xml', 'php', 'sdk', 'api', 'url', 'pdf', 'aws', 'gcp',
  'lkg', 'ukg', 'std', 'ssc', 'hsc', 'dept', 'org', 'corp', 'ltd', 'pvt', 'inc', 'llc', 'llp',
  'univ', 'inst', 'acad', 'col', 'sch', 'govt', 'gov', 'co'
]);

/**
 * Checks whether an individual alphabetic segment looks like random gibberish or keyboard mashing.
 */
export function isGibberishSegment(seg: string): boolean {
  if (!seg) return false;
  const clean = seg.replace(/[^a-zA-Z]/g, '');
  if (!clean || clean.length <= 1) return false;

  const lower = clean.toLowerCase();
  if (VALID_SHORT_TOKENS.has(lower)) return false;

  // 1. Single alphabetic word too long (> 20 chars)
  if (clean.length > 20) return true;

  // 2. 3 or more consecutive identical letters (e.g., "aaa", "fff", "ddd")
  if (/([a-zA-Z])\1{2,}/i.test(clean)) return true;

  // 3. Repeating 2-4 character sequences (e.g., "dfdfdf", "gdfsgdfs", "asdasdasd")
  if (/([a-zA-Z]{2,4})\1{2,}/i.test(clean)) return true;

  // 4. Same 2-consonant cluster repeated 3+ times (e.g., "cjsdicjsdifcjfsicsjdcsdsdo", "dfdfdfdfgdfsgdfgdf")
  if (/([bcdfghjklmnpqrstvwxz]{2})[a-z]*\1[a-z]*\1/i.test(clean)) return true;

  // 5. Common keyboard row mashing
  if (KEYBOARD_MASH_REGEX.test(clean)) return true;

  // 6. 5 or more consecutive consonants, or two clusters of 4+ consonants
  if (/[bcdfghjklmnpqrstvwxz]{5,}/i.test(clean)) return true;
  if (/[bcdfghjklmnpqrstvwxz]{4,}[a-z]*[bcdfghjklmnpqrstvwxz]{4,}/i.test(clean)) return true;

  // 7. Words without vowels:
  // - 1-3 character tokens (e.g., "klm", "tcs", "pwc", "sbi", "rbi", "dr", "st") are allowed as valid abbreviations/acronyms regardless of letter case.
  // - 4-character words without vowels (e.g., "hdfc", "kpmg", "hsbc", "bsnl") are allowed if all characters are distinct and not keyboard row runs.
  // - Words > 4 chars without any vowel (a, e, i, o, u, y) are treated as gibberish (unless recognized in VALID_SHORT_TOKENS above).
  if (!/[aeiouy]/i.test(clean)) {
    if (clean.length > 4) {
      return true;
    }
    if (clean.length === 4) {
      const is4LetterKeyboardMash =
        /(asdf|sdfg|dfgh|fghj|ghjk|hjkl|zxcv|xcvb|cvbn|vbnm|fdsa|gfds|hgfd|jhgf|kjhg|lkjh|vcxz|bvcx|nbvc|mnbv)/i.test(
          clean
        );
      const uniqueChars = new Set(lower).size;
      if (is4LetterKeyboardMash || uniqueChars < 4) {
        return true;
      }
    }
  }

  // 8. Low vowel ratio in longer alphabetic segments
  if (clean.length >= 6) {
    const vowelCount = (clean.match(/[aeiouy]/gi) || []).length;
    if (vowelCount / clean.length < 0.22) return true;
  }

  // 9. Words composed of only 1 or 2 distinct letters or heavily dominated by 1 letter (catches "dfdfdfdf", "abababab")
  if (clean.length >= 6) {
    const charCounts: Record<string, number> = {};
    for (const ch of lower) {
      charCounts[ch] = (charCounts[ch] || 0) + 1;
    }
    const sorted = Object.values(charCounts).sort((a, b) => b - a);
    if (sorted.length <= 2) return true;
    if (clean.length >= 8 && sorted[0] / clean.length > 0.65) return true;
  }

  return false;
}

export interface TextValidationOptions {
  label?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  allowNumbers?: boolean;
  allowedRegex?: RegExp;
}

/**
 * Single unified validator for all names, titles, designations, departments, subjects, campuses, roles, and certificates.
 */
export function validateTextName(
  value: string,
  options: TextValidationOptions = {}
): { isValid: boolean; error?: string } {
  const {
    label = 'name',
    required = true,
    minLength = 1,
    maxLength = 70,
    allowNumbers = true,
    allowedRegex,
  } = options;

  const cleanLabel = label.trim().toLowerCase() || 'name';
  const capLabel = cleanLabel.charAt(0).toUpperCase() + cleanLabel.slice(1);
  const invalidMsg = `Enter a valid ${cleanLabel}.`;

  if (!value || typeof value !== 'string' || !value.trim()) {
    if (required) {
      return { isValid: false, error: `${capLabel} is required.` };
    }
    return { isValid: true };
  }

  const trimmed = value.trim();

  if (trimmed.length < minLength) {
    return { isValid: false, error: invalidMsg };
  }

  if (trimmed.length > maxLength) {
    return { isValid: false, error: `Maximum ${maxLength} characters allowed.` };
  }

  const pattern =
    allowedRegex ||
    (allowNumbers
      ? /^[a-zA-Z0-9\s\-\–\—\.\,\&\(\)\/\'\_]+$/
      : /^[a-zA-Z\s\-\–\—\.\&\(\)\/\']+$/);

  if (!pattern.test(trimmed)) {
    if (!allowNumbers) {
      const hasDigits = /\d/.test(trimmed);
      const hasSpecial = /[^a-zA-Z0-9\s\-\–\—\.\&\(\)\/\']/.test(trimmed);
      if (hasDigits && hasSpecial) {
        return { isValid: false, error: 'Numbers and special characters are not allowed.' };
      }
      if (hasDigits) {
        return { isValid: false, error: 'Numeric values are not allowed.' };
      }
      return { isValid: false, error: 'Special characters are not allowed.' };
    }
    return { isValid: false, error: 'Special characters are not allowed.' };
  }

  if (!/[a-zA-Z]/.test(trimmed)) {
    return { isValid: false, error: invalidMsg };
  }

  // Reject consecutive identical letters or repeating patterns across the whole string
  if (/([a-zA-Z])\1{2,}/i.test(trimmed) || /([a-zA-Z]{2,4})\1{2,}/i.test(trimmed) || KEYBOARD_MASH_REGEX.test(trimmed)) {
    return { isValid: false, error: invalidMsg };
  }

  // Reject consecutive punctuation
  if (/[\-\/\.\_\&\']{2,}/.test(trimmed)) {
    return { isValid: false, error: invalidMsg };
  }

  const words = trimmed.split(/[\s\-\/\.\,\&\(\)\_\']+/).filter(Boolean);
  for (const word of words) {
    if (isGibberishSegment(word)) {
      return { isValid: false, error: invalidMsg };
    }
  }

  return { isValid: true };
}

export function validateFullName(name: string, required: boolean = true): { isValid: boolean; error?: string } {
  return validateTextName(name, { label: 'name', required, allowNumbers: false, maxLength: 70 });
}

export function validateCampusName(name: string, required: boolean = true): { isValid: boolean; error?: string } {
  return validateTextName(name, { label: 'campus name', required, maxLength: 50 });
}

export function validateRoleTitle(title: string, required: boolean = true): { isValid: boolean; error?: string } {
  return validateTextName(title, { label: 'role title', required, allowNumbers: false, maxLength: 50 });
}

export function validateCertificateTypeName(name: string, required: boolean = true): { isValid: boolean; error?: string } {
  return validateTextName(name, { label: 'certificate name', required, minLength: 3, maxLength: 60 });
}

export function validateDesignationName(name: string, required: boolean = true): { isValid: boolean; error?: string } {
  return validateTextName(name, { label: 'designation name', required, allowNumbers: false, maxLength: 50 });
}

export function validateDepartmentName(name: string, required: boolean = true): { isValid: boolean; error?: string } {
  return validateTextName(name, { label: 'department name', required, allowNumbers: false, maxLength: 60 });
}

export function validateSubjectName(name: string, required: boolean = true): { isValid: boolean; error?: string } {
  return validateTextName(name, { label: 'subject name', required, maxLength: 60 });
}

export function validateOrganizationName(name: string, required: boolean = true): { isValid: boolean; error?: string } {
  return validateTextName(name, { label: 'organization name', required, maxLength: 100, allowNumbers: true });
}

export function validateCampusCode(code: string, required: boolean = true): { isValid: boolean; error?: string } {
  if (!code || typeof code !== 'string' || !code.trim()) {
    return required ? { isValid: false, error: 'Campus code is required.' } : { isValid: true };
  }
  const trimmed = code.trim();
  if (trimmed.length < 2 || trimmed.length > 10) {
    return { isValid: false, error: 'Code must be 2–10 characters.' };
  }
  if (!/^[a-zA-Z0-9\-\_]+$/.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid campus code.' };
  }
  return { isValid: true };
}

export function validateCampusAddress(address: string, required: boolean = true): { isValid: boolean; error?: string } {
  if (!address || typeof address !== 'string' || !address.trim()) {
    return required ? { isValid: false, error: 'Address is required.' } : { isValid: true };
  }
  const trimmed = address.trim();
  if (trimmed.length < 5 || trimmed.length > 150) {
    return { isValid: false, error: trimmed.length > 150 ? 'Maximum 150 characters allowed.' : 'Enter a valid address.' };
  }
  if (!/^[a-zA-Z0-9\s\,\.\-\/\#\&\(\)\'\:]+$/.test(trimmed) || (trimmed.match(/[a-zA-Z]/g) || []).length < 3) {
    return { isValid: false, error: 'Enter a valid address.' };
  }
  if (/([a-zA-Z])\1{2,}/i.test(trimmed) || /([a-zA-Z]{2,3})\1{2,}/i.test(trimmed) || KEYBOARD_MASH_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid address.' };
  }
  const words = trimmed.split(/[\s\,\.\-\/\#\&\(\)\'\:]+/).filter(Boolean);
  for (const word of words) {
    if (isGibberishSegment(word)) {
      return { isValid: false, error: 'Enter a valid address.' };
    }
  }
  return { isValid: true };
}

export function formatTitleCase(str: string): string {
  if (!str) return '';
  return str
    .split(/(\s+|[\-\/\.])/)
    .map((part) => {
      if (/^[a-zA-Z]+$/.test(part)) {
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      }
      return part;
    })
    .join('');
}

export function validateCertificateTypeCode(code: string, required: boolean = true): { isValid: boolean; error?: string } {
  if (!code || typeof code !== 'string' || !code.trim()) {
    return required ? { isValid: false, error: 'Short code is required.' } : { isValid: true };
  }
  const trimmed = code.trim().toUpperCase();
  if (trimmed.length < 2 || trimmed.length > 10) {
    return { isValid: false, error: 'Code must be 2–10 characters.' };
  }
  if (!/^[A-Z0-9\-]+$/.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid short code.' };
  }
  return { isValid: true };
}

export function validateSearchQuery(query: string): { isValid: boolean; error?: string } {
  if (!query || typeof query !== 'string') return { isValid: true };
  if (query.length > 0 && !query.trim()) {
    return { isValid: false, error: 'Enter a valid search term.' };
  }
  const trimmed = query.trim();
  if (!trimmed) return { isValid: true };
  if (trimmed.length > 50) return { isValid: false, error: 'Maximum 50 characters allowed.' };
  if (!/^[a-zA-Z0-9\s\-\/\.\_\&\']+$/.test(trimmed)) {
    return { isValid: false, error: 'Invalid characters not allowed.' };
  }
  if (!/[a-zA-Z0-9]/.test(trimmed) || /[\-\/\.\_\&\']{2,}/.test(trimmed) || /(\d)\1{4,}/.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid search term.' };
  }
  if (/([a-zA-Z])\1{2,}/i.test(trimmed) || /([a-zA-Z]{2,4})\1{2,}/i.test(trimmed) || KEYBOARD_MASH_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid search term.' };
  }
  const tokens = trimmed.split(/[\s\-\/\.\_\&\']+/).filter(Boolean);
  for (const token of tokens) {
    const alphaSegments = token.match(/[a-zA-Z]+/g) || [];
    for (const seg of alphaSegments) {
      if (isGibberishSegment(seg)) {
        return { isValid: false, error: 'Enter a valid search term.' };
      }
    }
  }
  return { isValid: true };
}

const SKIP_INPUT_TYPES = new Set([
  'password', 'number', 'date', 'time', 'datetime-local', 'month', 'week',
  'color', 'file', 'hidden', 'checkbox', 'radio', 'range', 'tel', 'email', 'url'
]);

function inferInputFieldLabel(input: HTMLInputElement | HTMLTextAreaElement): string {
  // 1. Look for a preceding or wrapping <label>
  const parentDiv = input.closest('div');
  const labelEl =
    parentDiv?.querySelector('label') ||
    parentDiv?.parentElement?.querySelector('label');

  if (labelEl && labelEl.textContent) {
    const raw = labelEl.textContent
      .replace(/\*/g, '')
      .replace(/\(.*?\)/g, '')
      .trim()
      .toLowerCase();
    if (raw && raw.length <= 35) {
      return raw;
    }
  }

  // 2. Fallback to placeholder
  const ph = (input.getAttribute('placeholder') || '').toLowerCase();
  if (ph.includes('designation')) return 'designation name';
  if (ph.includes('department')) return 'department name';
  if (ph.includes('subject')) return 'subject name';
  if (ph.includes('campus') || ph.includes('branch')) return 'campus name';
  if (ph.includes('role')) return 'role title';
  if (ph.includes('organization') || ph.includes('organisation')) return 'organization name';
  if (ph.includes('institution') || ph.includes('institute') || ph.includes('university') || ph.includes('college') || ph.includes('school')) return 'institution name';
  if (ph.includes('company') || ph.includes('employer')) return 'company name';
  if (ph.includes('search')) return 'search term';
  if (ph.includes('address')) return 'address';
  if (ph.includes('name')) return 'name';

  return 'value';
}

function shouldSkipGlobalValidation(input: HTMLInputElement | HTMLTextAreaElement): boolean {
  if (input.disabled || input.readOnly) return true;
  if (input instanceof HTMLInputElement && SKIP_INPUT_TYPES.has((input.type || 'text').toLowerCase())) {
    return true;
  }
  const meta = `${input.name || ''} ${input.id || ''} ${input.placeholder || ''} ${input.autocomplete || ''}`.toLowerCase();
  if (
    meta.includes('password') ||
    meta.includes('pass') ||
    meta.includes('email') ||
    meta.includes('phone') ||
    meta.includes('mobile') ||
    meta.includes('identifier') ||
    meta.includes('login') ||
    meta.includes('username') ||
    meta.includes('otp') ||
    meta.includes('pin') ||
    meta.includes('http') ||
    meta.includes('url') ||
    meta.includes('.pdf') ||
    meta.includes('.jpg')
  ) {
    return true;
  }
  const label = inferInputFieldLabel(input);
  if (
    label.includes('email') ||
    label.includes('phone') ||
    label.includes('mobile') ||
    label.includes('password') ||
    label.includes('username') ||
    label.includes('login') ||
    label.includes('identifier') ||
    label.includes('otp') ||
    label.includes('pin')
  ) {
    return true;
  }
  return false;
}

function setGlobalInputError(input: HTMLInputElement | HTMLTextAreaElement, error?: string) {
  const container = input.parentElement;
  if (!container) return;

  const isIconWrapper = container.classList.contains('relative') || 
                        (container.tagName.toLowerCase() === 'div' && Boolean(container.querySelector('svg.absolute, .pointer-events-none')));
  const targetParent = (isIconWrapper && container.parentElement && container.parentElement !== document.body)
    ? container.parentElement
    : container;

  const label = inferInputFieldLabel(input);
  const isSearch =
    (input instanceof HTMLInputElement && input.type === 'search') ||
    label.includes('search') ||
    (input.placeholder || '').toLowerCase().includes('search');

  // Check if inside a horizontal layout (flex row, inline-flex, or flex items-center)
  const isInsideHorizontalLayout = (() => {
    let curr: HTMLElement | null = container;
    let depth = 0;
    while (curr && curr !== document.body && depth < 5) {
      try {
        const cs = window.getComputedStyle(curr);
        const isFlex = (cs.display === 'flex' || cs.display === 'inline-flex') && !cs.flexDirection.startsWith('column');
        if (isFlex) {
          return true;
        }
      } catch {
        // ignore
      }
      curr = curr.parentElement;
      depth++;
    }
    return false;
  })();

  const shouldAbsolute = isIconWrapper || isSearch || isInsideHorizontalLayout;

  const directSibling = (isIconWrapper ? container.nextElementSibling : input.nextElementSibling) as HTMLElement | null;
  let errEl = (container.querySelector(':scope > [data-global-validation-error="true"]') ||
               (directSibling && directSibling.getAttribute('data-global-validation-error') === 'true' ? directSibling : null) ||
               container.parentElement?.querySelector(':scope > [data-global-validation-error="true"]')) as HTMLElement | null;

  if (!error) {
    input.removeAttribute('data-global-invalid');
    input.style.borderColor = '';
    if (errEl) {
      errEl.remove();
    }
    return;
  }

  input.setAttribute('data-global-invalid', error);
  input.style.borderColor = '#f43f5e';

  // Avoid duplicate error message only if component already rendered its own error paragraph outside <label>
  const existingComponentError = Array.from(targetParent.querySelectorAll('p, span')).find(el => {
    if (el === errEl || el.closest('label')) return false;
    const txt = (el.textContent || '').trim();
    return txt.length > 1 && el.className.includes('text-rose-');
  });
  if (existingComponentError) {
    if (errEl) errEl.remove();
    return;
  }

  if (!errEl) {
    errEl = document.createElement('p');
    errEl.setAttribute('data-global-validation-error', 'true');
  }

  if (shouldAbsolute) {
    const anchor = container;
    try {
      if (window.getComputedStyle(anchor).position === 'static') {
        anchor.style.position = 'relative';
      }
    } catch {
      anchor.style.position = 'relative';
    }

    errEl.style.position = 'absolute';
    if (isIconWrapper || anchor.children.length <= 2) {
      errEl.style.left = '0';
      errEl.style.top = '100%';
    } else {
      errEl.style.left = `${input.offsetLeft}px`;
      errEl.style.top = `${input.offsetTop + input.offsetHeight}px`;
    }
    errEl.style.marginTop = '2px';
    errEl.style.fontSize = '11px';
    errEl.style.fontWeight = '700';
    errEl.style.color = '#f43f5e';
    errEl.style.lineHeight = '1.2';
    errEl.style.zIndex = '30';
    errEl.style.pointerEvents = 'none';
    errEl.style.whiteSpace = 'nowrap';

    if (errEl.parentElement !== anchor) {
      anchor.appendChild(errEl);
    }
  } else {
    errEl.style.position = '';
    errEl.style.left = '';
    errEl.style.top = '';
    errEl.style.zIndex = '';
    errEl.style.pointerEvents = '';
    errEl.style.whiteSpace = '';
    errEl.style.color = '#f43f5e';
    errEl.style.fontSize = '11px';
    errEl.style.fontWeight = '700';
    errEl.style.marginTop = '4px';
    errEl.style.lineHeight = '1.2';

    if (errEl.previousElementSibling !== input) {
      input.insertAdjacentElement('afterend', errEl);
    }
  }
  errEl.textContent = error;
}

export function validateInputElement(
  input: HTMLInputElement | HTMLTextAreaElement,
  enforceRequired = false
): { isValid: boolean; error?: string } {
  if (shouldSkipGlobalValidation(input)) {
    return { isValid: true };
  }

  const val = input.value || '';
  const label = inferInputFieldLabel(input);
  const isSearch =
    (input instanceof HTMLInputElement && input.type === 'search') ||
    label.includes('search') ||
    (input.placeholder || '').toLowerCase().includes('search');

  if (isSearch) {
    return validateSearchQuery(val);
  }

  if (!val.trim()) {
    if (enforceRequired && input.required) {
      const cap = label.charAt(0).toUpperCase() + label.slice(1);
      return { isValid: false, error: `${cap} is required.` };
    }
    return { isValid: true };
  }

  if (label.includes('address') && !label.includes('email') && !label.includes('ip') && !label.includes('web')) {
    return validateCampusAddress(val, enforceRequired && input.required);
  }

  if (label.includes('code')) {
    return validateCampusCode(val, enforceRequired && input.required);
  }

  if (
    label.includes('session') ||
    label.includes('academic year') ||
    label.includes('batch') ||
    label.includes('class') ||
    label.includes('section') ||
    label.includes('grade') ||
    label.includes('prefix') ||
    label.includes('room') ||
    label.includes('vehicle') ||
    label.includes('registration')
  ) {
    const trimmedSession = val.trim();
    if (!/^[a-zA-Z0-9\s\-\–\—\/\.\(\)\_]+$/.test(trimmedSession)) {
      return { isValid: false, error: 'Special characters are not allowed.' };
    }
    if (/[\-\–\—\/]{2,}/.test(trimmedSession)) {
      return { isValid: false, error: `Enter a valid ${label}.` };
    }
    const alphaWords = trimmedSession.match(/[a-zA-Z]+/g) || [];
    for (const w of alphaWords) {
      if (isGibberishSegment(w)) {
        return { isValid: false, error: `Enter a valid ${label}.` };
      }
    }
    return { isValid: true };
  }

  const isStrictNameField =
    label.includes('name') ||
    label.includes('title') ||
    label.includes('designation') ||
    label.includes('department') ||
    label.includes('subject') ||
    label.includes('campus') ||
    label.includes('branch') ||
    label.includes('role') ||
    label.includes('category') ||
    label.includes('certificate') ||
    label.includes('organization') ||
    label.includes('organisation') ||
    label.includes('institution') ||
    label.includes('institute') ||
    label.includes('school') ||
    label.includes('college') ||
    label.includes('university') ||
    label.includes('company') ||
    label.includes('employer');

  if (isStrictNameField) {
    const isPersonalName =
      label === 'name' ||
      label === 'full name' ||
      label.includes('first name') ||
      label.includes('last name') ||
      label.includes('middle name') ||
      label.includes('student name') ||
      label.includes('father name') ||
      label.includes('mother name') ||
      label.includes('guardian name') ||
      label.includes('staff name') ||
      label.includes('teacher name') ||
      label.includes('driver name') ||
      label.includes('holder name') ||
      label.includes('contact person');

    const disallowNumbers =
      label.includes('designation') ||
      label.includes('department') ||
      label.includes('role') ||
      isPersonalName;

    const isOrgField =
      label.includes('organization') ||
      label.includes('organisation') ||
      label.includes('institution') ||
      label.includes('institute') ||
      label.includes('school') ||
      label.includes('college') ||
      label.includes('university') ||
      label.includes('company') ||
      label.includes('employer');

    return validateTextName(val, {
      label,
      required: enforceRequired && input.required,
      allowNumbers: !disallowNumbers,
      minLength: 1,
      maxLength: isOrgField ? 100 : 70,
    });
  }

  // Generic text input: reject gibberish / keyboard mashing / repeating character sequences
  const trimmed = val.trim();
  if (
    /([a-zA-Z])\1{2,}/i.test(trimmed) ||
    /([a-zA-Z]{2,4})\1{2,}/i.test(trimmed) ||
    KEYBOARD_MASH_REGEX.test(trimmed)
  ) {
    return { isValid: false, error: `Enter a valid ${label}.` };
  }

  const words = trimmed.split(/[\s\-\–\—\/\.\,\&\(\)\_\']+/).filter(Boolean);
  for (const word of words) {
    if (/^[a-zA-Z]+$/.test(word) && isGibberishSegment(word)) {
      return { isValid: false, error: `Enter a valid ${label}.` };
    }
  }

  return { isValid: true };
}

/**
 * Installs a single global capture-phase listener on window that validates all text/name inputs
 * in real time and blocks form submission or modal Save/Create actions when invalid input is present.
 */
export function installGlobalInputValidation(): () => void {
  if (typeof window === 'undefined') return () => {};

  if (typeof (window as any).__globalValidationCleanup === 'function') {
    (window as any).__globalValidationCleanup();
  }

  if (typeof document !== 'undefined') {
    document.querySelectorAll('[data-global-validation-error="true"]').forEach(el => el.remove());
    document.querySelectorAll('[data-global-invalid]').forEach(el => {
      (el as HTMLElement).removeAttribute('data-global-invalid');
      (el as HTMLElement).style.borderColor = '';
    });
  }

  const applyValidation = (target: HTMLInputElement | HTMLTextAreaElement, enforceReq = false) => {
    const res = validateInputElement(target, enforceReq);
    setGlobalInputError(target, res.isValid ? undefined : res.error);
    return res;
  };

  const handleInput = (e: Event) => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
    applyValidation(target, false);
    requestAnimationFrame(() => {
      if (document.body.contains(target)) {
        applyValidation(target, false);
      }
    });
  };

  const handleBlur = (e: Event) => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
    if (target.value) {
      applyValidation(target, false);
    }
  };

  const validateContainerInputs = (container: ParentNode): HTMLInputElement | HTMLTextAreaElement | null => {
    const inputs = Array.from(
      container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')
    );
    let firstInvalid: HTMLInputElement | HTMLTextAreaElement | null = null;
    for (const inp of inputs) {
      if (inp.offsetParent === null) continue; // skip hidden elements
      const res = applyValidation(inp, true);
      if (!res.isValid && !firstInvalid) {
        firstInvalid = inp;
      }
    }
    return firstInvalid;
  };

  const handleSubmit = (e: Event) => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    const firstInvalid = validateContainerInputs(form);
    if (firstInvalid) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      firstInvalid.focus();
    }
  };

  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const btn = target.closest('button');
    if (!btn || btn.disabled) return;

    // Never intercept or block Close, Cancel, Discard, or Dismiss buttons
    const btnText = (btn.textContent || '').trim().toLowerCase();
    const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
    const title = (btn.getAttribute('title') || '').toLowerCase();

    if (
      btnText === 'cancel' ||
      btnText === 'close' ||
      btnText === 'discard' ||
      btnText.includes('cancel') ||
      ariaLabel.includes('close') ||
      ariaLabel.includes('cancel') ||
      title.includes('close') ||
      title.includes('cancel') ||
      btn.dataset.dismiss ||
      btn.querySelector('svg.lucide-x') ||
      btn.querySelector('svg.lucide-x-circle')
    ) {
      return;
    }

    const form = btn.closest('form');
    const isExplicitActionText = /^(create|save|update|submit|add|register|confirm|apply)\b/i.test(btnText);
    const isFormSubmit = form && btn.type === 'submit' && !/^(cancel|close|back|reset)\b/i.test(btnText);

    if (!isExplicitActionText && !isFormSubmit) {
      return;
    }

    const container = form || btn.closest('[role="dialog"]') || btn.closest('.fixed.inset-0');
    if (!container) return;

    const firstInvalid = validateContainerInputs(container);
    if (firstInvalid) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      firstInvalid.focus();
    }
  };

  window.addEventListener('input', handleInput, true);
  window.addEventListener('focusout', handleBlur, true);
  window.addEventListener('submit', handleSubmit, true);
  window.addEventListener('click', handleClick, true);

  const cleanup = () => {
    window.removeEventListener('input', handleInput, true);
    window.removeEventListener('focusout', handleBlur, true);
    window.removeEventListener('submit', handleSubmit, true);
    window.removeEventListener('click', handleClick, true);
  };

  (window as any).__globalValidationCleanup = cleanup;
  return cleanup;
}

if (typeof window !== 'undefined') {
  installGlobalInputValidation();
}

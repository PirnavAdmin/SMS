import { parseDateOnly, compareDates, formatDateForDisplay } from './dateValidation';
import { VALID_INDIAN_STATES, COUNTRY_DIAL_CODES } from './postalLookup';

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const;
export const CASTE_CATEGORIES = ['General', 'OBC', 'BC', 'SC', 'ST', 'EWS', 'Others'] as const;
export const BRANCHES: readonly string[] = [];
export const RELIGIONS = ['Hinduism', 'Islam', 'Christianity', 'Sikhism', 'Buddhism', 'Jainism', 'Zoroastrianism', 'Judaism', 'Other'] as const;
export const MARITAL_STATUSES = ['Married', 'Unmarried'] as const;

function checkMobileNumberRules(cleaned: string): { isValid: boolean; error?: string } {
  if (!cleaned) {
    return { isValid: false, error: 'Enter a valid 10-digit mobile number.' };
  }
  if (!/^[6-9]/.test(cleaned)) {
    return { isValid: false, error: 'Mobile number must start with 6, 7, 8, or 9.' };
  }
  if (cleaned.length > 10) {
    return { isValid: false, error: 'Mobile number cannot exceed 10 digits.' };
  }
  if (cleaned.length < 10) {
    return { isValid: false, error: 'Phone number must be exactly 10 digits.' };
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
 * Dynamically formats any phone number string into a consistent predefined format:
 * +<CountryCode>-<SubscriberNumber> (e.g. +91-9823200009).
 * Dynamically identifies country dial codes (supporting international prefixes)
 * without hardcoding individual phone records.
 */
export function formatPhoneNumber(
  phone: string | number | null | undefined,
  defaultCountryCode: string = '+91'
): string {
  if (phone === null || phone === undefined) return 'N/A';

  const raw = String(phone).trim();
  if (
    !raw ||
    raw.toLowerCase() === 'n/a' ||
    raw === '-' ||
    raw.toLowerCase() === 'null' ||
    raw.toLowerCase() === 'undefined'
  ) {
    return 'N/A';
  }

  // Remove whitespace
  const trimmed = raw.replace(/\s+/g, '');

  // Sorted dial codes from longest to shortest to prevent prefix collision (+971 vs +9)
  const sortedCodes = (COUNTRY_DIAL_CODES || [{ code: '+91' }])
    .map(c => c.code)
    .sort((a, b) => b.length - a.length);

  // 1. If starts with '+', extract country code and subscriber digits
  if (trimmed.startsWith('+')) {
    for (const dialCode of sortedCodes) {
      if (trimmed.startsWith(dialCode)) {
        let remainder = trimmed.slice(dialCode.length);
        if (remainder.startsWith('-')) remainder = remainder.slice(1);
        const localDigits = remainder.replace(/\D/g, '');
        if (localDigits.length > 0) {
          return `${dialCode}-${localDigits}`;
        }
      }
    }
    const plusMatch = trimmed.match(/^\+(\d{1,4})[\-\s]?(.*)$/);
    if (plusMatch) {
      const code = `+${plusMatch[1]}`;
      const localDigits = plusMatch[2].replace(/\D/g, '');
      if (localDigits.length > 0) {
        return `${code}-${localDigits}`;
      }
    }
  }

  // Extract all numeric digits
  const allDigits = trimmed.replace(/\D/g, '');
  if (!allDigits) return 'N/A';

  // 2. International prefix starting with '00' (e.g. 00919823200009)
  if (allDigits.startsWith('00')) {
    const without00 = allDigits.slice(2);
    for (const dialCode of sortedCodes) {
      const codeDigits = dialCode.replace(/\D/g, '');
      if (without00.startsWith(codeDigits)) {
        const local = without00.slice(codeDigits.length);
        if (local.length > 0) {
          return `${dialCode}-${local}`;
        }
      }
    }
  }

  // 3. Indian number with '91' prefix and 12 digits (e.g. 919823200009)
  if (allDigits.startsWith('91') && allDigits.length === 12) {
    return `+91-${allDigits.slice(2)}`;
  }

  // 4. Standard 10-digit mobile number (e.g. 9823200009)
  if (allDigits.length === 10) {
    return `${defaultCountryCode}-${allDigits}`;
  }

  // 5. 11-digit mobile starting with '0' (e.g. 09823200009)
  if (allDigits.length === 11 && allDigits.startsWith('0')) {
    return `${defaultCountryCode}-${allDigits.slice(1)}`;
  }

  // 6. Check if starts with any known country dial code without '+'
  for (const dialCode of sortedCodes) {
    const codeDigits = dialCode.replace(/\D/g, '');
    if (codeDigits.length >= 2 && allDigits.startsWith(codeDigits)) {
      const local = allDigits.slice(codeDigits.length);
      if (local.length >= 6 && local.length <= 11) {
        return `${dialCode}-${local}`;
      }
    }
  }

  // 7. Generic fallback for numbers of 7-11 digits
  return `${defaultCountryCode}-${allDigits}`;
}


/**
 * Validates an Indian GST Registration Number (GSTIN).
 * Expected format: 15 alphanumeric characters (e.g. 22AAAAA0000A1Z5)
 */
export function validateGSTNumber(gst: string, required: boolean = false): { isValid: boolean; error?: string } {
  if (!gst || typeof gst !== 'string' || !gst.trim()) {
    if (required) {
      return { isValid: false, error: 'GST registration number is required.' };
    }
    return { isValid: true };
  }

  const cleaned = gst.trim().toUpperCase();

  if (cleaned.length !== 15) {
    return {
      isValid: false,
      error: `GST number must be exactly 15 characters (currently ${cleaned.length}).`,
    };
  }

  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstRegex.test(cleaned)) {
    return {
      isValid: false,
      error: 'Invalid GST format. Expected 15-char GSTIN (e.g. 22AAAAA0000A1Z5).',
    };
  }

  return { isValid: true };
}


const INVALID_DUMMY_DOMAINS = new Set([
  // Dummy / test / example / placeholder domains
  'gg.com', 'aa.com', 'bb.com', 'cc.com', 'dd.com', 'ee.com', 'ff.com', 'hh.com',
  'ii.com', 'jj.com', 'kk.com', 'll.com', 'mm.com', 'nn.com', 'oo.com', 'pp.com',
  'qq.com', 'rr.com', 'ss.com', 'tt.com', 'uu.com', 'vv.com', 'ww.com', 'xx.com',
  'yy.com', 'zz.com',
  'test.com', 'test.in', 'test.org', 'test.net', 'test.co', 'testing.com',
  'example.com', 'example.org', 'example.net', 'example.edu', 'example.in',
  'sample.com', 'sample.org', 'sample.net', 'sample.in',
  'dummy.com', 'dummy.org', 'dummy.net', 'dummy.in',
  'fake.com', 'fake.org', 'fake.net', 'fake.in',
  'temp.com', 'temp.org', 'temp.net',
  'demo.com', 'demo.org', 'demo.net',
  'placeholder.com', 'notreal.com', 'noemail.com', 'invalid.com', 'none.com', 'null.com',
  'domain.com', 'xyz.com', 'xyz.in', '123.com', '1234.com', 'abc.com', 'abcd.com',
  'asdf.com', 'qwerty.com', 'dfdf.com',
  // Disposable / temporary mail services
  'mailinator.com', 'yopmail.com', 'tempmail.com', 'temp-mail.org', 'guerrillamail.com',
  'throwawaymail.com', 'sharklasers.com', 'dispostable.com', '10minutemail.com',
  'trashmail.com', 'getairmail.com', 'mohmal.com', 'mytemp.email', 'fakemailgenerator.com',
  'burnermail.io', 'inboxkitten.com', 'generator.email', 'crazymailing.com', 'dropmail.me',
  'armyspy.com', 'cuvox.de', 'dayrep.com', 'einrot.com', 'fleckens.hu', 'gustr.com',
  'jourrapide.com', 'rhyta.com', 'superrito.com', 'teleworm.us', 'maildrop.cc'
]);

const DUMMY_DOMAIN_LABELS = new Set([
  'example', 'test', 'testing', 'sample', 'dummy', 'fake', 'temp', 'temporary',
  'demo', 'placeholder', 'notreal', 'noemail', 'invalid', 'none', 'null',
  'domain', 'mailinator', 'yopmail', 'tempmail', 'guerrillamail', 'trashmail',
  'throwawaymail', 'dispostable', 'sharklasers', '10minutemail', 'inboxkitten',
  'fakemail', 'burnermail', 'xyz', '123', '1234', 'abcd'
]);

const LEGIT_CONSONANT_DOMAINS = new Set(['fb', 'bbc', 'cnn', 'nbc', 'msn', 'tvc', 'pr', 'cr']);

const TWO_LEVEL_CCTLDS = new Set([
  'co', 'com', 'edu', 'ac', 'gov', 'org', 'net', 'res', 'mil', 'gen', 'nom', 'ind', 'sch'
]);

export const TYPO_DOMAINS: Record<string, string> = {
  'gmai.com': 'Please enter a valid email address.',
  'gmal.com': 'Please enter a valid email address.',
  'gamal.com': 'Please enter a valid email address.',
  'gmaill.com': 'Please enter a valid email address.',
  'gmeil.com': 'Please enter a valid email address.',
  'gmaul.com': 'Please enter a valid email address.',
  'gmaik.com': 'Please enter a valid email address.',
  'gamil.com': 'Please enter a valid email address.',
  'gmial.com': 'Please enter a valid email address.',
  'gmai.co': 'Please enter a valid email address.',
  'gmai.in': 'Please enter a valid email address.',
  'gmal.in': 'Please enter a valid email address.',
  'gmail.co': 'Please enter a valid email address.',
  'gmail.cm': 'Please enter a valid email address.',
  'gmail.cmo': 'Please enter a valid email address.',
  'gmail.con': 'Please enter a valid email address.',
  'gmail.xom': 'Please enter a valid email address.',
  'yaho.com': 'Please enter a valid email address.',
  'yahooo.com': 'Please enter a valid email address.',
  'yaho.in': 'Please enter a valid email address.',
  'yaho.co.in': 'Please enter a valid email address.',
  'yahoomail.com': 'Please enter a valid email address.',
  'hotmial.com': 'Please enter a valid email address.',
  'hotmaill.com': 'Please enter a valid email address.',
  'hotmial.co.uk': 'Please enter a valid email address.',
  'outlok.com': 'Please enter a valid email address.',
  'outllok.com': 'Please enter a valid email address.',
  'outlok.in': 'Please enter a valid email address.',
  'redifmail.com': 'Please enter a valid email address.',
  'rediffmai.com': 'Please enter a valid email address.',
  'iclud.com': 'Please enter a valid email address.',
  'icloude.com': 'Please enter a valid email address.'
};

export const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'gmail.co.in',
  'yahoo.com', 'yahoo.co.in', 'yahoo.co.uk', 'yahoo.ca', 'yahoo.fr', 'yahoo.in', 'ymail.com', 'rocketmail.com',
  'hotmail.com', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.es', 'hotmail.it',
  'outlook.com', 'outlook.co.uk', 'outlook.in', 'outlook.fr', 'outlook.es',
  'live.com', 'live.co.uk', 'live.in', 'msn.com',
  'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'aim.com',
  'zoho.com', 'zohomail.com',
  'proton.me', 'protonmail.com', 'pm.me',
  'rediffmail.com', 'rediff.com',
  'gmx.com', 'gmx.net', 'gmx.de',
  'mail.com', 'email.com',
  'yandex.com', 'yandex.ru', 'yandex.kz',
  'tutanota.com', 'tutamail.com',
  'fastmail.com', 'hushmail.com', 'lycos.com'
]);

const DOMAIN_KEYBOARD_MASH_REGEX =
  /(qwerty|wertyu|ertyui|rtyuio|tyuiop|asdfgh|sdfghj|dfghjk|fghjkl|zxcvbn|xcvbnm|poiuyt|lkjhgf|mnbvcx|asdf|fdsa|zxcv|vcxz|qwer|rewq|dfdf|fdfd|hjkl|ghjk|jklm|sdsd|jkjk)/i;

/**
 * Validates an email address and its domain format.
 */
export function validateEmail(email: string, required: boolean = false): { isValid: boolean; error?: string } {
  if (!email || typeof email !== 'string' || !email.trim()) {
    if (required) {
      return { isValid: false, error: 'Please enter a valid email address.' };
    }
    return { isValid: true };
  }

  const trimmed = email.trim();

  // 1. Basic RFC 5322 structure regex (user@domain.tld), TLD 2 to 24 characters
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  // 2. Extract local and domain parts
  const parts = trimmed.toLowerCase().split('@');
  if (parts.length !== 2) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  const [localPart, domain] = parts;

  // 3. Domain formatting checks: consecutive dots or leading/trailing dots or hyphens
  if (!domain || domain.includes('..') || domain.startsWith('.') || domain.endsWith('.')) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  const domainParts = domain.split('.');
  if (domainParts.length < 2) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  // Each domain segment must be valid hostname label
  for (const seg of domainParts) {
    if (!seg || seg.startsWith('-') || seg.endsWith('-') || !/^[a-zA-Z0-9-]+$/.test(seg)) {
      return { isValid: false, error: 'Please enter a valid email address.' };
    }
  }

  // Extract TLD, compound ccTLD detection, and main domain label
  const tld = domainParts[domainParts.length - 1];
  const secondLevel = domainParts[domainParts.length - 2];
  const isCompoundTld = domainParts.length >= 3 && TWO_LEVEL_CCTLDS.has(secondLevel) && tld.length === 2;
  const mainDomainLabel = isCompoundTld
    ? domainParts[domainParts.length - 3]
    : domainParts[domainParts.length - 2];
  const rootDomain = isCompoundTld
    ? domainParts.slice(-3).join('.')
    : domainParts.slice(-2).join('.');

  // 4. Well-known consumer email provider strict domain validation
  // Consumer providers (Gmail, Yahoo, Hotmail, Outlook, iCloud, Rediff, Proton) do not issue custom subdomains
  if (domainParts.includes('gmail') || domainParts.includes('googlemail')) {
    if (domain !== 'gmail.com' && domain !== 'gmail.co.in' && domain !== 'googlemail.com') {
      return { isValid: false, error: 'Please enter a valid email address.' };
    }
  }
  if (domainParts.includes('yahoo')) {
    const validYahoo = ['yahoo.com', 'yahoo.co.in', 'yahoo.co.uk', 'yahoo.ca', 'yahoo.fr', 'yahoo.in'];
    if (!validYahoo.includes(domain)) {
      return { isValid: false, error: 'Please enter a valid email address.' };
    }
  }
  if (domainParts.includes('hotmail')) {
    const validHotmail = ['hotmail.com', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.es', 'hotmail.it'];
    if (!validHotmail.includes(domain)) {
      return { isValid: false, error: 'Please enter a valid email address.' };
    }
  }
  if (domainParts.includes('outlook')) {
    const validOutlook = ['outlook.com', 'outlook.co.uk', 'outlook.in', 'outlook.fr', 'outlook.es'];
    if (!validOutlook.includes(domain)) {
      return { isValid: false, error: 'Please enter a valid email address.' };
    }
  }
  if (domainParts.includes('icloud')) {
    if (domain !== 'icloud.com') {
      return { isValid: false, error: 'Please enter a valid email address.' };
    }
  }
  if (domainParts.includes('rediffmail') || domainParts.includes('rediff')) {
    if (domain !== 'rediffmail.com' && domain !== 'rediff.com') {
      return { isValid: false, error: 'Please enter a valid email address.' };
    }
  }
  if (domainParts.includes('protonmail') || domainParts.includes('proton')) {
    if (domain !== 'proton.me' && domain !== 'protonmail.com' && domain !== 'pm.me') {
      return { isValid: false, error: 'Please enter a valid email address.' };
    }
  }

  // Common provider & domain typos (check full domain, rootDomain, and 2-level suffix)
  const twoLevelSuffix = domainParts.length >= 2 ? domainParts.slice(-2).join('.') : '';
  const threeLevelSuffix = domainParts.length >= 3 ? domainParts.slice(-3).join('.') : '';
  if (
    TYPO_DOMAINS[domain] ||
    TYPO_DOMAINS[rootDomain] ||
    (twoLevelSuffix && TYPO_DOMAINS[twoLevelSuffix]) ||
    (threeLevelSuffix && TYPO_DOMAINS[threeLevelSuffix])
  ) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  // 5. TLD validation
  if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  // Disallow any character repeated 3 or more times anywhere in TLD (e.g. "commmm", "orggg", "innn")
  if (/(.)\1{2,}/.test(tld)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  // Disallow repetitive dummy TLDs like "innnnnn", "aaaaaa"
  if (/^(.)\1+$/.test(tld)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  // Disallow typos/variations of standard TLDs:
  if (/^co+m+$/.test(tld) && tld !== 'com') {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }
  if (/^or+g+$/.test(tld) && tld !== 'org') {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }
  if (/^ne+t+$/.test(tld) && tld !== 'net') {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }
  if (/^ed+u+$/.test(tld) && tld !== 'edu') {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }
  if (/^go+v+$/.test(tld) && tld !== 'gov') {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  const typoTLDs = new Set([
    'comm', 'commm', 'commmm', 'commmmm', 'coom', 'coomm', 'con', 'cmo', 'cm', 'xom',
    'edus', 'eduu', 'eduuu', 'orgg', 'orggg', 'nett', 'nettt', 'gmai', 'innd'
  ]);
  if (typoTLDs.has(tld)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
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
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  // 6. Potentially invalid / dummy / placeholder / disposable domain validation
  if (INVALID_DUMMY_DOMAINS.has(domain) || INVALID_DUMMY_DOMAINS.has(rootDomain)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  if (DUMMY_DOMAIN_LABELS.has(mainDomainLabel)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  // Check all non-TLD segments for dummy keywords or single repeated characters
  const nonTldParts = domainParts.slice(0, -(isCompoundTld ? 2 : 1));
  for (const seg of nonTldParts) {
    if (DUMMY_DOMAIN_LABELS.has(seg)) {
      return { isValid: false, error: 'Please enter a valid email address.' };
    }
    if (/^([a-zA-Z0-9])\1+$/i.test(seg) && seg.length >= 2) {
      return { isValid: false, error: 'Please enter a valid email address.' };
    }
  }

  // Single-character domain label before TLD is invalid (e.g. "a.com")
  if (mainDomainLabel.length < 2 && mainDomainLabel !== 'x') {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  // Single character repeated throughout mainDomainLabel (e.g. "gg", "aa", "bb", "xxx", "zzz")
  if (/^([a-zA-Z0-9])\1+$/i.test(mainDomainLabel)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  // 2-3 char repeating patterns (e.g. "dfdf", "fdfd", "abab", "qwqw")
  if (/^([a-zA-Z0-9]{2,3})\1+$/i.test(mainDomainLabel)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  // Keyboard mashing in domain label
  if (DOMAIN_KEYBOARD_MASH_REGEX.test(mainDomainLabel)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  // Domains with no vowels (consonant-only domains, e.g. "dfdf", "bcdf", "ghjk", "qwert")
  if (
    mainDomainLabel.length >= 2 &&
    !/[0-9]/.test(mainDomainLabel) &&
    !/[aeiouy]/i.test(mainDomainLabel) &&
    !LEGIT_CONSONANT_DOMAINS.has(mainDomainLabel)
  ) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  // 7. Local part formatting and gibberish checks
  if (!localPart || localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  if (!/^[a-zA-Z0-9._%+-]+$/.test(localPart)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  // Reject random gibberish / keyboard mashing in localPart (e.g. "vadgvgjhasgdvhshj", "dfdf")
  if (
    /([a-zA-Z])\1{3,}/i.test(localPart) ||
    /([a-zA-Z]{2,3})\1{2,}/i.test(localPart) ||
    (/^([a-zA-Z]{2})\1+$/i.test(localPart) && !/[aeiouy]/i.test(localPart)) ||
    (!/[aeiouy0-9]/i.test(localPart) && localPart.length >= 4) ||
    /[bcdfghjklmnpqrstvwxz]{6,}/i.test(localPart) ||
    /(qwerty|wertyu|ertyui|rtyuio|tyuiop|asdfgh|sdfghj|dfghjk|fghjkl|zxcvbn|xcvbnm|poiuyt|lkjhgf|mnbvcx|asdf|fdsa|zxcv|vcxz)/i.test(localPart)
  ) {
    return { isValid: false, error: 'Please enter a valid email address.' };
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
 * Checks if an email address or domain belongs to a personal/public consumer email provider.
 */
export function isPersonalEmailDomain(domainOrEmail: string): boolean {
  if (!domainOrEmail || typeof domainOrEmail !== 'string') return false;
  const raw = domainOrEmail.trim().toLowerCase();
  const domain = raw.includes('@') ? raw.split('@')[1] : raw;
  if (!domain) return false;

  if (PERSONAL_EMAIL_DOMAINS.has(domain)) return true;
  if (TYPO_DOMAINS[domain]) return true;

  const parts = domain.split('.');
  if (parts.length >= 2) {
    const mainLabel = parts[0];
    const personalLabels = new Set([
      'gmail', 'googlemail', 'yahoo', 'ymail', 'rocketmail',
      'hotmail', 'outlook', 'live', 'msn', 'icloud', 'aol',
      'protonmail', 'proton', 'rediffmail', 'rediff', 'gmx',
      'tutanota', 'tutamail'
    ]);
    if (personalLabels.has(mainLabel)) {
      return true;
    }
  }

  return false;
}

/**
 * Validates that an email is an official organization email address.
 * Rejects personal/consumer email providers (Gmail, Yahoo, Hotmail, Outlook, etc.) and invalid typo domains.
 * If allowedDomains list is provided or defaulted, ensures the domain is an official organization domain.
 */
export function validateOfficialEmail(
  email: string,
  required: boolean = false,
  allowedDomains?: string[]
): { isValid: boolean; error?: string } {
  if (!email || typeof email !== 'string' || !email.trim()) {
    if (required) {
      return { isValid: false, error: 'Official email address is required.' };
    }
    return { isValid: true };
  }

  // 1. General email validation
  const baseRes = validateEmail(email, required);
  if (!baseRes.isValid) {
    return baseRes;
  }

  const trimmed = email.trim().toLowerCase();
  const domain = trimmed.split('@')[1];

  // 2. Reject personal / consumer email providers & typos
  if (isPersonalEmailDomain(domain)) {
    return {
      isValid: false,
      error: 'Personal email addresses are not permitted. Please enter an official organization email address (e.g. @pirnavschools.edu).'
    };
  }

  // 3. Organization domain validation
  const defaultAllowed = ['pirnavschools.edu', 'pirnavschools.com', 'pirnavschools.org', 'pirnavschools.edu.in'];
  const effectiveAllowed = (allowedDomains && allowedDomains.length > 0) ? allowedDomains : defaultAllowed;

  const isExplicitOrgMatch = effectiveAllowed.some(d => {
    const clean = d.replace(/^@/, '').toLowerCase().trim();
    return domain === clean || domain.endsWith('.' + clean);
  });

  const isInstitutionalDomain =
    domain.endsWith('.edu') ||
    domain.endsWith('.edu.in') ||
    domain.endsWith('.ac.in') ||
    domain.endsWith('.sch.in') ||
    domain.endsWith('.school');

  if (!isExplicitOrgMatch && !isInstitutionalDomain) {
    const primaryDomain = effectiveAllowed[0] || 'pirnavschools.edu';
    return {
      isValid: false,
      error: 'Please enter an official organization email address ending with @' + primaryDomain + ' or an institutional domain.'
    };
  }

  return { isValid: true };
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
  'univ', 'inst', 'acad', 'col', 'sch', 'govt', 'gov', 'co',
  // Common valid English words that have single vowels or consonant clusters
  'pe', 'pt', 'sports', 'sport', 'strengths', 'strength', 'spring', 'springs', 'branch', 'branches', 'www'
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
  if (/([a-zA-Z])\1{2,}/i.test(clean) && lower !== 'www') return true;

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

  // 8. Low vowel ratio in longer alphabetic segments (length >= 10, e.g. "bcdfghjkaqwrtyp")
  // Note: Short words with single vowels like "sports", "french", "branch", "growth" have ratios 0.14-0.17 and are perfectly valid English words.
  if (clean.length >= 10) {
    const vowelCount = (clean.match(/[aeiouy]/gi) || []).length;
    if (vowelCount / clean.length < 0.11 || vowelCount <= 1) return true;
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

export function validateAcademicSessionName(
  name: string,
  required: boolean = true
): { isValid: boolean; error?: string } {
  if (!name || typeof name !== 'string' || !name.trim()) {
    return required ? { isValid: false, error: 'Academic Session Name is required.' } : { isValid: true };
  }
  const trimmed = name.trim();
  if (trimmed.length < 4 || trimmed.length > 20) {
    return { isValid: false, error: 'Academic Session Name must be between 4 and 20 characters (e.g. 2026-27).' };
  }
  // Reject full calendar dates (e.g., DD-MM-YYYY, YYYY-MM-DD, DD/MM/YYYY)
  if (/^\d{1,4}[-–/.]\d{1,2}[-–/.]\d{2,4}$/.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid academic session range (e.g. 2026-27), not a specific calendar date.' };
  }
  // Must contain numeric year representation or session/term identifier
  if (!/\d{2,4}/.test(trimmed) && !/(spring|summer|fall|winter|session|term|semester|batch)/i.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid academic session name (e.g. 2026-27 or YYYY-YY).' };
  }
  return { isValid: true };
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

export function validateUniformSize(size: string, required: boolean = true): { isValid: boolean; error?: string } {
  if (!size || typeof size !== 'string' || !size.trim()) {
    return required ? { isValid: false, error: 'Size name is required.' } : { isValid: true };
  }
  const trimmed = size.trim();
  if (trimmed.length < 1 || trimmed.length > 30) {
    return { isValid: false, error: trimmed.length > 30 ? 'Maximum 30 characters allowed.' : 'Size name is required.' };
  }
  if (!/^[a-zA-Z0-9\s\.\-\/\–\—\(\)\'\"]+$/.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid size name.' };
  }
  return { isValid: true };
}

/**
 * Validates a residential, contact, campus, or general address to ensure completeness.
 * Rejects incomplete address entries (e.g., single-word identifiers like "RkPridepg",
 * strings under 10 characters, or inputs lacking street/locality details).
 */
export function validateAddress(
  address: string,
  required: boolean = false
): { isValid: boolean; error?: string } {
  if (!address || typeof address !== 'string' || !address.trim()) {
    return required
      ? { isValid: false, error: 'Address is required.' }
      : { isValid: true };
  }

  const trimmed = address.trim();

  // 1. Minimum and Maximum Length
  if (trimmed.length < 10) {
    return {
      isValid: false,
      error: 'Please enter a complete address with street, area, or locality details (minimum 10 characters).'
    };
  }
  if (trimmed.length > 200) {
    return {
      isValid: false,
      error: 'Address cannot exceed 200 characters.'
    };
  }

  // 2. Allowed Characters (letters, numbers, spaces, standard address punctuation)
  if (!/^[a-zA-Z0-9\s\,\.\-\/#\&\(\)\'\:\;]+$/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Address contains invalid special characters.'
    };
  }

  // 3. Must contain sufficient alphabetic letters (at least 5 letters)
  const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
  if (letterCount < 5) {
    return {
      isValid: false,
      error: 'Address must contain sufficient street and locality information.'
    };
  }

  // 4. Must contain at least 2 distinct descriptive tokens/words
  const tokens = trimmed.split(/[\s\,\.\-\/#\&\(\)\'\:\;]+/).filter(w => w.length >= 2);
  if (tokens.length < 2) {
    return {
      isValid: false,
      error: 'Incomplete address. Please include street, building, or locality information.'
    };
  }

  // 5. Must not consist only of a single generic word + number without area or street details
  const hasComma = trimmed.includes(',');
  const hasMultipleTokens = tokens.length >= 3;
  const addressKeywords = /(flat|plot|house|h\.no|hno|door|road|rd|street|st|lane|avenue|ave|nagar|colony|layout|enclave|phase|sector|block|building|bldg|apt|apartment|apartments|society|towers|tower|residency|heights|cross|main|near|opp|opposite|behind|beside|floor|pg|hostel|city|town|village|district|dist|pin|pincode|po|post|via|kondapur|hyderabad|bangalore|mumbai|delhi|chennai|pune)/i;

  if (!hasComma && !hasMultipleTokens && !addressKeywords.test(trimmed)) {
    return {
      isValid: false,
      error: 'Incomplete address. Please include street, building, or locality information.'
    };
  }

  // 6. Check for repetitive characters or keyboard mashing
  if (
    /(.)\1{3,}/.test(trimmed) ||
    /([a-zA-Z]{2,3})\1{2,}/i.test(trimmed) ||
    KEYBOARD_MASH_REGEX.test(trimmed)
  ) {
    return {
      isValid: false,
      error: 'Please enter a valid, meaningful address.'
    };
  }

  // 7. Check for gibberish words
  for (const token of tokens) {
    if (token.length >= 6 && isGibberishSegment(token)) {
      return {
        isValid: false,
        error: 'Address appears to contain invalid or meaningless text.'
      };
    }
  }

  return { isValid: true };
}

export function validateCampusAddress(address: string, required: boolean = true): { isValid: boolean; error?: string } {
  return validateAddress(address, required);
}

/**
 * Validator for circular headlines, notice titles, broadcast titles, and announcement headers.
 * Allows common punctuation (colons, exclamation marks, question marks, quotes, brackets, etc.) and emojis.
 */
/**
 * Validates a House Number (e.g. 12, 12-34/A, Flat 402, Plot #15).
 * Allows alphanumeric characters, spaces, and standard address punctuation (-, /, #, ., ,, :).
 */
export function validateHouseNumber(
  val: string,
  options: { required?: boolean } = {}
): { isValid: boolean; error?: string } {
  const { required = false } = options;
  if (!val || typeof val !== 'string' || !val.trim()) {
    return required ? { isValid: false, error: 'House No is required.' } : { isValid: true };
  }

  const trimmed = val.trim();
  if (trimmed.length > 35) {
    return { isValid: false, error: 'House No cannot exceed 35 characters.' };
  }

  // Must contain only letters, numbers, spaces, and -, /, #, ., ,, :
  if (!/^[a-zA-Z0-9\s\-\/\#\.\,\:]+$/.test(trimmed)) {
    return { isValid: false, error: 'Special characters are not allowed (allowed: letters, numbers, -, /, #, ., ,, :).' };
  }

  // Must contain at least one letter or digit
  if (!/[a-zA-Z0-9]/.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid House No (e.g. 12-34, Flat 402, Plot #15).' };
  }

  // Reject consecutive repeating characters (4+)
  if (/([a-zA-Z0-9])\1{3,}/i.test(trimmed) || KEYBOARD_MASH_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid House No.' };
  }

  // Reject 3 or more consecutive symbols (e.g. ---, ///)
  if (/[\-\/\#\.\,\:]{3,}/.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid House No.' };
  }

  return { isValid: true };
}

/**
 * Validates a City name.
 * Allows only alphabetic characters, spaces, hyphens, periods, and apostrophes.
 * Rejects numbers, special characters, state names, keyboard mash, and gibberish.
 */
export function validateCity(
  val: string,
  options: { required?: boolean } = {}
): { isValid: boolean; error?: string } {
  const { required = false } = options;
  if (!val || typeof val !== 'string' || !val.trim()) {
    return required ? { isValid: false, error: 'City is required.' } : { isValid: true };
  }

  const trimmed = val.trim();
  if (trimmed.length < 2) {
    return { isValid: false, error: 'City name must be at least 2 characters.' };
  }
  if (trimmed.length > 50) {
    return { isValid: false, error: 'City name cannot exceed 50 characters.' };
  }

  if (!/^[a-zA-Z\s\.\-\']+$/.test(trimmed)) {
    return { isValid: false, error: 'City name must contain only letters.' };
  }

  // Reject state names entered into city
  const lowerInput = trimmed.toLowerCase();
  const matchedState = VALID_INDIAN_STATES.find(s => s.toLowerCase() === lowerInput);
  if (matchedState) {
    return {
      isValid: false,
      error: `"${trimmed}" is a State name. Please enter a valid City name.`
    };
  }

  // Reject 3+ repeating letters or keyboard mash
  if (/([a-zA-Z])\1{2,}/i.test(trimmed) || KEYBOARD_MASH_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid city name.' };
  }

  const words = trimmed.split(/[\s\.\-\']+/).filter(Boolean);
  for (const word of words) {
    if (isGibberishSegment(word)) {
      return { isValid: false, error: 'Enter a valid city name.' };
    }
  }

  return { isValid: true };
}

export function validateCircularHeadline(
  val: string,
  options: { label?: string; required?: boolean; minLength?: number; maxLength?: number } = {}
): { isValid: boolean; error?: string } {
  const { label = 'circular headline / title', required = true, minLength = 2, maxLength = 200 } = options;
  const cleanLabel = label.trim().toLowerCase() || 'circular headline';
  const capLabel = cleanLabel.charAt(0).toUpperCase() + cleanLabel.slice(1);
  const invalidMsg = `Enter a valid ${cleanLabel}.`;

  if (!val || typeof val !== 'string' || !val.trim()) {
    if (required) {
      return { isValid: false, error: `${capLabel} is required.` };
    }
    return { isValid: true };
  }

  const trimmed = val.trim();
  if (trimmed.length < minLength) {
    return { isValid: false, error: invalidMsg };
  }
  if (trimmed.length > maxLength) {
    return { isValid: false, error: `Maximum ${maxLength} characters allowed.` };
  }
  if (!/[a-zA-Z]/.test(trimmed)) {
    return { isValid: false, error: invalidMsg };
  }

  // Strip emojis before checking keyboard row mashing
  const withoutEmojis = trimmed.replace(/\p{Extended_Pictographic}/gu, '');
  if (KEYBOARD_MASH_REGEX.test(withoutEmojis)) {
    return { isValid: false, error: invalidMsg };
  }

  const words = trimmed
    .split(/[\s\-\–\—\/\.\,\&\(\)\_\'\:\!\?\"\%\+\#\@\;\[\]\<\>\|\*]+/g)
    .filter(Boolean);
  for (const w of words) {
    if (/^[a-zA-Z]+$/.test(w) && isGibberishSegment(w)) {
      return { isValid: false, error: invalidMsg };
    }
  }

  return { isValid: true };
}

/**
 * Validator for multi-line circular message bodies, descriptions, and remarks.
 * Exempts web URLs / www and allows common punctuation, emojis, and normal sentences.
 */
export function validateMessageContent(
  val: string,
  options: { label?: string; required?: boolean; minLength?: number; maxLength?: number } = {}
): { isValid: boolean; error?: string } {
  const { label = 'message content / circular text', required = true, minLength = 2, maxLength = 5000 } = options;
  const cleanLabel = label.trim().toLowerCase() || 'message content';
  const capLabel = cleanLabel.charAt(0).toUpperCase() + cleanLabel.slice(1);
  const invalidMsg = `Enter a valid ${cleanLabel}.`;

  if (!val || typeof val !== 'string' || !val.trim()) {
    if (required) {
      return { isValid: false, error: `${capLabel} is required.` };
    }
    return { isValid: true };
  }

  const trimmed = val.trim();
  if (trimmed.length < minLength) {
    return { isValid: false, error: invalidMsg };
  }
  if (trimmed.length > maxLength) {
    return { isValid: false, error: `Maximum ${maxLength} characters allowed.` };
  }
  if (!/[a-zA-Z]/.test(trimmed)) {
    return { isValid: false, error: invalidMsg };
  }

  // Strip URLs, www, and emojis before checking consecutive letters or keyboard mash across the paragraph
  const testContent = trimmed
    .replace(/\bhttps?:\/\/\S+/gi, '')
    .replace(/\bwww\b/gi, '')
    .replace(/\p{Extended_Pictographic}/gu, '');

  if (
    /([a-zA-Z])\1{3,}/i.test(testContent) ||
    /([a-zA-Z]{2,4})\1{3,}/i.test(testContent) ||
    KEYBOARD_MASH_REGEX.test(testContent)
  ) {
    return { isValid: false, error: invalidMsg };
  }

  const words = trimmed
    .split(/[\s\-\–\—\/\.\,\&\(\)\_\'\:\!\?\"\%\+\#\@\;\[\]\<\>\|\*\n\r\t]+/g)
    .filter(Boolean);
  for (const w of words) {
    if (/^[a-zA-Z]+$/.test(w) && isGibberishSegment(w)) {
      return { isValid: false, error: invalidMsg };
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

export const VALID_INDIAN_DL_STATE_CODES = new Set([
  'AN', 'AP', 'AR', 'AS', 'BR', 'CG', 'CH', 'DD', 'DL', 'DN',
  'GA', 'GJ', 'HP', 'HR', 'JH', 'JK', 'KA', 'KL', 'LA', 'LD',
  'MH', 'ML', 'MN', 'MP', 'MZ', 'NL', 'OD', 'OR', 'PB', 'PY',
  'RJ', 'SK', 'TG', 'TN', 'TR', 'TS', 'UA', 'UK', 'UP', 'WB'
]);

export const DRIVING_LICENCE_ERROR_MESSAGE = 'Enter a valid Indian driving licence number.';

export type DrivingLicenseFormatType =
  | 'SARATHI_STANDARD'
  | 'CFST_YEAR_SUFFIX'
  | 'ORG_LEGACY';

export interface ParsedDrivingLicense {
  isValid: boolean;
  format?: DrivingLicenseFormatType;
  normalized?: string;
  stateCode?: string;
  rtoCode?: string;
  issueYear?: number;
  serialNumber?: string;
  error?: string;
}

export function normalizeDrivingLicense(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.trim().toUpperCase().replace(/\s+/g, ' ');
}

export function sanitizeDrivingLicenseInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9\-\/\s]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\-+/g, '-')
    .replace(/\/+/g, '/')
    .slice(0, 22);
}

/**
 * Parses and validates an Indian Driving Licence number against documented formats:
 * 1. SARATHI_STANDARD: SS[-/ ]RR[A-Z]?[-/ ]YYYY[-/ ]NNNNNNN (6-7 digit serial, e.g. MH-12-20200012345, MH1220200012345, AP12/2007/0123456)
 * 2. CFST_YEAR_SUFFIX: SS[-/ ]RRR[-/ ]NNNNNNN[-/ ]YYYY (2-3 digit RTO/CFST unit office code + 5-7 digit serial + 4-digit year at end, e.g. AP13700322492018)
 * 3. ORG_LEGACY: DL[- ]YYYY[- ]NNNN..NNNNNNN (application legacy format, e.g. DL-2026-0073)
 *
 * Note: Format validation verifies structural compliance only and does not prove official issuance.
 */
export function parseDrivingLicense(license: string): ParsedDrivingLicense {
  const normalized = normalizeDrivingLicense(license);
  if (!normalized) {
    return { isValid: false, error: DRIVING_LICENCE_ERROR_MESSAGE };
  }

  // Reject characters outside uppercase alphanumeric, hyphen, slash, or space
  if (!/^[A-Z0-9\-\/\s]+$/.test(normalized)) {
    return { isValid: false, error: DRIVING_LICENCE_ERROR_MESSAGE };
  }

  // Reject leading/trailing separators, consecutive separators, or mixed '-' and '/' separators
  if (
    /^[\-\/\s]|[\-\/\s]$/.test(normalized) ||
    /[\-\/]{2,}|\s[\-\/]|[\-\/]\s/.test(normalized) ||
    (normalized.includes('-') && normalized.includes('/'))
  ) {
    return { isValid: false, error: DRIVING_LICENCE_ERROR_MESSAGE };
  }

  const maxIssueYear = Math.max(new Date().getFullYear(), 2026);
  const isValidIssueYear = (yearStr: string): number | null => {
    if (!/^\d{4}$/.test(yearStr)) return null;
    const yr = parseInt(yearStr, 10);
    if (isNaN(yr) || yr < 1970 || yr > maxIssueYear) return null;
    return yr;
  };

  const isValidSerial = (serialStr: string, minLen: number, maxLen: number): boolean => {
    if (serialStr.length < minLen || serialStr.length > maxLen) return false;
    if (!/^\d+$/.test(serialStr)) return false;
    if (/^0+$/.test(serialStr)) return false;
    if (serialStr.length >= 5 && /^(\d)\1+$/.test(serialStr)) return false;
    return true;
  };

  const isValidRtoCode = (rtoStr: string): boolean => {
    if (!/^\d{2,3}[A-Z]?$/.test(rtoStr)) return false;
    const digits = rtoStr.replace(/[A-Z]/g, '');
    const num = parseInt(digits, 10);
    if (isNaN(num) || num < 1) return false;
    if (digits.length === 2 && (num < 1 || num > 99)) return false;
    if (digits.length === 3 && /^000$/.test(digits)) return false;
    return true;
  };

  // 1. Check Standard Sarathi Parivahan / Slash- or Hyphen-Separated Format:
  // SS + optional sep + RR[A-Z]? + optional sep + YYYY + optional sep + NNNNNNN (6-7 digits)
  const sarathiMatch = normalized.match(
    /^([A-Z]{2})[\-\/\s]?(\d{2}[A-Z]?)[\-\/\s]?(\d{4})[\-\/\s]?(\d{6,7})$/
  );
  if (sarathiMatch) {
    const [, stateCode, rtoCode, yearStr, serialStr] = sarathiMatch;
    const yr = isValidIssueYear(yearStr);
    if (
      VALID_INDIAN_DL_STATE_CODES.has(stateCode) &&
      isValidRtoCode(rtoCode) &&
      yr !== null &&
      isValidSerial(serialStr, 6, 7)
    ) {
      return {
        isValid: true,
        format: 'SARATHI_STANDARD',
        normalized,
        stateCode,
        rtoCode,
        issueYear: yr,
        serialNumber: serialStr,
      };
    }
  }

  // 2. Check CFST / Legacy State Portal Year-Suffix Format (e.g. AP13700322492018, AP12/0123456/2007):
  // Structure: SS (2 letters) + RRR/RR (2-3 digit RTO/Unit Office code) + NNNNNNN (5-7 digit serial) + YYYY (4-digit issue year at end)
  const cfstSeparatedMatch = normalized.match(
    /^([A-Z]{2})[\-\/\s]?(\d{2,3})[\-\/\s](\d{5,7})[\-\/\s](\d{4})$/
  );
  if (cfstSeparatedMatch) {
    const [, stateCode, rtoCode, serialStr, yearStr] = cfstSeparatedMatch;
    const yr = isValidIssueYear(yearStr);
    if (
      VALID_INDIAN_DL_STATE_CODES.has(stateCode) &&
      isValidRtoCode(rtoCode) &&
      yr !== null &&
      isValidSerial(serialStr, 5, 7)
    ) {
      return {
        isValid: true,
        format: 'CFST_YEAR_SUFFIX',
        normalized,
        stateCode,
        rtoCode,
        issueYear: yr,
        serialNumber: serialStr,
      };
    }
  }

  // Contiguous or single-separator CFST Year-Suffix Format (e.g. AP13700322492018, AP-13700322492018)
  const cfstContiguousMatch = normalized.match(
    /^([A-Z]{2})[\-\/\s]?(\d{8,10})(\d{4})$/
  );
  if (cfstContiguousMatch) {
    const [, stateCode, middleDigits, yearStr] = cfstContiguousMatch;
    const yr = isValidIssueYear(yearStr);
    if (VALID_INDIAN_DL_STATE_CODES.has(stateCode) && yr !== null) {
      // For 10 middle digits (16 chars total, e.g. AP13700322492018): 3-digit CFST office code + 7-digit serial
      // For 9 middle digits (15 chars total): 2-digit RTO code + 7-digit serial
      // For 8 middle digits (14 chars total): 3-digit office code + 5-digit serial (or 2-digit RTO + 6-digit serial)
      const rtoLen = middleDigits.length === 10 ? 3 : 2;
      const rtoCode = middleDigits.slice(0, rtoLen);
      const serialStr = middleDigits.slice(rtoLen);

      // Ensure first 2 digits of a 3-digit contiguous RTO code are not '00' (unless valid '01'..'99' prefix)
      const validContiguousRto =
        isValidRtoCode(rtoCode) &&
        (rtoLen === 2 || !/^00/.test(rtoCode));

      if (validContiguousRto && isValidSerial(serialStr, 5, 7)) {
        return {
          isValid: true,
          format: 'CFST_YEAR_SUFFIX',
          normalized,
          stateCode,
          rtoCode,
          issueYear: yr,
          serialNumber: serialStr,
        };
      }
    }
  }

  // 3. Check Application Legacy / Organizational Format: DL[- ]YYYY[- ]NNNN(NNN) (e.g. DL-2026-0073)
  const orgMatch = normalized.match(/^(DL)[\-\s](\d{4})[\-\s](\d{4,7})$/);
  if (orgMatch) {
    const [, stateCode, yearStr, serialStr] = orgMatch;
    const yr = isValidIssueYear(yearStr);
    if (yr !== null && isValidSerial(serialStr, 4, 7)) {
      return {
        isValid: true,
        format: 'ORG_LEGACY',
        normalized,
        stateCode,
        issueYear: yr,
        serialNumber: serialStr,
      };
    }
  }

  return {
    isValid: false,
    error: DRIVING_LICENCE_ERROR_MESSAGE,
  };
}

/**
 * Validates a Driving License Number against documented Indian RTO/Sarathi, CFST, and legacy formats.
 */
export function validateDrivingLicense(
  license: string,
  required: boolean = true
): { isValid: boolean; error?: string } {
  if (!license || typeof license !== 'string' || !license.trim()) {
    return required
      ? { isValid: false, error: 'Driving License Number is required.' }
      : { isValid: true };
  }

  const parsed = parseDrivingLicense(license);
  if (!parsed.isValid) {
    return {
      isValid: false,
      error: parsed.error || DRIVING_LICENCE_ERROR_MESSAGE,
    };
  }

  return { isValid: true };
}

export function validateSearchQuery(query: string, maxLength: number = 30): { isValid: boolean; error?: string } {
  if (!query || typeof query !== 'string') return { isValid: true };
  if (query.length > 0 && !query.trim()) {
    return { isValid: false, error: 'Enter a valid search term.' };
  }
  const trimmed = query.trim();
  if (!trimmed) return { isValid: true };
  if (trimmed.length > maxLength) return { isValid: false, error: `Maximum ${maxLength} characters allowed.` };
  if (/^\d+$/.test(trimmed) && trimmed.length > 10) {
    return { isValid: false, error: 'Numeric search cannot exceed 10 digits.' };
  }
  if (/\d{11,}/.test(trimmed)) {
    return { isValid: false, error: 'Numeric search cannot exceed 10 digits.' };
  }
  if (!/^[a-zA-Z0-9\s\-\/\.\_\&\']+$/.test(trimmed)) {
    return { isValid: false, error: 'Special characters are not allowed.' };
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
  // 0. Explicit aria-label, name, or title
  const explicitAria = (input.getAttribute('aria-label') || '').trim().toLowerCase();
  if (explicitAria && explicitAria.length <= 50) return explicitAria;

  // 1. Look for a preceding or wrapping <label> strictly within the field's own container or sibling
  const parentDiv = input.closest('div');
  const labelEl =
    input.closest('label') ||
    (input.id && typeof document !== 'undefined' ? document.querySelector(`label[for="${input.id}"]`) : null) ||
    parentDiv?.querySelector(':scope > label, :scope > span') ||
    (input.previousElementSibling?.tagName?.toLowerCase() === 'label' || input.previousElementSibling?.tagName?.toLowerCase() === 'span'
      ? input.previousElementSibling
      : null);

  if (labelEl && labelEl.textContent) {
    const raw = labelEl.textContent
      .replace(/\*/g, '')
      .replace(/\(.*?\)/g, '')
      .trim()
      .toLowerCase();
    if (raw && raw.length <= 50 && !raw.includes('\n')) {
      return raw;
    }
  }

  // 2. Fallback to name or placeholder
  const nameAttr = (input.getAttribute('name') || '').toLowerCase();
  if (nameAttr.includes('prefix')) return 'prefix';
  if (nameAttr.includes('start')) return 'start number';
  if (nameAttr.includes('length') || nameAttr.includes('digit')) return 'digits';

  const ph = (input.getAttribute('placeholder') || '').toLowerCase();
  if (ph.includes('prefix') || ph.includes('tc') || ph.includes('bc')) return 'prefix';
  if (ph.includes('start no') || ph.includes('starting number')) return 'start number';
  if (ph.includes('digit') || ph.includes('padding')) return 'digit padding';
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
  if (ph.includes('house') || ph.includes('flat') || ph.includes('plot')) return 'house no';
  if (ph.includes('city')) return 'city';
  if (ph.includes('license') || ph.includes('licence') || ph.includes('dl-')) return 'driving license number';
  if (ph.includes('name')) return 'name';

  return 'value';
}

function shouldSkipGlobalValidation(input: HTMLInputElement | HTMLTextAreaElement): boolean {
  if (input.disabled || input.readOnly) return true;
  if (input.hasAttribute('data-skip-global-validation') || Boolean(input.closest('[data-skip-global-validation]'))) {
    return true;
  }
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

  // Form field check: if inside a form, grid, has a label or full width, always use normal block flow (never for search)
  const isTargetParentCol = Boolean(
    targetParent &&
    targetParent !== container &&
    targetParent.children.length <= 2 &&
    (targetParent.classList.contains('flex-col') || (targetParent.className || '').includes('flex-col')) &&
    !((targetParent.className || '').includes('flex-row') || (targetParent.className || '').includes(':flex-row'))
  );

  const isFormField = !isSearch && Boolean(
    container.closest('form') ||
    container.closest('.grid') ||
    targetParent.querySelector('label') ||
    targetParent.querySelector('span') ||
    container.classList.contains('flex-col') ||
    targetParent.classList.contains('flex-col') ||
    (!isInsideHorizontalLayout && (container.classList.contains('w-full') || input.classList.contains('w-full')))
  );

  const shouldAbsolute = !isTargetParentCol && (isSearch || (!isFormField && isInsideHorizontalLayout));

  const directSibling = (isIconWrapper ? container.nextElementSibling : input.nextElementSibling) as HTMLElement | null;
  let errEl = (container.querySelector(':scope > [data-global-validation-error="true"]') ||
               (directSibling && directSibling.getAttribute('data-global-validation-error') === 'true' ? directSibling : null) ||
               container.parentElement?.querySelector(':scope > [data-global-validation-error="true"]')) as HTMLElement | null;

  if (!error) {
    input.removeAttribute('data-global-invalid');
    input.style.borderColor = '';
    container.style.marginBottom = '';
    container.style.alignSelf = '';
    if (container.parentElement) {
      container.parentElement.style.marginBottom = '';
      container.parentElement.style.alignSelf = '';
    }
    if (isIconWrapper) {
      Array.from(container.querySelectorAll<HTMLElement>(':scope > svg.absolute, :scope > .absolute')).forEach(iconEl => {
        if (iconEl.hasAttribute('data-locked-icon-top')) {
          iconEl.style.top = '';
          iconEl.removeAttribute('data-locked-icon-top');
        }
      });
    }
    if (errEl) {
      errEl.remove();
    }
    container.querySelectorAll(':scope > [data-global-validation-error="true"]').forEach(el => el.remove());
    if (container.parentElement) {
      container.parentElement.querySelectorAll(':scope > [data-global-validation-error="true"]').forEach(el => el.remove());
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

    anchor.style.marginBottom = '26px';
    anchor.style.alignSelf = 'flex-start';

    errEl.style.position = 'absolute';
    errEl.style.left = '0';
    errEl.style.top = '100%';
    errEl.style.marginTop = '4px';
    errEl.style.fontSize = '11px';
    errEl.style.fontWeight = '700';
    errEl.style.color = '#f43f5e';
    errEl.style.lineHeight = '1.2';
    errEl.style.zIndex = '30';
    errEl.style.pointerEvents = 'none';
    errEl.style.whiteSpace = 'normal';
    errEl.style.maxWidth = '180px';
    errEl.style.wordBreak = 'break-word';

    if (errEl.parentElement !== anchor) {
      anchor.appendChild(errEl);
    }
  } else {
    container.style.marginBottom = '';
    container.style.alignSelf = '';
    // Lock any vertically-centered icon inside container to the input's vertical center before appending error under input
    if (isIconWrapper && input.offsetHeight > 0) {
      const inputCenterY = input.offsetTop + input.offsetHeight / 2;
      Array.from(container.querySelectorAll<HTMLElement>(':scope > svg.absolute, :scope > .absolute')).forEach(iconEl => {
        if (iconEl !== errEl && iconEl.classList.contains('top-1/2')) {
          iconEl.style.top = `${inputCenterY}px`;
          iconEl.setAttribute('data-locked-icon-top', 'true');
        }
      });
    }

    try {
      const cs = window.getComputedStyle(container);
      if ((cs.display === 'flex' || cs.display === 'inline-flex') && !cs.flexDirection.startsWith('column')) {
        container.style.flexWrap = 'wrap';
      }
    } catch {
      // ignore
    }

    errEl.style.position = 'static';
    errEl.style.display = 'block';
    errEl.style.width = '100%';
    errEl.style.flexBasis = '100%';
    errEl.style.left = '';
    errEl.style.top = '';
    errEl.style.zIndex = '';
    errEl.style.pointerEvents = '';
    errEl.style.whiteSpace = '';
    errEl.style.color = '#f43f5e';
    errEl.style.fontSize = '11px';
    errEl.style.fontWeight = '700';
    errEl.style.marginTop = '6px';
    errEl.style.marginBottom = '4px';
    errEl.style.lineHeight = '1.2';

    const parentIsFlexRow = (() => {
      if (!isIconWrapper || !container.parentElement) return false;
      try {
        const pcs = window.getComputedStyle(container.parentElement);
        return (pcs.display === 'flex' || pcs.display === 'inline-flex') && !pcs.flexDirection.startsWith('column');
      } catch {
        return false;
      }
    })();

    const insertTarget = isIconWrapper && !parentIsFlexRow && !isSearch ? container : input;
    if (insertTarget.nextElementSibling !== errEl) {
      insertTarget.insertAdjacentElement('afterend', errEl);
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

  const ph = (input.placeholder || '').toLowerCase().trim();

  if (label.includes('gst') || ph.includes('gst')) {
    return validateGSTNumber(val, enforceRequired && input.required);
  }

  const isDateField =
    input.hasAttribute('data-date-input') ||
    Boolean(input.closest('[data-date-input]')) ||
    Boolean(input.parentElement?.querySelector('input[type="date"]')) ||
    (/\b(date|dob)\b/i.test(label) && !label.includes('candidate') && !label.includes('validate') && !label.includes('update')) ||
    (input.placeholder || '').toLowerCase().includes('dd-mm') ||
    (input.placeholder || '').toLowerCase().includes('yyyy');

  if (isDateField) {
    const trimmedDate = val.trim();
    if (trimmedDate.length >= 8) {
      const parsed = parseDateOnly(trimmedDate);
      if (!parsed) {
        return { isValid: false, error: `Enter a valid ${label || 'date'} (DD-MM-YYYY).` };
      }
      const maxAttr = input instanceof HTMLInputElement ? input.max : undefined;
      if (maxAttr) {
        const maxParsed = parseDateOnly(maxAttr);
        if (maxParsed && compareDates(parsed, maxParsed) > 0) {
          return { isValid: false, error: `Date cannot be after ${formatDateForDisplay(maxAttr)}.` };
        }
      }
      const minAttr = input instanceof HTMLInputElement ? input.min : undefined;
      if (minAttr) {
        const minParsed = parseDateOnly(minAttr);
        if (minParsed && compareDates(parsed, minParsed) < 0) {
          return { isValid: false, error: `Date cannot be before ${formatDateForDisplay(minAttr)}.` };
        }
      }
    } else if (enforceRequired) {
      return { isValid: false, error: `Enter a valid ${label || 'date'} (DD-MM-YYYY).` };
    }
    return { isValid: true };
  }

  const fullLabelText = (() => {
    const parentDiv = input.closest('div');
    const labelEl = parentDiv?.querySelector('label') || parentDiv?.parentElement?.querySelector('label');
    return (labelEl?.textContent || '').toLowerCase();
  })();

  const isExplicitlyNonTime =
    input.hasAttribute('data-no-time-validation') ||
    Boolean(input.closest('[data-no-time-validation]')) ||
    input.getAttribute('data-field-type') === 'duration' ||
    input.getAttribute('data-field-type') === 'name' ||
    input.getAttribute('data-field-type') === 'numeric' ||
    label.includes('name') ||
    label.includes('route') ||
    label.includes('est') ||
    label.includes('duration') ||
    label.includes('minute') ||
    label.includes('min') ||
    label.includes('distance') ||
    label.includes('km') ||
    /\b(name|route|est|estimated?|duration|minutes?|mins?|hours?|hrs?|seconds?|secs?|distance|km|kms|fare|rate|price|cost|amount|count|qty)\b/i.test(fullLabelText + ' ' + label + ' ' + ph);

  const isNumericOrDuration =
    input.inputMode === 'numeric' ||
    input.inputMode === 'decimal' ||
    (input instanceof HTMLInputElement && input.type === 'number') ||
    input.getAttribute('data-field-type') === 'duration' ||
    input.getAttribute('data-field-type') === 'numeric' ||
    /\b(minutes?|mins?|hours?|hrs?|seconds?|secs?|duration|distance|km|kms|miles?|count|quantity|qty|amount|fare|rate|price|cost|capacity)\b/i.test(fullLabelText + ' ' + label) ||
    /\b(est|estimate|estimated)\b/i.test(fullLabelText + ' ' + label);

  const hasTimePlaceholder =
    /\b\d{1,2}:\d{2}\s*(am|pm)?\b/i.test(ph) ||
    /\bhh:mm(\s*(am\/pm|am|pm))?\b/i.test(ph);

  const isClockTimeLabel =
    !isExplicitlyNonTime &&
    !label.includes('name') &&
    !label.includes('route') &&
    !label.includes('title') &&
    !label.includes('code') &&
    !label.includes('person') &&
    !label.includes('manager') &&
    !label.includes('user') &&
    !label.includes('student') &&
    !label.includes('staff') &&
    !label.includes('driver') &&
    !label.includes('employee') &&
    !label.includes('zone') &&
    !label.includes('area') &&
    (
      label === 'time' ||
      label === 'time:' ||
      label.includes('start time') ||
      label.includes('end time') ||
      label.includes('pickup time') ||
      label.includes('drop time') ||
      label.includes('arrival') ||
      label.includes('departure') ||
      label.includes('in time') ||
      label.includes('out time') ||
      label.includes('clock time') ||
      label.includes('schedule time') ||
      label.includes('shift time') ||
      label.includes('reporting time') ||
      label.includes('exam time') ||
      label.includes('meeting time') ||
      label.includes('opening time') ||
      label.includes('closing time')
    );

  const isTimeField =
    !isExplicitlyNonTime &&
    !isNumericOrDuration &&
    (
      (input instanceof HTMLInputElement && input.type === 'time') ||
      input.hasAttribute('data-time-input') ||
      Boolean(input.closest('[data-time-input]')) ||
      (isClockTimeLabel && (hasTimePlaceholder || ph.includes('time') || !ph)) ||
      (hasTimePlaceholder && (label.includes('time') || ph.includes('time')))
    );

  if (isTimeField) {
    let trimmedTime = val.trim();
    const compactMatch = trimmedTime.match(/^(\d{3,4})(\s*(?:am|pm|a|p)?)?$/i);
    if (compactMatch) {
      const digits = compactMatch[1];
      const suffix = compactMatch[2] || '';
      const firstTwo = parseInt(digits.slice(0, 2), 10);
      if (digits.length === 3) {
        trimmedTime = firstTwo > 23
          ? `0${digits[0]}:${digits.slice(1)}${suffix}`
          : `${digits.slice(0, 2)}:${digits.slice(2)}${suffix}`;
      } else if (digits.length === 4) {
        trimmedTime = `${digits.slice(0, 2)}:${digits.slice(2, 4)}${suffix}`;
      }
    }
    const timePattern = enforceRequired
      ? /^([0-1]?[0-9]|2[0-3])(:[0-5][0-9])?(\s*(am|pm))?(\s*[-–—to]\s*([0-1]?[0-9]|2[0-3])(:[0-5][0-9])?(\s*(am|pm))?)?$/i
      : /^([0-1]?[0-9]|2[0-3])(:[0-5][0-9]?|:)?(\s*(a|p|am|pm))?(\s*[-–—to]\s*([0-1]?[0-9]|2[0-3])(:[0-5][0-9]?|:)?(\s*(a|p|am|pm))?)?$/i;
    if (!timePattern.test(trimmedTime)) {
      return { isValid: false, error: 'Enter a valid time (e.g. 10:00 AM).' };
    }
    return { isValid: true };
  }

  const isStockField =
    label.includes('stock') ||
    label.includes('warehouse') ||
    label.includes('available units') ||
    (input.placeholder || '').toLowerCase().includes('stock');

  if (isStockField) {
    const trimmedStock = val.trim();
    if (!trimmedStock && enforceRequired && input.required) {
      return { isValid: false, error: 'Warehouse stock is required.' };
    }
    if (trimmedStock) {
      if (!/^\d+$/.test(trimmedStock)) {
        return { isValid: false, error: 'Enter a valid stock number.' };
      }
      if (trimmedStock.length > 10) {
        return { isValid: false, error: 'Warehouse stock cannot exceed 10 digits.' };
      }
    }
    return { isValid: true };
  }

  if (isNumericOrDuration && (input.inputMode === 'numeric' || input.inputMode === 'decimal' || (input instanceof HTMLInputElement && input.type === 'number'))) {
    const trimmedNum = val.trim();
    if (!/^\d+(\.\d+)?$/.test(trimmedNum)) {
      return { isValid: false, error: `Enter a valid ${label || 'number'}.` };
    }
    return { isValid: true };
  }

  // 1. Content/Textarea/Message check must run BEFORE house number or address checks
  const isContentField =
    input instanceof HTMLTextAreaElement ||
    label.includes('content') ||
    label.includes('message') ||
    label.includes('description') ||
    label.includes('remark') ||
    label.includes('note') ||
    label.includes('body') ||
    label.includes('detail') ||
    label.includes('reason') ||
    label.includes('circular text') ||
    label.includes('broadcast text');

  if (isContentField) {
    return validateMessageContent(val, {
      label,
      required: enforceRequired && input.required,
    });
  }

  // 2. House number: Must NOT match textareas or message/content/circular fields
  const isHouseNumberField =
    !isContentField &&
    !(input instanceof HTMLTextAreaElement) &&
    !label.includes('content') &&
    !label.includes('message') &&
    !label.includes('circular') &&
    !label.includes('announcement') &&
    !label.includes('title') &&
    !label.includes('headline') &&
    (
      /\b(house|flat|door|plot)\b/i.test(label) ||
      (/\b(house|flat|door|plot)\s*(no|num|number)?\b/i.test(input.placeholder || '') && !/\b(inter-house|guest\s*house|open\s*house)\b/i.test(input.placeholder || ''))
    );

  if (isHouseNumberField) {
    return validateHouseNumber(val, {
      required: enforceRequired && input.required,
    });
  }

  const isCityField =
    (label === 'city' || /\bcity\b/i.test(label) || (input.placeholder || '').toLowerCase().includes('city')) &&
    !label.includes('capacity');

  if (isCityField) {
    return validateCity(val, {
      required: enforceRequired && input.required,
    });
  }

  if (label.includes('address') && !label.includes('email') && !label.includes('ip') && !label.includes('web')) {
    return validateCampusAddress(val, enforceRequired && input.required);
  }

  if (label.includes('size')) {
    return validateUniformSize(val, enforceRequired && input.required);
  }

  const isCampusCode =
    (label === 'campus code' || label === 'campus_code' || label === 'school code' || (label.includes('code') && label.includes('campus'))) &&
    !label.includes('size') &&
    !label.includes('postal') &&
    !label.includes('zip') &&
    !label.includes('pin') &&
    !label.includes('bar') &&
    !label.includes('qr') &&
    !label.includes('discount') &&
    !label.includes('subject');

  if (isCampusCode) {
    return validateCampusCode(val, enforceRequired && input.required);
  }

  if (
    (label.includes('license') || label.includes('licence')) &&
    !label.includes('type') &&
    !label.includes('expiry') &&
    !label.includes('date')
  ) {
    const isActivelyTyping =
      !enforceRequired &&
      !input.hasAttribute('data-global-invalid') &&
      typeof document !== 'undefined' &&
      document.activeElement === input;
    const normLic = normalizeDrivingLicense(val);
    const alphaNumLen = normLic.replace(/[^A-Z0-9]/g, '').length;
    if (
      isActivelyTyping &&
      alphaNumLen < 15 &&
      /^[A-Z]{1,2}[A-Z0-9\-\/\s]*$/.test(normLic) &&
      !/[\-\/]{2,}/.test(normLic)
    ) {
      return { isValid: true };
    }
    return validateDrivingLicense(val, enforceRequired && input.required);
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

  const isCircularHeadlineField =
    !isContentField &&
    !(input instanceof HTMLTextAreaElement) &&
    !isDateField &&
    !isTimeField &&
    !label.includes('channel') &&
    !label.includes('audience') &&
    !label.includes('category') &&
    (
    label.includes('headline') ||
    label.includes('circular') ||
    label.includes('broadcast') ||
    label.includes('announcement') ||
    label.includes('notice'));

  if (isCircularHeadlineField) {
    return validateCircularHeadline(val, {
      label,
      required: enforceRequired && input.required,
      maxLength: 200,
    });
  }

  const isStrictNameField =
    !isDateField &&
    !isTimeField &&
    (
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
    label.includes('employer'));

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
      label.includes('signatory') ||
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
  const testInput = trimmed
    .replace(/\bhttps?:\/\/\S+/gi, '')
    .replace(/\bwww\b/gi, '')
    .replace(/\p{Extended_Pictographic}/gu, '');

  if (
    /([a-zA-Z])\1{2,}/i.test(testInput) ||
    /([a-zA-Z]{2,4})\1{2,}/i.test(testInput) ||
    KEYBOARD_MASH_REGEX.test(testInput)
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

    const isClearBtn =
      Boolean(btn.querySelector('svg.lucide-x') || btn.querySelector('svg.lucide-x-circle')) ||
      ariaLabel.includes('clear') ||
      title.includes('clear');

    if (isClearBtn) {
      const parentWrap = btn.closest('.relative, div');
      const searchInput = parentWrap?.querySelector('input, textarea') as HTMLInputElement | null;
      if (searchInput) {
        setGlobalInputError(searchInput, undefined);
        searchInput.removeAttribute('data-global-invalid');
        searchInput.style.borderColor = '';
      }
      parentWrap?.querySelectorAll('[data-global-validation-error="true"]').forEach(el => el.remove());
      parentWrap?.parentElement?.querySelectorAll('[data-global-validation-error="true"]').forEach(el => el.remove());
      return;
    }

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
      btn.dataset.skipValidation ||
      btn.hasAttribute('data-skip-validation') ||
      /add\s+(range|tier|row|item|field|stop|member|step)/i.test(btnText)
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

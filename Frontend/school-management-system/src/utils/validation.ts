export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const;
export const CASTE_CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS', 'Others'] as const;
export const BRANCHES = ['Main Campus', 'North Branch', 'West Campus', 'Hyderabad'] as const;

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
 * Validates an email address format.
 */
export function validateEmail(email: string, required: boolean = false): { isValid: boolean; error?: string } {
  if (!email || typeof email !== 'string' || !email.trim()) {
    if (required) {
      return { isValid: false, error: 'Email address is required.' };
    }
    return { isValid: true };
  }

  const trimmed = email.trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g., name@example.com).' };
  }

  return { isValid: true };
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhoneNumber(phone?: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Handle E.164 format (+1XXXXXXXXXX)
  if (phone.startsWith('+1') && digits.length === 11 && digits.startsWith('1')) {
    const phoneDigits = digits.slice(1);
    return `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6)}`;
  }
  
  // Check if it's a valid US phone number (10 digits)
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  // Check if it's 11 digits and starts with 1 (US country code)
  if (digits.length === 11 && digits.startsWith('1')) {
    const phoneDigits = digits.slice(1);
    return `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6)}`;
  }
  
  // Return original if not a standard format
  return phone;
}

/**
 * Formats phone number input for real-time display and converts to E.164 for storage
 * @param input - Raw user input
 * @returns Object with displayValue and e164Value
 */
export function formatPhoneNumberInput(input: string): { displayValue: string; e164Value: string } {
  if (!input) return { displayValue: '', e164Value: '' };
  
  // Remove all non-digit characters
  const digits = input.replace(/\D/g, '');
  
  // Handle US phone numbers (10 digits)
  if (digits.length <= 10) {
    // Format for display as user types
    let displayValue = '';
    if (digits.length > 0) {
      displayValue = `(${digits.slice(0, 3)}`;
      if (digits.length > 3) {
        displayValue += `) ${digits.slice(3, 6)}`;
        if (digits.length > 6) {
          displayValue += `-${digits.slice(6, 10)}`;
        }
      }
    }
    
    // Create E.164 format for storage (only if we have 10 digits)
    const e164Value = digits.length === 10 ? `+1${digits}` : '';
    
    return { displayValue, e164Value };
  }
  
  // If more than 10 digits, truncate to 10
  const truncatedDigits = digits.slice(0, 10);
  const displayValue = `(${truncatedDigits.slice(0, 3)}) ${truncatedDigits.slice(3, 6)}-${truncatedDigits.slice(6)}`;
  const e164Value = `+1${truncatedDigits}`;
  
  return { displayValue, e164Value };
}

export function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

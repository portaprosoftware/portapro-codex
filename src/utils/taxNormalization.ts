// Helper utility for normalizing tax input across the application
import { normalizeTaxInput } from '@/lib/tax';

export function formatTaxRateForDisplay(rate: number | null | undefined): string {
  if (rate == null) return '';
  // Convert from decimal to percentage for display (0.08 -> "8")
  return (rate * 100).toString();
}

export function parseTaxRateFromInput(input: string): number | null {
  if (!input || input.trim() === '') return null;
  return normalizeTaxInput(input);
}

export function validateTaxRateInput(input: string): { valid: boolean; error?: string } {
  if (!input || input.trim() === '') {
    return { valid: true }; // Empty is valid (optional)
  }
  
  const num = parseFloat(input.replace('%', ''));
  
  if (isNaN(num)) {
    return { valid: false, error: 'Please enter a valid number' };
  }
  
  if (num < 0) {
    return { valid: false, error: 'Tax rate cannot be negative' };
  }
  
  if (num > 100) {
    return { valid: false, error: 'Tax rate cannot exceed 100%' };
  }
  
  return { valid: true };
}
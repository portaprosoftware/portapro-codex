/**
 * Utility functions for text formatting in the customer portal
 */

/**
 * Capitalizes the first letter of each word and replaces underscores with spaces
 * @param text - The text to format
 * @returns Formatted text with proper capitalization
 */
export function formatBadgeText(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Capitalizes the first letter of a string
 * @param text - The text to capitalize
 * @returns Text with first letter capitalized
 */
export function capitalizeFirst(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Formats gas station names with proper capitalization
 * - Words with 3 or fewer letters are fully uppercased (e.g., "bp" → "BP")
 * - Longer words have first letter capitalized
 * @param name - The station name to format
 * @returns Formatted station name
 */
export function formatStationName(name: string): string {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(word => {
      if (word.length <= 3) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}
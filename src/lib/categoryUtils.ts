/**
 * Convert snake_case string to Title Case
 * Example: "guest_essentials" -> "Guest Essentials"
 */
export const snakeCaseToTitleCase = (str: string): string => {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Convert Title Case to snake_case
 * Example: "Guest Essentials" -> "guest_essentials"
 */
export const titleCaseToSnakeCase = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/\s+/g, '_');
};

/**
 * Format category for display - handles both formats gracefully
 */
export const formatCategoryDisplay = (category: string): string => {
  // If it contains underscores, convert from snake_case
  if (category.includes('_')) {
    return snakeCaseToTitleCase(category);
  }
  // Otherwise, capitalize the first letter of the word
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
};

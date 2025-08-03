/**
 * Utility functions for consistent date handling across the application
 * Ensures dates are formatted consistently and avoids timezone issues
 */

/**
 * Formats a Date object to YYYY-MM-DD string using local date components
 * This avoids timezone issues that can occur with format() from date-fns
 */
export const formatDateForQuery = (date: Date | string | null | undefined): string | undefined => {
  if (!date) return undefined;
  
  // If it's already a string, return it
  if (typeof date === 'string') return date;
  
  // If it's not a Date object, try to create one
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  // Check if it's a valid date
  if (isNaN(date.getTime())) return undefined;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Adds days to a date and returns a new Date object.
 */
export const addDays = (date: Date, days: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

/**
 * Subtracts days from a date and returns a new Date object.
 */
export const subtractDays = (date: Date, days: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() - days);
  return newDate;
};

/**
 * Adds days to a date without timezone issues
 * Alias for addDays for compatibility.
 */
export const addDaysToDate = (date: Date, days: number): Date => {
  return addDays(date, days);
};

/**
 * Subtracts days from a date without timezone issues
 * Alias for subtractDays for compatibility.
 */
export const subtractDaysFromDate = (date: Date, days: number): Date => {
  return subtractDays(date, days);
};

/**
 * Formats a date string (YYYY-MM-DD) to display format without timezone issues
 * This function parses the date string directly and formats it using the date components
 */
export const formatDateSafe = (dateString: string, formatType: 'short' | 'long' = 'short'): string => {
  // Parse YYYY-MM-DD directly to avoid timezone conversion
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed
  
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const longMonthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  if (formatType === 'long') {
    return `${longMonthNames[month - 1]} ${day}, ${year}`;
  }
  
  return `${monthNames[month - 1]} ${day}`;
};
/**
 * Date utility functions using local timezone
 * Fixes timezone bug where toISOString() returns UTC time
 */

/**
 * Get local date string in YYYY-MM-DD format
 * @param date - Date object (defaults to current date)
 * @returns string in YYYY-MM-DD format using local timezone
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get local datetime string in ISO-like format for display
 * @param date - Date object (defaults to current date)
 * @returns string in YYYY-MM-DDTHH:mm:ss format using local timezone
 */
export function getLocalDateTimeString(date: Date = new Date()): string {
  const dateStr = getLocalDateString(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${dateStr}T${hours}:${minutes}:${seconds}`;
}

/**
 * Parse a date string and return local date string
 * @param dateString - Date string to parse
 * @returns string in YYYY-MM-DD format
 */
export function parseToLocalDateString(dateString: string): string {
  const date = new Date(dateString);
  return getLocalDateString(date);
}

/**
 * Check if two dates are the same day (local timezone)
 * @param date1 - First date
 * @param date2 - Second date
 * @returns boolean
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return getLocalDateString(date1) === getLocalDateString(date2);
}

/**
 * Get date N days ago
 * @param days - Number of days ago
 * @returns Date object
 */
export function getDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Get date N days from now
 * @param days - Number of days in the future
 * @returns Date object
 */
export function getDaysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Calculate streak from an array of completed date strings
 * @param completedDates - Array of date strings in YYYY-MM-DD format
 * @returns number - current streak count
 */
export function calculateStreak(completedDates: string[]): number {
  if (!completedDates || completedDates.length === 0) return 0;
  
  // Sort dates descending
  const sortedDates = [...completedDates].sort((a, b) => b.localeCompare(a));
  
  const today = getLocalDateString();
  const yesterday = getLocalDateString(getDaysAgo(1));
  
  // Check if the most recent date is today or yesterday
  const mostRecent = sortedDates[0];
  if (mostRecent !== today && mostRecent !== yesterday) {
    return 0; // Streak is broken
  }
  
  let streak = 0;
  let checkDate = new Date();
  
  // If today is not completed, start from yesterday
  if (mostRecent === yesterday) {
    checkDate = getDaysAgo(1);
  }
  
  // Count consecutive days
  for (let i = 0; i < 365; i++) {
    const dateStr = getLocalDateString(checkDate);
    if (completedDates.includes(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

/**
 * Format a date string to display format
 * @param dateString - Date string in YYYY-MM-DD format
 * @param locale - Locale string (default: 'vi-VN')
 * @returns Formatted date string
 */
export function formatDisplayDate(dateString: string, locale: string = 'vi-VN'): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString(locale, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

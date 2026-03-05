// Local storage utilities for data persistence

export const STORAGE_KEYS = {
  USER: 'app_user',
  USERS: 'app_users', // List of all registered users for authentication
  TRANSACTIONS: 'app_transactions',
  BUDGETS: 'app_budgets',
  DEBTS: 'app_debts',
  INVESTMENTS: 'app_investments',
  SAVINGS_GOALS: 'app_savings_goals',
  TASKS: 'app_tasks',
  EVENTS: 'app_events',
  GOALS: 'app_goals',
  HABITS: 'app_habits',
  NOTES: 'app_notes',
  JOURNAL: 'app_journal',
  NOTIFICATIONS: 'app_notifications',
  ACTIVITIES: 'app_activities',
  DEMO_LOADED: 'app_demo_loaded',
};

// Keys that contain personal data (should only export/clear for current user)
// vs global keys that should be handled carefully
const USER_DATA_KEYS = [
  STORAGE_KEYS.USER,
  STORAGE_KEYS.TRANSACTIONS,
  STORAGE_KEYS.BUDGETS,
  STORAGE_KEYS.DEBTS,
  STORAGE_KEYS.INVESTMENTS,
  STORAGE_KEYS.SAVINGS_GOALS,
  STORAGE_KEYS.TASKS,
  STORAGE_KEYS.EVENTS,
  STORAGE_KEYS.GOALS,
  STORAGE_KEYS.HABITS,
  STORAGE_KEYS.NOTES,
  STORAGE_KEYS.JOURNAL,
  STORAGE_KEYS.NOTIFICATIONS,
  STORAGE_KEYS.ACTIVITIES,
  STORAGE_KEYS.DEMO_LOADED,
];

// Keys that should have null as default instead of []
const NULL_DEFAULT_KEYS = [STORAGE_KEYS.USER, STORAGE_KEYS.DEMO_LOADED];

export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to storage:', error);
  }
}

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error loading from storage:', error);
    return defaultValue;
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from storage:', error);
  }
}

/**
 * Generate unique ID with high entropy using crypto API
 * Uses crypto.randomUUID() for modern browsers, fallback to crypto.getRandomValues()
 */
export function generateId(): string {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback: Use crypto.getRandomValues for better entropy
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(4);
    crypto.getRandomValues(array);
    return Array.from(array, n => n.toString(16).padStart(8, '0')).join('-');
  }
  
  // Last resort fallback for very old browsers - use multiple sources of randomness
  const timestamp = Date.now().toString(36);
  const perfNow = (typeof performance !== 'undefined' ? performance.now() : 0).toString(36).replace('.', '');
  const randomPart1 = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${perfNow}-${randomPart1}${randomPart2}`;
}

/**
 * Export only current user's data (not other users' accounts)
 * This protects privacy when sharing backup files
 */
export function exportData(): string {
  const data: Record<string, unknown> = {};
  
  // Only export user data keys, NOT the global USERS list
  USER_DATA_KEYS.forEach((key) => {
    const defaultValue = NULL_DEFAULT_KEYS.includes(key) ? null : [];
    data[key] = loadFromStorage(key, defaultValue);
  });
  
  // DO NOT export STORAGE_KEYS.USERS - this contains other users' emails
  
  return JSON.stringify(data, null, 2);
}

/**
 * Validate user data structure to prevent crash when importing
 */
function isValidUser(user: unknown): boolean {
  if (user === null || user === undefined) return true; // null is valid (logged out)
  if (typeof user !== 'object' || Array.isArray(user)) return false;
  
  const u = user as Record<string, unknown>;
  // Check required fields
  if (typeof u.id !== 'string') return false;
  if (typeof u.email !== 'string') return false;
  if (typeof u.name !== 'string') return false;
  
  // Check settings object
  if (!u.settings || typeof u.settings !== 'object' || Array.isArray(u.settings)) return false;
  
  return true;
}

export function importData(jsonString: string): void {
  try {
    const data = JSON.parse(jsonString);
    
    // Validate user data before importing
    if (data[STORAGE_KEYS.USER] !== undefined) {
      if (!isValidUser(data[STORAGE_KEYS.USER])) {
        console.warn('Invalid user data in import, setting to null');
        data[STORAGE_KEYS.USER] = null;
      }
    }
    
    // DO NOT import USERS key from backup - this could overwrite other users' accounts
    // If the file contains USERS, skip it
    if (data[STORAGE_KEYS.USERS] !== undefined) {
      console.warn('Skipping USERS data in import for privacy/security');
      delete data[STORAGE_KEYS.USERS];
    }
    
    // Ensure arrays are arrays, not other types
    const arrayKeys = USER_DATA_KEYS.filter(k => !NULL_DEFAULT_KEYS.includes(k));
    arrayKeys.forEach(key => {
      if (data[key] !== undefined && !Array.isArray(data[key])) {
        console.warn(`Invalid data for ${key}, resetting to empty array`);
        data[key] = [];
      }
    });
    
    Object.entries(data).forEach(([key, value]) => {
      // Only import user data keys
      if (USER_DATA_KEYS.includes(key)) {
        saveToStorage(key, value);
      }
    });
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  }
}

/**
 * Clear only current user's data, NOT other users' accounts
 * This allows multiple users on same device without affecting each other
 */
export function clearAllData(): void {
  // Only clear user data, keep USERS list intact
  USER_DATA_KEYS.forEach((key) => {
    removeFromStorage(key);
  });
  
  // DO NOT clear STORAGE_KEYS.USERS - other users should still be able to login
}

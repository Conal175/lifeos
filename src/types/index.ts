// Type definitions for the application

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: number;
  notifications: {
    email: boolean;
    push: boolean;
    reminders: boolean;
  };
  settings: {
    theme: 'light' | 'dark';
    language: 'vi' | 'en' | 'zh';
    currency: string;
    fiscalYearStart: number;
  };
  hasSeenDemo?: boolean; // Flag to track if user has seen demo data
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  tags: string[];
  date: string;
}

export interface Budget {
  id: string;
  userId: string;
  name: string;
  category: string;
  limit: number;
  spent: number;
  period: 'week' | 'month';
  startDate: string;
}

export interface Debt {
  id: string;
  userId: string;
  type: 'owe' | 'owed';
  amount: number;
  person: string;
  description: string;
  dueDate: string;
  completed: boolean;
}

export interface Investment {
  id: string;
  userId: string;
  name: string;
  type: 'stock' | 'crypto' | 'gold' | 'other';
  quantity: number;
  avgPrice: number;
  currentPrice: number;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  icon: string;
  target: number;
  current: number;
  deadline: string;
  color: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  completed: boolean;
  subtasks: Subtask[];
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  category: string;
  assignee?: string;
  estimatedHours?: number;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  status: 'todo' | 'in_progress' | 'done';
  assignee?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  note?: string;
}

export interface Event {
  id: string;
  userId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  color: string;
  recurring?: 'daily' | 'weekly' | 'monthly';
  isTask?: boolean;
  taskId?: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  category: string;
  milestones: Milestone[];
  deadline: string;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  streak: number;
  completedDates: string[];
}

export interface Activity {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  unit: string;
  targetPerDay: number;
  logs: ActivityLog[];
}

export interface ActivityLog {
  date: string;
  value: number;
  note?: string;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Journal {
  id: string;
  userId: string;
  date: string;
  content: string;
  mood: number;
  attachments: string[];
  locked: boolean;
  weight?: number;
  sleepHours?: number;
  completedHabits?: string[]; // habit IDs completed that day
}

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// Storage mode type
export type StorageMode = 'local' | 'cloud';

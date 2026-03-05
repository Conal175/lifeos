import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Transaction, Budget, Debt, Investment, SavingsGoal, Task, Event, Goal, Habit, Note, Journal, Notification, Activity, Subtask } from '../types';
import { saveToStorage, loadFromStorage, STORAGE_KEYS, exportData, importData, clearAllData, generateId } from '../utils/storage';
import { getLocalDateString, calculateStreak } from '../utils/date';
import { 
  isSupabaseConfigured, 
  supabase, 
  onAuthStateChange,
  signOut as supabaseSignOut,
  fetchUserData,
  insertData,
  updateData,
  deleteData,
  fetchUserProfile,
  updateUserProfile,
  SupabaseUser,
  Session
} from '../lib/supabase';

interface AppContextType {
  // User & Auth
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isCloudMode: boolean;
  login: (email: string, password: string) => boolean;
  loginWithSupabase: (supabaseUser: SupabaseUser, session: Session) => Promise<void>;
  register: (email: string, password: string, name: string) => boolean;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  
  // Theme & Settings
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  language: 'vi' | 'en' | 'zh';
  setLanguage: (lang: 'vi' | 'en' | 'zh') => void;
  
  // Data Management - userId is auto-added by context, excluded from input
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  budgets: Budget[];
  addBudget: (budget: Omit<Budget, 'id' | 'spent' | 'userId'>) => void;
  updateBudget: (id: string, budget: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  recalculateBudgetSpent: () => void;
  
  debts: Debt[];
  addDebt: (debt: Omit<Debt, 'id' | 'completed' | 'userId'>) => void;
  updateDebt: (id: string, debt: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  completeDebt: (id: string, createTransaction?: boolean) => void;
  
  investments: Investment[];
  addInvestment: (investment: Omit<Investment, 'id' | 'userId'>) => void;
  updateInvestment: (id: string, investment: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;
  
  savingsGoals: SavingsGoal[];
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'userId'>) => void;
  updateSavingsGoal: (id: string, goal: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;
  addToSavingsGoal: (id: string, amount: number, createTransaction?: boolean) => void;
  withdrawFromSavingsGoal: (id: string, amount: number, createTransaction?: boolean) => void;
  
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'completed' | 'subtasks' | 'userId'>) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  addSubtask: (taskId: string, subtask: Omit<Subtask, 'id' | 'completed'>) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  updateSubtask: (taskId: string, subtaskId: string, data: Partial<Subtask>) => void;
  
  events: Event[];
  addEvent: (event: Omit<Event, 'id' | 'userId'>) => void;
  updateEvent: (id: string, event: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'userId'>) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  completeMilestone: (goalId: string, milestoneId: string) => void;
  
  habits: Habit[];
  addHabit: (habit: Omit<Habit, 'id' | 'streak' | 'completedDates' | 'userId'>) => void;
  updateHabit: (id: string, habit: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabit: (id: string, date: string) => void;
  
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void;
  updateNote: (id: string, note: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;
  
  journal: Journal[];
  addJournal: (journal: Omit<Journal, 'id' | 'userId'>) => void;
  updateJournal: (id: string, journal: Partial<Journal>) => void;
  deleteJournal: (id: string) => void;
  
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt' | 'userId'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  
  // Activities
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'logs' | 'userId'>) => void;
  updateActivity: (id: string, activity: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  logActivity: (id: string, date: string, value: number, note?: string) => void;

  // Data Export/Import
  exportData: () => void;
  importDataFromFile: (jsonString: string) => void;
  deleteAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultUser: User = {
  id: '1',
  email: '',
  name: '',
  avatar: 0,
  notifications: { email: true, push: true, reminders: true },
  settings: { theme: 'light', language: 'vi', currency: 'VND', fiscalYearStart: 1 },
};

/**
 * Deep merge user object, handling nested settings and notifications properly
 */
function deepMergeUser(target: User, source: Partial<User>): User {
  return {
    ...target,
    ...source,
    notifications: source.notifications 
      ? { ...target.notifications, ...source.notifications }
      : target.notifications,
    settings: source.settings
      ? { ...target.settings, ...source.settings }
      : target.settings,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  // Check if we're in cloud mode
  const isCloudMode = isSupabaseConfigured();
  
  // Loading state for initial auth check
  const [isLoading, setIsLoading] = useState(isCloudMode);
  
  // User state
  const [user, setUser] = useState<User | null>(() => {
    if (isCloudMode) return null; // Will be loaded from Supabase
    return loadFromStorage(STORAGE_KEYS.USER, null);
  });
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedUser = loadFromStorage<User | null>(STORAGE_KEYS.USER, null);
    return savedUser?.settings.theme || 'light';
  });
  
  const [language, setLanguageState] = useState<'vi' | 'en' | 'zh'>(() => {
    const savedUser = loadFromStorage<User | null>(STORAGE_KEYS.USER, null);
    return savedUser?.settings.language || 'vi';
  });

  // Data states - initially empty for cloud mode, loaded from storage for offline mode
  const [transactions, setTransactions] = useState<Transaction[]>(() => 
    isCloudMode ? [] : loadFromStorage(STORAGE_KEYS.TRANSACTIONS, [])
  );
  const [budgets, setBudgets] = useState<Budget[]>(() => 
    isCloudMode ? [] : loadFromStorage(STORAGE_KEYS.BUDGETS, [])
  );
  const [debts, setDebts] = useState<Debt[]>(() => 
    isCloudMode ? [] : loadFromStorage(STORAGE_KEYS.DEBTS, [])
  );
  const [investments, setInvestments] = useState<Investment[]>(() => 
    isCloudMode ? [] : loadFromStorage(STORAGE_KEYS.INVESTMENTS, [])
  );
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => 
    isCloudMode ? [] : loadFromStorage(STORAGE_KEYS.SAVINGS_GOALS, [])
  );
  const [tasks, setTasks] = useState<Task[]>(() => 
    isCloudMode ? [] : loadFromStorage(STORAGE_KEYS.TASKS, [])
  );
  const [events, setEvents] = useState<Event[]>(() => 
    isCloudMode ? [] : loadFromStorage(STORAGE_KEYS.EVENTS, [])
  );
  const [goals, setGoals] = useState<Goal[]>(() => 
    isCloudMode ? [] : loadFromStorage(STORAGE_KEYS.GOALS, [])
  );
  const [habits, setHabits] = useState<Habit[]>(() => 
    isCloudMode ? [] : loadFromStorage(STORAGE_KEYS.HABITS, [])
  );
  const [notes, setNotes] = useState<Note[]>(() => 
    isCloudMode ? [] : loadFromStorage(STORAGE_KEYS.NOTES, [])
  );
  const [journal, setJournal] = useState<Journal[]>(() => 
    isCloudMode ? [] : loadFromStorage(STORAGE_KEYS.JOURNAL, [])
  );
  const [notifications, setNotifications] = useState<Notification[]>(() => 
    isCloudMode ? [] : loadFromStorage(STORAGE_KEYS.NOTIFICATIONS, [])
  );
  const [activities, setActivities] = useState<Activity[]>(() => 
    isCloudMode ? [] : loadFromStorage(STORAGE_KEYS.ACTIVITIES, [])
  );

  // Subtask states storage for restore on uncomplete
  const [subtaskStatesBeforeComplete, setSubtaskStatesBeforeComplete] = useState<Map<string, Subtask[]>>(new Map());

  // ==================== SUPABASE AUTH LISTENER ====================
  useEffect(() => {
    if (!isCloudMode) {
      setIsLoading(false);
      return;
    }

    // Check initial session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadUserDataFromSupabase(session.user.id, session.user);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        setIsLoading(true);
        await loadUserDataFromSupabase(session.user.id, session.user);
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        // Clear all data on sign out
        setUser(null);
        setTransactions([]);
        setBudgets([]);
        setDebts([]);
        setInvestments([]);
        setSavingsGoals([]);
        setTasks([]);
        setEvents([]);
        setGoals([]);
        setHabits([]);
        setNotes([]);
        setJournal([]);
        setNotifications([]);
        setActivities([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isCloudMode]);

  // Load user data from Supabase
  const loadUserDataFromSupabase = async (userId: string, supabaseUser: SupabaseUser) => {
    try {
      // Load user profile
      const profile = await fetchUserProfile(userId);
      
      const loadedUser: User = {
        id: userId,
        email: supabaseUser.email || '',
        name: profile?.full_name || supabaseUser.user_metadata?.full_name || '',
        avatar: profile?.avatar || 0,
        notifications: profile?.notifications || { email: true, push: true, reminders: true },
        settings: profile?.settings || { theme: 'light', language: 'vi', currency: 'VND', fiscalYearStart: 1 },
      };
      
      setUser(loadedUser);
      setTheme(loadedUser.settings.theme);
      setLanguageState(loadedUser.settings.language);

      // Load all user data in parallel
      const [
        loadedTransactions,
        loadedBudgets,
        loadedDebts,
        loadedInvestments,
        loadedSavingsGoals,
        loadedTasks,
        loadedEvents,
        loadedGoals,
        loadedHabits,
        loadedNotes,
        loadedJournal,
        loadedNotifications,
        loadedActivities,
      ] = await Promise.all([
        fetchUserData<Transaction>('transactions'),
        fetchUserData<Budget>('budgets'),
        fetchUserData<Debt>('debts'),
        fetchUserData<Investment>('investments'),
        fetchUserData<SavingsGoal>('savings_goals'),
        fetchUserData<Task>('tasks'),
        fetchUserData<Event>('events'),
        fetchUserData<Goal>('goals'),
        fetchUserData<Habit>('habits'),
        fetchUserData<Note>('notes'),
        fetchUserData<Journal>('journal'),
        fetchUserData<Notification>('notifications'),
        fetchUserData<Activity>('activities'),
      ]);

      setTransactions(loadedTransactions);
      setBudgets(loadedBudgets);
      setDebts(loadedDebts);
      setInvestments(loadedInvestments);
      setSavingsGoals(loadedSavingsGoals);
      setTasks(loadedTasks);
      setEvents(loadedEvents);
      setGoals(loadedGoals);
      setHabits(loadedHabits);
      setNotes(loadedNotes);
      setJournal(loadedJournal);
      setNotifications(loadedNotifications);
      setActivities(loadedActivities);

    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // ==================== PERSIST DATA TO LOCALSTORAGE (OFFLINE MODE ONLY) ====================
  useEffect(() => {
    if (!isCloudMode) saveToStorage(STORAGE_KEYS.USER, user);
  }, [user, isCloudMode]);
  
  useEffect(() => {
    if (!isCloudMode) saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
  }, [transactions, isCloudMode]);
  
  useEffect(() => {
    if (!isCloudMode) saveToStorage(STORAGE_KEYS.BUDGETS, budgets);
  }, [budgets, isCloudMode]);
  
  useEffect(() => {
    if (!isCloudMode) saveToStorage(STORAGE_KEYS.DEBTS, debts);
  }, [debts, isCloudMode]);
  
  useEffect(() => {
    if (!isCloudMode) saveToStorage(STORAGE_KEYS.INVESTMENTS, investments);
  }, [investments, isCloudMode]);
  
  useEffect(() => {
    if (!isCloudMode) saveToStorage(STORAGE_KEYS.SAVINGS_GOALS, savingsGoals);
  }, [savingsGoals, isCloudMode]);
  
  useEffect(() => {
    if (!isCloudMode) saveToStorage(STORAGE_KEYS.TASKS, tasks);
  }, [tasks, isCloudMode]);
  
  useEffect(() => {
    if (!isCloudMode) saveToStorage(STORAGE_KEYS.EVENTS, events);
  }, [events, isCloudMode]);
  
  useEffect(() => {
    if (!isCloudMode) saveToStorage(STORAGE_KEYS.GOALS, goals);
  }, [goals, isCloudMode]);
  
  useEffect(() => {
    if (!isCloudMode) saveToStorage(STORAGE_KEYS.HABITS, habits);
  }, [habits, isCloudMode]);
  
  useEffect(() => {
    if (!isCloudMode) saveToStorage(STORAGE_KEYS.NOTES, notes);
  }, [notes, isCloudMode]);
  
  useEffect(() => {
    if (!isCloudMode) saveToStorage(STORAGE_KEYS.JOURNAL, journal);
  }, [journal, isCloudMode]);
  
  useEffect(() => {
    if (!isCloudMode) saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }, [notifications, isCloudMode]);
  
  useEffect(() => {
    if (!isCloudMode) saveToStorage(STORAGE_KEYS.ACTIVITIES, activities);
  }, [activities, isCloudMode]);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // ==================== BUDGET RECALCULATION ====================
  const recalculateBudgetSpent = useCallback(() => {
    setBudgets(prevBudgets => {
      return prevBudgets.map(budget => {
        if (!budget.startDate) return budget;
        
        const budgetStartDate = new Date(budget.startDate);
        budgetStartDate.setHours(0, 0, 0, 0);
        
        let endDate: Date;
        if (budget.period === 'week') {
          endDate = new Date(budgetStartDate);
          endDate.setDate(budgetStartDate.getDate() + 7);
        } else {
          endDate = new Date(budgetStartDate);
          endDate.setMonth(budgetStartDate.getMonth() + 1);
        }
        
        const startDateStr = `${budgetStartDate.getFullYear()}-${String(budgetStartDate.getMonth() + 1).padStart(2, '0')}-${String(budgetStartDate.getDate()).padStart(2, '0')}`;
        const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
        
        const spent = transactions
          .filter(t => 
            t.type === 'expense' &&
            t.category === budget.category &&
            t.date >= startDateStr &&
            t.date < endDateStr
          )
          .reduce((sum, t) => sum + t.amount, 0);
        
        return { ...budget, spent };
      });
    });
  }, [transactions]);

  useEffect(() => {
    recalculateBudgetSpent();
  }, [transactions, recalculateBudgetSpent]);

  // ==================== AUTH FUNCTIONS ====================
  
  // Local storage login (offline mode)
  const login = (email: string, password: string): boolean => {
    if (password.length < 6) return false;
    
    const storedUsers = loadFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    const foundUser = storedUsers.find(u => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      setTheme(foundUser.settings.theme);
      setLanguageState(foundUser.settings.language);
      return true;
    }
    return false;
  };

  // Supabase login handler
  const loginWithSupabase = async (supabaseUser: SupabaseUser, session: Session): Promise<void> => {
    if (!session || !supabaseUser) return;
    
    setIsLoading(true);
    await loadUserDataFromSupabase(supabaseUser.id, supabaseUser);
    setIsLoading(false);
  };

  // Local storage register (offline mode)
  const register = (email: string, password: string, name: string): boolean => {
    if (password.length < 6) return false;
    const storedUsers = loadFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    if (storedUsers.some(u => u.email === email)) return false;
    
    const newUser: User = { ...defaultUser, id: generateId(), email, name };
    storedUsers.push(newUser);
    saveToStorage(STORAGE_KEYS.USERS, storedUsers);
    return true;
  };

  const logout = async () => {
    if (isCloudMode) {
      try {
        await supabaseSignOut();
      } catch (error) {
        console.error('Error signing out:', error);
      }
    }
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updated = deepMergeUser(user, userData);
      setUser(updated);
      
      if (isCloudMode) {
        // Update in Supabase
        updateUserProfile(user.id, {
          full_name: updated.name,
          avatar: updated.avatar,
          notifications: updated.notifications,
          settings: updated.settings,
        });
      } else {
        // Update in localStorage
        const storedUsers = loadFromStorage<User[]>(STORAGE_KEYS.USERS, []);
        const index = storedUsers.findIndex(u => u.id === user.id);
        if (index !== -1) {
          storedUsers[index] = updated;
          saveToStorage(STORAGE_KEYS.USERS, storedUsers);
        }
      }
      
      if (updated.settings.theme !== theme) setTheme(updated.settings.theme);
      if (updated.settings.language !== language) setLanguageState(updated.settings.language);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (user) {
      updateUser({ settings: { ...user.settings, theme: newTheme } });
    }
  };

  const setLanguage = (lang: 'vi' | 'en' | 'zh') => {
    setLanguageState(lang);
    if (user) {
      updateUser({ settings: { ...user.settings, language: lang } });
    }
  };

  // ==================== HELPER: Update Parent Task Status ====================
  const updateParentTaskStatus = (task: Task): Task => {
    if (task.subtasks.length === 0) return task;
    
    const allSubtasksCompleted = task.subtasks.every(s => s.completed);
    const anySubtaskInProgress = task.subtasks.some(s => s.status === 'in_progress');
    const anySubtaskCompleted = task.subtasks.some(s => s.completed);
    
    let newStatus: Task['status'] = task.status;
    let newCompleted = task.completed;
    
    if (allSubtasksCompleted) {
      newStatus = 'done';
      newCompleted = true;
    } else if (anySubtaskInProgress || anySubtaskCompleted) {
      newStatus = 'in_progress';
      newCompleted = false;
    } else {
      newStatus = 'todo';
      newCompleted = false;
    }
    
    return {
      ...task,
      status: newStatus,
      completed: newCompleted,
      completedAt: newCompleted ? getLocalDateString() : undefined
    };
  };

  // ==================== TRANSACTION FUNCTIONS ====================
  const addTransaction = (transaction: Omit<Transaction, 'id' | 'userId'>) => {
    const newTransaction: Transaction = { 
      ...transaction, 
      id: generateId(),
      userId: user?.id || 'unknown'
    };
    setTransactions(prev => [newTransaction, ...prev]);
    
    if (isCloudMode) {
      insertData('transactions', newTransaction);
    }
  };

  const updateTransaction = (id: string, transaction: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...transaction } : t));
    
    if (isCloudMode) {
      updateData('transactions', id, transaction);
    }
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    
    if (isCloudMode) {
      deleteData('transactions', id);
    }
  };

  // ==================== BUDGET FUNCTIONS ====================
  const addBudget = (budget: Omit<Budget, 'id' | 'spent' | 'userId'>) => {
    const newBudget: Budget = { ...budget, id: generateId(), spent: 0, userId: user?.id || 'unknown' };
    setBudgets(prev => [...prev, newBudget]);
    
    if (isCloudMode) {
      insertData('budgets', newBudget);
    }
  };

  const updateBudget = (id: string, budget: Partial<Budget>) => {
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...budget } : b));
    
    if (isCloudMode) {
      updateData('budgets', id, budget);
    }
  };

  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
    
    if (isCloudMode) {
      deleteData('budgets', id);
    }
  };

  // ==================== DEBT FUNCTIONS ====================
  const addDebt = (debt: Omit<Debt, 'id' | 'completed' | 'userId'>) => {
    const newDebt: Debt = { ...debt, id: generateId(), completed: false, userId: user?.id || 'unknown' };
    setDebts(prev => [...prev, newDebt]);
    
    if (isCloudMode) {
      insertData('debts', newDebt);
    }
  };

  const updateDebt = (id: string, debt: Partial<Debt>) => {
    setDebts(prev => prev.map(d => d.id === id ? { ...d, ...debt } : d));
    
    if (isCloudMode) {
      updateData('debts', id, debt);
    }
  };

  const deleteDebt = (id: string) => {
    setDebts(prev => prev.filter(d => d.id !== id));
    
    if (isCloudMode) {
      deleteData('debts', id);
    }
  };

  const completeDebt = (id: string, createTransaction: boolean = false) => {
    const debt = debts.find(d => d.id === id);
    if (!debt) return;
    
    const newCompleted = !debt.completed;
    
    setDebts(prev => prev.map(d => d.id === id ? { ...d, completed: newCompleted } : d));
    
    if (isCloudMode) {
      updateData('debts', id, { completed: newCompleted });
    }
    
    if (createTransaction && newCompleted) {
      const transactionType = debt.type === 'owed' ? 'income' : 'expense';
      const description = debt.type === 'owed' 
        ? `Thu nợ từ ${debt.person}: ${debt.description}`
        : `Trả nợ cho ${debt.person}: ${debt.description}`;
      
      const newTransaction: Transaction = {
        id: generateId(),
        userId: user?.id || 'unknown',
        type: transactionType,
        amount: debt.amount,
        category: 'Khác',
        description,
        date: getLocalDateString(),
        tags: ['debt']
      };
      setTransactions(prev => [newTransaction, ...prev]);
      
      if (isCloudMode) {
        insertData('transactions', newTransaction);
      }
    }
  };

  // ==================== INVESTMENT FUNCTIONS ====================
  const addInvestment = (investment: Omit<Investment, 'id' | 'userId'>) => {
    const newInvestment: Investment = { ...investment, id: generateId(), userId: user?.id || 'unknown' };
    setInvestments(prev => [...prev, newInvestment]);
    
    if (isCloudMode) {
      insertData('investments', newInvestment);
    }
  };

  const updateInvestment = (id: string, investment: Partial<Investment>) => {
    setInvestments(prev => prev.map(i => i.id === id ? { ...i, ...investment } : i));
    
    if (isCloudMode) {
      updateData('investments', id, investment);
    }
  };

  const deleteInvestment = (id: string) => {
    setInvestments(prev => prev.filter(i => i.id !== id));
    
    if (isCloudMode) {
      deleteData('investments', id);
    }
  };

  // ==================== SAVINGS GOAL FUNCTIONS ====================
  const addSavingsGoal = (goal: Omit<SavingsGoal, 'id' | 'userId'>) => {
    const newGoal: SavingsGoal = { ...goal, id: generateId(), userId: user?.id || 'unknown' };
    setSavingsGoals(prev => [...prev, newGoal]);
    
    if (isCloudMode) {
      insertData('savings_goals', newGoal);
    }
  };

  const updateSavingsGoal = (id: string, goal: Partial<SavingsGoal>) => {
    setSavingsGoals(prev => prev.map(g => g.id === id ? { ...g, ...goal } : g));
    
    if (isCloudMode) {
      updateData('savings_goals', id, goal);
    }
  };

  const deleteSavingsGoal = (id: string) => {
    setSavingsGoals(prev => prev.filter(g => g.id !== id));
    
    if (isCloudMode) {
      deleteData('savings_goals', id);
    }
  };

  const addToSavingsGoal = (id: string, amount: number, createTransaction: boolean = false) => {
    const goal = savingsGoals.find(g => g.id === id);
    if (!goal) return;
    
    const newCurrent = goal.current + amount;
    setSavingsGoals(prev => prev.map(g => g.id === id ? { ...g, current: newCurrent } : g));
    
    if (isCloudMode) {
      updateData('savings_goals', id, { current: newCurrent });
    }
    
    if (createTransaction) {
      const newTransaction: Transaction = {
        id: generateId(),
        userId: user?.id || 'unknown',
        type: 'expense',
        amount,
        category: 'Tiết kiệm',
        description: `Nạp tiền vào quỹ: ${goal.name}`,
        date: getLocalDateString(),
        tags: ['savings', goal.name]
      };
      setTransactions(prev => [newTransaction, ...prev]);
      
      if (isCloudMode) {
        insertData('transactions', newTransaction);
      }
    }
  };

  const withdrawFromSavingsGoal = (id: string, amount: number, createTransaction: boolean = false) => {
    const goal = savingsGoals.find(g => g.id === id);
    if (!goal) return;
    
    const newCurrent = Math.max(0, goal.current - amount);
    setSavingsGoals(prev => prev.map(g => g.id === id ? { ...g, current: newCurrent } : g));
    
    if (isCloudMode) {
      updateData('savings_goals', id, { current: newCurrent });
    }
    
    if (createTransaction) {
      const newTransaction: Transaction = {
        id: generateId(),
        userId: user?.id || 'unknown',
        type: 'income',
        amount,
        category: 'Khác',
        description: `Rút tiền từ quỹ: ${goal.name}`,
        date: getLocalDateString(),
        tags: ['savings', goal.name]
      };
      setTransactions(prev => [newTransaction, ...prev]);
      
      if (isCloudMode) {
        insertData('transactions', newTransaction);
      }
    }
  };

  // ==================== TASK FUNCTIONS ====================
  const addTask = (task: Omit<Task, 'id' | 'completed' | 'subtasks' | 'userId'>) => {
    const newTask: Task = { 
      ...task, 
      id: generateId(), 
      userId: user?.id || 'unknown',
      completed: false, 
      subtasks: [], 
      status: task.status || 'todo', 
      createdAt: task.createdAt || getLocalDateString(), 
      category: task.category || 'Khác' 
    };
    setTasks(prev => [...prev, newTask]);
    
    if (isCloudMode) {
      insertData('tasks', newTask);
    }
  };

  const updateTask = (id: string, task: Partial<Task>) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, ...task };
      if (task.subtasks) {
        return updateParentTaskStatus(updated);
      }
      return updated;
    }));
    
    if (isCloudMode) {
      updateData('tasks', id, task);
    }
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setEvents(prev => prev.filter(e => e.taskId !== id));
    
    if (isCloudMode) {
      deleteData('tasks', id);
    }
  };

  const completeTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      
      const newCompleted = !t.completed;
      let updatedSubtasks: Subtask[];
      
      if (newCompleted) {
        setSubtaskStatesBeforeComplete(prevMap => {
          const newMap = new Map(prevMap);
          newMap.set(id, [...t.subtasks]);
          return newMap;
        });
        updatedSubtasks = t.subtasks.map(s => ({
          ...s,
          completed: true,
          status: 'done' as const
        }));
      } else {
        const savedStates = subtaskStatesBeforeComplete.get(id);
        if (savedStates) {
          updatedSubtasks = savedStates;
          setSubtaskStatesBeforeComplete(prevMap => {
            const newMap = new Map(prevMap);
            newMap.delete(id);
            return newMap;
          });
        } else {
          updatedSubtasks = t.subtasks;
        }
      }
      
      const updatedTask = { 
        ...t, 
        completed: newCompleted, 
        completedAt: newCompleted ? getLocalDateString() : undefined,
        status: newCompleted ? 'done' as const : (t.subtasks.some(s => s.status === 'in_progress' || s.completed) ? 'in_progress' as const : 'todo' as const),
        subtasks: updatedSubtasks
      };
      
      if (isCloudMode) {
        updateData('tasks', id, updatedTask);
      }
      
      return updatedTask;
    }));
  };

  const addSubtask = (taskId: string, subtask: Omit<Subtask, 'id' | 'completed'>) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      
      const newSubtask: Subtask = {
        ...subtask,
        id: generateId(),
        completed: false,
        status: subtask.status || 'todo'
      };
      
      const updated = updateParentTaskStatus({ ...t, subtasks: [...t.subtasks, newSubtask] });
      
      if (isCloudMode) {
        updateData('tasks', taskId, { subtasks: updated.subtasks });
      }
      
      return updated;
    }));
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      
      const updated = updateParentTaskStatus({ ...t, subtasks: t.subtasks.filter(s => s.id !== subtaskId) });
      
      if (isCloudMode) {
        updateData('tasks', taskId, { subtasks: updated.subtasks });
      }
      
      return updated;
    }));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      
      const updatedSubtasks = t.subtasks.map(s => {
        if (s.id !== subtaskId) return s;
        const newCompleted = !s.completed;
        const newStatus = newCompleted 
          ? 'done' as const
          : (s.status === 'done' ? 'todo' as const : s.status);
        return { ...s, completed: newCompleted, status: newStatus };
      });
      
      const updated = updateParentTaskStatus({ ...t, subtasks: updatedSubtasks });
      
      if (isCloudMode) {
        updateData('tasks', taskId, { subtasks: updated.subtasks, status: updated.status, completed: updated.completed });
      }
      
      return updated;
    }));
  };

  const updateSubtask = (taskId: string, subtaskId: string, data: Partial<Subtask>) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      
      const updatedSubtasks = t.subtasks.map(s => {
        if (s.id !== subtaskId) return s;
        const updated = { ...s, ...data };
        if (data.status !== undefined) {
          updated.completed = data.status === 'done';
        }
        if (data.completed !== undefined && data.status === undefined) {
          updated.status = data.completed ? 'done' : (s.status === 'done' ? 'todo' : s.status);
        }
        return updated;
      });
      
      const updated = updateParentTaskStatus({ ...t, subtasks: updatedSubtasks });
      
      if (isCloudMode) {
        updateData('tasks', taskId, { subtasks: updated.subtasks, status: updated.status, completed: updated.completed });
      }
      
      return updated;
    }));
  };

  // ==================== EVENT FUNCTIONS ====================
  const addEvent = (event: Omit<Event, 'id' | 'userId'>) => {
    const newEvent: Event = { ...event, id: generateId(), userId: user?.id || 'unknown' };
    setEvents(prev => [...prev, newEvent]);
    
    if (isCloudMode) {
      insertData('events', newEvent);
    }
  };

  const updateEvent = (id: string, event: Partial<Event>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...event } : e));
    
    if (isCloudMode) {
      updateData('events', id, event);
    }
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    
    if (isCloudMode) {
      deleteData('events', id);
    }
  };

  // ==================== GOAL FUNCTIONS ====================
  const addGoal = (goal: Omit<Goal, 'id' | 'userId'>) => {
    const newGoal: Goal = { ...goal, id: generateId(), userId: user?.id || 'unknown' };
    setGoals(prev => [...prev, newGoal]);
    
    if (isCloudMode) {
      insertData('goals', newGoal);
    }
  };

  const updateGoal = (id: string, goal: Partial<Goal>) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...goal } : g));
    
    if (isCloudMode) {
      updateData('goals', id, goal);
    }
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    
    if (isCloudMode) {
      deleteData('goals', id);
    }
  };

  const completeMilestone = (goalId: string, milestoneId: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g;
      const updatedMilestones = g.milestones.map(m => m.id === milestoneId ? { ...m, completed: !m.completed } : m);
      
      if (isCloudMode) {
        updateData('goals', goalId, { milestones: updatedMilestones });
      }
      
      return { ...g, milestones: updatedMilestones };
    }));
  };

  // ==================== HABIT FUNCTIONS ====================
  const addHabit = (habit: Omit<Habit, 'id' | 'streak' | 'completedDates' | 'userId'>) => {
    const newHabit: Habit = { ...habit, id: generateId(), userId: user?.id || 'unknown', streak: 0, completedDates: [] };
    setHabits(prev => [...prev, newHabit]);
    
    if (isCloudMode) {
      insertData('habits', newHabit);
    }
  };

  const updateHabit = (id: string, habit: Partial<Habit>) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...habit } : h));
    
    if (isCloudMode) {
      updateData('habits', id, habit);
    }
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setJournal(prev => prev.map(j => {
      if (!j.completedHabits || !j.completedHabits.includes(id)) return j;
      return { ...j, completedHabits: j.completedHabits.filter(hid => hid !== id) };
    }));
    
    if (isCloudMode) {
      deleteData('habits', id);
    }
  };

  const toggleHabit = (id: string, date: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      const isCompleted = h.completedDates.includes(date);
      let newDates = isCompleted 
        ? h.completedDates.filter(d => d !== date)
        : [...h.completedDates, date];
      
      newDates = newDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      const streak = calculateStreak(newDates);
      
      const updatedHabit = { ...h, completedDates: newDates, streak };
      
      if (isCloudMode) {
        updateData('habits', id, { completedDates: newDates, streak });
      }
      
      return updatedHabit;
    }));
  };

  // ==================== NOTE FUNCTIONS ====================
  const addNote = (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const now = getLocalDateString();
    const newNote: Note = { ...note, id: generateId(), userId: user?.id || 'unknown', createdAt: now, updatedAt: now };
    setNotes(prev => [...prev, newNote]);
    
    if (isCloudMode) {
      insertData('notes', newNote);
    }
  };

  const updateNote = (id: string, note: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...note, updatedAt: getLocalDateString() } : n));
    
    if (isCloudMode) {
      updateData('notes', id, { ...note, updatedAt: getLocalDateString() });
    }
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    
    if (isCloudMode) {
      deleteData('notes', id);
    }
  };

  const togglePinNote = (id: string) => {
    setNotes(prev => prev.map(n => {
      if (n.id !== id) return n;
      const newPinned = !n.pinned;
      
      if (isCloudMode) {
        updateData('notes', id, { pinned: newPinned });
      }
      
      return { ...n, pinned: newPinned };
    }));
  };

  // ==================== JOURNAL FUNCTIONS ====================
  const addJournal = (journalEntry: Omit<Journal, 'id' | 'userId'>) => {
    const newJournal: Journal = { ...journalEntry, id: generateId(), userId: user?.id || 'unknown' };
    setJournal(prev => [...prev, newJournal]);
    
    if (isCloudMode) {
      insertData('journal', newJournal);
    }
  };

  const updateJournal = (id: string, journalEntry: Partial<Journal>) => {
    setJournal(prev => prev.map(j => j.id === id ? { ...j, ...journalEntry } : j));
    
    if (isCloudMode) {
      updateData('journal', id, journalEntry);
    }
  };

  const deleteJournal = (id: string) => {
    setJournal(prev => prev.filter(j => j.id !== id));
    
    if (isCloudMode) {
      deleteData('journal', id);
    }
  };

  // ==================== NOTIFICATION FUNCTIONS ====================
  const addNotification = (notification: Omit<Notification, 'id' | 'read' | 'createdAt' | 'userId'>) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      userId: user?.id || 'unknown',
      read: false,
      createdAt: getLocalDateString()
    };
    setNotifications(prev => [newNotification, ...prev]);
    
    if (isCloudMode) {
      insertData('notifications', newNotification);
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    
    if (isCloudMode) {
      updateData('notifications', id, { read: true });
    }
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    
    if (isCloudMode) {
      notifications.forEach(n => {
        if (!n.read) updateData('notifications', n.id, { read: true });
      });
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    if (isCloudMode) {
      deleteData('notifications', id);
    }
  };

  // ==================== ACTIVITY FUNCTIONS ====================
  const addActivity = (activity: Omit<Activity, 'id' | 'logs' | 'userId'>) => {
    const newActivity: Activity = { ...activity, id: generateId(), userId: user?.id || 'unknown', logs: [] };
    setActivities(prev => [...prev, newActivity]);
    
    if (isCloudMode) {
      insertData('activities', newActivity);
    }
  };

  const updateActivity = (id: string, activity: Partial<Activity>) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, ...activity } : a));
    
    if (isCloudMode) {
      updateData('activities', id, activity);
    }
  };

  const deleteActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
    
    if (isCloudMode) {
      deleteData('activities', id);
    }
  };

  const logActivity = (id: string, date: string, value: number, note?: string) => {
    setActivities(prev => prev.map(a => {
      if (a.id !== id) return a;
      const existingIndex = a.logs.findIndex(l => l.date === date);
      let newLogs;
      if (existingIndex >= 0) {
        newLogs = [...a.logs];
        if (value === 0) {
          newLogs.splice(existingIndex, 1);
        } else {
          newLogs[existingIndex] = { date, value, note };
        }
      } else if (value > 0) {
        newLogs = [...a.logs, { date, value, note }];
      } else {
        newLogs = a.logs;
      }
      
      if (isCloudMode) {
        updateData('activities', id, { logs: newLogs });
      }
      
      return { ...a, logs: newLogs };
    }));
  };

  // ==================== DATA EXPORT/IMPORT ====================
  const handleExportData = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${getLocalDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDataFromFile = (jsonString: string) => {
    importData(jsonString);
    window.location.reload();
  };

  const deleteAllData = () => {
    clearAllData();
    setUser(null);
    window.location.reload();
  };

  return (
    <AppContext.Provider value={{
      user, isAuthenticated: !!user, isLoading, isCloudMode, login, loginWithSupabase, register, logout, updateUser,
      theme, toggleTheme, language, setLanguage,
      transactions, addTransaction, updateTransaction, deleteTransaction,
      budgets, addBudget, updateBudget, deleteBudget, recalculateBudgetSpent,
      debts, addDebt, updateDebt, deleteDebt, completeDebt,
      investments, addInvestment, updateInvestment, deleteInvestment,
      savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, addToSavingsGoal, withdrawFromSavingsGoal,
      tasks, addTask, updateTask, deleteTask, completeTask, addSubtask, deleteSubtask, toggleSubtask, updateSubtask,
      events, addEvent, updateEvent, deleteEvent,
      goals, addGoal, updateGoal, deleteGoal, completeMilestone,
      habits, addHabit, updateHabit, deleteHabit, toggleHabit,
      notes, addNote, updateNote, deleteNote, togglePinNote,
      journal, addJournal, updateJournal, deleteJournal,
      notifications, addNotification, markNotificationRead, markAllNotificationsRead, deleteNotification,
      activities, addActivity, updateActivity, deleteActivity, logActivity,
      exportData: handleExportData, importDataFromFile, deleteAllData
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

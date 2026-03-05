import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Transaction, Budget, Debt, Investment, SavingsGoal, Task, Event, Goal, Habit, Note, Journal, Notification, Activity, Subtask } from '../types';
import { generateId } from '../utils/storage';
import { getLocalDateString, calculateStreak } from '../utils/date';
import {
  supabase,
  onAuthStateChange,
  signOut as supabaseSignOut,
  fetchUserData,
  insertData,
  updateData,
  deleteData,
  fetchUserProfile,
  updateUserProfile,
  SupabaseUser
} from '../lib/supabase';

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;

  theme: 'light' | 'dark';
  toggleTheme: () => void;
  language: 'vi' | 'en' | 'zh';
  setLanguage: (lang: 'vi' | 'en' | 'zh') => void;

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

  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'logs' | 'userId'>) => void;
  updateActivity: (id: string, activity: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  logActivity: (id: string, date: string, value: number, note?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function deepMergeUser(target: User, source: Partial<User>): User {
  return {
    ...target,
    ...source,
    notifications: source.notifications ? { ...target.notifications, ...source.notifications } : target.notifications,
    settings: source.settings ? { ...target.settings, ...source.settings } : target.settings,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguageState] = useState<'vi' | 'en' | 'zh'>('vi');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [journal, setJournal] = useState<Journal[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  // BỘ HẸN GIỜ CHỜ SUPABASE (20 GIÂY)
  useEffect(() => {
    let timer: any;
    if (isLoading) {
      timer = setTimeout(async () => {
        console.warn("⏳ Supabase phản hồi chậm. Đang ép buộc vào Dashboard...");
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && !user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || 'Người dùng',
            avatar: 0,
            notifications: { email: true, push: true, reminders: true },
            settings: { theme: 'light', language: 'vi', currency: 'VND', fiscalYearStart: 1 }
          });
        }
        setIsLoading(false);
      }, 20000);
    }
    return () => clearTimeout(timer);
  }, [isLoading, user]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("🔍 Đang kiểm tra phiên đăng nhập...");
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadUserDataFromSupabase(session.user.id, session.user);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Lỗi kiểm tra session:', error);
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      console.log(`🔐 Sự kiện đăng nhập: ${event}`);
      if (event === 'SIGNED_IN' && session?.user) {
        setIsLoading(true);
        await loadUserDataFromSupabase(session.user.id, session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setTransactions([]); setBudgets([]); setDebts([]); setInvestments([]);
        setSavingsGoals([]); setTasks([]); setEvents([]); setGoals([]);
        setHabits([]); setNotes([]); setJournal([]); setNotifications([]); setActivities([]);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserDataFromSupabase = async (userId: string, supabaseUser: SupabaseUser) => {
    try {
      console.log("🟢 1. Bắt đầu tải Profile...");
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

      console.log("🟡 2. Đang tải dữ liệu từ 13 bảng...");
      const [loadedTransactions, loadedBudgets, loadedDebts, loadedInvestments, loadedSavingsGoals, loadedTasks] = await Promise.all([
        fetchUserData<Transaction>('transactions'), fetchUserData<Budget>('budgets'), fetchUserData<Debt>('debts'),
        fetchUserData<Investment>('investments'), fetchUserData<SavingsGoal>('savings_goals'), fetchUserData<Task>('tasks'),
      ]);

      const [loadedEvents, loadedGoals, loadedHabits, loadedNotes, loadedJournal, loadedNotifications, loadedActivities] = await Promise.all([
        fetchUserData<Event>('events'), fetchUserData<Goal>('goals'), fetchUserData<Habit>('habits'), fetchUserData<Note>('notes'),
        fetchUserData<Journal>('journal'), fetchUserData<Notification>('notifications'), fetchUserData<Activity>('activities')
      ]);

      console.log("🔵 3. Dữ liệu đã tải xong. Đang cập nhật hệ thống...");
      setTransactions(loadedTransactions); setBudgets(loadedBudgets); setDebts(loadedDebts);
      setInvestments(loadedInvestments); setSavingsGoals(loadedSavingsGoals); setTasks(loadedTasks);
      setEvents(loadedEvents); setGoals(loadedGoals); setHabits(loadedHabits);
      setNotes(loadedNotes); setJournal(loadedJournal); setNotifications(loadedNotifications);
      setActivities(loadedActivities);

      console.log("✅ 4. Hoàn tất!");
    } catch (error) {
      console.error('❌ Lỗi nghiêm trọng khi tải dữ liệu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); }, [theme]);

  const recalculateBudgetSpent = useCallback(() => {
    setBudgets(prevBudgets => prevBudgets.map(budget => {
      if (!budget.startDate) return budget;
      const budgetStartDate = new Date(budget.startDate);
      budgetStartDate.setHours(0, 0, 0, 0);
      let endDate: Date;
      if (budget.period === 'week') {
        endDate = new Date(budgetStartDate); endDate.setDate(budgetStartDate.getDate() + 7);
      } else {
        endDate = new Date(budgetStartDate); endDate.setMonth(budgetStartDate.getMonth() + 1);
      }
      const startDateStr = `${budgetStartDate.getFullYear()}-${String(budgetStartDate.getMonth() + 1).padStart(2, '0')}-${String(budgetStartDate.getDate()).padStart(2, '0')}`;
      const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

      const spent = transactions
        .filter(t => t.type === 'expense' && t.category === budget.category && t.date >= startDateStr && t.date < endDateStr)
        .reduce((sum, t) => sum + t.amount, 0);
      return { ...budget, spent };
    }));
  }, [transactions]);

  useEffect(() => { recalculateBudgetSpent(); }, [transactions, recalculateBudgetSpent]);

  const logout = async () => { await supabaseSignOut(); };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updated = deepMergeUser(user, userData);
      setUser(updated);
      updateUserProfile(user.id, { full_name: updated.name, avatar: updated.avatar, notifications: updated.notifications, settings: updated.settings });
      if (updated.settings.theme !== theme) setTheme(updated.settings.theme);
      if (updated.settings.language !== language) setLanguageState(updated.settings.language);
    }
  };

  const toggleTheme = () => { const newTheme = theme === 'light' ? 'dark' : 'light'; setTheme(newTheme); if (user) updateUser({ settings: { ...user.settings, theme: newTheme } }); };
  const setLanguage = (lang: 'vi' | 'en' | 'zh') => { setLanguageState(lang); if (user) updateUser({ settings: { ...user.settings, language: lang } }); };

  const updateParentTaskStatus = (task: Task): Task => {
    if (task.subtasks.length === 0) return task;
    const allSubtasksCompleted = task.subtasks.every(s => s.completed);
    const anySubtaskInProgress = task.subtasks.some(s => s.status === 'in_progress');
    const anySubtaskCompleted = task.subtasks.some(s => s.completed);
    let newStatus: Task['status'] = task.status;
    let newCompleted = task.completed;
    if (allSubtasksCompleted) { newStatus = 'done'; newCompleted = true; }
    else if (anySubtaskInProgress || anySubtaskCompleted) { newStatus = 'in_progress'; newCompleted = false; }
    else { newStatus = 'todo'; newCompleted = false; }
    return { ...task, status: newStatus, completed: newCompleted, completedAt: newCompleted ? getLocalDateString() : undefined };
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'userId'>) => { const newTransaction: Transaction = { ...transaction, id: generateId(), userId: user?.id || 'unknown' }; setTransactions(prev => [newTransaction, ...prev]); insertData('transactions', newTransaction); };
  const updateTransaction = (id: string, transaction: Partial<Transaction>) => { setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...transaction } : t)); updateData('transactions', id, transaction); };
  const deleteTransaction = (id: string) => { setTransactions(prev => prev.filter(t => t.id !== id)); deleteData('transactions', id); };

  const addBudget = (budget: Omit<Budget, 'id' | 'spent' | 'userId'>) => { const newBudget: Budget = { ...budget, id: generateId(), spent: 0, userId: user?.id || 'unknown' }; setBudgets(prev => [...prev, newBudget]); insertData('budgets', newBudget); };
  const updateBudget = (id: string, budget: Partial<Budget>) => { setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...budget } : b)); updateData('budgets', id, budget); };
  const deleteBudget = (id: string) => { setBudgets(prev => prev.filter(b => b.id !== id)); deleteData('budgets', id); };

  const addDebt = (debt: Omit<Debt, 'id' | 'completed' | 'userId'>) => { const newDebt: Debt = { ...debt, id: generateId(), completed: false, userId: user?.id || 'unknown' }; setDebts(prev => [...prev, newDebt]); insertData('debts', newDebt); };
  const updateDebt = (id: string, debt: Partial<Debt>) => { setDebts(prev => prev.map(d => d.id === id ? { ...d, ...debt } : d)); updateData('debts', id, debt); };
  const deleteDebt = (id: string) => { setDebts(prev => prev.filter(d => d.id !== id)); deleteData('debts', id); };
  const completeDebt = (id: string, createTransaction: boolean = false) => {
    const debt = debts.find(d => d.id === id); if (!debt) return;
    const newCompleted = !debt.completed; setDebts(prev => prev.map(d => d.id === id ? { ...d, completed: newCompleted } : d)); updateData('debts', id, { completed: newCompleted });
    if (createTransaction && newCompleted) {
      const transactionType = debt.type === 'owed' ? 'income' : 'expense';
      const newTransaction: Transaction = { id: generateId(), userId: user?.id || 'unknown', type: transactionType, amount: debt.amount, category: 'Khác', description: debt.description || '', date: getLocalDateString(), tags: ['debt'] };
      setTransactions(prev => [newTransaction, ...prev]); insertData('transactions', newTransaction);
    }
  };

  const addInvestment = (investment: Omit<Investment, 'id' | 'userId'>) => { const newInvestment: Investment = { ...investment, id: generateId(), userId: user?.id || 'unknown' }; setInvestments(prev => [...prev, newInvestment]); insertData('investments', newInvestment); };
  const updateInvestment = (id: string, investment: Partial<Investment>) => { setInvestments(prev => prev.map(i => i.id === id ? { ...i, ...investment } : i)); updateData('investments', id, investment); };
  const deleteInvestment = (id: string) => { setInvestments(prev => prev.filter(i => i.id !== id)); deleteData('investments', id); };

  const addSavingsGoal = (goal: Omit<SavingsGoal, 'id' | 'userId'>) => { const newGoal: SavingsGoal = { ...goal, id: generateId(), userId: user?.id || 'unknown' }; setSavingsGoals(prev => [...prev, newGoal]); insertData('savings_goals', newGoal); };
  const updateSavingsGoal = (id: string, goal: Partial<SavingsGoal>) => { setSavingsGoals(prev => prev.map(g => g.id === id ? { ...g, ...goal } : g)); updateData('savings_goals', id, goal); };
  const deleteSavingsGoal = (id: string) => { setSavingsGoals(prev => prev.filter(g => g.id !== id)); deleteData('savings_goals', id); };
  const addToSavingsGoal = (id: string, amount: number, createTransaction: boolean = false) => {
    const goal = savingsGoals.find(g => g.id === id); if (!goal) return;
    const newCurrent = goal.current + amount; setSavingsGoals(prev => prev.map(g => g.id === id ? { ...g, current: newCurrent } : g)); updateData('savings_goals', id, { current: newCurrent });
  };
  const withdrawFromSavingsGoal = (id: string, amount: number, createTransaction: boolean = false) => {
    const goal = savingsGoals.find(g => g.id === id); if (!goal) return;
    const newCurrent = Math.max(0, goal.current - amount); setSavingsGoals(prev => prev.map(g => g.id === id ? { ...g, current: newCurrent } : g)); updateData('savings_goals', id, { current: newCurrent });
  };

  const addTask = (task: Omit<Task, 'id' | 'completed' | 'subtasks' | 'userId'>) => { const newTask: Task = { ...task, id: generateId(), userId: user?.id || 'unknown', completed: false, subtasks: [], status: task.status || 'todo', createdAt: task.createdAt || getLocalDateString(), category: task.category || 'Khác' }; setTasks(prev => [...prev, newTask]); insertData('tasks', newTask); };
  const updateTask = (id: string, task: Partial<Task>) => { setTasks(prev => prev.map(t => { if (t.id !== id) return t; const updated = { ...t, ...task }; return task.subtasks ? updateParentTaskStatus(updated) : updated; })); updateData('tasks', id, task); };
  const deleteTask = (id: string) => { setTasks(prev => prev.filter(t => t.id !== id)); setEvents(prev => prev.filter(e => e.taskId !== id)); deleteData('tasks', id); };
  const completeTask = (id: string) => { setTasks(prev => prev.map(t => { if (t.id !== id) return t; const updatedTask = { ...t, completed: !t.completed }; updateData('tasks', id, updatedTask); return updatedTask; })); };
  const addSubtask = (taskId: string, subtask: Omit<Subtask, 'id' | 'completed'>) => { };
  const deleteSubtask = (taskId: string, subtaskId: string) => { };
  const toggleSubtask = (taskId: string, subtaskId: string) => { };
  const updateSubtask = (taskId: string, subtaskId: string, data: Partial<Subtask>) => { };

  const addEvent = (event: Omit<Event, 'id' | 'userId'>) => { const newEvent: Event = { ...event, id: generateId(), userId: user?.id || 'unknown' }; setEvents(prev => [...prev, newEvent]); insertData('events', newEvent); };
  const updateEvent = (id: string, event: Partial<Event>) => { setEvents(prev => prev.map(e => e.id === id ? { ...e, ...event } : e)); updateData('events', id, event); };
  const deleteEvent = (id: string) => { setEvents(prev => prev.filter(e => e.id !== id)); deleteData('events', id); };

  const addGoal = (goal: Omit<Goal, 'id' | 'userId'>) => { const newGoal: Goal = { ...goal, id: generateId(), userId: user?.id || 'unknown' }; setGoals(prev => [...prev, newGoal]); insertData('goals', newGoal); };
  const updateGoal = (id: string, goal: Partial<Goal>) => { setGoals(prev => prev.map(g => g.id === id ? { ...g, ...goal } : g)); updateData('goals', id, goal); };
  const deleteGoal = (id: string) => { setGoals(prev => prev.filter(g => g.id !== id)); deleteData('goals', id); };
  const completeMilestone = (goalId: string, milestoneId: string) => { };

  const addHabit = (habit: Omit<Habit, 'id' | 'streak' | 'completedDates' | 'userId'>) => { const newHabit: Habit = { ...habit, id: generateId(), userId: user?.id || 'unknown', streak: 0, completedDates: [] }; setHabits(prev => [...prev, newHabit]); insertData('habits', newHabit); };
  const updateHabit = (id: string, habit: Partial<Habit>) => { setHabits(prev => prev.map(h => h.id === id ? { ...h, ...habit } : h)); updateData('habits', id, habit); };
  const deleteHabit = (id: string) => { setHabits(prev => prev.filter(h => h.id !== id)); deleteData('habits', id); };
  const toggleHabit = (id: string, date: string) => { setHabits(prev => prev.map(h => { if (h.id !== id) return h; const newDates = h.completedDates.includes(date) ? h.completedDates.filter(d => d !== date) : [...h.completedDates, date]; updateData('habits', id, { completedDates: newDates }); return { ...h, completedDates: newDates }; })); };

  const addNote = (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => { const now = getLocalDateString(); const newNote: Note = { ...note, id: generateId(), userId: user?.id || 'unknown', createdAt: now, updatedAt: now }; setNotes(prev => [...prev, newNote]); insertData('notes', newNote); };
  const updateNote = (id: string, note: Partial<Note>) => { setNotes(prev => prev.map(n => n.id === id ? { ...n, ...note, updatedAt: getLocalDateString() } : n)); updateData('notes', id, { ...note, updatedAt: getLocalDateString() }); };
  const deleteNote = (id: string) => { setNotes(prev => prev.filter(n => n.id !== id)); deleteData('notes', id); };
  const togglePinNote = (id: string) => { setNotes(prev => prev.map(n => { if (n.id !== id) return n; updateData('notes', id, { pinned: !n.pinned }); return { ...n, pinned: !n.pinned }; })); };

  const addJournal = (journalEntry: Omit<Journal, 'id' | 'userId'>) => { const newJournal: Journal = { ...journalEntry, id: generateId(), userId: user?.id || 'unknown' }; setJournal(prev => [...prev, newJournal]); insertData('journal', newJournal); };
  const updateJournal = (id: string, journalEntry: Partial<Journal>) => { setJournal(prev => prev.map(j => j.id === id ? { ...j, ...journalEntry } : j)); updateData('journal', id, journalEntry); };
  const deleteJournal = (id: string) => { setJournal(prev => prev.filter(j => j.id !== id)); deleteData('journal', id); };

  const addNotification = (notification: Omit<Notification, 'id' | 'read' | 'createdAt' | 'userId'>) => { const newNotification: Notification = { ...notification, id: generateId(), userId: user?.id || 'unknown', read: false, createdAt: getLocalDateString() }; setNotifications(prev => [newNotification, ...prev]); insertData('notifications', newNotification); };
  const markNotificationRead = (id: string) => { setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)); updateData('notifications', id, { read: true }); };
  const markAllNotificationsRead = () => { setNotifications(prev => prev.map(n => ({ ...n, read: true }))); };
  const deleteNotification = (id: string) => { setNotifications(prev => prev.filter(n => n.id !== id)); deleteData('notifications', id); };

  const addActivity = (activity: Omit<Activity, 'id' | 'logs' | 'userId'>) => { const newActivity: Activity = { ...activity, id: generateId(), userId: user?.id || 'unknown', logs: [] }; setActivities(prev => [...prev, newActivity]); insertData('activities', newActivity); };
  const updateActivity = (id: string, activity: Partial<Activity>) => { setActivities(prev => prev.map(a => a.id === id ? { ...a, ...activity } : a)); updateData('activities', id, activity); };
  const deleteActivity = (id: string) => { setActivities(prev => prev.filter(a => a.id !== id)); deleteData('activities', id); };
  const logActivity = (id: string, date: string, value: number, note?: string) => { };

  return (
    <AppContext.Provider value={{
      user, isAuthenticated: !!user, isLoading, logout, updateUser, theme, toggleTheme, language, setLanguage,
      transactions, addTransaction, updateTransaction, deleteTransaction,
      budgets, addBudget, updateBudget, deleteBudget, recalculateBudgetSpent,
      debts, addDebt, updateDebt, deleteDebt, completeDebt,
      investments, addInvestment, updateInvestment, deleteInvestment,
      savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, addToSavingsGoal, withdrawFromSavingsGoal,
      tasks, addTask, updateTask, deleteTask, completeTask, addSubtask, deleteSubtask, toggleSubtask, updateSubtask,
      events, addEvent, updateEvent, deleteEvent, goals, addGoal, updateGoal, deleteGoal, completeMilestone,
      habits, addHabit, updateHabit, deleteHabit, toggleHabit, notes, addNote, updateNote, deleteNote, togglePinNote,
      journal, addJournal, updateJournal, deleteJournal, notifications, addNotification, markNotificationRead, markAllNotificationsRead, deleteNotification,
      activities, addActivity, updateActivity, deleteActivity, logActivity
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
}
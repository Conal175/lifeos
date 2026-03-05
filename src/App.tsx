import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Finance } from './pages/Finance';
import { Budgets } from './pages/Budgets';
import { Goals } from './pages/Goals';
import { Tasks } from './pages/Tasks';
import { CalendarPage } from './pages/Calendar';
import { Notes } from './pages/Notes';
import { JournalPage } from './pages/Journal';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { SelfDevelopment } from './pages/SelfDevelopment';
import { Investments } from './pages/Investments';
import { useEffect, useRef, useState } from 'react';
import { demoTransactions, demoBudgets, demoDebts, demoInvestments, demoSavingsGoals, demoTasks, demoEvents, demoGoals, demoHabits, demoNotes, demoJournal, demoNotifications, demoActivities } from './data/demo';
import { STORAGE_KEYS, saveToStorage, loadFromStorage } from './utils/storage';

/**
 * Flush localStorage by reading back a value - ensures all writes are completed
 */
function flushLocalStorage(): Promise<void> {
  return new Promise((resolve) => {
    const testKey = '__flush_test__';
    localStorage.setItem(testKey, 'flush');
    localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function DemoDataLoader({ children }: { children: React.ReactNode }) {
  const ctx = useApp();
  const loaded = useRef(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if demo data was already loaded for THIS user (fixes multi-user bug)
    const userDemoLoadedKey = `${STORAGE_KEYS.DEMO_LOADED}_${ctx.user?.id}`;
    const userDemoLoaded = loadFromStorage<boolean>(userDemoLoadedKey, false);
    
    if (ctx.isAuthenticated && !loaded.current && !userDemoLoaded && ctx.user) {
      loaded.current = true;
      setIsLoading(true);
      
      // Mark demo as loaded for THIS user only
      saveToStorage(userDemoLoadedKey, true);
      
      // Add userId to demo transactions for the current user
      const transactionsWithUserId = demoTransactions.map(t => ({
        ...t,
        userId: ctx.user!.id
      }));
      
      // Save demo data directly to localStorage
      saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactionsWithUserId);
      saveToStorage(STORAGE_KEYS.BUDGETS, demoBudgets);
      saveToStorage(STORAGE_KEYS.DEBTS, demoDebts);
      saveToStorage(STORAGE_KEYS.INVESTMENTS, demoInvestments);
      saveToStorage(STORAGE_KEYS.SAVINGS_GOALS, demoSavingsGoals);
      saveToStorage(STORAGE_KEYS.TASKS, demoTasks);
      saveToStorage(STORAGE_KEYS.EVENTS, demoEvents);
      saveToStorage(STORAGE_KEYS.GOALS, demoGoals);
      saveToStorage(STORAGE_KEYS.HABITS, demoHabits);
      saveToStorage(STORAGE_KEYS.NOTES, demoNotes);
      saveToStorage(STORAGE_KEYS.JOURNAL, demoJournal);
      saveToStorage(STORAGE_KEYS.NOTIFICATIONS, demoNotifications);
      saveToStorage(STORAGE_KEYS.ACTIVITIES, demoActivities);
      
      flushLocalStorage().then(() => {
        window.location.reload();
      });
    }
  }, [ctx.isAuthenticated, ctx.user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Đang tải dữ liệu mẫu...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp();
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { isAuthenticated } = useApp();

  return (
    <DemoDataLoader>
      <Routes>
        <Route path="/auth" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Auth />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/finance" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
        <Route path="/budgets" element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
        <Route path="/investments" element={<ProtectedRoute><Investments /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
        <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
        <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
        <Route path="/self-development" element={<ProtectedRoute><SelfDevelopment /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/auth"} replace />} />
      </Routes>
    </DemoDataLoader>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}

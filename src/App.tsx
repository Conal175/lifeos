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

// Component bảo vệ route, chỉ cho phép vào khi đã đăng nhập
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useApp();

  // Nếu đang tải/kiểm tra token từ Supabase thì không làm gì cả
  if (isLoading) return null;

  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useApp();

  // Hiển thị màn hình chờ khi Supabase đang xử lý đăng nhập
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
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
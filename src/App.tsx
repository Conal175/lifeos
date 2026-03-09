import React, { Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

// Khởi tạo bộ nhớ đệm của React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Lưu cache 5 phút
      retry: 1,
    },
  },
});

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('UI Crash Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-8">
          <h1 className="text-3xl font-bold text-red-600 mb-4">⚠️ Lỗi Hiển Thị Dashboard</h1>
          <p className="text-gray-700 mb-4">Giao diện đang cố đọc một dữ liệu bị thiếu. Vui lòng copy đoạn lỗi dưới đây gửi cho tôi:</p>
          <pre className="bg-white p-6 rounded shadow-lg text-sm text-red-500 overflow-auto w-full max-w-4xl border border-red-200">
            <strong>{this.state.error?.message}</strong>
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium">
            Tải lại trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useApp();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <Layout><ErrorBoundary>{children}</ErrorBoundary></Layout>;
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-white font-medium text-lg">Đang tải và đồng bộ dữ liệu...</p>
        <p className="text-white/70 text-sm mt-2">Đang kết nối với Supabase...</p>
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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppProvider>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </AppProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

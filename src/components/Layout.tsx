import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, Wallet, CheckSquare,
  BookOpen, FileBarChart, Settings, Bell,
  Menu, X, LogOut, User, Moon, Sun, Globe,
  ChevronDown, ChevronRight, Sparkles
} from 'lucide-react';

interface NavGroup {
  label: string;
  icon: React.ElementType;
  children: { label: string; path: string; emoji: string }[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Tài chính',
    icon: Wallet,
    children: [
      { label: 'Giao dịch', path: '/finance', emoji: '💰' },
      { label: 'Ngân sách & Nợ', path: '/budgets', emoji: '📊' },
      { label: 'Quỹ tiết kiệm', path: '/goals', emoji: '🐷' },
      { label: 'Đầu tư', path: '/investments', emoji: '💹' },
    ],
  },
  {
    label: 'Công việc',
    icon: CheckSquare,
    children: [
      { label: 'Quản lý công việc', path: '/tasks', emoji: '✅' },
      { label: 'Lịch & Sự kiện', path: '/calendar', emoji: '📅' },
    ],
  },
  {
    label: 'Nhật ký',
    icon: BookOpen,
    children: [
      { label: 'Ghi chú', path: '/notes', emoji: '📝' },
      { label: 'Nhật ký cá nhân', path: '/journal', emoji: '📔' },
    ],
  },
];

const standaloneItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, emoji: '🏠' },
];

const standaloneItems2 = [
  { label: 'Phát triển bản thân', path: '/self-development', icon: Sparkles, emoji: '🌱' },
  { label: 'Báo cáo', path: '/reports', icon: FileBarChart, emoji: '📈' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, theme, toggleTheme, notifications, language, setLanguage } = useApp();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const set = new Set<string>();
    navGroups.forEach(g => {
      if (g.children.some(c => location.pathname === c.path)) set.add(g.label);
    });
    return set;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const avatars = ['👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼'];

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  };

  const isGroupActive = (group: NavGroup) => group.children.some(c => location.pathname === c.path);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-30">
        <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Life OS</h1>
        <div className="flex items-center gap-1">
          <button onClick={toggleTheme} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 relative hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 z-50 transform transition-transform lg:translate-x-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="p-4 border-b dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ✨ Life OS
            </h1>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-3 border-b dark:border-gray-700 flex-shrink-0">
          <div className="relative">
            <button onClick={() => setShowProfile(!showProfile)} className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-full flex items-center justify-center text-lg">
                {avatars[user?.avatar || 0]}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              </div>
            </button>

            {showProfile && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 p-2 z-50">
                <div className="space-y-1">
                  <Link to="/settings" onClick={() => setShowProfile(false)} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm">
                    <User className="w-4 h-4" /> Hồ sơ
                  </Link>
                  <button onClick={() => { toggleTheme(); setShowProfile(false); }} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg w-full text-sm">
                    {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    {theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}
                  </button>
                  <div className="flex items-center gap-2 p-2">
                    <Globe className="w-4 h-4" />
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as 'vi' | 'en' | 'zh')}
                      className="flex-1 bg-transparent text-sm dark:text-white"
                    >
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">English</option>
                      <option value="zh">中文</option>
                    </select>
                  </div>
                  <hr className="dark:border-gray-700" />
                  <button onClick={logout} className="flex items-center gap-2 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg w-full text-sm">
                    <LogOut className="w-4 h-4" /> Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation - scrollable area */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {/* Dashboard */}
            {standaloneItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/25'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}

            {/* Separator */}
            <li className="pt-2 pb-1">
              <span className="px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Quản lý</span>
            </li>

            {/* Grouped Navigation */}
            {navGroups.map(group => {
              const Icon = group.icon;
              const isExpanded = expandedGroups.has(group.label);
              const isActive = isGroupActive(group);
              return (
                <li key={group.label}>
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                      isActive && !isExpanded
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1 text-left">{group.label}</span>
                    {isExpanded
                      ? <ChevronDown className="w-4 h-4 text-gray-400" />
                      : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </button>
                  {isExpanded && (
                    <ul className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                      {group.children.map(child => {
                        const isChildActive = location.pathname === child.path;
                        return (
                          <li key={child.path}>
                            <Link
                              to={child.path}
                              onClick={() => setSidebarOpen(false)}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm ${
                                isChildActive
                                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-medium'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                              }`}
                            >
                              <span className="text-base">{child.emoji}</span>
                              <span>{child.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}

            {/* Separator */}
            <li className="pt-2 pb-1">
              <span className="px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Khác</span>
            </li>

            {/* Standalone items 2 */}
            {standaloneItems2.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/25'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Settings at Bottom */}
        <div className="flex-shrink-0 p-3 border-t dark:border-gray-700">
          <Link
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
              location.pathname === '/settings'
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Cài đặt</span>
          </Link>
        </div>
      </aside>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
          <div className="fixed top-16 right-4 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border dark:border-gray-700 z-50 overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">🔔 Thông báo</h3>
              <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-white/50 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-6 text-gray-500 dark:text-gray-400 text-center text-sm">Không có thông báo</p>
              ) : (
                notifications.slice(0, 10).map(n => (
                  <div key={n.id} className={`p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!n.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-sm mt-0.5">
                        {n.type === 'info' ? 'ℹ️' : n.type === 'success' ? '✅' : n.type === 'warning' ? '⚠️' : '❌'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{n.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
                      </div>
                      {!n.read && <span className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}

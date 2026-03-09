import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User } from '../types';
import { supabase, onAuthStateChange, signOut as supabaseSignOut, fetchUserProfile, updateUserProfile, SupabaseUser } from '../lib/supabase';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function deepMergeUser(target: User, source: Partial<User>): User {
  return { ...target, ...source, notifications: source.notifications ? { ...target.notifications, ...source.notifications } : target.notifications, settings: source.settings ? { ...target.settings, ...source.settings } : target.settings };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguageState] = useState<'vi' | 'en' | 'zh'>('vi');
  const fetchedUserId = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Hàm chuyên dụng tải Profile người dùng
    const loadProfile = async (sessionUser: SupabaseUser) => {
      if (fetchedUserId.current === sessionUser.id) return;
      setIsLoading(true);
      fetchedUserId.current = sessionUser.id;

      try {
        const profile = await fetchUserProfile(sessionUser.id);
        if (isMounted) {
          const loadedUser: User = {
            id: sessionUser.id,
            email: sessionUser.email || '',
            name: profile?.full_name || sessionUser.user_metadata?.full_name || '',
            avatar: profile?.avatar || 0,
            notifications: profile?.notifications || { email: true, push: true, reminders: true },
            settings: profile?.settings || { theme: 'light', language: 'vi', currency: 'VND', fiscalYearStart: 1 },
          };
          setUser(loadedUser);
          setTheme(loadedUser.settings.theme);
          setLanguageState(loadedUser.settings.language);
        }
      } catch (error) {
        console.error('Lỗi tải Profile:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    // 1. TẢI TRỰC TIẾP KHÔNG CHỜ ĐỢI (Loại bỏ hoàn toàn setTimeout 5 giây)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user);
      } else {
        if (isMounted) setIsLoading(false); // Nếu chưa đăng nhập, mở khóa màn hình ngay
      }
    });

    // 2. LẮNG NGHE THAY ĐỔI THEO THỜI GIAN THỰC
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      if (session?.user) {
        loadProfile(session.user);
      } else {
        if (isMounted) {
          setUser(null);
          fetchedUserId.current = null;
          setIsLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); }, [theme]);

  const logout = async () => { await supabaseSignOut(); };
  const toggleTheme = () => { const newTheme = theme === 'light' ? 'dark' : 'light'; setTheme(newTheme); if (user) updateUser({ settings: { ...user.settings, theme: newTheme } }); };
  const setLanguage = (lang: 'vi' | 'en' | 'zh') => { setLanguageState(lang); if (user) updateUser({ settings: { ...user.settings, language: lang } }); };
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updated = deepMergeUser(user, userData); setUser(updated);
      updateUserProfile(user.id, { full_name: updated.name, avatar: updated.avatar, notifications: updated.notifications, settings: updated.settings });
      if (updated.settings.theme !== theme) setTheme(updated.settings.theme);
    }
  };

  return (
    <AppContext.Provider value={{ user, isAuthenticated: !!user, isLoading, logout, updateUser, theme, toggleTheme, language, setLanguage }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
}

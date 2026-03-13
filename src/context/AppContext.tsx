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
  
  // Dùng useRef để chống gọi API nhiều lần lặp lại
  const fetchedUserId = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Hàm chuyên dụng tải Profile người dùng
    const loadProfile = async (sessionUser: SupabaseUser) => {
      // Nếu đã tải dữ liệu của user này rồi thì bỏ qua để chống chớp giật màn hình
      if (fetchedUserId.current === sessionUser.id) {
         if (isLoading && isMounted) setIsLoading(false);
         return;
      }
      
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

    // 1. TẢI SESSION TRỰC TIẾP LÚC MỞ WEB
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Lỗi session:", error);
        if (isMounted) setIsLoading(false);
        return;
      }
      if (session?.user) {
        loadProfile(session.user);
      } else {
        if (isMounted) setIsLoading(false);
      }
    });

    // 2. LẮNG NGHE SỰ KIỆN (ĐÃ VÁ LỖI TỰ ĐỘNG VĂNG RA NGOÀI)
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      console.log('🔄 Trạng thái Auth:', event); // Hỗ trợ debug trong Console

      if (event === 'SIGNED_OUT') {
        // CHỈ ĐĂNG XUẤT KHI CÓ LỆNH SIGNED_OUT CHÍNH THỨC TỪ SUPABASE
        if (isMounted) {
          setUser(null);
          fetchedUserId.current = null;
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        // Cập nhật lại user nếu session tồn tại (bỏ qua các sự kiện nhiễu)
        if (session?.user) {
          loadProfile(session.user);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); }, [theme]);

  // ĐÃ VÁ LỖI: Hàm logout cần reset state thủ công để đảm bảo an toàn
  const logout = async () => { 
    await supabaseSignOut(); 
    setUser(null);
    fetchedUserId.current = null;
  };
  
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

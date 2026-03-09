import { createClient, SupabaseClient, Session, User as SupabaseUser } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '' && !supabaseUrl.includes('placeholder'));
};

// Create Supabase client (with placeholder if not configured)
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
);

// Auth helper types
export type { Session, SupabaseUser };

// Auth helper functions
export const signUp = async (email: string, password: string, fullName: string) => {
  if (!isSupabaseConfigured()) {
    throw new Error('SUPABASE_NOT_CONFIGURED');
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  
  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  if (!isSupabaseConfigured()) {
    throw new Error('SUPABASE_NOT_CONFIGURED');
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  if (!isSupabaseConfigured()) return;
  
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getSession = async (): Promise<Session | null> => {
  if (!isSupabaseConfigured()) return null;
  
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

export const getCurrentUser = async (): Promise<SupabaseUser | null> => {
  if (!isSupabaseConfigured()) return null;
  
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Password reset
export const resetPassword = async (email: string) => {
  if (!isSupabaseConfigured()) {
    throw new Error('SUPABASE_NOT_CONFIGURED');
  }
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  
  if (error) throw error;
};

// Update password
export const updatePassword = async (newPassword: string) => {
  if (!isSupabaseConfigured()) {
    throw new Error('SUPABASE_NOT_CONFIGURED');
  }
  
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  
  if (error) throw error;
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => {
  if (!isSupabaseConfigured()) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  
  return supabase.auth.onAuthStateChange(callback);
};

// ==================== DATABASE OPERATIONS ====================

// Generic fetch function with RLS (Row Level Security)
export async function fetchUserData<T>(
  tableName: string, 
  dateColumn?: string, 
  daysLimit: number = 30
): Promise<T[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return [];

let query = supabase.from(tableName).select('*').eq('user_id', session.user.id);
  
  // Nếu truyền vào cột ngày tháng, chỉ lấy dữ liệu trong khoảng X ngày gần nhất
  if (dateColumn) {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - daysLimit);
    const dateString = pastDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    query = query.gte(dateColumn, dateString);
  }

  const { data, error } = await query;
  if (error) {
    console.error(`Lỗi tải bảng ${tableName}:`, error);
    throw error;
  }
  return data as T[];
}

// Generic insert function
export async function insertData<T extends object>(table: string, item: T): Promise<T | null> {
  if (!isSupabaseConfigured()) return null;
  
  const { data, error } = await supabase
    .from(table)
    .insert([item])
    .select()
    .single();
  
  if (error) {
    console.error(`Error inserting into ${table}:`, error);
    return null;
  }
  
  return data as T;
}

// Generic update function
export async function updateData<T extends object>(table: string, id: string, updates: Partial<T>): Promise<T | null> {
  if (!isSupabaseConfigured()) return null;
  
  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating ${table}:`, error);
    return null;
  }
  
  return data as T;
}

// Generic delete function
export async function deleteData(table: string, id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting from ${table}:`, error);
    return false;
  }
  
  return true;
}

// Fetch user profile
export async function fetchUserProfile(userId: string) {
  if (!isSupabaseConfigured()) return null;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  return data;
}

// Update user profile
export async function updateUserProfile(userId: string, profile: Record<string, unknown>) {
  if (!isSupabaseConfigured()) return null;
  
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...profile })
    .select()
    .single();
  
  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }
  
  return data;
}

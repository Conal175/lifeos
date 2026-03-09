import { createClient, SupabaseClient, Session, User as SupabaseUser } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '' && !supabaseUrl.includes('placeholder'));
};

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  { auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } }
);

export type { Session, SupabaseUser };

// --- AUTH FUNCTIONS ---
export const signUp = async (email: string, password: string, fullName: string) => {
  if (!isSupabaseConfigured()) throw new Error('SUPABASE_NOT_CONFIGURED');
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
  if (error) throw error; return data;
};

export const signIn = async (email: string, password: string) => {
  if (!isSupabaseConfigured()) throw new Error('SUPABASE_NOT_CONFIGURED');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error; return data;
};

export const signOut = async () => {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getSession = async (): Promise<Session | null> => {
  if (!isSupabaseConfigured()) return null;
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error; return session;
};

export const getCurrentUser = async (): Promise<SupabaseUser | null> => {
  if (!isSupabaseConfigured()) return null;
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error; return user;
};

export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => {
  if (!isSupabaseConfigured()) return { data: { subscription: { unsubscribe: () => {} } } };
  return supabase.auth.onAuthStateChange(callback);
};

// ==================== BỘ PHIÊN DỊCH FRONTEND <-> DATABASE ====================

// 1. Dịch từ React (camelCase) sang Supabase (snake_case)
function toDbFormat(tableName: string, data: any) {
  const dbData = { ...data };
  if (dbData.userId) { dbData.user_id = dbData.userId; delete dbData.userId; }

  const mappings: Record<string, string> = {
    dueDate: 'due_date', startDate: 'start_date', endDate: 'end_date',
    createdAt: 'created_at', updatedAt: 'updated_at', completedAt: 'completed_at',
    completedDates: 'completed_dates', sleepHours: 'sleep_hours',
    completedHabits: 'completed_habits', estimatedHours: 'estimated_hours',
    currentPrice: 'current_price',
  };

  for (const [frontKey, dbKey] of Object.entries(mappings)) {
    if (dbData[frontKey] !== undefined) {
      dbData[dbKey] = dbData[frontKey];
      delete dbData[frontKey];
    }
  }

  // Xử lý các bảng có schema đặc thù
  if (tableName === 'investments' && dbData.avgPrice !== undefined) {
    dbData.buy_price = dbData.avgPrice; delete dbData.avgPrice;
  }
  if (tableName === 'activities' && dbData.targetPerDay !== undefined) {
    dbData.target = dbData.targetPerDay; delete dbData.targetPerDay;
  }
  if (tableName === 'journal') {
    if (dbData.attachments !== undefined) { dbData.images = dbData.attachments; delete dbData.attachments; }
    if (dbData.locked !== undefined) { dbData.is_private = dbData.locked; delete dbData.locked; }
  }
  if (tableName === 'tasks' && dbData.assignee !== undefined) {
    delete dbData.assignee; // Bỏ cột không tồn tại trong DB
  }
  if (tableName === 'events') {
    if (dbData.start_date) {
      const parts = dbData.start_date.split('T');
      dbData.date = parts[0];
      if (parts[1]) dbData.start_time = parts[1];
      delete dbData.start_date;
    }
    if (dbData.end_date) {
      const parts = dbData.end_date.split('T');
      if (parts[1]) dbData.end_time = parts[1];
      delete dbData.end_date;
    }
    if (dbData.isTask !== undefined) delete dbData.isTask;
  }

  return dbData;
}

// 2. Dịch ngược từ Supabase (snake_case) về React (camelCase)
function fromDbFormat(tableName: string, dbData: any) {
  const obj = { ...dbData, userId: dbData.user_id };
  delete obj.user_id;

  const mappings: Record<string, string> = {
    due_date: 'dueDate', start_date: 'startDate', end_date: 'endDate',
    created_at: 'createdAt', updated_at: 'updatedAt', completed_at: 'completedAt',
    completed_dates: 'completedDates', sleep_hours: 'sleepHours',
    completed_habits: 'completedHabits', estimated_hours: 'estimatedHours',
    current_price: 'currentPrice',
  };

  for (const [dbKey, frontKey] of Object.entries(mappings)) {
    if (obj[dbKey] !== undefined) {
      obj[frontKey] = obj[dbKey];
      delete obj[dbKey];
    }
  }

  if (tableName === 'investments' && obj.buy_price !== undefined) {
    obj.avgPrice = obj.buy_price; delete obj.buy_price;
  }
  if (tableName === 'activities' && obj.target !== undefined) {
    obj.targetPerDay = obj.target; delete obj.target;
  }
  if (tableName === 'journal') {
    if (obj.images !== undefined) { obj.attachments = obj.images; delete obj.images; }
    if (obj.is_private !== undefined) { obj.locked = obj.is_private; delete obj.is_private; }
  }
  if (tableName === 'events' && obj.date) {
    obj.startDate = obj.start_time ? `${obj.date}T${obj.start_time}` : obj.date;
    obj.endDate = obj.end_time ? `${obj.date}T${obj.end_time}` : obj.date;
  }

  return obj;
}

// ==================== DATABASE OPERATIONS ====================

export async function fetchUserData<T>(tableName: string, userId: string, dateColumn?: string, daysLimit: number = 30): Promise<T[]> {
  let query = supabase.from(tableName).select('*').eq('user_id', userId);

  // Tự động dịch tên cột ngày tháng trước khi lọc
  let dbDateColumn = dateColumn;
  if (dateColumn === 'startDate') dbDateColumn = 'start_date';
  if (dateColumn === 'dueDate') dbDateColumn = 'due_date';
  if (dateColumn === 'createdAt') dbDateColumn = 'created_at';

  if (dbDateColumn) {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - daysLimit);
    const dateString = pastDate.toISOString().split('T')[0];
    query = query.gte(dbDateColumn, dateString);
  }

  const { data, error } = await query;
  if (error) {
    console.error(`❌ Lỗi tải bảng ${tableName}:`, error);
    return [];
  }

  // Dịch dữ liệu trước khi ném về cho React
  return data.map((item: any) => fromDbFormat(tableName, item)) as T[];
}

export async function insertData(tableName: string, data: any) {
  const dbData = toDbFormat(tableName, data);
  const { error } = await supabase.from(tableName).insert(dbData);
  if (error) { 
    console.error(`❌ Lỗi thêm ${tableName}:`, error); 
    throw error; // Ép văng lỗi để React Query phát hiện được
  }
}

export async function updateData(tableName: string, id: string, data: any) {
  const dbData = toDbFormat(tableName, data);
  const { error } = await supabase.from(tableName).update(dbData).eq('id', id);
  if (error) { 
    console.error(`❌ Lỗi cập nhật ${tableName}:`, error); 
    throw error; 
  }
}

export async function deleteData(table: string, id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) { 
    console.error(`❌ Lỗi xóa ${table}:`, error); 
    throw error; 
  }
  return true;
}

// Fetch user profile
export async function fetchUserProfile(userId: string) {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) { console.error('Error fetching profile:', error); return null; }
  return data;
}

// Update user profile
export async function updateUserProfile(userId: string, profile: Record<string, unknown>) {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('profiles').upsert({ id: userId, ...profile }).select().single();
  if (error) { console.error('Error updating profile:', error); return null; }
  return data;
}

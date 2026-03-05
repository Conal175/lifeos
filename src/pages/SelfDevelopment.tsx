import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Plus, Trash2, X, Flame, TrendingUp, Calendar,
  CheckCircle2, Edit2, Target, ChevronRight
} from 'lucide-react';
import { format, subDays, differenceInDays, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';

// ===== PRESETS =====
const activityPresets = [
  { name: 'Chạy bộ', icon: '🏃', color: '#ef4444', unit: 'km', targetPerDay: 5 },
  { name: 'Đọc sách', icon: '📚', color: '#22c55e', unit: 'trang', targetPerDay: 30 },
  { name: 'Thiền', icon: '🧘', color: '#8b5cf6', unit: 'phút', targetPerDay: 15 },
  { name: 'Tập gym', icon: '💪', color: '#f97316', unit: 'phút', targetPerDay: 60 },
  { name: 'Học ngoại ngữ', icon: '🌍', color: '#3b82f6', unit: 'phút', targetPerDay: 30 },
  { name: 'Viết lách', icon: '✍️', color: '#ec4899', unit: 'từ', targetPerDay: 500 },
];

const habitPresets = [
  { name: 'Dậy sớm', icon: '🌅', color: '#f97316', frequency: 'daily' as const },
  { name: 'Tập thể dục', icon: '🏋️', color: '#22c55e', frequency: 'daily' as const },
  { name: 'Đọc sách', icon: '📖', color: '#3b82f6', frequency: 'daily' as const },
  { name: 'Thiền', icon: '🧘', color: '#8b5cf6', frequency: 'daily' as const },
  { name: 'Uống đủ nước', icon: '💧', color: '#06b6d4', frequency: 'daily' as const },
  { name: 'Không mạng xã hội', icon: '📵', color: '#ef4444', frequency: 'daily' as const },
  { name: 'Học tiếng Anh', icon: '🇬🇧', color: '#ec4899', frequency: 'daily' as const },
  { name: 'Viết nhật ký', icon: '📝', color: '#a855f7', frequency: 'daily' as const },
];

const iconOptions = ['🏃', '📚', '🧘', '💪', '🌍', '✍️', '🧘‍♀️', '🚶', '💧', '🍳', '🎨', '🎸', '🎯', '🧠', '🏋️', '🚴', '🏊', '⛹️', '🎵', '📝', '🌅', '📖', '📵', '🇬🇧', '💤', '🥗', '🚭', '💊'];
const colorOptions = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#e11d48'];
const goalCategories = ['Sự nghiệp', 'Học tập', 'Sức khỏe', 'Mối quan hệ', 'Kỹ năng', 'Cá nhân'];

export function SelfDevelopment() {
  const { 
    activities, addActivity, deleteActivity, logActivity, 
    habits, addHabit, deleteHabit, toggleHabit,
    goals, addGoal, deleteGoal, completeMilestone
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'goals' | 'habits' | 'activities'>('goals');
  const [habitViewMode, setHabitViewMode] = useState<'grid' | 'horizontal'>('grid');
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState<string | null>(null);
  const [logDate, setLogDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [logValue, setLogValue] = useState('');
  const [logNote, setLogNote] = useState('');
  const [viewMonth] = useState(new Date());

  // Activity Form
  const [activityForm, setActivityForm] = useState({
    name: '', icon: '🏃', color: '#ef4444', unit: 'km', targetPerDay: 5
  });

  // Habit Form
  const [habitForm, setHabitForm] = useState({
    name: '', icon: '🎯', color: '#6366f1', frequency: 'daily' as 'daily' | 'weekly'
  });

  // Goal Form
  const [goalForm, setGoalForm] = useState({
    title: '',
    category: 'Cá nhân',
    deadline: format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    milestones: ''
  });

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));

  // ===== ACTIVITY HELPERS =====
  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    addActivity(activityForm);
    setActivityForm({ name: '', icon: '🏃', color: '#ef4444', unit: 'km', targetPerDay: 5 });
    setShowActivityModal(false);
  };

  const handleAddPreset = (preset: typeof activityPresets[0]) => {
    addActivity(preset);
  };

  const handleLog = () => {
    if (showLogModal && logValue) {
      logActivity(showLogModal, logDate, parseFloat(logValue), logNote || undefined);
      setShowLogModal(null);
      setLogValue('');
      setLogNote('');
    }
  };

  const quickLog = (activityId: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;
    const todayLog = activity.logs.find(l => l.date === todayStr);
    if (todayLog) {
      logActivity(activityId, todayStr, 0);
    } else {
      logActivity(activityId, todayStr, activity.targetPerDay);
    }
  };

  const getStreak = (actId: string) => {
    const activity = activities.find(a => a.id === actId);
    if (!activity) return 0;
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const checkDate = format(subDays(today, i), 'yyyy-MM-dd');
      const hasLog = activity.logs.some(l => l.date === checkDate && l.value > 0);
      if (hasLog) streak++;
      else if (i > 0) break;
    }
    return streak;
  };

  const getLongestStreak = (actId: string) => {
    const activity = activities.find(a => a.id === actId);
    if (!activity || activity.logs.length === 0) return 0;
    const sortedDates = activity.logs.filter(l => l.value > 0).map(l => l.date).sort();
    if (sortedDates.length === 0) return 0;
    let maxStreak = 1, currentStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const diff = differenceInDays(new Date(sortedDates[i]), new Date(sortedDates[i - 1]));
      if (diff === 1) { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak); }
      else currentStreak = 1;
    }
    return maxStreak;
  };

  const getTotalDays = (actId: string) => {
    const activity = activities.find(a => a.id === actId);
    if (!activity) return 0;
    return activity.logs.filter(l => l.value > 0).length;
  };

  const getMonthlyStats = (actId: string) => {
    const activity = activities.find(a => a.id === actId);
    if (!activity) return { days: 0, total: 0 };
    const monthStart = format(startOfMonth(viewMonth), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(viewMonth), 'yyyy-MM-dd');
    const monthLogs = activity.logs.filter(l => l.date >= monthStart && l.date <= monthEnd && l.value > 0);
    return { days: monthLogs.length, total: monthLogs.reduce((sum, l) => sum + l.value, 0) };
  };

  // ===== HABIT HELPERS =====
  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    addHabit(habitForm);
    setHabitForm({ name: '', icon: '🎯', color: '#6366f1', frequency: 'daily' });
    setShowHabitModal(false);
  };

  const handleAddHabitPreset = (preset: typeof habitPresets[0]) => {
    addHabit(preset);
  };

  const getHabitStreak = (h: typeof habits[0]) => h.streak;
  const getHabitMonthCount = (h: typeof habits[0]) => {
    const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');
    return h.completedDates.filter(d => d >= monthStart && d <= monthEnd).length;
  };
  const getHabitTotalCount = (h: typeof habits[0]) => h.completedDates.length;

  // ===== GOAL HELPERS =====
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const milestonesList = goalForm.milestones.split('\n').filter(m => m.trim()).map((title, i) => ({
      id: `m-${Date.now()}-${i}`,
      title: title.trim(),
      completed: false
    }));
    addGoal({
      title: goalForm.title,
      category: goalForm.category,
      deadline: goalForm.deadline,
      milestones: milestonesList
    });
    setGoalForm({ title: '', category: 'Cá nhân', deadline: format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), milestones: '' });
    setShowGoalModal(false);
  };

  const getGoalProgress = (g: typeof goals[0]) => {
    const done = g.milestones.filter(m => m.completed).length;
    return g.milestones.length > 0 ? Math.round((done / g.milestones.length) * 100) : 0;
  };

  // Stats
  const totalActivitiesToday = activities.filter(a => a.logs.some(l => l.date === todayStr)).length;
  const totalHabitsToday = habits.filter(h => h.completedDates.includes(todayStr)).length;
  const goalsInProgress = goals.filter(g => {
    const progress = getGoalProgress(g);
    return progress > 0 && progress < 100;
  }).length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            🌱 Phát triển bản thân
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Theo dõi mục tiêu, thói quen và hoạt động hàng ngày
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <Target className="w-5 h-5" />
            <span className="text-xs font-medium">Mục tiêu đang thực hiện</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{goalsInProgress}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-xs font-medium">Thói quen hôm nay</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalHabitsToday}/{habits.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700">
          <div className="flex items-center gap-2 text-orange-600 mb-1">
            <Flame className="w-5 h-5" />
            <span className="text-xs font-medium">Hoạt động hôm nay</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalActivitiesToday}/{activities.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs font-medium">Chuỗi cao nhất</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.max(
              ...habits.map(h => h.streak),
              ...activities.map(a => getLongestStreak(a.id)),
              0
            )} ngày
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {[
          { key: 'goals', label: '🎯 Mục tiêu', count: goals.length },
          { key: 'habits', label: '🔄 Thói quen', count: habits.length },
          { key: 'activities', label: '🏃 Hoạt động', count: activities.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === tab.key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
            <span className="bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs px-1.5 py-0.5 rounded-full">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ===== GOALS TAB ===== */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowGoalModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 font-medium">
              <Plus className="w-5 h-5" /> Tạo mục tiêu
            </button>
          </div>

          {goals.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border dark:border-gray-700 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Chưa có mục tiêu nào</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Hãy đặt mục tiêu để phát triển bản thân!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {goals.map(goal => {
                const progress = getGoalProgress(goal);
                const daysLeft = differenceInDays(new Date(goal.deadline), today);
                const doneMilestones = goal.milestones.filter(m => m.completed).length;
                const isCompleted = progress >= 100;

                return (
                  <div key={goal.id} className={`bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 overflow-hidden transition-all hover:shadow-lg ${isCompleted ? 'ring-2 ring-green-500' : ''}`}>
                    <div className="p-4 border-b dark:border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white">{goal.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full">{goal.category}</span>
                            <span className={`text-xs ${daysLeft < 0 ? 'text-red-500' : daysLeft <= 7 ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400'}`}>
                              {daysLeft > 0 ? `Còn ${daysLeft} ngày` : daysLeft === 0 ? 'Hôm nay' : 'Đã quá hạn'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-2xl font-bold" style={{ color: isCompleted ? '#22c55e' : '#6366f1' }}>{progress}%</div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">{doneMilestones}/{goal.milestones.length} mốc</div>
                          </div>
                          <button onClick={() => deleteGoal(goal.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div className={`h-3 rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                          style={{ width: `${Math.min(progress, 100)}%` }} />
                      </div>
                    </div>
                    <div className="p-4 space-y-1.5 max-h-48 overflow-y-auto">
                      {goal.milestones.map((m, idx) => (
                        <label key={m.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={m.completed}
                            onChange={() => completeMilestone(goal.id, m.id)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className={`text-sm flex-1 ${m.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            {idx + 1}. {m.title}
                          </span>
                          {m.completed && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== HABITS TAB ===== */}
      {activeTab === 'habits' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setHabitViewMode('grid')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  habitViewMode === 'grid'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >
                🔲 Lưới
              </button>
              <button
                onClick={() => setHabitViewMode('horizontal')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  habitViewMode === 'horizontal'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >
                📊 Ngang
              </button>
            </div>
            <button onClick={() => setShowHabitModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 font-medium">
              <Plus className="w-5 h-5" /> Thêm thói quen
            </button>
          </div>

          {habits.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border dark:border-gray-700 text-center">
              <div className="text-6xl mb-4">🔄</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Chưa có thói quen nào</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Chọn từ gợi ý bên dưới hoặc tạo thói quen tùy chỉnh</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                {habitPresets.slice(0, 6).map((preset, i) => (
                  <button key={i} onClick={() => handleAddHabitPreset(preset)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl border dark:border-gray-600 text-sm transition-all hover:shadow-md">
                    <span className="text-lg">{preset.icon}</span>
                    <span className="text-gray-700 dark:text-gray-300">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : habitViewMode === 'horizontal' ? (
            /* ===== HORIZONTAL VIEW ===== */
            <div className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 overflow-hidden">
              {/* Header row with days */}
              <div className="grid grid-cols-[200px_repeat(7,1fr)_120px] gap-2 p-4 bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Thói quen</div>
                {last7Days.map((day, i) => {
                  const isToday2 = isSameDay(day, today);
                  const dayOfWeek = day.getDay();
                  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                  return (
                    <div key={i} className={`text-center ${isToday2 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                      <div className="text-xs font-medium">{dayNames[dayOfWeek]}</div>
                      <div className={`text-sm ${isToday2 ? 'bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto' : ''}`}>
                        {format(day, 'd')}
                      </div>
                    </div>
                  );
                })}
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">Streak</div>
              </div>

              {/* Habit rows */}
              {habits.map(habit => {
                const streak = getHabitStreak(habit);
                const todayDone = habit.completedDates.includes(todayStr);

                return (
                  <div key={habit.id} className="grid grid-cols-[200px_repeat(7,1fr)_120px] gap-2 p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors items-center">
                    {/* Habit name */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: `${habit.color}15` }}>
                        {habit.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{habit.name}</h3>
                        <span className="text-xs text-gray-500">Hàng ngày</span>
                      </div>
                    </div>

                    {/* 7 day checkboxes */}
                    {last7Days.map((day, i) => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const done = habit.completedDates.includes(dateStr);
                      const isToday2 = isSameDay(day, today);

                      return (
                        <div key={i} className="flex justify-center">
                          <button
                            onClick={() => toggleHabit(habit.id, dateStr)}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold transition-all ${
                              done
                                ? 'text-white shadow-md scale-105'
                                : isToday2
                                ? 'border-2 border-dashed border-indigo-400 text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            style={done ? { backgroundColor: habit.color } : {}}
                          >
                            {done ? '✓' : ''}
                          </button>
                        </div>
                      );
                    })}

                    {/* Streak & quick action */}
                    <div className="flex items-center justify-center gap-2">
                      {streak > 0 && (
                        <span className="text-sm font-bold flex items-center gap-1" style={{ color: habit.color }}>
                          <Flame className="w-4 h-4" /> {streak}
                        </span>
                      )}
                      {!todayDone && (
                        <button
                          onClick={() => toggleHabit(habit.id, todayStr)}
                          className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          ✓ Hôm nay
                        </button>
                      )}
                      {todayDone && (
                        <span className="text-green-600 text-xs font-medium">✅ Done</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Summary row */}
              <div className="grid grid-cols-[200px_repeat(7,1fr)_120px] gap-2 p-4 bg-gray-50 dark:bg-gray-900/50">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tổng hoàn thành</div>
                {last7Days.map((day, i) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const completedCount = habits.filter(h => h.completedDates.includes(dateStr)).length;
                  const percentage = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;
                  return (
                    <div key={i} className="text-center">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{completedCount}/{habits.length}</div>
                      <div className={`text-xs ${percentage >= 80 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-gray-400'}`}>
                        {percentage}%
                      </div>
                    </div>
                  );
                })}
                <div className="text-center">
                  <div className="text-sm font-bold text-indigo-600">
                    {habits.filter(h => h.completedDates.includes(todayStr)).length}/{habits.length}
                  </div>
                  <div className="text-xs text-gray-500">Hôm nay</div>
                </div>
              </div>
            </div>
          ) : (
            /* ===== GRID VIEW ===== */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {habits.map(habit => {
                const streak = getHabitStreak(habit);
                const monthCount = getHabitMonthCount(habit);
                const totalCount = getHabitTotalCount(habit);
                const todayDone = habit.completedDates.includes(todayStr);

                return (
                  <div key={habit.id} className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all">
                    {/* Header */}
                    <div className="p-4 border-b dark:border-gray-700" style={{ backgroundColor: `${habit.color}08` }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${habit.color}15` }}>
                            {habit.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">{habit.name}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              {streak > 0 && (
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1" style={{ backgroundColor: `${habit.color}15`, color: habit.color }}>
                                  <Flame className="w-3 h-3" /> {streak} ngày
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => deleteHabit(habit.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>

                    {/* 7-day grid */}
                    <div className="px-4 py-3 border-b dark:border-gray-700">
                      <div className="flex gap-1.5">
                        {last7Days.map((day, i) => {
                          const dateStr = format(day, 'yyyy-MM-dd');
                          const done = habit.completedDates.includes(dateStr);
                          const isToday2 = isSameDay(day, today);
                          const dayOfWeek = day.getDay();
                          const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                              <button
                                onClick={() => toggleHabit(habit.id, dateStr)}
                                className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                                  done
                                    ? 'text-white shadow-sm'
                                    : isToday2
                                    ? 'border-2 border-dashed border-gray-300 dark:border-gray-600'
                                    : 'bg-gray-100 dark:bg-gray-700'
                                }`}
                                style={done ? { backgroundColor: habit.color } : {}}
                              >
                                {done ? '✓' : ''}
                              </button>
                              <span className={`text-[10px] ${isToday2 ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                                {dayNames[dayOfWeek]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Stats & Action */}
                    <div className="p-4">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                        <span>Tháng này: <strong className="text-gray-900 dark:text-white">{monthCount} ngày</strong></span>
                        <span>Tổng: <strong className="text-gray-900 dark:text-white">{totalCount} ngày</strong></span>
                      </div>
                      <button onClick={() => toggleHabit(habit.id, todayStr)}
                        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                          todayDone
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}>
                        {todayDone ? <><CheckCircle2 className="w-4 h-4" /> Đã hoàn thành</> : '☐ Hoàn thành hôm nay'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== ACTIVITIES TAB ===== */}
      {activeTab === 'activities' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowActivityModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 font-medium">
              <Plus className="w-5 h-5" /> Thêm hoạt động
            </button>
          </div>

          {activities.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border dark:border-gray-700 text-center">
              <div className="text-6xl mb-4">🏃‍♂️</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Chưa có hoạt động nào</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Chọn từ gợi ý hoặc tạo hoạt động tùy chỉnh</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                {activityPresets.map((preset, i) => (
                  <button key={i} onClick={() => handleAddPreset(preset)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl border dark:border-gray-600 text-sm transition-all hover:shadow-md">
                    <span className="text-lg">{preset.icon}</span>
                    <span className="text-gray-700 dark:text-gray-300">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activities.map(activity => {
                const streak = getStreak(activity.id);
                const longestStreak = getLongestStreak(activity.id);
                const totalDays = getTotalDays(activity.id);
                const todayLog = activity.logs.find(l => l.date === todayStr);
                const doneToday = !!todayLog && todayLog.value > 0;
                const monthStats = getMonthlyStats(activity.id);

                return (
                  <div key={activity.id} className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 overflow-hidden transition-all hover:shadow-lg">
                    {/* Card Header */}
                    <div className="p-4 border-b dark:border-gray-700" style={{ backgroundColor: `${activity.color}08` }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm" style={{ backgroundColor: `${activity.color}15` }}>
                            {activity.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">{activity.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Mục tiêu: {activity.targetPerDay} {activity.unit}/ngày
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => {
                            setShowLogModal(activity.id);
                            setLogDate(todayStr);
                            setLogValue(todayLog ? String(todayLog.value) : '');
                          }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Ghi nhận chi tiết">
                            <Edit2 className="w-4 h-4 text-gray-400" />
                          </button>
                          <button onClick={() => deleteActivity(activity.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Xóa">
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Check Today */}
                    <div className="px-4 py-3 border-b dark:border-gray-700">
                      <button onClick={() => quickLog(activity.id)}
                        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                          doneToday
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-2 border-green-200 dark:border-green-800'
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:text-indigo-600'
                        }`}>
                        {doneToday ? (
                          <><CheckCircle2 className="w-5 h-5" /> ✅ Đã hoàn thành ({todayLog?.value} {activity.unit})</>
                        ) : (
                          <><Plus className="w-5 h-5" /> Đánh dấu hoàn thành hôm nay</>
                        )}
                      </button>
                    </div>

                    {/* 7-Day Progress */}
                    <div className="px-4 py-3 border-b dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">7 ngày gần nhất</span>
                      </div>
                      <div className="flex gap-1.5">
                        {last7Days.map((day, i) => {
                          const dateStr = format(day, 'yyyy-MM-dd');
                          const log = activity.logs.find(l => l.date === dateStr);
                          const hasLog = log && log.value > 0;
                          const isToday = isSameDay(day, today);
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                              <div
                                className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                                  hasLog ? 'text-white shadow-sm' : isToday ? 'border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                                }`}
                                style={hasLog ? { backgroundColor: activity.color } : {}}
                                onClick={() => {
                                  setShowLogModal(activity.id);
                                  setLogDate(dateStr);
                                  setLogValue(log ? String(log.value) : '');
                                }}
                                title={`${format(day, 'dd/MM')}${hasLog ? `: ${log.value} ${activity.unit}` : ''}`}
                              >
                                {hasLog ? '✓' : ''}
                              </div>
                              <span className={`text-[10px] ${isToday ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                {format(day, 'EEE', { locale: vi }).slice(0, 2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="p-4 grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Flame className="w-4 h-4" style={{ color: activity.color }} />
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{streak}</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">Chuỗi hiện tại</div>
                      </div>
                      <div className="text-center border-x dark:border-gray-700">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <TrendingUp className="w-4 h-4" style={{ color: activity.color }} />
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{longestStreak}</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">Chuỗi dài nhất</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Calendar className="w-4 h-4" style={{ color: activity.color }} />
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{totalDays}</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">Tổng ngày</div>
                      </div>
                    </div>

                    {/* Monthly summary */}
                    <div className="px-4 pb-4">
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">Tháng {format(viewMonth, 'MM/yyyy')}</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{monthStats.days} ngày · {monthStats.total} {activity.unit}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                          <div className="h-2 rounded-full transition-all"
                            style={{ width: `${Math.min((monthStats.days / 30) * 100, 100)}%`, backgroundColor: activity.color }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== MODALS ===== */}

      {/* Add Activity Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex justify-between items-center z-10 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">🏃 Thêm hoạt động mới</h2>
              <button onClick={() => setShowActivityModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Gợi ý nhanh</h3>
              <div className="flex flex-wrap gap-2">
                {activityPresets.map((preset, i) => (
                  <button key={i} onClick={() => { handleAddPreset(preset); setShowActivityModal(false); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl text-sm transition-all border dark:border-gray-600">
                    <span>{preset.icon}</span>
                    <span className="text-gray-700 dark:text-gray-300">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddActivity} className="p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Hoặc tạo tùy chỉnh</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên hoạt động *</label>
                <input type="text" value={activityForm.name} onChange={e => setActivityForm({ ...activityForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white" required placeholder="VD: Chạy bộ" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icon</label>
                <div className="flex gap-2 flex-wrap">
                  {iconOptions.slice(0, 16).map(icon => (
                    <button key={icon} type="button" onClick={() => setActivityForm({ ...activityForm, icon })}
                      className={`w-10 h-10 text-xl rounded-xl transition-all flex items-center justify-center ${activityForm.icon === icon ? 'bg-indigo-100 dark:bg-indigo-900 ring-2 ring-indigo-500 scale-110' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Màu sắc</label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map(color => (
                    <button key={color} type="button" onClick={() => setActivityForm({ ...activityForm, color })}
                      className={`w-8 h-8 rounded-full transition-all ${activityForm.color === color ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Đơn vị</label>
                  <input type="text" value={activityForm.unit} onChange={e => setActivityForm({ ...activityForm, unit: e.target.value })}
                    className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white" placeholder="km, phút..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mục tiêu/ngày</label>
                  <input type="number" value={activityForm.targetPerDay} onChange={e => setActivityForm({ ...activityForm, targetPerDay: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white" min={0} />
                </div>
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all">
                ✨ Tạo hoạt động
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Habit Modal */}
      {showHabitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex justify-between items-center z-10 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">🔄 Thêm thói quen mới</h2>
              <button onClick={() => setShowHabitModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Gợi ý nhanh</h3>
              <div className="flex flex-wrap gap-2">
                {habitPresets.map((preset, i) => (
                  <button key={i} onClick={() => { handleAddHabitPreset(preset); setShowHabitModal(false); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl text-sm transition-all border dark:border-gray-600">
                    <span>{preset.icon}</span>
                    <span className="text-gray-700 dark:text-gray-300">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddHabit} className="p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Hoặc tạo tùy chỉnh</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên thói quen *</label>
                <input type="text" value={habitForm.name} onChange={e => setHabitForm({ ...habitForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white" required placeholder="VD: Dậy sớm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icon</label>
                <div className="flex gap-2 flex-wrap">
                  {iconOptions.map(icon => (
                    <button key={icon} type="button" onClick={() => setHabitForm({ ...habitForm, icon })}
                      className={`w-10 h-10 text-xl rounded-xl transition-all flex items-center justify-center ${habitForm.icon === icon ? 'bg-indigo-100 dark:bg-indigo-900 ring-2 ring-indigo-500 scale-110' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Màu sắc</label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map(color => (
                    <button key={color} type="button" onClick={() => setHabitForm({ ...habitForm, color })}
                      className={`w-8 h-8 rounded-full transition-all ${habitForm.color === color ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tần suất</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setHabitForm({ ...habitForm, frequency: 'daily' })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${habitForm.frequency === 'daily' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                    Hàng ngày
                  </button>
                  <button type="button" onClick={() => setHabitForm({ ...habitForm, frequency: 'weekly' })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${habitForm.frequency === 'weekly' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                    Hàng tuần
                  </button>
                </div>
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all">
                ✨ Tạo thói quen
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex justify-between items-center z-10 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">🎯 Tạo mục tiêu mới</h2>
              <button onClick={() => setShowGoalModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddGoal} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên mục tiêu *</label>
                <input type="text" value={goalForm.title} onChange={e => setGoalForm({ ...goalForm, title: e.target.value })}
                  className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white" required placeholder="VD: Học xong khóa tiếng Anh" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Danh mục *</label>
                <select value={goalForm.category} onChange={e => setGoalForm({ ...goalForm, category: e.target.value })}
                  className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white">
                  {goalCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hạn chót *</label>
                <input type="date" value={goalForm.deadline} onChange={e => setGoalForm({ ...goalForm, deadline: e.target.value })}
                  className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Các cột mốc (mỗi dòng một cột mốc) <ChevronRight className="inline w-4 h-4" />
                </label>
                <textarea value={goalForm.milestones} onChange={e => setGoalForm({ ...goalForm, milestones: e.target.value })}
                  className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white resize-none" rows={5}
                  placeholder="Hoàn thành bài 1-10&#10;Đạt 500 điểm quiz&#10;Thi thử đạt 80%&#10;Thi chính thức" />
                <p className="text-xs text-gray-500 mt-1">Chia nhỏ mục tiêu thành các cột mốc để dễ theo dõi tiến độ</p>
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all">
                ✨ Tạo mục tiêu
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Log Activity Modal */}
      {showLogModal && (() => {
        const activity = activities.find(a => a.id === showLogModal);
        if (!activity) return null;
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl">
              <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>{activity.icon}</span> Ghi nhận {activity.name}
                </h2>
                <button onClick={() => { setShowLogModal(null); setLogValue(''); setLogNote(''); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày</label>
                  <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)}
                    className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Giá trị ({activity.unit}) *
                  </label>
                  <input type="number" value={logValue} onChange={e => setLogValue(e.target.value)}
                    className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-lg font-bold text-center"
                    min={0} step="any" autoFocus placeholder={`VD: ${activity.targetPerDay}`} />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">Mục tiêu: {activity.targetPerDay} {activity.unit}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú</label>
                  <input type="text" value={logNote} onChange={e => setLogNote(e.target.value)}
                    className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white" placeholder="Ghi chú thêm..." />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setShowLogModal(null); setLogValue(''); setLogNote(''); }}
                    className="flex-1 py-2.5 border dark:border-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
                    Hủy
                  </button>
                  <button onClick={handleLog}
                    className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-purple-700">
                    💾 Lưu
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

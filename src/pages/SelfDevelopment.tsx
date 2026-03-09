import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTableData } from '../hooks/useData';
import { Activity, Habit, Goal } from '../types';
import { Plus, Trash2, X, Flame, Calendar, CheckCircle2, Edit2, TrendingUp, Activity as ActivityIcon } from 'lucide-react';
import { format, subDays, differenceInDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { BarChart, Bar, ResponsiveContainer, Tooltip, Cell } from 'recharts';

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
];
const iconOptions = ['🏃', '📚', '🧘', '💪', '🌍', '✍️', '🚶', '💧', '🍳', '🎨', '🎯', '🧠', '🏋️'];
const colorOptions = ['#ef4444', '#f97316', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'];
const goalCategories = ['Sự nghiệp', 'Học tập', 'Sức khỏe', 'Mối quan hệ', 'Kỹ năng', 'Cá nhân'];

export function SelfDevelopment() {
  const { user } = useApp();
  const { data: activities = [], isLoading: loadA, addRecord: addAct, updateRecord: updateAct, deleteRecord: delAct } = useTableData<Activity>('activities');
  const { data: habits = [], isLoading: loadH, addRecord: addHab, updateRecord: updateHab, deleteRecord: delHab } = useTableData<Habit>('habits');
  const { data: goals = [], isLoading: loadG, addRecord: addGoal, updateRecord: updateGoal, deleteRecord: delGoal } = useTableData<Goal>('goals');
  
  const isLoading = loadA || loadH || loadG;

  const [activeTab, setActiveTab] = useState<'goals' | 'routines'>('routines');
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const [showLogModal, setShowLogModal] = useState<string | null>(null);
  const [logDate, setLogDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [logValue, setLogValue] = useState('');
  const [logNote, setLogNote] = useState('');

  const [activityForm, setActivityForm] = useState({ name: '', icon: '🏃', color: '#ef4444', unit: 'km', targetPerDay: 5 });
  const [habitForm, setHabitForm] = useState({ name: '', icon: '🎯', color: '#6366f1', frequency: 'daily' as 'daily' | 'weekly' });
  const [goalForm, setGoalForm] = useState({ title: '', category: 'Cá nhân', deadline: format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), milestones: '' });

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i)).reverse(); // Reverse để ngày cũ bên trái, mới bên phải

  // Hàm tính Chuỗi ngày liên tiếp (Streak)
  const getStreak = (dates: string[]) => {
    if (!dates || dates.length === 0) return 0;
    const sorted = [...new Set(dates)].sort().reverse();
    let streak = 0;
    let current = new Date();
    const todayS = format(current, 'yyyy-MM-dd');
    const yesterdayS = format(subDays(current, 1), 'yyyy-MM-dd');
    
    if (!sorted.includes(todayS) && !sorted.includes(yesterdayS)) return 0;
    
    let checkDate = sorted.includes(todayS) ? current : subDays(current, 1);
    while (true) {
      if (sorted.includes(format(checkDate, 'yyyy-MM-dd'))) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else break;
    }
    return streak;
  };

  const handleAddActivity = (e: React.FormEvent) => { e.preventDefault(); addAct({ ...activityForm, userId: user?.id, logs: [] }); setShowActivityModal(false); };
  const handleAddHabit = (e: React.FormEvent) => { e.preventDefault(); addHab({ ...habitForm, userId: user?.id, completedDates: [], streak: 0 }); setShowHabitModal(false); };
  const handleAddGoal = (e: React.FormEvent) => { 
    e.preventDefault(); 
    const mlList = goalForm.milestones.split('\n').filter(m => m.trim()).map((title, i) => ({ id: `m-${Date.now()}-${i}`, title: title.trim(), completed: false }));
    if (editingGoalId) {
      const existingGoal = goals.find(g => g.id === editingGoalId);
      const updatedMilestones = mlList.map(newM => {
        const existingM = existingGoal?.milestones.find(m => m.title === newM.title);
        return existingM ? existingM : newM;
      });
      updateGoal({ id: editingGoalId, data: { title: goalForm.title, category: goalForm.category, deadline: goalForm.deadline, milestones: updatedMilestones } });
    } else {
      addGoal({ title: goalForm.title, category: goalForm.category, deadline: goalForm.deadline, milestones: mlList, userId: user?.id }); 
    }
    setGoalForm({ title: '', category: 'Cá nhân', deadline: format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), milestones: '' });
    setEditingGoalId(null);
    setShowGoalModal(false); 
  };

  const handleEditGoal = (goal: Goal) => {
    setGoalForm({ title: goal.title, category: goal.category || 'Cá nhân', deadline: goal.deadline.split('T')[0], milestones: goal.milestones.map(m => m.title).join('\n') });
    setEditingGoalId(goal.id);
    setShowGoalModal(true);
  };

  const handleLog = () => {
    if (showLogModal && logValue) {
      const activity = activities.find(a => a.id === showLogModal);
      if (activity) {
        const val = parseFloat(logValue);
        let newLogs = [...activity.logs];
        const existingIdx = newLogs.findIndex(l => l.date === logDate);
        if (existingIdx >= 0) {
          if (val === 0) newLogs.splice(existingIdx, 1);
          else newLogs[existingIdx] = { ...newLogs[existingIdx], value: val, note: logNote };
        } else if (val > 0) newLogs.push({ date: logDate, value: val, note: logNote });
        updateAct({ id: showLogModal, data: { logs: newLogs } });
      }
      setShowLogModal(null); setLogValue(''); setLogNote('');
    }
  };

  const quickLog = (activityId: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;
    const todayLog = activity.logs.find(l => l.date === todayStr);
    let newLogs;
    if (todayLog) newLogs = activity.logs.filter(l => l.date !== todayStr);
    else newLogs = [...activity.logs, { date: todayStr, value: activity.targetPerDay }];
    updateAct({ id: activityId, data: { logs: newLogs } });
  };

  const completeMilestone = (goalId: string, milestoneId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const newMilestones = goal.milestones.map(m => m.id === milestoneId ? { ...m, completed: !m.completed } : m);
    updateGoal({ id: goalId, data: { milestones: newMilestones } });
  };

  const toggleHabit = (habitId: string, date: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    const newDates = habit.completedDates.includes(date) ? habit.completedDates.filter(d => d !== date) : [...habit.completedDates, date];
    updateHab({ id: habitId, data: { completedDates: newDates } });
  };

  if (isLoading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">🌱 Phát triển bản thân</h1></div>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {[{ key: 'routines', label: '🔄 Thói quen & Hoạt động', c: habits.length + activities.length }, { key: 'goals', label: '🎯 Mục tiêu', c: goals.length }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)} className={`px-4 py-2 rounded-lg font-medium flex gap-2 ${activeTab === t.key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
            {t.label} <span className="bg-gray-200 dark:bg-gray-600 text-xs px-1.5 py-0.5 rounded-full">{t.c}</span>
          </button>
        ))}
      </div>

      {/* --- TAB THÓI QUEN VÀ HOẠT ĐỘNG ĐÃ GỘP --- */}
      {activeTab === 'routines' && (
        <div className="space-y-6">
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowHabitModal(true)} className="flex items-center gap-2 bg-white dark:bg-gray-800 border dark:border-gray-700 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"><Plus className="w-5 h-5" /> Tạo thói quen</button>
            <button onClick={() => setShowActivityModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium shadow-sm hover:bg-indigo-700"><Plus className="w-5 h-5" /> Ghi log hoạt động</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Render Thói quen (Habits) */}
            {habits.map(habit => {
              const todayDone = habit.completedDates.includes(todayStr);
              const streak = getStreak(habit.completedDates);
              return (
                <div key={habit.id} className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 overflow-hidden shadow-sm flex flex-col">
                  <div className="p-4 border-b dark:border-gray-700 flex justify-between" style={{ backgroundColor: `${habit.color}15` }}>
                    <div className="flex gap-3"><div className="text-2xl">{habit.icon}</div><h3 className="font-bold dark:text-white mt-1">{habit.name}</h3></div>
                    <button onClick={() => delHab(habit.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                  </div>
                  <div className="flex gap-2 p-3 bg-gray-50 dark:bg-gray-900/30 text-xs text-gray-500 font-medium justify-between">
                    <span className="flex items-center gap-1 text-orange-500"><Flame className="w-4 h-4" /> {streak} chuỗi</span>
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Tổng: {habit.completedDates.length}</span>
                  </div>
                  <div className="p-4 border-b dark:border-gray-700 flex gap-1 justify-between flex-1">
                    {last7Days.map((day, i) => {
                      const dStr = format(day, 'yyyy-MM-dd');
                      const done = habit.completedDates.includes(dStr);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] text-gray-400">{format(day, 'EE', { locale: vi }).slice(0, 2)}</span>
                          <button onClick={() => toggleHabit(habit.id, dStr)} className={`w-full aspect-square rounded-lg font-bold text-xs transition-colors ${done ? 'text-white' : 'bg-gray-100 dark:bg-gray-700'}`} style={done ? { backgroundColor: habit.color } : {}}>{done ? '✓' : ''}</button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-4"><button onClick={() => toggleHabit(habit.id, todayStr)} className={`w-full py-2.5 rounded-xl text-sm font-semibold flex justify-center gap-2 transition-colors ${todayDone ? 'bg-green-100 text-green-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>{todayDone ? <><CheckCircle2 className="w-4 h-4"/> Đã hoàn thành</> : '☐ Đánh dấu hôm nay'}</button></div>
                </div>
              );
            })}

            {/* Render Hoạt động (Activities) */}
            {activities.map(act => {
              const todayLog = act.logs.find(l => l.date === todayStr);
              const logDates = act.logs.filter(l => l.value > 0).map(l => l.date);
              const streak = getStreak(logDates);
              
              // Chuẩn bị dữ liệu cho biểu đồ (7 ngày qua)
              const chartData = last7Days.map(day => {
                const l = act.logs.find(log => log.date === format(day, 'yyyy-MM-dd'));
                return { name: format(day, 'EE', {locale:vi}), value: l ? l.value : 0 };
              });

              return (
                <div key={act.id} className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 overflow-hidden shadow-sm flex flex-col">
                  <div className="p-4 border-b dark:border-gray-700 flex justify-between">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${act.color}15` }}>{act.icon}</div><div><h3 className="font-bold dark:text-white leading-tight">{act.name}</h3><p className="text-[11px] text-gray-500">Mục tiêu: {act.targetPerDay} {act.unit}</p></div></div>
                    <div className="flex gap-1"><button onClick={() => { setShowLogModal(act.id); setLogDate(todayStr); setLogValue(todayLog ? String(todayLog.value) : ''); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400"><Edit2 className="w-4 h-4"/></button><button onClick={() => delAct(act.id)} className="p-1.5 hover:bg-red-50 rounded text-red-400"><Trash2 className="w-4 h-4"/></button></div>
                  </div>
                  <div className="flex gap-2 p-3 bg-gray-50 dark:bg-gray-900/30 text-xs text-gray-500 font-medium justify-between">
                    <span className="flex items-center gap-1 text-orange-500"><Flame className="w-4 h-4" /> {streak} chuỗi</span>
                    <span className="flex items-center gap-1"><ActivityIcon className="w-4 h-4" /> Tổng: {logDates.length} lần</span>
                  </div>
                  <div className="px-4 pt-3 h-[70px] flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ fontSize: '12px', padding: '4px' }} formatter={(val: number) => [`${val} ${act.unit}`, act.name]} />
                        <Bar dataKey="value" fill={act.color} radius={[3,3,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="p-4 border-t dark:border-gray-700"><button onClick={() => quickLog(act.id)} className={`w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm transition-colors ${todayLog ? 'bg-green-50 text-green-700 border-2 border-green-200' : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-400'}`}>{todayLog ? <><CheckCircle2 className="w-4 h-4"/> Đã ghi ({todayLog.value} {act.unit})</> : <><Plus className="w-4 h-4"/> Click để ghi nhận</>}</button></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB MỤC TIÊU GIỮ NGUYÊN NHƯ CŨ --- */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          <div className="flex justify-end"><button onClick={() => { setGoalForm({ title: '', category: 'Cá nhân', deadline: format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), milestones: '' }); setEditingGoalId(null); setShowGoalModal(true); }} className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl font-medium"><Plus className="w-5 h-5" /> Tạo mục tiêu</button></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {goals.map(goal => {
              const progress = goal.milestones.length > 0 ? Math.round((goal.milestones.filter(m => m.completed).length / goal.milestones.length) * 100) : 0;
              const isCompleted = progress >= 100;
              return (
                <div key={goal.id} className={`bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 overflow-hidden ${isCompleted ? 'ring-2 ring-green-500' : ''}`}>
                  <div className="p-4 border-b dark:border-gray-700 flex justify-between">
                    <div><h3 className="font-bold dark:text-white">{goal.title}</h3><span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full mt-1 inline-block">{goal.category}</span></div>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold mr-2" style={{ color: isCompleted ? '#22c55e' : '#6366f1' }}>{progress}%</div>
                      <button onClick={() => handleEditGoal(goal)} className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors"><Edit2 className="w-4 h-4"/></button>
                      <button onClick={() => delGoal(goal.id)} className="p-1 text-red-400 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-2"><div className={`h-2 transition-all ${isCompleted ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${progress}%` }} /></div>
                  <div className="p-4 space-y-1.5 max-h-[250px] overflow-y-auto">
                    {goal.milestones.map((m, idx) => (
                      <label key={m.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                        <input type="checkbox" checked={m.completed} onChange={() => completeMilestone(goal.id, m.id)} className="w-4 h-4 rounded text-indigo-600" />
                        <span className={`text-sm flex-1 ${m.completed ? 'line-through text-gray-400' : 'dark:text-white'}`}>{idx + 1}. {m.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- MODALS --- */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"><div className="bg-white dark:bg-gray-800 rounded-xl p-5 w-full max-w-md"><div className="flex justify-between mb-4"><h2 className="font-bold text-lg dark:text-white">{editingGoalId ? 'Sửa mục tiêu' : 'Tạo mục tiêu'}</h2><button onClick={() => setShowGoalModal(false)}><X className="w-5 h-5"/></button></div><form onSubmit={handleAddGoal} className="space-y-3"><input type="text" value={goalForm.title} onChange={e => setGoalForm({...goalForm, title: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" required placeholder="Tên mục tiêu *" /><select value={goalForm.category} onChange={e => setGoalForm({...goalForm, category: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white">{goalCategories.map(c => <option key={c} value={c}>{c}</option>)}</select><input type="date" value={goalForm.deadline} onChange={e => setGoalForm({...goalForm, deadline: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" required /><textarea value={goalForm.milestones} onChange={e => setGoalForm({...goalForm, milestones: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" rows={6} placeholder="Các cột mốc (mỗi dòng 1 mốc)&#10;Mốc 1&#10;Mốc 2" /><button type="submit" className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors">{editingGoalId ? 'Cập nhật mục tiêu' : 'Lưu mục tiêu'}</button></form></div></div>
      )}

      {showHabitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"><div className="bg-white dark:bg-gray-800 rounded-xl p-5 w-full max-w-md"><div className="flex justify-between mb-4"><h2 className="font-bold text-lg dark:text-white">Tạo thói quen</h2><button onClick={() => setShowHabitModal(false)}><X className="w-5 h-5"/></button></div><div className="mb-4 flex flex-wrap gap-2">{habitPresets.map((p, i) => <button key={i} type="button" onClick={() => addHab({ name: p.name, icon: p.icon, color: p.color, frequency: p.frequency, userId: user?.id, completedDates: [], streak: 0 })} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm">{p.icon} {p.name}</button>)}</div><form onSubmit={handleAddHabit} className="space-y-3"><input type="text" value={habitForm.name} onChange={e => setHabitForm({...habitForm, name: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" required placeholder="Hoặc tự tạo thói quen *" /><div className="flex gap-2 flex-wrap">{iconOptions.map(icon => <button key={icon} type="button" onClick={() => setHabitForm({ ...habitForm, icon })} className={`w-8 h-8 rounded ${habitForm.icon === icon ? 'bg-indigo-100 ring-2' : 'bg-gray-100'}`}>{icon}</button>)}</div><div className="flex gap-2 flex-wrap">{colorOptions.map(color => <button key={color} type="button" onClick={() => setHabitForm({ ...habitForm, color })} className={`w-6 h-6 rounded-full ${habitForm.color === color ? 'ring-2 ring-offset-2' : ''}`} style={{ backgroundColor: color }} />)}</div><button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded">Lưu thói quen</button></form></div></div>
      )}

      {showActivityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"><div className="bg-white dark:bg-gray-800 rounded-xl p-5 w-full max-w-md"><div className="flex justify-between mb-4"><h2 className="font-bold text-lg dark:text-white">Tạo hoạt động</h2><button onClick={() => setShowActivityModal(false)}><X className="w-5 h-5"/></button></div><div className="mb-4 flex flex-wrap gap-2">{activityPresets.map((p, i) => <button key={i} type="button" onClick={() => addAct({ name: p.name, icon: p.icon, color: p.color, unit: p.unit, targetPerDay: p.targetPerDay, userId: user?.id, logs: [] })} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm">{p.icon} {p.name}</button>)}</div><form onSubmit={handleAddActivity} className="space-y-3"><input type="text" value={activityForm.name} onChange={e => setActivityForm({...activityForm, name: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" required placeholder="Hoặc tự tạo tên *" /><div className="grid grid-cols-2 gap-2"><input type="number" value={activityForm.targetPerDay} onChange={e => setActivityForm({...activityForm, targetPerDay: Number(e.target.value)})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" placeholder="Mục tiêu/ngày" /><input type="text" value={activityForm.unit} onChange={e => setActivityForm({...activityForm, unit: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" placeholder="Đơn vị (phút, km...)" /></div><button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded">Lưu hoạt động</button></form></div></div>
      )}

      {showLogModal && (() => {
        const activity = activities.find(a => a.id === showLogModal);
        if (!activity) return null;
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"><div className="bg-white dark:bg-gray-800 rounded-xl p-5 w-full max-w-sm"><h2 className="font-bold text-lg mb-4 dark:text-white">{activity.icon} Ghi nhận {activity.name}</h2><div className="space-y-4"><div><label className="block text-sm mb-1 dark:text-gray-300">Ngày</label><input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" /></div><div><label className="block text-sm mb-1 dark:text-gray-300">Giá trị ({activity.unit})</label><input type="number" value={logValue} onChange={e => setLogValue(e.target.value)} className="w-full p-2 border rounded text-lg font-bold text-center dark:bg-gray-700 dark:text-white" min={0} step="any" placeholder={`Mục tiêu: ${activity.targetPerDay}`} /></div><div><label className="block text-sm mb-1 dark:text-gray-300">Ghi chú</label><input type="text" value={logNote} onChange={e => setLogNote(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" /></div><div className="flex gap-2"><button onClick={() => { setShowLogModal(null); setLogValue(''); setLogNote(''); }} className="flex-1 p-2 border rounded hover:bg-gray-50">Hủy</button><button onClick={handleLog} className="flex-1 p-2 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white rounded">Lưu</button></div></div></div></div>
        );
      })()}
    </div>
  );
}

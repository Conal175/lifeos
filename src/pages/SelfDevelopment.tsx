import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTableData } from '../hooks/useData';
import { Activity, Habit, Goal } from '../types';
import { Plus, Trash2, X, Flame, TrendingUp, Calendar, CheckCircle2, Target, ChevronRight } from 'lucide-react';
import { format, subDays, differenceInDays, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';

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
  // ĐÃ KHÔI PHỤC: Sử dụng bảng Goals đúng chuẩn
  const { data: goals = [], isLoading: loadG, addRecord: addGoal, updateRecord: updateGoal, deleteRecord: delGoal } = useTableData<Goal>('goals');
  
  const isLoading = loadA || loadH || loadG;

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

  const [activityForm, setActivityForm] = useState({ name: '', icon: '🏃', color: '#ef4444', unit: 'km', targetPerDay: 5 });
  const [habitForm, setHabitForm] = useState({ name: '', icon: '🎯', color: '#6366f1', frequency: 'daily' as 'daily' | 'weekly' });
  const [goalForm, setGoalForm] = useState({ title: '', category: 'Cá nhân', deadline: format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), milestones: '' });

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));

  const handleAddActivity = (e: React.FormEvent) => { e.preventDefault(); addAct({ ...activityForm, userId: user?.id, logs: [] }); setShowActivityModal(false); };
  const handleAddHabit = (e: React.FormEvent) => { e.preventDefault(); addHab({ ...habitForm, userId: user?.id, completedDates: [], streak: 0 }); setShowHabitModal(false); };
  const handleAddGoal = (e: React.FormEvent) => { 
    e.preventDefault(); 
    const mlList = goalForm.milestones.split('\n').filter(m => m.trim()).map((title, i) => ({ id: `m-${Date.now()}-${i}`, title: title.trim(), completed: false }));
    addGoal({ title: goalForm.title, category: goalForm.category, deadline: goalForm.deadline, milestones: mlList, userId: user?.id }); 
    setGoalForm({ title: '', category: 'Cá nhân', deadline: format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), milestones: '' });
    setShowGoalModal(false); 
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
        } else if (val > 0) {
          newLogs.push({ date: logDate, value: val, note: logNote });
        }
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
        {[{ key: 'goals', label: '🎯 Mục tiêu', c: goals.length }, { key: 'habits', label: '🔄 Thói quen', c: habits.length }, { key: 'activities', label: '🏃 Hoạt động', c: activities.length }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)} className={`px-4 py-2 rounded-lg font-medium flex gap-2 ${activeTab === t.key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
            {t.label} <span className="bg-gray-200 dark:bg-gray-600 text-xs px-1.5 py-0.5 rounded-full">{t.c}</span>
          </button>
        ))}
      </div>

      {activeTab === 'goals' && (
        <div className="space-y-4">
          <div className="flex justify-end"><button onClick={() => setShowGoalModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl font-medium"><Plus className="w-5 h-5" /> Tạo mục tiêu</button></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {goals.map(goal => {
              const progress = goal.milestones.length > 0 ? Math.round((goal.milestones.filter(m => m.completed).length / goal.milestones.length) * 100) : 0;
              const isCompleted = progress >= 100;
              return (
                <div key={goal.id} className={`bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 overflow-hidden ${isCompleted ? 'ring-2 ring-green-500' : ''}`}>
                  <div className="p-4 border-b dark:border-gray-700 flex justify-between">
                    <div><h3 className="font-bold dark:text-white">{goal.title}</h3><span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full mt-1 inline-block">{goal.category}</span></div>
                    <div className="flex gap-2"><div className="text-2xl font-bold" style={{ color: isCompleted ? '#22c55e' : '#6366f1' }}>{progress}%</div><button onClick={() => delGoal(goal.id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button></div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-2"><div className={`h-2 transition-all ${isCompleted ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${progress}%` }} /></div>
                  <div className="p-4 space-y-1.5">
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

      {activeTab === 'habits' && (
        <div className="space-y-4">
          <div className="flex justify-between">
            <div className="flex gap-2">
              <button onClick={() => setHabitViewMode('grid')} className={`px-4 py-2 rounded-lg text-sm font-medium ${habitViewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`}>🔲 Lưới</button>
              <button onClick={() => setHabitViewMode('horizontal')} className={`px-4 py-2 rounded-lg text-sm font-medium ${habitViewMode === 'horizontal' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`}>📊 Ngang</button>
            </div>
            <button onClick={() => setShowHabitModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium"><Plus className="w-5 h-5" /> Thêm thói quen</button>
          </div>
          {habitViewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {habits.map(habit => {
                const todayDone = habit.completedDates.includes(todayStr);
                return (
                  <div key={habit.id} className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b dark:border-gray-700 flex justify-between" style={{ backgroundColor: `${habit.color}15` }}>
                      <div className="flex gap-3"><div className="text-2xl">{habit.icon}</div><h3 className="font-bold dark:text-white mt-1">{habit.name}</h3></div>
                      <button onClick={() => delHab(habit.id)} className="text-red-400"><Trash2 className="w-4 h-4"/></button>
                    </div>
                    <div className="p-4 border-b dark:border-gray-700 flex gap-1">
                      {last7Days.map((day, i) => {
                        const dStr = format(day, 'yyyy-MM-dd');
                        const done = habit.completedDates.includes(dStr);
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <button onClick={() => toggleHabit(habit.id, dStr)} className={`w-full aspect-square rounded-lg font-bold text-xs ${done ? 'text-white' : 'bg-gray-100 dark:bg-gray-700'}`} style={done ? { backgroundColor: habit.color } : {}}>{done ? '✓' : ''}</button>
                            <span className="text-[10px] text-gray-400">{format(day, 'EEEE', { locale: vi }).slice(0, 2)}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="p-4"><button onClick={() => toggleHabit(habit.id, todayStr)} className={`w-full py-2.5 rounded-xl text-sm font-semibold flex justify-center gap-2 ${todayDone ? 'bg-green-100 text-green-700' : 'bg-indigo-600 text-white'}`}>{todayDone ? <><CheckCircle2 className="w-4 h-4"/> Đã hoàn thành</> : '☐ Hoàn thành hôm nay'}</button></div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 overflow-hidden">
              <div className="grid grid-cols-[200px_repeat(7,1fr)] gap-2 p-4 bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                <div className="text-sm font-semibold dark:text-gray-300">Thói quen</div>
                {last7Days.map((d, i) => <div key={i} className="text-center text-xs dark:text-gray-400">{format(d, 'dd/MM')}</div>)}
              </div>
              {habits.map(habit => (
                <div key={habit.id} className="grid grid-cols-[200px_repeat(7,1fr)] gap-2 p-4 border-b dark:border-gray-700 items-center">
                  <div className="flex items-center gap-3"><div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-lg">{habit.icon}</div><span className="font-medium text-sm dark:text-white">{habit.name}</span></div>
                  {last7Days.map((day, i) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const done = habit.completedDates.includes(dateStr);
                    return <div key={i} className="flex justify-center"><button onClick={() => toggleHabit(habit.id, dateStr)} className={`w-8 h-8 rounded font-bold ${done ? 'text-white' : 'bg-gray-100 dark:bg-gray-700'}`} style={done ? { backgroundColor: habit.color } : {}}>{done ? '✓' : ''}</button></div>;
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'activities' && (
        <div className="space-y-4">
          <div className="flex justify-end"><button onClick={() => setShowActivityModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium"><Plus className="w-5 h-5" /> Thêm hoạt động</button></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activities.map(act => {
              const todayLog = act.logs.find(l => l.date === todayStr);
              return (
                <div key={act.id} className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 overflow-hidden">
                  <div className="p-4 border-b dark:border-gray-700 flex justify-between">
                    <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${act.color}15` }}>{act.icon}</div><div><h3 className="font-bold dark:text-white">{act.name}</h3><p className="text-xs text-gray-500">Mục tiêu: {act.targetPerDay} {act.unit}/ngày</p></div></div>
                    <div className="flex gap-1"><button onClick={() => { setShowLogModal(act.id); setLogDate(todayStr); setLogValue(todayLog ? String(todayLog.value) : ''); }} className="p-2"><Edit2 className="w-4 h-4 text-gray-400"/></button><button onClick={() => delAct(act.id)} className="p-2"><Trash2 className="w-4 h-4 text-red-400"/></button></div>
                  </div>
                  <div className="p-4 border-b dark:border-gray-700"><button onClick={() => quickLog(act.id)} className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${todayLog ? 'bg-green-50 text-green-700 border-2 border-green-200' : 'bg-gray-50 text-gray-600 border-2 border-dashed'}`}>{todayLog ? <><CheckCircle2 className="w-5 h-5"/> Đã hoàn thành ({todayLog.value} {act.unit})</> : <><Plus className="w-5 h-5"/> Đánh dấu hoàn thành hôm nay</>}</button></div>
                  <div className="p-4 flex gap-1.5">
                    {last7Days.map((day, i) => {
                      const dStr = format(day, 'yyyy-MM-dd');
                      const log = act.logs.find(l => l.date === dStr);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div onClick={() => { setShowLogModal(act.id); setLogDate(dStr); setLogValue(log ? String(log.value) : ''); }} className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer ${log ? 'text-white' : 'bg-gray-100 dark:bg-gray-700'}`} style={log ? { backgroundColor: act.color } : {}}>{log ? '✓' : ''}</div>
                          <span className="text-[10px] text-gray-400">{format(day, 'EE', { locale: vi }).slice(0, 2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"><div className="bg-white dark:bg-gray-800 rounded-xl p-5 w-full max-w-md"><div className="flex justify-between mb-4"><h2 className="font-bold text-lg dark:text-white">Tạo mục tiêu</h2><button onClick={() => setShowGoalModal(false)}><X className="w-5 h-5"/></button></div><form onSubmit={handleAddGoal} className="space-y-3"><input type="text" value={goalForm.title} onChange={e => setGoalForm({...goalForm, title: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" required placeholder="Tên mục tiêu *" /><select value={goalForm.category} onChange={e => setGoalForm({...goalForm, category: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white">{goalCategories.map(c => <option key={c} value={c}>{c}</option>)}</select><input type="date" value={goalForm.deadline} onChange={e => setGoalForm({...goalForm, deadline: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" required /><textarea value={goalForm.milestones} onChange={e => setGoalForm({...goalForm, milestones: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" rows={4} placeholder="Các cột mốc (mỗi dòng 1 mốc)&#10;Mốc 1&#10;Mốc 2" /><button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded">Lưu mục tiêu</button></form></div></div>
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"><div className="bg-white dark:bg-gray-800 rounded-xl p-5 w-full max-w-sm"><h2 className="font-bold text-lg mb-4 dark:text-white">{activity.icon} Ghi nhận {activity.name}</h2><div className="space-y-4"><div><label className="block text-sm mb-1 dark:text-gray-300">Ngày</label><input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" /></div><div><label className="block text-sm mb-1 dark:text-gray-300">Giá trị ({activity.unit})</label><input type="number" value={logValue} onChange={e => setLogValue(e.target.value)} className="w-full p-2 border rounded text-lg font-bold text-center dark:bg-gray-700 dark:text-white" min={0} step="any" placeholder={`Mục tiêu: ${activity.targetPerDay}`} /></div><div><label className="block text-sm mb-1 dark:text-gray-300">Ghi chú</label><input type="text" value={logNote} onChange={e => setLogNote(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" /></div><div className="flex gap-2"><button onClick={() => { setShowLogModal(null); setLogValue(''); setLogNote(''); }} className="flex-1 p-2 border rounded">Hủy</button><button onClick={handleLog} className="flex-1 p-2 bg-indigo-600 text-white rounded">Lưu</button></div></div></div></div>
        );
      })()}
    </div>
  );
}

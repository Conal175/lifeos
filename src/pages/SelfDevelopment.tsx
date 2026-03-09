import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTableData } from '../hooks/useData';
import { Activity, Habit, Goal } from '../types';
import { Plus, Trash2, X, Flame, TrendingUp, Calendar, CheckCircle2, Target } from 'lucide-react';
import { format, subDays, differenceInDays, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';

export function SelfDevelopment() {
  const { user } = useApp();
  const { data: activities = [], isLoading: loadA, addRecord: addAct, updateRecord: updateAct, deleteRecord: delAct } = useTableData<Activity>('activities');
  const { data: habits = [], isLoading: loadH, addRecord: addHab, updateRecord: updateHab, deleteRecord: delHab } = useTableData<Habit>('habits');
  const { data: goals = [], isLoading: loadG, addRecord: addGoal, updateRecord: updateGoal, deleteRecord: delGoal } = useTableData<Goal>('goals');
  
  const isLoading = loadA || loadH || loadG;

  const [activeTab, setActiveTab] = useState<'goals' | 'habits' | 'activities'>('goals');
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  
  const [activityForm, setActivityForm] = useState({ name: '', icon: '🏃', color: '#ef4444', unit: 'km', targetPerDay: 5 });
  const [habitForm, setHabitForm] = useState({ name: '', icon: '🎯', color: '#6366f1', frequency: 'daily' as 'daily' | 'weekly' });
  const [goalForm, setGoalForm] = useState({ title: '', category: 'Cá nhân', deadline: format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), milestones: '' });

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));

  // --- CUSTOM ACTIONS REACT QUERY ---
  const toggleHabit = (habitId: string, date: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    const newDates = habit.completedDates.includes(date) ? habit.completedDates.filter(d => d !== date) : [...habit.completedDates, date];
    updateHab({ id: habitId, data: { completedDates: newDates } });
  };

  const completeMilestone = (goalId: string, milestoneId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const newMilestones = goal.milestones.map(m => m.id === milestoneId ? { ...m, completed: !m.completed } : m);
    updateGoal({ id: goalId, data: { milestones: newMilestones } });
  };

  const quickLog = (activityId: string) => {
    const act = activities.find(a => a.id === activityId);
    if (!act) return;
    const existing = act.logs.find(l => l.date === todayStr);
    let newLogs = act.logs;
    if (existing) newLogs = newLogs.filter(l => l.date !== todayStr); // Xóa log hôm nay
    else newLogs = [...newLogs, { date: todayStr, value: act.targetPerDay }]; // Thêm log hôm nay
    updateAct({ id: activityId, data: { logs: newLogs } });
  };

  // --- SUBMIT FORMS ---
  const handleAddActivity = (e: React.FormEvent) => { e.preventDefault(); addAct({ ...activityForm, userId: user?.id, logs: [] }); setShowActivityModal(false); };
  const handleAddHabit = (e: React.FormEvent) => { e.preventDefault(); addHab({ ...habitForm, userId: user?.id, completedDates: [], streak: 0 }); setShowHabitModal(false); };
  const handleAddGoal = (e: React.FormEvent) => { 
    e.preventDefault(); 
    const mlList = goalForm.milestones.split('\n').filter(m => m.trim()).map((t, i) => ({ id: `m-${Date.now()}-${i}`, title: t.trim(), completed: false }));
    addGoal({ title: goalForm.title, category: goalForm.category, deadline: goalForm.deadline, milestones: mlList, userId: user?.id }); 
    setShowGoalModal(false); 
  };

  if (isLoading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">🌱 Phát triển bản thân</h1></div>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {[{ key: 'goals', label: '🎯 Mục tiêu', c: goals.length }, { key: 'habits', label: '🔄 Thói quen', c: habits.length }, { key: 'activities', label: '🏃 Hoạt động', c: activities.length }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)} className={`px-4 py-2 rounded-lg font-medium ${activeTab === t.key ? 'bg-white dark:bg-gray-700 text-indigo-600' : 'text-gray-500'}`}>
            {t.label} ({t.c})
          </button>
        ))}
      </div>

      {activeTab === 'goals' && (
        <div className="space-y-4">
          <button onClick={() => setShowGoalModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus className="w-5 h-5"/> Tạo mục tiêu</button>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {goals.map(goal => {
              const progress = goal.milestones.length > 0 ? Math.round((goal.milestones.filter(m => m.completed).length / goal.milestones.length) * 100) : 0;
              return (
                <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div><h3 className="font-bold dark:text-white text-lg">{goal.title}</h3><span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mt-1 inline-block">{goal.category}</span></div>
                    <div className="flex items-center gap-2"><span className="font-bold text-indigo-600 text-xl">{progress}%</span><button onClick={() => delGoal(goal.id)} className="text-red-500"><Trash2 className="w-4 h-4"/></button></div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4"><div className="h-2 rounded-full bg-indigo-600" style={{ width: `${progress}%` }} /></div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {goal.milestones.map(m => (
                      <label key={m.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                        <input type="checkbox" checked={m.completed} onChange={() => completeMilestone(goal.id, m.id)} className="w-4 h-4" />
                        <span className={`text-sm flex-1 ${m.completed ? 'line-through text-gray-400' : 'dark:text-white'}`}>{m.title}</span>
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
          <button onClick={() => setShowHabitModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus className="w-5 h-5"/> Tạo thói quen</button>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {habits.map(habit => {
              const todayDone = habit.completedDates.includes(todayStr);
              return (
                <div key={habit.id} className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 overflow-hidden">
                  <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center" style={{ backgroundColor: `${habit.color}10` }}>
                    <div className="flex items-center gap-3"><div className="text-2xl">{habit.icon}</div><h3 className="font-bold dark:text-white">{habit.name}</h3></div>
                    <button onClick={() => delHab(habit.id)}><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </div>
                  <div className="p-4 flex gap-1 justify-between">
                    {last7Days.map((day, i) => {
                      const dStr = format(day, 'yyyy-MM-dd');
                      const done = habit.completedDates.includes(dStr);
                      return (
                        <div key={i} className="flex flex-col items-center">
                          <button onClick={() => toggleHabit(habit.id, dStr)} className={`w-8 h-8 rounded text-xs font-bold ${done ? 'text-white' : 'bg-gray-100 dark:bg-gray-700'}`} style={done ? { backgroundColor: habit.color } : {}}>{done ? '✓' : ''}</button>
                          <span className="text-[10px] text-gray-500 mt-1">{format(day, 'EE', { locale: vi })}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-4 pt-0">
                    <button onClick={() => toggleHabit(habit.id, todayStr)} className={`w-full py-2 rounded-xl text-sm font-bold ${todayDone ? 'bg-green-100 text-green-700' : 'bg-indigo-600 text-white'}`}>{todayDone ? '✅ Đã hoàn thành' : 'Hoàn thành hôm nay'}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'activities' && (
        <div className="space-y-4">
          <button onClick={() => setShowActivityModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus className="w-5 h-5"/> Tạo hoạt động</button>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activities.map(act => {
              const todayLog = act.logs.find(l => l.date === todayStr);
              return (
                <div key={act.id} className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3"><div className="text-3xl">{act.icon}</div><div><h3 className="font-bold dark:text-white">{act.name}</h3><span className="text-xs text-gray-500">Mục tiêu: {act.targetPerDay} {act.unit}/ngày</span></div></div>
                    <button onClick={() => delAct(act.id)}><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </div>
                  <button onClick={() => quickLog(act.id)} className={`w-full py-3 rounded-xl font-bold mb-4 ${todayLog ? 'bg-green-100 text-green-700 border-2 border-green-500' : 'bg-gray-100 dark:bg-gray-700 dark:text-white border-2 border-dashed border-gray-300'}`}>
                    {todayLog ? `✅ Hoàn thành (${act.targetPerDay} ${act.unit})` : 'Đánh dấu hoàn thành hôm nay'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals rút gọn tương tự trang khác */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 w-full max-w-md">
            <h2 className="font-bold text-lg mb-4 dark:text-white">Tạo mục tiêu</h2>
            <form onSubmit={handleAddGoal} className="space-y-3">
              <input type="text" value={goalForm.title} onChange={e => setGoalForm({...goalForm, title: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" required placeholder="Tên mục tiêu" />
              <input type="date" value={goalForm.deadline} onChange={e => setGoalForm({...goalForm, deadline: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" required />
              <textarea value={goalForm.milestones} onChange={e => setGoalForm({...goalForm, milestones: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" rows={4} placeholder="Các cột mốc (mỗi dòng 1 mốc)" />
              <div className="flex gap-2"><button type="button" onClick={() => setShowGoalModal(false)} className="flex-1 p-2 border rounded">Hủy</button><button type="submit" className="flex-1 bg-indigo-600 text-white rounded">Lưu</button></div>
            </form>
          </div>
        </div>
      )}

      {showHabitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 w-full max-w-md">
            <h2 className="font-bold text-lg mb-4 dark:text-white">Tạo thói quen</h2>
            <form onSubmit={handleAddHabit} className="space-y-3">
              <input type="text" value={habitForm.name} onChange={e => setHabitForm({...habitForm, name: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" required placeholder="Tên thói quen (vd: Dậy sớm)" />
              <input type="text" value={habitForm.icon} onChange={e => setHabitForm({...habitForm, icon: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" placeholder="Icon (Emoji)" />
              <div className="flex gap-2"><button type="button" onClick={() => setShowHabitModal(false)} className="flex-1 p-2 border rounded">Hủy</button><button type="submit" className="flex-1 bg-indigo-600 text-white rounded">Lưu</button></div>
            </form>
          </div>
        </div>
      )}

      {showActivityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 w-full max-w-md">
            <h2 className="font-bold text-lg mb-4 dark:text-white">Tạo hoạt động</h2>
            <form onSubmit={handleAddActivity} className="space-y-3">
              <input type="text" value={activityForm.name} onChange={e => setActivityForm({...activityForm, name: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" required placeholder="Tên (vd: Chạy bộ)" />
              <input type="number" value={activityForm.targetPerDay} onChange={e => setActivityForm({...activityForm, targetPerDay: Number(e.target.value)})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" placeholder="Mục tiêu (vd: 5)" />
              <input type="text" value={activityForm.unit} onChange={e => setActivityForm({...activityForm, unit: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" placeholder="Đơn vị (vd: km)" />
              <div className="flex gap-2"><button type="button" onClick={() => setShowActivityModal(false)} className="flex-1 p-2 border rounded">Hủy</button><button type="submit" className="flex-1 bg-indigo-600 text-white rounded">Lưu</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

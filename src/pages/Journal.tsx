import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTableData } from '../hooks/useData';
import { Journal, Habit, Activity } from '../types';
import { Plus, Trash2, X, Calendar, Edit2, LayoutGrid, List, Moon, Scale, Heart, Sparkles, Activity as ActivityIcon } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, parseISO, isWithinInterval, startOfWeek, endOfWeek, startOfYear, endOfYear } from 'date-fns';
import { vi } from 'date-fns/locale';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, BarChart, Bar, ComposedChart } from 'recharts';

const moodEmojis = ['😢', '😟', '😐', '😊', '😄'];
const moodLabels = ['Rất buồn', 'Buồn', 'Bình thường', 'Vui', 'Rất vui'];
const moodColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

export function JournalPage() {
  const { user } = useApp();
  const { data: journal = [], isLoading: loadJ, addRecord: addJ, updateRecord: updateJ, deleteRecord: deleteJ } = useTableData<Journal>('journal', 'date', 365);
  const { data: habits = [], isLoading: loadH, updateRecord: updateH } = useTableData<Habit>('habits');
  const { data: activities = [], isLoading: loadA, updateRecord: updateAct } = useTableData<Activity>('activities');
  
  const isLoading = loadJ || loadH || loadA;

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'calendar'>('list');
  const [calendarMonth] = useState(new Date());
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year' | 'custom'>('all');
  const [moodFilter, setMoodFilter] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    content: '', mood: 3, weight: undefined as number | undefined, sleepHours: undefined as number | undefined,
  });

  const toggleHabitDirectly = (habitId: string, dateStr: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    const newDates = habit.completedDates.includes(dateStr) ? habit.completedDates.filter(d => d !== dateStr) : [...habit.completedDates, dateStr];
    updateH({ id: habitId, data: { completedDates: newDates } });
  };

  const updateActivityLogDirectly = (actId: string, dateStr: string, valStr: string) => {
    const act = activities.find(a => a.id === actId);
    if (!act) return;
    const val = parseFloat(valStr);
    let newLogs = [...act.logs];
    const idx = newLogs.findIndex(l => l.date === dateStr);
    if (idx >= 0) {
      if (isNaN(val) || val <= 0) newLogs.splice(idx, 1);
      else newLogs[idx] = { ...newLogs[idx], value: val };
    } else if (!isNaN(val) && val > 0) {
      newLogs.push({ date: dateStr, value: val });
    }
    updateAct({ id: actId, data: { logs: newLogs } });
  };

  const filteredEntries = useMemo(() => {
    let entries = [...journal];
    if (searchQuery) entries = entries.filter(e => e.content.toLowerCase().includes(searchQuery.toLowerCase()) || format(parseISO(e.date), 'EEEE dd/MM/yyyy', { locale: vi }).toLowerCase().includes(searchQuery.toLowerCase()));
    const today = new Date();
    if (dateFilter === 'today') { const ts = format(today, 'yyyy-MM-dd'); entries = entries.filter(e => e.date === ts); } 
    else if (dateFilter === 'week') { const start = startOfWeek(today, { weekStartsOn: 1 }); const end = endOfWeek(today, { weekStartsOn: 1 }); entries = entries.filter(e => isWithinInterval(parseISO(e.date), { start, end })); } 
    else if (dateFilter === 'month') { const start = startOfMonth(today); const end = endOfMonth(today); entries = entries.filter(e => isWithinInterval(parseISO(e.date), { start, end })); } 
    else if (dateFilter === 'year') { const start = startOfYear(today); const end = endOfYear(today); entries = entries.filter(e => isWithinInterval(parseISO(e.date), { start, end })); } 
    if (moodFilter !== null) entries = entries.filter(e => e.mood === moodFilter);
    entries.sort((a, b) => { const diff = new Date(b.date).getTime() - new Date(a.date).getTime(); return sortOrder === 'desc' ? diff : -diff; });
    return entries;
  }, [journal, searchQuery, dateFilter, moodFilter, sortOrder]);

  const chartData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = subDays(new Date(), 29 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const entry = journal.find(j => j.date === dateStr);
      return { date: format(d, 'dd'), mood: entry?.mood || 0, sleep: entry?.sleepHours || 0 };
    });
  }, [journal]);

  const stats = useMemo(() => {
    const thisMonth = journal.filter(j => isSameMonth(parseISO(j.date), new Date()));
    const avgMood = thisMonth.length > 0 ? (thisMonth.reduce((sum, j) => sum + j.mood, 0) / thisMonth.length).toFixed(1) : '0';
    const entriesWithSleep = thisMonth.filter(j => j.sleepHours);
    const avgSleep = entriesWithSleep.length > 0 ? (entriesWithSleep.reduce((sum, j) => sum + (j.sleepHours || 0), 0) / entriesWithSleep.length).toFixed(1) : '0';
    const entriesWithWeight = journal.filter(j => j.weight).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestWeight = entriesWithWeight[0]?.weight;
    
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      if (journal.some(j => j.date === format(subDays(today, i), 'yyyy-MM-dd'))) streak++; else if (i > 0) break;
    }
    return { total: journal.length, thisMonth: thisMonth.length, avgMood, streak, avgSleep, latestWeight };
  }, [journal]);

  // ĐÃ NÂNG CẤP: Chức năng cảnh báo chống mất chữ khi đóng nhầm Modal
  const handleCloseModal = () => {
    let hasChanged = false;
    
    if (editId) {
      const originalEntry = journal.find(j => j.id === editId);
      if (originalEntry) {
        hasChanged = form.content !== originalEntry.content || 
                     form.mood !== originalEntry.mood || 
                     form.weight !== originalEntry.weight || 
                     form.sleepHours !== originalEntry.sleepHours ||
                     form.date !== originalEntry.date;
      }
    } else {
      // Nếu là tạo mới, kiểm tra xem người dùng đã gõ nội dung hoặc đổi thông số chưa
      hasChanged = form.content.trim() !== '' || form.mood !== 3 || form.weight !== undefined || form.sleepHours !== undefined;
    }

    if (hasChanged) {
      const confirmClose = window.confirm('Bạn đang có nội dung nhật ký chưa được lưu. Bạn có chắc chắn muốn đóng và hủy bỏ các thay đổi này không?');
      if (!confirmClose) return;
    }

    resetForm();
    setShowModal(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const journalData = { date: form.date, content: form.content, mood: form.mood, weight: form.weight, sleepHours: form.sleepHours };
    if (editId) updateJ({ id: editId, data: journalData });
    else addJ({ ...journalData, userId: user?.id });
    resetForm(); setShowModal(false); // Submit thành công thì tắt Modal mà không cần hỏi
  };

  const resetForm = () => { setForm({ date: new Date().toISOString().split('T')[0], content: '', mood: 3, weight: undefined, sleepHours: undefined }); setEditId(null); };

  if (isLoading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">📔 Nhật ký cá nhân</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Ghi lại cảm xúc, giấc ngủ, cân nặng và thói quen mỗi ngày</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-colors shadow-sm text-white px-4 py-2 rounded-lg font-medium"><Plus className="w-5 h-5" /> Viết nhật ký</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 shadow-sm"><div className="text-xs text-gray-500 font-medium">Tổng bài</div><div className="text-2xl font-bold dark:text-white mt-1">{stats.total}</div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 shadow-sm"><div className="text-xs text-gray-500 font-medium">Tháng này</div><div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{stats.thisMonth}</div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 shadow-sm"><div className="text-xs text-gray-500 font-medium flex items-center gap-1"><Heart className="w-3 h-3 text-red-500" /> Mood TB</div><div className="text-2xl font-bold dark:text-white flex items-center gap-1 mt-1">{stats.avgMood} </div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 shadow-sm"><div className="text-xs text-gray-500 font-medium flex items-center gap-1"><Moon className="w-3 h-3 text-blue-500" /> Ngủ TB</div><div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.avgSleep}h</div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 shadow-sm"><div className="text-xs text-gray-500 font-medium flex items-center gap-1"><Scale className="w-3 h-3 text-purple-500" /> Cân nặng</div><div className="text-2xl font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-1">{stats.latestWeight ? `${stats.latestWeight}kg` : '-'}</div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 shadow-sm"><div className="text-xs text-gray-500 font-medium">Chuỗi viết</div><div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">🔥 {stats.streak}</div></div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">📊 Theo dõi 30 ngày gần nhất</h3>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
            <YAxis yAxisId="left" domain={[0, 5]} stroke="#6b7280" fontSize={10} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 12]} stroke="#6b7280" fontSize={10} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
            <Area yAxisId="left" type="monotone" dataKey="mood" name="Tâm trạng" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} />
            <Bar yAxisId="right" dataKey="sleep" name="Giấc ngủ" fill="#3b82f6" opacity={0.6} radius={[2, 2, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* List View */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
           <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
             <p className="text-gray-500 dark:text-gray-400">Bạn chưa viết dòng nhật ký nào. Hãy bắt đầu ngay nhé!</p>
           </div>
        ) : (
          filteredEntries.map(entry => {
            const entryDate = parseISO(entry.date);
            const completedHabs = habits.filter(h => h.completedDates.includes(entry.date));
            const completedActs = activities.map(a => ({ ...a, log: a.logs.find(l => l.date === entry.date) })).filter(a => a.log);

            return (
              <div key={entry.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden flex flex-col md:flex-row hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                <div className="w-full md:w-28 flex-shrink-0 flex flex-row md:flex-col items-center justify-between md:justify-center p-4 border-b md:border-b-0 md:border-r dark:border-gray-700" style={{ backgroundColor: `${moodColors[entry.mood - 1]}15` }}>
                  <div className="text-center">
                    <span className="text-2xl font-bold dark:text-white block">{format(entryDate, 'd')}</span>
                    <span className="text-xs text-gray-500 font-medium uppercase block">{format(entryDate, 'MM/yyyy')}</span>
                  </div>
                  <span className="text-3xl" title={moodLabels[entry.mood - 1]}>{moodEmojis[entry.mood - 1]}</span>
                </div>
                <div className="flex-1 p-5">
                  <div className="flex justify-between mb-3">
                    <h3 className="font-bold text-lg dark:text-white capitalize">{format(entryDate, "EEEE", { locale: vi })}</h3>
                    <div className="flex gap-1">
                      <button onClick={() => { setForm({ date: entry.date, content: entry.content, mood: entry.mood, weight: entry.weight || undefined, sleepHours: entry.sleepHours || undefined }); setEditId(entry.id); setShowModal(true); }} className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors" title="Sửa bài viết"><Edit2 className="w-4 h-4 text-amber-500" /></button>
                      <button onClick={() => deleteJ(entry.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Xóa bài viết"><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap mb-4 leading-relaxed">{entry.content}</p>
                  
                  {(completedHabs.length > 0 || completedActs.length > 0) && (
                    <div className="border-t dark:border-gray-700 pt-4 flex flex-wrap gap-2">
                      {completedHabs.map(h => (
                        <span key={h.id} className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800 shadow-sm">
                          <span className="text-sm">{h.icon}</span> <span>{h.name}</span>
                        </span>
                      ))}
                      {completedActs.map(a => (
                        <span key={a.id} className="inline-flex items-center gap-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-green-100 dark:border-green-800 shadow-sm">
                          <span className="text-sm">{a.icon}</span> <span>{a.name} ({a.log?.value} {a.unit})</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Viết Nhật Ký Nâng Cấp */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl p-0 shadow-2xl flex flex-col lg:flex-row overflow-hidden max-h-[90vh] animate-fadeIn">
            
            {/* Phân nửa trái: Form viết text */}
            <div className="flex-1 p-5 lg:p-6 border-b lg:border-b-0 lg:border-r dark:border-gray-700 overflow-y-auto">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                  {editId ? 'Sửa nhật ký' : 'Viết nhật ký'} <span className="text-sm font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">({format(new Date(form.date), 'dd/MM/yyyy')})</span>
                </h2>
                <button onClick={handleCloseModal} className="lg:hidden p-1.5 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 transition-colors"><X className="w-5 h-5 dark:text-white"/></button>
              </div>
              <form id="journal-form" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày viết</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full p-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500" required />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tâm trạng của bạn</label>
                  <div className="flex justify-between bg-gray-50 dark:bg-gray-900/50 p-2 rounded-xl border dark:border-gray-700">
                    {moodEmojis.map((emoji, i) => (
                      <button key={i} type="button" onClick={() => setForm({ ...form, mood: i + 1 })} className={`text-3xl p-2 rounded-xl transition-all ${form.mood === i + 1 ? 'bg-indigo-100 dark:bg-indigo-900/50 ring-2 ring-indigo-500 scale-110 shadow-sm' : 'opacity-50 hover:opacity-100 hover:scale-105'}`} title={moodLabels[i]}>{emoji}</button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-3.5 rounded-xl border dark:border-gray-700">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block uppercase tracking-wider">Giấc ngủ (giờ)</label>
                    <input type="number" placeholder="VD: 7.5" value={form.sleepHours || ''} onChange={e => setForm({ ...form, sleepHours: parseFloat(e.target.value) || undefined })} className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 pb-1.5 dark:text-white focus:outline-none focus:border-indigo-500 font-medium" step="any" />
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-3.5 rounded-xl border dark:border-gray-700">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block uppercase tracking-wider">Cân nặng (kg)</label>
                    <input type="number" placeholder="VD: 65" value={form.weight || ''} onChange={e => setForm({ ...form, weight: parseFloat(e.target.value) || undefined })} className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 pb-1.5 dark:text-white focus:outline-none focus:border-indigo-500 font-medium" step="any" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nội dung nhật ký *</label>
                  <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="w-full p-4 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white h-48 resize-none focus:ring-2 focus:ring-indigo-500 leading-relaxed shadow-sm" placeholder="Hôm nay có điều gì đặc biệt xảy ra với bạn?" required />
                </div>
              </form>
            </div>

            {/* Phân nửa phải: Checkbox Thói quen & Hoạt động trực tiếp */}
            <div className="w-full lg:w-[340px] bg-gray-50 dark:bg-gray-900/50 p-5 lg:p-6 flex flex-col overflow-y-auto">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-500" /> Tracking {format(new Date(form.date), 'dd/MM')}</h3>
                <button onClick={handleCloseModal} className="hidden lg:block p-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full transition-colors"><X className="w-4 h-4 dark:text-white"/></button>
              </div>

              <div className="space-y-6 flex-1">
                {/* Habits */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Thói quen cần làm</p>
                  <div className="space-y-2.5">
                    {habits.map(h => {
                      const isDone = h.completedDates.includes(form.date);
                      return (
                        <label key={h.id} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer border transition-all shadow-sm ${isDone ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-400'}`}>
                          <input type="checkbox" checked={isDone} onChange={() => toggleHabitDirectly(h.id, form.date)} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                          <span className={`text-sm flex-1 ${isDone ? 'font-semibold text-indigo-900 dark:text-indigo-300' : 'font-medium text-gray-700 dark:text-gray-300'}`}>{h.icon} {h.name}</span>
                        </label>
                      );
                    })}
                    {habits.length === 0 && <p className="text-xs text-gray-400 italic">Chưa có thói quen nào được tạo.</p>}
                  </div>
                </div>

                {/* Activities */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Hoạt động trong ngày</p>
                  <div className="space-y-3">
                    {activities.map(a => {
                      const log = a.logs.find(l => l.date === form.date);
                      return (
                        <div key={a.id} className="flex flex-col bg-white dark:bg-gray-800 p-3 rounded-xl border dark:border-gray-700 shadow-sm">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{a.icon} {a.name}</span>
                          <div className="flex items-center gap-2">
                            <input type="number" min={0} step="any" placeholder={`Mục tiêu: ${a.targetPerDay}`} value={log?.value || ''} 
                              onChange={e => updateActivityLogDirectly(a.id, form.date, e.target.value)} 
                              className="flex-1 w-full px-2.5 py-1.5 text-sm font-medium border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500" 
                            />
                            <span className="text-xs font-medium text-gray-500">{a.unit}</span>
                          </div>
                        </div>
                      );
                    })}
                    {activities.length === 0 && <p className="text-xs text-gray-400 italic">Chưa có hoạt động nào được tạo.</p>}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-5 mt-auto border-t dark:border-gray-700">
                <button type="submit" form="journal-form" className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/25 transition-colors">
                  Lưu & Đóng Nhật ký
                </button>
                <p className="text-[10.px] text-center text-gray-400 mt-2.5 italic">* Tick thói quen ở cột này sẽ tự động lưu liền vào bảng phát triển bản thân</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

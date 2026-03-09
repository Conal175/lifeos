import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTableData } from '../hooks/useData';
import { Journal, Habit } from '../types';
import { Plus, Trash2, X, Lock, Unlock, Calendar, Search, Filter, ChevronLeft, ChevronRight, Image, Mic, Heart, Edit2, Eye, SortAsc, SortDesc, LayoutGrid, List, Moon, Scale, Activity, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isWithinInterval, startOfWeek, endOfWeek, startOfYear, endOfYear } from 'date-fns';
import { vi } from 'date-fns/locale';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, LineChart, Line, BarChart, Bar, ComposedChart, Legend } from 'recharts';

const moodEmojis = ['😢', '😟', '😐', '😊', '😄'];
const moodLabels = ['Rất buồn', 'Buồn', 'Bình thường', 'Vui', 'Rất vui'];
const moodColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

export function JournalPage() {
  const { user } = useApp();
  const { data: journal = [], isLoading: loadJ, addRecord: addJ, updateRecord: updateJ, deleteRecord: deleteJ } = useTableData<Journal>('journal', 'date', 365);
  const { data: habits = [], isLoading: loadH, updateRecord: updateH } = useTableData<Habit>('habits');
  
  const isLoading = loadJ || loadH;

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [pin, setPin] = useState('');
  const [showPinPrompt, setShowPinPrompt] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'calendar'>('list');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [activeChart, setActiveChart] = useState<'mood' | 'sleep' | 'weight' | 'combined'>('combined');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year' | 'custom'>('all');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [moodFilter, setMoodFilter] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    content: '', mood: 3, locked: false, attachments: [] as string[],
    weight: undefined as number | undefined, sleepHours: undefined as number | undefined,
    completedHabits: [] as string[]
  });

  const toggleHabit = (habitId: string, date: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    const newDates = habit.completedDates.includes(date) ? habit.completedDates.filter(d => d !== date) : [...habit.completedDates, date];
    updateH({ id: habitId, data: { completedDates: newDates } });
  };

  const filteredEntries = useMemo(() => {
    let entries = [...journal];
    if (searchQuery) entries = entries.filter(e => e.content.toLowerCase().includes(searchQuery.toLowerCase()) || format(parseISO(e.date), 'EEEE dd/MM/yyyy', { locale: vi }).toLowerCase().includes(searchQuery.toLowerCase()));
    const today = new Date();
    if (dateFilter === 'today') { const ts = format(today, 'yyyy-MM-dd'); entries = entries.filter(e => e.date === ts); } 
    else if (dateFilter === 'week') { const start = startOfWeek(today, { weekStartsOn: 1 }); const end = endOfWeek(today, { weekStartsOn: 1 }); entries = entries.filter(e => isWithinInterval(parseISO(e.date), { start, end })); } 
    else if (dateFilter === 'month') { const start = startOfMonth(today); const end = endOfMonth(today); entries = entries.filter(e => isWithinInterval(parseISO(e.date), { start, end })); } 
    else if (dateFilter === 'year') { const start = startOfYear(today); const end = endOfYear(today); entries = entries.filter(e => isWithinInterval(parseISO(e.date), { start, end })); } 
    else if (dateFilter === 'custom' && customDateStart && customDateEnd) { entries = entries.filter(e => e.date >= customDateStart && e.date <= customDateEnd); }
    if (moodFilter !== null) entries = entries.filter(e => e.mood === moodFilter);
    entries.sort((a, b) => { const diff = new Date(b.date).getTime() - new Date(a.date).getTime(); return sortOrder === 'desc' ? diff : -diff; });
    return entries;
  }, [journal, searchQuery, dateFilter, customDateStart, customDateEnd, moodFilter, sortOrder]);

  const calendarDays = useMemo(() => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    const days = eachDayOfInterval({ start, end });
    const startDayOfWeek = start.getDay();
    const paddingStart = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    for (let i = 0; i < paddingStart; i++) days.unshift(subDays(start, paddingStart - i));
    while (days.length % 7 !== 0) days.push(addMonths(end, 1));
    return days.slice(0, 42);
  }, [calendarMonth]);

  const chartData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = subDays(new Date(), 29 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const entry = journal.find(j => j.date === dateStr);
      return { date: format(d, 'dd'), fullDate: format(d, 'dd/MM'), mood: entry?.mood || 0, moodLabel: entry ? moodLabels[entry.mood - 1] : 'Không có', sleep: entry?.sleepHours || 0, weight: entry?.weight || 0, hasEntry: !!entry, habitsCount: entry?.completedHabits?.length || 0 };
    });
  }, [journal]);

  const stats = useMemo(() => {
    const thisMonth = journal.filter(j => isSameMonth(parseISO(j.date), new Date()));
    const avgMood = thisMonth.length > 0 ? (thisMonth.reduce((sum, j) => sum + j.mood, 0) / thisMonth.length).toFixed(1) : '0';
    const moodCounts = [0, 0, 0, 0, 0];
    thisMonth.forEach(j => moodCounts[j.mood - 1]++);
    const dominantMood = moodCounts.indexOf(Math.max(...moodCounts));
    const entriesWithSleep = thisMonth.filter(j => j.sleepHours);
    const avgSleep = entriesWithSleep.length > 0 ? (entriesWithSleep.reduce((sum, j) => sum + (j.sleepHours || 0), 0) / entriesWithSleep.length).toFixed(1) : '0';
    const entriesWithWeight = journal.filter(j => j.weight).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestWeight = entriesWithWeight[0]?.weight;
    const previousWeight = entriesWithWeight[1]?.weight;
    const weightChange = latestWeight && previousWeight ? latestWeight - previousWeight : 0;
    
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      if (journal.some(j => j.date === format(subDays(today, i), 'yyyy-MM-dd'))) streak++; else if (i > 0) break;
    }
    return { total: journal.length, thisMonth: thisMonth.length, avgMood, dominantMood: thisMonth.length > 0 ? dominantMood : -1, streak, avgSleep, latestWeight, weightChange };
  }, [journal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const journalData = { date: form.date, content: form.content, mood: form.mood, locked: form.locked, attachments: form.attachments, weight: form.weight, sleepHours: form.sleepHours, completedHabits: form.completedHabits };
    if (editId) {
      updateJ({ id: editId, data: journalData });
    } else {
      addJ({ ...journalData, userId: user?.id });
      form.completedHabits.forEach(habitId => {
        const habit = habits.find(h => h.id === habitId);
        if (habit && !habit.completedDates.includes(form.date)) toggleHabit(habitId, form.date);
      });
    }
    resetForm(); setShowModal(false);
  };

  const resetForm = () => { setForm({ date: new Date().toISOString().split('T')[0], content: '', mood: 3, locked: false, attachments: [], weight: undefined, sleepHours: undefined, completedHabits: [] }); setEditId(null); };

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
          <div className="flex border dark:border-gray-600 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('list')} className={`px-3 py-2 text-sm flex items-center gap-1 ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'dark:text-gray-300'}`}><List className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('grid')} className={`px-3 py-2 text-sm flex items-center gap-1 ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'dark:text-gray-300'}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('calendar')} className={`px-3 py-2 text-sm flex items-center gap-1 ${viewMode === 'calendar' ? 'bg-indigo-600 text-white' : 'dark:text-gray-300'}`}><Calendar className="w-4 h-4" /></button>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg"><Plus className="w-5 h-5" /> Viết nhật ký</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 shadow-sm"><div className="text-xs text-gray-500">Tổng bài</div><div className="text-2xl font-bold dark:text-white">{stats.total}</div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 shadow-sm"><div className="text-xs text-gray-500">Tháng này</div><div className="text-2xl font-bold text-indigo-600">{stats.thisMonth}</div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 shadow-sm"><div className="text-xs text-gray-500 flex items-center gap-1"><Heart className="w-3 h-3" /> Mood TB</div><div className="text-2xl font-bold dark:text-white flex items-center gap-1">{stats.avgMood} {stats.dominantMood >= 0 && <span>{moodEmojis[stats.dominantMood]}</span>}</div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 shadow-sm"><div className="text-xs text-gray-500 flex items-center gap-1"><Moon className="w-3 h-3" /> Ngủ TB</div><div className="text-2xl font-bold text-blue-600">{stats.avgSleep}h</div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 shadow-sm"><div className="text-xs text-gray-500 flex items-center gap-1"><Scale className="w-3 h-3" /> Cân nặng</div><div className="text-2xl font-bold text-purple-600 flex items-center gap-1">{stats.latestWeight ? `${stats.latestWeight}kg` : '-'}</div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 shadow-sm"><div className="text-xs text-gray-500">Chuỗi viết</div><div className="text-2xl font-bold text-orange-600">🔥 {stats.streak}</div></div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">📊 Theo dõi 30 ngày</h3>
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
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredEntries.map(entry => {
            const isLocked = entry.locked && !unlocked.has(entry.id);
            const entryDate = parseISO(entry.date);
            return (
              <div key={entry.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden flex">
                <div className="w-24 flex-shrink-0 flex flex-col items-center justify-center p-3 border-r dark:border-gray-700" style={{ backgroundColor: `${moodColors[entry.mood - 1]}15` }}>
                  <span className="text-2xl font-bold dark:text-white">{format(entryDate, 'd')}</span>
                  <span className="text-xs text-gray-500 uppercase">{format(entryDate, 'MMM', { locale: vi })}</span>
                  <span className="text-2xl mt-2">{moodEmojis[entry.mood - 1]}</span>
                </div>
                <div className="flex-1 p-4">
                  <div className="flex justify-between mb-2">
                    <h3 className="font-semibold dark:text-white">{format(entryDate, "EEEE", { locale: vi })}</h3>
                    <div className="flex gap-1">
                      <button onClick={() => { setForm(entry as any); setEditId(entry.id); setShowModal(true); }} className="p-1.5"><Edit2 className="w-4 h-4 text-amber-500" /></button>
                      <button onClick={() => deleteJ(entry.id)} className="p-1.5"><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{entry.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl p-5 shadow-2xl">
            <div className="flex justify-between mb-4"><h2 className="text-lg font-bold dark:text-white">{editId ? 'Sửa nhật ký' : 'Viết nhật ký'}</h2><button onClick={() => setShowModal(false)}><X /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" required />
              <div className="flex justify-center gap-4">
                {moodEmojis.map((emoji, i) => (
                  <button key={i} type="button" onClick={() => setForm({ ...form, mood: i + 1 })} className={`text-4xl p-2 rounded-xl ${form.mood === i + 1 ? 'bg-indigo-100 ring-2 ring-indigo-500' : ''}`}>{emoji}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Giờ ngủ (vd: 7.5)" value={form.sleepHours || ''} onChange={e => setForm({ ...form, sleepHours: parseFloat(e.target.value) || undefined })} className="p-2 border rounded dark:bg-gray-700 dark:text-white" />
                <input type="number" placeholder="Cân nặng (kg)" value={form.weight || ''} onChange={e => setForm({ ...form, weight: parseFloat(e.target.value) || undefined })} className="p-2 border rounded dark:bg-gray-700 dark:text-white" />
              </div>
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white h-32" placeholder="Hôm nay thế nào?" required />
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold">Lưu nhật ký</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

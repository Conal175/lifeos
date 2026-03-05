import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Trash2, X, Lock, Unlock, Calendar, Search, Filter, ChevronLeft, ChevronRight, Image, Mic, Heart, Edit2, Eye, SortAsc, SortDesc, LayoutGrid, List, Moon, Scale, Activity, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isWithinInterval, startOfWeek, endOfWeek, startOfYear, endOfYear } from 'date-fns';
import { vi } from 'date-fns/locale';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, LineChart, Line, BarChart, Bar, ComposedChart, Legend } from 'recharts';

const moodEmojis = ['😢', '😟', '😐', '😊', '😄'];
const moodLabels = ['Rất buồn', 'Buồn', 'Bình thường', 'Vui', 'Rất vui'];
const moodColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

export function JournalPage() {
  const { journal, addJournal, updateJournal, deleteJournal, habits, toggleHabit } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [pin, setPin] = useState('');
  const [showPinPrompt, setShowPinPrompt] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'calendar'>('list');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [activeChart, setActiveChart] = useState<'mood' | 'sleep' | 'weight' | 'combined'>('combined');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year' | 'custom'>('all');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [moodFilter, setMoodFilter] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    content: '', 
    mood: 3, 
    locked: false, 
    attachments: [] as string[],
    weight: undefined as number | undefined,
    sleepHours: undefined as number | undefined,
    completedHabits: [] as string[]
  });

  // Filtered & sorted entries
  const filteredEntries = useMemo(() => {
    let entries = [...journal];

    // Search filter
    if (searchQuery) {
      entries = entries.filter(e => 
        e.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        format(parseISO(e.date), 'EEEE dd/MM/yyyy', { locale: vi }).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Date filter
    const today = new Date();
    if (dateFilter === 'today') {
      const todayStr = format(today, 'yyyy-MM-dd');
      entries = entries.filter(e => e.date === todayStr);
    } else if (dateFilter === 'week') {
      const start = startOfWeek(today, { weekStartsOn: 1 });
      const end = endOfWeek(today, { weekStartsOn: 1 });
      entries = entries.filter(e => isWithinInterval(parseISO(e.date), { start, end }));
    } else if (dateFilter === 'month') {
      const start = startOfMonth(today);
      const end = endOfMonth(today);
      entries = entries.filter(e => isWithinInterval(parseISO(e.date), { start, end }));
    } else if (dateFilter === 'year') {
      const start = startOfYear(today);
      const end = endOfYear(today);
      entries = entries.filter(e => isWithinInterval(parseISO(e.date), { start, end }));
    } else if (dateFilter === 'custom' && customDateStart && customDateEnd) {
      entries = entries.filter(e => e.date >= customDateStart && e.date <= customDateEnd);
    }

    // Mood filter
    if (moodFilter !== null) {
      entries = entries.filter(e => e.mood === moodFilter);
    }

    // Sort
    entries.sort((a, b) => {
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return sortOrder === 'desc' ? diff : -diff;
    });

    return entries;
  }, [journal, searchQuery, dateFilter, customDateStart, customDateEnd, moodFilter, sortOrder]);

  // Calendar data
  const calendarDays = useMemo(() => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Add padding days at start
    const startDayOfWeek = start.getDay();
    const paddingStart = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    for (let i = 0; i < paddingStart; i++) {
      days.unshift(subDays(start, paddingStart - i));
    }
    
    // Add padding days at end
    while (days.length % 7 !== 0) {
      days.push(addMonths(end, 1));
    }
    
    return days.slice(0, 42);
  }, [calendarMonth]);

  // Chart data (last 30 days)
  const chartData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = subDays(new Date(), 29 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const entry = journal.find(j => j.date === dateStr);
      return {
        date: format(d, 'dd'),
        fullDate: format(d, 'dd/MM'),
        mood: entry?.mood || 0,
        moodLabel: entry ? moodLabels[entry.mood - 1] : 'Không có',
        sleep: entry?.sleepHours || 0,
        weight: entry?.weight || 0,
        hasEntry: !!entry,
        habitsCount: entry?.completedHabits?.length || 0,
      };
    });
  }, [journal]);

  // Stats
  const stats = useMemo(() => {
    const thisMonth = journal.filter(j => {
      const d = parseISO(j.date);
      return isSameMonth(d, new Date());
    });
    const avgMood = thisMonth.length > 0 
      ? (thisMonth.reduce((sum, j) => sum + j.mood, 0) / thisMonth.length).toFixed(1)
      : '0';
    const moodCounts = [0, 0, 0, 0, 0];
    thisMonth.forEach(j => moodCounts[j.mood - 1]++);
    const dominantMood = moodCounts.indexOf(Math.max(...moodCounts));
    
    // Sleep stats
    const entriesWithSleep = thisMonth.filter(j => j.sleepHours);
    const avgSleep = entriesWithSleep.length > 0
      ? (entriesWithSleep.reduce((sum, j) => sum + (j.sleepHours || 0), 0) / entriesWithSleep.length).toFixed(1)
      : '0';
    
    // Weight stats
    const entriesWithWeight = journal.filter(j => j.weight).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestWeight = entriesWithWeight[0]?.weight;
    const previousWeight = entriesWithWeight[1]?.weight;
    const weightChange = latestWeight && previousWeight ? latestWeight - previousWeight : 0;
    
    return {
      total: journal.length,
      thisMonth: thisMonth.length,
      avgMood,
      dominantMood: thisMonth.length > 0 ? dominantMood : -1,
      streak: calculateStreak(),
      avgSleep,
      latestWeight,
      weightChange
    };
  }, [journal]);

  function calculateStreak() {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = format(subDays(today, i), 'yyyy-MM-dd');
      if (journal.some(j => j.date === checkDate)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }

  // "This day last year" memory
  const todayStr = format(new Date(), 'MM-dd');
  const memories = journal.filter(j => {
    const jDate = j.date.slice(5);
    return jDate === todayStr && j.date !== format(new Date(), 'yyyy-MM-dd');
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const journalData = {
      date: form.date,
      content: form.content,
      mood: form.mood,
      locked: form.locked,
      attachments: form.attachments,
      weight: form.weight,
      sleepHours: form.sleepHours,
      completedHabits: form.completedHabits
    };
    
    if (editId) {
      updateJournal(editId, journalData);
    } else {
      addJournal(journalData);
      // Also update habits if they were checked
      form.completedHabits.forEach(habitId => {
        const habit = habits.find(h => h.id === habitId);
        if (habit && !habit.completedDates.includes(form.date)) {
          toggleHabit(habitId, form.date);
        }
      });
    }
    resetForm();
    setShowModal(false);
  };

  const resetForm = () => {
    setForm({ 
      date: new Date().toISOString().split('T')[0], 
      content: '', 
      mood: 3, 
      locked: false, 
      attachments: [],
      weight: undefined,
      sleepHours: undefined,
      completedHabits: []
    });
    setEditId(null);
  };

  const handleUnlock = (id: string) => {
    if (pin === '1234') {
      setUnlocked(prev => new Set([...prev, id]));
      setShowPinPrompt(null);
      setPin('');
    }
  };

  const handleEdit = (entry: typeof journal[0]) => {
    setForm({ 
      date: entry.date, 
      content: entry.content, 
      mood: entry.mood, 
      locked: entry.locked, 
      attachments: entry.attachments,
      weight: entry.weight,
      sleepHours: entry.sleepHours,
      completedHabits: entry.completedHabits || []
    });
    setEditId(entry.id);
    setShowModal(true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setCustomDateStart('');
    setCustomDateEnd('');
    setMoodFilter(null);
  };

  const hasActiveFilters = searchQuery || dateFilter !== 'all' || moodFilter !== null;

  const selectedEntryData = selectedEntry ? journal.find(j => j.id === selectedEntry) : null;

  const toggleHabitInForm = (habitId: string) => {
    setForm(prev => ({
      ...prev,
      completedHabits: prev.completedHabits.includes(habitId)
        ? prev.completedHabits.filter(id => id !== habitId)
        : [...prev.completedHabits, habitId]
    }));
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            📔 Nhật ký cá nhân
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Ghi lại cảm xúc, giấc ngủ, cân nặng và thói quen mỗi ngày
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex border dark:border-gray-600 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm flex items-center gap-1 ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm flex items-center gap-1 ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 text-sm flex items-center gap-1 ${viewMode === 'calendar' ? 'bg-indigo-600 text-white' : 'dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <Calendar className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-indigo-500/25">
            <Plus className="w-5 h-5" /> Viết nhật ký
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 shadow-sm">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tổng bài viết</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 shadow-sm">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tháng này</div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.thisMonth}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 shadow-sm">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
            <Heart className="w-3 h-3" /> Tâm trạng TB
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-1">
            {stats.avgMood} {stats.dominantMood >= 0 && <span>{moodEmojis[stats.dominantMood]}</span>}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 shadow-sm">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
            <Moon className="w-3 h-3" /> Giấc ngủ TB
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.avgSleep}h
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 shadow-sm">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
            <Scale className="w-3 h-3" /> Cân nặng
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
            {stats.latestWeight ? `${stats.latestWeight}kg` : '-'}
            {stats.weightChange !== 0 && (
              <span className={`text-xs flex items-center ${stats.weightChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {stats.weightChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(stats.weightChange).toFixed(1)}
              </span>
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 shadow-sm">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Chuỗi viết</div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">🔥 {stats.streak}</div>
        </div>
      </div>

      {/* Combined Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            Biểu đồ theo dõi (30 ngày)
          </h3>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { key: 'combined', label: 'Tổng hợp', icon: '📊' },
              { key: 'mood', label: 'Tâm trạng', icon: '😊' },
              { key: 'sleep', label: 'Giấc ngủ', icon: '😴' },
              { key: 'weight', label: 'Cân nặng', icon: '⚖️' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveChart(tab.key as typeof activeChart)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeChart === tab.key 
                  ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={220}>
          {activeChart === 'combined' ? (
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
              <YAxis yAxisId="left" domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#6b7280" fontSize={10} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 12]} stroke="#6b7280" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                formatter={(value, name) => {
                  if (name === 'mood') return [`${moodEmojis[(value as number) - 1] || '-'} ${moodLabels[(value as number) - 1] || 'Không có'}`, 'Tâm trạng'];
                  if (name === 'sleep') return [`${value}h`, 'Giấc ngủ'];
                  return [value, name];
                }}
                labelFormatter={(label) => `Ngày ${label}`}
              />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="mood" name="Tâm trạng" stroke="#6366f1" strokeWidth={2} fill="url(#moodGrad)" />
              <Bar yAxisId="right" dataKey="sleep" name="Giấc ngủ (h)" fill="#3b82f6" opacity={0.6} radius={[2, 2, 0, 0]} />
            </ComposedChart>
          ) : activeChart === 'mood' ? (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
              <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#6b7280" fontSize={10} tickLine={false}
                tickFormatter={(v) => moodEmojis[v - 1] || ''} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                formatter={(value) => [(value as number) > 0 ? `${moodEmojis[(value as number) - 1]} ${moodLabels[(value as number) - 1]}` : 'Không có', 'Tâm trạng']}
                labelFormatter={(label) => `Ngày ${label}`}
              />
              <Area type="monotone" dataKey="mood" stroke="#6366f1" strokeWidth={2} fill="url(#moodGradient)" />
            </AreaChart>
          ) : activeChart === 'sleep' ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
              <YAxis domain={[0, 12]} stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `${v}h`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                formatter={(value) => [`${value} giờ`, 'Giấc ngủ']}
                labelFormatter={(label) => `Ngày ${label}`}
              />
              <Bar dataKey="sleep" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Bar key={index} fill={entry.sleep >= 7 ? '#22c55e' : entry.sleep >= 5 ? '#eab308' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <LineChart data={chartData.filter(d => d.weight > 0)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="fullDate" stroke="#6b7280" fontSize={10} tickLine={false} />
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `${v}kg`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                formatter={(value) => [`${value} kg`, 'Cân nặng']}
              />
              <Line type="monotone" dataKey="weight" stroke="#a855f7" strokeWidth={2} dot={{ r: 4, fill: '#a855f7' }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Memories */}
      {memories.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800 animate-fadeIn">
          <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
            📸 Ngày này năm xưa
          </h3>
          <div className="space-y-2">
            {memories.map(m => (
              <div key={m.id} className="flex items-start gap-3 p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <span className="text-2xl">{moodEmojis[m.mood - 1]}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">{m.date.slice(0, 4)}</div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{m.content}</p>
                </div>
                <button onClick={() => setSelectedEntry(m.id)} className="text-amber-600 hover:text-amber-700 p-1">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo nội dung, ngày..."
              className="w-full pl-10 pr-4 py-2.5 border dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-all ${showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-400' : 'dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <Filter className="w-4 h-4" /> Bộ lọc
            {hasActiveFilters && <span className="w-2 h-2 bg-red-500 rounded-full" />}
          </button>
          <button onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-2 px-4 py-2 border dark:border-gray-600 rounded-lg text-sm dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            {sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
            {sortOrder === 'desc' ? 'Mới nhất' : 'Cũ nhất'}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t dark:border-gray-700 space-y-4 animate-fadeIn">
            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">🗓️ Lọc theo thời gian</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'Tất cả' },
                  { key: 'today', label: 'Hôm nay' },
                  { key: 'week', label: 'Tuần này' },
                  { key: 'month', label: 'Tháng này' },
                  { key: 'year', label: 'Năm nay' },
                  { key: 'custom', label: '📅 Tùy chọn' },
                ].map(opt => (
                  <button key={opt.key} onClick={() => setDateFilter(opt.key as typeof dateFilter)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${dateFilter === opt.key ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {dateFilter === 'custom' && (
                <div className="flex flex-wrap gap-2 mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Từ ngày</label>
                    <input type="date" value={customDateStart} onChange={e => setCustomDateStart(e.target.value)}
                      className="px-3 py-2 border dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Đến ngày</label>
                    <input type="date" value={customDateEnd} onChange={e => setCustomDateEnd(e.target.value)}
                      className="px-3 py-2 border dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" />
                  </div>
                </div>
              )}
            </div>

            {/* Mood Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">😊 Lọc theo tâm trạng</label>
              <div className="flex gap-2">
                <button onClick={() => setMoodFilter(null)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${moodFilter === null ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                  Tất cả
                </button>
                {moodEmojis.map((emoji, i) => (
                  <button key={i} onClick={() => setMoodFilter(i + 1)}
                    className={`px-3 py-1.5 rounded-lg text-xl transition-all ${moodFilter === i + 1 ? 'bg-indigo-100 dark:bg-indigo-900 ring-2 ring-indigo-500 scale-110' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <button onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1">
                <X className="w-4 h-4" /> Xóa bộ lọc
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>Tìm thấy {filteredEntries.length} bài viết</span>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {format(calendarMonth, 'MMMM yyyy', { locale: vi })}
            </h3>
            <button onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">{d}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const entry = journal.find(j => j.date === dateStr);
              const isCurrentMonth = isSameMonth(day, calendarMonth);
              const isToday = isSameDay(day, new Date());
              
              return (
                <button key={i} onClick={() => entry ? setSelectedEntry(entry.id) : null}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all relative
                    ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : 'text-gray-900 dark:text-white'}
                    ${isToday ? 'ring-2 ring-indigo-500' : ''}
                    ${entry ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                  `}
                  style={entry ? { backgroundColor: `${moodColors[entry.mood - 1]}20` } : {}}>
                  <span className={`${isToday ? 'font-bold' : ''}`}>{format(day, 'd')}</span>
                  {entry && (
                    <span className="text-xs">{moodEmojis[entry.mood - 1]}</span>
                  )}
                  {entry?.sleepHours && (
                    <span className="text-[8px] text-blue-500">💤{entry.sleepHours}h</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
              <div className="text-6xl mb-4">📔</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {hasActiveFilters ? 'Không tìm thấy kết quả' : 'Chưa có nhật ký nào'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {hasActiveFilters ? 'Thử thay đổi bộ lọc của bạn' : 'Bắt đầu viết nhật ký đầu tiên của bạn'}
              </p>
            </div>
          ) : filteredEntries.map(entry => {
            const isLocked = entry.locked && !unlocked.has(entry.id);
            const entryDate = parseISO(entry.date);
            const entryHabits = habits.filter(h => entry.completedHabits?.includes(h.id));
            return (
              <div key={entry.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden animate-fadeIn hover:shadow-md transition-all">
                <div className="flex">
                  {/* Date Sidebar */}
                  <div className="w-24 md:w-28 flex-shrink-0 flex flex-col items-center justify-center p-3 border-r dark:border-gray-700"
                    style={{ backgroundColor: `${moodColors[entry.mood - 1]}15` }}>
                    <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{format(entryDate, 'd')}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">{format(entryDate, 'MMM', { locale: vi })}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{format(entryDate, 'yyyy')}</span>
                    <span className="text-2xl mt-2">{moodEmojis[entry.mood - 1]}</span>
                    {/* Quick stats */}
                    <div className="mt-2 space-y-1 text-[10px] text-center">
                      {entry.sleepHours && (
                        <div className="flex items-center gap-1 text-blue-500">
                          <Moon className="w-3 h-3" /> {entry.sleepHours}h
                        </div>
                      )}
                      {entry.weight && (
                        <div className="flex items-center gap-1 text-purple-500">
                          <Scale className="w-3 h-3" /> {entry.weight}kg
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {format(entryDate, "EEEE", { locale: vi })}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: `${moodColors[entry.mood - 1]}20`, color: moodColors[entry.mood - 1] }}>
                            {moodLabels[entry.mood - 1]}
                          </span>
                          {entry.locked && (
                            <span className="text-xs text-red-500 flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Đã khóa
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {entry.locked && (
                          <button onClick={() => { if (isLocked) setShowPinPrompt(entry.id); else setUnlocked(prev => { const n = new Set(prev); n.delete(entry.id); return n; }); }}
                            className={`p-1.5 rounded ${isLocked ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'}`}>
                            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>
                        )}
                        {!isLocked && (
                          <>
                            <button onClick={() => setSelectedEntry(entry.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-indigo-500">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleEdit(entry)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-amber-500">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteJournal(entry.id)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-gray-400 hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {isLocked ? (
                      <div className="text-center py-4 text-gray-400">
                        <Lock className="w-6 h-6 mx-auto mb-1" />
                        <p className="text-sm">Nội dung đã được khóa</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed line-clamp-3">
                          {entry.content}
                        </p>
                        
                        {/* Habits completed */}
                        {entryHabits.length > 0 && (
                          <div className="mt-3 pt-3 border-t dark:border-gray-700">
                            <div className="flex flex-wrap gap-1.5">
                              {entryHabits.map(h => (
                                <span key={h.id} className="px-2 py-1 rounded-full text-xs flex items-center gap-1"
                                  style={{ backgroundColor: `${h.color}20`, color: h.color }}>
                                  {h.icon} {h.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntries.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
              <div className="text-6xl mb-4">📔</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Không tìm thấy kết quả</h3>
            </div>
          ) : filteredEntries.map(entry => {
            const isLocked = entry.locked && !unlocked.has(entry.id);
            const entryDate = parseISO(entry.date);
            return (
              <div key={entry.id}
                onClick={() => !isLocked && setSelectedEntry(entry.id)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-lg transition-all animate-fadeIn group"
                style={{ borderLeftWidth: '4px', borderLeftColor: moodColors[entry.mood - 1] }}>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{moodEmojis[entry.mood - 1]}</span>
                      <div>
                        <div className="font-semibold text-sm text-gray-900 dark:text-white">
                          {format(entryDate, 'dd/MM/yyyy')}
                        </div>
                        <div className="text-xs text-gray-400">{format(entryDate, 'EEEE', { locale: vi })}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {entry.sleepHours && <span className="text-xs text-blue-500">💤{entry.sleepHours}h</span>}
                      {entry.locked && <Lock className="w-4 h-4 text-red-400" />}
                    </div>
                  </div>
                  
                  {isLocked ? (
                    <div className="text-center py-6 text-gray-400">
                      <Lock className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-xs">Nhấn để mở khóa</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4">
                      {entry.content}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedEntryData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedEntry(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex justify-between items-center z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{moodEmojis[selectedEntryData.mood - 1]}</span>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {format(parseISO(selectedEntryData.date), "EEEE, dd 'tháng' MM, yyyy", { locale: vi })}
                  </h2>
                  <span className="text-sm px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${moodColors[selectedEntryData.mood - 1]}20`, color: moodColors[selectedEntryData.mood - 1] }}>
                    {moodLabels[selectedEntryData.mood - 1]}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedEntry(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Health stats */}
            {(selectedEntryData.sleepHours || selectedEntryData.weight) && (
              <div className="px-6 pt-4 flex flex-wrap gap-4">
                {selectedEntryData.sleepHours && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Moon className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">Giấc ngủ</div>
                      <div className="font-bold text-blue-700 dark:text-blue-300">{selectedEntryData.sleepHours} giờ</div>
                    </div>
                  </div>
                )}
                {selectedEntryData.weight && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <Scale className="w-5 h-5 text-purple-500" />
                    <div>
                      <div className="text-xs text-purple-600 dark:text-purple-400">Cân nặng</div>
                      <div className="font-bold text-purple-700 dark:text-purple-300">{selectedEntryData.weight} kg</div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Habits */}
            {selectedEntryData.completedHabits && selectedEntryData.completedHabits.length > 0 && (
              <div className="px-6 pt-4">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Thói quen đã hoàn thành
                </h4>
                <div className="flex flex-wrap gap-2">
                  {habits.filter(h => selectedEntryData.completedHabits?.includes(h.id)).map(h => (
                    <span key={h.id} className="px-3 py-1.5 rounded-full text-sm flex items-center gap-1"
                      style={{ backgroundColor: `${h.color}20`, color: h.color }}>
                      {h.icon} {h.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {selectedEntryData.content}
              </p>
            </div>
            <div className="p-4 border-t dark:border-gray-700 flex justify-between">
              <button onClick={() => { handleEdit(selectedEntryData); setSelectedEntry(null); }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <Edit2 className="w-4 h-4" /> Chỉnh sửa
              </button>
              <button onClick={() => { deleteJournal(selectedEntryData.id); setSelectedEntry(null); }}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" /> Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Prompt */}
      {showPinPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-xs p-6 animate-fadeIn text-center">
            <Lock className="w-12 h-12 mx-auto mb-3 text-indigo-600" />
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Nhập mã PIN</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">(Demo: 1234)</p>
            <input type="password" value={pin} onChange={e => setPin(e.target.value)}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-center text-2xl tracking-widest mb-3"
              maxLength={4} autoFocus onKeyDown={e => e.key === 'Enter' && handleUnlock(showPinPrompt)} />
            <div className="flex gap-2">
              <button onClick={() => { setShowPinPrompt(null); setPin(''); }} className="flex-1 py-2 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Hủy</button>
              <button onClick={() => handleUnlock(showPinPrompt)} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Mở khóa</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex justify-between items-center z-10 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editId ? '✏️ Chỉnh sửa nhật ký' : '📝 Viết nhật ký mới'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-5">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">📅 Ngày</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500" />
              </div>
              
              {/* Mood */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">😊 Tâm trạng hôm nay</label>
                <div className="flex gap-4 justify-center">
                  {moodEmojis.map((emoji, i) => (
                    <button key={i} type="button" onClick={() => setForm({ ...form, mood: i + 1 })}
                      className={`text-4xl p-3 rounded-2xl transition-all ${form.mood === i + 1 ? 'bg-indigo-100 dark:bg-indigo-900 scale-125 ring-2 ring-indigo-500 shadow-lg' : 'hover:scale-110 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                      {emoji}
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm mt-2 text-gray-500 font-medium">{moodLabels[form.mood - 1]}</p>
              </div>
              
              {/* Health tracking */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <Moon className="w-4 h-4 text-blue-500" /> Số giờ ngủ
                  </label>
                  <input type="number" value={form.sleepHours || ''} onChange={e => setForm({ ...form, sleepHours: e.target.value ? parseFloat(e.target.value) : undefined })}
                    step="0.5" min="0" max="24" placeholder="VD: 7.5"
                    className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <Scale className="w-4 h-4 text-purple-500" /> Cân nặng (kg)
                  </label>
                  <input type="number" value={form.weight || ''} onChange={e => setForm({ ...form, weight: e.target.value ? parseFloat(e.target.value) : undefined })}
                    step="0.1" min="0" placeholder="VD: 65.5"
                    className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              
              {/* Habits tracking */}
              {habits.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Thói quen đã hoàn thành hôm nay
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    {habits.map(habit => {
                      const isSelected = form.completedHabits.includes(habit.id);
                      return (
                        <button key={habit.id} type="button" onClick={() => toggleHabitInForm(habit.id)}
                          className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${isSelected 
                            ? 'ring-2 shadow-md' 
                            : 'opacity-60 hover:opacity-100'}`}
                          style={{ 
                            backgroundColor: isSelected ? `${habit.color}30` : `${habit.color}10`,
                            color: habit.color,
                            boxShadow: isSelected ? `0 0 0 2px ${habit.color}` : 'none'
                          }}>
                          <span className="text-lg">{habit.icon}</span>
                          {habit.name}
                          {isSelected && <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      );
                    })}
                  </div>
                  {form.completedHabits.length > 0 && (
                    <p className="text-xs text-green-600 mt-1">✓ Đã chọn {form.completedHabits.length} thói quen</p>
                  )}
                </div>
              )}
              
              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">📝 Nội dung</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                  className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white resize-none focus:ring-2 focus:ring-indigo-500" rows={8}
                  placeholder="Hôm nay bạn cảm thấy thế nào? Có chuyện gì đặc biệt xảy ra không?" />
              </div>
              
              {/* Attachments */}
              <div className="flex items-center gap-4 py-2 border-t border-b dark:border-gray-700">
                <button type="button" className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                  <Image className="w-5 h-5" /> Ảnh
                </button>
                <button type="button" className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                  <Mic className="w-5 h-5" /> Ghi âm
                </button>
              </div>
              
              {/* Lock */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.locked} onChange={e => setForm({ ...form, locked: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">🔒 Khóa bảo mật (PIN: 1234)</span>
              </label>
              
              <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/25">
                {editId ? '💾 Cập nhật' : '✨ Lưu nhật ký'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

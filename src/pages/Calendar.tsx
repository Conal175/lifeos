import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTableData } from '../hooks/useData';
import { Event, Task } from '../types';
import { Plus, X, ChevronLeft, ChevronRight, CheckCircle, Lightbulb, Clock, Zap, Coffee, Book, Dumbbell, Music, Code, Users, Phone, ShoppingBag, Utensils, Briefcase, Heart, Sparkles, Repeat } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, isToday } from 'date-fns';
import { vi } from 'date-fns/locale';

type ViewMode = 'month' | 'week' | 'day';
const eventColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

const activitySuggestions = [
  { icon: Coffee, name: 'Uống cà phê & lập kế hoạch', duration: 30, timeRange: [6, 9], category: 'productivity', color: '#8b5cf6' },
  { icon: Dumbbell, name: 'Tập thể dục buổi sáng', duration: 60, timeRange: [6, 9], category: 'health', color: '#22c55e' },
  { icon: Book, name: 'Đọc sách 30 phút', duration: 30, timeRange: [6, 9], category: 'learning', color: '#3b82f6' },
  { icon: Code, name: 'Deep work - Tập trung', duration: 120, timeRange: [9, 12], category: 'work', color: '#6366f1' },
  { icon: Briefcase, name: 'Xử lý email', duration: 30, timeRange: [9, 12], category: 'work', color: '#64748b' },
  { icon: Utensils, name: 'Nghỉ trưa & ăn uống', duration: 60, timeRange: [12, 14], category: 'break', color: '#eab308' },
  { icon: Users, name: 'Họp nhóm/Brainstorm', duration: 60, timeRange: [14, 18], category: 'work', color: '#f43f5e' },
  { icon: ShoppingBag, name: 'Đi chợ/Mua sắm', duration: 60, timeRange: [14, 18], category: 'errands', color: '#06b6d4' },
  { icon: Dumbbell, name: 'Tập gym buổi tối', duration: 90, timeRange: [18, 21], category: 'health', color: '#22c55e' },
  { icon: Heart, name: 'Thời gian gia đình', duration: 120, timeRange: [18, 21], category: 'personal', color: '#ec4899' },
  { icon: Music, name: 'Giải trí/Xem phim', duration: 90, timeRange: [21, 23], category: 'relax', color: '#a855f7' },
];

const quickTasks = [
  { name: 'Trả lời tin nhắn', duration: 15, icon: '💬' },
  { name: 'Dọn dẹp bàn làm việc', duration: 15, icon: '🧹' },
  { name: 'Uống nước & nghỉ mắt', duration: 10, icon: '💧' },
  { name: 'Ghi chú ý tưởng', duration: 10, icon: '💡' },
];

interface FreeTimeSlot { date: Date; startHour: number; endHour: number; duration: number; suggestions: typeof activitySuggestions; }

const HOUR_HEIGHT = 60;
const START_HOUR = 6;
const END_HOUR = 23;
const DISPLAY_HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

export function CalendarPage() {
  const { user } = useApp();
  const { data: events = [], isLoading: l1, addRecord: addEvent, updateRecord: updateEvent, deleteRecord: deleteEvent } = useTableData<Event>('events');
  const { data: tasks = [], isLoading: l2 } = useTableData<Task>('tasks');
  const isLoading = l1 || l2;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [showModal, setShowModal] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [_selectedSlot, setSelectedSlot] = useState<FreeTimeSlot | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // ĐÃ NÂNG CẤP: Thêm recurringEndDate để lưu ngày kết thúc lặp lại
  const [form, setForm] = useState({ 
    title: '', description: '', startDate: '', startTime: '09:00', endDate: '', endTime: '10:00', color: eventColors[0], 
    recurring: '', recurringDays: [] as number[], recurringEndDate: '' 
  });

  const navigate = (dir: number) => {
    if (viewMode === 'month') setCurrentDate(dir > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(dir > 0 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    else setCurrentDate(dir > 0 ? addDays(currentDate, 1) : subDays(currentDate, 1));
  };

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }) });
  const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

  const taskEvents = useMemo(() => {
    const formatted: any[] = [];
    tasks.forEach(t => {
      if (!t.completed && t.dueDate) {
        formatted.push({ id: `task-${t.id}`, title: `✓ ${t.title}`, description: t.description || '', startDate: t.dueDate, endDate: t.dueDate, color: '#6366f1', isTask: true, taskId: t.id });
      }
      if (t.subtasks && t.subtasks.length > 0) {
        t.subtasks.forEach(s => {
          if (!s.completed && s.dueDate) {
             formatted.push({ id: `subtask-${t.id}-${s.id}`, title: `↳ ${s.title} (${t.title})`, description: '', startDate: s.dueDate, endDate: s.dueDate, color: '#8b5cf6', isTask: true, taskId: t.id });
          }
        });
      }
    });
    return formatted;
  }, [tasks]);

  const allEvents = [...events, ...taskEvents];

  // ĐÃ NÂNG CẤP: Thuật toán lọc sự kiện lặp lại (Có giới hạn ngày kết thúc)
  const getEventsForDate = (targetDate: Date) => {
    const targetDateStr = format(targetDate, 'yyyy-MM-dd');
    
    return allEvents.filter(e => {
      if (!e.startDate) return false;
      const eventStartDateStr = e.startDate.split('T')[0];
      
      // Ngày gốc
      if (eventStartDateStr === targetDateStr) return true;

      // Xử lý Lặp lại
      if (e.recurring && targetDateStr > eventStartDateStr) {
        let recurringStr = e.recurring;
        let recEndDate = '';
        
        // Tách chuỗi nếu có chứa ngày kết thúc (ngăn cách bằng dấu |)
        if (recurringStr.includes('|')) {
          const parts = recurringStr.split('|');
          recurringStr = parts[0];
          recEndDate = parts[1];
        }

        // Bỏ qua nếu ngày đang xét vượt quá ngày kết thúc lặp lại
        if (recEndDate && targetDateStr > recEndDate) {
          return false;
        }

        const eStart = new Date(eventStartDateStr);
        if (recurringStr === 'daily') return true;
        if (recurringStr === 'weekly' && targetDate.getDay() === eStart.getDay()) return true;
        if (recurringStr === 'monthly' && targetDate.getDate() === eStart.getDate()) return true;
        
        if (recurringStr.startsWith('weekly_custom:')) {
          const selectedDays = recurringStr.split(':')[1].split(',').map(Number);
          if (selectedDays.includes(targetDate.getDay())) return true;
        }
      }
      return false;
    });
  };

  const getEventStyle = (e: any) => {
    let sH = 8, sM = 0, eH = 9, eM = 0; 
    if (e.startDate && e.startDate.includes('T')) {
      const parts = e.startDate.split('T')[1].split(':');
      sH = parseInt(parts[0]); sM = parseInt(parts[1] || '0');
    }
    if (e.endDate && e.endDate.includes('T')) {
      const parts = e.endDate.split('T')[1].split(':');
      eH = parseInt(parts[0]); eM = parseInt(parts[1] || '0');
    } else {
      eH = sH + 1; eM = sM; 
    }
    
    const startMins = sH * 60 + sM;
    const endMins = eH * 60 + eM;
    let top = startMins - (START_HOUR * 60); 
    let height = endMins - startMins;

    if (top < 0) { height += top; top = 0; } 
    if (height < 20) height = 20; 

    return { top: `${top}px`, height: `${height}px` };
  };

  const getBusyHours = (date: Date): Set<number> => {
    const dayEvents = getEventsForDate(date);
    const busyHours = new Set<number>();
    dayEvents.forEach(e => {
      if (e.startDate.includes('T')) {
        const h = parseInt(e.startDate.split('T')[1].split(':')[0]);
        const eh = e.endDate.includes('T') ? parseInt(e.endDate.split('T')[1].split(':')[0]) : h + 1;
        for (let i = h; i <= eh; i++) busyHours.add(i);
      } else {
        busyHours.add(8); busyHours.add(9);
      }
    });
    return busyHours;
  };

  const getFreeTimeSlots = (date: Date): FreeTimeSlot[] => {
    const busyHours = getBusyHours(date);
    const slots: FreeTimeSlot[] = [];
    let slotStart = -1;
    for (let h = 7; h <= 22; h++) {
      if (!busyHours.has(h)) { if (slotStart === -1) slotStart = h; } 
      else if (slotStart !== -1) {
        const duration = (h - slotStart) * 60;
        if (duration >= 30) {
          const suggestions = activitySuggestions.filter(a => a.duration <= duration && slotStart >= a.timeRange[0] && slotStart < a.timeRange[1]);
          slots.push({ date, startHour: slotStart, endHour: h, duration, suggestions: suggestions.length > 0 ? suggestions : activitySuggestions.filter(a => a.duration <= duration).slice(0, 3) });
        }
        slotStart = -1;
      }
    }
    return slots;
  };

  const weekFreeSlots = useMemo(() => weekDays.map(day => ({ date: day, slots: getFreeTimeSlots(day) })).filter(d => d.slots.length > 0), [weekDays, events, tasks]);
  const totalFreeMinutes = useMemo(() => weekFreeSlots.reduce((total, day) => total + day.slots.reduce((dayTotal, slot) => dayTotal + slot.duration, 0), 0), [weekFreeSlots]);

  const closeModal = () => {
    setForm({ title: '', description: '', startDate: '', startTime: '09:00', endDate: '', endTime: '10:00', color: eventColors[0], recurring: '', recurringDays: [], recurringEndDate: '' });
    setEditingEventId(null);
    setShowModal(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Gắn chuỗi tùy chỉnh
    let finalRecurring = form.recurring;
    if (form.recurring === 'weekly_custom') {
      if (form.recurringDays.length === 0) finalRecurring = '';
      else finalRecurring = `weekly_custom:${form.recurringDays.join(',')}`;
    }

    // ĐÃ NÂNG CẤP: Nối ngày kết thúc lặp lại vào chuỗi recurring
    if (finalRecurring && form.recurringEndDate) {
      finalRecurring += `|${form.recurringEndDate}`;
    }

    const eventData = { 
      title: form.title, 
      description: form.description, 
      startDate: `${form.startDate}T${form.startTime}`, 
      endDate: `${form.endDate || form.startDate}T${form.endTime}`, 
      color: form.color, 
      recurring: finalRecurring || null, 
      userId: user?.id 
    };

    if (editingEventId) {
      updateEvent({ id: editingEventId, data: eventData });
    } else {
      addEvent(eventData as any);
    }
    closeModal();
  };

  const openAddModal = (date?: Date, clickHour?: number) => {
    const d = date || new Date();
    const startH = clickHour !== undefined ? clickHour : 9;
    const endH = startH + 1;
    
    setForm({ 
      ...form, 
      startDate: format(d, 'yyyy-MM-dd'), 
      endDate: format(d, 'yyyy-MM-dd'),
      startTime: `${startH.toString().padStart(2, '0')}:00`,
      endTime: `${Math.min(endH, 23).toString().padStart(2, '0')}:00`,
      recurringDays: [d.getDay()],
      recurringEndDate: ''
    });
    setEditingEventId(null);
    setShowModal(true);
  };

  const openEditModal = (e: any) => {
    if (e.isTask) return;
    
    const startParts = e.startDate ? e.startDate.split('T') : [format(new Date(), 'yyyy-MM-dd'), '09:00'];
    const endParts = e.endDate ? e.endDate.split('T') : [startParts[0], '10:00'];

    let recurringType = e.recurring || '';
    let recDays: number[] = [];
    let recEndDate = '';

    // ĐÃ NÂNG CẤP: Tách chuỗi để lấy ra cấu hình và ngày kết thúc
    if (recurringType.includes('|')) {
      const parts = recurringType.split('|');
      recurringType = parts[0];
      recEndDate = parts[1];
    }

    if (recurringType.startsWith('weekly_custom:')) {
      recDays = recurringType.split(':')[1].split(',').map(Number);
      recurringType = 'weekly_custom';
    }

    setForm({
      title: e.title,
      description: e.description || '',
      startDate: startParts[0],
      startTime: startParts[1]?.substring(0, 5) || '09:00',
      endDate: endParts[0] || startParts[0],
      endTime: endParts[1]?.substring(0, 5) || '10:00',
      color: e.color,
      recurring: recurringType as any,
      recurringDays: recDays,
      recurringEndDate: recEndDate
    });
    setEditingEventId(e.id);
    setShowModal(true);
  };

  const addSuggestionAsEvent = (suggestion: typeof activitySuggestions[0], slot: FreeTimeSlot) => {
    const dateStr = format(slot.date, 'yyyy-MM-dd');
    const startTime = `${slot.startHour.toString().padStart(2, '0')}:00`;
    const endHour = slot.startHour + Math.ceil(suggestion.duration / 60);
    const endTime = `${Math.min(endHour, 23).toString().padStart(2, '0')}:00`;
    addEvent({ title: suggestion.name, description: `Gợi ý hoạt động - ${suggestion.category}`, startDate: `${dateStr}T${startTime}`, endDate: `${dateStr}T${endTime}`, color: suggestion.color, userId: user?.id } as any);
    setSelectedSlot(null);
  };

  const today = new Date();
  if (isLoading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📅 Lịch & Sự kiện</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{events.length} sự kiện · {taskEvents.length} công việc</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSuggestions(!showSuggestions)} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${showSuggestions ? 'bg-amber-500 text-white shadow-sm' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400'}`}><Lightbulb className="w-5 h-5" /> Gợi ý thời gian rảnh</button>
          <div className="flex border dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
            {(['day', 'week', 'month'] as ViewMode[]).map(v => <button key={v} onClick={() => setViewMode(v)} className={`px-4 py-1.5 text-sm font-medium transition-colors ${viewMode === v ? 'bg-indigo-600 text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>{v === 'day' ? 'Ngày' : v === 'week' ? 'Tuần' : 'Tháng'}</button>)}
          </div>
          <button onClick={() => openAddModal()} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white px-4 py-2 rounded-lg shadow-sm"><Plus className="w-5 h-5" /> Sự kiện</button>
        </div>
      </div>

      {showSuggestions && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800 overflow-hidden animate-fadeIn">
          <div className="p-4 border-b border-amber-200 dark:border-amber-800">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3"><div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center"><Lightbulb className="w-6 h-6 text-white" /></div><div><h2 className="text-lg font-bold text-gray-900 dark:text-white">💡 Gợi ý hoạt động</h2><p className="text-sm text-gray-600 dark:text-gray-400">Tuần này bạn rảnh <span className="font-semibold text-amber-600 dark:text-amber-400">{Math.floor(totalFreeMinutes / 60)} giờ {totalFreeMinutes % 60} phút</span></p></div></div>
              <button onClick={() => setShowSuggestions(false)} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Việc nhanh (10-15 phút)</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {quickTasks.map((task, i) => <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-200 rounded-full text-sm border dark:border-gray-700 hover:border-amber-400 cursor-pointer shadow-sm transition-colors"><span>{task.icon}</span><span>{task.name}</span></span>)}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5 dark:text-white" /></button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {viewMode === 'month' && format(currentDate, 'MMMM yyyy', { locale: vi })}
          {viewMode === 'week' && `Tuần ${format(weekStart, 'dd/MM')} - ${format(addDays(weekStart, 6), 'dd/MM')}`}
          {viewMode === 'day' && format(currentDate, "EEEE, dd 'tháng' MM, yyyy", { locale: vi })}
        </h2>
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm border dark:border-gray-600 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">Hôm nay</button>
          <button onClick={() => navigate(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><ChevronRight className="w-5 h-5 dark:text-white" /></button>
        </div>
      </div>

      {/* --- CHẾ ĐỘ THÁNG --- */}
      {viewMode === 'month' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
          <div className="grid grid-cols-7 border-b dark:border-gray-700">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => <div key={d} className="p-3 text-center text-sm font-semibold text-gray-500">{d}</div>)}</div>
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const dayEvents = getEventsForDate(day);
              return (
                <div key={i} onClick={() => { setSelectedDate(day); setCurrentDate(day); setViewMode('day'); }} className={`min-h-[120px] p-2 border-b border-r dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!isSameMonth(day, currentDate) ? 'opacity-40 bg-gray-50/50 dark:bg-gray-900/50' : ''}`}>
                  <div className="flex justify-between mb-2"><div className={`w-7 h-7 flex items-center justify-center rounded-full font-medium ${isSameDay(day, today) ? 'bg-indigo-600 text-white' : 'dark:text-white'}`}>{format(day, 'd')}</div></div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 4).map(e => (
                      <div key={e.id} 
                           onClick={(ev) => { ev.stopPropagation(); openEditModal(e); }}
                           className={`text-[11px] px-1.5 py-1 rounded truncate text-white shadow-sm ${!(e as any).isTask && 'hover:brightness-90 transition-all'}`} 
                           style={{ backgroundColor: e.color }}>
                        {e.recurring && <Repeat className="w-2.5 h-2.5 inline mr-0.5 -mt-0.5 opacity-80" />}
                        {(e as any).isTask && <CheckCircle className="w-3 h-3 inline mr-0.5 -mt-0.5 opacity-80" />}
                        {e.title}
                      </div>
                    ))}
                  {dayEvents.length > 4 && <div className="text-xs text-gray-500 text-center font-medium">+{dayEvents.length - 4} nữa</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- CHẾ ĐỘ TUẦN --- */}
      {viewMode === 'week' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 sticky top-0 z-10">
            <div className="p-2 border-r dark:border-gray-700"></div>
            {weekDays.map((d, i) => (
              <div key={i} className={`p-3 text-center border-r dark:border-gray-700 last:border-r-0 ${isSameDay(d, today) ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-600 dark:text-gray-300 font-medium'}`}>
                <div className="text-xs uppercase opacity-70">{format(d, 'EEE', { locale: vi })}</div>
                <div className="text-lg mt-0.5">{format(d, 'dd')}</div>
              </div>
            ))}
          </div>
          
          <div className="overflow-y-auto max-h-[600px] relative custom-scrollbar">
            <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
              <div className="relative border-r dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
                {DISPLAY_HOURS.map(h => (
                  <div key={h} className="text-xs text-gray-400 text-right pr-2 pt-1 border-b dark:border-gray-700" style={{ height: `${HOUR_HEIGHT}px` }}>{`${h.toString().padStart(2, '0')}:00`}</div>
                ))}
              </div>
              
              {weekDays.map((d, i) => {
                const dayEvents = getEventsForDate(d);
                return (
                  <div key={i} className={`relative border-r dark:border-gray-700 last:border-r-0 ${isSameDay(d, today) ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`} style={{ height: `${DISPLAY_HOURS.length * HOUR_HEIGHT}px` }} 
                    onDoubleClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const y = e.clientY - rect.top;
                      const hour = Math.floor(y / HOUR_HEIGHT) + START_HOUR;
                      openAddModal(d, hour);
                    }}>
                    
                    <div className="absolute inset-0 pointer-events-none">
                      {DISPLAY_HOURS.map(h => <div key={h} className="border-b dark:border-gray-700/50" style={{ height: `${HOUR_HEIGHT}px` }}></div>)}
                    </div>

                    {dayEvents.map(e => {
                      const style = getEventStyle(e);
                      return (
                        <div key={e.id} 
                             onClick={(ev) => { ev.stopPropagation(); openEditModal(e); }}
                             className={`absolute left-1 right-1 rounded-lg p-1.5 text-white shadow-md overflow-hidden flex flex-col transition-transform hover:scale-[1.02] hover:z-20 group border border-white/20 ${!(e as any).isTask ? 'cursor-pointer' : 'cursor-default'}`} 
                             style={{ ...style, backgroundColor: e.color }}
                             title={`${e.title}\n${e.startDate.split('T')[1] || '08:00'} - ${e.endDate.split('T')[1] || '09:00'}`}>
                          <div className="text-xs font-semibold leading-tight line-clamp-2">
                            {e.recurring && <Repeat className="w-2.5 h-2.5 inline mr-1 -mt-0.5 opacity-80" />}
                            {(e as any).isTask && <CheckCircle className="w-3 h-3 inline mr-1 -mt-0.5 opacity-80" />}
                            {e.title}
                          </div>
                          <div className="text-[10px] opacity-90 mt-1 font-medium">
                            {e.startDate?.includes('T') ? format(new Date(e.startDate), 'HH:mm') : '08:00'} - {e.endDate?.includes('T') ? format(new Date(e.endDate), 'HH:mm') : '09:00'}
                          </div>
                          {!(e as any).isTask && (
                             <button onClick={(ev) => { ev.stopPropagation(); deleteEvent(e.id); }} className="absolute top-1 right-1 p-0.5 bg-black/20 hover:bg-black/40 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                               <X className="w-3 h-3" />
                             </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- CHẾ ĐỘ NGÀY --- */}
      {viewMode === 'day' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden flex flex-col">
            <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
               <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{format(currentDate, "EEEE, dd 'tháng' MM, yyyy", { locale: vi })}</h3>
            </div>
            <div className="overflow-y-auto max-h-[700px] relative custom-scrollbar">
              <div className="grid grid-cols-[80px_1fr] relative">
                 <div className="relative border-r dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
                   {DISPLAY_HOURS.map(h => (
                     <div key={h} className="text-sm font-medium text-gray-500 text-right pr-4 pt-2 border-b dark:border-gray-700" style={{ height: `${HOUR_HEIGHT}px` }}>{`${h.toString().padStart(2, '0')}:00`}</div>
                   ))}
                 </div>
                 <div className="relative bg-gray-50/30 dark:bg-gray-900/20" style={{ height: `${DISPLAY_HOURS.length * HOUR_HEIGHT}px` }} 
                    onDoubleClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const y = e.clientY - rect.top;
                      const hour = Math.floor(y / HOUR_HEIGHT) + START_HOUR;
                      openAddModal(currentDate, hour);
                    }}>
                    {DISPLAY_HOURS.map(h => <div key={h} className="border-b dark:border-gray-700/50 pointer-events-none" style={{ height: `${HOUR_HEIGHT}px` }}></div>)}
                    
                    {getEventsForDate(currentDate).map(e => {
                       const style = getEventStyle(e);
                       return (
                          <div key={e.id} 
                               onClick={(ev) => { ev.stopPropagation(); openEditModal(e); }}
                               className={`absolute left-2 right-4 rounded-xl p-3 text-white shadow-lg flex flex-col transition-all hover:scale-[1.01] hover:shadow-xl group border border-white/20 ${!(e as any).isTask ? 'cursor-pointer' : 'cursor-default'}`} 
                               style={{ ...style, backgroundColor: e.color }}>
                             <div className="flex justify-between items-start">
                                <span className="font-bold text-base leading-tight">
                                  {e.recurring && <Repeat className="w-4 h-4 inline mr-1.5 -mt-0.5 opacity-90" />}
                                  {(e as any).isTask && <CheckCircle className="w-4 h-4 inline mr-1.5 -mt-0.5 opacity-90" />}
                                  {e.title}
                                </span>
                                {!(e as any).isTask && <button onClick={(ev) => { ev.stopPropagation(); deleteEvent(e.id); }} className="p-1.5 bg-black/20 hover:bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4"/></button>}
                             </div>
                             <div className="text-sm opacity-90 mt-1.5 font-medium flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {e.startDate?.includes('T') ? format(new Date(e.startDate), 'HH:mm') : '08:00'} - {e.endDate?.includes('T') ? format(new Date(e.endDate), 'HH:mm') : '09:00'}
                             </div>
                             {e.description && <div className="text-sm mt-2 opacity-80 line-clamp-2">{e.description}</div>}
                          </div>
                       )
                    })}
                 </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border dark:border-gray-700">
              <h3 className="font-bold text-lg mb-4 dark:text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-500" /> Sự kiện & Việc hôm nay</h3>
              {getEventsForDate(currentDate).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3"><Coffee className="w-6 h-6 text-gray-400" /></div>
                  Ngày rảnh rỗi!
                </div>
              ) : (
                <div className="space-y-3">
                  {getEventsForDate(currentDate).map(e => (
                    <div key={e.id} onClick={() => openEditModal(e)} className={`flex items-start gap-3 p-3 rounded-xl border border-transparent transition-colors ${!(e as any).isTask ? 'cursor-pointer hover:border-gray-200 dark:hover:border-gray-700' : ''}`} style={{ backgroundColor: `${e.color}15` }}>
                      <div className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0 shadow-sm flex items-center justify-center text-white" style={{ backgroundColor: e.color }}>
                        {e.recurring && <Repeat className="w-2.5 h-2.5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold dark:text-white leading-tight">{e.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">{e.startDate?.includes('T') ? format(new Date(e.startDate), 'HH:mm') : '08:00'} - {e.endDate?.includes('T') ? format(new Date(e.endDate), 'HH:mm') : '09:00'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL THÊM / SỬA SỰ KIỆN --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="w-6 h-6 text-indigo-600" /> {editingEventId ? 'Sửa sự kiện' : 'Thêm sự kiện'}
              </h2>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tiêu đề sự kiện *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full p-3 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-800" required placeholder="VD: Họp dự án..." />
              </div>
              
              <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border dark:border-gray-700">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Bắt đầu</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value, endDate: form.endDate || e.target.value })} className="w-full p-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500" required />
                  <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="w-full p-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Kết thúc</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full p-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500" required />
                  <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className="w-full p-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500" required />
                </div>

                {/* THIẾT LẬP LẶP LẠI */}
                <div className="space-y-2 col-span-2 pt-2 border-t dark:border-gray-700">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><Repeat className="w-3 h-3"/> Lặp lại sự kiện</label>
                  <select value={form.recurring} onChange={e => {
                    const val = e.target.value;
                    let days = form.recurringDays;
                    if (val === 'weekly_custom' && days.length === 0) {
                      const dStr = form.startDate;
                      const d = dStr ? new Date(dStr) : new Date();
                      days = [d.getDay()];
                    }
                    setForm({ ...form, recurring: val as any, recurringDays: days });
                  }} className="w-full p-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500">
                    <option value="">Không lặp lại</option>
                    <option value="daily">Hằng ngày</option>
                    <option value="weekly">Hằng tuần (Cùng thứ)</option>
                    <option value="weekly_custom">Tùy chọn thứ trong tuần</option>
                    <option value="monthly">Hằng tháng (Cùng ngày)</option>
                  </select>

                  {form.recurring === 'weekly_custom' && (
                    <div className="flex gap-1 mt-2">
                       {[{ l: 'T2', v: 1 }, { l: 'T3', v: 2 }, { l: 'T4', v: 3 }, { l: 'T5', v: 4 }, { l: 'T6', v: 5 }, { l: 'T7', v: 6 }, { l: 'CN', v: 0 }].map(day => {
                           const isSelected = form.recurringDays.includes(day.v);
                           return (
                               <button key={day.v} type="button" onClick={() => {
                                      const next = isSelected ? form.recurringDays.filter(d => d !== day.v) : [...form.recurringDays, day.v];
                                      setForm({...form, recurringDays: next});
                                  }} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors border ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                  {day.l}
                               </button>
                           )
                       })}
                    </div>
                  )}

                  {/* ĐÃ NÂNG CẤP: CHỌN NGÀY KẾT THÚC LẶP LẠI */}
                  {form.recurring && (
                    <div className="mt-3 pt-2 border-t border-dashed dark:border-gray-700">
                       <label className="block text-xs font-bold text-gray-500 mb-1">Lặp lại đến ngày (Tùy chọn)</label>
                       <input type="date" value={form.recurringEndDate} onChange={e => setForm({...form, recurringEndDate: e.target.value})} min={form.startDate} className="w-full p-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú thêm</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full p-3 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white resize-none bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500" rows={2} placeholder="Nhập ghi chú..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phân loại màu sắc</label>
                <div className="flex gap-3 flex-wrap">
                  {eventColors.map(color => (
                    <button key={color} type="button" onClick={() => setForm({ ...form, color })} className={`w-8 h-8 rounded-full transition-all duration-200 ${form.color === color ? 'ring-4 ring-offset-2 ring-indigo-200 dark:ring-offset-gray-800 scale-110 shadow-lg' : 'hover:scale-110 opacity-80 hover:opacity-100'}`} style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 py-3 border dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Hủy</button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-colors shadow-md shadow-indigo-500/25">{editingEventId ? 'Cập nhật' : 'Lưu sự kiện'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.5); border-radius: 10px; }`}</style>
    </div>
  );
}

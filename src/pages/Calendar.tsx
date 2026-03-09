import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTableData } from '../hooks/useData';
import { Event, Task } from '../types';
import { Plus, X, ChevronLeft, ChevronRight, CheckCircle, Lightbulb, Clock, Zap, Coffee, Book, Dumbbell, Music, Code, Users, Phone, ShoppingBag, Utensils, Briefcase, Heart, Sparkles } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, isToday, isTomorrow } from 'date-fns';
import { vi } from 'date-fns/locale';

type ViewMode = 'month' | 'week' | 'day';
const eventColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

const activitySuggestions = [
  { icon: Coffee, name: 'Uống cà phê & lập kế hoạch', duration: 30, timeRange: [6, 9], category: 'productivity', color: '#8b5cf6' },
  { icon: Dumbbell, name: 'Tập thể dục buổi sáng', duration: 60, timeRange: [6, 9], category: 'health', color: '#22c55e' },
  { icon: Book, name: 'Đọc sách 30 phút', duration: 30, timeRange: [6, 9], category: 'learning', color: '#3b82f6' },
  { icon: Code, name: 'Deep work - Tập trung cao độ', duration: 120, timeRange: [9, 12], category: 'work', color: '#6366f1' },
  { icon: Briefcase, name: 'Xử lý email & tin nhắn', duration: 30, timeRange: [9, 12], category: 'work', color: '#64748b' },
  { icon: Phone, name: 'Gọi điện/Meeting', duration: 60, timeRange: [9, 12], category: 'work', color: '#f97316' },
  { icon: Utensils, name: 'Nghỉ trưa & ăn uống', duration: 60, timeRange: [12, 14], category: 'break', color: '#eab308' },
  { icon: Music, name: 'Nghe nhạc thư giãn', duration: 30, timeRange: [12, 14], category: 'relax', color: '#ec4899' },
  { icon: Users, name: 'Họp nhóm/Brainstorm', duration: 60, timeRange: [14, 18], category: 'work', color: '#f43f5e' },
  { icon: Code, name: 'Làm việc sáng tạo', duration: 90, timeRange: [14, 18], category: 'work', color: '#8b5cf6' },
  { icon: ShoppingBag, name: 'Đi chợ/Mua sắm', duration: 60, timeRange: [14, 18], category: 'errands', color: '#06b6d4' },
  { icon: Dumbbell, name: 'Tập gym buổi tối', duration: 90, timeRange: [18, 21], category: 'health', color: '#22c55e' },
  { icon: Heart, name: 'Thời gian gia đình', duration: 120, timeRange: [18, 21], category: 'personal', color: '#ec4899' },
  { icon: Book, name: 'Học online/Khóa học', duration: 60, timeRange: [18, 21], category: 'learning', color: '#3b82f6' },
  { icon: Music, name: 'Giải trí/Xem phim', duration: 90, timeRange: [21, 23], category: 'relax', color: '#a855f7' },
  { icon: Book, name: 'Đọc sách trước khi ngủ', duration: 30, timeRange: [21, 23], category: 'relax', color: '#6366f1' },
  { icon: Sparkles, name: 'Thiền/Mindfulness', duration: 20, timeRange: [21, 23], category: 'health', color: '#14b8a6' },
];

const quickTasks = [
  { name: 'Trả lời tin nhắn', duration: 15, icon: '💬' },
  { name: 'Dọn dẹp bàn làm việc', duration: 15, icon: '🧹' },
  { name: 'Uống nước & nghỉ mắt', duration: 10, icon: '💧' },
  { name: 'Ghi chú ý tưởng', duration: 10, icon: '💡' },
  { name: 'Kiểm tra lịch ngày mai', duration: 10, icon: '📅' },
  { name: 'Stretching nhẹ', duration: 10, icon: '🧘' },
];

interface FreeTimeSlot { date: Date; startHour: number; endHour: number; duration: number; suggestions: typeof activitySuggestions; }

export function CalendarPage() {
  const { user } = useApp();
  const { data: events = [], isLoading: l1, addRecord: addEvent, deleteRecord: deleteEvent } = useTableData<Event>('events');
  const { data: tasks = [], isLoading: l2 } = useTableData<Task>('tasks');
  const isLoading = l1 || l2;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [showModal, setShowModal] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [_selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<FreeTimeSlot | null>(null);

  const [form, setForm] = useState({ title: '', description: '', startDate: '', startTime: '09:00', endDate: '', endTime: '10:00', color: eventColors[0], recurring: '' as '' | 'daily' | 'weekly' | 'monthly' });

  const navigate = (dir: number) => {
    if (viewMode === 'month') setCurrentDate(dir > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(dir > 0 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    else setCurrentDate(dir > 0 ? addDays(currentDate, 1) : subDays(currentDate, 1));
  };

  const calendarDays = eachDayOfInterval({ start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }) });
  const weekDays = eachDayOfInterval({ start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 6) });
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // ĐÃ NÂNG CẤP: Quét và hiển thị cả Task mẹ lẫn Subtask lên lịch
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

  const getEventsForDate = (date: Date) => allEvents.filter(e => e.startDate.startsWith(format(date, 'yyyy-MM-dd')));

  const getBusyHours = (date: Date): Set<number> => {
    const dayEvents = getEventsForDate(date);
    const busyHours = new Set<number>();
    dayEvents.forEach(e => {
      if (e.startDate.includes('T')) {
        const h = parseInt(e.startDate.split('T')[1].split(':')[0]);
        const eh = e.endDate.includes('T') ? parseInt(e.endDate.split('T')[1].split(':')[0]) : h + 1;
        for (let i = h; i <= eh; i++) busyHours.add(i);
      } else {
        busyHours.add(9); busyHours.add(10);
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
    if (slotStart !== -1) {
      const duration = (22 - slotStart) * 60;
      if (duration >= 30) {
        const suggestions = activitySuggestions.filter(a => a.duration <= duration && slotStart >= a.timeRange[0] && slotStart < a.timeRange[1]);
        slots.push({ date, startHour: slotStart, endHour: 22, duration, suggestions: suggestions.length > 0 ? suggestions : activitySuggestions.filter(a => a.duration <= duration).slice(0, 3) });
      }
    }
    return slots;
  };

  const weekFreeSlots = useMemo(() => weekDays.map(day => ({ date: day, slots: getFreeTimeSlots(day) })).filter(d => d.slots.length > 0), [weekDays, events, tasks]);
  const totalFreeMinutes = useMemo(() => weekFreeSlots.reduce((total, day) => total + day.slots.reduce((dayTotal, slot) => dayTotal + slot.duration, 0), 0), [weekFreeSlots]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEvent({ title: form.title, description: form.description, startDate: `${form.startDate}T${form.startTime}`, endDate: `${form.endDate || form.startDate}T${form.endTime}`, color: form.color, recurring: form.recurring || undefined, userId: user?.id });
    setForm({ title: '', description: '', startDate: '', startTime: '09:00', endDate: '', endTime: '10:00', color: eventColors[0], recurring: '' });
    setShowModal(false);
  };

  const openAddModal = (date?: Date) => {
    const d = date || new Date();
    const dateStr = format(d, 'yyyy-MM-dd');
    setForm({ ...form, startDate: dateStr, endDate: dateStr });
    setShowModal(true);
  };

  const addSuggestionAsEvent = (suggestion: typeof activitySuggestions[0], slot: FreeTimeSlot) => {
    const dateStr = format(slot.date, 'yyyy-MM-dd');
    const startTime = `${slot.startHour.toString().padStart(2, '0')}:00`;
    const endHour = slot.startHour + Math.ceil(suggestion.duration / 60);
    const endTime = `${Math.min(endHour, 23).toString().padStart(2, '0')}:00`;
    addEvent({ title: suggestion.name, description: `Gợi ý hoạt động - ${suggestion.category}`, startDate: `${dateStr}T${startTime}`, endDate: `${dateStr}T${endTime}`, color: suggestion.color, userId: user?.id });
    setSelectedSlot(null);
  };

  const today = new Date();
  if (isLoading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📅 Lịch & Sự kiện</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{events.length} sự kiện · {taskEvents.length} deadline</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSuggestions(!showSuggestions)} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${showSuggestions ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}><Lightbulb className="w-5 h-5" /> Gợi ý thời gian rảnh</button>
          <div className="flex border dark:border-gray-600 rounded-lg overflow-hidden">
            {(['day', 'week', 'month'] as ViewMode[]).map(v => <button key={v} onClick={() => setViewMode(v)} className={`px-3 py-1.5 text-sm transition-colors ${viewMode === v ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800'}`}>{v === 'day' ? 'Ngày' : v === 'week' ? 'Tuần' : 'Tháng'}</button>)}
          </div>
          <button onClick={() => openAddModal()} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg"><Plus className="w-5 h-5" /> Sự kiện</button>
        </div>
      </div>

      {showSuggestions && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800 overflow-hidden animate-fadeIn">
          <div className="p-4 border-b border-amber-200 dark:border-amber-800">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3"><div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center"><Lightbulb className="w-6 h-6 text-white" /></div><div><h2 className="text-lg font-bold text-gray-900 dark:text-white">💡 Gợi ý hoạt động</h2><p className="text-sm text-gray-600 dark:text-gray-400">Tuần này bạn rảnh <span className="font-semibold text-amber-600">{Math.floor(totalFreeMinutes / 60)} giờ {totalFreeMinutes % 60} phút</span></p></div></div>
              <button onClick={() => setShowSuggestions(false)}><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Việc nhanh (10-15 phút)</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {quickTasks.map((task, i) => <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full text-sm border hover:border-amber-400 cursor-pointer"><span>{task.icon}</span><span>{task.name}</span></span>)}
            </div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /> Khung giờ rảnh trong tuần</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {weekFreeSlots.map((dayData, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-4 border">
                  <p className="font-medium mb-3">{format(dayData.date, 'EEEE dd/MM', { locale: vi })}</p>
                  <div className="space-y-2">
                    {dayData.slots.map((slot, slotIdx) => (
                      <div key={slotIdx} onClick={() => setSelectedSlot(slot)} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border cursor-pointer hover:border-green-400">
                        <div className="text-sm font-medium text-green-700 dark:text-green-400">{slot.startHour.toString().padStart(2, '0')}:00 - {slot.endHour.toString().padStart(2, '0')}:00</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {viewMode === 'month' && format(currentDate, 'MMMM yyyy', { locale: vi })}
          {viewMode === 'week' && `Tuần ${format(weekStart, 'dd/MM')} - ${format(addDays(weekStart, 6), 'dd/MM')}`}
          {viewMode === 'day' && format(currentDate, "EEEE, dd 'tháng' MM, yyyy", { locale: vi })}
        </h2>
        <div className="flex gap-2"><button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">Hôm nay</button><button onClick={() => navigate(1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-5 h-5" /></button></div>
      </div>

      {viewMode === 'month' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
          <div className="grid grid-cols-7 border-b dark:border-gray-700">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => <div key={d} className="p-2 text-center text-sm font-medium text-gray-500">{d}</div>)}</div>
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const dayEvents = getEventsForDate(day);
              return (
                <div key={i} onClick={() => { setSelectedDate(day); setCurrentDate(day); setViewMode('day'); }} className={`min-h-[100px] p-2 border-b border-r dark:border-gray-700 cursor-pointer hover:bg-gray-50 ${!isSameMonth(day, currentDate) ? 'opacity-40' : ''}`}>
                  <div className="flex justify-between mb-1"><div className={`w-7 h-7 flex items-center justify-center rounded-full ${isSameDay(day, today) ? 'bg-indigo-600 text-white' : 'dark:text-white'}`}>{format(day, 'd')}</div></div>
                  <div className="space-y-1">{dayEvents.slice(0, 3).map(e => <div key={e.id} className="text-xs px-1.5 py-0.5 rounded truncate text-white" style={{ backgroundColor: e.color }}>{(e as any).isTask && <CheckCircle className="w-3 h-3 inline mr-0.5" />}{e.title}</div>)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'week' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
          <div className="grid grid-cols-8 border-b dark:border-gray-700"><div className="p-2 text-center text-sm font-medium text-gray-500">Giờ</div>{weekDays.map((d, i) => <div key={i} className={`p-2 text-center text-sm font-medium ${isSameDay(d, today) ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'}`}>{format(d, 'EEE dd', { locale: vi })}</div>)}</div>
          <div className="max-h-[500px] overflow-y-auto">
            {hours.filter(h => h >= 6 && h <= 22).map(h => (
              <div key={h} className="grid grid-cols-8 border-b dark:border-gray-700 min-h-[50px]"><div className="p-2 text-xs text-gray-500 border-r">{`${h.toString().padStart(2, '0')}:00`}</div>{weekDays.map((d, i) => {
                const dayEvents = getEventsForDate(d).filter(e => e.startDate.includes('T') && parseInt(e.startDate.split('T')[1].split(':')[0]) === h);
                return <div key={i} onClick={() => openAddModal(d)} className="border-r p-1 cursor-pointer hover:bg-gray-50">{dayEvents.map(e => <div key={e.id} className="text-xs px-1 py-0.5 rounded text-white mb-0.5 truncate" style={{ backgroundColor: e.color }}>{e.title}</div>)}</div>;
              })}</div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'day' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden"><div className="max-h-[600px] overflow-y-auto">{hours.filter(h => h >= 6 && h <= 22).map(h => {
            const hourEvents = getEventsForDate(currentDate).filter(e => (!e.startDate.includes('T') ? h === 8 : parseInt(e.startDate.split('T')[1].split(':')[0]) === h));
            return <div key={h} className="flex border-b min-h-[60px]"><div className="w-16 p-2 text-sm text-gray-500 border-r">{`${h.toString().padStart(2, '0')}:00`}</div><div className="flex-1 p-2 space-y-1 hover:bg-gray-50 cursor-pointer" onClick={() => openAddModal(currentDate)}>{hourEvents.map(e => <div key={e.id} className="flex justify-between px-3 py-2 rounded-lg text-white text-sm" style={{ backgroundColor: e.color }}><span>{e.title}</span>{!(e as any).isTask && <button onClick={(ev) => { ev.stopPropagation(); deleteEvent(e.id); }}><X className="w-4 h-4" /></button>}</div>)}</div></div>;
          })}</div></div>
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border"><h3 className="font-semibold mb-3 dark:text-white">📋 Sự kiện hôm nay</h3>{getEventsForDate(currentDate).length === 0 ? <p className="text-sm text-gray-500">Không có sự kiện</p> : getEventsForDate(currentDate).map(e => <div key={e.id} className="flex items-center gap-2 p-2 rounded-lg mb-2" style={{ backgroundColor: `${e.color}15` }}><div className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color }} /><p className="text-sm font-medium dark:text-white">{e.title}</p></div>)}</div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-4"><div className="flex justify-between mb-4"><h2 className="text-lg font-bold dark:text-white">Thêm sự kiện</h2><button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button></div><form onSubmit={handleSubmit} className="space-y-4"><input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" required placeholder="Tiêu đề *" /><div className="grid grid-cols-2 gap-4"><input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value, endDate: form.endDate || e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" required /><input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" /></div><button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium">Tạo sự kiện</button></form></div></div>
      )}
    </div>
  );
}

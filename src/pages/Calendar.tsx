import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, X, ChevronLeft, ChevronRight, CheckCircle, Lightbulb, Clock, Zap, Coffee, Book, Dumbbell, Music, Code, Users, Phone, ShoppingBag, Utensils, Briefcase, Heart, Sparkles } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, isToday, isTomorrow } from 'date-fns';
import { vi } from 'date-fns/locale';

type ViewMode = 'month' | 'week' | 'day';

const eventColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

// Activity suggestions based on time of day and duration
const activitySuggestions = [
  // Morning activities (6-9)
  { icon: Coffee, name: 'Uống cà phê & lập kế hoạch', duration: 30, timeRange: [6, 9], category: 'productivity', color: '#8b5cf6' },
  { icon: Dumbbell, name: 'Tập thể dục buổi sáng', duration: 60, timeRange: [6, 9], category: 'health', color: '#22c55e' },
  { icon: Book, name: 'Đọc sách 30 phút', duration: 30, timeRange: [6, 9], category: 'learning', color: '#3b82f6' },
  
  // Work hours (9-12)
  { icon: Code, name: 'Deep work - Tập trung cao độ', duration: 120, timeRange: [9, 12], category: 'work', color: '#6366f1' },
  { icon: Briefcase, name: 'Xử lý email & tin nhắn', duration: 30, timeRange: [9, 12], category: 'work', color: '#64748b' },
  { icon: Phone, name: 'Gọi điện/Meeting', duration: 60, timeRange: [9, 12], category: 'work', color: '#f97316' },
  
  // Lunch break (12-14)
  { icon: Utensils, name: 'Nghỉ trưa & ăn uống', duration: 60, timeRange: [12, 14], category: 'break', color: '#eab308' },
  { icon: Music, name: 'Nghe nhạc thư giãn', duration: 30, timeRange: [12, 14], category: 'relax', color: '#ec4899' },
  
  // Afternoon (14-18)
  { icon: Users, name: 'Họp nhóm/Brainstorm', duration: 60, timeRange: [14, 18], category: 'work', color: '#f43f5e' },
  { icon: Code, name: 'Làm việc sáng tạo', duration: 90, timeRange: [14, 18], category: 'work', color: '#8b5cf6' },
  { icon: ShoppingBag, name: 'Đi chợ/Mua sắm', duration: 60, timeRange: [14, 18], category: 'errands', color: '#06b6d4' },
  
  // Evening (18-21)
  { icon: Dumbbell, name: 'Tập gym buổi tối', duration: 90, timeRange: [18, 21], category: 'health', color: '#22c55e' },
  { icon: Heart, name: 'Thời gian gia đình', duration: 120, timeRange: [18, 21], category: 'personal', color: '#ec4899' },
  { icon: Book, name: 'Học online/Khóa học', duration: 60, timeRange: [18, 21], category: 'learning', color: '#3b82f6' },
  
  // Night (21-23)
  { icon: Music, name: 'Giải trí/Xem phim', duration: 90, timeRange: [21, 23], category: 'relax', color: '#a855f7' },
  { icon: Book, name: 'Đọc sách trước khi ngủ', duration: 30, timeRange: [21, 23], category: 'relax', color: '#6366f1' },
  { icon: Sparkles, name: 'Thiền/Mindfulness', duration: 20, timeRange: [21, 23], category: 'health', color: '#14b8a6' },
];

// Quick tasks that can be done in short time slots
const quickTasks = [
  { name: 'Trả lời tin nhắn', duration: 15, icon: '💬' },
  { name: 'Dọn dẹp bàn làm việc', duration: 15, icon: '🧹' },
  { name: 'Uống nước & nghỉ mắt', duration: 10, icon: '💧' },
  { name: 'Ghi chú ý tưởng', duration: 10, icon: '💡' },
  { name: 'Kiểm tra lịch ngày mai', duration: 10, icon: '📅' },
  { name: 'Stretching nhẹ', duration: 10, icon: '🧘' },
];

interface FreeTimeSlot {
  date: Date;
  startHour: number;
  endHour: number;
  duration: number; // in minutes
  suggestions: typeof activitySuggestions;
}

export function CalendarPage() {
  const { events, addEvent, deleteEvent, tasks } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [showModal, setShowModal] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [_selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<FreeTimeSlot | null>(null);

  const [form, setForm] = useState({
    title: '', description: '',
    startDate: '', startTime: '09:00',
    endDate: '', endTime: '10:00',
    color: eventColors[0],
    recurring: '' as '' | 'daily' | 'weekly' | 'monthly',
  });

  const navigate = (dir: number) => {
    if (viewMode === 'month') setCurrentDate(dir > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(dir > 0 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    else setCurrentDate(dir > 0 ? addDays(currentDate, 1) : subDays(currentDate, 1));
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Tasks with due dates as pseudo-events
  const taskEvents = useMemo(() =>
    tasks.filter(t => t.dueDate && !t.completed).map(t => ({
      id: `task-${t.id}`, title: `✓ ${t.title}`, description: '', startDate: t.dueDate,
      endDate: t.dueDate, color: '#6366f1', isTask: true, taskId: t.id,
    })), [tasks]);

  const allEvents = [...events, ...taskEvents];

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return allEvents.filter(e => e.startDate.startsWith(dateStr));
  };

  // Get busy hours for a specific date
  const getBusyHours = (date: Date): Set<number> => {
    const dayEvents = getEventsForDate(date);
    const busyHours = new Set<number>();
    dayEvents.forEach(e => {
      if (e.startDate.includes('T')) {
        const h = parseInt(e.startDate.split('T')[1].split(':')[0]);
        const eh = e.endDate.includes('T') ? parseInt(e.endDate.split('T')[1].split(':')[0]) : h + 1;
        for (let i = h; i <= eh; i++) busyHours.add(i);
      } else {
        // All-day event or task without specific time - mark morning as potentially busy
        busyHours.add(9);
        busyHours.add(10);
      }
    });
    return busyHours;
  };

  // Get free time slots for a date
  const getFreeTimeSlots = (date: Date): FreeTimeSlot[] => {
    const busyHours = getBusyHours(date);
    const slots: FreeTimeSlot[] = [];
    
    // Only consider reasonable hours (7am - 10pm)
    let slotStart = -1;
    for (let h = 7; h <= 22; h++) {
      if (!busyHours.has(h)) {
        if (slotStart === -1) slotStart = h;
      } else {
        if (slotStart !== -1) {
          const duration = (h - slotStart) * 60;
          if (duration >= 30) { // Only show slots >= 30 minutes
            const suggestions = activitySuggestions.filter(a => 
              a.duration <= duration && 
              slotStart >= a.timeRange[0] && 
              slotStart < a.timeRange[1]
            );
            slots.push({
              date,
              startHour: slotStart,
              endHour: h,
              duration,
              suggestions: suggestions.length > 0 ? suggestions : activitySuggestions.filter(a => a.duration <= duration).slice(0, 3)
            });
          }
          slotStart = -1;
        }
      }
    }
    // Handle slot at end of day
    if (slotStart !== -1) {
      const duration = (22 - slotStart) * 60;
      if (duration >= 30) {
        const suggestions = activitySuggestions.filter(a => 
          a.duration <= duration && 
          slotStart >= a.timeRange[0] && 
          slotStart < a.timeRange[1]
        );
        slots.push({
          date,
          startHour: slotStart,
          endHour: 22,
          duration,
          suggestions: suggestions.length > 0 ? suggestions : activitySuggestions.filter(a => a.duration <= duration).slice(0, 3)
        });
      }
    }
    return slots;
  };

  // Get free time slots for the week
  const weekFreeSlots = useMemo(() => {
    return weekDays.map(day => ({
      date: day,
      slots: getFreeTimeSlots(day)
    })).filter(d => d.slots.length > 0);
  }, [weekDays, events, tasks]);

  // Total free hours this week
  const totalFreeMinutes = useMemo(() => {
    return weekFreeSlots.reduce((total, day) => 
      total + day.slots.reduce((dayTotal, slot) => dayTotal + slot.duration, 0), 0
    );
  }, [weekFreeSlots]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEvent({
      title: form.title, description: form.description,
      startDate: `${form.startDate}T${form.startTime}`,
      endDate: `${form.endDate || form.startDate}T${form.endTime}`,
      color: form.color,
      recurring: form.recurring || undefined,
    });
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
    
    addEvent({
      title: suggestion.name,
      description: `Gợi ý hoạt động - ${suggestion.category}`,
      startDate: `${dateStr}T${startTime}`,
      endDate: `${dateStr}T${endTime}`,
      color: suggestion.color,
    });
    setSelectedSlot(null);
  };

  const today = new Date();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📅 Lịch & Sự kiện</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{events.length} sự kiện · {taskEvents.length} deadline</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSuggestions(!showSuggestions)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showSuggestions 
                ? 'bg-amber-500 text-white' 
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50'
            }`}>
            <Lightbulb className="w-5 h-5" />
            Gợi ý thời gian rảnh
          </button>
          <div className="flex border dark:border-gray-600 rounded-lg overflow-hidden">
            {(['day', 'week', 'month'] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 text-sm transition-colors ${viewMode === v ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                {v === 'day' ? 'Ngày' : v === 'week' ? 'Tuần' : 'Tháng'}
              </button>
            ))}
          </div>
          <button onClick={() => openAddModal()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-5 h-5" /> Sự kiện
          </button>
        </div>
      </div>

      {/* Free Time Suggestions Panel */}
      {showSuggestions && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800 overflow-hidden animate-fadeIn">
          <div className="p-4 border-b border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">💡 Gợi ý hoạt động cho thời gian rảnh</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tuần này bạn có khoảng <span className="font-semibold text-amber-600">{Math.floor(totalFreeMinutes / 60)} giờ {totalFreeMinutes % 60} phút</span> thời gian rảnh
                  </p>
                </div>
              </div>
              <button onClick={() => setShowSuggestions(false)} className="p-2 hover:bg-amber-100 dark:hover:bg-amber-800/50 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-4">
            {/* Quick Tasks */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Việc nhanh (10-15 phút)
              </h3>
              <div className="flex flex-wrap gap-2">
                {quickTasks.map((task, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full text-sm border border-gray-200 dark:border-gray-700 hover:border-amber-400 cursor-pointer transition-colors">
                    <span>{task.icon}</span>
                    <span>{task.name}</span>
                    <span className="text-xs text-gray-400">({task.duration}p)</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Weekly Free Slots */}
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Khung giờ rảnh trong tuần
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {weekFreeSlots.map((dayData, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                      isToday(dayData.date) 
                        ? 'bg-indigo-600 text-white' 
                        : isTomorrow(dayData.date)
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {format(dayData.date, 'd')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {isToday(dayData.date) ? 'Hôm nay' : isTomorrow(dayData.date) ? 'Ngày mai' : format(dayData.date, 'EEEE', { locale: vi })}
                      </p>
                      <p className="text-xs text-gray-500">{format(dayData.date, 'dd/MM')}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {dayData.slots.map((slot, slotIdx) => (
                      <div key={slotIdx} 
                        onClick={() => setSelectedSlot(slot)}
                        className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 cursor-pointer hover:border-green-400 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-green-700 dark:text-green-400">
                            {slot.startHour.toString().padStart(2, '0')}:00 - {slot.endHour.toString().padStart(2, '0')}:00
                          </span>
                          <span className="text-xs bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300 px-2 py-0.5 rounded-full">
                            {Math.floor(slot.duration / 60)}h{slot.duration % 60 > 0 ? ` ${slot.duration % 60}p` : ''}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {slot.suggestions.slice(0, 2).map((s, sIdx) => (
                            <span key={sIdx} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              <s.icon className="w-3 h-3" />
                              {s.name.length > 15 ? s.name.slice(0, 15) + '...' : s.name}
                            </span>
                          ))}
                          {slot.suggestions.length > 2 && (
                            <span className="text-xs text-gray-400">+{slot.suggestions.length - 2}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {weekFreeSlots.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Tuần này lịch của bạn khá kín!</p>
                  <p className="text-sm">Hãy cân nhắc sắp xếp lại để có thời gian nghỉ ngơi.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {viewMode === 'month' && format(currentDate, 'MMMM yyyy', { locale: vi })}
          {viewMode === 'week' && `Tuần ${format(weekStart, 'dd/MM')} - ${format(addDays(weekStart, 6), 'dd/MM')}`}
          {viewMode === 'day' && format(currentDate, "EEEE, dd 'tháng' MM, yyyy", { locale: vi })}
        </h2>
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Hôm nay</button>
          <button onClick={() => navigate(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
          <div className="grid grid-cols-7 border-b dark:border-gray-700">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
              <div key={d} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const dayEvents = getEventsForDate(day);
              const dayIsToday = isSameDay(day, today);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const freeSlots = getFreeTimeSlots(day);
              return (
                <div key={i} onClick={() => { setSelectedDate(day); setCurrentDate(day); setViewMode('day'); }}
                  className={`min-h-[100px] p-2 border-b border-r dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!isCurrentMonth ? 'opacity-40' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${dayIsToday ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      {format(day, 'd')}
                    </div>
                    {freeSlots.length > 0 && isCurrentMonth && (
                      <span className="w-2 h-2 bg-green-400 rounded-full" title={`${freeSlots.length} khung giờ rảnh`} />
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(e => (
                      <div key={e.id} className="text-xs px-1.5 py-0.5 rounded truncate text-white" style={{ backgroundColor: e.color }}>
                        {(e as any).isTask && <CheckCircle className="w-3 h-3 inline mr-0.5" />}
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && <div className="text-xs text-gray-500 dark:text-gray-400 px-1">+{dayEvents.length - 3} khác</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
          <div className="grid grid-cols-8 border-b dark:border-gray-700">
            <div className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">Giờ</div>
            {weekDays.map((d, i) => (
              <div key={i} className={`p-2 text-center text-sm font-medium ${isSameDay(d, today) ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'text-gray-500 dark:text-gray-400'}`}>
                {format(d, 'EEE dd', { locale: vi })}
              </div>
            ))}
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {hours.filter(h => h >= 6 && h <= 22).map(h => (
              <div key={h} className="grid grid-cols-8 border-b dark:border-gray-700 min-h-[50px]">
                <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-r dark:border-gray-700">{`${h.toString().padStart(2, '0')}:00`}</div>
                {weekDays.map((d, i) => {
                  const dayEvents = getEventsForDate(d).filter(e => {
                    if (!e.startDate.includes('T')) return false;
                    const eHour = parseInt(e.startDate.split('T')[1].split(':')[0]);
                    return eHour === h;
                  });
                  const isFree = !getBusyHours(d).has(h) && h >= 7 && h <= 21;
                  return (
                    <div key={i} onClick={() => openAddModal(d)} 
                      className={`border-r dark:border-gray-700 p-1 cursor-pointer transition-colors ${
                        isFree && showSuggestions
                          ? 'bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                      }`}>
                      {dayEvents.map(e => (
                        <div key={e.id} className="text-xs px-1 py-0.5 rounded text-white mb-0.5 truncate" style={{ backgroundColor: e.color }}>{e.title}</div>
                      ))}
                      {isFree && showSuggestions && dayEvents.length === 0 && (
                        <div className="text-xs text-green-500 dark:text-green-400 opacity-60">+ Rảnh</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day View */}
      {viewMode === 'day' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto">
              {hours.filter(h => h >= 6 && h <= 22).map(h => {
                const hourEvents = getEventsForDate(currentDate).filter(e => {
                  if (!e.startDate.includes('T')) return h === 8;
                  return parseInt(e.startDate.split('T')[1].split(':')[0]) === h;
                });
                const isFree = !getBusyHours(currentDate).has(h) && h >= 7 && h <= 21;
                return (
                  <div key={h} className={`flex border-b dark:border-gray-700 min-h-[60px] ${isFree && showSuggestions ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}>
                    <div className="w-16 p-2 text-sm text-gray-500 dark:text-gray-400 border-r dark:border-gray-700 flex-shrink-0">
                      {`${h.toString().padStart(2, '0')}:00`}
                    </div>
                    <div className="flex-1 p-2 space-y-1 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer" onClick={() => openAddModal(currentDate)}>
                      {hourEvents.map(e => (
                        <div key={e.id} className="flex items-center justify-between px-3 py-2 rounded-lg text-white text-sm" style={{ backgroundColor: e.color }}>
                          <span>{e.title}</span>
                          {!(e as any).isTask && (
                            <button onClick={(ev) => { ev.stopPropagation(); deleteEvent(e.id); }} className="hover:bg-white/20 rounded p-0.5">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {isFree && showSuggestions && hourEvents.length === 0 && (
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                          <Lightbulb className="w-4 h-4" />
                          <span>Thời gian rảnh - Click để thêm sự kiện</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">📋 Sự kiện hôm nay</h3>
              {getEventsForDate(currentDate).length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Không có sự kiện</p>
              ) : getEventsForDate(currentDate).map(e => (
                <div key={e.id} className="flex items-center gap-2 p-2 rounded-lg mb-2" style={{ backgroundColor: `${e.color}15` }}>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{e.title}</p>
                    {e.startDate.includes('T') && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{e.startDate.split('T')[1]?.slice(0, 5)} - {e.endDate.split('T')[1]?.slice(0, 5)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Free time suggestions for this day */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                Gợi ý cho thời gian rảnh
              </h3>
              {getFreeTimeSlots(currentDate).length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Lịch hôm nay khá kín!</p>
              ) : (
                <div className="space-y-3">
                  {getFreeTimeSlots(currentDate).map((slot, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-100 dark:border-green-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                          🕐 {slot.startHour.toString().padStart(2, '0')}:00 - {slot.endHour.toString().padStart(2, '0')}:00
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.floor(slot.duration / 60)}h{slot.duration % 60 > 0 ? ` ${slot.duration % 60}p` : ''}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {slot.suggestions.slice(0, 3).map((s, sIdx) => (
                          <button key={sIdx} 
                            onClick={() => addSuggestionAsEvent(s, slot)}
                            className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${s.color}20` }}>
                              <s.icon className="w-4 h-4" style={{ color: s.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">{s.name}</p>
                              <p className="text-xs text-gray-500">{s.duration} phút</p>
                            </div>
                            <Plus className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Event */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md animate-fadeIn">
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Thêm sự kiện</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tiêu đề *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value, endDate: form.endDate || e.target.value })}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giờ bắt đầu</label>
                  <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giờ kết thúc</label>
                  <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Màu sắc</label>
                <div className="flex gap-2 flex-wrap">
                  {eventColors.map(c => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                      className={`w-8 h-8 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Lặp lại</label>
                <select value={form.recurring} onChange={e => setForm({ ...form, recurring: e.target.value as any })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                  <option value="">Không lặp</option>
                  <option value="daily">Hàng ngày</option>
                  <option value="weekly">Hàng tuần</option>
                  <option value="monthly">Hàng tháng</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium">
                Tạo sự kiện
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal for slot detail suggestions */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedSlot(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Gợi ý cho {format(selectedSlot.date, 'EEEE, dd/MM', { locale: vi })}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedSlot.startHour.toString().padStart(2, '0')}:00 - {selectedSlot.endHour.toString().padStart(2, '0')}:00 
                  ({Math.floor(selectedSlot.duration / 60)}h{selectedSlot.duration % 60 > 0 ? ` ${selectedSlot.duration % 60}p` : ''})
                </p>
              </div>
              <button onClick={() => setSelectedSlot(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                {selectedSlot.suggestions.map((s, idx) => (
                  <button key={idx}
                    onClick={() => addSuggestionAsEvent(s, selectedSlot)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${s.color}20` }}>
                      <s.icon className="w-6 h-6" style={{ color: s.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                      <p className="text-sm text-gray-500">{s.duration} phút · {s.category}</p>
                    </div>
                    <Plus className="w-5 h-5 text-gray-400" />
                  </button>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <button onClick={() => { openAddModal(selectedSlot.date); setSelectedSlot(null); }}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
                  <Plus className="w-5 h-5" />
                  Tạo sự kiện tùy chỉnh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

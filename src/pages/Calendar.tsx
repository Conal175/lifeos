import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTableData } from '../hooks/useData';
import { Event, Task } from '../types';
import { Plus, X, ChevronLeft, ChevronRight, CheckCircle, Lightbulb, Clock, Calendar as CalIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';

type ViewMode = 'month' | 'week' | 'day';
const eventColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

export function CalendarPage() {
  const { user } = useApp();
  const { data: events = [], isLoading: loadE, addRecord: addE, deleteRecord: delE } = useTableData<Event>('events');
  const { data: tasks = [], isLoading: loadT } = useTableData<Task>('tasks');
  const isLoading = loadE || loadT;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', startDate: '', startTime: '09:00', endDate: '', endTime: '10:00', color: eventColors[0] });

  const navigate = (dir: number) => {
    if (viewMode === 'month') setCurrentDate(dir > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(dir > 0 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    else setCurrentDate(dir > 0 ? addDays(currentDate, 1) : subDays(currentDate, 1));
  };

  const calendarDays = eachDayOfInterval({ start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }) });
  const weekDays = eachDayOfInterval({ start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 6) });
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const taskEvents = useMemo(() => tasks.filter(t => t.dueDate && !t.completed).map(t => ({ id: `task-${t.id}`, title: `✓ ${t.title}`, description: '', startDate: t.dueDate, endDate: t.dueDate, color: '#6366f1', isTask: true })), [tasks]);
  const allEvents = [...events, ...taskEvents];

  const getEventsForDate = (date: Date) => allEvents.filter(e => e.startDate.startsWith(format(date, 'yyyy-MM-dd')));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addE({ title: form.title, description: form.description, startDate: `${form.startDate}T${form.startTime}`, endDate: `${form.endDate || form.startDate}T${form.endTime}`, color: form.color, userId: user?.id });
    setForm({ title: '', description: '', startDate: '', startTime: '09:00', endDate: '', endTime: '10:00', color: eventColors[0] });
    setShowModal(false);
  };

  if (isLoading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">📅 Lịch & Sự kiện</h1></div>
        <div className="flex items-center gap-2">
          <div className="flex border dark:border-gray-600 rounded-lg overflow-hidden">
            {(['day', 'week', 'month'] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setViewMode(v)} className={`px-3 py-1.5 text-sm ${viewMode === v ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800'}`}>{v === 'day' ? 'Ngày' : v === 'week' ? 'Tuần' : 'Tháng'}</button>
            ))}
          </div>
          <button onClick={() => { setForm({ ...form, startDate: format(currentDate, 'yyyy-MM-dd'), endDate: format(currentDate, 'yyyy-MM-dd') }); setShowModal(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus className="w-5 h-5" /> Sự kiện</button>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
        <button onClick={() => navigate(-1)} className="p-2"><ChevronLeft /></button>
        <h2 className="text-lg font-semibold dark:text-white">
          {viewMode === 'month' && format(currentDate, 'MMMM yyyy', { locale: vi })}
          {viewMode === 'week' && `Tuần ${format(weekDays[0], 'dd/MM')} - ${format(weekDays[6], 'dd/MM')}`}
          {viewMode === 'day' && format(currentDate, "EEEE, dd/MM/yyyy", { locale: vi })}
        </h2>
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm border rounded-lg">Hôm nay</button>
          <button onClick={() => navigate(1)} className="p-2"><ChevronRight /></button>
        </div>
      </div>

      {viewMode === 'month' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
          <div className="grid grid-cols-7 border-b dark:border-gray-700">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => <div key={d} className="p-2 text-center font-medium text-gray-500">{d}</div>)}</div>
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => (
              <div key={i} className={`min-h-[100px] p-2 border-b border-r dark:border-gray-700 ${!isSameMonth(day, currentDate) ? 'opacity-40' : ''}`}>
                <div className={`w-7 h-7 flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? 'bg-indigo-600 text-white' : 'dark:text-white'}`}>{format(day, 'd')}</div>
                <div className="mt-1 space-y-1">
                  {getEventsForDate(day).slice(0, 3).map(e => <div key={e.id} className="text-xs px-1 rounded truncate text-white" style={{ backgroundColor: e.color }}>{e.title}</div>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-5 shadow-2xl">
            <h2 className="text-lg font-bold mb-4 dark:text-white">Thêm sự kiện</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" required placeholder="Tên sự kiện *" />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" required />
                <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" />
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 p-2 border rounded">Hủy</button>
                <button type="submit" className="flex-1 p-2 bg-indigo-600 text-white rounded">Tạo sự kiện</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

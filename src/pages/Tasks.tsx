import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTableData } from '../hooks/useData';
import { Task, Subtask } from '../types';
import { Plus, Trash2, X, CheckCircle2, Circle, ChevronDown, ChevronRight, Flag, Calendar, Search, Filter, LayoutGrid, Table2, Clock, AlertTriangle, Users, Tag, ListChecks, ArrowUpDown, Eye, Layers } from 'lucide-react';
import { format, subWeeks, eachDayOfInterval, startOfWeek, getDay, differenceInDays, isPast, isToday } from 'date-fns';
import { vi } from 'date-fns/locale';

const priorityConfig = { low: { label: 'Thấp', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', dot: 'bg-blue-500', border: 'border-l-blue-500' }, medium: { label: 'Trung bình', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300', dot: 'bg-yellow-500', border: 'border-l-yellow-500' }, high: { label: 'Cao', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', dot: 'bg-orange-500', border: 'border-l-orange-500' }, urgent: { label: 'Khẩn cấp', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', dot: 'bg-red-500', border: 'border-l-red-500' } };
const statusConfig = { todo: { label: 'Chờ làm', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', icon: '📋' }, in_progress: { label: 'Đang làm', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', icon: '🔄' }, review: { label: 'Đang review', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', icon: '👁️' }, done: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', icon: '✅' } };
const categoryColors: Record<string, string> = { 'Công việc': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300', 'Học tập': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', 'Sức khỏe': 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300', 'Cá nhân': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', 'Khác': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' };

export function Tasks() {
  const { user } = useApp();
  const { data: tasks, isLoading, addRecord, updateRecord, deleteRecord } = useTableData<Task>('tasks');
  
  const [showModal, setShowModal] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'status' | 'title'>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [detailTask, setDetailTask] = useState<string | null>(null);

  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent', dueDate: new Date().toISOString().split('T')[0], category: 'Công việc', status: 'todo' as 'todo' | 'in_progress' | 'review' | 'done', assignee: '', estimatedHours: 0, subtaskInputs: [''] });

  const categories = useMemo(() => Array.from(new Set(tasks.map(t => t.category || 'Khác'))), [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (filterCategory !== 'all' && (t.category || 'Khác') !== filterCategory) return false;
      if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) && !t.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    }).sort((a, b) => {
      const pOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const sOrder = { todo: 0, in_progress: 1, review: 2, done: 3 };
      let cmp = 0;
      switch (sortBy) {
        case 'priority': cmp = pOrder[a.priority] - pOrder[b.priority]; break;
        case 'dueDate': cmp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(); break;
        case 'status': cmp = sOrder[a.status || 'todo'] - sOrder[b.status || 'todo']; break;
        case 'title': cmp = a.title.localeCompare(b.title); break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [tasks, filterPriority, filterStatus, filterCategory, searchQuery, sortBy, sortOrder]);

  // LOGIC LOCAL CHO SUBTASK
  const completeTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const isDone = task.completed || task.status === 'done';
    updateRecord({ id, data: { completed: !isDone, status: !isDone ? 'done' : 'todo', completedAt: !isDone ? new Date().toISOString() : null } });
  };

  const changeTaskStatus = (id: string, status: 'todo' | 'in_progress' | 'review' | 'done') => {
    const completed = status === 'done';
    updateRecord({ id, data: { status, completed, completedAt: completed ? new Date().toISOString() : null } });
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const subtasks = task.subtasks?.map(s => s.id === subtaskId ? { ...s, completed: !s.completed, status: !s.completed ? 'done' : 'todo' } : s) || [];
    const allDone = subtasks.length > 0 && subtasks.every(s => s.completed);
    const anyProg = subtasks.some(s => s.status === 'in_progress' || s.completed);
    updateRecord({ id: taskId, data: { subtasks, status: allDone ? 'done' : anyProg ? 'in_progress' : 'todo', completed: allDone, completedAt: allDone ? new Date().toISOString() : null } });
  };

  const updateSubtask = (taskId: string, subtaskId: string, data: Partial<Subtask>) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const subtasks = task.subtasks?.map(s => s.id === subtaskId ? { ...s, ...data } : s) || [];
    updateRecord({ id: taskId, data: { subtasks } });
  };

  const addSubtaskToTask = (taskId: string) => {
    if (!newSubtask.trim()) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newSub = { id: `s-${Date.now()}`, title: newSubtask, completed: false, status: 'todo' };
    updateRecord({ id: taskId, data: { subtasks: [...(task.subtasks || []), newSub] } });
    setNewSubtask('');
  };

  const deleteSubtaskCtx = (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    updateRecord({ id: taskId, data: { subtasks: task.subtasks?.filter(s => s.id !== subtaskId) || [] } });
  };

  const toggleExpand = (taskId: string) => setExpandedTasks(prev => { const next = new Set(prev); next.has(taskId) ? next.delete(taskId) : next.add(taskId); return next; });
  const expandAll = () => expandedTasks.size === filtered.length ? setExpandedTasks(new Set()) : setExpandedTasks(new Set(filtered.map(t => t.id)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validSubtasks = form.subtaskInputs.filter(s => s.trim()).map((s, i) => ({ id: `s-${Date.now()}-${i}`, title: s, completed: false, status: 'todo' }));
    addRecord({
      title: form.title, description: form.description, priority: form.priority, dueDate: form.dueDate,
      category: form.category, status: form.status, assignee: form.assignee || 'Tôi', estimatedHours: form.estimatedHours,
      createdAt: new Date().toISOString(), subtasks: validSubtasks, userId: user?.id, completed: form.status === 'done'
    });
    setForm({ title: '', description: '', priority: 'medium', dueDate: new Date().toISOString().split('T')[0], category: 'Công việc', status: 'todo', assignee: '', estimatedHours: 0, subtaskInputs: [''] });
    setShowModal(false);
  };

  const generateHeatmapData = () => {
    const todayDate = new Date();
    const weeks: { date: Date; count: number }[][] = [];
    const start = subWeeks(startOfWeek(todayDate, { weekStartsOn: 1 }), 51);
    const days = eachDayOfInterval({ start, end: todayDate });
    let currentWeek: { date: Date; count: number }[] = [];
    days.forEach((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const count = tasks.filter(t => t.completedAt && t.completedAt.split('T')[0] === dateStr).length;
      currentWeek.push({ date: day, count });
      if (getDay(day) === 0) { weeks.push(currentWeek); currentWeek = []; }
    });
    if (currentWeek.length > 0) weeks.push(currentWeek);
    return weeks;
  };

  if (isLoading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.completed || t.status === 'done').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const overdueCount = tasks.filter(t => !t.completed && t.status !== 'done' && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))).length;
  const todayCount = tasks.filter(t => isToday(new Date(t.dueDate)) && !t.completed && t.status !== 'done').length;
  const detailTaskData = detailTask ? tasks.find(t => t.id === detailTask) : null;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><ListChecks className="w-7 h-7 text-indigo-600" /> Quản lý Công việc</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowHeatmap(!showHeatmap)} className={`px-3 py-2 border rounded-lg text-sm transition-all flex items-center gap-1.5 ${showHeatmap ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30' : 'dark:border-gray-600 dark:text-gray-300'}`}>🔥 Heatmap</button>
          <div className="flex border dark:border-gray-600 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('table')} className={`px-3 py-2 text-sm flex items-center gap-1 ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'dark:text-gray-300'}`}><Table2 className="w-4 h-4" /> Bảng</button>
            <button onClick={() => setViewMode('board')} className={`px-3 py-2 text-sm flex items-center gap-1 ${viewMode === 'board' ? 'bg-indigo-600 text-white' : 'dark:text-gray-300'}`}><LayoutGrid className="w-4 h-4" /> Board</button>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"><Plus className="w-5 h-5" /> Thêm việc</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Tổng cộng', value: totalTasks, icon: <Layers className="w-5 h-5" />, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' },
          { label: 'Đang làm', value: inProgressCount, icon: <Clock className="w-5 h-5" />, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
          { label: 'Hoàn thành', value: completedCount, icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-green-600 bg-green-50 dark:bg-green-900/30' },
          { label: 'Hôm nay', value: todayCount, icon: <Calendar className="w-5 h-5" />, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },
          { label: 'Quá hạn', value: overdueCount, icon: <AlertTriangle className="w-5 h-5" />, color: 'text-red-600 bg-red-50 dark:bg-red-900/30' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-3 border dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-1"><div className={`p-1.5 rounded-lg ${stat.color}`}>{stat.icon}</div></div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* View Table (Thu gọn code hiển thị cho gọn - Vẫn giữ nguyên logic cũ) */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
              <tr>
                <th className="w-10 px-3 py-3"></th><th className="w-10 px-2 py-3"></th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Công việc</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ưu tiên</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tiến độ</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Hạn chót</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {filtered.map(task => {
                const isExpanded = expandedTasks.has(task.id);
                const subs = task.subtasks || [];
                const progress = subs.length > 0 ? Math.round((subs.filter(s => s.completed).length / subs.length) * 100) : (task.completed ? 100 : 0);
                const pc = priorityConfig[task.priority];
                const isDone = task.completed || task.status === 'done';

                return (
                  <tr key={task.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${isDone ? 'opacity-60' : ''}`}>
                    <td className="px-3 py-3">{subs.length > 0 && <button onClick={() => toggleExpand(task.id)}><ChevronDown className="w-4 h-4 text-gray-500" /></button>}</td>
                    <td className="px-2 py-3"><button onClick={() => completeTask(task.id)}>{isDone ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-gray-300" />}</button></td>
                    <td className="px-3 py-3"><span className={`text-sm font-medium dark:text-white ${isDone ? 'line-through' : ''}`}>{task.title}</span></td>
                    <td className="px-3 py-3"><select value={task.status || 'todo'} onChange={e => changeTaskStatus(task.id, e.target.value as 'todo')} className={`px-2 py-1 rounded-lg text-xs font-medium ${statusConfig[task.status || 'todo'].color}`}><option value="todo">📋 Chờ làm</option><option value="in_progress">🔄 Đang làm</option><option value="done">✅ Hoàn thành</option></select></td>
                    <td className="px-3 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${pc.color}`}>{pc.label}</span></td>
                    <td className="px-3 py-3"><div className="w-[80px] bg-gray-200 rounded-full h-2"><div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${progress}%` }} /></div></td>
                    <td className="px-3 py-3"><span className="text-xs font-medium dark:text-gray-300">{format(new Date(task.dueDate), 'dd/MM/yyyy')}</span></td>
                    <td className="px-3 py-3 text-center">
                      <button onClick={() => setDetailTask(task.id)} className="p-1 text-blue-500"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => deleteRecord(task.id)} className="p-1 text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Board View Shortcut (giữ nguyên logic gốc) */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(Object.entries(statusConfig)).map(([key, val]) => (
            <div key={key} className="bg-gray-50 dark:bg-gray-900/30 p-3 rounded-xl border dark:border-gray-700">
              <h3 className="font-semibold text-sm mb-3 dark:text-white flex gap-2">{val.icon} {val.label}</h3>
              <div className="space-y-2">
                {filtered.filter(t => (t.status || 'todo') === key).map(task => (
                  <div key={task.id} onClick={() => setDetailTask(task.id)} className={`bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-700 cursor-pointer border-l-3 ${priorityConfig[task.priority].border}`}>
                    <h4 className="font-medium text-sm dark:text-white">{task.title}</h4>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tạo Task Mới Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-4">
            <div className="flex justify-between mb-4"><h2 className="text-lg font-bold dark:text-white">Thêm công việc</h2><button onClick={() => setShowModal(false)}><X /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" required placeholder="Tiêu đề *" />
              <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" required />
              <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold">Tạo công việc</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

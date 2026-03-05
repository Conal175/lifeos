import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Plus, Trash2, X, CheckCircle2, Circle, ChevronDown, ChevronRight,
  Flag, Calendar, Search, Filter, LayoutGrid, Table2, Clock,
  AlertTriangle, Users, Tag, ListChecks,
  ArrowUpDown, Eye, Layers
} from 'lucide-react';
import { format, subWeeks, eachDayOfInterval, startOfWeek, getDay, differenceInDays, isPast, isToday } from 'date-fns';
import { vi } from 'date-fns/locale';

const priorityConfig = {
  low: { label: 'Thấp', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', dot: 'bg-blue-500', border: 'border-l-blue-500' },
  medium: { label: 'Trung bình', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300', dot: 'bg-yellow-500', border: 'border-l-yellow-500' },
  high: { label: 'Cao', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', dot: 'bg-orange-500', border: 'border-l-orange-500' },
  urgent: { label: 'Khẩn cấp', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', dot: 'bg-red-500', border: 'border-l-red-500' },
};

const statusConfig = {
  todo: { label: 'Chờ làm', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', icon: '📋' },
  in_progress: { label: 'Đang làm', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', icon: '🔄' },
  review: { label: 'Đang review', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', icon: '👁️' },
  done: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', icon: '✅' },
};

const categoryColors: Record<string, string> = {
  'Công việc': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  'Học tập': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'Sức khỏe': 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'Cá nhân': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'Khác': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export function Tasks() {
  const { tasks, addTask, deleteTask, completeTask, updateTask, toggleSubtask, updateSubtask, addSubtask, deleteSubtask: deleteSubtaskCtx } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'status' | 'title'>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [detailTask, setDetailTask] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    dueDate: new Date().toISOString().split('T')[0],
    category: 'Công việc',
    status: 'todo' as 'todo' | 'in_progress' | 'review' | 'done',
    assignee: '',
    estimatedHours: 0,
    subtaskInputs: [''] as string[],
  });

  const categories = useMemo(() => {
    const cats = new Set(tasks.map(t => t.category || 'Khác'));
    return Array.from(cats);
  }, [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (filterCategory !== 'all' && (t.category || 'Khác') !== filterCategory) return false;
      if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) && !t.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
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

  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
      return next;
    });
  };

  const expandAll = () => {
    if (expandedTasks.size === filtered.length) {
      setExpandedTasks(new Set());
    } else {
      setExpandedTasks(new Set(filtered.map(t => t.id)));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validSubtasks = form.subtaskInputs.filter(s => s.trim());
    addTask({
      title: form.title,
      description: form.description,
      priority: form.priority,
      dueDate: form.dueDate,
      category: form.category,
      status: form.status,
      assignee: form.assignee || 'Tôi',
      estimatedHours: form.estimatedHours,
      createdAt: new Date().toISOString(),
    });
    // Add subtasks after task creation
    if (validSubtasks.length > 0) {
      setTimeout(() => {
        const latestTask = tasks[tasks.length]; // Will be set via state
        if (latestTask) {
          updateTask(latestTask.id, {
            subtasks: validSubtasks.map((s, i) => ({
              id: `s-${Date.now()}-${i}`,
              title: s,
              completed: false,
              status: 'todo' as const,
            })),
          });
        }
      }, 100);
    }
    setForm({ title: '', description: '', priority: 'medium', dueDate: new Date().toISOString().split('T')[0], category: 'Công việc', status: 'todo', assignee: '', estimatedHours: 0, subtaskInputs: [''] });
    setShowModal(false);
  };

  const addSubtaskToTask = (taskId: string) => {
    if (!newSubtask.trim()) return;
    addSubtask(taskId, {
      title: newSubtask,
      status: 'todo'
    });
    setNewSubtask('');
  };

  

  const changeTaskStatus = (taskId: string, status: 'todo' | 'in_progress' | 'review' | 'done') => {
    const completed = status === 'done';
    updateTask(taskId, {
      status,
      completed,
      completedAt: completed ? new Date().toISOString() : undefined,
    });
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Heatmap data
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

  const heatmapWeeks = showHeatmap ? generateHeatmapData() : [];
  const getHeatColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-700';
    if (count === 1) return 'bg-green-200 dark:bg-green-900';
    if (count === 2) return 'bg-green-400 dark:bg-green-700';
    return 'bg-green-600 dark:bg-green-500';
  };

  // Stats
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ListChecks className="w-7 h-7 text-indigo-600" />
            Quản lý Công việc
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Theo dõi và quản lý tất cả công việc của bạn
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-3 py-2 border rounded-lg text-sm transition-all flex items-center gap-1.5 ${showHeatmap ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400' : 'dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300'}`}>
            🔥 Heatmap
          </button>
          <div className="flex border dark:border-gray-600 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm flex items-center gap-1 ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <Table2 className="w-4 h-4" /> Bảng
            </button>
            <button onClick={() => setViewMode('board')}
              className={`px-3 py-2 text-sm flex items-center gap-1 ${viewMode === 'board' ? 'bg-indigo-600 text-white' : 'dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <LayoutGrid className="w-4 h-4" /> Board
            </button>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm">
            <Plus className="w-5 h-5" /> Thêm việc
          </button>
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
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 border dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-lg ${stat.color}`}>{stat.icon}</div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      {showHeatmap && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700 animate-fadeIn">
          <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">🔥 Năng suất 52 tuần gần nhất</h3>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-[3px] min-w-[700px]">
              {heatmapWeeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day, di) => (
                    <div key={di} className={`w-3 h-3 rounded-sm ${getHeatColor(day.count)} cursor-pointer hover:ring-1 hover:ring-gray-400`}
                      title={`${format(day.date, 'dd/MM/yyyy')}: ${day.count} task hoàn thành`} />
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
              <span>Ít</span>
              {[0, 1, 2, 3].map(n => <div key={n} className={`w-3 h-3 rounded-sm ${getHeatColor(n)}`} />)}
              <span>Nhiều</span>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-3 md:p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm công việc..."
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-all ${showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-400' : 'dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <Filter className="w-4 h-4" /> Bộ lọc
            {(filterPriority !== 'all' || filterStatus !== 'all' || filterCategory !== 'all') && (
              <span className="w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
          <button onClick={expandAll}
            className="flex items-center gap-2 px-4 py-2 border dark:border-gray-600 rounded-lg text-sm dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            {expandedTasks.size === filtered.length ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            {expandedTasks.size === filtered.length ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t dark:border-gray-700 animate-fadeIn">
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
              className="px-3 py-2 border dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white">
              <option value="all">🎯 Tất cả ưu tiên</option>
              <option value="urgent">🔴 Khẩn cấp</option>
              <option value="high">🟠 Cao</option>
              <option value="medium">🟡 Trung bình</option>
              <option value="low">🔵 Thấp</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 border dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white">
              <option value="all">📊 Tất cả trạng thái</option>
              <option value="todo">📋 Chờ làm</option>
              <option value="in_progress">🔄 Đang làm</option>
              <option value="review">👁️ Đang review</option>
              <option value="done">✅ Hoàn thành</option>
            </select>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="px-3 py-2 border dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white">
              <option value="all">📂 Tất cả danh mục</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {(filterPriority !== 'all' || filterStatus !== 'all' || filterCategory !== 'all') && (
              <button onClick={() => { setFilterPriority('all'); setFilterStatus('all'); setFilterCategory('all'); }}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                ✕ Xóa bộ lọc
              </button>
            )}
          </div>
        )}
      </div>

      {/* View: Table */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
          {/* Table Header */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                  <th className="w-10 px-3 py-3"></th>
                  <th className="w-10 px-2 py-3">
                    <div className="flex items-center justify-center">
                      <Circle className="w-4 h-4 text-gray-400" />
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left">
                    <button onClick={() => handleSort('title')} className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200">
                      Công việc <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-3 py-3 text-left">
                    <button onClick={() => handleSort('status')} className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200">
                      Trạng thái <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-3 py-3 text-left">
                    <button onClick={() => handleSort('priority')} className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200">
                      Ưu tiên <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-3 py-3 text-left">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Danh mục</span>
                  </th>
                  <th className="px-3 py-3 text-center">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tiến độ</span>
                  </th>
                  <th className="px-3 py-3 text-left">
                    <button onClick={() => handleSort('dueDate')} className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200">
                      Hạn chót <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-3 py-3 text-center">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <ListChecks className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                        <p className="text-lg font-medium">Không có công việc nào</p>
                        <p className="text-sm">Hãy tạo công việc mới để bắt đầu!</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(task => {
                  const isExpanded = expandedTasks.has(task.id);
                  const completedSubs = task.subtasks.filter(s => s.completed).length;
                  const totalSubs = task.subtasks.length;
                  const progress = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : (task.completed || task.status === 'done') ? 100 : 0;
                  const isOverdue = !task.completed && task.status !== 'done' && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
                  const isDueToday = isToday(new Date(task.dueDate));
                  const daysLeft = differenceInDays(new Date(task.dueDate), new Date());
                  const pc = priorityConfig[task.priority];
                  const sc = statusConfig[task.status || 'todo'];
                  const isDone = task.completed || task.status === 'done';

                  return (
                    <>
                      {/* Main Task Row */}
                      <tr key={task.id} className={`group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isDone ? 'bg-gray-50/50 dark:bg-gray-800/50' : ''} ${isOverdue ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                        {/* Expand Toggle */}
                        <td className="px-3 py-3">
                          {totalSubs > 0 ? (
                            <button onClick={() => toggleExpand(task.id)}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors">
                              {isExpanded
                                ? <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                : <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                            </button>
                          ) : <span className="w-6 h-6 block" />}
                        </td>

                        {/* Checkbox */}
                        <td className="px-2 py-3">
                          <button onClick={() => completeTask(task.id)} className="flex items-center justify-center">
                            {isDone
                              ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                              : <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors" />}
                          </button>
                        </td>

                        {/* Title & Description */}
                        <td className="px-3 py-3 max-w-xs">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium text-sm ${isDone ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                                {task.title}
                              </span>
                              {isOverdue && (
                                <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 rounded text-[10px] font-semibold">
                                  <AlertTriangle className="w-3 h-3" /> QUÁ HẠN
                                </span>
                              )}
                            </div>
                            {task.description && (
                              <p className={`text-xs mt-0.5 ${isDone ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'} truncate max-w-[280px]`}>
                                {task.description}
                              </p>
                            )}
                            {task.assignee && (
                              <div className="flex items-center gap-1 mt-1">
                                <Users className="w-3 h-3 text-gray-400" />
                                <span className="text-[11px] text-gray-400 dark:text-gray-500">{task.assignee}</span>
                                {task.estimatedHours ? (
                                  <>
                                    <span className="text-gray-300 dark:text-gray-600 mx-1">·</span>
                                    <Clock className="w-3 h-3 text-gray-400" />
                                    <span className="text-[11px] text-gray-400 dark:text-gray-500">{task.estimatedHours}h</span>
                                  </>
                                ) : null}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3">
                          <select
                            value={task.status || 'todo'}
                            onChange={e => changeTaskStatus(task.id, e.target.value as 'todo' | 'in_progress' | 'review' | 'done')}
                            className={`px-2 py-1 rounded-lg text-xs font-medium border-0 cursor-pointer ${sc.color}`}
                          >
                            {Object.entries(statusConfig).map(([key, val]) => (
                              <option key={key} value={key}>{val.icon} {val.label}</option>
                            ))}
                          </select>
                        </td>

                        {/* Priority */}
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${pc.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`}></span>
                            {pc.label}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="px-3 py-3">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${categoryColors[task.category || 'Khác'] || categoryColors['Khác']}`}>
                            {task.category || 'Khác'}
                          </span>
                        </td>

                        {/* Progress */}
                        <td className="px-3 py-3">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-full max-w-[80px] bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : progress >= 50 ? 'bg-indigo-500' : progress > 0 ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                              {totalSubs > 0 ? `${completedSubs}/${totalSubs}` : `${progress}%`}
                            </span>
                          </div>
                        </td>

                        {/* Due Date */}
                        <td className="px-3 py-3">
                          <div className="flex flex-col">
                            <span className={`text-xs font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : isDueToday ? 'text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'}`}>
                              {format(new Date(task.dueDate), 'dd/MM/yyyy')}
                            </span>
                            <span className={`text-[11px] ${isOverdue ? 'text-red-500' : isDueToday ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>
                              {isDone ? '✓ Hoàn thành' : isOverdue ? `Quá hạn ${Math.abs(daysLeft)} ngày` : isDueToday ? 'Hôm nay' : daysLeft === 1 ? 'Ngày mai' : `Còn ${daysLeft} ngày`}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setDetailTask(task.id)} className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Xem chi tiết">
                              <Eye className="w-4 h-4 text-blue-500" />
                            </button>
                            <button onClick={() => deleteTask(task.id)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Xóa">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Subtask Rows */}
                      {isExpanded && task.subtasks.map((sub, si) => {
                        const subStatusConfig: Record<string, { label: string; color: string }> = {
                          todo: { label: 'Chờ làm', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
                          in_progress: { label: 'Đang làm', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
                          done: { label: 'Xong', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
                        };
                        const subSc = subStatusConfig[sub.status || 'todo'];
                        return (
                        <tr key={sub.id} className={`bg-gray-50/70 dark:bg-gray-900/30 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors animate-fadeIn`}>
                          <td className="px-3 py-2">
                            <div className="flex justify-center">
                              <div className={`w-px h-full min-h-[20px] ${si === task.subtasks.length - 1 ? '' : ''} bg-gray-300 dark:bg-gray-600`}></div>
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            <button onClick={() => toggleSubtask(task.id, sub.id)} className="flex items-center justify-center">
                              {sub.completed
                                ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                                : <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600 hover:text-indigo-400 transition-colors" />}
                            </button>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2 pl-2">
                              <div className="w-4 border-b-2 border-l-2 border-gray-300 dark:border-gray-600 h-3 rounded-bl -mt-2"></div>
                              <span className={`text-sm ${sub.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                {sub.title}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={sub.status || 'todo'}
                              onChange={e => {
                                const newStatus = e.target.value as 'todo' | 'in_progress' | 'done';
                                updateSubtask(task.id, sub.id, { 
                                  status: newStatus, 
                                  completed: newStatus === 'done' 
                                });
                              }}
                              className={`px-1.5 py-0.5 rounded text-[11px] font-medium border-0 cursor-pointer ${subSc.color}`}
                            >
                              <option value="todo">📋 Chờ làm</option>
                              <option value="in_progress">🔄 Đang làm</option>
                              <option value="done">✅ Xong</option>
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            {sub.assignee && (
                              <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                <Users className="w-3 h-3" /> {sub.assignee}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {sub.estimatedHours && (
                              <span className="text-[11px] text-gray-400">⏱️ {sub.estimatedHours}h</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-center">
                              {sub.completed
                                ? <span className="text-[11px] text-green-500 font-medium">✓ Xong</span>
                                : sub.status === 'in_progress' 
                                  ? <span className="text-[11px] text-blue-500 font-medium">🔄 Đang làm</span>
                                  : <span className="text-[11px] text-gray-400">Chưa xong</span>}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="date"
                                value={sub.dueDate || ''}
                                onChange={e => updateSubtask(task.id, sub.id, { dueDate: e.target.value || undefined })}
                                className="px-1.5 py-0.5 text-[11px] border dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-gray-300 w-[110px] cursor-pointer hover:border-indigo-400 focus:ring-1 focus:ring-indigo-500 transition-all"
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => deleteSubtaskCtx(task.id, sub.id)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors">
                                <Trash2 className="w-3 h-3 text-red-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );})}

                      {/* Add Subtask Row */}
                      {isExpanded && (
                        <tr className="bg-gray-50/70 dark:bg-gray-900/30 animate-fadeIn">
                          <td className="px-3 py-2"></td>
                          <td className="px-2 py-2"></td>
                          <td className="px-3 py-2" colSpan={6}>
                            <div className="flex items-center gap-2 pl-8">
                              <Plus className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <input
                                type="text"
                                value={editingTask === task.id ? newSubtask : ''}
                                onFocus={() => setEditingTask(task.id)}
                                onChange={e => { setEditingTask(task.id); setNewSubtask(e.target.value); }}
                                onKeyDown={e => { if (e.key === 'Enter') { addSubtaskToTask(task.id); } }}
                                placeholder="Thêm bước mới... (Enter để thêm)"
                                className="flex-1 max-w-md px-3 py-1.5 text-sm border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                              />
                              {editingTask === task.id && newSubtask.trim() && (
                                <button onClick={() => addSubtaskToTask(task.id)}
                                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700 transition-colors">
                                  Thêm
                                </button>
                              )}
                            </div>
                          </td>
                          <td></td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-4 py-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>Hiển thị {filtered.length} / {totalTasks} công việc</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> {completedCount} xong</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> {inProgressCount} đang làm</span>
              {overdueCount > 0 && <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> {overdueCount} quá hạn</span>}
            </div>
          </div>
        </div>
      )}

      {/* View: Board */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {(Object.entries(statusConfig) as [string, typeof statusConfig[keyof typeof statusConfig]][]).map(([statusKey, statusVal]) => {
            const statusTasks = filtered.filter(t => (t.status || 'todo') === statusKey);
            return (
              <div key={statusKey} className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-3 border dark:border-gray-700 min-h-[200px]">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span>{statusVal.icon}</span> {statusVal.label}
                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-xs">{statusTasks.length}</span>
                  </h3>
                </div>
                <div className="space-y-2">
                  {statusTasks.map(task => {
                    const completedSubs = task.subtasks.filter(s => s.completed).length;
                    const totalSubs = task.subtasks.length;
                    const progress = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0;
                    const isOverdue = !task.completed && task.status !== 'done' && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
                    const pc = priorityConfig[task.priority];

                    return (
                      <div key={task.id}
                        onClick={() => setDetailTask(task.id)}
                        className={`bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border dark:border-gray-700 cursor-pointer hover:shadow-md transition-all border-l-3 ${pc.border}`}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-medium text-sm text-gray-900 dark:text-white leading-tight">{task.title}</h4>
                          <span className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${pc.dot}`}></span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${categoryColors[task.category || 'Khác'] || categoryColors['Khác']}`}>
                            {task.category || 'Khác'}
                          </span>
                          {isOverdue && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 rounded text-[10px] font-semibold">
                              Quá hạn
                            </span>
                          )}
                        </div>
                        {totalSubs > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                              <span>{completedSubs}/{totalSubs} bước</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t dark:border-gray-700">
                          <span className={`text-[11px] flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                            <Calendar className="w-3 h-3" />
                            {format(new Date(task.dueDate), 'dd/MM')}
                          </span>
                          {task.assignee && (
                            <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                              <Users className="w-3 h-3" /> {task.assignee}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {statusTasks.length === 0 && (
                    <div className="text-center py-8 text-xs text-gray-400 dark:text-gray-500">
                      Chưa có công việc nào
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Slide Panel */}
      {detailTaskData && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setDetailTask(null)}>
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg shadow-2xl overflow-y-auto animate-slideInRight" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Chi tiết công việc</h2>
              <button onClick={() => setDetailTask(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-5">
              {/* Title */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{detailTaskData.title}</h3>
                {detailTaskData.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{detailTaskData.description}</p>
                )}
              </div>

              {/* Meta Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Trạng thái</div>
                  <select value={detailTaskData.status || 'todo'}
                    onChange={e => changeTaskStatus(detailTaskData.id, e.target.value as 'todo' | 'in_progress' | 'review' | 'done')}
                    className={`w-full px-2 py-1 rounded text-sm font-medium border-0 ${statusConfig[detailTaskData.status || 'todo'].color}`}>
                    {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </select>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ưu tiên</div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${priorityConfig[detailTaskData.priority].color}`}>
                    <Flag className="w-3 h-3" /> {priorityConfig[detailTaskData.priority].label}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Danh mục</div>
                  <span className={`inline-flex px-2 py-1 rounded text-sm font-medium ${categoryColors[detailTaskData.category || 'Khác'] || categoryColors['Khác']}`}>
                    <Tag className="w-3 h-3 mr-1 mt-0.5" /> {detailTaskData.category || 'Khác'}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hạn chót</div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {format(new Date(detailTaskData.dueDate), 'dd/MM/yyyy', { locale: vi })}
                    </span>
                  </div>
                </div>
                {detailTaskData.assignee && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Người thực hiện</div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{detailTaskData.assignee}</span>
                    </div>
                  </div>
                )}
                {detailTaskData.estimatedHours ? (
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ước tính</div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{detailTaskData.estimatedHours} giờ</span>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Progress */}
              {detailTaskData.subtasks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Tiến độ tổng thể</span>
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {Math.round((detailTaskData.subtasks.filter(s => s.completed).length / detailTaskData.subtasks.length) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(detailTaskData.subtasks.filter(s => s.completed).length / detailTaskData.subtasks.length) * 100}%` }} />
                  </div>
                </div>
              )}

              {/* Subtasks List */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-indigo-600" />
                  Danh sách bước ({detailTaskData.subtasks.filter(s => s.completed).length}/{detailTaskData.subtasks.length})
                </h4>
                <div className="space-y-2">
                  {detailTaskData.subtasks.map((sub, idx) => {
                    const subStatusColors: Record<string, string> = {
                      todo: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
                      in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
                      done: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
                    };
                    return (
                    <div key={sub.id} className={`p-3 rounded-lg transition-all border ${sub.completed ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900' : 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}>
                      <div className="flex items-start gap-3">
                        <button onClick={() => toggleSubtask(detailTaskData.id, sub.id)} className="flex-shrink-0 mt-0.5">
                          {sub.completed
                            ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                            : <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600 hover:text-indigo-500 transition-colors" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm font-medium ${sub.completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                              {idx + 1}. {sub.title}
                            </span>
                            <button onClick={() => deleteSubtaskCtx(detailTaskData.id, sub.id)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded">
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <select
                              value={sub.status || 'todo'}
                              onChange={e => {
                                const newStatus = e.target.value as 'todo' | 'in_progress' | 'done';
                                updateSubtask(detailTaskData.id, sub.id, { 
                                  status: newStatus, 
                                  completed: newStatus === 'done' 
                                });
                              }}
                              className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${subStatusColors[sub.status || 'todo']}`}
                            >
                              <option value="todo">📋 Chờ làm</option>
                              <option value="in_progress">🔄 Đang làm</option>
                              <option value="done">✅ Hoàn thành</option>
                            </select>
                            {sub.assignee && (
                              <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-0.5 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                <Users className="w-3 h-3" /> {sub.assignee}
                              </span>
                            )}
                            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                              <Calendar className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                              <input
                                type="date"
                                value={sub.dueDate || ''}
                                onChange={e => updateSubtask(detailTaskData.id, sub.id, { dueDate: e.target.value || undefined })}
                                className="text-[11px] bg-transparent border-0 text-gray-600 dark:text-gray-300 w-[100px] cursor-pointer focus:outline-none"
                                title="Ngày hoàn thành"
                              />
                            </div>
                            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                              <Clock className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={sub.estimatedHours || ''}
                                onChange={e => updateSubtask(detailTaskData.id, sub.id, { estimatedHours: e.target.value ? Number(e.target.value) : undefined })}
                                placeholder="0"
                                className="text-[11px] bg-transparent border-0 text-gray-600 dark:text-gray-300 w-[40px] cursor-pointer focus:outline-none"
                                title="Giờ ước tính"
                              />
                              <span className="text-[11px] text-gray-500">h</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );})}
                </div>
                {/* Add Subtask */}
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">➕ Thêm bước mới</div>
                  <div className="space-y-2">
                    <input type="text"
                      value={editingTask === detailTaskData.id ? newSubtask : ''}
                      onFocus={() => setEditingTask(detailTaskData.id)}
                      onChange={e => { setEditingTask(detailTaskData.id); setNewSubtask(e.target.value); }}
                      onKeyDown={e => { if (e.key === 'Enter' && newSubtask.trim()) addSubtaskToTask(detailTaskData.id); }}
                      placeholder="Tên bước thực hiện..."
                      className="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500" />
                    <div className="flex gap-2">
                      <button onClick={() => addSubtaskToTask(detailTaskData.id)}
                        disabled={!newSubtask.trim()}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
                        <Plus className="w-4 h-4" /> Thêm bước
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="border-t dark:border-gray-700 pt-3 text-xs text-gray-400 dark:text-gray-500 space-y-1">
                {detailTaskData.createdAt && <p>Tạo lúc: {format(new Date(detailTaskData.createdAt), 'HH:mm dd/MM/yyyy', { locale: vi })}</p>}
                {detailTaskData.completedAt && <p>Hoàn thành: {format(new Date(detailTaskData.completedAt), 'HH:mm dd/MM/yyyy', { locale: vi })}</p>}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => { completeTask(detailTaskData.id); setDetailTask(null); }}
                  className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors ${detailTaskData.completed ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                  {detailTaskData.completed ? '↩️ Mở lại' : '✅ Đánh dấu hoàn thành'}
                </button>
                <button onClick={() => { deleteTask(detailTaskData.id); setDetailTask(null); }}
                  className="px-4 py-2.5 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg font-medium text-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeIn shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex justify-between items-center z-10 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" /> Thêm công việc mới
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tiêu đề *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all" required placeholder="Nhập tiêu đề công việc..." />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none focus:ring-2 focus:ring-indigo-500 transition-all" rows={3} placeholder="Mô tả chi tiết công việc..." />
              </div>

              {/* Category & Status Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Danh mục</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                    <option value="Công việc">💼 Công việc</option>
                    <option value="Học tập">📚 Học tập</option>
                    <option value="Sức khỏe">💪 Sức khỏe</option>
                    <option value="Cá nhân">🏠 Cá nhân</option>
                    <option value="Khác">📌 Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as typeof form.status })}
                    className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                    <option value="todo">📋 Chờ làm</option>
                    <option value="in_progress">🔄 Đang làm</option>
                    <option value="review">👁️ Đang review</option>
                  </select>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mức ưu tiên</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(priorityConfig) as Array<keyof typeof priorityConfig>).map(p => (
                    <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })}
                      className={`py-2.5 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-1 ${form.priority === p ? priorityConfig[p].color + ' ring-2 ring-offset-1 ring-indigo-300 dark:ring-offset-gray-800 shadow-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                      <span className={`w-2 h-2 rounded-full ${priorityConfig[p].dot}`}></span>
                      {priorityConfig[p].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date & Estimated Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hạn chót *</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ước tính (giờ)</label>
                  <input type="number" min={0} step={0.5} value={form.estimatedHours || ''} onChange={e => setForm({ ...form, estimatedHours: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" placeholder="VD: 4" />
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Người thực hiện</label>
                <input type="text" value={form.assignee} onChange={e => setForm({ ...form, assignee: e.target.value })}
                  className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" placeholder="VD: Tôi" />
              </div>

              {/* Subtasks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Các bước thực hiện</label>
                <div className="space-y-2">
                  {form.subtaskInputs.map((sub, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-5 text-center">{idx + 1}.</span>
                      <input type="text" value={sub} onChange={e => {
                        const newSubs = [...form.subtaskInputs];
                        newSubs[idx] = e.target.value;
                        setForm({ ...form, subtaskInputs: newSubs });
                      }}
                        className="flex-1 px-3 py-2 text-sm border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        placeholder={`Bước ${idx + 1}...`} />
                      {form.subtaskInputs.length > 1 && (
                        <button type="button" onClick={() => {
                          const newSubs = form.subtaskInputs.filter((_, i) => i !== idx);
                          setForm({ ...form, subtaskInputs: newSubs });
                        }} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded">
                          <X className="w-4 h-4 text-red-400" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setForm({ ...form, subtaskInputs: [...form.subtaskInputs, ''] })}
                    className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-1">
                    <Plus className="w-4 h-4" /> Thêm bước
                  </button>
                </div>
              </div>

              <button type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-colors shadow-sm">
                ✅ Tạo công việc
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .border-l-3 { border-left-width: 3px; }
      `}</style>
    </div>
  );
}

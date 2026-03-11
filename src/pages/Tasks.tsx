import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTableData } from '../hooks/useData';
import { Task, Subtask } from '../types';
import { Plus, Trash2, X, CheckCircle2, Circle, ChevronDown, ChevronRight, Flag, Calendar, Search, Filter, LayoutGrid, Table2, Clock, AlertTriangle, Users, Tag, ListChecks, ArrowUpDown, Eye, Layers, Edit2 } from 'lucide-react';
import { format, subWeeks, eachDayOfInterval, startOfWeek, getDay, differenceInDays, isPast, isToday } from 'date-fns';
import { vi } from 'date-fns/locale';

const priorityConfig = { low: { label: 'Thấp', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', dot: 'bg-blue-500', border: 'border-l-blue-500' }, medium: { label: 'Trung bình', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300', dot: 'bg-yellow-500', border: 'border-l-yellow-500' }, high: { label: 'Cao', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', dot: 'bg-orange-500', border: 'border-l-orange-500' }, urgent: { label: 'Khẩn cấp', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', dot: 'bg-red-500', border: 'border-l-red-500' } };
const statusConfig = { todo: { label: 'Chờ làm', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', icon: '📋' }, in_progress: { label: 'Đang làm', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', icon: '🔄' }, review: { label: 'Đang review', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', icon: '👁️' }, done: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', icon: '✅' } };
const categoryColors: Record<string, string> = { 'Công việc': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300', 'Học tập': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', 'Sức khỏe': 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300', 'Cá nhân': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', 'Khác': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' };

export function Tasks() {
  const { user } = useApp();
  const { data: tasks = [], isLoading, addRecord, updateRecord, deleteRecord } = useTableData<Task>('tasks');
  
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

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [form, setForm] = useState({ 
    title: '', description: '', priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent', 
    dueDate: new Date().toISOString().split('T')[0], category: 'Công việc', 
    status: 'todo' as 'todo' | 'in_progress' | 'review' | 'done', assignee: '', estimatedHours: 0, subtaskInputs: [''] 
  });

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
    const newSub = { id: `s-${Date.now()}`, title: newSubtask, completed: false, status: 'todo' as const };
    updateRecord({ id: taskId, data: { subtasks: [...(task.subtasks || []), newSub] } });
    setNewSubtask('');
  };

  const deleteSubtaskCtx = (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    updateRecord({ id: taskId, data: { subtasks: task.subtasks?.filter(s => s.id !== subtaskId) || [] } });
  };

  const toggleExpand = (taskId: string) => setExpandedTasks(prev => { const next = new Set(prev); next.has(taskId) ? next.delete(taskId) : next.add(taskId); return next; });

  const closeModal = () => {
    setForm({ title: '', description: '', priority: 'medium', dueDate: new Date().toISOString().split('T')[0], category: 'Công việc', status: 'todo', assignee: '', estimatedHours: 0, subtaskInputs: [''] });
    setEditingTaskId(null);
    setShowModal(false);
  };

  const openEditModal = (task: Task) => {
    setForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : new Date().toISOString().split('T')[0],
      category: task.category || 'Công việc',
      status: task.status || 'todo',
      assignee: task.assignee || '',
      estimatedHours: task.estimatedHours || 0,
      subtaskInputs: ['']
    });
    setEditingTaskId(task.id);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validSubtasks = form.subtaskInputs.filter(s => s.trim()).map((s, i) => ({ id: `s-${Date.now()}-${i}`, title: s, completed: false, status: 'todo' as const }));
    
    const taskData = {
      title: form.title, 
      description: form.description, 
      priority: form.priority, 
      dueDate: form.dueDate,
      category: form.category, 
      status: form.status, 
      assignee: form.assignee, 
      estimatedHours: form.estimatedHours,
      completed: form.status === 'done',
    };

    if (editingTaskId) {
      const existingTask = tasks.find(t => t.id === editingTaskId);
      const updatedSubtasks = existingTask?.subtasks ? [...existingTask.subtasks, ...validSubtasks] : validSubtasks;
      updateRecord({ 
        id: editingTaskId, 
        data: { 
          ...taskData, 
          subtasks: updatedSubtasks,
          completedAt: form.status === 'done' && existingTask?.status !== 'done' ? new Date().toISOString() : existingTask?.completedAt
        } 
      });
    } else {
      addRecord({ 
        ...taskData, 
        createdAt: new Date().toISOString(), 
        subtasks: validSubtasks, 
        userId: user?.id,
        completedAt: form.status === 'done' ? new Date().toISOString() : null
      });
    }
    closeModal();
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
          <button onClick={() => { setEditingTaskId(null); setShowModal(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"><Plus className="w-5 h-5" /> Thêm việc</button>
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

      {/* View Table KHÔI PHỤC SUBTASK VÀ MỞ RỘNG */}
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
                  <React.Fragment key={task.id}>
                    <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${isDone ? 'opacity-60' : ''}`}>
                      <td className="px-3 py-3">{subs.length > 0 && <button onClick={() => toggleExpand(task.id)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">{isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}</button>}</td>
                      <td className="px-2 py-3"><button onClick={() => completeTask(task.id)}>{isDone ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-gray-300 hover:text-indigo-400" />}</button></td>
                      <td className="px-3 py-3"><span className={`text-sm font-medium dark:text-white ${isDone ? 'line-through' : ''}`}>{task.title}</span></td>
                      <td className="px-3 py-3"><select value={task.status || 'todo'} onChange={e => changeTaskStatus(task.id, e.target.value as any)} className={`px-2 py-1 rounded-lg text-xs font-medium border-0 cursor-pointer ${statusConfig[task.status || 'todo'].color}`}><option value="todo">📋 Chờ làm</option><option value="in_progress">🔄 Đang làm</option><option value="review">👁️ Đang review</option><option value="done">✅ Hoàn thành</option></select></td>
                      <td className="px-3 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-medium flex w-fit items-center gap-1 ${pc.color}`}><span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`}></span>{pc.label}</span></td>
                      <td className="px-3 py-3"><div className="w-[80px] bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden"><div className={`h-2 rounded-full transition-all ${progress === 100 ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${progress}%` }} /></div></td>
                      <td className="px-3 py-3"><span className="text-xs font-medium dark:text-gray-300">{format(new Date(task.dueDate), 'dd/MM/yyyy')}</span></td>
                      <td className="px-3 py-3 text-center flex items-center justify-center gap-1">
                        <button onClick={() => setDetailTask(task.id)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Xem chi tiết"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openEditModal(task)} className="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors" title="Sửa"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => deleteRecord(task.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Xóa"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                    
                    {/* Render Subtasks */}
                    {isExpanded && subs.map(sub => (
                      <tr key={sub.id} className="bg-gray-50/70 dark:bg-gray-900/30 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors">
                        <td className="px-3 py-2 text-center border-r dark:border-gray-700"><div className="w-0.5 h-full bg-gray-300 dark:bg-gray-600 mx-auto"></div></td>
                        <td className="px-2 py-2 text-center">
                          <button onClick={() => toggleSubtask(task.id, sub.id)}>
                            {sub.completed ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-gray-400 hover:text-indigo-500" />}
                          </button>
                        </td>
                        <td className="px-3 py-2" colSpan={5}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 border-b-2 border-l-2 border-gray-300 dark:border-gray-600 h-3 rounded-bl -mt-2"></div>
                            <span className={`text-sm ${sub.completed ? 'line-through text-gray-400' : 'dark:text-gray-300'}`}>{sub.title}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button onClick={() => deleteSubtaskCtx(task.id, sub.id)} className="p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                        </td>
                      </tr>
                    ))}

                    {/* Thêm Subtask Nhanh */}
                    {isExpanded && (
                      <tr className="bg-gray-50/70 dark:bg-gray-900/30">
                        <td className="px-3 py-2 border-r dark:border-gray-700"><div className="w-0.5 h-full bg-gray-300 dark:bg-gray-600 mx-auto"></div></td>
                        <td></td>
                        <td className="px-3 py-2" colSpan={6}>
                          <div className="flex items-center gap-2 max-w-sm pl-4">
                            <Plus className="w-4 h-4 text-gray-400" />
                            <input type="text" value={editingTask === task.id ? newSubtask : ''}
                              onFocus={() => setEditingTask(task.id)}
                              onChange={e => { setEditingTask(task.id); setNewSubtask(e.target.value); }}
                              onKeyDown={e => { if (e.key === 'Enter') addSubtaskToTask(task.id); }}
                              placeholder="Thêm bước... (Enter để lưu)"
                              className="flex-1 px-3 py-1.5 text-sm border dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 bg-white"
                            />
                            {editingTask === task.id && newSubtask.trim() && (
                              <button onClick={() => addSubtaskToTask(task.id)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs">Thêm</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Board View */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(Object.entries(statusConfig)).map(([key, val]) => (
            <div key={key} className="bg-gray-50 dark:bg-gray-900/30 p-3 rounded-xl border dark:border-gray-700">
              <h3 className="font-semibold text-sm mb-3 dark:text-white flex gap-2">{val.icon} {val.label}</h3>
              <div className="space-y-2">
                {filtered.filter(t => (t.status || 'todo') === key).map(task => (
                  <div key={task.id} className={`bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-700 border-l-3 ${priorityConfig[task.priority].border} group relative`}>
                    <h4 onClick={() => setDetailTask(task.id)} className="font-medium text-sm dark:text-white pr-6 cursor-pointer">{task.title}</h4>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(task)} className="p-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-200"><Edit2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BẢNG CHI TIẾT CÔNG VIỆC TRƯỢT RA (DETAIL PANEL) KHÔI PHỤC HOÀN TOÀN */}
      {detailTaskData && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setDetailTask(null)}>
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg shadow-2xl overflow-y-auto animate-slideInRight" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Chi tiết công việc</h2>
              <button onClick={() => setDetailTask(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{detailTaskData.title}</h3>
                {detailTaskData.description && <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{detailTaskData.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Trạng thái</div>
                  <select value={detailTaskData.status || 'todo'} onChange={e => changeTaskStatus(detailTaskData.id, e.target.value as any)} className={`w-full px-2 py-1 rounded text-sm font-medium border-0 cursor-pointer ${statusConfig[detailTaskData.status || 'todo'].color}`}>
                    <option value="todo">📋 Chờ làm</option><option value="in_progress">🔄 Đang làm</option><option value="review">👁️ Đang review</option><option value="done">✅ Hoàn thành</option>
                  </select>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hạn chót</div>
                  <div className="flex items-center gap-1"><Calendar className="w-4 h-4 text-gray-500" /><span className="text-sm font-medium text-gray-900 dark:text-white">{format(new Date(detailTaskData.dueDate), 'dd/MM/yyyy')}</span></div>
                </div>
              </div>

              {detailTaskData.subtasks && detailTaskData.subtasks.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-indigo-600" /> Các bước thực hiện
                  </h4>
                  <div className="space-y-2">
                    {detailTaskData.subtasks.map(sub => (
                      <div key={sub.id} className={`p-3 rounded-lg border ${sub.completed ? 'bg-green-50 dark:bg-green-900/10 border-green-200' : 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700'}`}>
                        <div className="flex items-start gap-3">
                          <button onClick={() => toggleSubtask(detailTaskData.id, sub.id)} className="mt-0.5">
                            {sub.completed ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-gray-400 hover:text-indigo-500" />}
                          </button>
                          <div className="flex-1">
                            <span className={`text-sm font-medium ${sub.completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>{sub.title}</span>
                          </div>
                          <button onClick={() => deleteSubtaskCtx(detailTaskData.id, sub.id)} className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">➕ Thêm bước mới</div>
                <div className="flex gap-2">
                  <input type="text" value={editingTask === detailTaskData.id ? newSubtask : ''}
                    onFocus={() => setEditingTask(detailTaskData.id)}
                    onChange={e => { setEditingTask(detailTaskData.id); setNewSubtask(e.target.value); }}
                    onKeyDown={e => { if (e.key === 'Enter') addSubtaskToTask(detailTaskData.id); }}
                    placeholder="Tên bước... (Enter để thêm)"
                    className="flex-1 px-3 py-2 text-sm border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                  <button onClick={() => addSubtaskToTask(detailTaskData.id)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">Thêm</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm/Sửa */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex justify-between z-10">
              <h2 className="text-lg font-bold dark:text-white flex items-center gap-2">
                {editingTaskId ? <><Edit2 className="w-5 h-5 text-indigo-600"/> Sửa công việc</> : <><Plus className="w-5 h-5 text-indigo-600"/> Thêm công việc</>}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tiêu đề *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500" required placeholder="Nhập tiêu đề công việc..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả chi tiết</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none focus:ring-2 focus:ring-indigo-500" rows={3} placeholder="Mô tả thêm về công việc này..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Danh mục</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500">
                    <option value="Công việc">💼 Công việc</option>
                    <option value="Học tập">📚 Học tập</option>
                    <option value="Sức khỏe">💪 Sức khỏe</option>
                    <option value="Cá nhân">🏠 Cá nhân</option>
                    <option value="Khác">📌 Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500">
                    <option value="todo">📋 Chờ làm</option>
                    <option value="in_progress">🔄 Đang làm</option>
                    <option value="review">👁️ Đang review</option>
                    <option value="done">✅ Hoàn thành</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mức ưu tiên</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(priorityConfig) as Array<keyof typeof priorityConfig>).map(p => (
                    <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })} className={`py-2 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-1 border ${form.priority === p ? priorityConfig[p].color + ' border-transparent ring-2 ring-indigo-500 shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                      <span className={`w-2 h-2 rounded-full ${priorityConfig[p].dot}`}></span>
                      {priorityConfig[p].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hạn chót *</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thời gian ước tính (giờ)</label>
                  <input type="number" min="0" step="0.5" value={form.estimatedHours || ''} onChange={e => setForm({ ...form, estimatedHours: Number(e.target.value) })} className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500" placeholder="VD: 2.5" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Người thực hiện</label>
                <input type="text" value={form.assignee} onChange={e => setForm({ ...form, assignee: e.target.value })} className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500" placeholder="VD: Tôi, Anh A..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thêm các bước nhỏ (Subtasks)</label>
                <div className="space-y-2">
                  {form.subtaskInputs.map((sub, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-5 text-center">{idx + 1}.</span>
                      <input type="text" value={sub} onChange={e => {
                        const newSubs = [...form.subtaskInputs];
                        newSubs[idx] = e.target.value;
                        setForm({ ...form, subtaskInputs: newSubs });
                      }} className="flex-1 px-3 py-2 text-sm border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500" placeholder={`Nhập nội dung bước ${idx + 1}...`} />
                      {form.subtaskInputs.length > 1 && (
                        <button type="button" onClick={() => {
                          const newSubs = form.subtaskInputs.filter((_, i) => i !== idx);
                          setForm({ ...form, subtaskInputs: newSubs });
                        }} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><X className="w-4 h-4 text-red-500" /></button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setForm({ ...form, subtaskInputs: [...form.subtaskInputs, ''] })} className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 flex items-center gap-1 mt-2 p-1">
                    <Plus className="w-4 h-4" /> Thêm một bước nữa
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t dark:border-gray-700 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 py-3 border dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Hủy</button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-colors shadow-md">{editingTaskId ? 'Cập nhật công việc' : 'Tạo công việc mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

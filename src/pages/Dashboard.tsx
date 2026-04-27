import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTableData } from '../hooks/useData';
import { Transaction, Task, SavingsGoal, Event, Debt, Investment, Budget } from '../types';
import { Wallet, ArrowUpRight, ArrowDownRight, Target, CheckCircle, TrendingUp, AlertTriangle, Calendar as CalendarIcon } from 'lucide-react';
import { PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, eachDayOfInterval, addDays, addMonths, subMonths, differenceInDays, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getLocalDateString } from '../utils/date';

const avatars = ['👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼'];
const categoryColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

export function Dashboard() {
  const { user, theme } = useApp(); 
  
  const { data: transactions = [], isLoading: loadingTx } = useTableData<Transaction>('transactions', 'date', 60);
  const { data: tasks = [], isLoading: loadingTasks } = useTableData<Task>('tasks');
  const { data: savingsGoals = [] } = useTableData<SavingsGoal>('savings_goals');
  const { data: events = [] } = useTableData<Event>('events');
  const { data: debts = [] } = useTableData<Debt>('debts');
  const { data: investments = [] } = useTableData<Investment>('investments');
  const { data: budgets = [] } = useTableData<Budget>('budgets');

  // ĐỒNG BỘ THUẬT TOÁN TÍNH CHU KỲ VÀO DASHBOARD ĐỂ BÁO ĐỘNG NGÂN SÁCH CHUẨN XÁC
  const budgetsWithCalculatedSpent = useMemo(() => {
    const now = new Date();
    return budgets.map(budget => {
      const baseStart = new Date(`${budget.startDate}T00:00:00`);
      let start = new Date(baseStart);
      let end = new Date(baseStart);

      if (now >= baseStart) {
        if (budget.period === 'month') {
          start.setFullYear(now.getFullYear(), now.getMonth(), baseStart.getDate());
          if (start > now) start = subMonths(start, 1);
          end = addMonths(start, 1);
        } else {
          const diff = differenceInDays(now, baseStart);
          const weeksPassed = Math.floor(diff / 7);
          start = addDays(baseStart, weeksPassed * 7);
          end = addDays(start, 7);
        }
      } else {
        end = budget.period === 'month' ? addMonths(start, 1) : addDays(start, 7);
      }

      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');

      const actualSpent = transactions
        .filter(t => t.type === 'expense')
        .filter(t => t.category === (budget.category || budget.name))
        .filter(t => {
          const tDate = t.date.split('T')[0];
          return tDate >= startStr && tDate < endStr;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      return { ...budget, spent: actualSpent };
    });
  }, [budgets, transactions]);

  const [todayTasks, setTodayTasks] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);

  useEffect(() => {
    const today = getLocalDateString();
    const todayTasksCount = tasks.filter(t => t.dueDate && t.dueDate.split('T')[0] === today).length;
    const completedTodayCount = tasks.filter(t => t.completedAt && t.completedAt.split('T')[0] === today).length;
    setTodayTasks(todayTasksCount);
    setCompletedToday(completedTodayCount);
  }, [tasks]);

  if (loadingTx || loadingTasks) return <div className="p-6 flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const recentTransactions = transactions.slice(0, 5);

  const last7Days = eachDayOfInterval({ start: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), end: new Date() });
  const cashFlowData = last7Days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayIncome = transactions.filter(t => t.type === 'income' && t.date && t.date.startsWith(dateStr)).reduce((sum, t) => sum + (t.amount || 0), 0);
    const dayExpense = transactions.filter(t => t.type === 'expense' && t.date && t.date.startsWith(dateStr)).reduce((sum, t) => sum + (t.amount || 0), 0);
    return { date: format(day, 'dd/MM', { locale: vi }), income: dayIncome, expense: dayExpense };
  });

  const expenseByCategory = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + (t.amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([name, value], index) => ({ name, value, color: categoryColors[index % categoryColors.length] }));

  const todayEvents = events.filter(e => e.startDate && e.startDate.split('T')[0] === getLocalDateString());
  const overdueTasks = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date());
  const taskCompletionToday = todayTasks > 0 ? (completedToday / todayTasks) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chào {user?.name || 'Bạn'}! 👋</h1>
          <p className="text-gray-600 dark:text-gray-400">{format(new Date(), "EEEE, dd 'tháng' MM, yyyy", { locale: vi })}</p>
        </div>
        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-2xl">{avatars[user?.avatar || 0]}</div>
      </div>

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Tiến độ hôm nay</h2>
          <span className="text-3xl font-bold">{taskCompletionToday.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-white/30 rounded-full h-3"><div className="bg-white rounded-full h-3 transition-all" style={{ width: `${taskCompletionToday}%` }} /></div>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <span>{todayTasks} việc</span><span>•</span><span>{completedToday} hoàn thành</span><span>•</span><span>{todayEvents.length} sự kiện</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <div className="flex items-center justify-between mb-2"><Wallet className="w-5 h-5 text-indigo-400" /><span className="text-sm text-gray-500">Số dư</span></div>
          <p className="text-2xl font-bold dark:text-white">{balance.toLocaleString('vi-VN')} ₫</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <div className="flex items-center justify-between mb-2"><ArrowUpRight className="w-5 h-5 text-green-500" /><span className="text-sm text-gray-500">Tổng thu</span></div>
          <p className="text-2xl font-bold text-green-500">+{totalIncome.toLocaleString('vi-VN')} ₫</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <div className="flex items-center justify-between mb-2"><ArrowDownRight className="w-5 h-5 text-red-500" /><span className="text-sm text-gray-500">Tổng chi</span></div>
          <p className="text-2xl font-bold text-red-500">{totalExpense.toLocaleString('vi-VN')} ₫</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <div className="flex items-center justify-between mb-2"><Target className="w-5 h-5 text-purple-500" /><span className="text-sm text-gray-500">% Tiết kiệm</span></div>
          <p className={`text-2xl font-bold ${savingsRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>{savingsRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* ÁP DỤNG MẢNG CÓ TÍNH TOÁN ĐỂ HIỂN THỊ CẢNH BÁO */}
      {(overdueTasks.length > 0 || debts.some(d => !d.completed && d.dueDate && new Date(d.dueDate) < new Date()) || budgetsWithCalculatedSpent.some(b => b.limit > 0 && (b.spent / b.limit) >= 0.8)) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2"><AlertTriangle className="w-5 h-5" /><h3 className="font-semibold">Cảnh báo</h3></div>
          {overdueTasks.length > 0 && <p className="text-sm text-red-600 dark:text-red-400">• {overdueTasks.length} công việc quá hạn</p>}
          {debts.filter(d => !d.completed && d.dueDate && new Date(d.dueDate) < new Date()).length > 0 && <p className="text-sm text-red-600 dark:text-red-400">• Có khoản nợ quá hạn</p>}
          {budgetsWithCalculatedSpent.filter(b => b.limit > 0 && (b.spent / b.limit) >= 0.8).map(b => <p key={b.id} className="text-sm text-red-600 dark:text-red-400">• Ngân sách "{b.name}" đã sử dụng {((b.spent / b.limit) * 100).toFixed(0)}%</p>)}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <h3 className="font-semibold mb-4 dark:text-white">Luồng tiền (7 ngày)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="date" stroke={theme === 'dark' ? '#9ca3af' : '#4b5563'} />
              <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#4b5563'} />
              <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', color: theme === 'dark' ? '#fff' : '#000' }} />
              <Bar dataKey="income" fill="#22c55e" name="Thu" />
              <Bar dataKey="expense" fill="#ef4444" name="Chi" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <h3 className="font-semibold mb-4 dark:text-white">Chi tiêu theo danh mục</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', color: theme === 'dark' ? '#fff' : '#000' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* ... (Các phần thống kê bên dưới giữ nguyên) ... */}
    </div>
  );
}

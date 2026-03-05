import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Wallet, ArrowUpRight, ArrowDownRight, Target, CheckCircle, TrendingUp, AlertTriangle, Calendar as CalendarIcon } from 'lucide-react';
import { PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, eachDayOfInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getLocalDateString } from '../utils/date';

const avatars = ['👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼'];
const categoryColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

export function Dashboard() {
  const { user, transactions, tasks, savingsGoals, events, debts, investments, budgets } = useApp();
  const [todayTasks, setTodayTasks] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);

  useEffect(() => {
    const today = getLocalDateString();
    const todayTasksCount = tasks.filter(t => t.dueDate.split('T')[0] === today).length;
    const completedTodayCount = tasks.filter(t => t.completedAt && t.completedAt.split('T')[0] === today).length;
    setTodayTasks(todayTasksCount);
    setCompletedToday(completedTodayCount);
  }, [tasks]);

  // Calculate totals
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  // Task progress
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Recent transactions
  const recentTransactions = transactions.slice(0, 5);

  // Cash flow data (last 7 days)
  const last7Days = eachDayOfInterval({ start: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), end: new Date() });
  const cashFlowData = last7Days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayIncome = transactions.filter(t => t.type === 'income' && t.date.startsWith(dateStr)).reduce((sum, t) => sum + t.amount, 0);
    const dayExpense = transactions.filter(t => t.type === 'expense' && t.date.startsWith(dateStr)).reduce((sum, t) => sum + t.amount, 0);
    return {
      date: format(day, 'dd/MM', { locale: vi }),
      income: dayIncome,
      expense: dayExpense
    };
  });

  // Expense by category
  const expenseByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(expenseByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value], index) => ({ name, value, color: categoryColors[index % categoryColors.length] }));

  // Today's events
  const todayEvents = events.filter(e => {
    const eventDate = e.startDate.split('T')[0];
    return eventDate === getLocalDateString();
  });

  // Overdue tasks
  const overdueTasks = tasks.filter(t => !t.completed && new Date(t.dueDate) < new Date());

  const taskCompletionToday = todayTasks > 0 ? (completedToday / todayTasks) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Chào {user?.name || 'Bạn'}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {format(new Date(), "EEEE, dd 'tháng' MM, yyyy", { locale: vi })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-2xl">
            {avatars[user?.avatar || 0]}
          </div>
        </div>
      </div>

      {/* Today's Progress */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Tiến độ hôm nay</h2>
          <span className="text-3xl font-bold">{taskCompletionToday.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-white/30 rounded-full h-3">
          <div className="bg-white rounded-full h-3 transition-all" style={{ width: `${taskCompletionToday}%` }} />
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <span>{todayTasks} công việc</span>
          <span>•</span>
          <span>{completedToday} hoàn thành</span>
          <span>•</span>
          <span>{todayEvents.length} sự kiện</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <Wallet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Số dư</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {balance.toLocaleString('vi-VN')} ₫
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Tổng thu</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            +{totalIncome.toLocaleString('vi-VN')} ₫
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <ArrowDownRight className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Tổng chi</span>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {totalExpense.toLocaleString('vi-VN')} ₫
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">% Tiết kiệm</span>
          </div>
          <p className={`text-2xl font-bold ${savingsRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {savingsRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Warnings */}
      {(overdueTasks.length > 0 || debts.some(d => !d.completed && new Date(d.dueDate) < new Date()) || budgets.some(b => b.limit > 0 && (b.spent / b.limit) >= 0.8)) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-semibold">Cảnh báo</h3>
          </div>
          {overdueTasks.length > 0 && (
            <p className="text-sm text-red-600 dark:text-red-400">• {overdueTasks.length} công việc quá hạn</p>
          )}
          {debts.filter(d => !d.completed && new Date(d.dueDate) < new Date()).length > 0 && (
            <p className="text-sm text-red-600 dark:text-red-400">• Có khoản nợ quá hạn cần thanh toán</p>
          )}
          {budgets.filter(b => b.limit > 0 && (b.spent / b.limit) >= 0.8).map(b => (
            <p key={b.id} className="text-sm text-red-600 dark:text-red-400">• Ngân sách "{b.name}" đã sử dụng {((b.spent / b.limit) * 100).toFixed(0)}%</p>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Luồng tiền (7 ngày)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
              <Bar dataKey="income" fill="#22c55e" name="Thu" />
              <Bar dataKey="expense" fill="#ef4444" name="Chi" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Categories */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Chi tiêu theo danh mục</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions & Today's Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Giao dịch gần đây</h3>
          {recentTransactions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Chưa có giao dịch</p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                      {t.type === 'income' ? <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400" /> : <ArrowDownRight className="w-5 h-5 text-red-600 dark:text-red-400" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{t.description || t.category}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{format(new Date(t.date), 'dd/MM/yyyy')}</p>
                    </div>
                  </div>
                  <span className={`font-semibold ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Events */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" /> Hôm nay
          </h3>
          {todayEvents.length === 0 && overdueTasks.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Không có sự kiện nào hôm nay</p>
          ) : (
            <div className="space-y-3">
              {todayEvents.map(e => (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: `${e.color}20` }}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color }} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{e.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(e.startDate), 'HH:mm')} - {format(new Date(e.endDate), 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
              {overdueTasks.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="flex-1">
                    <p className="font-medium text-red-600 dark:text-red-400">{t.title} (Quá hạn)</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progress Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Tiến độ Task</h3>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
            <div className="bg-indigo-600 rounded-full h-2 transition-all" style={{ width: `${taskProgress}%` }} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{completedTasks}/{totalTasks} hoàn thành</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Đầu tư</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {investments.reduce((sum, i) => sum + (i.quantity * i.currentPrice), 0).toLocaleString('vi-VN')} ₫
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{investments.length} tài sản</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Quỹ tiết kiệm</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {savingsGoals.reduce((sum, g) => sum + g.current, 0).toLocaleString('vi-VN')} ₫
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{savingsGoals.length} mục tiêu</p>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { useTableData } from '../hooks/useData';
import { Transaction, Task, Budget, SavingsGoal } from '../types';
import { Download, TrendingUp, TrendingDown, Percent, CheckSquare } from 'lucide-react';
import { format, subMonths, subWeeks, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { vi } from 'date-fns/locale';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const categoryColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

export function Reports() {
  const { data: transactions = [], isLoading: l1 } = useTableData<Transaction>('transactions', 'date', 365);
  const { data: tasks = [], isLoading: l2 } = useTableData<Task>('tasks');
  const { data: budgets = [], isLoading: l3 } = useTableData<Budget>('budgets');
  const { data: savingsGoals = [], isLoading: l4 } = useTableData<SavingsGoal>('savings_goals');
  const isLoading = l1 || l2 || l3 || l4;

  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const now = new Date();

  const filteredTransactions = useMemo(() => {
    const cutoff = period === 'week' ? subWeeks(now, 1) : period === 'month' ? subMonths(now, 1) : subMonths(now, 12);
    return transactions.filter(t => new Date(t.date) >= cutoff);
  }, [transactions, period]);

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
  const completedTasks = tasks.filter(t => t.completed).length;
  const taskRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  const cashFlowData = useMemo(() => {
    if (period === 'year') {
      return Array.from({ length: 12 }, (_, i) => {
        const m = subMonths(now, 11 - i);
        const mStart = startOfMonth(m);
        const mEnd = endOfMonth(m);
        const monthTx = transactions.filter(t => new Date(t.date) >= mStart && new Date(t.date) <= mEnd);
        return {
          label: format(m, 'MM/yy'),
          income: monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
          expense: monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        };
      });
    }
    const days = period === 'week' ? 7 : 30;
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (days - 1 - i));
      const ds = format(d, 'yyyy-MM-dd');
      const dayTx = transactions.filter(t => t.date.startsWith(ds));
      return {
        label: format(d, 'dd/MM'),
        income: dayTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [transactions, period]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value], i) => ({
      name, value, color: categoryColors[i % categoryColors.length]
    }));
  }, [filteredTransactions]);

  const monthlyComparison = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const m = subMonths(now, 5 - i);
      const mStart = startOfMonth(m);
      const mEnd = endOfMonth(m);
      const monthTx = transactions.filter(t => new Date(t.date) >= mStart && new Date(t.date) <= mEnd);
      return {
        month: format(m, 'MMM', { locale: vi }),
        income: monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [transactions]);

  const taskProgress30 = useMemo(() => {
    const days = eachDayOfInterval({ start: new Date(now.getTime() - 29 * 86400000), end: now });
    let cumulative = 0;
    return days.map(d => {
      const ds = format(d, 'yyyy-MM-dd');
      const completedOnDay = tasks.filter(t => t.completedAt && t.completedAt.split('T')[0] === ds).length;
      cumulative += completedOnDay;
      return { date: format(d, 'dd/MM'), completed: cumulative };
    });
  }, [tasks]);

  const handleExport = () => {
    const report = {
      generatedAt: new Date().toISOString(), period,
      summary: { totalIncome, totalExpense, savingsRate, taskRate, completedTasks, totalTasks: tasks.length },
      transactions: filteredTransactions, budgets, savingsGoals,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${period}-${format(now, 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className="p-6 flex justify-center items-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📊 Báo cáo & Thống kê</h1>
        <div className="flex gap-2">
          <div className="flex border dark:border-gray-600 rounded-lg overflow-hidden">
            {(['week', 'month', 'year'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm transition-colors ${period === p ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                {p === 'week' ? 'Tuần' : p === 'month' ? 'Tháng' : 'Năm'}
              </button>
            ))}
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Download className="w-5 h-5" /> Xuất JSON
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center"><TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" /></div><span className="text-sm text-gray-500 dark:text-gray-400">Tổng thu</span></div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalIncome.toLocaleString('vi-VN')} ₫</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center"><TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" /></div><span className="text-sm text-gray-500 dark:text-gray-400">Tổng chi</span></div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{totalExpense.toLocaleString('vi-VN')} ₫</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center"><Percent className="w-5 h-5 text-purple-600 dark:text-purple-400" /></div><span className="text-sm text-gray-500 dark:text-gray-400">Tỷ lệ tiết kiệm</span></div>
          <p className={`text-2xl font-bold ${savingsRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{savingsRate.toFixed(1)}%</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center"><CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /></div><span className="text-sm text-gray-500 dark:text-gray-400">Hoàn thành CV</span></div>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{taskRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{completedTasks}/{tasks.length} task</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">💰 Luồng tiền</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="label" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Legend />
              <Bar dataKey="income" fill="#22c55e" name="Thu" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#ef4444" name="Chi" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">📂 Phân bổ chi tiêu</h3>
          {categoryData.length === 0 ? <div className="flex items-center justify-center h-[280px] text-gray-500">Chưa có dữ liệu</div> : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={90} innerRadius={40} dataKey="value" label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                  {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} formatter={(value: any) => `${(value as number).toLocaleString('vi-VN')} ₫`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">📊 So sánh Thu/Chi 6 tháng</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Legend />
              <Bar dataKey="income" fill="#6366f1" name="Thu nhập" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#f43f5e" name="Chi tiêu" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">✅ Tiến độ hoàn thành CV (30 ngày)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={taskProgress30}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Line type="monotone" dataKey="completed" stroke="#6366f1" strokeWidth={2} dot={false} name="Tích lũy" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">📋 Trạng thái Ngân sách</h3>
          {budgets.length === 0 ? <p className="text-gray-500 text-sm">Chưa có ngân sách</p> : budgets.map(b => {
            const pct = Math.min((b.spent / b.limit) * 100, 100);
            const color = pct >= 100 ? '#ef4444' : pct >= 80 ? '#eab308' : '#22c55e';
            return (
              <div key={b.id} className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">{b.name}</span>
                  <span className="text-gray-500">{b.spent.toLocaleString('vi-VN')} / {b.limit.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3"><div className="h-3 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} /></div>
                <p className="text-right text-xs mt-0.5" style={{ color }}>{pct.toFixed(0)}%</p>
              </div>
            );
          })}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">🎯 Quỹ mục tiêu tiết kiệm</h3>
          {savingsGoals.length === 0 ? <p className="text-gray-500 text-sm">Chưa có quỹ</p> : savingsGoals.map(g => {
            const pct = Math.min((g.current / g.target) * 100, 100);
            return (
              <div key={g.id} className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">{g.icon} {g.name}</span>
                  <span className="text-gray-500">{g.current.toLocaleString('vi-VN')} / {g.target.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3"><div className="h-3 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: g.color }} /></div>
                <p className="text-right text-xs mt-0.5" style={{ color: g.color }}>{pct.toFixed(0)}%</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

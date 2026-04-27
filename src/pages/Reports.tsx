import { useState, useMemo } from 'react';
import { useTableData } from '../hooks/useData';
import { Transaction, Task, Budget, SavingsGoal } from '../types';
import { Download, TrendingUp, TrendingDown, Percent, CheckSquare } from 'lucide-react';
import { format, subMonths, subWeeks, eachDayOfInterval, startOfMonth, endOfMonth, addDays, addMonths, subDays, differenceInDays } from 'date-fns';
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

  // ĐỒNG BỘ THUẬT TOÁN TÍNH CHU KỲ VÀO REPORT
  const budgetsWithCalculatedSpent = useMemo(() => {
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
  }, [budgets, transactions, now]);

  const filteredTransactions = useMemo(() => {
    const cutoff = period === 'week' ? subWeeks(now, 1) : period === 'month' ? subMonths(now, 1) : subMonths(now, 12);
    return transactions.filter(t => new Date(t.date) >= cutoff);
  }, [transactions, period, now]);

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
  const completedTasks = tasks.filter(t => t.completed).length;
  const taskRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  const cashFlowData = useMemo(() => {
    // Logic biểu đồ giữ nguyên
    if (period === 'year') {
      return Array.from({ length: 12 }, (_, i) => {
        const m = subMonths(now, 11 - i);
        const mStart = startOfMonth(m);
        const mEnd = endOfMonth(m);
        const monthTx = transactions.filter(t => new Date(t.date) >= mStart && new Date(t.date) <= mEnd);
        return { label: format(m, 'MM/yy'), income: monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), expense: monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0) };
      });
    }
    const days = period === 'week' ? 7 : 30;
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - (days - 1 - i));
      const ds = format(d, 'yyyy-MM-dd');
      const dayTx = transactions.filter(t => t.date.startsWith(ds));
      return { label: format(d, 'dd/MM'), income: dayTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), expense: dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0) };
    });
  }, [transactions, period, now]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => map[t.category] = (map[t.category] || 0) + t.amount);
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value], i) => ({ name, value, color: categoryColors[i % categoryColors.length] }));
  }, [filteredTransactions]);

  const monthlyComparison = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const m = subMonths(now, 5 - i);
      const monthTx = transactions.filter(t => new Date(t.date) >= startOfMonth(m) && new Date(t.date) <= endOfMonth(m));
      return { month: format(m, 'MMM', { locale: vi }), income: monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), expense: monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0) };
    });
  }, [transactions, now]);

  const taskProgress30 = useMemo(() => {
    const days = eachDayOfInterval({ start: new Date(now.getTime() - 29 * 86400000), end: now });
    let cumulative = 0;
    return days.map(d => {
      const ds = format(d, 'yyyy-MM-dd');
      cumulative += tasks.filter(t => t.completedAt && t.completedAt.split('T')[0] === ds).length;
      return { date: format(d, 'dd/MM'), completed: cumulative };
    });
  }, [tasks, now]);

  if (isLoading) return <div className="p-6 flex justify-center items-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="p-6 space-y-6">
      {/* ... (Các phần Header và Stats giữ nguyên) ... */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📊 Báo cáo & Thống kê</h1>
        <div className="flex gap-2">
          <div className="flex border dark:border-gray-600 rounded-lg overflow-hidden">
            {(['week', 'month', 'year'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 text-sm transition-colors ${period === p ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 hover:bg-gray-50'}`}>
                {p === 'week' ? 'Tuần' : p === 'month' ? 'Tháng' : 'Năm'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hiển thị Tiến độ Ngân sách với mảng đã được tính lại */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border dark:border-gray-700">
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">📋 Trạng thái Ngân sách (Chu kỳ hiện tại)</h3>
          {budgetsWithCalculatedSpent.length === 0 ? <p className="text-gray-500 text-sm">Chưa có ngân sách</p> : budgetsWithCalculatedSpent.map(b => {
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
        
        {/* Phần Quỹ Tiết kiệm */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border dark:border-gray-700">
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

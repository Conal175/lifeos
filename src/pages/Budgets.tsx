import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Trash2, X, DollarSign, AlertCircle, CheckCircle, Edit2, Wallet, Users, TrendingUp, Clock, Calendar } from 'lucide-react';
import { format, differenceInDays, addDays, addMonths } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Debt } from '../types';
import { getLocalDateString } from '../utils/date';

export function Budgets() {
  const { budgets, addBudget, updateBudget, deleteBudget, debts, addDebt, updateDebt, deleteDebt, completeDebt } = useApp();
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showCompleteDebtModal, setShowCompleteDebtModal] = useState(false);
  const [selectedDebtForComplete, setSelectedDebtForComplete] = useState<Debt | null>(null);
  const [createDebtTransaction, setCreateDebtTransaction] = useState(true);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [editingDebt, setEditingDebt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'budgets' | 'debts'>('budgets');
  
  const [budgetForm, setBudgetForm] = useState({
    name: '',
    category: '',
    limit: '',
    spent: '',
    period: 'month' as 'week' | 'month',
    startDate: getLocalDateString()
  });

  // Helper function to calculate budget date range
  const getBudgetDateRange = (startDate: string, period: 'week' | 'month') => {
    const start = new Date(startDate);
    const end = period === 'week' ? addDays(start, 7) : addMonths(start, 1);
    return {
      start,
      end,
      startStr: format(start, 'dd/MM/yyyy', { locale: vi }),
      endStr: format(addDays(end, -1), 'dd/MM/yyyy', { locale: vi }),
      isActive: new Date() >= start && new Date() < end,
      isExpired: new Date() >= end
    };
  };

  const [debtForm, setDebtForm] = useState({
    type: 'owe' as 'owe' | 'owed',
    amount: '',
    person: '',
    description: '',
    dueDate: getLocalDateString()
  });

  const resetBudgetForm = () => {
    setBudgetForm({
      name: '',
      category: '',
      limit: '',
      spent: '',
      period: 'month',
      startDate: getLocalDateString()
    });
    setEditingBudget(null);
  };

  const resetDebtForm = () => {
    setDebtForm({
      type: 'owe',
      amount: '',
      person: '',
      description: '',
      dueDate: getLocalDateString()
    });
    setEditingDebt(null);
  };

  const handleEditBudget = (budget: typeof budgets[0]) => {
    setBudgetForm({
      name: budget.name,
      category: budget.category || '',
      limit: budget.limit.toString(),
      spent: budget.spent.toString(),
      period: budget.period,
      startDate: budget.startDate.split('T')[0]
    });
    setEditingBudget(budget.id);
    setShowBudgetModal(true);
  };

  const handleEditDebt = (debt: typeof debts[0]) => {
    setDebtForm({
      type: debt.type,
      amount: debt.amount.toString(),
      person: debt.person,
      description: debt.description,
      dueDate: debt.dueDate.split('T')[0]
    });
    setEditingDebt(debt.id);
    setShowDebtModal(true);
  };

  const handleAddBudget = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingBudget) {
      updateBudget(editingBudget, {
        name: budgetForm.name,
        category: budgetForm.category || budgetForm.name,
        limit: parseFloat(budgetForm.limit),
        spent: parseFloat(budgetForm.spent) || 0,
        period: budgetForm.period,
        startDate: budgetForm.startDate
      });
    } else {
      addBudget({
        name: budgetForm.name,
        category: budgetForm.category || budgetForm.name,
        limit: parseFloat(budgetForm.limit),
        period: budgetForm.period,
        startDate: budgetForm.startDate
      });
    }
    
    resetBudgetForm();
    setShowBudgetModal(false);
  };

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingDebt) {
      updateDebt(editingDebt, {
        type: debtForm.type,
        amount: parseFloat(debtForm.amount),
        person: debtForm.person,
        description: debtForm.description,
        dueDate: debtForm.dueDate
      });
    } else {
      addDebt({
        type: debtForm.type,
        amount: parseFloat(debtForm.amount),
        person: debtForm.person,
        description: debtForm.description,
        dueDate: debtForm.dueDate
      });
    }
    
    resetDebtForm();
    setShowDebtModal(false);
  };

  const getBudgetColor = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100;
    if (percentage >= 100) return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-100 dark:bg-red-900/30' };
    if (percentage >= 80) return { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-100 dark:bg-yellow-900/30' };
    return { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-100 dark:bg-green-900/30' };
  };

  const getDaysUntilDue = (dueDate: string) => {
    return differenceInDays(new Date(dueDate), new Date());
  };

  const handleOpenCompleteDebt = (debt: Debt) => {
    setSelectedDebtForComplete(debt);
    setCreateDebtTransaction(true);
    setShowCompleteDebtModal(true);
  };

  const handleConfirmCompleteDebt = () => {
    if (!selectedDebtForComplete) return;
    
    completeDebt(selectedDebtForComplete.id, createDebtTransaction);
    setShowCompleteDebtModal(false);
    setSelectedDebtForComplete(null);
  };

  const handleCancelCompleteDebt = () => {
    setShowCompleteDebtModal(false);
    setSelectedDebtForComplete(null);
  };

  // Stats
  const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const budgetsOverLimit = budgets.filter(b => b.spent > b.limit).length;
  
  const totalOwed = debts.filter(d => d.type === 'owe' && !d.completed).reduce((sum, d) => sum + d.amount, 0);
  const totalOwedToMe = debts.filter(d => d.type === 'owed' && !d.completed).reduce((sum, d) => sum + d.amount, 0);
  const overdueDebts = debts.filter(d => !d.completed && getDaysUntilDue(d.dueDate) < 0).length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-7 h-7 text-indigo-600" />
            Ngân sách & Quản lý Nợ
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Theo dõi chi tiêu và quản lý các khoản nợ
          </p>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'budgets') {
              resetBudgetForm();
              setShowBudgetModal(true);
            } else {
              resetDebtForm();
              setShowDebtModal(true);
            }
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 font-medium"
        >
          <Plus className="w-5 h-5" /> {activeTab === 'budgets' ? 'Thêm ngân sách' : 'Thêm khoản nợ'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('budgets')}
          className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === 'budgets' 
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          💰 Ngân sách ({budgets.length})
        </button>
        <button
          onClick={() => setActiveTab('debts')}
          className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === 'debts' 
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          📋 Quản lý Nợ ({debts.length})
        </button>
      </div>

      {/* Budgets Tab */}
      {activeTab === 'budgets' && (
        <>
          {/* Budget Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border dark:border-gray-700">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <Wallet className="w-5 h-5" />
                <span className="text-sm font-medium">Tổng giới hạn</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalBudgetLimit.toLocaleString('vi-VN')} ₫
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border dark:border-gray-700">
              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-medium">Đã chi tiêu</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalSpent.toLocaleString('vi-VN')} ₫
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border dark:border-gray-700">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <DollarSign className="w-5 h-5" />
                <span className="text-sm font-medium">Còn lại</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(totalBudgetLimit - totalSpent).toLocaleString('vi-VN')} ₫
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border dark:border-gray-700">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Vượt ngưỡng</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {budgetsOverLimit}/{budgets.length}
              </p>
            </div>
          </div>

          {/* Budget Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-gray-800 rounded-2xl p-12 border dark:border-gray-700 text-center">
                <div className="text-6xl mb-4">💰</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Chưa có ngân sách nào</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Tạo ngân sách để theo dõi chi tiêu hiệu quả hơn!</p>
                <button
                  onClick={() => { resetBudgetForm(); setShowBudgetModal(true); }}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  <Plus className="w-5 h-5" /> Tạo ngân sách đầu tiên
                </button>
              </div>
            ) : (
              budgets.map(budget => {
                const percentage = budget.limit > 0 ? Math.min((budget.spent / budget.limit) * 100, 100) : 0;
                const remaining = budget.limit - budget.spent;
                const colors = getBudgetColor(budget.spent, budget.limit);
                const dateRange = getBudgetDateRange(budget.startDate, budget.period);
                
                return (
                  <div key={budget.id} className={`bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border dark:border-gray-700 hover:shadow-lg transition-all ${
                    dateRange.isExpired ? 'opacity-60' : ''
                  }`}>
                    {/* Header with color indicator */}
                    <div className={`h-2 ${colors.bg}`} />
                    
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 dark:text-white text-lg">{budget.name}</h3>
                          {dateRange.isActive && (
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-medium rounded-full">
                              Đang hoạt động
                            </span>
                          )}
                          {dateRange.isExpired && (
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-medium rounded-full">
                              Đã kết thúc
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleEditBudget(budget)} 
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </button>
                          <button 
                            onClick={() => deleteBudget(budget.id)} 
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>

                      {/* Date Range */}
                      <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {dateRange.startStr} - {dateRange.endStr}
                          </span>
                          <span className="text-gray-400 dark:text-gray-600">
                            ({budget.period === 'week' ? '7 ngày' : '1 tháng'})
                          </span>
                        </div>
                      </div>
                      
                      {/* Progress */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-500 dark:text-gray-400">Đã chi</span>
                          <span className={`font-bold ${colors.text}`}>
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all ${colors.bg}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-sm mt-2">
                          <span className="text-gray-600 dark:text-gray-400">
                            {budget.spent.toLocaleString('vi-VN')} ₫
                          </span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {budget.limit.toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                      </div>
                      
                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t dark:border-gray-700">
                        <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {budget.period === 'week' ? 'Hàng tuần' : 'Hàng tháng'}
                        </span>
                        {remaining >= 0 ? (
                          <span className="text-sm text-green-600 dark:text-green-400 font-semibold">
                            Còn: {remaining.toLocaleString('vi-VN')} ₫
                          </span>
                        ) : (
                          <span className="text-sm text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            Vượt: {Math.abs(remaining).toLocaleString('vi-VN')} ₫
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Debts Tab */}
      {activeTab === 'debts' && (
        <>
          {/* Debt Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border dark:border-gray-700">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Tổng nợ</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalOwed.toLocaleString('vi-VN')} ₫
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border dark:border-gray-700">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <DollarSign className="w-5 h-5" />
                <span className="text-sm font-medium">Được nợ</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalOwedToMe.toLocaleString('vi-VN')} ₫
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border dark:border-gray-700">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">Số khoản nợ</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {debts.filter(d => !d.completed).length}/{debts.length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border dark:border-gray-700">
              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">Quá hạn</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {overdueDebts}
              </p>
            </div>
          </div>

          {/* Debt List */}
          <div className="space-y-3">
            {debts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border dark:border-gray-700 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Chưa có khoản nợ nào</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Ghi chép các khoản nợ để quản lý tốt hơn!</p>
                <button
                  onClick={() => { resetDebtForm(); setShowDebtModal(true); }}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  <Plus className="w-5 h-5" /> Thêm khoản nợ đầu tiên
                </button>
              </div>
            ) : (
              debts.map(debt => {
                const daysUntilDue = getDaysUntilDue(debt.dueDate);
                const isOverdue = !debt.completed && daysUntilDue < 0;
                
                return (
                  <div 
                    key={debt.id} 
                    className={`bg-white dark:bg-gray-800 rounded-2xl p-4 border dark:border-gray-700 transition-all hover:shadow-md ${
                      debt.completed ? 'opacity-60' : ''
                    } ${isOverdue ? 'border-red-500 dark:border-red-500' : ''}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                          debt.type === 'owe' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'
                        }`}>
                          {debt.type === 'owe' ? (
                            <AlertCircle className="w-7 h-7 text-red-600 dark:text-red-400" />
                          ) : (
                            <DollarSign className="w-7 h-7 text-green-600 dark:text-green-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{debt.person}</h3>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              debt.type === 'owe' 
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                              {debt.type === 'owe' ? '↑ Tôi đang nợ' : '↓ Nợ tôi'}
                            </span>
                            {debt.completed && (
                              <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-semibold">
                                ✓ Đã thanh toán
                              </span>
                            )}
                          </div>
                          {debt.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{debt.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm flex-wrap">
                            <span className={`font-bold text-lg ${debt.type === 'owe' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                              {debt.amount.toLocaleString('vi-VN')} ₫
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              📅 Hạn: {format(new Date(debt.dueDate), 'dd/MM/yyyy')}
                            </span>
                            {!debt.completed && (
                              <span className={`font-medium ${
                                daysUntilDue < 0 ? 'text-red-600 dark:text-red-400' : 
                                daysUntilDue <= 3 ? 'text-orange-600 dark:text-orange-400' : 
                                'text-gray-500 dark:text-gray-400'
                              }`}>
                                {daysUntilDue > 0 
                                  ? `⏳ Còn ${daysUntilDue} ngày` 
                                  : daysUntilDue === 0 
                                    ? '⚠️ Hôm nay là hạn chót' 
                                    : `🚨 Quá hạn ${Math.abs(daysUntilDue)} ngày`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap md:flex-nowrap">
                        {!debt.completed && (
                          <button 
                            onClick={() => handleOpenCompleteDebt(debt)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" /> Hoàn thành
                          </button>
                        )}
                        {debt.completed && (
                          <button 
                            onClick={() => completeDebt(debt.id, false)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-xl text-sm font-medium transition-colors hover:bg-gray-300 dark:hover:bg-gray-600"
                          >
                            ↩️ Hoàn tác
                          </button>
                        )}
                        <button 
                          onClick={() => handleEditDebt(debt)} 
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                        <button 
                          onClick={() => deleteDebt(debt.id)} 
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingBudget ? '✏️ Chỉnh sửa ngân sách' : '💰 Thêm ngân sách mới'}
              </h2>
              <button onClick={() => { setShowBudgetModal(false); resetBudgetForm(); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddBudget} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Tên ngân sách *</label>
                <input
                  type="text"
                  value={budgetForm.name}
                  onChange={(e) => setBudgetForm({ ...budgetForm, name: e.target.value })}
                  className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="VD: Chi tiêu hàng ngày, Ăn uống..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Giới hạn (₫) *</label>
                <input
                  type="number"
                  value={budgetForm.limit}
                  onChange={(e) => setBudgetForm({ ...budgetForm, limit: e.target.value })}
                  className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="5,000,000"
                  required
                  min="0"
                />
              </div>
              {editingBudget && (
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Đã chi tiêu (₫)</label>
                  <input
                    type="number"
                    value={budgetForm.spent}
                    onChange={(e) => setBudgetForm({ ...budgetForm, spent: e.target.value })}
                    className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="0"
                    min="0"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Chu kỳ *</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBudgetForm({ ...budgetForm, period: 'week' })}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      budgetForm.period === 'week' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    📅 Hàng tuần
                  </button>
                  <button
                    type="button"
                    onClick={() => setBudgetForm({ ...budgetForm, period: 'month' })}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      budgetForm.period === 'month' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    🗓️ Hàng tháng
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Ngày bắt đầu</label>
                <input
                  type="date"
                  value={budgetForm.startDate}
                  onChange={(e) => setBudgetForm({ ...budgetForm, startDate: e.target.value })}
                  className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all"
              >
                {editingBudget ? '💾 Cập nhật' : '✨ Tạo ngân sách'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Debt Modal */}
      {showDebtModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingDebt ? '✏️ Chỉnh sửa khoản nợ' : '📋 Thêm khoản nợ mới'}
              </h2>
              <button onClick={() => { setShowDebtModal(false); resetDebtForm(); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddDebt} className="p-4 space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDebtForm({ ...debtForm, type: 'owe' })}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                    debtForm.type === 'owe' ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  ↑ Tôi đang nợ
                </button>
                <button
                  type="button"
                  onClick={() => setDebtForm({ ...debtForm, type: 'owed' })}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                    debtForm.type === 'owed' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  ↓ Người khác nợ tôi
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Số tiền *</label>
                <input
                  type="number"
                  value={debtForm.amount}
                  onChange={(e) => setDebtForm({ ...debtForm, amount: e.target.value })}
                  className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-lg font-bold"
                  required
                  min="0"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                  {debtForm.type === 'owe' ? 'Nợ ai? *' : 'Ai nợ? *'}
                </label>
                <input
                  type="text"
                  value={debtForm.person}
                  onChange={(e) => setDebtForm({ ...debtForm, person: e.target.value })}
                  className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Tên người..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Mô tả / Lý do</label>
                <input
                  type="text"
                  value={debtForm.description}
                  onChange={(e) => setDebtForm({ ...debtForm, description: e.target.value })}
                  className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Lý do khoản nợ..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Hạn thanh toán *</label>
                <input
                  type="date"
                  value={debtForm.dueDate}
                  onChange={(e) => setDebtForm({ ...debtForm, dueDate: e.target.value })}
                  className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all"
              >
                {editingDebt ? '💾 Cập nhật' : '✨ Thêm khoản nợ'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Complete Debt Confirmation Modal */}
      {showCompleteDebtModal && selectedDebtForComplete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl animate-fadeIn">
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                ✅ Xác nhận hoàn thành khoản nợ
              </h2>
              <button 
                onClick={handleCancelCompleteDebt} 
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              {/* Debt Info Summary */}
              <div className={`p-4 rounded-xl ${
                selectedDebtForComplete.type === 'owe' 
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
                  : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    selectedDebtForComplete.type === 'owe' 
                      ? 'bg-red-100 dark:bg-red-900/40' 
                      : 'bg-green-100 dark:bg-green-900/40'
                  }`}>
                    {selectedDebtForComplete.type === 'owe' ? (
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    ) : (
                      <DollarSign className="w-6 h-6 text-green-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedDebtForComplete.type === 'owe' ? 'Tôi đang nợ' : 'Người khác nợ tôi'}
                    </p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {selectedDebtForComplete.person}
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-center py-2">
                  <span className={selectedDebtForComplete.type === 'owe' ? 'text-red-600' : 'text-green-600'}>
                    {selectedDebtForComplete.amount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                {selectedDebtForComplete.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    {selectedDebtForComplete.description}
                  </p>
                )}
              </div>

              {/* Create Transaction Option */}
              <div 
                onClick={() => setCreateDebtTransaction(!createDebtTransaction)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  createDebtTransaction 
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    createDebtTransaction 
                      ? 'bg-indigo-600 border-indigo-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {createDebtTransaction && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Tạo giao dịch tương ứng
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {selectedDebtForComplete.type === 'owe' ? (
                        <>
                          <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                            <AlertCircle className="w-4 h-4" /> Chi tiêu
                          </span>
                          <span className="mx-1">-</span>
                          Ghi nhận khoản tiền đã trả nợ vào chi tiêu
                        </>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                            <DollarSign className="w-4 h-4" /> Thu nhập
                          </span>
                          <span className="mx-1">-</span>
                          Ghi nhận khoản tiền đã thu hồi vào thu nhập
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview Impact */}
              {createDebtTransaction && (
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    📊 Tác động khi xác nhận:
                  </p>
                  <div className="space-y-2 text-sm">
                    {selectedDebtForComplete.type === 'owe' ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Số dư:</span>
                          <span className="text-red-600 font-semibold">
                            -{selectedDebtForComplete.amount.toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tổng chi:</span>
                          <span className="text-red-600 font-semibold">
                            +{selectedDebtForComplete.amount.toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Số dư:</span>
                          <span className="text-green-600 font-semibold">
                            +{selectedDebtForComplete.amount.toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tổng thu:</span>
                          <span className="text-green-600 font-semibold">
                            +{selectedDebtForComplete.amount.toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCancelCompleteDebt}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmCompleteDebt}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

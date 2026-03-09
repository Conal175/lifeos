import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTableData } from '../hooks/useData';
import { Plus, Trash2, X, DollarSign, AlertCircle, CheckCircle, Edit2, Wallet, Users, TrendingUp, Clock, Calendar } from 'lucide-react';
import { format, differenceInDays, addDays, addMonths } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Budget, Debt, Transaction } from '../types';
import { getLocalDateString } from '../utils/date';

export function Budgets() {
  const { user } = useApp();
  const { data: budgets = [], isLoading: loadB, addRecord: addB, updateRecord: updateB, deleteRecord: delB } = useTableData<Budget>('budgets');
  const { data: debts = [], isLoading: loadD, addRecord: addD, updateRecord: updateD, deleteRecord: delD } = useTableData<Debt>('debts');
  const { addRecord: addTx } = useTableData<Transaction>('transactions');
  
  const isLoading = loadB || loadD;

  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showCompleteDebtModal, setShowCompleteDebtModal] = useState(false);
  const [selectedDebtForComplete, setSelectedDebtForComplete] = useState<Debt | null>(null);
  const [createDebtTransaction, setCreateDebtTransaction] = useState(true);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [editingDebt, setEditingDebt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'budgets' | 'debts'>('budgets');
  
  const [budgetForm, setBudgetForm] = useState({ name: '', category: '', limit: '', spent: '', period: 'month' as 'week' | 'month', startDate: getLocalDateString() });
  const [debtForm, setDebtForm] = useState({ type: 'owe' as 'owe' | 'owed', amount: '', person: '', description: '', dueDate: getLocalDateString() });

  const getBudgetDateRange = (startDate: string, period: 'week' | 'month') => {
    const start = new Date(startDate);
    const end = period === 'week' ? addDays(start, 7) : addMonths(start, 1);
    return { start, end, startStr: format(start, 'dd/MM/yyyy', { locale: vi }), endStr: format(addDays(end, -1), 'dd/MM/yyyy', { locale: vi }), isActive: new Date() >= start && new Date() < end, isExpired: new Date() >= end };
  };

  const resetBudgetForm = () => { setBudgetForm({ name: '', category: '', limit: '', spent: '', period: 'month', startDate: getLocalDateString() }); setEditingBudget(null); };
  const resetDebtForm = () => { setDebtForm({ type: 'owe', amount: '', person: '', description: '', dueDate: getLocalDateString() }); setEditingDebt(null); };

  const completeDebt = (id: string, createTx: boolean = false) => {
    const debt = debts.find(d => d.id === id);
    if (!debt) return;
    const newCompleted = !debt.completed;
    updateD({ id, data: { completed: newCompleted } });
    if (createTx && newCompleted) {
      const txType = debt.type === 'owe' ? 'expense' : 'income';
      addTx({
        type: txType, amount: debt.amount, category: 'Khác',
        description: debt.description || `Thanh toán nợ: ${debt.person}`,
        date: getLocalDateString(), tags: ['debt'], userId: user?.id
      });
    }
  };

  const handleEditBudget = (budget: typeof budgets[0]) => { setBudgetForm({ name: budget.name, category: budget.category || '', limit: budget.limit.toString(), spent: budget.spent.toString(), period: budget.period, startDate: budget.startDate.split('T')[0] }); setEditingBudget(budget.id); setShowBudgetModal(true); };
  const handleEditDebt = (debt: typeof debts[0]) => { setDebtForm({ type: debt.type, amount: debt.amount.toString(), person: debt.person, description: debt.description, dueDate: debt.dueDate.split('T')[0] }); setEditingDebt(debt.id); setShowDebtModal(true); };

  const handleAddBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBudget) { updateB({ id: editingBudget, data: { name: budgetForm.name, category: budgetForm.category || budgetForm.name, limit: parseFloat(budgetForm.limit), spent: parseFloat(budgetForm.spent) || 0, period: budgetForm.period, startDate: budgetForm.startDate } }); } 
    else { addB({ name: budgetForm.name, category: budgetForm.category || budgetForm.name, limit: parseFloat(budgetForm.limit), spent: 0, period: budgetForm.period, startDate: budgetForm.startDate, userId: user?.id }); }
    resetBudgetForm(); setShowBudgetModal(false);
  };

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDebt) { updateD({ id: editingDebt, data: { type: debtForm.type, amount: parseFloat(debtForm.amount), person: debtForm.person, description: debtForm.description, dueDate: debtForm.dueDate } }); } 
    else { addD({ type: debtForm.type, amount: parseFloat(debtForm.amount), person: debtForm.person, description: debtForm.description, dueDate: debtForm.dueDate, completed: false, userId: user?.id }); }
    resetDebtForm(); setShowDebtModal(false);
  };

  const handleConfirmCompleteDebt = () => { if (!selectedDebtForComplete) return; completeDebt(selectedDebtForComplete.id, createDebtTransaction); setShowCompleteDebtModal(false); setSelectedDebtForComplete(null); };

  if (isLoading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Wallet className="w-7 h-7 text-indigo-600" /> Ngân sách & Quản lý Nợ</h1></div>
        <button onClick={() => { if (activeTab === 'budgets') { resetBudgetForm(); setShowBudgetModal(true); } else { resetDebtForm(); setShowDebtModal(true); } }} className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl font-medium"><Plus className="w-5 h-5" /> {activeTab === 'budgets' ? 'Thêm ngân sách' : 'Thêm khoản nợ'}</button>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        <button onClick={() => setActiveTab('budgets')} className={`px-5 py-2.5 rounded-lg font-medium ${activeTab === 'budgets' ? 'bg-white dark:bg-gray-700 text-indigo-600' : 'text-gray-500'}`}>💰 Ngân sách ({budgets.length})</button>
        <button onClick={() => setActiveTab('debts')} className={`px-5 py-2.5 rounded-lg font-medium ${activeTab === 'debts' ? 'bg-white dark:bg-gray-700 text-indigo-600' : 'text-gray-500'}`}>📋 Quản lý Nợ ({debts.length})</button>
      </div>

      {activeTab === 'budgets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map(budget => {
            const percentage = budget.limit > 0 ? Math.min((budget.spent / budget.limit) * 100, 100) : 0;
            const colors = percentage >= 100 ? { bg: 'bg-red-500', text: 'text-red-600' } : percentage >= 80 ? { bg: 'bg-yellow-500', text: 'text-yellow-600' } : { bg: 'bg-green-500', text: 'text-green-600' };
            const dateRange = getBudgetDateRange(budget.startDate, budget.period);
            return (
              <div key={budget.id} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border dark:border-gray-700">
                <div className={`h-2 ${colors.bg}`} />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{budget.name}</h3>
                    <div className="flex gap-1"><button onClick={() => handleEditBudget(budget)} className="p-2"><Edit2 className="w-4 h-4 text-gray-500" /></button><button onClick={() => delB(budget.id)} className="p-2"><Trash2 className="w-4 h-4 text-red-500" /></button></div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2"><span className="text-gray-500">Đã chi</span><span className={`font-bold ${colors.text}`}>{percentage.toFixed(0)}%</span></div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3"><div className={`h-3 rounded-full transition-all ${colors.bg}`} style={{ width: `${percentage}%` }} /></div>
                    <div className="flex justify-between text-sm mt-2"><span className="text-gray-600 dark:text-gray-400">{budget.spent.toLocaleString('vi-VN')} ₫</span><span className="text-gray-900 dark:text-white font-medium">{budget.limit.toLocaleString('vi-VN')} ₫</span></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'debts' && (
        <div className="space-y-3">
          {debts.map(debt => (
            <div key={debt.id} className={`bg-white dark:bg-gray-800 rounded-2xl p-4 border dark:border-gray-700 ${debt.completed ? 'opacity-60' : ''}`}>
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${debt.type === 'owe' ? 'bg-red-100' : 'bg-green-100'}`}>
                    {debt.type === 'owe' ? <AlertCircle className="w-7 h-7 text-red-600" /> : <DollarSign className="w-7 h-7 text-green-600" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{debt.person} <span className="text-sm font-normal text-gray-500">({debt.type === 'owe' ? 'Tôi đang nợ' : 'Người khác nợ tôi'})</span></h3>
                    <p className={`font-bold text-lg ${debt.type === 'owe' ? 'text-red-600' : 'text-green-600'}`}>{debt.amount.toLocaleString('vi-VN')} ₫</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!debt.completed && <button onClick={() => { setSelectedDebtForComplete(debt); setShowCompleteDebtModal(true); }} className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium">Hoàn thành</button>}
                  {debt.completed && <button onClick={() => completeDebt(debt.id, false)} className="px-4 py-2 bg-gray-200 text-gray-600 rounded-xl text-sm font-medium">Hoàn tác</button>}
                  <button onClick={() => handleEditDebt(debt)} className="p-2"><Edit2 className="w-5 h-5 text-gray-500" /></button>
                  <button onClick={() => delD(debt.id)} className="p-2"><Trash2 className="w-5 h-5 text-red-500" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal rút gọn logic */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-4">
            <h2 className="text-lg font-bold mb-4 dark:text-white">{editingBudget ? 'Sửa ngân sách' : 'Thêm ngân sách'}</h2>
            <form onSubmit={handleAddBudget} className="space-y-4">
              <input type="text" value={budgetForm.name} onChange={e => setBudgetForm({ ...budgetForm, name: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" required placeholder="Tên *" />
              <input type="number" value={budgetForm.limit} onChange={e => setBudgetForm({ ...budgetForm, limit: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" required placeholder="Giới hạn (₫) *" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowBudgetModal(false)} className="flex-1 p-2 border rounded">Hủy</button>
                <button type="submit" className="flex-1 p-2 bg-indigo-600 text-white rounded">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDebtModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-4">
            <h2 className="text-lg font-bold mb-4 dark:text-white">{editingDebt ? 'Sửa nợ' : 'Thêm nợ'}</h2>
            <form onSubmit={handleAddDebt} className="space-y-4">
              <div className="flex gap-2">
                <button type="button" onClick={() => setDebtForm({ ...debtForm, type: 'owe' })} className={`flex-1 p-2 rounded ${debtForm.type === 'owe' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}>Tôi nợ</button>
                <button type="button" onClick={() => setDebtForm({ ...debtForm, type: 'owed' })} className={`flex-1 p-2 rounded ${debtForm.type === 'owed' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>Họ nợ</button>
              </div>
              <input type="text" value={debtForm.person} onChange={e => setDebtForm({ ...debtForm, person: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" required placeholder="Tên *" />
              <input type="number" value={debtForm.amount} onChange={e => setDebtForm({ ...debtForm, amount: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" required placeholder="Số tiền *" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowDebtModal(false)} className="flex-1 p-2 border rounded">Hủy</button>
                <button type="submit" className="flex-1 p-2 bg-indigo-600 text-white rounded">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCompleteDebtModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-5">
            <h2 className="text-lg font-bold mb-4 dark:text-white">✅ Xác nhận trả nợ</h2>
            <label className="flex items-center gap-2 mb-4">
              <input type="checkbox" checked={createDebtTransaction} onChange={e => setCreateDebtTransaction(e.target.checked)} className="w-5 h-5" />
              <span className="dark:text-white">Tạo giao dịch thu/chi tương ứng</span>
            </label>
            <div className="flex gap-2">
              <button onClick={() => setShowCompleteDebtModal(false)} className="flex-1 p-2 border rounded">Hủy</button>
              <button onClick={handleConfirmCompleteDebt} className="flex-1 p-2 bg-green-600 text-white rounded">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

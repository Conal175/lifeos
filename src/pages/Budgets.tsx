import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTableData } from '../hooks/useData';
import { Plus, Trash2, X, DollarSign, AlertCircle, Edit2, Wallet } from 'lucide-react';
import { format, addDays, addMonths } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Budget, Debt, Transaction } from '../types';
import { getLocalDateString } from '../utils/date';

export function Budgets() {
  const { user } = useApp();
  const { data: budgets = [], isLoading: loadB, addRecord: addB, updateRecord: updateB, deleteRecord: delB } = useTableData<Budget>('budgets');
  const { data: debts = [], isLoading: loadD, addRecord: addD, updateRecord: updateD, deleteRecord: delD } = useTableData<Debt>('debts');
  
  // ĐÃ NÂNG CẤP: Kéo thêm transactions (giới hạn 365 ngày để quét đủ các ngân sách)
  const { data: transactions = [], addRecord: addTx } = useTableData<Transaction>('transactions', 'date', 365);
  
  const isLoading = loadB || loadD;

  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showCompleteDebtModal, setShowCompleteDebtModal] = useState(false);
  const [selectedDebtForComplete, setSelectedDebtForComplete] = useState<Debt | null>(null);
  const [createDebtTransaction, setCreateDebtTransaction] = useState(true);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [editingDebt, setEditingDebt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'budgets' | 'debts'>('budgets');
  
  const [budgetForm, setBudgetForm] = useState({ name: '', category: '', limit: '', period: 'month' as 'week' | 'month', startDate: getLocalDateString() });
  const [debtForm, setDebtForm] = useState({ type: 'owe' as 'owe' | 'owed', amount: '', person: '', description: '', dueDate: getLocalDateString() });

  // ĐÃ NÂNG CẤP: TỰ ĐỘNG TÍNH TOÁN SỐ TIỀN ĐÃ TIÊU THEO THỜI GIAN THỰC
  const budgetsWithCalculatedSpent = useMemo(() => {
    return budgets.map(budget => {
      const start = new Date(budget.startDate);
      const end = budget.period === 'week' ? addDays(start, 7) : addMonths(start, 1);
      
      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');

      // Lọc các giao dịch: Là chi tiêu + Đúng danh mục + Trong thời hạn ngân sách
      const actualSpent = transactions
        .filter(t => t.type === 'expense')
        .filter(t => t.category === (budget.category || budget.name))
        .filter(t => {
          const tDate = t.date.split('T')[0];
          return tDate >= startStr && tDate < endStr;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      // Ghi đè số tiền đã tiêu lên giao diện
      return { ...budget, spent: actualSpent };
    });
  }, [budgets, transactions]);

  const resetBudgetForm = () => { setBudgetForm({ name: '', category: '', limit: '', period: 'month', startDate: getLocalDateString() }); setEditingBudget(null); };
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

  const handleEditBudget = (budget: typeof budgets[0]) => { 
    setBudgetForm({ name: budget.name, category: budget.category || '', limit: budget.limit.toString(), period: budget.period, startDate: budget.startDate.split('T')[0] }); 
    setEditingBudget(budget.id); 
    setShowBudgetModal(true); 
  };
  const handleEditDebt = (debt: typeof debts[0]) => { 
    setDebtForm({ type: debt.type, amount: debt.amount.toString(), person: debt.person, description: debt.description || '', dueDate: debt.dueDate.split('T')[0] }); 
    setEditingDebt(debt.id); 
    setShowDebtModal(true); 
  };

  const handleAddBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBudget) { 
      updateB({ id: editingBudget, data: { name: budgetForm.name, category: budgetForm.category || budgetForm.name, limit: parseFloat(budgetForm.limit), period: budgetForm.period, startDate: budgetForm.startDate } }); 
    } else { 
      addB({ name: budgetForm.name, category: budgetForm.category || budgetForm.name, limit: parseFloat(budgetForm.limit), spent: 0, period: budgetForm.period, startDate: budgetForm.startDate, userId: user?.id }); 
    }
    resetBudgetForm(); setShowBudgetModal(false);
  };

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDebt) { 
      updateD({ id: editingDebt, data: { type: debtForm.type, amount: parseFloat(debtForm.amount), person: debtForm.person, description: debtForm.description, dueDate: debtForm.dueDate } }); 
    } else { 
      addD({ type: debtForm.type, amount: parseFloat(debtForm.amount), person: debtForm.person, description: debtForm.description, dueDate: debtForm.dueDate, completed: false, userId: user?.id }); 
    }
    resetDebtForm(); setShowDebtModal(false);
  };

  const handleConfirmCompleteDebt = () => { 
    if (!selectedDebtForComplete) return; 
    completeDebt(selectedDebtForComplete.id, createDebtTransaction); 
    setShowCompleteDebtModal(false); 
    setSelectedDebtForComplete(null); 
  };

  if (isLoading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Wallet className="w-7 h-7 text-indigo-600" /> Ngân sách & Quản lý Nợ</h1></div>
        <button onClick={() => { if (activeTab === 'budgets') { resetBudgetForm(); setShowBudgetModal(true); } else { resetDebtForm(); setShowDebtModal(true); } }} className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl font-medium"><Plus className="w-5 h-5" /> {activeTab === 'budgets' ? 'Thêm ngân sách' : 'Thêm khoản nợ'}</button>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        <button onClick={() => setActiveTab('budgets')} className={`px-5 py-2.5 rounded-lg font-medium ${activeTab === 'budgets' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500'}`}>💰 Ngân sách ({budgets.length})</button>
        <button onClick={() => setActiveTab('debts')} className={`px-5 py-2.5 rounded-lg font-medium ${activeTab === 'debts' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500'}`}>📋 Quản lý Nợ ({debts.length})</button>
      </div>

      {activeTab === 'budgets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetsWithCalculatedSpent.map(budget => {
            const percentage = budget.limit > 0 ? Math.min((budget.spent / budget.limit) * 100, 100) : 0;
            const colors = percentage >= 100 ? { bg: 'bg-red-500', text: 'text-red-600' } : percentage >= 80 ? { bg: 'bg-yellow-500', text: 'text-yellow-600' } : { bg: 'bg-green-500', text: 'text-green-600' };
            
            return (
              <div key={budget.id} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border dark:border-gray-700 shadow-sm">
                <div className={`h-2 ${colors.bg}`} />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">{budget.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Từ: {format(new Date(budget.startDate), 'dd/MM/yyyy')}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEditBudget(budget)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                      <button onClick={() => delB(budget.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-2"><span className="text-gray-500 dark:text-gray-400">Đã chi</span><span className={`font-bold ${colors.text}`}>{percentage.toFixed(0)}%</span></div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3"><div className={`h-3 rounded-full transition-all duration-500 ${colors.bg}`} style={{ width: `${percentage}%` }} /></div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">{budget.spent.toLocaleString('vi-VN')} ₫</span>
                      <span className="text-gray-900 dark:text-white font-medium">{budget.limit.toLocaleString('vi-VN')} ₫</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {budgets.length === 0 && (
             <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">
               Chưa có ngân sách nào. Hãy tạo ngân sách đầu tiên!
             </div>
          )}
        </div>
      )}

      {activeTab === 'debts' && (
        <div className="space-y-3">
          {debts.map(debt => (
            <div key={debt.id} className={`bg-white dark:bg-gray-800 rounded-2xl p-4 border dark:border-gray-700 shadow-sm transition-all ${debt.completed ? 'opacity-60 bg-gray-50 dark:bg-gray-800/50' : ''}`}>
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${debt.type === 'owe' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                    {debt.type === 'owe' ? <AlertCircle className="w-7 h-7 text-red-600 dark:text-red-400" /> : <DollarSign className="w-7 h-7 text-green-600 dark:text-green-400" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate">{debt.person} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({debt.type === 'owe' ? 'Tôi đang nợ' : 'Người khác nợ tôi'})</span></h3>
                    <p className={`font-bold text-lg mt-0.5 ${debt.type === 'owe' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{debt.amount.toLocaleString('vi-VN')} ₫</p>
                    {debt.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{debt.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!debt.completed && <button onClick={() => { setSelectedDebtForComplete(debt); setShowCompleteDebtModal(true); }} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors whitespace-nowrap">Hoàn thành</button>}
                  {debt.completed && <button onClick={() => completeDebt(debt.id, false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-xl text-sm font-medium transition-colors whitespace-nowrap">Hoàn tác</button>}
                  <button onClick={() => handleEditDebt(debt)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><Edit2 className="w-5 h-5 text-gray-500" /></button>
                  <button onClick={() => delD(debt.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-5 h-5 text-red-500" /></button>
                </div>
              </div>
            </div>
          ))}
          {debts.length === 0 && (
             <div className="py-12 text-center text-gray-500 dark:text-gray-400">
               Tuyệt vời! Bạn không có khoản nợ nào.
             </div>
          )}
        </div>
      )}

      {/* Modal Ngân sách */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-5 shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold dark:text-white">{editingBudget ? 'Sửa ngân sách' : 'Thêm ngân sách mới'}</h2>
              <button onClick={() => setShowBudgetModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-500"/></button>
            </div>
            <form onSubmit={handleAddBudget} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên danh mục (VD: Ăn uống, Mua sắm) *</label>
                <input type="text" value={budgetForm.name} onChange={e => setBudgetForm({ ...budgetForm, name: e.target.value })} className="w-full p-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500" required placeholder="Nhập tên danh mục..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giới hạn chi tiêu (VNĐ) *</label>
                <input type="number" value={budgetForm.limit} onChange={e => setBudgetForm({ ...budgetForm, limit: e.target.value })} className="w-full p-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500" required placeholder="VD: 5000000" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chu kỳ</label>
                  <select value={budgetForm.period} onChange={e => setBudgetForm({ ...budgetForm, period: e.target.value as 'week' | 'month' })} className="w-full p-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                    <option value="month">Hàng tháng</option>
                    <option value="week">Hàng tuần</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày bắt đầu</label>
                  <input type="date" value={budgetForm.startDate} onChange={e => setBudgetForm({ ...budgetForm, startDate: e.target.value })} className="w-full p-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" required />
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors mt-2">Lưu ngân sách</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nợ */}
      {showDebtModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-5 shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold dark:text-white">{editingDebt ? 'Sửa khoản nợ' : 'Thêm khoản nợ mới'}</h2>
              <button onClick={() => setShowDebtModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-500"/></button>
            </div>
            <form onSubmit={handleAddDebt} className="space-y-4">
              <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                <button type="button" onClick={() => setDebtForm({ ...debtForm, type: 'owe' })} className={`flex-1 py-2 rounded-lg font-medium transition-all ${debtForm.type === 'owe' ? 'bg-white dark:bg-gray-600 text-red-600 shadow-sm' : 'text-gray-500'}`}>Tôi đang nợ</button>
                <button type="button" onClick={() => setDebtForm({ ...debtForm, type: 'owed' })} className={`flex-1 py-2 rounded-lg font-medium transition-all ${debtForm.type === 'owed' ? 'bg-white dark:bg-gray-600 text-green-600 shadow-sm' : 'text-gray-500'}`}>Họ nợ tôi</button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên người liên quan *</label>
                <input type="text" value={debtForm.person} onChange={e => setDebtForm({ ...debtForm, person: e.target.value })} className="w-full p-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500" required placeholder="VD: Nguyễn Văn A" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số tiền (VNĐ) *</label>
                <input type="number" value={debtForm.amount} onChange={e => setDebtForm({ ...debtForm, amount: e.target.value })} className="w-full p-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500" required placeholder="VD: 1000000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hạn trả / thu</label>
                <input type="date" value={debtForm.dueDate} onChange={e => setDebtForm({ ...debtForm, dueDate: e.target.value })} className="w-full p-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú thêm</label>
                <input type="text" value={debtForm.description} onChange={e => setDebtForm({ ...debtForm, description: e.target.value })} className="w-full p-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" placeholder="Nội dung khoản nợ..." />
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors mt-2">Lưu khoản nợ</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác nhận trả nợ */}
      {showCompleteDebtModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold dark:text-white">Xác nhận hoàn thành?</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Bạn có chắc chắn muốn đánh dấu khoản nợ của <strong className="text-gray-900 dark:text-white">{selectedDebtForComplete?.person}</strong> đã được giải quyết?</p>
            
            <label className="flex items-start gap-3 mb-6 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <input type="checkbox" checked={createDebtTransaction} onChange={e => setCreateDebtTransaction(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 mt-0.5" />
              <div>
                <span className="block font-medium text-gray-900 dark:text-white">Tự động tạo giao dịch</span>
                <span className="block text-sm text-gray-500 dark:text-gray-400 mt-0.5">Một giao dịch {selectedDebtForComplete?.type === 'owe' ? 'Chi tiêu' : 'Thu nhập'} trị giá {selectedDebtForComplete?.amount.toLocaleString('vi-VN')}đ sẽ được thêm vào bảng Tài chính.</span>
              </div>
            </label>
            
            <div className="flex gap-3">
              <button onClick={() => setShowCompleteDebtModal(false)} className="flex-1 py-2.5 border dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Hủy</button>
              <button onClick={handleConfirmCompleteDebt} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors shadow-sm">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

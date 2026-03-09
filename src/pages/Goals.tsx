import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTableData } from '../hooks/useData';
import { SavingsGoal, Transaction } from '../types';
import { Plus, Trash2, X, PiggyBank, ArrowUpCircle, ArrowDownCircle, TrendingUp, Target, Edit2 } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { getLocalDateString } from '../utils/date';

const goalIcons = ['💰', '🏠', '🚗', '✈️', '💻', '📚', '💍', '🎓', '🏥', '🎁', '💎', '🏖️'];
const goalColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#10b981'];

export function Goals() {
  const { user } = useApp();
  const { data: savingsGoals = [], isLoading, addRecord: addG, updateRecord: updateG, deleteRecord: delG } = useTableData<SavingsGoal>('savings_goals');
  const { addRecord: addTx } = useTableData<Transaction>('transactions');

  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [showAmountModal, setShowAmountModal] = useState<{show: boolean, goalId: string, type: 'deposit' | 'withdraw'} | null>(null);
  const [amountValue, setAmountValue] = useState('');
  const [createTransaction, setCreateTransaction] = useState(true);

  const [savingsForm, setSavingsForm] = useState({ name: '', icon: '💰', target: '', current: '', deadline: new Date().toISOString().split('T')[0], color: goalColors[0] });

  const resetForm = () => { setSavingsForm({ name: '', icon: '💰', target: '', current: '', deadline: new Date().toISOString().split('T')[0], color: goalColors[0] }); setEditingGoal(null); };

  const handleEditGoal = (goal: SavingsGoal) => { setSavingsForm({ name: goal.name, icon: goal.icon, target: goal.target.toString(), current: goal.current.toString(), deadline: goal.deadline.split('T')[0], color: goal.color }); setEditingGoal(goal.id); setShowSavingsModal(true); };

  const handleAddSavingsGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGoal) {
      updateG({ id: editingGoal, data: { name: savingsForm.name, icon: savingsForm.icon, target: parseFloat(savingsForm.target), current: parseFloat(savingsForm.current) || 0, deadline: savingsForm.deadline, color: savingsForm.color } });
    } else {
      addG({ name: savingsForm.name, icon: savingsForm.icon, target: parseFloat(savingsForm.target), current: 0, deadline: savingsForm.deadline, color: savingsForm.color, userId: user?.id });
    }
    resetForm(); setShowSavingsModal(false);
  };

  const handleAmountSubmit = () => {
    if (showAmountModal && amountValue) {
      const amount = parseFloat(amountValue);
      const goal = savingsGoals.find(g => g.id === showAmountModal.goalId);
      if (goal) {
        if (showAmountModal.type === 'deposit') {
          updateG({ id: goal.id, data: { current: goal.current + amount } });
          if (createTransaction) addTx({ type: 'expense', amount, category: 'Tiết kiệm', description: `Nạp tiền vào quỹ: ${goal.name}`, date: getLocalDateString(), tags: ['savings'], userId: user?.id });
        } else {
          updateG({ id: goal.id, data: { current: Math.max(0, goal.current - amount) } });
          if (createTransaction) addTx({ type: 'income', amount, category: 'Tiết kiệm', description: `Rút tiền từ quỹ: ${goal.name}`, date: getLocalDateString(), tags: ['savings'], userId: user?.id });
        }
      }
      setShowAmountModal(null); setAmountValue(''); setCreateTransaction(true);
    }
  };

  if (isLoading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><PiggyBank className="w-7 h-7 text-indigo-600" /> Quỹ tiết kiệm</h1></div>
        <button onClick={() => { resetForm(); setShowSavingsModal(true); }} className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl font-medium"><Plus className="w-5 h-5" /> Tạo quỹ mới</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savingsGoals.map(goal => {
          const percentage = (goal.current / goal.target) * 100;
          return (
            <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b dark:border-gray-700" style={{ backgroundColor: `${goal.color}10` }}>
                <div className="flex justify-between">
                  <div className="flex items-center gap-3"><div className="text-2xl">{goal.icon}</div><h3 className="font-bold dark:text-white">{goal.name}</h3></div>
                  <div className="flex gap-1"><button onClick={() => handleEditGoal(goal)} className="p-1"><Edit2 className="w-4 h-4 text-gray-500" /></button><button onClick={() => delG(goal.id)} className="p-1"><Trash2 className="w-4 h-4 text-red-500" /></button></div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between mb-2"><span className="text-sm dark:text-gray-400">Tiến độ</span><span className="font-bold" style={{ color: goal.color }}>{percentage.toFixed(1)}%</span></div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3"><div className="h-3 rounded-full" style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: goal.color }} /></div>
                <div className="flex justify-between text-sm"><span className="dark:text-gray-400">{goal.current.toLocaleString('vi-VN')} ₫</span><span className="dark:text-white font-medium">{goal.target.toLocaleString('vi-VN')} ₫</span></div>
              </div>
              <div className="px-4 pb-4 flex gap-2">
                <button onClick={() => setShowAmountModal({ show: true, goalId: goal.id, type: 'deposit' })} className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm font-medium">Nạp tiền</button>
                <button onClick={() => setShowAmountModal({ show: true, goalId: goal.id, type: 'withdraw' })} className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 dark:text-white rounded-xl text-sm font-medium">Rút tiền</button>
              </div>
            </div>
          );
        })}
      </div>

      {showSavingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-4">
            <h2 className="text-lg font-bold mb-4 dark:text-white">{editingGoal ? 'Sửa quỹ' : 'Tạo quỹ'}</h2>
            <form onSubmit={handleAddSavingsGoal} className="space-y-4">
              <input type="text" value={savingsForm.name} onChange={e => setSavingsForm({ ...savingsForm, name: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" required placeholder="Tên quỹ *" />
              <input type="number" value={savingsForm.target} onChange={e => setSavingsForm({ ...savingsForm, target: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" required placeholder="Mục tiêu (₫) *" />
              <input type="date" value={savingsForm.deadline} onChange={e => setSavingsForm({ ...savingsForm, deadline: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" required />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowSavingsModal(false)} className="flex-1 p-2 border rounded">Hủy</button>
                <button type="submit" className="flex-1 p-2 bg-indigo-600 text-white rounded">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAmountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-4">
            <h2 className="text-lg font-bold mb-4 dark:text-white">{showAmountModal.type === 'deposit' ? 'Nạp tiền' : 'Rút tiền'}</h2>
            <input type="number" value={amountValue} onChange={e => setAmountValue(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white mb-4" required placeholder="Số tiền" />
            <label className="flex items-center gap-2 mb-4 dark:text-white">
              <input type="checkbox" checked={createTransaction} onChange={e => setCreateTransaction(e.target.checked)} className="w-5 h-5" /> Ghi nhận Thu/Chi
            </label>
            <div className="flex gap-2">
              <button onClick={() => setShowAmountModal(null)} className="flex-1 p-2 border rounded">Hủy</button>
              <button onClick={handleAmountSubmit} className="flex-1 p-2 bg-indigo-600 text-white rounded">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

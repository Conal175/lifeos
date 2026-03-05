import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Trash2, X, PiggyBank, ArrowUpCircle, ArrowDownCircle, TrendingUp, Target, Edit2 } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';

const goalIcons = ['💰', '🏠', '🚗', '✈️', '💻', '📚', '💍', '🎓', '🏥', '🎁', '💎', '🏖️'];
const goalColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#10b981'];

export function Goals() {
  const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, addToSavingsGoal, withdrawFromSavingsGoal } = useApp();
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [showAmountModal, setShowAmountModal] = useState<{show: boolean, goalId: string, type: 'deposit' | 'withdraw'} | null>(null);
  const [amountValue, setAmountValue] = useState('');
  const [createTransaction, setCreateTransaction] = useState(true);

  const [savingsForm, setSavingsForm] = useState({
    name: '',
    icon: '💰',
    target: '',
    current: '',
    deadline: new Date().toISOString().split('T')[0],
    color: goalColors[0]
  });

  const resetForm = () => {
    setSavingsForm({
      name: '',
      icon: '💰',
      target: '',
      current: '',
      deadline: new Date().toISOString().split('T')[0],
      color: goalColors[0]
    });
    setEditingGoal(null);
  };

  const handleEditGoal = (goal: typeof savingsGoals[0]) => {
    setSavingsForm({
      name: goal.name,
      icon: goal.icon,
      target: goal.target.toString(),
      current: goal.current.toString(),
      deadline: goal.deadline.split('T')[0],
      color: goal.color
    });
    setEditingGoal(goal.id);
    setShowSavingsModal(true);
  };

  const handleAddSavingsGoal = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingGoal) {
      updateSavingsGoal(editingGoal, {
        name: savingsForm.name,
        icon: savingsForm.icon,
        target: parseFloat(savingsForm.target),
        current: parseFloat(savingsForm.current) || 0,
        deadline: savingsForm.deadline,
        color: savingsForm.color
      });
    } else {
      addSavingsGoal({
        name: savingsForm.name,
        icon: savingsForm.icon,
        target: parseFloat(savingsForm.target),
        current: 0,
        deadline: savingsForm.deadline,
        color: savingsForm.color
      });
    }
    
    resetForm();
    setShowSavingsModal(false);
  };

  const handleAmountSubmit = () => {
    if (showAmountModal && amountValue) {
      const amount = parseFloat(amountValue);
      if (showAmountModal.type === 'deposit') {
        addToSavingsGoal(showAmountModal.goalId, amount, createTransaction);
      } else {
        withdrawFromSavingsGoal(showAmountModal.goalId, amount, createTransaction);
      }
      setShowAmountModal(null);
      setAmountValue('');
      setCreateTransaction(true); // Reset for next time
    }
  };

  // Stats
  const totalTarget = savingsGoals.reduce((sum, g) => sum + g.target, 0);
  const totalCurrent = savingsGoals.reduce((sum, g) => sum + g.current, 0);
  const completedGoals = savingsGoals.filter(g => g.current >= g.target).length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <PiggyBank className="w-7 h-7 text-indigo-600" />
            Mục tiêu tiết kiệm
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Quản lý các quỹ tiết kiệm của bạn
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowSavingsModal(true); }}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 font-medium"
        >
          <Plus className="w-5 h-5" /> Tạo quỹ mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border dark:border-gray-700">
          <div className="flex items-center gap-2 text-indigo-600 mb-2">
            <Target className="w-5 h-5" />
            <span className="text-sm font-medium">Tổng mục tiêu</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalTarget.toLocaleString('vi-VN')} ₫
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border dark:border-gray-700">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium">Đã tiết kiệm</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalCurrent.toLocaleString('vi-VN')} ₫
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border dark:border-gray-700">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <PiggyBank className="w-5 h-5" />
            <span className="text-sm font-medium">Tiến độ chung</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalTarget > 0 ? ((totalCurrent / totalTarget) * 100).toFixed(1) : 0}%
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border dark:border-gray-700">
          <div className="flex items-center gap-2 text-orange-600 mb-2">
            <span className="text-lg">🎯</span>
            <span className="text-sm font-medium">Đã hoàn thành</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {completedGoals}/{savingsGoals.length}
          </p>
        </div>
      </div>

      {/* Savings Goals Grid */}
      {savingsGoals.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border dark:border-gray-700 text-center">
          <div className="text-6xl mb-4">🐷</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Chưa có quỹ tiết kiệm nào</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Bắt đầu tiết kiệm cho mục tiêu của bạn ngay hôm nay!</p>
          <button
            onClick={() => { resetForm(); setShowSavingsModal(true); }}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5" /> Tạo quỹ đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savingsGoals.map(goal => {
            const percentage = (goal.current / goal.target) * 100;
            const daysLeft = differenceInDays(new Date(goal.deadline), new Date());
            const isCompleted = goal.current >= goal.target;
            
            return (
              <div key={goal.id} className={`bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border dark:border-gray-700 transition-all hover:shadow-lg ${isCompleted ? 'ring-2 ring-green-500' : ''}`}>
                {/* Header */}
                <div className="p-4 border-b dark:border-gray-700" style={{ backgroundColor: `${goal.color}10` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm" style={{ backgroundColor: `${goal.color}20` }}>
                        {goal.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{goal.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Hạn: {format(new Date(goal.deadline), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleEditGoal(goal)} 
                        className="p-1.5 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </button>
                      <button 
                        onClick={() => deleteSavingsGoal(goal.id)} 
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Tiến độ</span>
                    <span className={`text-sm font-bold ${isCompleted ? 'text-green-600' : ''}`} style={{ color: isCompleted ? undefined : goal.color }}>
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : ''}`}
                      style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: isCompleted ? undefined : goal.color }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {goal.current.toLocaleString('vi-VN')} ₫
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {goal.target.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-4 pb-4">
                  {isCompleted ? (
                    <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-center py-3 rounded-xl font-semibold text-sm">
                      🎉 Đã hoàn thành mục tiêu!
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                        <span>Còn {Math.max(0, goal.target - goal.current).toLocaleString('vi-VN')} ₫</span>
                        <span className={daysLeft < 0 ? 'text-red-500' : daysLeft <= 7 ? 'text-orange-500' : ''}>
                          {daysLeft > 0 ? `Còn ${daysLeft} ngày` : daysLeft === 0 ? 'Hôm nay là hạn chót' : 'Đã quá hạn'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowAmountModal({ show: true, goalId: goal.id, type: 'deposit' })}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                          <ArrowUpCircle className="w-4 h-4" /> Nạp tiền
                        </button>
                        <button
                          onClick={() => setShowAmountModal({ show: true, goalId: goal.id, type: 'withdraw' })}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors"
                        >
                          <ArrowDownCircle className="w-4 h-4" /> Rút tiền
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Savings Goal Modal */}
      {showSavingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingGoal ? '✏️ Chỉnh sửa quỹ tiết kiệm' : '🐷 Tạo quỹ tiết kiệm'}
              </h2>
              <button onClick={() => { setShowSavingsModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSavingsGoal} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên quỹ *</label>
                <input
                  type="text"
                  value={savingsForm.name}
                  onChange={(e) => setSavingsForm({ ...savingsForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="VD: Mua nhà, Du lịch..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon</label>
                <div className="flex gap-2 flex-wrap">
                  {goalIcons.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setSavingsForm({ ...savingsForm, icon })}
                      className={`w-10 h-10 text-xl rounded-xl transition-all flex items-center justify-center ${savingsForm.icon === icon ? 'bg-indigo-100 dark:bg-indigo-900 ring-2 ring-indigo-500 scale-110' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Màu sắc</label>
                <div className="flex gap-2 flex-wrap">
                  {goalColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSavingsForm({ ...savingsForm, color })}
                      className={`w-8 h-8 rounded-full transition-all ${savingsForm.color === color ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mục tiêu (₫) *</label>
                <input
                  type="number"
                  value={savingsForm.target}
                  onChange={(e) => setSavingsForm({ ...savingsForm, target: e.target.value })}
                  className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="10,000,000"
                  required
                  min="0"
                />
              </div>
              {editingGoal && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số tiền hiện có (₫)</label>
                  <input
                    type="number"
                    value={savingsForm.current}
                    onChange={(e) => setSavingsForm({ ...savingsForm, current: e.target.value })}
                    className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="0"
                    min="0"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hạn chót *</label>
                <input
                  type="date"
                  value={savingsForm.deadline}
                  onChange={(e) => setSavingsForm({ ...savingsForm, deadline: e.target.value })}
                  className="w-full px-3 py-2.5 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all">
                {editingGoal ? '💾 Cập nhật' : '✨ Tạo quỹ'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Amount Modal with Transaction Option */}
      {showAmountModal && (() => {
        const goal = savingsGoals.find(g => g.id === showAmountModal.goalId);
        if (!goal) return null;
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl">
              <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>{goal.icon}</span>
                  {showAmountModal.type === 'deposit' ? 'Nạp vào quỹ' : 'Rút từ quỹ'}
                </h2>
                <button onClick={() => { setShowAmountModal(null); setAmountValue(''); setCreateTransaction(true); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Số dư hiện tại</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{goal.current.toLocaleString('vi-VN')} ₫</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số tiền *</label>
                  <input
                    type="number"
                    value={amountValue}
                    onChange={(e) => setAmountValue(e.target.value)}
                    className="w-full px-3 py-3 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-lg font-bold text-center"
                    required
                    min="0"
                    autoFocus
                    placeholder="Nhập số tiền..."
                  />
                </div>
                
                {/* Transaction Checkbox */}
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createTransaction}
                      onChange={(e) => setCreateTransaction(e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Tạo giao dịch tương ứng
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {showAmountModal.type === 'deposit' 
                          ? '💸 Ghi nhận chi tiêu (tiền chuyển vào quỹ)'
                          : '💰 Ghi nhận thu nhập (tiền rút từ quỹ)'}
                      </p>
                    </div>
                  </label>
                </div>
                
                {/* Preview Impact */}
                {amountValue && parseFloat(amountValue) > 0 && (
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Sau giao dịch:</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {(showAmountModal.type === 'deposit' 
                          ? goal.current + parseFloat(amountValue)
                          : Math.max(0, goal.current - parseFloat(amountValue))
                        ).toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                    {createTransaction && (
                      <div className="flex items-center justify-between text-xs pt-1 border-t dark:border-gray-600 mt-2">
                        <span className="text-gray-500 dark:text-gray-400">Tác động số dư:</span>
                        <span className={showAmountModal.type === 'deposit' ? 'text-red-600' : 'text-green-600'}>
                          {showAmountModal.type === 'deposit' ? '-' : '+'}{parseFloat(amountValue).toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowAmountModal(null); setAmountValue(''); setCreateTransaction(true); }}
                    className="flex-1 py-2.5 border dark:border-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleAmountSubmit}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${
                      showAmountModal.type === 'deposit' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {showAmountModal.type === 'deposit' ? '💰 Nạp tiền' : '💸 Rút tiền'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTableData } from '../hooks/useData';
import { Investment } from '../types';
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Edit2, X, PieChart, BarChart3 } from 'lucide-react';

export function Investments() {
  const { user } = useApp();
  const { data: investments = [], isLoading, addRecord, updateRecord, deleteRecord } = useTableData<Investment>('investments');
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', type: 'stock' as 'stock' | 'crypto' | 'gold' | 'other',
    quantity: '', avgPrice: '', currentPrice: ''
  });

  const totalCapital = investments.reduce((s, i) => s + i.quantity * i.avgPrice, 0);
  const totalValue = investments.reduce((s, i) => s + i.quantity * i.currentPrice, 0);
  const totalPnL = totalValue - totalCapital;
  const pnlPercent = totalCapital > 0 ? (totalPnL / totalCapital) * 100 : 0;

  const typeLabels: Record<string, { label: string; emoji: string; color: string }> = {
    stock: { label: 'Cổ phiếu', emoji: '📈', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    crypto: { label: 'Crypto', emoji: '🪙', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    gold: { label: 'Vàng', emoji: '🥇', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    other: { label: 'Khác', emoji: '📦', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400' }
  };

  const byType = investments.reduce((acc, inv) => {
    const val = inv.quantity * inv.currentPrice;
    acc[inv.type] = (acc[inv.type] || 0) + val;
    return acc;
  }, {} as Record<string, number>);

  const openCreate = () => { setEditingId(null); setForm({ name: '', type: 'stock', quantity: '', avgPrice: '', currentPrice: '' }); setShowModal(true); };
  const openEdit = (inv: typeof investments[0]) => { setEditingId(inv.id); setForm({ name: inv.name, type: inv.type, quantity: inv.quantity.toString(), avgPrice: inv.avgPrice.toString(), currentPrice: inv.currentPrice.toString() }); setShowModal(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name: form.name, type: form.type, quantity: parseFloat(form.quantity), avgPrice: parseFloat(form.avgPrice), currentPrice: parseFloat(form.currentPrice) };
    if (editingId) {
      updateRecord({ id: editingId, data });
    } else {
      addRecord({ ...data, userId: user?.id });
    }
    setShowModal(false);
  };

  if (isLoading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">💹 Quản lý Đầu tư</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Theo dõi danh mục đầu tư đa tài sản</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/25">
          <Plus className="w-5 h-5" /> Thêm tài sản
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500 dark:text-gray-400">Tổng vốn đầu tư</p><p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalCapital.toLocaleString('vi-VN')} ₫</p></div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center"><DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500 dark:text-gray-400">Giá trị hiện tại</p><p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalValue.toLocaleString('vi-VN')} ₫</p></div>
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center"><BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500 dark:text-gray-400">Lợi nhuận / Lỗ</p><p className={`text-2xl font-bold mt-1 ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>{totalPnL >= 0 ? '+' : ''}{totalPnL.toLocaleString('vi-VN')} ₫</p></div>
            <div className={`w-12 h-12 ${totalPnL >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} rounded-xl flex items-center justify-center`}>{totalPnL >= 0 ? <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" /> : <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500 dark:text-gray-400">Tỷ lệ lợi nhuận</p><p className={`text-2xl font-bold mt-1 ${pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>{pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%</p></div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center"><PieChart className="w-6 h-6 text-purple-600 dark:text-purple-400" /></div>
          </div>
        </div>
      </div>

      {investments.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">📊 Phân bổ danh mục</h3>
            <div className="space-y-3">
              {Object.entries(byType).map(([type, value]) => {
                const pct = totalValue > 0 ? (value / totalValue) * 100 : 0;
                const info = typeLabels[type];
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between text-sm mb-1"><span className="flex items-center gap-2"><span>{info.emoji}</span><span className="text-gray-700 dark:text-gray-300">{info.label}</span></span><span className="text-gray-500 dark:text-gray-400">{pct.toFixed(1)}%</span></div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">🏆 Top lợi nhuận</h3>
            <div className="space-y-3">
              {[...investments].sort((a, b) => (((b.currentPrice - b.avgPrice) / b.avgPrice) * 100) - (((a.currentPrice - a.avgPrice) / a.avgPrice) * 100)).slice(0, 5).map(inv => {
                const pnlPct = inv.avgPrice > 0 ? ((inv.currentPrice - inv.avgPrice) / inv.avgPrice) * 100 : 0;
                return (
                  <div key={inv.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-2"><span>{typeLabels[inv.type].emoji}</span><span className="font-medium text-gray-900 dark:text-white">{inv.name}</span></div>
                    <span className={`font-semibold ${pnlPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>{pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">💰 Giá trị tài sản</h3>
            <div className="space-y-3">
              {[...investments].sort((a, b) => (b.quantity * b.currentPrice) - (a.quantity * a.currentPrice)).slice(0, 5).map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2"><span>{typeLabels[inv.type].emoji}</span><span className="font-medium text-gray-900 dark:text-white">{inv.name}</span></div>
                  <span className="font-semibold text-gray-900 dark:text-white">{(inv.quantity * inv.currentPrice).toLocaleString('vi-VN')} ₫</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"><h3 className="font-semibold text-gray-900 dark:text-white">📋 Danh sách tài sản</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tài sản</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Loại</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Số lượng</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Giá vốn</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Giá hiện tại</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tổng vốn</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Giá trị</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Lãi/Lỗ</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {investments.map(inv => {
                const capital = inv.quantity * inv.avgPrice;
                const value = inv.quantity * inv.currentPrice;
                const pnl = value - capital;
                const pnlPct = inv.avgPrice > 0 ? ((inv.currentPrice - inv.avgPrice) / inv.avgPrice) * 100 : 0;
                const info = typeLabels[inv.type];
                return (
                  <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-xl">{info.emoji}</div><span className="font-semibold text-gray-900 dark:text-white">{inv.name}</span></div></td>
                    <td className="px-4 py-4"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${info.color}`}>{info.label}</span></td>
                    <td className="px-4 py-4 text-right font-medium text-gray-900 dark:text-white">{inv.quantity.toLocaleString('vi-VN')}</td>
                    <td className="px-4 py-4 text-right text-gray-600 dark:text-gray-400">{inv.avgPrice.toLocaleString('vi-VN')} ₫</td>
                    <td className="px-4 py-4 text-right"><input type="number" value={inv.currentPrice} onChange={e => updateRecord({ id: inv.id, data: { currentPrice: parseFloat(e.target.value) || 0 }})} className="w-28 px-2 py-1.5 border dark:border-gray-600 rounded-lg text-right dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" /></td>
                    <td className="px-4 py-4 text-right text-gray-600 dark:text-gray-400">{capital.toLocaleString('vi-VN')} ₫</td>
                    <td className="px-4 py-4 text-right font-semibold text-gray-900 dark:text-white">{value.toLocaleString('vi-VN')} ₫</td>
                    <td className="px-4 py-4 text-right"><div className={`font-semibold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>{pnl >= 0 ? '+' : ''}{pnl.toLocaleString('vi-VN')} ₫</div><div className={`text-xs ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{pnlPct >= 0 ? '↑' : '↓'} {Math.abs(pnlPct).toFixed(2)}%</div></td>
                    <td className="px-4 py-4"><div className="flex items-center justify-center gap-1"><button onClick={() => openEdit(inv)} className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"><Edit2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /></button><button onClick={() => deleteRecord(inv.id)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-red-500" /></button></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {investments.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4"><DollarSign className="w-8 h-8 text-gray-400" /></div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Chưa có tài sản đầu tư</h3>
              <button onClick={openCreate} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg mt-4"><Plus className="w-4 h-4" /> Thêm tài sản đầu tiên</button>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl animate-fadeIn">
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{editingId ? '✏️ Chỉnh sửa tài sản' : '➕ Thêm tài sản mới'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên tài sản</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="VD: VNM, BTC, Vàng SJC..." className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loại tài sản</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['stock', 'crypto', 'gold', 'other'] as const).map(type => (
                    <button key={type} type="button" onClick={() => setForm({ ...form, type })} className={`p-3 rounded-xl border-2 transition-all ${form.type === type ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}`}>
                      <div className="text-2xl mb-1">{typeLabels[type].emoji}</div>
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400">{typeLabels[type].label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số lượng</label>
                <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="VD: 100" className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500" required step="any" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giá mua trung bình</label><input type="number" value={form.avgPrice} onChange={e => setForm({ ...form, avgPrice: e.target.value })} placeholder="VD: 50000" className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giá hiện tại</label><input type="number" value={form.currentPrice} onChange={e => setForm({ ...form, currentPrice: e.target.value })} placeholder="VD: 55000" className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500" required /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors">Hủy</button>
                <button type="submit" className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-all">{editingId ? 'Cập nhật' : 'Thêm mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

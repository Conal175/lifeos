import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTableData } from '../hooks/useData';
import { Transaction, Budget } from '../types';
import { Plus, Search, ArrowUpRight, ArrowDownRight, Trash2, Edit2, X, Filter, Calendar, Tag, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

type DateFilterType = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

export function Finance() {
  const { user } = useApp();
  const { data: transactions = [], isLoading: loadT, addRecord, updateRecord, deleteRecord } = useTableData<Transaction>('transactions', 'date', 60);
  const { data: budgets = [], isLoading: loadB } = useTableData<Budget>('budgets');
  
  const isLoading = loadT || loadB;

  // ĐÃ SỬA CHUẨN 100%: Quét toàn bộ Ngân sách và xóa sạch các danh mục mẫu (như Lương, Ăn uống)
  const categories = useMemo(() => {
    // Lấy danh sách tên Ngân sách (ưu tiên category, nếu không có thì lấy name)
    const budgetCategories = budgets.map(b => b.category || b.name).filter(Boolean);
    const uniqueCategories = Array.from(new Set(budgetCategories));
    
    // Nếu chưa tạo Ngân sách nào, tự động tạo 1 mục tên là "Chưa phân loại"
    if (uniqueCategories.length === 0) {
      return ['Chưa phân loại'];
    }
    return uniqueCategories;
  }, [budgets]);

  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '', category: categories[0] || 'Chưa phân loại', description: '', tags: '',
    date: new Date().toISOString().split('T')[0]
  });

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    transactions.forEach(t => t.tags?.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet);
  }, [transactions]);

  const getDateRange = (filterType: DateFilterType): { start: Date; end: Date } | null => {
    const now = new Date();
    switch (filterType) {
      case 'today': return { start: startOfDay(now), end: endOfDay(now) };
      case 'week': return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'month': return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'year': return { start: startOfYear(now), end: endOfYear(now) };
      case 'custom': return (customDateFrom && customDateTo) ? { start: startOfDay(parseISO(customDateFrom)), end: endOfDay(parseISO(customDateTo)) } : null;
      default: return null;
    }
  };

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (typeFilter !== 'all') result = result.filter(t => t.type === typeFilter);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => t.description?.toLowerCase().includes(term) || t.category.toLowerCase().includes(term) || t.tags?.some(tag => tag.toLowerCase().includes(term)));
    }
    const dateRange = getDateRange(dateFilter);
    if (dateRange) result = result.filter(t => isWithinInterval(parseISO(t.date), dateRange));
    if (selectedCategories.length > 0) result = result.filter(t => selectedCategories.includes(t.category));
    if (selectedTags.length > 0) result = result.filter(t => t.tags?.some(tag => selectedTags.includes(tag)));
    
    return [...result].sort((a, b) => {
      let comparison = sortBy === 'date' ? new Date(a.date).getTime() - new Date(b.date).getTime() : a.amount - b.amount;
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [transactions, typeFilter, searchTerm, dateFilter, customDateFrom, customDateTo, selectedCategories, selectedTags, sortBy, sortOrder]);

  const filteredBalance = filteredTransactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
    const txData = {
      type: formData.type, amount: parseFloat(formData.amount), category: formData.category,
      description: formData.description, tags: tagsArray, date: formData.date
    };

    if (editingTransaction) {
      updateRecord({ id: editingTransaction, data: txData });
    } else {
      addRecord({ ...txData, userId: user?.id });
    }
    resetForm(); setShowModal(false);
  };

  const resetForm = () => {
    // Tự động gán category bằng Ngân sách đầu tiên tìm thấy
    setFormData({ type: 'expense', amount: '', category: categories[0] || 'Chưa phân loại', description: '', tags: '', date: new Date().toISOString().split('T')[0] });
    setEditingTransaction(null);
  };

  const resetFilters = () => {
    setTypeFilter('all'); setSearchTerm(''); setDateFilter('all'); setCustomDateFrom(''); setCustomDateTo(''); setSelectedCategories([]); setSelectedTags([]); setSortBy('date'); setSortOrder('desc');
  };

  const handleEdit = (transaction: Transaction) => {
    setFormData({ type: transaction.type, amount: transaction.amount.toString(), category: transaction.category, description: transaction.description || '', tags: transaction.tags?.join(', ') || '', date: transaction.date.split('T')[0] });
    setEditingTransaction(transaction.id); setShowModal(true);
  };

  const toggleCategory = (category: string) => setSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
  const toggleTag = (tag: string) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const activeFiltersCount = [typeFilter !== 'all', dateFilter !== 'all', selectedCategories.length > 0, selectedTags.length > 0].filter(Boolean).length;

  if (isLoading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">💰 Giao dịch Thu - Chi</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý và theo dõi các giao dịch tài chính của bạn</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg font-medium">
          <Plus className="w-5 h-5" /> Thêm giao dịch
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Số dư (theo lọc)</p>
          <p className={`text-2xl font-bold ${filteredBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{filteredBalance >= 0 ? '+' : ''}{filteredBalance.toLocaleString('vi-VN')} ₫</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Tổng thu</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">+{totalIncome.toLocaleString('vi-VN')} ₫</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Tổng chi</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">-{totalExpense.toLocaleString('vi-VN')} ₫</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Tìm kiếm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${showFilters || activeFiltersCount > 0 ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 border dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}>
          <Filter className="w-5 h-5" /> Bộ lọc nâng cao {activeFiltersCount > 0 && <span className="bg-white text-indigo-600 px-2 py-0.5 rounded-full text-xs font-bold">{activeFiltersCount}</span>}
        </button>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Ngày</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Loại</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Danh mục</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Mô tả</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Tags</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">Số tiền</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {filteredTransactions.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">Không có giao dịch nào</td></tr>
              ) : (
                filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-medium dark:text-white">{format(new Date(t.date), 'dd/MM/yyyy')}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.type === 'income' ? 'Thu' : 'Chi'}</span></td>
                    <td className="px-4 py-3 text-sm dark:text-white">{t.category}</td>
                    <td className="px-4 py-3 text-sm dark:text-white truncate max-w-[200px]">{t.description || '-'}</td>
                    <td className="px-4 py-3 flex gap-1 flex-wrap">{t.tags?.map((tag, i) => <span key={i} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">#{tag}</span>)}</td>
                    <td className={`px-4 py-3 text-sm font-bold text-right ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString('vi-VN')} ₫</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleEdit(t)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                      <button onClick={() => deleteRecord(t.id)} className="p-2 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold dark:text-white">{editingTransaction ? 'Chỉnh sửa' : 'Thêm mới'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="flex gap-2">
                <button type="button" onClick={() => setFormData({ ...formData, type: 'income' })} className={`flex-1 py-3 rounded-xl font-medium ${formData.type === 'income' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>Thu nhập</button>
                <button type="button" onClick={() => setFormData({ ...formData, type: 'expense' })} className={`flex-1 py-3 rounded-xl font-medium ${formData.type === 'expense' ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>Chi tiêu</button>
              </div>
              <input type="number" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="Số tiền *" className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white" />
              
              {/* SELECT BOX CHỈ HIỂN THỊ CÁC NGÂN SÁCH ĐÃ TẠO */}
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white">
                {categories.map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>

              <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Mô tả..." className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white" />
              <input type="text" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} placeholder="Tags (phẩy cách nhau)..." className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white" />
              <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white" />
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition-colors">{editingTransaction ? 'Cập nhật' : 'Thêm giao dịch'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

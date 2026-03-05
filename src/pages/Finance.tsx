import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Search, ArrowUpRight, ArrowDownRight, Trash2, Edit2, X, Filter, Calendar, Tag, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

const categories = ['Lương', 'Kinh doanh', 'Đầu tư', 'Ăn uống', 'Mua sắm', 'Di chuyển', 'Giải trí', 'Y tế', 'Học tập', 'Khác'];

type DateFilterType = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

export function Finance() {
  const { transactions, addTransaction, deleteTransaction, updateTransaction } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Basic filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Advanced filters
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: 'Ăn uống',
    description: '',
    tags: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Get all unique tags from transactions
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    transactions.forEach(t => t.tags.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet);
  }, [transactions]);

  // Get date range based on filter type
  const getDateRange = (filterType: DateFilterType): { start: Date; end: Date } | null => {
    const now = new Date();
    switch (filterType) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'custom':
        if (customDateFrom && customDateTo) {
          return { start: startOfDay(parseISO(customDateFrom)), end: endOfDay(parseISO(customDateTo)) };
        }
        return null;
      default:
        return null;
    }
  };

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let result = transactions;
    
    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(t => t.type === typeFilter);
    }
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.description.toLowerCase().includes(term) ||
        t.category.toLowerCase().includes(term) ||
        t.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    // Date filter
    const dateRange = getDateRange(dateFilter);
    if (dateRange) {
      result = result.filter(t => {
        const transactionDate = parseISO(t.date);
        return isWithinInterval(transactionDate, dateRange);
      });
    }
    
    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter(t => selectedCategories.includes(t.category));
    }
    
    // Tags filter
    if (selectedTags.length > 0) {
      result = result.filter(t => t.tags.some(tag => selectedTags.includes(tag)));
    }
    
    // Sorting
    result = [...result].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        comparison = a.amount - b.amount;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return result;
  }, [transactions, typeFilter, searchTerm, dateFilter, customDateFrom, customDateTo, selectedCategories, selectedTags, sortBy, sortOrder]);

  const filteredBalance = filteredTransactions.reduce((acc, t) => {
    return t.type === 'income' ? acc + t.amount : acc - t.amount;
  }, 0);

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
    
    if (editingTransaction) {
      updateTransaction(editingTransaction, {
        type: formData.type,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        tags: tagsArray,
        date: formData.date
      });
    } else {
      // userId will be added by AppContext.addTransaction automatically
      const newTx = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        tags: tagsArray,
        date: formData.date
      };
      // Cast to any to bypass TypeScript check - userId is added in context
      addTransaction(newTx as any);
    }
    
    resetForm();
    setShowModal(false);
  };

  const resetForm = () => {
    setFormData({
      type: 'expense',
      amount: '',
      category: 'Ăn uống',
      description: '',
      tags: '',
      date: new Date().toISOString().split('T')[0]
    });
    setEditingTransaction(null);
  };

  const resetFilters = () => {
    setTypeFilter('all');
    setSearchTerm('');
    setDateFilter('all');
    setCustomDateFrom('');
    setCustomDateTo('');
    setSelectedCategories([]);
    setSelectedTags([]);
    setSortBy('date');
    setSortOrder('desc');
  };

  const handleEdit = (transaction: typeof transactions[0]) => {
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      category: transaction.category,
      description: transaction.description,
      tags: transaction.tags.join(', '),
      date: transaction.date.split('T')[0]
    });
    setEditingTransaction(transaction.id);
    setShowModal(true);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const activeFiltersCount = [
    typeFilter !== 'all',
    dateFilter !== 'all',
    selectedCategories.length > 0,
    selectedTags.length > 0
  ].filter(Boolean).length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">💰 Giao dịch Thu - Chi</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý và theo dõi các giao dịch tài chính của bạn
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 font-medium"
        >
          <Plus className="w-5 h-5" /> Thêm giao dịch
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Số dư (theo lọc)</p>
          <p className={`text-2xl font-bold ${filteredBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {filteredBalance >= 0 ? '+' : ''}{filteredBalance.toLocaleString('vi-VN')} ₫
          </p>
          <p className="text-xs text-gray-400 mt-1">{filteredTransactions.length} giao dịch</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Tổng thu</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            +{totalIncome.toLocaleString('vi-VN')} ₫
          </p>
          <p className="text-xs text-gray-400 mt-1">{filteredTransactions.filter(t => t.type === 'income').length} giao dịch</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Tổng chi</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            -{totalExpense.toLocaleString('vi-VN')} ₫
          </p>
          <p className="text-xs text-gray-400 mt-1">{filteredTransactions.filter(t => t.type === 'expense').length} giao dịch</p>
        </div>
      </div>

      {/* Search and Filter Toggle */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mô tả, danh mục, tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
            showFilters || activeFiltersCount > 0
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-gray-800 border dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Filter className="w-5 h-5" />
          Bộ lọc nâng cao
          {activeFiltersCount > 0 && (
            <span className="bg-white text-indigo-600 px-2 py-0.5 rounded-full text-xs font-bold">
              {activeFiltersCount}
            </span>
          )}
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border dark:border-gray-700 space-y-5 animate-slideDown">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-indigo-600" />
              Bộ lọc nâng cao
            </h3>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Đặt lại
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Loại giao dịch
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'Tất cả', color: 'bg-gray-100 dark:bg-gray-700' },
                  { value: 'income', label: 'Thu', color: 'bg-green-600' },
                  { value: 'expense', label: 'Chi', color: 'bg-red-600' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTypeFilter(opt.value as any)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      typeFilter === opt.value
                        ? opt.value === 'all' 
                          ? 'bg-indigo-600 text-white' 
                          : `${opt.color} text-white`
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Thời gian
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Tất cả</option>
                <option value="today">Hôm nay</option>
                <option value="week">Tuần này</option>
                <option value="month">Tháng này</option>
                <option value="year">Năm nay</option>
                <option value="custom">Tùy chọn...</option>
              </select>
            </div>

            {/* Custom Date Range */}
            {dateFilter === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </>
            )}

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sắp xếp theo
              </label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
                  className="flex-1 px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="date">Ngày</option>
                  <option value="amount">Số tiền</option>
                </select>
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  title={sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              📂 Danh mục
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedCategories.includes(cat)
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
              {selectedCategories.length > 0 && (
                <button
                  onClick={() => setSelectedCategories([])}
                  className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Bỏ chọn tất cả
                </button>
              )}
            </div>
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                <Tag className="w-4 h-4" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    Bỏ chọn tất cả
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Active Filters Summary */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 pt-3 border-t dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Đang lọc:</span>
              {typeFilter !== 'all' && (
                <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-xs font-medium">
                  {typeFilter === 'income' ? 'Thu' : 'Chi'}
                </span>
              )}
              {dateFilter !== 'all' && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs font-medium">
                  {dateFilter === 'today' && 'Hôm nay'}
                  {dateFilter === 'week' && 'Tuần này'}
                  {dateFilter === 'month' && 'Tháng này'}
                  {dateFilter === 'year' && 'Năm nay'}
                  {dateFilter === 'custom' && 'Tùy chọn'}
                </span>
              )}
              {selectedCategories.length > 0 && (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded text-xs font-medium">
                  {selectedCategories.length} danh mục
                </span>
              )}
              {selectedTags.length > 0 && (
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs font-medium">
                  {selectedTags.length} tags
                </span>
              )}
            </div>
          )}
        </div>
      )}

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
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="text-gray-400 dark:text-gray-500">
                      <div className="text-4xl mb-3">📭</div>
                      <p className="font-medium">Không có giao dịch nào</p>
                      <p className="text-sm mt-1">
                        {activeFiltersCount > 0 ? 'Thử thay đổi bộ lọc để xem thêm kết quả' : 'Bắt đầu thêm giao dịch đầu tiên'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 dark:text-white font-medium">
                        {format(new Date(t.date), 'dd/MM/yyyy')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(t.date), 'EEEE', { locale: vi })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        t.type === 'income' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {t.type === 'income' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {t.type === 'income' ? 'Thu' : 'Chi'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{t.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-[200px] truncate">
                      {t.description || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {t.tags.length > 0 ? t.tags.map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded text-xs font-medium">
                            #{tag}
                          </span>
                        )) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-sm font-bold text-right ${
                      t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleEdit(t)} 
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                        <button 
                          onClick={() => deleteTransaction(t.id)} 
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
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
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingTransaction ? '✏️ Chỉnh sửa giao dịch' : '➕ Thêm giao dịch mới'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${formData.type === 'income' ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                >
                  💰 Thu nhập
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${formData.type === 'expense' ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                >
                  💸 Chi tiêu
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Số tiền *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-lg font-semibold"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Danh mục *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Mô tả</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Mô tả giao dịch..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Tags (phân cách bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="muasam, thangnay, giamgia"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Ngày *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all shadow-lg"
              >
                {editingTransaction ? '💾 Cập nhật' : '✨ Thêm giao dịch'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

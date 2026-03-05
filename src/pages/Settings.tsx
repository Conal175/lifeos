import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Sun, Moon, Globe, DollarSign, Calendar, Upload, Download, AlertTriangle, User, Shield } from 'lucide-react';

const avatars = ['👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼'];
const currencies = ['VND', 'USD', 'EUR', 'JPY', 'CNY', 'KRW'];
const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

export function Settings() {
  const { user, updateUser, theme, toggleTheme, language, setLanguage, exportData, importDataFromFile, deleteAllData } = useApp();
  const [activeTab, setActiveTab] = useState<'profile' | 'general' | 'data'>('profile');
  const [deleteStep, setDeleteStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || 0);
  const [notifEmail, setNotifEmail] = useState(user?.notifications.email ?? true);
  const [notifPush, setNotifPush] = useState(user?.notifications.push ?? true);
  const [notifReminders, setNotifReminders] = useState(user?.notifications.reminders ?? true);

  const saveProfile = () => {
    updateUser({
      name,
      avatar: selectedAvatar,
      notifications: { email: notifEmail, push: notifPush, reminders: notifReminders }
    });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          importDataFromFile(ev.target?.result as string);
        } catch {
          alert('File không hợp lệ!');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDelete = () => {
    if (deleteStep === 0) setDeleteStep(1);
    else if (deleteStep === 1) setDeleteStep(2);
    else { deleteAllData(); setDeleteStep(0); }
  };

  const tabs = [
    { key: 'profile' as const, label: 'Hồ sơ', icon: User },
    { key: 'general' as const, label: 'Cài đặt', icon: Globe },
    { key: 'data' as const, label: 'Dữ liệu', icon: Shield },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">⚙️ Cài đặt & Quản lý</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.key ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}`}>
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700 space-y-6 animate-fadeIn">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Hồ sơ cá nhân</h2>
          <div>
            <label className="block text-sm font-medium mb-2">Avatar</label>
            <div className="flex gap-3">
              {avatars.map((av, i) => (
                <button key={i} onClick={() => setSelectedAvatar(i)}
                  className={`w-14 h-14 text-2xl rounded-xl flex items-center justify-center transition-all ${selectedAvatar === i ? 'bg-indigo-100 dark:bg-indigo-900 ring-2 ring-indigo-500 scale-110' : 'bg-gray-100 dark:bg-gray-700 hover:scale-105'}`}>
                  {av}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Họ tên</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full max-w-md px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={user?.email || ''} disabled
              className="w-full max-w-md px-3 py-2 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-400" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-3">Thông báo</label>
            <div className="space-y-3">
              {[
                { label: '📧 Thông báo Email', val: notifEmail, set: setNotifEmail },
                { label: '🔔 Thông báo Push', val: notifPush, set: setNotifPush },
                { label: '⏰ Nhắc nhở', val: notifReminders, set: setNotifReminders },
              ].map(item => (
                <label key={item.label} className="flex items-center justify-between max-w-md cursor-pointer">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                  <div className={`relative w-11 h-6 rounded-full transition-colors ${item.val ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                    onClick={() => item.set(!item.val)}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${item.val ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                  </div>
                </label>
              ))}
            </div>
          </div>
          <button onClick={saveProfile} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Lưu thay đổi
          </button>
        </div>
      )}

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700 space-y-6 animate-fadeIn">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cài đặt chung</h2>
          <div className="flex items-center justify-between max-w-md">
            <div className="flex items-center gap-3">
              {theme === 'light' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-blue-400" />}
              <span className="text-sm font-medium text-gray-900 dark:text-white">Giao diện {theme === 'light' ? 'Sáng' : 'Tối'}</span>
            </div>
            <button onClick={toggleTheme}
              className={`relative w-14 h-7 rounded-full transition-colors ${theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-300'}`}>
              <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="max-w-md">
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              <Globe className="w-4 h-4" /> Ngôn ngữ
            </label>
            <div className="flex gap-2">
              {[
                { code: 'vi' as const, label: '🇻🇳 Tiếng Việt' },
                { code: 'en' as const, label: '🇺🇸 English' },
                { code: 'zh' as const, label: '🇨🇳 中文' },
              ].map(l => (
                <button key={l.code} onClick={() => setLanguage(l.code)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${language === l.code ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200'}`}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <div className="max-w-md">
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Tiền tệ
            </label>
            <select value={user?.settings.currency || 'VND'}
              onChange={e => updateUser({ settings: { ...user!.settings, currency: e.target.value } })}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="max-w-md">
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Tháng bắt đầu năm tài chính
            </label>
            <select value={user?.settings.fiscalYearStart || 1}
              onChange={e => updateUser({ settings: { ...user!.settings, fiscalYearStart: parseInt(e.target.value) } })}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
              {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Data Management */}
      {activeTab === 'data' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">📦 Lưu trữ & Sao lưu</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Dữ liệu đang được lưu trữ trên trình duyệt (localStorage). Hãy sao lưu thường xuyên.</p>
            <div className="flex flex-wrap gap-3">
              <button onClick={exportData}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                <Download className="w-5 h-5" /> Xuất dữ liệu (JSON)
              </button>
              <button onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                <Upload className="w-5 h-5" /> Nhập dữ liệu
              </button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-6 border border-red-200 dark:border-red-800 space-y-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Vùng nguy hiểm</h2>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400">Xóa vĩnh viễn toàn bộ dữ liệu. Hành động không thể hoàn tác!</p>
            <button onClick={handleDelete}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                deleteStep === 0 ? 'bg-red-600 hover:bg-red-700 text-white' :
                deleteStep === 1 ? 'bg-red-700 text-white animate-pulse' :
                'bg-red-800 text-white animate-pulse'
              }`}>
              {deleteStep === 0 ? '🗑️ Xóa toàn bộ dữ liệu' :
               deleteStep === 1 ? '⚠️ Bạn chắc chắn? Nhấn lần nữa...' :
               '💀 Nhấn lần cuối để xóa vĩnh viễn!'}
            </button>
            {deleteStep > 0 && (
              <button onClick={() => setDeleteStep(0)} className="ml-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:underline">
                Hủy bỏ
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

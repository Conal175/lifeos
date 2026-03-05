import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Search, Pin, Trash2, X, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

const noteColors = ['#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3', '#f3e8ff', '#fef9c3', '#e0f2fe', '#ffe4e6'];

export function Notes() {
  const { notes, addNote, updateNote, deleteNote, togglePinNote } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ title: '', content: '', color: noteColors[0], pinned: false });

  const filtered = notes
    .filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      updateNote(editId, form);
    } else {
      addNote(form);
    }
    setForm({ title: '', content: '', color: noteColors[0], pinned: false });
    setEditId(null);
    setShowModal(false);
  };

  const handleEdit = (note: typeof notes[0]) => {
    setForm({ title: note.title, content: note.content, color: note.color, pinned: note.pinned });
    setEditId(note.id);
    setShowModal(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📝 Ghi chú</h1>
        <button onClick={() => { setEditId(null); setForm({ title: '', content: '', color: noteColors[0], pinned: false }); setShowModal(true); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-5 h-5" /> Ghi chú mới
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Tìm kiếm ghi chú..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">Không tìm thấy ghi chú</div>
        ) : filtered.map(note => (
          <div key={note.id} className="rounded-xl p-4 shadow-sm border dark:border-gray-700 relative group animate-fadeIn"
            style={{ backgroundColor: note.color + '40' }}>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white flex-1 truncate">{note.title}</h3>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => togglePinNote(note.id)} className={`p-1 rounded ${note.pinned ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
                  <Pin className="w-4 h-4" />
                </button>
                <button onClick={() => handleEdit(note)} className="p-1 rounded text-gray-400 hover:text-gray-600">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => deleteNote(note.id)} className="p-1 rounded text-gray-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {note.pinned && <span className="text-xs mb-2 block">📌 Đã ghim</span>}
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-6">{note.content}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">{format(new Date(note.updatedAt), 'dd/MM/yyyy HH:mm')}</p>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg animate-fadeIn">
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{editId ? 'Chỉnh sửa' : 'Ghi chú mới'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tiêu đề *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nội dung</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none" rows={8} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Màu nền</label>
                <div className="flex gap-2 flex-wrap">
                  {noteColors.map(c => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                      className={`w-8 h-8 rounded-lg transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.pinned} onChange={e => setForm({ ...form, pinned: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600" />
                <span className="text-sm">📌 Ghim lên đầu</span>
              </label>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium">
                {editId ? 'Cập nhật' : 'Tạo ghi chú'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

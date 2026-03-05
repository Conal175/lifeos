import { Transaction, Budget, Debt, Investment, SavingsGoal, Task, Event, Goal, Habit, Note, Journal, Notification, Activity } from '../types';

const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const daysAgo = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return d; };
const daysLater = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); return d; };

// All demo data WITHOUT userId - will be added when loaded for specific user
export const demoTransactions: Omit<Transaction, 'userId'>[] = [
  { id: 't1', type: 'income', amount: 25000000, category: 'Lương', description: 'Lương tháng này', tags: ['luong', 'congty'], date: fmt(daysAgo(2)) },
  { id: 't2', type: 'expense', amount: 3500000, category: 'Ăn uống', description: 'Ăn uống tháng', tags: ['anuong'], date: fmt(daysAgo(1)) },
  { id: 't3', type: 'expense', amount: 5000000, category: 'Mua sắm', description: 'Mua quần áo', tags: ['muasam'], date: fmt(daysAgo(1)) },
  { id: 't4', type: 'expense', amount: 2000000, category: 'Di chuyển', description: 'Xăng xe + grab', tags: ['dichuyen'], date: fmt(daysAgo(3)) },
  { id: 't5', type: 'income', amount: 5000000, category: 'Kinh doanh', description: 'Bán hàng online', tags: ['kinhdoanh'], date: fmt(daysAgo(4)) },
  { id: 't6', type: 'expense', amount: 1500000, category: 'Giải trí', description: 'Xem phim + cafe', tags: ['giaitri'], date: fmt(daysAgo(5)) },
  { id: 't7', type: 'expense', amount: 800000, category: 'Y tế', description: 'Khám sức khỏe', tags: ['yte'], date: fmt(daysAgo(6)) },
  { id: 't8', type: 'expense', amount: 2500000, category: 'Học tập', description: 'Khóa học online', tags: ['hoctap'], date: fmt(daysAgo(0)) },
  { id: 't9', type: 'income', amount: 3000000, category: 'Đầu tư', description: 'Cổ tức', tags: ['dautu'], date: fmt(daysAgo(2)) },
  { id: 't10', type: 'expense', amount: 4000000, category: 'Ăn uống', description: 'Đi ăn tiệc', tags: ['anuong', 'tiec'], date: fmt(daysAgo(3)) },
  { id: 't11', type: 'expense', amount: 1200000, category: 'Mua sắm', description: 'Đồ gia dụng', tags: ['muasam'], date: fmt(daysAgo(4)) },
  { id: 't12', type: 'income', amount: 8000000, category: 'Kinh doanh', description: 'Freelance project', tags: ['freelance'], date: fmt(daysAgo(5)) },
];

export const demoBudgets: Omit<Budget, 'userId'>[] = [
  { id: 'b1', name: 'Ăn uống hàng tháng', category: 'Ăn uống', limit: 5000000, spent: 3500000, period: 'month', startDate: fmt(daysAgo(15)) },
  { id: 'b2', name: 'Giải trí', category: 'Giải trí', limit: 2000000, spent: 1500000, period: 'month', startDate: fmt(daysAgo(15)) },
  { id: 'b3', name: 'Mua sắm', category: 'Mua sắm', limit: 3000000, spent: 2800000, period: 'month', startDate: fmt(daysAgo(15)) },
  { id: 'b4', name: 'Di chuyển tuần', category: 'Di chuyển', limit: 500000, spent: 420000, period: 'week', startDate: fmt(daysAgo(5)) },
];

export const demoDebts: Omit<Debt, 'userId'>[] = [
  { id: 'd1', type: 'owe', amount: 5000000, person: 'Nguyễn Văn A', description: 'Mượn tiền mua laptop', dueDate: fmt(daysLater(10)), completed: false },
  { id: 'd2', type: 'owed', amount: 2000000, person: 'Trần Thị B', description: 'Cho mượn tiền đóng học phí', dueDate: fmt(daysLater(5)), completed: false },
  { id: 'd3', type: 'owe', amount: 1000000, person: 'Lê Văn C', description: 'Ăn tối tuần trước', dueDate: fmt(daysAgo(2)), completed: false },
  { id: 'd4', type: 'owed', amount: 3000000, person: 'Phạm D', description: 'Góp vốn kinh doanh', dueDate: fmt(daysLater(30)), completed: false },
];

export const demoInvestments: Omit<Investment, 'userId'>[] = [
  { id: 'i1', name: 'VNM', type: 'stock', quantity: 100, avgPrice: 75000, currentPrice: 82000 },
  { id: 'i2', name: 'FPT', type: 'stock', quantity: 50, avgPrice: 95000, currentPrice: 105000 },
  { id: 'i3', name: 'Bitcoin', type: 'crypto', quantity: 0.01, avgPrice: 1500000000, currentPrice: 1650000000 },
  { id: 'i4', name: 'Vàng SJC', type: 'gold', quantity: 2, avgPrice: 79000000, currentPrice: 82000000 },
  { id: 'i5', name: 'ETH', type: 'crypto', quantity: 0.5, avgPrice: 50000000, currentPrice: 55000000 },
];

export const demoSavingsGoals: Omit<SavingsGoal, 'userId'>[] = [
  { id: 'sg1', name: 'Mua nhà', icon: '🏠', target: 500000000, current: 120000000, deadline: fmt(daysLater(365)), color: '#6366f1' },
  { id: 'sg2', name: 'Du lịch Nhật Bản', icon: '✈️', target: 50000000, current: 35000000, deadline: fmt(daysLater(90)), color: '#ec4899' },
  { id: 'sg3', name: 'Quỹ khẩn cấp', icon: '🏥', target: 100000000, current: 80000000, deadline: fmt(daysLater(180)), color: '#22c55e' },
  { id: 'sg4', name: 'Mua xe', icon: '🚗', target: 300000000, current: 45000000, deadline: fmt(daysLater(730)), color: '#f97316' },
];

export const demoTasks: Omit<Task, 'userId'>[] = [
  { id: 'tk1', title: 'Hoàn thành báo cáo Q2', description: 'Báo cáo doanh thu quý 2 cho ban giám đốc', priority: 'high', status: 'in_progress', completed: false, dueDate: fmt(daysLater(2)), createdAt: daysAgo(7).toISOString(), category: 'Công việc', assignee: 'Tôi', estimatedHours: 8,
    subtasks: [
      { id: 'st1', title: 'Thu thập dữ liệu từ phòng kế toán', completed: true, status: 'done', assignee: 'Tôi', dueDate: fmt(daysAgo(3)), estimatedHours: 2 },
      { id: 'st2', title: 'Phân tích số liệu và tạo biểu đồ', completed: true, status: 'done', assignee: 'Tôi', dueDate: fmt(daysAgo(1)), estimatedHours: 3 },
      { id: 'st3', title: 'Viết nội dung báo cáo chi tiết', completed: false, status: 'in_progress', assignee: 'Tôi', dueDate: fmt(daysLater(1)), estimatedHours: 2 },
      { id: 'st4', title: 'Review nội bộ với team lead', completed: false, status: 'todo', assignee: 'Team Lead', dueDate: fmt(daysLater(1)), estimatedHours: 1 },
      { id: 'st5', title: 'Chỉnh sửa theo feedback', completed: false, status: 'todo', assignee: 'Tôi', dueDate: fmt(daysLater(2)), estimatedHours: 1 },
      { id: 'st6', title: 'Gửi báo cáo cho BGĐ', completed: false, status: 'todo', assignee: 'Tôi', dueDate: fmt(daysLater(2)), estimatedHours: 0.5 },
    ]
  },
  { id: 'tk2', title: 'Học React Advanced', description: 'Hoàn thành khóa học React nâng cao trên Udemy', priority: 'medium', status: 'in_progress', completed: false, dueDate: fmt(daysLater(14)), createdAt: daysAgo(10).toISOString(), category: 'Học tập', assignee: 'Tôi', estimatedHours: 20,
    subtasks: [
      { id: 'st7', title: 'Custom Hooks & Patterns', completed: true, status: 'done', dueDate: fmt(daysAgo(5)), estimatedHours: 4 },
      { id: 'st8', title: 'Performance Optimization (memo, useMemo)', completed: true, status: 'done', dueDate: fmt(daysAgo(2)), estimatedHours: 3 },
      { id: 'st9', title: 'React Testing Library & Jest', completed: false, status: 'in_progress', dueDate: fmt(daysLater(3)), estimatedHours: 4 },
      { id: 'st10', title: 'State Management nâng cao (Zustand/Jotai)', completed: false, status: 'todo', dueDate: fmt(daysLater(7)), estimatedHours: 3 },
      { id: 'st11', title: 'Server Components & Streaming', completed: false, status: 'todo', dueDate: fmt(daysLater(10)), estimatedHours: 3 },
      { id: 'st12', title: 'Làm bài project cuối khóa', completed: false, status: 'todo', dueDate: fmt(daysLater(14)), estimatedHours: 5 },
    ]
  },
  { id: 'tk3', title: 'Đi khám sức khỏe định kỳ', description: 'Khám tổng quát tại BV Đại học Y', priority: 'urgent', status: 'todo', completed: false, dueDate: fmt(daysLater(1)), createdAt: daysAgo(3).toISOString(), category: 'Sức khỏe', assignee: 'Tôi', estimatedHours: 4,
    subtasks: [
      { id: 'st13', title: 'Nhịn ăn sáng trước khi khám', completed: false, status: 'todo', dueDate: fmt(daysLater(1)) },
      { id: 'st14', title: 'Mang theo CCCD và sổ khám bệnh', completed: false, status: 'todo', dueDate: fmt(daysLater(1)) },
      { id: 'st15', title: 'Xét nghiệm máu', completed: false, status: 'todo', dueDate: fmt(daysLater(1)) },
      { id: 'st16', title: 'Siêu âm ổ bụng', completed: false, status: 'todo', dueDate: fmt(daysLater(1)) },
      { id: 'st17', title: 'Khám mắt & đo thị lực', completed: false, status: 'todo', dueDate: fmt(daysLater(1)) },
    ]
  },
  { id: 'tk4', title: 'Dọn dẹp và trang trí nhà cửa', description: 'Vệ sinh tổng thể cuối tuần', priority: 'low', status: 'done', completed: true, dueDate: fmt(daysAgo(1)), completedAt: daysAgo(1).toISOString(), createdAt: daysAgo(5).toISOString(), category: 'Cá nhân', assignee: 'Tôi', estimatedHours: 5,
    subtasks: [
      { id: 'st18', title: 'Hút bụi toàn bộ phòng', completed: true, status: 'done', dueDate: fmt(daysAgo(1)), estimatedHours: 1 },
      { id: 'st19', title: 'Lau sàn nhà', completed: true, status: 'done', dueDate: fmt(daysAgo(1)), estimatedHours: 1 },
      { id: 'st20', title: 'Giặt giũ & phơi đồ', completed: true, status: 'done', dueDate: fmt(daysAgo(1)), estimatedHours: 1.5 },
      { id: 'st21', title: 'Dọn tủ lạnh', completed: true, status: 'done', dueDate: fmt(daysAgo(1)), estimatedHours: 0.5 },
    ]
  },
  { id: 'tk5', title: 'Xây dựng Landing Page cho dự án X', description: 'Design & code landing page responsive', priority: 'high', status: 'in_progress', completed: false, dueDate: fmt(daysLater(5)), createdAt: daysAgo(3).toISOString(), category: 'Công việc', assignee: 'Tôi', estimatedHours: 16,
    subtasks: [
      { id: 'st22', title: 'Thiết kế wireframe trên Figma', completed: true, status: 'done', assignee: 'Designer', dueDate: fmt(daysAgo(1)), estimatedHours: 4 },
      { id: 'st23', title: 'Cắt HTML/CSS từ design', completed: true, status: 'done', assignee: 'Tôi', dueDate: fmt(daysLater(1)), estimatedHours: 4 },
      { id: 'st24', title: 'Thêm animation & interaction', completed: false, status: 'in_progress', assignee: 'Tôi', dueDate: fmt(daysLater(2)), estimatedHours: 3 },
      { id: 'st25', title: 'Responsive cho mobile/tablet', completed: false, status: 'todo', assignee: 'Tôi', dueDate: fmt(daysLater(3)), estimatedHours: 2 },
      { id: 'st26', title: 'Tối ưu SEO & Performance', completed: false, status: 'todo', assignee: 'Tôi', dueDate: fmt(daysLater(4)), estimatedHours: 2 },
      { id: 'st27', title: 'Deploy lên production', completed: false, status: 'todo', assignee: 'DevOps', dueDate: fmt(daysLater(5)), estimatedHours: 1 },
    ]
  },
];

export const demoEvents: Omit<Event, 'userId'>[] = [
  { id: 'e1', title: 'Họp team sáng', description: 'Standup meeting', startDate: `${fmt(today)}T09:00`, endDate: `${fmt(today)}T09:30`, color: '#6366f1' },
  { id: 'e2', title: 'Lunch với đối tác', description: 'Nhà hàng ABC', startDate: `${fmt(today)}T12:00`, endDate: `${fmt(today)}T13:30`, color: '#f97316' },
  { id: 'e3', title: 'Workshop Design', description: 'Online workshop', startDate: `${fmt(daysLater(1))}T14:00`, endDate: `${fmt(daysLater(1))}T16:00`, color: '#ec4899' },
  { id: 'e4', title: 'Sinh nhật bạn', description: 'Quán karaoke', startDate: `${fmt(daysLater(3))}T19:00`, endDate: `${fmt(daysLater(3))}T22:00`, color: '#22c55e' },
  { id: 'e5', title: 'Deadline dự án A', description: '', startDate: `${fmt(daysLater(5))}T23:59`, endDate: `${fmt(daysLater(5))}T23:59`, color: '#ef4444', isTask: true },
];

export const demoGoals: Omit<Goal, 'userId'>[] = [
  { id: 'g1', title: 'Thăng chức Senior Developer', category: 'Sự nghiệp', deadline: fmt(daysLater(180)),
    milestones: [
      { id: 'gm1', title: 'Hoàn thành 3 dự án lớn', completed: true },
      { id: 'gm2', title: 'Đạt chứng chỉ AWS', completed: true },
      { id: 'gm3', title: 'Mentor 2 junior dev', completed: false },
      { id: 'gm4', title: 'Thuyết trình nội bộ 5 lần', completed: false },
    ]
  },
  { id: 'g2', title: 'Giảm 5kg', category: 'Sức khỏe', deadline: fmt(daysLater(90)),
    milestones: [
      { id: 'gm5', title: 'Tập gym 3 buổi/tuần', completed: true },
      { id: 'gm6', title: 'Giảm 2kg đầu tiên', completed: true },
      { id: 'gm7', title: 'Giảm 3kg tiếp', completed: false },
      { id: 'gm8', title: 'Duy trì cân nặng', completed: false },
    ]
  },
  { id: 'g3', title: 'Đọc 24 cuốn sách/năm', category: 'Học tập', deadline: fmt(daysLater(300)),
    milestones: [
      { id: 'gm9', title: 'Đọc 6 cuốn (Q1)', completed: true },
      { id: 'gm10', title: 'Đọc 6 cuốn (Q2)', completed: false },
      { id: 'gm11', title: 'Đọc 6 cuốn (Q3)', completed: false },
      { id: 'gm12', title: 'Đọc 6 cuốn (Q4)', completed: false },
    ]
  },
];

export const demoHabits: Omit<Habit, 'userId'>[] = [
  { id: 'h1', name: 'Thiền 10 phút', icon: '🧘', color: '#8b5cf6', streak: 5,
    completedDates: [fmt(daysAgo(0)), fmt(daysAgo(1)), fmt(daysAgo(2)), fmt(daysAgo(3)), fmt(daysAgo(4))]
  },
  { id: 'h2', name: 'Tập thể dục', icon: '💪', color: '#ef4444', streak: 3,
    completedDates: [fmt(daysAgo(0)), fmt(daysAgo(1)), fmt(daysAgo(2)), fmt(daysAgo(4)), fmt(daysAgo(5))]
  },
  { id: 'h3', name: 'Đọc sách', icon: '📚', color: '#22c55e', streak: 7,
    completedDates: [fmt(daysAgo(0)), fmt(daysAgo(1)), fmt(daysAgo(2)), fmt(daysAgo(3)), fmt(daysAgo(4)), fmt(daysAgo(5)), fmt(daysAgo(6))]
  },
  { id: 'h4', name: 'Uống 2L nước', icon: '💧', color: '#3b82f6', streak: 2,
    completedDates: [fmt(daysAgo(0)), fmt(daysAgo(1)), fmt(daysAgo(3)), fmt(daysAgo(5))]
  },
  { id: 'h5', name: 'Ngủ trước 11h', icon: '😴', color: '#f59e0b', streak: 0,
    completedDates: [fmt(daysAgo(1)), fmt(daysAgo(3)), fmt(daysAgo(4))]
  },
];

export const demoNotes: Omit<Note, 'userId'>[] = [
  { id: 'n1', title: 'Ý tưởng dự án mới', content: 'Xây dựng ứng dụng quản lý tài chính cá nhân với AI phân tích chi tiêu tự động. Tích hợp OCR scan hóa đơn.', color: '#fef3c7', pinned: true, createdAt: daysAgo(5).toISOString(), updatedAt: daysAgo(1).toISOString() },
  { id: 'n2', title: 'Công thức nấu ăn', content: 'Phở bò:\\n- 500g xương bò\\n- Hành tím, gừng nướng\\n- Quế, hồi, thảo quả\\n- Nước mắm, đường phèn', color: '#dcfce7', pinned: false, createdAt: daysAgo(10).toISOString(), updatedAt: daysAgo(10).toISOString() },
  { id: 'n3', title: 'Meeting notes - Sprint 15', content: '- Review UI/UX dashboard\\n- Tích hợp payment gateway\\n- Fix bug login trên iOS\\n- Deploy staging thứ 5', color: '#dbeafe', pinned: true, createdAt: daysAgo(2).toISOString(), updatedAt: daysAgo(2).toISOString() },
  { id: 'n4', title: 'Danh sách mua sắm', content: '☐ Sữa tươi\\n☐ Trứng gà\\n☐ Rau xanh\\n☐ Thịt bò\\n☐ Trái cây', color: '#fce7f3', pinned: false, createdAt: daysAgo(1).toISOString(), updatedAt: daysAgo(1).toISOString() },
  { id: 'n5', title: 'Quote hay', content: '\"The only way to do great work is to love what you do.\" - Steve Jobs\\n\\n\"Stay hungry, stay foolish.\"', color: '#f3e8ff', pinned: false, createdAt: daysAgo(15).toISOString(), updatedAt: daysAgo(15).toISOString() },
];

export const demoJournal: Omit<Journal, 'userId'>[] = [
  { id: 'j1', date: fmt(daysAgo(0)), content: 'Hôm nay là một ngày khá năng suất. Hoàn thành được 3 task quan trọng và meeting với khách hàng diễn ra tốt đẹp. Buổi tối đi tập gym và cảm thấy khỏe khoắn.', mood: 4, attachments: [], locked: false, weight: 65, sleepHours: 7 },
  { id: 'j2', date: fmt(daysAgo(1)), content: 'Ngày hơi mệt mỏi, không ngủ đủ giấc. Cố gắng tập trung nhưng hiệu quả không cao. Cần điều chỉnh giờ ngủ sớm hơn.', mood: 2, attachments: [], locked: false, weight: 65.2, sleepHours: 5 },
  { id: 'j3', date: fmt(daysAgo(2)), content: 'Tuyệt vời! Nhận được feedback tích cực từ sếp về dự án. Bạn bè rủ đi cafe buổi chiều, vui vẻ lắm 😄', mood: 5, attachments: [], locked: false, weight: 65.5, sleepHours: 8 },
  { id: 'j4', date: fmt(daysAgo(3)), content: 'Ngày bình thường, không có gì đặc biệt. Đi làm, ăn trưa, code, về nhà nấu ăn.', mood: 3, attachments: [], locked: false, sleepHours: 6.5 },
  { id: 'j5', date: fmt(daysAgo(5)), content: 'Hôm nay hơi căng thẳng vì deadline dự án. Nhưng cuối cùng cũng xong đúng hạn. Tự thưởng cho mình một bữa ăn ngon.', mood: 3, attachments: [], locked: true, sleepHours: 6 },
];

export const demoNotifications: Omit<Notification, 'userId'>[] = [
  { id: 'nf1', type: 'warning', title: 'Nợ sắp đến hạn', message: 'Khoản nợ Lê Văn C đã quá hạn 2 ngày', read: false, createdAt: daysAgo(0).toISOString() },
  { id: 'nf2', type: 'warning', title: 'Ngân sách cảnh báo', message: 'Ngân sách \"Mua sắm\" đã sử dụng 93%', read: false, createdAt: daysAgo(0).toISOString() },
  { id: 'nf3', type: 'success', title: 'Mục tiêu gần đạt', message: 'Quỹ khẩn cấp đã đạt 80% mục tiêu!', read: false, createdAt: daysAgo(1).toISOString() },
  { id: 'nf4', type: 'info', title: 'Nhắc nhở', message: 'Deadline \"Hoàn thành báo cáo Q2\" còn 2 ngày', read: true, createdAt: daysAgo(1).toISOString() },
  { id: 'nf5', type: 'error', title: 'Vượt ngân sách', message: 'Ngân sách \"Di chuyển tuần\" sắp vượt giới hạn', read: true, createdAt: daysAgo(2).toISOString() },
  { id: 'nf6', type: 'success', title: 'Streak mới!', message: 'Thói quen \"Đọc sách\" đạt 7 ngày liên tiếp 🔥', read: true, createdAt: daysAgo(0).toISOString() },
];

export const demoActivities: Omit<Activity, 'userId'>[] = [
  { id: 'a1', name: 'Chạy bộ', icon: '🏃', color: '#ef4444', unit: 'km', targetPerDay: 5, logs: [
    { date: fmt(daysAgo(0)), value: 5, note: 'Chạy tốt' },
    { date: fmt(daysAgo(1)), value: 4 },
    { date: fmt(daysAgo(2)), value: 6 },
    { date: fmt(daysAgo(3)), value: 5 },
    { date: fmt(daysAgo(5)), value: 3 },
  ]},
  { id: 'a2', name: 'Đọc sách', icon: '📚', color: '#22c55e', unit: 'trang', targetPerDay: 30, logs: [
    { date: fmt(daysAgo(0)), value: 35 },
    { date: fmt(daysAgo(1)), value: 25 },
    { date: fmt(daysAgo(2)), value: 40 },
    { date: fmt(daysAgo(3)), value: 30 },
    { date: fmt(daysAgo(4)), value: 20 },
    { date: fmt(daysAgo(5)), value: 30 },
    { date: fmt(daysAgo(6)), value: 25 },
  ]},
  { id: 'a3', name: 'Thiền', icon: '🧘', color: '#8b5cf6', unit: 'phút', targetPerDay: 15, logs: [
    { date: fmt(daysAgo(0)), value: 15 },
    { date: fmt(daysAgo(1)), value: 10 },
    { date: fmt(daysAgo(2)), value: 15 },
    { date: fmt(daysAgo(4)), value: 20 },
  ]},
];

// Helper function to add userId to demo data
export function addUserIdToData<T>(data: Omit<T, 'userId'>[], userId: string): T[] {
  return data.map(item => ({ ...item, userId })) as T[];
}

# Hướng dẫn thiết lập Supabase cho Life OS

## 📋 Tổng quan

Life OS hỗ trợ 2 chế độ lưu trữ:

| Chế độ | Mô tả | Ưu điểm | Nhược điểm |
|--------|-------|---------|------------|
| **Ngoại tuyến (LocalStorage)** | Dữ liệu lưu trong trình duyệt | Không cần cấu hình | Chỉ dùng trên 1 thiết bị |
| **Đám mây (Supabase)** | Dữ liệu lưu trên server | Đồng bộ đa thiết bị, bảo mật | Cần thiết lập Supabase |

## 🚀 Thiết lập Supabase (5 phút)

### Bước 1: Tạo project Supabase

1. Truy cập [supabase.com](https://supabase.com) và đăng nhập
2. Click **"New Project"**
3. Điền thông tin:
   - **Name**: `life-os` (hoặc tên bạn muốn)
   - **Database Password**: Tạo mật khẩu mạnh
   - **Region**: Chọn khu vực gần bạn nhất (ví dụ: Singapore)
4. Click **"Create new project"** và đợi 1-2 phút

### Bước 2: Thiết lập Database

1. Trong Supabase Dashboard, vào **SQL Editor**
2. Click **"New Query"**
3. Copy toàn bộ nội dung từ file `supabase-schema.sql`
4. Paste vào SQL Editor
5. Click **"Run"** (hoặc Ctrl+Enter)
6. Đợi đến khi thấy thông báo "Success"

### Bước 3: Lấy API Keys

1. Vào **Settings** (biểu tượng bánh răng) > **API**
2. Copy các giá trị sau:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIs...`

### Bước 4: Cấu hình môi trường

1. Tạo file `.env` trong thư mục gốc dự án:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

2. Thay thế giá trị bằng URL và Key của bạn

### Bước 5: Khởi động lại ứng dụng

```bash
npm run dev
```

## ✅ Kiểm tra

Khi mở ứng dụng, bạn sẽ thấy:
- Badge **"☁️ Chế độ đám mây (Supabase)"** màu xanh lá ở trang đăng nhập

Nếu vẫn thấy badge **"💾 Chế độ ngoại tuyến"** màu vàng:
- Kiểm tra file `.env` đã được tạo đúng chưa
- Kiểm tra URL và Key có chính xác không
- Khởi động lại server (`npm run dev`)

## 🔒 Bảo mật (Row Level Security)

Life OS sử dụng Row Level Security (RLS) của Supabase:

- ✅ Mỗi người dùng chỉ thấy dữ liệu của mình
- ✅ Không thể truy cập dữ liệu người khác
- ✅ Xóa dữ liệu chỉ ảnh hưởng đến tài khoản của mình

## 📱 Tính năng đồng bộ đa thiết bị

Sau khi thiết lập Supabase:
1. Đăng ký tài khoản trên thiết bị A
2. Xác nhận email (nếu được yêu cầu)
3. Đăng nhập trên thiết bị B với cùng tài khoản
4. Tất cả dữ liệu sẽ được đồng bộ tự động!

## ❓ Câu hỏi thường gặp

### Q: Tôi có thể dùng cả 2 chế độ không?
**A:** Không. Ứng dụng tự động chọn chế độ dựa trên việc có cấu hình Supabase hay không.

### Q: Dữ liệu cũ từ LocalStorage có được chuyển sang Supabase không?
**A:** Không tự động. Bạn cần xuất dữ liệu (Export) rồi nhập lại (Import) sau khi cấu hình Supabase.

### Q: Email xác nhận không nhận được?
**A:** Kiểm tra thư mục Spam. Hoặc vào Supabase Dashboard > Authentication > Users để xác nhận thủ công.

### Q: Làm sao để tắt chế độ Supabase?
**A:** Xóa file `.env` hoặc bỏ trống các giá trị `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`.

## 🆘 Hỗ trợ

Nếu gặp vấn đề, hãy kiểm tra:
1. Console của trình duyệt (F12 > Console) để xem lỗi
2. Supabase Dashboard > Database > Tables để xem dữ liệu
3. Supabase Dashboard > Authentication > Users để xem người dùng

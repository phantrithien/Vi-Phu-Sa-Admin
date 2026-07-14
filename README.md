# Vị Phù Sa - Admin Panel

Hệ thống dashboard quản trị cho dự án Vị Phù Sa, được xây dựng bằng React + Vite và Firebase. Mục tiêu là cung cấp một nền tảng vận hành nội bộ hiện đại cho quản lý nhân sự, công việc, marketing, sản xuất, kế toán và lưu trữ.

## 🚀 Công nghệ sử dụng

- React 19 + React DOM
- Vite 8
- Firebase Authentication, Firestore, Storage, Messaging
- Tailwind CSS
- Lucide React
- Chart.js / react-chartjs-2
- React Router DOM
- React Hook Form

## 📦 Phân hệ chính

1. Đăng nhập và phân quyền
2. Dashboard tổng quan
3. Task Board
4. Marketing
5. Production
6. HR
7. Accounting
8. Archive

## 🛠️ Hướng dẫn cài đặt local

### Yêu cầu
- Node.js 18+ (khuyến nghị LTS)
- npm hoặc pnpm

### Các bước

1. Mở terminal tại thư mục dự án.
2. Cài đặt dependency:
   ```bash
   npm install
   ```
3. Sao chép file môi trường mẫu:
   ```bash
   cp .env.example .env
   ```
4. Điền các giá trị Firebase vào file .env.
5. Khởi động dev server:
   ```bash
   npm run dev
   ```

### Lưu ý về môi trường

- File .env là file local, không được commit.
- Các biến cần thiết bao gồm:
  - VITE_FIREBASE_API_KEY
  - VITE_FIREBASE_AUTH_DOMAIN
  - VITE_FIREBASE_PROJECT_ID
  - VITE_FIREBASE_STORAGE_BUCKET
  - VITE_FIREBASE_MESSAGING_SENDER_ID
  - VITE_FIREBASE_APP_ID
  - VITE_FIREBASE_VAPID_KEY

Sau khi chạy thành công, ứng dụng sẽ mở tại http://localhost:5173/.


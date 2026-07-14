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

## ✅ MVP Release Candidate (v1.0.0-mvp)

Branch dong bang MVP:

```bash
git checkout -b release/mvp-1.0
npm install
npm run build
npm run dev
git tag v1.0.0-mvp
git push origin v1.0.0-mvp
```

Da bo sung script smoke test:

```bash
npm run smoke:mvp
```

## 🧪 QA va UAT tai lieu

- QA checklist: [docs/MVP_QA_CHECKLIST.md](docs/MVP_QA_CHECKLIST.md)
- UAT 7-day template: [docs/UAT_7_DAY_TEMPLATE.md](docs/UAT_7_DAY_TEMPLATE.md)
- Seed data mau: [docs/mvp-seed-data.json](docs/mvp-seed-data.json)

## 🔒 Firebase Security Rules (bat buoc truoc public)

- Rules file: [firestore.rules](firestore.rules)
- Indexes file: [firestore.indexes.json](firestore.indexes.json)
- Huong dan nhanh: [docs/FIREBASE_SECURITY_MVP.md](docs/FIREBASE_SECURITY_MVP.md)

Deploy rules:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## 🌐 Environment split

Su dung rieng cho tung moi truong:

- .env.local
- .env.staging
- .env.production

Khong commit secret that; chi commit `.env.example`.

## 🔍 Dependency health check

```bash
npm run qa:deps
```


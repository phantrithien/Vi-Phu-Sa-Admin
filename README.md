# Vị Phù Sa - Admin Panel

Hệ thống Dashboard quản trị toàn diện cho dự án **Ví Phù Sa**, được xây dựng trên nền tảng React và Vite, kết hợp với các giải pháp lưu trữ, biểu đồ và quản lý giao diện hiện đại nhằm tối ưu hóa hiệu suất vận hành của doanh nghiệp.

## 🚀 Công Nghệ Sử Dụng (Tech Stack)

Dự án sử dụng các công nghệ frontend và thư viện cốt lõi bao gồm:
* **Framework chính:** React 19 & React DOM
* **Công cụ build:** Vite 8 (Hỗ trợ Hot Module Replacement cực nhanh)
* **Cơ sở dữ liệu / Xác thực:** Firebase (Đồng bộ dữ liệu thời gian thực và quản lý tài khoản)
* **Giao diện & Tiện ích:** * Tailwind CSS v4 (Thiết kế giao diện phản hồi nhanh - Responsive)
    * Lucide React (Hệ thống bộ icon hiện đại)
* **Xử lý dữ liệu & Tính năng nâng cao:**
    * Chart.js & React-Chartjs-2 (Trực quan hóa số liệu kinh doanh bằng biểu đồ)
    * @hello-pangea/dnd (Hỗ trợ tính năng kéo thả mượt mà cho bảng công việc)
    * React Router DOM (Quản lý định tuyến giữa các phân hệ trang)
    * React Hook Form (Quản lý biểu mẫu dữ liệu tối ưu)

## 📦 Phân Hệ Tính Năng (Features)

Hệ thống được chia nhỏ thành các phân hệ quản lý độc lập trực quan:
1.  **Hệ thống Đăng nhập (Login):** Bảo mật quyền truy cập hệ thống của quản trị viên.
2.  **Bảng điều khiển tổng quan (Dashboard):** Theo dõi tổng thể hoạt động dòng tiền, thống kê dữ liệu dạng biểu đồ.
3.  **Quản lý Công việc (Task Board):** Tổ chức công việc của các phòng ban thông qua bảng tiến độ kéo thả.
4.  **Quản lý Tiếp thị (Marketing):** Giám sát số liệu, kế hoạch và hiệu quả từ các chiến dịch truyền thông.
5.  **Quản lý Sản xuất (Production):** Theo dõi chuỗi cung ứng, khối lượng và tiến độ sản phẩm.
6.  **Quản lý Nhân sự (HR):** Lưu trữ thông tin nhân sự, chấm công và cơ cấu tổ chức.
7.  **Kế toán & Tài chính (Accounting):** Kiểm soát hóa đơn, phiếu thu/chi và báo cáo doanh thu tài chính.
8.  **Trung tâm Lưu trữ (Archive):** Quản lý hồ sơ tài liệu lịch sử của hệ thống.

## 🛠️ Hướng Dẫn Cài Đặt & Vận Hành

### Yêu cầu tiên quyết
Máy tính của bạn cần cài đặt sẵn **Node.js** (Khuyến nghị phiên bản LTS mới nhất).

### Các bước thực hiện trên VS Code

**Bước 1: Tải source code và mở bằng VS Code**
1. Tải dự án này về máy hoặc clone trực tiếp bằng Git.
2. Mở phần mềm Visual Studio Code.
3. Chọn `File` -> `Open Folder...` (hoặc phím tắt `Ctrl + K` rồi `Ctrl + O`) và chỉ định đến thư mục chứa source code này.

**Bước 2: Mở Terminal**
* Chọn `Terminal` -> `New Terminal` trên thanh công cụ hệ thống (hoặc nhấn phím tắt `` Ctrl + ` ``).

**Bước 3: Cài đặt các thư viện phụ thuộc**
* Kết nối firebase

**Bước 3: Cài đặt các thư viện phụ thuộc**
* Chạy lệnh sau trong cửa sổ Terminal để cài đặt toàn bộ gói thư viện cần thiết:
  ```bash
  npm install

**Bước 4: Khởi chạy môi trường phát triển (Local Server)**
* Gõ lệnh sau để kích hoạt chạy thử nghiệm dự án:
  ```bash
  npm run dev
* Sau khi khởi chạy thành công, Terminal sẽ cung cấp một liên kết cục bộ, thường là http://localhost:5173/. Giữ phím Ctrl (hoặc Cmd trên Mac) và click chuột vào đường link đó để xem ứng dụng trên trình duyệt web.


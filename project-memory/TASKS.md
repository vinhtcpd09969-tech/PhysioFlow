# Tasks — PhysioFlow

## ✅ Đã hoàn thành
- [x] Khởi tạo Git repository và cấu trúc thư mục dự án.
- [x] Thiết lập Docker Compose (PostgreSQL + pgAdmin).
- [x] Chạy `docker compose up -d` thành công.
- [x] Khởi tạo backend Express + TypeScript + pg Raw SQL.
- [x] Khởi tạo frontend Vite + React + Tailwind CSS.
- [x] Migrate backend từ JavaScript → TypeScript (strict mode).
- [x] Cập nhật tài liệu ngữ cảnh (PHYSIOFLOW_CONTEXT.md, PLAN-physio-website.md) để phản ánh TypeScript.
- [x] Cài đặt thư viện `zod` cho backend validation.
- [x] Tạo `auth.schema.ts` với `loginSchema`, `refreshTokenSchema`.
- [x] Triển khai Backend Auth API: `POST /login`, `POST /refresh-token`, `GET /me`.
- [x] Tạo bảng `refresh_tokens` và seed tài khoản admin.
- [x] Kết nối GitHub remote và push code lần đầu.
- [x] Thiết lập quy tắc Git (Conventional Commits, hỏi push cuối session).
- [x] Migrate Frontend từ `.jsx` → `.tsx` (TypeScript).
- [x] Tích hợp Design System từ `DESIGN.md` vào Tailwind.
- [x] Tạo `authStore.ts` (Zustand) và `api/axios.ts` (interceptors).
- [x] Xây dựng `Login.tsx` — giao diện 2 cột đẹp theo wireframe + Design System.
- [x] Cập nhật Login UI: background image thật ở bên phải, áp dụng Rule of Thirds.
- [x] Triển khai Backend `POST /api/auth/register` (controller + route).
- [x] Push toàn bộ code lên GitHub (commit `f38c85d`).

## ⏳ Đang chờ thực thi (Plan đã được duyệt)
- [ ] **Backend:** Thêm lại `registerSchema` vào `auth.schema.ts`.
- [ ] **Frontend:** Tạo `Register.tsx` — UI 2 cột theo wireframe đã gửi (Dark Panel bên trái, Form bên phải).
- [ ] **Frontend:** Cập nhật tab "Đăng ký" trong `Login.tsx` → link điều hướng sang `/register`.
- [ ] **Frontend:** Tạo `DashboardLayout.tsx` — Sidebar + Topbar layout.
- [ ] **Frontend:** Tạo `Dashboard.tsx` — trang chào mừng + Stats cards.
- [ ] **Frontend:** Cập nhật `App.tsx` — Route Guard + route `/register`, `/dashboard`.

## 📋 Backlog (Chưa lên kế hoạch)
- [ ] Trang Quản lý Lịch hẹn (Admin/Lễ tân).
- [ ] Trang Hồ sơ Khách hàng.
- [ ] Trang Kỹ thuật viên.
- [ ] Module Đặt lịch (Booking Flow).
- [ ] Module Gói Điều trị (Package System).
- [ ] Module Thanh toán.
- [ ] Module Thông báo.

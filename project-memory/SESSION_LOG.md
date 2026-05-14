# Session Log

## Session 1 — 2026-05-14 (Khởi tạo hạ tầng)
- Khởi tạo project memory system: `CURRENT_STATE.md`, `TASKS.md`, `SESSION_LOG.md`, `NEXT_SESSION_PROMPT.md`.
- Cập nhật `PHYSIOFLOW_CONTEXT.md` để bổ sung Docker vào Tech Stack.
- Tạo cấu trúc thư mục: `/backend`, `/frontend`, `/docker`.
- Viết `docker-compose.yml` và `docker/init.sql` (schema V4 đầy đủ).
- Scaffold backend (Express + pg) và frontend (Vite + React + Tailwind).
- User cài đặt Node.js v24. Chạy `npm install` thành công cho cả 2.
- Chạy `docker compose up -d` → PostgreSQL + pgAdmin hoạt động.
- Triển khai Backend Auth Module: `login`, `refreshToken`, `getMe` với JWT + bcrypt.
- Tạo bảng `refresh_tokens`, seed admin user.

## Session 2 — 2026-05-14 (TypeScript Migration & GitHub Setup)
- Migrate toàn bộ backend từ JavaScript → TypeScript (strict mode). 0 lỗi tsc.
- Cập nhật `PHYSIOFLOW_CONTEXT.md` và `PLAN-physio-website.md` để phản ánh TypeScript.
- Kết nối GitHub remote (`vinhtcpd09969-tech/PhysioFlow`).
- Cấu hình `.gitignore`, lần push đầu tiên thành công.
- Thiết lập Agent Git Rules: Auto-commit Conventional Commits, hỏi push cuối session.
- Cập nhật `CURRENT_STATE.md` và `NEXT_SESSION_PROMPT.md`.

## Session 3 — 2026-05-15 (Frontend TSX + Login UI + Register API)
- Migrate Frontend từ `.jsx` → `.tsx` (TypeScript). Tạo `tsconfig.json`, `tsconfig.node.json`.
- Tích hợp Design System từ `DESIGN.md` (Mint Teal, Deep Navy, font Manrope/Inter) vào `tailwind.config.js` và `index.css`.
- Tạo `authStore.ts` (Zustand với persist middleware).
- Tạo `api/axios.ts` (interceptors tự động gắn Bearer Token).
- Xây dựng `Login.tsx` hoàn chỉnh:
  - Cột trái: Form Minimalist với react-hook-form + zod validation, UX loading/error.
  - Cột phải: Background image thật, overlay Glassmorphism mờ, áp dụng Rule of Thirds (Logo top-left, Testimonial card bottom-third).
- Cập nhật `App.tsx` với React Router cơ bản.
- Backend: Bổ sung `registerSchema` (Zod), viết hàm `register` trong controller, mở route `POST /api/auth/register`.
- **Lưu ý:** Sếp xóa `registerSchema` trong `auth.schema.ts` vào cuối session (Register UI chưa làm). Plan Register UI + Dashboard Shell đã được duyệt, sẽ thực thi phiên sau.
- Đọc `DESIGN.md` tại `d:\DATN\WF\DESIGN.md` để lấy thông tin màu sắc và typography.
- Push commit `f38c85d` lên GitHub thành công.

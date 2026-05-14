# Current State

- **Ngày cập nhật:** 2026-05-15
- **Progress:** Module Login (Frontend + Backend) hoàn thiện. Backend Register API đã được triển khai. Frontend Register UI đang chờ duyệt để triển khai.
- **Infrastructure:** GitHub Repository: Connected (Branch: `main`, Latest commit: `f38c85d`).
- **Git Status:** Working tree clean. Đã push toàn bộ code.

## Stack đang chạy
- Backend: `http://localhost:5000` (Express + TypeScript + pg Raw SQL)
- Frontend: `http://localhost:5173` (Vite + React TSX + Tailwind)
- Database: Docker PostgreSQL (`physioflow_db` - port 5432)
- pgAdmin: `http://localhost:5050`

## Những gì đã hoàn thành hôm nay

### Session hôm nay (2026-05-15):
1. **Frontend TSX Migration:** Đã chuyển toàn bộ Vite React từ `.jsx` → `.tsx` (TypeScript). Tạo `tsconfig.json`, `tsconfig.node.json`, đổi tên file và cập nhật `index.html`.
2. **Design System:** Đã tích hợp bảng màu từ `DESIGN.md` (Mint Teal `#2EC4B6`, Deep Navy `#0F172A`) vào `tailwind.config.js`. Import font Manrope/Inter từ Google Fonts vào `index.css`.
3. **Zustand Auth Store:** Tạo `authStore.ts` lưu `user`, `accessToken`, `refreshToken` với middleware `persist`.
4. **Axios Interceptors:** Tạo `api/axios.ts` tự động gắn Bearer Token vào header mọi request.
5. **Login UI:** Giao diện màn hình Login 2 cột hoàn chỉnh:
   - Bên trái: Form đăng nhập Minimalist với Tailwind + Glassmorphism.
   - Bên phải: Background Image Panel với lớp overlay mờ, áp dụng Rule of Thirds — Logo trên cùng bên trái, Testimonial Card ở 1/3 dưới cùng.
6. **Backend Zod Validation:** Tích hợp thư viện `zod`. Cập nhật `auth.controller.ts` để validate input trước khi query DB.
7. **Backend Register API:** Viết hàm `register` trong `auth.controller.ts`, thêm route `POST /api/auth/register`.
8. **GitHub:** Đã push đầy đủ lên `https://github.com/vinhtcpd09969-tech/PhysioFlow`.

## Trạng thái file quan trọng
- `backend/src/controllers/auth.controller.ts` — có `login`, `register`, `refreshToken`, `getMe`
- `backend/src/routes/auth.routes.ts` — có `/login`, `/register`, `/refresh-token`, `/me`
- `backend/src/schemas/auth.schema.ts` — có `loginSchema`, `refreshTokenSchema` (**registerSchema đang bị xóa tạm thời, cần thêm lại khi làm Register UI**)
- `frontend/src/pages/Login.tsx` — hoàn chỉnh
- `frontend/src/stores/authStore.ts` — hoàn chỉnh
- `frontend/src/api/axios.ts` — hoàn chỉnh
- `frontend/src/App.tsx` — chỉ có route `/login`, `/dashboard` (placeholder)

## Lưu ý quan trọng
- **registerSchema đã bị Sếp xóa thủ công** trong `auth.schema.ts`. Khi làm Register UI, cần thêm lại vào đầu phiên.
- Background image Login nằm tại: `frontend/public/images/login-bg.png` (Sếp tự lưu thủ công).

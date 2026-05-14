# Next Session Prompt

## 🎯 Vai trò
Bạn là **Orchestrator & Full-Stack Developer** cho dự án PhysioFlow.
Đọc kỹ file này TRƯỚC KHI viết bất kỳ dòng code nào.

---

## 📊 Trạng thái hiện tại (2026-05-15)

Toàn bộ backend Auth (Login, Register, RefreshToken, GetMe) đã hoàn thiện.
Frontend Login UI hoàn chỉnh với TSX + Zustand + react-hook-form + Zod.
**Plan Register UI + Dashboard Shell đã được Sếp duyệt. Thực thi ngay khi bắt đầu phiên.**

### ⚠️ Ghi chú quan trọng cần xử lý đầu phiên:
1. **`registerSchema` bị thiếu** trong `d:\VLTT\VLTT\backend\src\schemas\auth.schema.ts` — Sếp đã xóa tay vào cuối phiên. Phải thêm lại trước khi code Register UI.
2. **Background image Login** nằm tại `frontend/public/images/login-bg.png` — Sếp tự lưu thủ công, không phải trong Git.

---

## 🚀 Công việc cần thực thi ngay (Plan đã duyệt)

### Bước 1 — Backend (thêm lại schema)
Thêm `registerSchema` vào `backend/src/schemas/auth.schema.ts`:
```typescript
export const registerSchema = z.object({
  body: z.object({
    ho_ten: z.string().min(2),
    email: z.string().email(),
    so_dien_thoai: z.string().optional(),
    password: z.string().min(6),
    confirmPassword: z.string(),
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })
});
```

### Bước 2 — Frontend: Register.tsx
Giao diện 2 cột theo wireframe Sếp đã gửi:
- **Cột trái (Dark Panel):** Nền `Deep Navy (#0F172A)`. Thẻ Stats "Mức độ đau 3.2/10". Review Card của Hoàng Nam ở góc dưới.
- **Cột phải (Form Panel):** Họ và Tên, Tên, SĐT, Email, Mật khẩu, Xác nhận mật khẩu, Checkbox điều khoản.
- Dùng `react-hook-form` + `zod`. Sau submit → redirect `/dashboard`.

### Bước 3 — Frontend: DashboardLayout.tsx
- Sidebar cố định bên trái: Logo + menu điều hướng (Home, Lịch hẹn, Gói, Hồ sơ, Cài đặt).
- Topbar trên: tìm kiếm + chuông + Avatar/Logout dropdown.

### Bước 4 — Frontend: Dashboard.tsx
- Lời chào: "Chào mừng trở lại, {ho_ten}!"
- Thẻ Stats mini: Lịch hẹn sắp tới, Buổi đã xong, Gói đang dùng.

### Bước 5 — Frontend: App.tsx
- Route `/register` → `Register.tsx`.
- Route `/dashboard` → bọc trong `DashboardLayout` + Route Guard (chưa đăng nhập → redirect `/login`).

---

## 🏗️ Kiến trúc & Quy tắc bắt buộc

- **NO ORM** — Chỉ dùng `pg` Raw SQL.
- **TypeScript nghiêm ngặt** — Tất cả file `.ts` / `.tsx`.
- **Design System từ `d:\DATN\WF\DESIGN.md`:**
  - Primary: `#2EC4B6` (Mint Teal)
  - Secondary: `#0F172A` (Deep Navy)
  - Accent: `#38BDF8` (Sky Blue)
  - Background: `#F8FAFC`
  - Font Heading: **Manrope** | Font Body: **Inter**
  - Border radius: 16px (button/input), 24px (card/modal)
  - Glassmorphism: `backdrop-blur-xl`, `bg-white/70`, border `border-white/50`

## 📡 Services đang chạy (cần khởi động lại)
```
cd d:\VLTT\VLTT
docker compose up -d          # Start PostgreSQL + pgAdmin

cd backend && npm run dev      # Start Backend http://localhost:5000
cd frontend && npm run dev     # Start Frontend http://localhost:5173
```

## 🔐 Credentials
| Service | URL | Login |
|---|---|---|
| Frontend | http://localhost:5173 | — |
| Backend API | http://localhost:5000 | — |
| pgAdmin | http://localhost:5050 | admin@physioflow.com / admin |
| Test Admin | http://localhost:5173/login | admin@physioflow.com / admin123 |
| GitHub | https://github.com/vinhtcpd09969-tech/PhysioFlow | — |

## 📋 Quy tắc làm việc của Agent
1. Đọc file này đầu phiên trước khi làm bất cứ điều gì.
2. Mỗi khi hoàn thành 1 task → `git add .` + `git commit` theo Conventional Commits.
3. Cuối phiên luôn hỏi: **"Sếp có muốn tôi push toàn bộ code mới nhất lên GitHub không?"**
4. Cập nhật `CURRENT_STATE.md`, `TASKS.md`, `SESSION_LOG.md` cuối mỗi phiên.

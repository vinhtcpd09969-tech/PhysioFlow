# Kế hoạch Xây dựng Website Dịch vụ Vật lý Trị liệu (PhysioFlow)

> [!IMPORTANT]
> **TÀI LIỆU NÀY BÂY GIỜ CHỈ MANG TÍNH CHẤT THAM KHẢO.**
> Dự án áp dụng triết lý tinh gọn: Làm đến đâu phát triển đến đó. Các quy trình trong tệp này sẽ được linh hoạt phát triển tiếp theo nhu cầu thực tế của dự án.

## Tổng quan dự án
Xây dựng nền tảng quản lý và cung cấp dịch vụ vật lý trị liệu PhysioFlow gồm hai phần: API Backend và Frontend (Admin Dashboard + Giao diện khách hàng). Dựa trên tài liệu `PHYSIOFLOW_CONTEXT.md` và `schema_vatlytrilieu_v4 (1).sql`.

## Loại dự án
**WEB** và **BACKEND**

## Tiêu chí thành công
- Hệ thống cơ sở dữ liệu PostgreSQL V4 được triển khai chính xác với các view và constraints (chống trùng lịch).
- Backend (Node.js/Express + TypeScript) cung cấp đủ các API cho Auth, Đặt lịch, Hồ sơ y tế, Quản lý KTV, và Quản lý Gói dịch vụ. Mọi query phải sử dụng `pg` (Raw SQL), nghiêm cấm dùng ORM.
- Frontend (React/Vite) chia đúng role (Khách hàng, Lễ tân, KTV, Admin) và tích hợp các luồng nghiệp vụ phức tạp như luồng thử nghiệm, mua gói.

## Tech Stack
- **Backend:** Node.js, Express, TypeScript, PostgreSQL, `pg` driver (Raw SQL), JWT Auth, Multer, Zod/Joi.
- **Frontend:** React (Vite), Tailwind CSS, Zustand, Zod, Axios, React Router v6.

## Cấu trúc thư mục dự kiến
```
/
├── backend/
│   ├── src/
│   │   ├── config/       # Kết nối DB, biến môi trường
│   │   ├── controllers/  # Xử lý logic request/response
│   │   ├── middlewares/  # Auth JWT, Error handling, Validation
│   │   ├── models/       # Chứa các câu query raw SQL (`pg`)
│   │   ├── routes/       # API routing
│   │   └── services/     # Business logic cốt lõi
├── frontend/
│   ├── src/
│   │   ├── api/          # Axios instance & endpoints
│   │   ├── assets/       # CSS, hình ảnh tĩnh
│   │   ├── components/   # UI components dùng chung
│   │   ├── hooks/        # Custom hooks
│   │   ├── layouts/      # Layout (Admin, Customer, Auth)
│   │   ├── pages/        # Các trang màn hình
│   │   ├── store/        # Zustand global state
│   │   └── utils/        # Helper functions
```

## Phân công Task (Task Breakdown)

### Phase 1: Database & Backend Foundation
| Task ID | Tên Task | Agent | Skills | Priority | Dependency | INPUT → OUTPUT → VERIFY |
|---------|----------|-------|--------|----------|------------|-------------------------|
| T1.1 | Khởi tạo PostgreSQL Database | `database-architect` | postgres, sql | P0 | N/A | INPUT: `schema_vatlytrilieu_v4 (1).sql` → OUTPUT: DB schema chạy thành công → VERIFY: Các bảng, roles, constraint chống trùng lịch hoạt động |
| T1.2 | Khởi tạo dự án Express TypeScript | `backend-specialist` | express, typescript, nodejs | P0 | N/A | INPUT: Lệnh init → OUTPUT: Cấu trúc backend cơ bản, kết nối DB → VERIFY: Server chạy thành công, log kết nối DB |
| T1.3 | Phát triển API Auth & User | `backend-specialist` | auth, jwt, security | P1 | T1.1, T1.2 | INPUT: Auth rules → OUTPUT: API login, register, phân quyền (4 roles) → VERIFY: JWT token gen đúng hạn, view active user map chuẩn roles |

### Phase 2: Core Business Logic (Backend)
| Task ID | Tên Task | Agent | Skills | Priority | Dependency | INPUT → OUTPUT → VERIFY |
|---------|----------|-------|--------|----------|------------|-------------------------|
| T2.1 | Cấu hình API Catalog & KTV | `backend-specialist` | api-design | P1 | T1.3 | INPUT: Logic dịch vụ, KTV → OUTPUT: API lấy ds dịch vụ, phòng trống (v_phong_san_sang_theo_dich_vu) → VERIFY: Trả đúng dữ liệu chuẩn |
| T2.2 | API Booking Core | `backend-specialist` | booking, sql | P1 | T2.1 | INPUT: Logic đặt lịch, phân bổ phòng (V4-3) → OUTPUT: API đặt lịch, xử lý constraint overlap → VERIFY: Catch đúng HTTP 409 khi có conflict lịch/phòng |
| T2.3 | API Quản lý Gói & Trial | `backend-specialist` | business-logic | P1 | T2.2 | INPUT: Flow Gói thử nghiệm → OUTPUT: API tạo gói thử, tracking buổi, kích hoạt hóa đơn → VERIFY: Tạo gói thử thành công, auto convert trạng thái |

### Phase 3: Frontend Development (Web)
| Task ID | Tên Task | Agent | Skills | Priority | Dependency | INPUT → OUTPUT → VERIFY |
|---------|----------|-------|--------|----------|------------|-------------------------|
| T3.1 | Khởi tạo dự án React + Tailwind | `frontend-specialist` | react, tailwind | P0 | N/A | INPUT: Vite init → OUTPUT: Base FE, Router layout, Zustand store → VERIFY: Chạy local thành công, theme UI/UX cao cấp |
| T3.2 | Giao diện Khách hàng (Customer App) | `frontend-specialist` | ui-components | P2 | T3.1, T1.3 | INPUT: API Docs → OUTPUT: Đăng nhập, Đặt lịch, Hồ sơ y tế, Xem gói → VERIFY: Đặt lịch thành công, UX mượt mà |
| T3.3 | Dashboard KTV & Đánh giá | `frontend-specialist` | react, ux | P2 | T3.1, T2.2 | INPUT: Luồng đánh giá → OUTPUT: Màn hình lịch làm việc, form đánh giá cơ xương khớp → VERIFY: Hiển thị nhãn "✦ AI" cho tóm tắt AI |
| T3.4 | Lễ tân & Admin Dashboard | `frontend-specialist` | table, admin-ui | P2 | T3.1, T2.3 | INPUT: Auth role lễ tân/admin → OUTPUT: Quản lý check-in (CCCD), hoá đơn, thanh toán, duyệt nghỉ → VERIFY: Xử lý checkout hóa đơn chính xác |

### Phase 4: Integration & Polish
| Task ID | Tên Task | Agent | Skills | Priority | Dependency | INPUT → OUTPUT → VERIFY |
|---------|----------|-------|--------|----------|------------|-------------------------|
| T4.1 | Kết nối FE & BE | `frontend-specialist` | axios, integration | P2 | T2.3, T3.4 | INPUT: Full app → OUTPUT: Ghép nối Axios Interceptor, JWT logic → VERIFY: Dữ liệu end-to-end xuyên suốt |
| T4.2 | Audit & Testing | `test-engineer` | testing, qa | P3 | T4.1 | INPUT: Toàn hệ thống → OUTPUT: Xử lý edge cases luồng mua gói → VERIFY: Mua gói thử, đặt lịch, hủy lịch đúng luồng |

## Phase X: Verification Checklist
- [ ] Chạy lệnh Linting (`npm run lint`) qua tất cả file Frontend và Backend.
- [ ] Xác nhận Constraints `no_overlap_ktv` & `no_overlap_phong` hoạt động đúng kỳ vọng, trả về 409 Conflict.
- [ ] Thử nghiệm flow "Gói thử nghiệm" full chu trình từ Đặt lịch -> Ký CCCD -> Hết buổi thử -> Thanh toán hóa đơn.
- [ ] Phân quyền (Roles Access): Khách không xem được hóa đơn tổng, KTV không sửa được danh mục dịch vụ.
- [ ] Nhãn `✦ AI` hiển thị đúng chỗ đối với các trường thông tin tự sinh từ AI (ai_tom_tat).
- [ ] Đảm bảo Backend sử dụng 100% `pg` Raw SQL, không tồn tại thư viện ORM.

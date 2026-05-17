# Current State

- **Ngày cập nhật:** 2026-05-17
- **Progress:** Hoàn thành tối ưu Luồng Đặt lịch & Đóng gói Tài khoản Khách hàng. Cập nhật các tài liệu tham khảo cũ sang trạng thái "Chỉ tham khảo".
- **Infrastructure:** Backend & Frontend running stable.

## Stack đang chạy
- Backend: `http://localhost:5000` (Express + TypeScript + PostgreSQL, mô hình 3 Lớp)
- Frontend: `http://localhost:5173` (Vite + React TSX + Tailwind, mô hình Feature-Based)
- Database: Docker PostgreSQL (`physioflow_db` - port 5432)

## Những gì đã hoàn thành

### Module Admin (Full Phase 1-6):
- **Admin Dashboard & Layout:** Sidebar chuyên nghiệp, Recharts hiển thị doanh thu.
- **Quản lý Tài nguyên:** CRUD Dịch vụ, Phòng, Gói điều trị, Thiết bị y tế (theo dõi bảo trì).
- **Quản lý Nhân sự & Khách hàng:** Quản lý toàn bộ tài khoản nhân viên (Khóa/Mở khóa) và danh sách Khách hàng.
- **Tài chính & Marketing:** Quản lý Voucher, Hóa đơn và tính năng Hoàn tiền.
- **Hồ sơ y tế:** Giao diện tra cứu Bệnh án.

### Luồng Đặt lịch Xác thực Thông minh (Smart Booking Flow):
- **Xem Lịch Tự do:** Mở lại `/booking` công cộng giúp khách chưa có tài khoản có thể trải nghiệm xem ngày, giờ trống, chọn lịch và điền triệu chứng.
- **Modal Chặn Thân Thiện (Premium UX Popup):** Chỉ khi bấm "Xác nhận đặt hẹn khám", hệ thống mới kích hoạt Modal Popup kính mờ (Hủy bỏ / Đăng nhập ngay) thay vì đẩy ép khách ra trang đăng nhập một cách đột ngột.
- **Auto-save & Restore:** Tự lưu tạm thông tin lịch đặt vào `localStorage` trước khi chuyển sang `/login`, và tự khôi phục trọn vẹn khi khách đăng nhập/đăng ký thành công quay lại.
- **Auto-fill & Read-only:** Tự động điền Họ và tên từ tài khoản người dùng và khóa cứng (Read-only) bảo vệ danh tính y khoa.
- **Database Smart Mapping:** Cập nhật Controller, Service, Repository và Zod Schema để nhận diện `nguoi_dung_id`, tự động truy vết ra ID Hồ sơ bệnh án tương ứng để lưu thông tin đồng bộ.

## Trạng thái tài liệu quan trọng
- `backend/src/routes/*` — Các entry point của API.
- `frontend/src/features/*/pages/*` — Nơi chứa toàn bộ Pages.
- `frontend/src/routes/AppRoutes.tsx` — Routing hệ thống.
- `VLTT/PHYSIOFLOW_CONTEXT.md` — **Chỉ mang tính chất tham khảo** (Agile/Tinh gọn: làm đến đâu phát triển đến đó).
- `VLTT/MODULE_ARCHITECTURE.md` — **Chỉ mang tính chất tham khảo**.
- `VLTT/PLAN-physio-website.md` — **Chỉ mang tính chất tham khảo**.
- `VLTT/PLAN-pm-roadmap.md` — **Chỉ mang tính chất tham khảo**.

### 🔴 Lỗi cần giải quyết
- Không có lỗi nghiêm trọng. Project đang chạy rất mượt.

### 🔜 Bước tiếp theo
- Triển khai các tính năng tinh gọn tiếp theo dành cho **Lễ tân** hoặc phát triển luồng Portal cá nhân sâu hơn cho **Khách hàng** (Theo dõi bệnh án, xem lịch trình cá nhân).

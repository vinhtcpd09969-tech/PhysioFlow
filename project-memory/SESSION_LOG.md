# Session Log

... (Giữ các session trước)

## Session 6 — 2026-05-16 (Admin Module Full Expansion & Route Refactoring)
- **Admin Module (Phase 1-5):**
  - Xây dựng hệ thống quản trị toàn diện cho Super Admin Dashboard.
  - **Quản lý Tài nguyên:** Hoàn thiện CRUD cho Dịch vụ, Danh mục, Gói điều trị, Thiết bị y tế (theo dõi bảo trì, gán phòng).
  - **Quản lý Nhân sự & Khách hàng:** Xây dựng màn hình quản lý toàn bộ nhân viên phòng khám và danh sách khách hàng (tra cứu thông tin, reset mật khẩu).
  - **Quản lý Lịch trình:** Xây dựng hệ thống xếp lịch trực (Working Schedules) cho KTV/Bác sĩ theo khung giờ và thứ trong tuần.
  - **Lịch hẹn (Master View):** Tích hợp trang Quản lý Lịch hẹn tổng quan cho Admin, hỗ trợ kiểm soát toàn bộ lịch đặt trong hệ thống.
  - **Hồ sơ y tế:** Xây dựng màn hình tra cứu Bệnh án/Lượng giá (Assessment Records) dành cho Admin để giám sát chất lượng điều trị.
  - **Audit Logging:** Triển khai bảng `system_audit_log` (tách biệt khỏi bảng audit cũ bị lỗi schema) và tiện ích `logAudit` để truy vết hành động nhạy cảm.
- **Backend Architecture:**
  - Thực hiện tái cấu trúc lớn (Refactoring) hệ thống Route: Phân tách rạch ròi `/api/client` (dành cho các tác vụ công khai của khách hàng) và `/api/admin` (dành cho các tác vụ nội bộ yêu cầu quyền Admin/Nhân viên).
  - Di chuyển các endpoint Lịch hẹn nội bộ vào `admin.routes.ts` để tăng cường bảo mật.
- **Frontend Refinement:**
  - Cập nhật `AdminLayout.tsx` với bộ Sidebar đầy đủ tính năng: Lịch hẹn, Ca làm việc, Khách hàng, Thiết bị, v.v.
  - Đồng bộ hóa toàn bộ API calls trên Frontend (`Booking.tsx`, `Appointments.tsx`) để tương thích với cấu trúc Route mới.
- **Lưu ý:** Hệ thống đã sẵn sàng cho Phase 6 (Tài chính & Báo cáo).

## Session 7 — 2026-05-16 (Admin Finalization - Phase 6)
- **Tài chính (Finance):**
    - Triển khai API lấy danh sách Hóa đơn (`hoa_don`) và Giao dịch thanh toán (`thanh_toan`).
    - Xây dựng tính năng **Hoàn tiền (Refund)** với Database Transaction bảo đảm tính nhất quán dữ liệu.
    - Phát triển trang `ManageFinance.tsx` với giao diện cao cấp, theo dõi doanh thu và trạng thái thanh toán.
- **Marketing (Vouchers):**
    - Hoàn thiện CRUD API cho hệ thống Voucher & Khuyến mãi.
    - Xây dựng trang `ManageVouchers.tsx` dạng Card hiện đại, hỗ trợ tạo mới và quản lý chiến dịch marketing.
- **Đánh giá (Feedback):**
    - Triển khai API tra cứu phản hồi khách hàng sau các buổi trị liệu.
    - Xây dựng trang `ViewFeedback.tsx` hiển thị đánh giá Star Rating và nhận xét chi tiết.
- **Báo cáo & Phân tích (Analytics):**
    - Xây dựng bộ API thống kê: Tổng quan số liệu (Summary), Doanh thu 6 tháng gần nhất (Revenue), và Hiệu suất nhân viên (Staff Performance).
    - Tích hợp thư viện **Recharts** vào `AdminDashboard.tsx`.
    - Thiết kế Dashboard chuyên nghiệp với biểu đồ Area Chart và Bar Chart thời gian thực.
- **Kết quả:** Hoàn tất toàn bộ Module Admin (Phase 6). Dự án đã sẵn sàng cho Phase tiếp theo (Module Lễ tân).

## Session 8 — 2026-05-16 (Bảo trì Kiến trúc - Architecture Overhaul & Admin Finalization)
- **Backend Refactoring (3-Tier Architecture):**
    - Chuyển đổi toàn bộ Backend từ mô hình "Fat Controller" sang cấu trúc 3 lớp chuẩn: **Controller - Service - Repository**.
    - Tách logic SQL sang `repositories/` và nghiệp vụ sang `services/`, giúp Controller trở nên siêu mỏng (chỉ xử lý Request/Response).
    - Cập nhật Type Checking cho Express 5 (`req.params` casting).
- **Frontend Refactoring (Feature-based Architecture):**
    - Chuyển đổi Frontend từ mô hình phẳng (Flat) sang **Screaming Architecture** (nhóm theo Feature).
    - Cấu trúc lại toàn bộ các trang thành các thư mục: `features/admin`, `features/auth`, `features/customer`, `features/receptionist`.
    - Tách biệt `routes/`, bóc tách các reusable components.
- **Admin Module Finalization:**
    - Cấu hình lại các file Dashboard Frontend để gọi đúng API (`api.ts` thay vì `axios` thô), parse dữ liệu doanh thu chính xác cho **Recharts**.
    - Tích hợp logic **Khóa/Mở khóa Nhân sự** và **Hoàn tiền giao dịch** vào giao diện Admin.
    - Cấu trúc lại `admin.api.ts` để gom nhóm toàn bộ 26 endpoints của Admin.

## Session 9 — 2026-05-16 (Fixing Admin Appointments & API Setup)
- **Lịch hẹn Admin:**
    - Triển khai **Slide-over NewAppointmentForm** hỗ trợ tạo lịch hẹn cho khách vãng lai và khách cũ.
    - Xử lý lỗi `500 Internal Server Error` bằng cách thêm bảng `lich_lam_viec_ktv` còn thiếu vào Schema và sửa logic truyền `ky_thuat_vien_id` thay vì `nguoi_dung_id`.
    - Giải quyết lỗi lệch múi giờ (UTC vs Local) hiển thị sai 7 tiếng bằng cách áp dụng `AT TIME ZONE 'UTC'` trong Repository.
    - Thêm thông báo **React Hot Toast** thiết kế theo UI/UX chuẩn cao cấp.
- **Hệ thống Test & Tài liệu API:**
    - Cài đặt và cấu hình thành công **Swagger UI** (`swagger-ui-express`) tích hợp thẳng vào Backend, tự động hóa tài liệu cho các routes (ví dụ: Appointments).

## Session 10 — 2026-05-17 (Secure Booking Flow & Smart UX Modal)
- **Xác thực Luồng Đặt lịch tinh gọn (Secure Booking Flow):**
    - Mở lại `/booking` công cộng để khách vãng lai và người chưa đăng ký trải nghiệm xem lịch trình trước khi quyết định tạo tài khoản.
    - Tích hợp **Modal Popup Kính Mờ (Glassmorphism Modal)** cực đẹp khi người dùng chưa đăng nhập bấm nút Xác nhận đặt hẹn, cung cấp hai tùy chọn: Hủy bỏ hoặc Đăng nhập/Đăng ký.
    - Triển khai cơ chế **Smart Auto-save/Restore** lưu tạm các tùy chọn ngày/giờ/triệu chứng đã điền vào `localStorage` trước khi chuyển tiếp sang `/login`, và tự khôi phục trọn vẹn khi đăng nhập/đăng ký thành công quay lại.
    - Tự động điền (Auto-fill) thông tin họ tên của tài khoản đăng nhập vào form đặt lịch và ghim dạng **Read-only (chỉ đọc)** nhằm duy trì tính nhất quán bệnh án.
- **Backend API Integration:**
    - Nâng cấp Zod Schema và SQL Repository để nhận dạng và lưu trữ tham số `nguoi_dung_id` từ trình duyệt.
    - Thiết lập logic tra cứu ngược tại tầng cơ sở dữ liệu (`appointment.repository.ts`) để tự động tìm ID hồ sơ khách hàng (`khach_hang_id`) tương ứng trong bảng `khach_hang` từ `nguoi_dung_id`, ghim chặt ca hẹn vào đúng hồ sơ y tế mà không làm thay đổi các API public ban đầu.
- **Cập nhật Tài liệu Định hướng (Documentation Update):**
    - Ghi chú rõ ràng lên đầu các tệp: `PHYSIOFLOW_CONTEXT.md`, `MODULE_ARCHITECTURE.md`, `PLAN-physio-website.md`, và `PLAN-pm-roadmap.md` rằng chúng hiện tại **chỉ mang tính chất tham khảo**. Dự án phát triển theo triết lý tinh gọn Agile: "Làm đến đâu phát triển đến đó".


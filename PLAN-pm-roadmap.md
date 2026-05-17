# Roadmap Phát triển - Dự án PhysioFlow (Product Manager View)

> [!IMPORTANT]
> **TÀI LIỆU NÀY BÂY GIỜ CHỈ MANG TÍNH CHẤT THAM KHẢO.**
> Dự án áp dụng triết lý tinh gọn: Làm đến đâu phát triển đến đó. Các quy trình trong tệp này sẽ được linh hoạt phát triển tiếp theo nhu cầu thực tế của dự án.

## 1. Problem Statement
Các cơ sở vật lý trị liệu đang gặp khó khăn trong việc quản lý đồng bộ lịch hẹn, phòng máy, kỹ thuật viên (KTV) và hồ sơ y tế bệnh nhân. Hệ thống cần giải quyết bài toán chống trùng lịch, quản lý lộ trình điều trị qua các gói dịch vụ (đặc biệt là tính năng dùng thử) và theo dõi kết quả đánh giá lâm sàng.

## 2. Target Audience & Roles
- **Khách hàng**: Người dùng dịch vụ, cần xem lịch, đăng ký gói, đánh giá.
- **Lễ tân**: Quản lý điều phối, check-in CCCD, xử lý thanh toán, hóa đơn.
- **Kỹ thuật viên (KTV)**: Quản lý lịch làm việc cá nhân, đánh giá bệnh án, ghi chú buổi tập.
- **Admin**: Quản trị viên hệ thống, quản lý danh mục, phòng, báo cáo.

---

## 3. Roadmap & Module Breakdown

### Module 1: Core & Authentication (P0)
**Mục tiêu**: Xây dựng nền tảng cơ bản, phân quyền người dùng và bảo mật.

#### User Stories
1. **[US-1.1]** Là **Admin**, tôi muốn **tạo và quản lý tài khoản cho KTV/Lễ tân**, để **họ có thể đăng nhập vào hệ thống**.
2. **[US-1.2]** Là **Người dùng (tất cả roles)**, tôi muốn **đăng nhập bằng email/SĐT và mật khẩu**, để **truy cập vào đúng dashboard theo phân quyền**.

#### Acceptance Criteria
- [ ] Mật khẩu được mã hóa an toàn (hash).
- [ ] Sử dụng JWT Token (Access 15m, Refresh 7d).
- [ ] Giao diện tự động điều hướng sang đúng Dashboard dựa vào `ma_vai_tro` ('khach_hang', 'le_tan', 'ky_thuat_vien', 'admin').

---

### Module 2: Lễ tân & Quản lý Lịch hẹn Cốt lõi (P1)
**Mục tiêu**: Điều phối hoạt động phòng khám hàng ngày.

#### User Stories
1. **[US-2.1]** Là **Lễ tân**, tôi muốn **xem lịch trình của tất cả KTV và Phòng trong ngày**, để **nắm bắt tình trạng phục vụ**.
2. **[US-2.2]** Là **Lễ tân**, tôi muốn **check-in cho khách bằng cách thu thập CCCD (Mặt trước/sau)**, để **xác minh danh tính trước khi dùng gói thử nghiệm**.
3. **[US-2.3]** Là **Lễ tân**, tôi muốn **thu tiền hóa đơn và cập nhật trạng thái thanh toán**, để **kích hoạt gói điều trị cho khách**.

#### Acceptance Criteria
- [ ] Giao diện Dashboard hiển thị lưới lịch hẹn theo thời gian thực.
- [ ] Thu thập CCCD bắt buộc phải lưu ảnh lên storage, không được xóa theo quy định soft-delete.
- [ ] Hóa đơn chỉ chuyển sang `'da_thanh_toan'` khi tổng tiền trả >= tổng tiền hóa đơn. Gói liên quan tự động cập nhật `ngay_kich_hoat`.
- [ ] Bắt lỗi HTTP 409 từ DB nếu lịch bị trùng (Constraint `no_overlap_ktv` / `no_overlap_phong`).

---

### Module 3: Kỹ thuật viên & Quản lý Bệnh án (P1)
**Mục tiêu**: Số hóa quá trình thăm khám và điều trị.

#### User Stories
1. **[US-3.1]** Là **KTV**, tôi muốn **điền phiếu Đánh giá ban đầu (vùng đau, linh hoạt, chẩn đoán)**, để **đề xuất phác đồ điều trị phù hợp**.
2. **[US-3.2]** Là **KTV**, tôi muốn **ghi chú lại chi tiết từng buổi trị liệu (điểm đau, kỹ thuật, vùng tác động)**, để **theo dõi tiến trình hồi phục của khách**.
3. **[US-3.3]** Là **KTV**, tôi muốn **xem AI tóm tắt tình trạng bệnh án**, để **đọc nhanh trước khi bước vào buổi trị liệu tiếp theo**.

#### Acceptance Criteria
- [ ] Form Đánh giá ban đầu lưu đầy đủ dữ liệu vào `danh_gia` và `ket_qua_danh_gia`.
- [ ] Hệ thống AI sinh tóm tắt (`ai_tom_tat_ngan`) thành công và hiển thị kèm nhãn **"✦ AI"**.
- [ ] Ghi chú buổi được liên kết đúng vào `buoi_tri_lieu_id`.

---

### Module 4: Khách hàng & Gói dịch vụ (P2)
**Mục tiêu**: Tối ưu trải nghiệm khách hàng và tăng doanh thu.

#### User Stories
1. **[US-4.1]** Là **Khách hàng**, tôi muốn **đăng ký gói "dùng thử" (Trial)**, để **trải nghiệm trước khi quyết định mua**.
2. **[US-4.2]** Là **Khách hàng**, tôi muốn **đặt lịch hẹn trực tuyến**, để **chủ động thời gian đến phòng khám**.
3. **[US-4.3]** Là **Khách hàng**, tôi muốn **theo dõi số buổi còn lại trong gói của mình**, để **biết khi nào cần gia hạn**.

#### Acceptance Criteria
- [ ] Luồng gói dùng thử cho phép tạo lịch (tối đa 3 buổi) mà chưa cần thanh toán hóa đơn.
- [ ] Sau buổi thử cuối, hệ thống chốt deadline thanh toán. Trạng thái khách từ chối/quá hạn sẽ khóa chức năng đặt lịch mới cho đến khi hoàn tất thanh toán lẻ.
- [ ] Cột `buoi_con_lai` tự động tính bằng `tong_buoi - buoi_da_dung`.

---

### Module 5: Admin & Hệ thống (P3)
**Mục tiêu**: Thiết lập danh mục và giám sát hệ thống.

#### User Stories
1. **[US-5.1]** Là **Admin**, tôi muốn **quản lý danh mục Dịch vụ và Phòng (kèm thiết bị yêu cầu)**, để **đảm bảo logic đặt phòng hoạt động chính xác**.
2. **[US-5.2]** Là **Admin**, tôi muốn **quản lý Gói điều trị (Package Catalog)**, để **set giá và số buổi định mức**.
3. **[US-5.3]** Là **Admin**, tôi muốn **xem nhật ký hệ thống (Audit Log)**, để **truy vết các thay đổi quan trọng như hoàn tiền, ghi đè AI**.

#### Acceptance Criteria
- [ ] Dịch vụ được map đúng với phòng thông qua `phong_dich_vu` và logic lọc phòng `v_phong_san_sang_theo_dich_vu`.
- [ ] Bảng `audit_log` ghi nhận mọi thay đổi trạng thái quan trọng kèm User ID, IP và payload.

---

## 4. Phase X: Kế hoạch Kiểm thử & Bàn giao
- [ ] Hoàn tất Unit Tests cho các luồng nghiệp vụ Core (Booking conflict, Package trial).
- [ ] Đánh giá UX Audit cho màn hình Lễ tân (cần thao tác nhanh).
- [ ] Security Scan đảm bảo không lộ thông tin cá nhân (CCCD, Hồ sơ bệnh án).

> **Ghi chú**: Không có chức năng Telemedicine, Quản lý kho, hay Tích hợp cổng thanh toán tự động (theo đúng giới hạn phạm vi dự án).

# Kiến trúc Nghiệp vụ (Simplified Domain Architecture) - V5

Dựa trên phân tích tối ưu trải nghiệm khách hàng và quy trình vận hành thực tế tại phòng khám Vật lý trị liệu cao cấp dành cho dân văn phòng, kiến trúc hệ thống được tinh gọn và tổ chức lại như sau:

## 1. Nguyên tắc cốt lõi (Core Principles)
- **Single Entry Point (Cửa ngõ duy nhất):** Mọi khách hàng mới đặt lịch qua web đều mặc định sử dụng dịch vụ "Khám tại phòng khám". Không có lựa chọn gói phức tạp trên web.
- **Doctor Gateway (Bác sĩ là trung tâm):** Bác sĩ là người quyết định phác đồ cuối cùng, đảm bảo an toàn y khoa và loại trừ chống chỉ định.
- **Trust-building Policy (Chính sách Trải nghiệm):** Trải nghiệm 3 buổi đầu, thanh toán tại buổi thứ 4. Nếu hủy gói, hoàn tiền 50% số buổi còn lại.

## 2. Ma trận Vai trò & Màn hình (Actor - Screen Matrix)
Hệ thống gồm 5 vai trò chính với các màn hình riêng biệt:

| Vai trò (Actor) | Quyền hạn (Permissions) | Màn hình tương tác chính |
| :--- | :--- | :--- |
| **Khách hàng** (Customer) | Xem hồ sơ, theo dõi tiến độ gói, đánh giá KTV | Dashboard cá nhân (Portal) |
| **Bác sĩ** (Doctor) | Khám lượng giá, tạo hồ sơ y tế, chốt gói điều trị | Màn hình Khám bệnh & Chỉ định |
| **Lễ tân** (Receptionist)| Quản lý lịch hẹn, thu tiền, kích hoạt gói | Màn hình Lịch hẹn, Màn hình Thanh toán |
| **Kỹ thuật viên** (Technician) | Xem lịch làm việc, điền SOAP note sau buổi tập | Màn hình Trị liệu & Ghi chú |
| **Quản trị viên** (Admin) | Quản lý toàn bộ nhân sự, danh mục, báo cáo | Dashboard Admin (Full Access) |

## 3. Luồng Đặt lịch & Trị liệu Tinh gọn (Simplified Booking Flow)

### Giai đoạn 1: Đặt lịch (Online)
1. Khách hàng truy cập Landing Page.
2. Chọn "Đặt lịch khám" ➔ Chọn Ngày/Giờ.
3. Điền thông tin cơ bản: Triệu chứng, Lý do khám, Hình ảnh đính kèm (nếu có).
4. Xác nhận đặt lịch (Phí khám 300.000đ được ghi chú rõ là sẽ miễn phí nếu dùng dịch vụ).

### Giai đoạn 2: Khám & Lượng giá (Tại phòng khám)
1. Khách đến phòng khám, Lễ tân check-in.
2. **Khám Bác sĩ:** Bác sĩ mở hồ sơ, xem trước hình ảnh/triệu chứng khách đã gửi.
3. Bác sĩ tư vấn phác đồ và chỉ định **Gói điều trị**.

### Giai đoạn 3: Thanh toán & Kích hoạt Gói
1. Khách hàng đồng ý phác đồ. Lễ tân thu **Phí lượng giá ban đầu** (Ví dụ 300k).
2. Lễ tân tạo Đăng ký gói trên hệ thống với trạng thái `DANG_TRAI_NGHIEM`.
3. Hệ thống mở khóa **3 buổi trải nghiệm đầu tiên**. Số tiền 300k được ghi nhận là một khoản "Trừ vào gói".

### Giai đoạn 4: Cam kết & Trị liệu
1. Khách hàng tập 3 buổi đầu với KTV.
2. **Buổi thứ 4:** Hệ thống khóa lịch. Khách hàng phải thanh toán phần tiền còn lại của gói (hoặc thanh toán đợt 1 nếu trả góp). Trạng thái chuyển thành `DA_KICH_HOAT`.
3. Khách hàng tiếp tục tập các buổi còn lại theo phác đồ.

## 4. Chính sách Hủy & Hoàn tiền (Refund Logic)
Hệ thống cung cấp nút "Hủy gói" cho Lễ tân, tự động tính toán hoàn tiền để đảm bảo tính công bằng:
*   **Công thức:** `Số tiền hoàn = (Giá gói / Tổng số buổi) * (Số buổi chưa tập) * 50%`

## 5. Database Modifications (Cho luồng tinh gọn này)
*   **Thêm Vai trò:** Bổ sung `bac_si` vào bảng `vai_tro`.
*   **Bảng `lich_dat`:** Cần thêm các cột để hứng dữ liệu từ Web Form: `trieu_chung`, `ly_do_kham`, `anh_dinh_kem`, `gioi_tinh_khach`.
*   **Bảng `dang_ky_goi`:** Thêm trạng thái `dang_trai_nghiem`.

---
*Tài liệu này thay thế cho các luồng nghiệp vụ phức tạp trước đó, đảm bảo tốc độ triển khai phần mềm nhanh nhất và tối ưu trải nghiệm người dùng nhất.*

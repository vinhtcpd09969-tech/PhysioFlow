# Nhật ký cuối buổi làm việc - PhysioFlow

File này ghi lại toàn bộ các thay đổi về tính năng, giao diện và cấu trúc cơ sở dữ liệu được thực hiện bởi các thành viên trong nhóm cuối mỗi buổi làm việc.

---

## 📅 Phiên làm việc ngày: 30/06/2026 (10:35 AM)
**Thành viên thực hiện**: AI Assistant (Antigravity) & Trưởng nhóm phát triển

### 1. Thay đổi Giao diện & Trải nghiệm (UI/UX)
*   **Inline Transitions**: Chuyển đổi hai biểu mẫu **Thêm dịch vụ** và **Thêm gói dịch vụ** từ dạng Popup Modal chồng đè màn hình sang dạng **Form Inline trượt ngang mượt mà** (Framer Motion) ngay trong luồng của trang hiện tại.
*   **Fix Footer Clipping**: Loại bỏ các thuộc tính flex giới hạn chiều cao `overflow-hidden` trên thẻ `<form>` của cả [ServiceFormModal.tsx](file:///d:/VLTT/VLTT/frontend/src/features/admin/components/services/ui/ServiceFormModal.tsx) và [PackageModal.tsx](file:///d:/VLTT/VLTT/frontend/src/features/admin/components/PackageModal.tsx) giúp ngăn chặn hiện tượng cắt đôi các nút bấm ở cuối form.

### 2. Logic Nghiệp vụ & Validation
*   **Zod Price Validation**: Thêm luật kiểm tra logic trong [PackageModal.tsx](file:///d:/VLTT/VLTT/frontend/src/features/admin/components/PackageModal.tsx) - Bắt buộc **Giá gốc (chưa giảm) phải lớn hơn hoặc bằng Giá bán thực tế**. Nếu nhập sai sẽ hiện cảnh báo đỏ trực quan ngăn không cho submit.

### 3. Quy trình Lập hóa đơn & Tiếp đón Lễ tân
*   **Mở khóa Quầy Thanh toán**: Loại bỏ cấu hình tự động redirect bắt buộc mã `lich_dat_id` trên URL của [QuickBilling.tsx](file:///d:/VLTT/VLTT/frontend/src/features/receptionist/pages/QuickBilling.tsx), cho phép Lễ tân truy cập thẳng từ menu để lựa chọn bệnh nhân thủ công ở Bước A.
*   **Menu Sidebar Lễ tân**: Thêm nút điều hướng **Lập hóa đơn & Gói** vào menu bên trái trong [ReceptionistLayout.tsx](file:///d:/VLTT/VLTT/frontend/src/layouts/ReceptionistLayout.tsx).
*   **Nút thanh toán nhanh**: Bổ sung nút **💵 Thanh toán / Lập gói** trực tiếp trong [AppointmentDetailModal.tsx](file:///d:/VLTT/VLTT/frontend/src/features/admin/components/AppointmentDetailModal.tsx) cho các lịch hẹn khám lâm sàng đã hoàn thành để chuyển hướng nhanh.

### 4. Dữ liệu Kiểm thử (Test Data)
*   **Tạo dữ liệu ca khám lượng giá hoàn thành**: Chạy script tạo thành công ca khám hoàn thành mã **`LD-428638`** cho khách hàng *Nguyễn Văn An*.
*   **Tạo dữ liệu khớp bảng giờ**: Tạo thêm ca khám hoàn thành mã **`LD-EXACT165`** lúc **`08:00 AM`** ngày 29/06/2026 khớp với khung giờ chẵn để hiển thị trên bảng lưới thời gian thực của Lễ tân và Admin.

### 5. Cấu trúc Database & Quy chuẩn
*   Khởi tạo cấu trúc quy chuẩn quản lý DB mới trong thư mục `/database`.
*   Tách biệt dữ liệu mẫu thành: `base_system_data.sql` (hệ thống) và `demo_data.sql` (dữ liệu giao dịch test).
*   **Dọn dẹp mã nguồn gốc**: Đã xóa bỏ hoàn toàn các file thiết kế DB và tài liệu tạm bợ ngoài thư mục gốc bao gồm: `remove-admin-audit-logs.md`, `office_care_dbdiagram.sql`, `office_care_dbml.dbml` và `office_care_schema.sql`.

---

## 📅 Phiên làm việc ngày: 02/07/2026 (01:40 AM)
**Thành viên thực hiện**: AI Assistant (Antigravity) & Trưởng nhóm phát triển

### 1. Thay đổi Giao diện & Trải nghiệm (UI/UX)
*   **Thống kê gói Pro-Max**: Thiết kế lại trang cấu hình gói dịch vụ tích hợp lưới 5 thẻ KPI thống kê động (Tổng số thiết lập, Khám tư vấn, Trị liệu lẻ, Liệu trình chuyên sâu, Số buổi trung bình mỗi liệu trình) dựa trên dữ liệu thật của hệ thống.
*   **Bộ lọc Phân loại & Chuyên khoa**: Thêm hàng Tab bộ lọc phân loại dạng viên thuốc (Pills) độc đáo. Đồng thời lọc động danh mục chuyên khoa trong Dropdown ăn khớp với Tab phân loại đang chọn để tránh tình trạng hiển thị 0 kết quả gây bối rối cho người dùng.
*   **Ảnh đại diện Gói dịch vụ**: Thiết kế thêm cột ảnh đại diện lâm sàng thực tế dạng bo tròn tinh tế bên cạnh thông tin chi tiết mỗi gói dịch vụ.
*   **Cải tiến Tiêu đề bảng**: Thiết kế lại thanh tiêu đề bảng sang dạng gradient kính mờ kèm các biểu tượng SVG tương ứng cho từng cột chỉ số.

### 2. Logic Nghiệp vụ & Sửa lỗi (Bug Fixes)
*   **Xác nhận Nút (ConfirmDialog)**: Khắc phục lỗi nút Xác nhận bị vô hình do dùng mã màu không chuẩn (`from-teal-650`). Hiện tại nút sử dụng màu cam/vàng gradient chuẩn của hệ thống, nổi bật sắc nét 50/50 bên cạnh nút Hủy bỏ.
*   **Tìm kiếm Gõ mượt mà & Không dấu**: Khắc phục lỗi con trỏ nhảy lung tung bằng cách tách biệt local state của ô Tìm kiếm khỏi URL search parameters. Đồng thời tích hợp cơ chế chuẩn hóa chuỗi tiếng Việt giúp tìm kiếm không dấu thông minh (gõ "gia" vẫn khớp với gói "Giải cơ sâu").
*   **Ổn định Danh mục lúc mở Form**: Sửa lỗi race condition bằng giải pháp **Ref-based change detector** (`prevLoaiGoiRef`). Chỉ reset danh mục chuyên khoa khi người dùng click thay đổi loại gói trên màn hình, giải quyết triệt để lỗi "lúc có lúc không" khi mở xem chi tiết gói.

### 3. Cơ sở dữ liệu & Phục hồi dữ liệu
*   **Xóa mềm (Soft Delete) gói dịch vụ**: Chuyển đổi cơ chế xóa gói dịch vụ tại `admin.repository.ts` từ xóa cứng vật lý (`DELETE`) sang xóa mềm logic (Cập nhật `trang_thai = 'da_xoa'`). Điều này đảm bảo an toàn tuyệt đối cho dữ liệu lịch sử và các bảng liên quan.
*   **Phục hồi gói bị xóa**: Chạy script phục hồi thành công dữ liệu và ảnh của gói `"Gói Phục Hồi Chấn Thương Thể Thao & Viêm Gân Cấp"` (`id = 'c1000000-0000-0000-0000-000000000003'`) với đầy đủ phác đồ mô tả.
*   **Tạo cấu trúc thư mục hình ảnh**: Tạo sẵn các thư mục `/public/goi/images`, `/public/nhan_su/images`, `/public/khach_hang/images` để nạp hình ảnh thực tế cho gói, nhân viên và khách hàng.

---

## 📅 Phiên làm việc ngày: 02/07/2026 (02:00 PM)
**Thành viên thực hiện**: AI Assistant (Antigravity) & Trưởng nhóm phát triển

### 1. Thay đổi Cấu trúc Cơ sở dữ liệu (Database Schema) & Dọn dẹp
*   **Bổ sung Cột Vận hành & Xóa cột dư thừa**:
    *   Thêm 2 cột `@db.Text` mới vào model `goi_dich_vu` trong `schema.prisma`: `quy_trinh` và `muc_tieu`.
    *   Xóa bỏ hoàn toàn cột `mo_ta` ở bảng `goi_dich_vu` để tránh dư thừa dữ liệu tĩnh.
*   **Đồng bộ DB Push**: Chạy lệnh `npx prisma db push --accept-data-loss` để áp dụng cấu trúc trực tiếp vào PostgreSQL.
*   **Cập nhật SQL Dump**: Chạy script `npm run db:dump-base` để tự động làm mới và xuất toàn bộ dữ liệu mẫu cấu trúc mới ra các tệp `base_system_data.sql` và `demo_data.sql` không còn cột `mo_ta`.

### 2. Giao diện Cấu hình Admin & Form thêm/sửa Gói
*   **Package Modal & Admin Dashboard**:
    *   Tích hợp 2 trường nhập Textarea động bắt buộc: **"Quy trình trị liệu *"** (`quy_trinh`) và **"Mục tiêu trị liệu *"** (`muc_tieu`).
    *   Loại bỏ hoàn toàn trường nhập **"Mô tả phác đồ điều trị"** (`mo_ta`) khỏi Form Admin và Zod Schema để đồng nhất với database.
    *   Cập nhật SQL update/insert và mapping trong `AdminRepository` cũng như giao diện danh sách gói để hiển thị `quy_trinh`/`muc_tieu` thay thế cho cột `mo_ta`.

### 3. Giao diện Chi tiết Bệnh nhân (Khám, Lẻ & Liệu trình)
*   **Thiết kế Card chia đôi tinh gọn (Side-by-side Layout)**:
    *   Thay đổi trang chi tiết dịch vụ [ServiceDetailPage.tsx](file:///d:/VLTT/VLTT/frontend/src/features/public/pages/ServiceDetailPage.tsx) từ hai phần khối dọc cao chiếm nhiều diện tích thành **1 Card duy nhất có chiều cao nhỏ gọn**.
    *   Card được chia đôi: Cột bên trái hiển thị **Quy trình trị liệu y khoa** (dưới dạng các bước đánh số `1`, `2`...), cột bên phải hiển thị **Mục tiêu & Lợi ích trị liệu** (dạng gạch đầu dòng với dấu tích `✓` xanh lục).
*   **Dynamic hoàn toàn trang Chi tiết Liệu trình (`PackageDetailPage.tsx`)**:
    *   Viết lại toàn bộ trang [PackageDetailPage.tsx](file:///d:/VLTT/VLTT/frontend/src/features/public/pages/PackageDetailPage.tsx), loại bỏ hoàn toàn mã tĩnh dài dòng trước đây (giảm từ 1095 dòng xuống còn ~200 dòng).
    *   Trang lấy dữ liệu thật trực tiếp từ API `/packages` của Backend, hiển thị ảnh thật, tên thật và áp dụng chính xác thiết kế **Card chia đôi (Quy trình bên trái - Mục tiêu bên phải)** giống hệt trang chi tiết của Khám và Lẻ.
    *   Nút đăng ký đặt lịch được liên kết chuyển hướng thông minh sang loại khám lâm sàng theo đúng yêu cầu nghiệp vụ.

---

## 📅 Phiên làm việc ngày: 04/07/2026 (12:20 AM)
**Thành viên thực hiện**: AI Assistant (Antigravity) & Trưởng nhóm phát triển

### 1. Sửa lỗi & logic quầy thanh toán (QuickBilling):
*   **Fix 500 Error ở API `/packages`**: Thay thế cột không tồn tại `mo_ta` bằng `muc_tieu as mo_ta` trong câu lệnh SQL `getActivePackages` ở `receptionist.repository.ts`.
*   **Đồng bộ gói chỉ định y khoa**: Cập nhật hàm `getCompletedAppointments` để lấy chính xác ID gói dịch vụ được bác sĩ chỉ định từ bảng `chi_dinh_buoi` thông qua nhật ký ca khám của cuộc hẹn, thay vì lấy trường `phac_do_dieu_tri_id` trong `cuoc_hen` (vốn đang là NULL trước khi thanh toán).
*   **Tự động hóa nạp thông tin thanh toán**: Cập nhật hàm `handleSelectCompletedConsultation` ở Frontend. Khi lễ tân click chọn một ca khám hoàn thành trong danh sách Bước A, Frontend sẽ tự động kiểm tra gói chỉ định y khoa, chọn đúng gói trị liệu đó và tự động chuyển sang tab "Thanh toán Gói trị liệu".

### 2. Quy trình & Giao diện lịch khám Bác sĩ & KTV:
*   **Bộ chọn ngày/tuần/tháng & Capacity View**: Tích hợp thanh công cụ lọc và chế độ xem công suất (Workload/Capacity View) từ Admin vào trang lịch hẹn bác sĩ và KTV.
*   **Sửa logic đếm ca KPI**: Điều chỉnh thẻ KPI "Tổng ca khám/điều trị" để đếm tất cả các ca đã được xác nhận (bao gồm cả các ca đã check-in, đang thực hiện, hoàn thành, vắng mặt) thay vì chỉ đếm ca có trạng thái thô là `da_xac_nhan`.
*   **Hộp thoại xác nhận vào ca**: Thêm hộp thoại xác nhận khi bác sĩ/KTV click vào ca khám đã check-in để hỏi: *"Bạn đã sẵn sàng cho ca khám/trị liệu này chưa?"* trước khi điều hướng sang bàn làm việc tương ứng.
*   **Tuân thủ quy trình thanh toán**: Gỡ bỏ hai nút đặt lịch nhanh (Buổi 1) khỏi giao diện chi tiết lịch hẹn khám lâm sàng đã hoàn thành để đảm bảo đúng quy trình nghiệp vụ (chỉ được đặt lịch điều trị sau khi chốt phác đồ và thanh toán hóa đơn).

### 3. Dọn dẹp kỹ thuật & Tránh lỗi trùng lặp Key:
*   Sửa lỗi cảnh báo React Key trùng lặp ở sidebar `AdminLayout.tsx` cho tài khoản KTV bằng cách dùng `key={item.name}` thay vì `key={item.path}`.
*   Xóa bỏ các import dư thừa (`Activity`) và prop không sử dụng (`onOpenTreatment`) khỏi `AppointmentDetailModal.tsx` để vượt qua vòng typecheck của TypeScript.
*   Sao lưu và xuất dữ liệu thực tế hiện tại ra file `database/office_care_backup_new.sql` từ container Docker để đồng bộ tuyệt đối dữ liệu phiên làm việc.




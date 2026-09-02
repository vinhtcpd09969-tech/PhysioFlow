# Quy chuẩn quản lý Cơ sở dữ liệu PhysioFlow

Tài liệu này định nghĩa quy chuẩn làm việc với Database, Migration và dữ liệu môi trường (Seeding) dành cho tất cả các thành viên trong nhóm phát triển.

> [!IMPORTANT]
> **HƯỚNG DẪN BẮT BUỘC KHI BẮT ĐẦU PHIÊN LÀM VIỆC:**
> Trước khi thực hiện bất kỳ công việc nào, nhà phát triển bắt buộc phải đọc file [Cuoibuoilamviec.md](file:///d:/VLTT/VLTT/database/Cuoibuoilamviec.md) ở cùng thư mục này để cập nhật nhanh các thay đổi của người trước đó.

---

## 📁 1. Cấu trúc thư mục `database/`

```text
database/
├── base_system_data.sql   # Dữ liệu nền tảng hệ thống (Vai trò, Danh mục, Phòng khám, Admin mặc định)
├── demo_data.sql          # Dữ liệu test giao dịch (Khách hàng ảo, Lịch hẹn ảo, Hóa đơn ảo) - Tùy chọn nạp
├── Cuoibuoilamviec.md     # Ghi chú tổng hợp công việc và thay đổi cuối buổi của phiên làm việc trước
└── README.md              # File hướng dẫn quy chuẩn này
```

---

## 🛠️ 2. Quy trình làm việc tiêu chuẩn

### Bước 1: Đồng bộ hóa đầu buổi làm việc
1. Kéo code mới nhất từ Git:
   ```bash
   git pull origin main
   ```
2. Đọc file [Cuoibuoilamviec.md](file:///d:/VLTT/VLTT/database/Cuoibuoilamviec.md).
3. Cập nhật cấu trúc bảng cục bộ (không làm mất dữ liệu kiểm thử hiện tại của bạn):
   ```bash
   npx prisma migrate dev
   ```
4. Nếu database trống (hoặc sau khi reset), tiến hành nạp dữ liệu nền tảng:
   * Import file `base_system_data.sql` qua TablePlus hoặc lệnh.

---

### Bước 2: Phát triển và sửa đổi cấu trúc (nếu có)
1. Chỉ thực hiện sửa đổi bảng/cột bên trong file `schema.prisma`. **Tuyệt đối không dùng TablePlus để sửa cấu trúc bảng trực tiếp**.
2. Sau khi sửa `schema.prisma`, chạy lệnh:
   ```bash
   npx prisma migrate dev --name <ten_thay_doi>
   ```
3. Nếu có thay đổi/thêm mới dữ liệu nền tảng tĩnh (ví dụ: thêm vai trò mới, danh mục dịch vụ mới, hoặc quyền mới), hãy cập nhật lại file tĩnh:
   ```bash
   npm run db:dump-base
   ```
   *(File `base_system_data.sql` sẽ tự động được cập nhật).*

---

### Bước 3: Kết thúc buổi làm việc
1. Trước khi tắt máy hoặc thông báo kết thúc phiên làm việc, **bắt buộc phải ghi chép lại các công việc đã làm và các thay đổi dữ liệu** vào file [Cuoibuoilamviec.md](file:///d:/VLTT/VLTT/database/Cuoibuoilamviec.md).
2. Định dạng ghi chép: Ghi rõ ngày, tháng, năm, giờ cụ thể và chi tiết các bảng/cột hoặc chức năng đã chỉnh sửa.
3. Commit và push toàn bộ mã nguồn lên Git:
   ```bash
   git add .
   ```
   ```bash
   git commit -m "feat: <ten_tính_năng> & update database schema/base"
   ```
   ```bash
   git push origin main
   ```

---

## ⚡ 3. Các lệnh hữu ích trong `package.json`

*   `npm run db:dump-base`: Xuất dữ liệu của các bảng nền tảng tĩnh ra file `base_system_data.sql`.
*   `npx prisma migrate reset`: Xóa trắng database và chạy lại toàn bộ các file migration từ đầu (Sử dụng khi muốn làm sạch database rác).

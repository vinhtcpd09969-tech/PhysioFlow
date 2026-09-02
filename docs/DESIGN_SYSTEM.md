# Design system — OfficeCare

> Hợp nhất từ `docs/DEVELOPMENT_STANDARDS.md` (cũ) và `.agent/rules/CODE_STANDARDS.md` (cũ). Áp dụng cho mọi giao diện mới/sửa. Tuyệt đối tránh giao diện chung chung, đơn điệu kiểu template mẫu.

## 1. Hình học (Geometric Freedom)

- **Cấm bo tròn mặc định** `rounded-md` (6-8px) lặp lại trên mọi hộp thông tin — gây cảm giác nhàm chán như template.
- Chọn rõ một trong hai hướng theo ngữ cảnh:
  - **Nét sắc sảo (0-2px):** tối giản, cao cấp, kỹ thuật y khoa nghiêm túc (Brutalist/Swiss).
  - **Bo tròn lớn (16-32px):** Bento Grid thân thiện, hiện đại, hoặc nút hành động nổi bật.

## 2. Bảng màu (cấm tím AI)

- **Cấm** dùng tím/violet/indigo/magenta hoặc hiệu ứng phát sáng neon tím làm tông chủ đạo — cliché phổ biến nhất của giao diện AI thiếu sáng tạo.
- Palette chuẩn OfficeCare:
  - `Primary (Teal)`: `#2EC4B6` — xanh mòng két chuẩn y khoa phục hồi.
  - `Secondary (Slate tối)`: `#0F172A` — cảm giác đáng tin cậy, vững chãi.
  - `Accent (Amber/Emerald)`: trạng thái khẩn cấp/thành công.
- Trạng thái lâm sàng (Chờ khám, Đang khám, Hoàn thành, Đã hủy) dùng màu đồng nhất trên **mọi trang của mọi Actor**.

## 3. Chuyển động (Framer Motion / Micro-interactions)

- **Spring physics**, không dùng easing tuyến tính cơ bản:
  ```ts
  transition={{ type: "spring", stiffness: 300, damping: 20 }}
  ```
- **Stagger Reveal:** danh sách (bảng giá, danh sách bác sĩ, danh sách ngày) hiện so le tuần tự (delay tăng dần), không đồng loạt.
- **Hover Physical Feedback:** nút/thẻ click được dịch chuyển nhẹ (`y: -4` hoặc `y: -6`) kèm `box-shadow` lan tỏa.
- Hành động điều phối lịch/cảnh báo quan trọng dùng `AnimatePresence`, `motion.div` mượt mà.

## 4. Trải nghiệm trạng thái (Premium UX)

- **Cấm** spinner tròn giữa màn hình cho tải dữ liệu dài → dùng **Skeleton Loader** đúng hình khung của component.
- **Double confirmation** bằng cảnh báo cam/vàng khi khách chọn khung giờ trong vòng 2 tiếng (lịch hẹn cận giờ), nhắc di chuyển.

## 5. Chất liệu bề mặt (Glassmorphism & Gradient)

- Nền mờ mịn + border siêu mảnh (`border-slate-100/80` hoặc `dark:border-zinc-800/60`) + đổ bóng mờ nhẹ cho cảm giác cao cấp.
- Gradient tinh tế làm nổi bật thẻ KPI chính hoặc thanh chỉ dẫn quy trình.

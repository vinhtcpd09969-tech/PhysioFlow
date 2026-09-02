---
name: design-system
description: Design system UI/UX cao cấp của OfficeCare — hình học, bảng màu (cấm tím AI), chuyển động spring physics, skeleton loading, glassmorphism. Dùng khi tạo hoặc sửa bất kỳ component/trang giao diện nào ở frontend.
allowed-tools: Read, Grep, Glob
---

# Design System — OfficeCare

Đọc toàn bộ `docs/DESIGN_SYSTEM.md` trước khi tạo/sửa UI. Tránh giao diện chung chung kiểu template AI mặc định.

## Checklist nhanh

- [ ] Không dùng `rounded-md` mặc định lặp lại mọi nơi — chọn rõ nét sắc sảo (0-2px) hoặc bo lớn (16-32px) theo ngữ cảnh.
- [ ] Không dùng tím/violet/indigo làm màu chủ đạo. Dùng Teal `#2EC4B6` (primary), Slate `#0F172A` (secondary), Amber/Emerald (accent).
- [ ] Animation dùng spring physics (`type: "spring", stiffness: 300, damping: 20`), không easing tuyến tính cơ bản.
- [ ] Danh sách (bảng giá, danh sách bác sĩ/ngày) dùng stagger reveal, không hiện đồng loạt.
- [ ] Hover trên nút/thẻ click được: dịch chuyển `y: -4/-6` + box-shadow lan tỏa.
- [ ] Loading dữ liệu dài dùng Skeleton đúng khung component, cấm spinner tròn giữa màn hình.
- [ ] Khung giờ cận giờ (<2h) hiển thị cảnh báo cam/vàng.
- [ ] Trạng thái lâm sàng (Chờ khám/Đang khám/Hoàn thành/Đã hủy) dùng màu đồng nhất trên mọi trang mọi actor.

---
name: fsd-conventions
description: Quy ước kiến trúc Feature-Sliced Design của OfficeCare — tách trang theo actor, tách hook logic khỏi UI, route riêng theo vai trò, RBAC theo từng endpoint ở backend. Dùng khi thêm trang/tính năng mới, sửa code chạm nhiều actor (Admin/Lễ tân/Bác sĩ/KTV/Khách hàng), hoặc sửa layer backend (controller/service/repository/routes).
allowed-tools: Read, Grep, Glob
---

# FSD Conventions — OfficeCare

Đọc toàn bộ `docs/ARCHITECTURE_CONVENTIONS.md` trước khi thêm feature mới hoặc sửa code chạm nhiều actor/layer.

## Checklist bắt buộc trước khi viết code

**Frontend:**
- [ ] Mỗi actor có Page riêng trong `features/<role>/pages/` — không dùng `if (roleView === 'x')` gộp layout nhiều actor vào 1 file.
- [ ] UI lặp lại giữa các actor → tách Shared Component trong `/ui/` hoặc `/components/`, cấu hình qua props.
- [ ] Route riêng theo actor trong `AppRoutes.tsx`, không trùng/đè. Chuyển vai trò giả lập phải `navigate()` đổi URL thật.
- [ ] Gọi API/quản lý state → custom hook (`useXData`, `useXActions`), không `axios.get/post` trực tiếp trong Page.
- [ ] Import `stores/`, `utils/`, `api/` từ bản **top-level**, không từ `shared/` (xem nợ kỹ thuật trong CLAUDE.md).

**Backend:**
- [ ] Controller chỉ nhận request/trả JSON, không chứa business logic.
- [ ] Business logic nằm ở `services/`, DB access nằm ở `repositories/`.
- [ ] RBAC khai báo theo từng endpoint trong `routes/`, không `router.use(authorizeRoles(...))` chặn đầu file nếu file có API đọc mà Lễ tân/Bác sĩ/KTV cần dùng.
- [ ] Lỗi nghiệp vụ từ service/repository → controller trả `400` kèm message gốc.

Khi thêm feature mới chạm ≥2 actor hoặc đổi layer backend, cân nhắc gọi subagent `fsd-structure-reviewer` để rà lại trước khi chốt.

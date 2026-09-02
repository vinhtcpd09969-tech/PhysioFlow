# CLAUDE.md

Hướng dẫn cho Claude Code khi làm việc trong repo này.

## Dự án

**OfficeCare** (tên repo GitHub: OFFICECARE — OfficeCare là repo cũ, đã tách riêng, không còn liên quan) — hệ thống quản lý phòng khám vật lý trị liệu cho dân văn phòng: đặt lịch khám/điều trị, quản lý gói liệu trình, thanh toán, hồ sơ bệnh án điện tử. 5 actor: **Admin/Quản lý**, **Lễ tân**, **Bác sĩ**, **Kỹ thuật viên (KTV)**, **Khách hàng**.

- Backend: `backend/` — Node.js + Express + TypeScript + Prisma 7 + PostgreSQL + Zod + JWT.
- Frontend: `frontend/` — React 18 + Vite + TypeScript + Tailwind + Zustand + React Hook Form + Zod + Framer Motion + Recharts.

## Lệnh dev cốt lõi

```bash
cd backend && npm run dev     # API, cổng 5001 (nodemon + ts-node)
cd frontend && npm run dev    # Vite, cổng 3000
cd backend && npx prisma generate   # sau khi sửa schema.prisma
```

Reset/nạp lại DB local dùng lệnh `/db-reset` (không chạy tay `prisma db push` + import backup nếu không cần thiết, vì ảnh hưởng dữ liệu local).

## Cấu trúc thư mục (tóm tắt — chi tiết xem skill `fsd-conventions`)

- Backend: `controllers/` → `services/` (business logic) → `repositories/` (DB, nơi ném lỗi nghiệp vụ) → `schemas/` (Zod). RBAC khai báo theo **từng endpoint**, không catch-all middleware đầu file.
- Frontend: `features/<actor>/pages|components/{hooks,ui}` theo Feature-Sliced Design. Mỗi actor 1 page riêng, route riêng (`/receptionist/...`, `/doctor/...`, `/admin/...`). Logic API/state nằm trong custom hooks, component UI chỉ nhận props.

## ⚠️ Nợ kỹ thuật đã biết

`frontend/src/shared/{stores,utils,api}/...` là bản mồ côi từ một lần migrate FSD dở dang — **luôn dùng bản top-level** (`frontend/src/stores/authStore.ts`, `utils/date.ts`, `api/axios.ts`), không thêm import mới trỏ vào `shared/`. Chưa dọn dẹp, xem `docs/ARCHITECTURE_CONVENTIONS.md#5`.

## Quy tắc bất di bất dịch

1. **Socratic Gate:** có 1% mơ hồ về nghiệp vụ hoặc giao diện hiện có → hỏi lại người dùng trước, cấm tự suy diễn.
2. **Đề xuất trước khi code:** với yêu cầu phát triển/tối ưu, trình bày hướng tiếp cận + ưu điểm + nhược điểm/đánh đổi, chỉ code khi được đồng ý.
3. **Không code mù:** đọc toàn bộ file cần sửa + các file liên kết trực tiếp trước khi chỉnh.
4. **DRY chủ động:** không copy-paste UI/logic tương đồng rải rác — gộp Shared Component/Hook.
5. Backend: lỗi nghiệp vụ ném `Error` ở service/repository → controller trả `400` kèm message gốc, **cấm** nuốt lỗi thành `500` chung chung.

## Nghiệp vụ & Skills

Các quy tắc nghiệp vụ khóa (sức chứa, đặt lịch tuần tự, trả góp, hủy gói/hoàn tiền), quy ước kiến trúc chi tiết, và design system **không** nhồi vào file này — Claude Code tự nạp theo ngữ cảnh qua:

- `.claude/skills/business-rules/` — khi đụng đặt lịch/thanh toán/hóa đơn/hủy gói (chi tiết: `docs/BUSINESS_RULES.md`).
- `.claude/skills/fsd-conventions/` — khi thêm/sửa feature đa actor hoặc đổi layer backend (chi tiết: `docs/ARCHITECTURE_CONVENTIONS.md`).
- `.claude/skills/design-system/` — khi làm UI/UX (chi tiết: `docs/DESIGN_SYSTEM.md`).

Có thể chủ động gọi subagent `business-rule-guardian` hoặc `fsd-structure-reviewer` (Task tool) trước khi chốt các thay đổi lớn đụng đúng phạm vi trên.

## Session handover

Cuối phiên làm việc đáng kể, chạy `/handover` để tóm tắt file đã sửa + nghiệp vụ đã giải quyết + lệnh test đã chạy vào `walkthrough.md` — phiên sau đọc file này để kế thừa ngữ cảnh mà không cần hỏi lại.

## MCP

- `postgres` — query trực tiếp DB dev local (chỉ dùng để đọc/kiểm tra dữ liệu, không dùng để chạy migration).
- `playwright` — test tay các luồng UI phức tạp (đặt lịch, thanh toán) trên trình duyệt thật khi cần.

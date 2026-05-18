# HƯỚNG DẪN BÀN GIAO CHO AI (AI HANDOVER & ONBOARDING)

> **Gửi AI kế nhiệm:** Người dùng đã cài đặt lại ứng dụng/môi trường và đây là tệp đầu tiên bạn cần đọc để hiểu dự án. Hãy đọc kỹ các thông tin dưới đây để tiếp tục hỗ trợ người dùng một cách liền mạch nhất.

## 1. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)
- **Tên dự án:** PhysioFlow
- **Loại hình nền tảng:** Website dịch vụ vật lý trị liệu.
- **Trạng thái hiện tại:** Đang trong giai đoạn tập trung hoàn thiện phần Quản trị (Admin Dashboard). Các phần tính năng đang làm dở: quản lý trang thiết bị (Equipment), gói dịch vụ (Package), Lịch hẹn (Appointment Calendar), và thu ngân (Quick Billing).

## 2. CÁC TÀI LIỆU QUAN TRỌNG CẦN ĐỌC NGAY
Để nắm toàn bộ logic nghiệp vụ và kiến trúc, **bạn bắt buộc phải đọc** (bằng công cụ `view_file`) các tệp sau trước khi bắt đầu code:

1. `PHYSIOFLOW_CONTEXT.md`: Chứa các luồng nghiệp vụ (Business Rules) cơ bản và định hướng dự án ban đầu. **⚠️ LƯU Ý QUAN TRỌNG:** Cấu trúc Database (Schema) trong file này ĐÃ CŨ và KHÔNG CÒN CHÍNH XÁC hoàn toàn. File này chỉ mang tính chất THAM KHẢO định hướng. Để lấy schema thật, bạn **phải tự động xem trực tiếp vào code Backend (Repositories, Schema) hoặc query thẳng vào Database**.
2. `MODULE_ARCHITECTURE.md`: Định nghĩa kiến trúc Frontend/Backend, chuẩn file naming, cách tổ chức thư mục (Feature-based structure), và cấu trúc router.
3. `admin-finalization-phase6.md`: Chứa các yêu cầu và tiến độ hoàn thiện phần Admin Dashboard gần đây nhất.

## 3. TECH STACK & QUY TẮC BẮT BUỘC (CRITICAL RULES)
Dự án sử dụng tech stack hiện đại và có những quy tắc RẤT NGHIÊM NGẶT:

**Frontend:**
- **React + Vite** (TypeScript).
- **Tailwind CSS** (Utility-first, KHÔNG dùng CSS modules hay styled-components).
- **Zustand** cho Global State (KHÔNG dùng Redux hay Context API).
- **Zod** để validate form (thường kết hợp với react-hook-form) và response schema.
- Tổ chức code theo mô hình **Feature-based** (chia theo `features/admin`, `features/receptionist`, `features/auth`, v.v.).

**Backend:**
- **Node.js + Express (TypeScript)**.
- **PostgreSQL**: Dùng thư viện `pg` (node-postgres) để viết **RAW SQL**.
- 🚫 **TUYỆT ĐỐI KHÔNG SỬ DỤNG ORM** (Không Prisma, không TypeORM, không Sequelize).
- **Zod/Joi** để validate request body trước khi vào controller.
- Mô hình MVC (Routes → Controllers → Services → Repositories/Models).

## 4. CÁCH KHỞI CHẠY DỰ ÁN (HOW TO RUN)
Hệ thống yêu cầu các thành phần sau để chạy:
1. **Database:** Chạy qua Docker. Lệnh: `docker-compose up -d` (nằm ở thư mục gốc chứa file `docker-compose.yml`). Các container `physioflow_db` và `physioflow_pgadmin` sẽ được bật.
2. **Backend:** Nằm trong thư mục `backend/`. Lệnh: `npm run dev`.
3. **Frontend:** Nằm trong thư mục `frontend/`. Lệnh: `npm run dev`.

*Lưu ý: Bạn có thể sử dụng công cụ terminal để tự động chạy các lệnh này giúp người dùng nếu họ yêu cầu.*

## 5. NGỮ CẢNH CÔNG VIỆC GẦN NHẤT (LATEST CONTEXT)
Trước khi người dùng cài lại app, họ đang tập trung xử lý các phần sau (dựa trên các file đang mở):
- `backend/src/utils/seed.ts` (Script tạo data mẫu)
- `frontend/src/features/admin/pages/ManageEquipment.tsx` (Quản lý thiết bị)
- `frontend/src/features/admin/components/PackageCard.tsx` (Thẻ hiển thị Gói dịch vụ)
- `frontend/src/features/receptionist/pages/QuickBilling.tsx` (Thanh toán nhanh cho Lễ tân)
- Giao diện lịch hẹn (`AppointmentCalendar.tsx`).

## 6. LƯU Ý KHI GIAO TIẾP VỚI USER
- Ngôn ngữ giao tiếp chính: **Tiếng Việt**.
- Khi đưa ra file code, hãy giải thích ngắn gọn trọng tâm.
- Luôn kiểm tra các view SQL có sẵn (`v_nguoi_dung_active`, `v_phong_san_sang_theo_dich_vu`...) trong `PHYSIOFLOW_CONTEXT.md` trước khi viết câu truy vấn SQL mới phức tạp.
- Khi cần thiết kế UI, hãy áp dụng thiết kế hiện đại, cao cấp (glassmorphism, micro-animations, màu sắc hài hòa) bằng Tailwind CSS.

---
**Thông điệp cuối:** Hãy tự tin, bám sát các rule công nghệ cơ bản nhưng **LUÔN kiểm chứng lại Database schema thực tế từ code thay vì tin mù quáng vào tài liệu cũ**. Chúc bạn làm việc hiệu quả và giúp người dùng hoàn thiện dự án một cách tốt nhất!

# PhysioFlow Project - Future Development Guidelines & Prompts

This document stores the crucial prompts and architectural guidelines requested at the beginning of the workspace session. Refer to these guidelines and templates in future development sessions to maintain safety, clean code, and robust structure.

---

## 🔒 Prompt 1: Thiết lập bảo mật và quản lý biến môi trường
**Mục tiêu**: Loại bỏ các thông tin nhạy cảm khỏi code và cấu hình Docker.

### Yêu cầu chi tiết:
1. **Docker environment parameters**: Chuyển đổi toàn bộ các cấu hình `POSTGRES_PASSWORD` và `PGADMIN_DEFAULT_PASSWORD` trong `docker-compose.yml` sang dạng biến môi trường `${...}`.
2. **Environment template**: Tạo một file `.env.example` ở gốc dự án chứa đầy đủ các khai báo biến môi trường cần thiết làm mẫu cho lập trình viên.
3. **CORS Whitelist**: Cấu hình CORS trong `index.ts` của backend chỉ chấp nhận các request từ danh sách domain được cho phép (whitelist) được cấu hình linh động thông qua biến môi trường.
4. **Tiêu chuẩn**: Ưu tiên cao nhất cho tính bảo mật, tránh lộ lọt thông tin nhạy cảm và chuẩn hóa các tệp cấu hình.

---

## ⚙️ Prompt 2: Tái cấu trúc Backend & Cải thiện Error Handling
**Mục tiêu**: Làm sạch tệp khởi tạo chính `index.ts` và thiết lập hệ thống middleware tập trung.

### Yêu cầu chi tiết:
1. **Routes Consolidation**: Tái cấu trúc thư mục `backend/src/routes/` sao cho có một tệp `index.ts` đóng vai trò là "Hub" chính, tự động kết nối và phân luồng các route con một cách gọn gàng.
2. **Global Error Middleware**: Xây dựng một Global Error Handling Middleware để bắt lỗi tập trung từ mọi controller, xử lý các exception chưa được bắt và trả về phản hồi chuẩn hóa.
3. **Normalized Error Standard**: Cung cấp ví dụ cụ thể về cách một `async controller` ném lỗi và phản hồi chuẩn hóa dạng `{ success: false, message: '...' }` thay vì xử lý riêng lẻ bằng các khối try-catch lặp đi lặp lại.
4. **Tiêu chuẩn**: Kiến trúc sạch (Clean Architecture) và khả năng mở rộng hệ thống tốt (Scalability).

---

## 💎 Prompt 3: Tích hợp ORM (Prisma) thay thế Raw SQL
**Mục tiêu**: Chuyển từ Raw SQL sang Prisma ORM để an toàn kiểu dữ liệu và quản lý database schema hiệu quả hơn.

### Yêu cầu chi tiết:
1. **Schema Mapping**: Xây dựng tệp `schema.prisma` hoàn chỉnh ánh xạ từ cấu trúc bảng vật lý đã được khởi tạo trong `docker/init.sql`.
2. **Repository Migration**: Hướng dẫn và thực hiện các bước thay thế một controller/repository mẫu (ví dụ: `auth.controller.ts` hoặc `auth.repository.ts`) từ việc sử dụng các truy vấn trực tiếp (`pg` client) sang Prisma Client.
3. **Strict TypeScript Typing**: Đảm bảo các kiểu dữ liệu TypeScript được đồng bộ hoàn toàn với schema của database thông qua các model được sinh ra tự động bởi Prisma Client.

---

## 🎨 Prompt 4: Kiểm tra và tối ưu Frontend (React/Zustand)
**Mục tiêu**: Tăng hiệu suất hoạt động, cải thiện trải nghiệm người dùng và chuẩn hóa mã nguồn frontend.

### Yêu cầu chi tiết:
1. **Frontend Architecture Refactoring**: Rà soát cấu trúc thư mục frontend hiện tại và đề xuất/thực hiện việc tách biệt rõ ràng giữa các Custom Hooks, API Services, và Components theo chuẩn React chuyên nghiệp.
2. **Code Splitting (React.lazy / Suspense)**: Hướng dẫn cấu hình và áp dụng `React.lazy()` kết hợp `Suspense` cho hệ thống định tuyến (router) để tải các trang một cách không đồng bộ nhằm rút ngắn thời gian tải trang đầu tiên.
3. **Zustand State Optimization**: Review chi tiết tệp lưu trữ trạng thái đăng nhập/phân quyền `authStore.ts` để tối ưu hóa việc chọn lọc selector (`useAuthStore(state => state.xxx)`), tránh các re-render không cần thiết và tăng hiệu năng của ứng dụng.

---

*Lưu ý: Luôn tuân thủ các quy tắc trong `GEMINI.md`, tuyệt đối không dùng màu tím (Purple Ban) khi làm việc với UI/UX, luôn đảm bảo build chạy thành công với TypeScript không lỗi.*

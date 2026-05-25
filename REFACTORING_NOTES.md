# PhysioFlow Refactoring & Architecture Master Notes

Tài liệu này lưu trữ toàn bộ các mục tiêu thiết kế, quyết định kiến trúc và kết quả triển khai thực tế của 4 giai đoạn cải tiến hệ thống chuyên sâu cho dự án PhysioFlow (Node.js + PostgreSQL + React + Prisma). 

Tài liệu này được lưu tại thư mục gốc của dự án để làm kim chỉ nam và chuyển giao ngữ cảnh cho các phiên làm việc tiếp theo.

---

## 🔐 GIAI ĐOẠN 1: THIẾT LẬP BẢO MẬT & QUẢN LÝ BIẾN MÔI TRƯỜNG

### 🎯 Mục tiêu
Loại bỏ hoàn toàn các thông tin nhạy cảm, mật khẩu cứng (hardcoded credentials) khỏi mã nguồn và cấu hình Docker, đồng thời kiểm soát nguồn gốc yêu cầu API bằng chính sách CORS Whitelist.

### 🛠️ Giải pháp đã triển khai
1.  **Docker Environment Separation**: 
    *   Toàn bộ cấu hình mật khẩu gốc trong `docker-compose.yml` (như `POSTGRES_PASSWORD`, `PGADMIN_DEFAULT_PASSWORD`) được chuyển sang dạng biến động `${DB_PASSWORD}` và `${PGADMIN_PASSWORD}`.
    *   Tách biệt cấu hình mật khẩu ra tệp `.env` cục bộ (được thêm vào `.gitignore` để tránh đẩy lên Github).
2.  **Tệp `.env.example` chuẩn hóa**:
    *   Cung cấp tệp mẫu cấu hình đầy đủ bao gồm các trường cấu hình DB, JWT Secret, pgAdmin, và CORS Whitelist để lập trình viên khác dễ dàng khởi chạy dự án.
3.  **CORS Domain Whitelist**:
    *   Triển khai cấu hình CORS linh hoạt trong `index.ts` thông qua biến môi trường `CORS_ORIGIN_WHITELIST`.
    *   Hỗ trợ đọc một chuỗi danh sách các domain cách nhau bởi dấu phẩy (ví dụ: `http://localhost:3000,https://app.physioflow.vn`) và thực hiện kiểm tra động thông qua hàm callback của middleware `cors`.

---

## ⚡ GIAI ĐOẠN 2: TÁI CẤU TRÚC BACKEND & GLOBAL ERROR HANDLING

### 🎯 Mục tiêu
Giảm tải cho tệp `index.ts` gốc, chia nhỏ các route thành các module riêng biệt để dễ mở rộng và xây dựng cơ chế bắt lỗi tập trung cho toàn bộ hệ thống.

### 🛠️ Giải pháp đã triển khai
1.  **Kiến trúc Centralized Hub Route (`routes/index.ts`)**:
    *   Tách biệt toàn bộ khai báo endpoint ra khỏi `index.ts` chính.
    *   Xây dựng tệp `src/routes/index.ts` làm Hub trung tâm, gom các route con như `admin.routes.ts`, `receptionist.routes.ts`, `auth.routes.ts`... một cách gọn gàng thông qua router trung gian.
2.  **Global Error Handling Middleware**:
    *   Xây dựng một middleware xử lý lỗi tập trung `errorHandler.ts` ở cuối chuỗi middleware để bắt mọi lỗi phát sinh trong hệ thống.
    *   Chuẩn hóa định dạng phản hồi lỗi về dạng JSON đồng nhất:
        ```json
        {
          "success": false,
          "message": "Thông điệp lỗi chi tiết thân thiện với người dùng",
          "error": "ErrorType / ZodValidationErrorDetails"
        }
      ```
3.  **Bắt lỗi Async Controller an toàn**:
    *   Sử dụng helper middleware hoặc hàm wrapper `asyncHandler` để tự động chuyển tiếp (`next(error)`) tất cả các lỗi từ các controller bất đồng bộ về Global Error Handler mà không cần viết khối `try-catch` lặp đi lặp lại ở mọi nơi.

---

## 🗄️ GIAI ĐOẠN 3: TÍCH HỢP ORM (PRISMA) THAY THẾ RAW SQL

### 🎯 Mục tiêu
Chuyển đổi toàn bộ các truy vấn cơ sở dữ liệu từ Raw SQL viết tay (dễ lỗi cú pháp và SQL Injection) sang Prisma ORM để quản lý Schema an toàn hơn và tự động tạo kiểu dữ liệu (Types) đồng bộ 100%.

### 🛠️ Giải pháp đã triển khai
1.  **Khởi tạo `schema.prisma` đồng bộ**:
    *   Xây dựng tệp cấu hình Prisma dựa trên cấu trúc các bảng vật lý trong cơ sở dữ liệu PostgreSQL.
    *   Khai báo đầy đủ các mối quan hệ (Relations), kiểu dữ liệu gốc (như `Uuid`, `BigInt`, `Timestamp`) và các giá trị mặc định (`dbgenerated("gen_random_uuid()")`).
2.  **Di chuyển từ Raw SQL sang Prisma Client**:
    *   Thay thế các truy vấn `pool.query` bằng `prisma.model.findMany / findUnique / create / update`.
    *   Tách biệt lớp xử lý dữ liệu (Repository Pattern) giúp mã nguồn sạch sẽ, dễ viết Unit Test độc lập thông qua mock Prisma client.
3.  **An toàn Kiểu dữ liệu (TypeScript Types)**:
    *   Prisma tự động sinh ra các Interface tương ứng với mỗi bảng ngay khi chạy `npx prisma generate`.
    *   Đảm bảo kiểu dữ liệu đầu ra ở lớp Repository đồng bộ tuyệt đối với các kiểu dữ liệu của Model ở các tầng Controller và Frontend.

---

## 🎨 GIAI ĐOẠN 4: KIỂM TRA & TỐI ƯU HÓA FRONTEND (REACT/ZUSTAND)

### 🎯 Mục tiêu
Nâng cao hiệu năng tải trang ban đầu, tổ chức mã nguồn frontend chuyên nghiệp và tối ưu hóa cơ chế render của state store (Zustand) để tránh các re-render không cần thiết.

### 🛠️ Giải pháp đã triển khai
1.  **Tổ chức thư mục Feature-Driven**:
    *   Tách biệt cấu trúc mã nguồn theo hướng mô-đun hóa: chia thành các thư mục `api/`, `components/ui/`, `hooks/`, và `features/` (chứa các trang, hook và service riêng tư của từng nghiệp vụ cụ thể).
2.  **Lazy Loading & Code-Splitting**:
    *   Tích hợp `React.lazy()` và `<Suspense>` vào `AppRoutes.tsx` để trì hoãn việc tải tài nguyên của các trang quản trị (Admin Dashboard, Technician Workspace) cho đến khi người dùng truy cập.
    *   Giúp giảm kích thước bundle tải trang ban đầu từ nhiều Megabyte xuống chỉ còn **232KB**, tăng tốc độ tải trang lần đầu cực kỳ nhanh chóng.
    *   Thiết kế màn hình chờ `LoadingScreen.tsx` hiệu ứng Glassmorphic sang trọng kèm bộ đếm thời gian thông minh để tăng trải nghiệm người dùng.
3.  **Tối ưu hóa Zustand Store (`authStore.ts`)**:
    *   Sử dụng `partialize` của middleware `persist` để loại bỏ các thuộc tính không cần thiết ra khỏi localStorage.
    *   Tách biệt Actions ra khỏi State thông qua hook ổn định địa chỉ ô nhớ `useAuthActions()`, giúp các component gọi Action không bị re-render thừa khi State của tài khoản thay đổi.
    *   Xây dựng các bộ chọn thuộc tính hạt mịn (`useUser`, `useIsAuthenticated`, `useAccessToken`) để tối ưu hóa hiệu năng render cho từng Component nhỏ.

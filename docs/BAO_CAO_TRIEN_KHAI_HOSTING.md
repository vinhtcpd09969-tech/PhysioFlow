# CHƯƠNG 4: TRIỂN KHAI VÀ PHÁT HÀNH HỆ THỐNG (CLOUD DEPLOYMENT)

## 4.1. MÔ HÌNH TRIỂN KHAI
- **Frontend**: Vercel Cloud Platform (`https://officecare.vercel.app`)
- **Backend**: Render Web Service (`https://officecare.onrender.com/api`)
- **Database**: Neon Serverless PostgreSQL (`AWS US East 2`)

---

## 4.2. QUY TRÌNH THỰC HIỆN CHI TIẾT

### Bước 1: Khởi tạo Cơ sở Dữ liệu Neon PostgreSQL
- Đăng ký & khởi tạo Instance PostgreSQL trên Neon Console.
- Lấy chuỗi kết nối `DATABASE_URL`.
- Chạy lệnh `npx prisma db push` đồng bộ cấu trúc CSDL.

> 📸 **[Chèn Hình 4.1: Khởi tạo Neon Database]** *(Dùng Ảnh 1)*

### Bước 2: Triển khai Backend trên Render
- Tạo Web Service trên Render kết nối repository GitHub `OFFICECARE`.
- Cấu hình: `Root Directory: backend`, `Build Command: npm install && npm run build`, `Start Command: npm start`.
- Khai báo các biến môi trường cấu hình bảo mật và dịch vụ liên kết.

> 📸 **[Chèn Hình 4.2: Cấu hình Web Service & Biến môi trường trên Render]** *(Dùng Ảnh 3, 4, 5)*

### Bước 3: Kiểm tra trạng thái Backend
- Render thực hiện build tự động và đưa dịch vụ lên trạng thái **Deploy Live**.
- Kiểm tra Endpoint health check thành công.

> 📸 **[Chèn Hình 4.3: Trạng thái Deploy live trên Render]** *(Dùng Ảnh 6, 7)*

### Bước 4: Triển khai Frontend trên Vercel
- Import repository GitHub vào Vercel (`Root Directory: frontend`).
- Khai báo biến môi trường `VITE_API_URL`.
- Biên dịch & phát hành tên miền `https://officecare.vercel.app`.

> 📸 **[Chèn Hình 4.4: Cấu hình & Deploy Frontend trên Vercel]** *(Dùng Ảnh 8, 9)*

### Bước 5: Kiểm tra phát hành toàn hệ thống
- Truy cập tên miền `https://officecare.vercel.app`.
- Kiểm tra toàn bộ luồng giao diện người dùng & chứng chỉ HTTPS.

> 📸 **[Chèn Hình 4.5: Giao diện trang chủ phát hành trên Vercel]** *(Dùng Ảnh 11 - Ảnh giao diện trang chủ)*

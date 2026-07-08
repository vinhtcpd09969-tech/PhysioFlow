# QUY CHUẨN PHÁT TRIỂN & BÀO GIAO DỰ ÁN OFFICECARE

> Quy chuẩn này thiết lập các nguyên tắc bắt buộc cho AI và lập trình viên trong quá trình phát triển mã nguồn, thiết kế giao diện UX/UI đẳng cấp cao, và duy trì ngữ cảnh nghiệp vụ qua các phiên làm việc khác nhau.

---

## 🔍 PHẦN 1: QUY TRÌNH PHÂN TÍCH LOGIC CODE
*Trước khi viết bất kỳ dòng mã nào, AI phải tuân thủ nghiêm ngặt quy trình 3 bước:*

### 1. Đọc & Bản đồ hóa Dependencies (Read & Dependency Map)
*   **Không code mù:** Luôn đọc toàn bộ file cần sửa và ít nhất 2 file liên kết trực tiếp với nó trước khi bắt tay vào chỉnh sửa.
*   **Vẽ bản đồ ảnh hưởng:** Kiểm tra xem chỉnh sửa tại File A có làm gãy logic tại File B hay File C không (ví dụ: đổi API response ở Backend phải sửa ngay Type và Axios call ở Frontend).

### 2. Socratic Gate (Hỏi trước khi làm)
*   Nếu có **1% mơ hồ** về nghiệp vụ hoặc giao diện cũ của người dùng, **CẤM** tự tiện thay đổi.
*   Đặt câu hỏi làm rõ (Edge cases): *"Nếu người dùng chọn ngày nghỉ thì xử lý thế nào?"*, *"Giao diện hiện tại có nút quay lại không?"*.

### 3. Tách biệt State và Giao diện (State/UI Separation)
*   **Logic nghiệp vụ (Business Logic):** API call, Polling, Validation, state localstorage... phải nằm trong **Custom Hooks** (ví dụ: `useBookingState.ts`).
*   **Giao diện tĩnh (Stateless UI):** Chỉ nhận props dữ liệu và hàm handler để render (ví dụ: `BookingStepCard.tsx`).

---

## 📁 PHẦN 2: QUY CHUẨN CẤU TRÚC THƯ MỤC DỰ ÁN
*Dự án áp dụng cấu trúc thư mục dạng Modular lấy cảm hứng từ FSD (Feature-Sliced Design) để đảm bảo khả năng mở rộng:*

### 1. Cấu trúc thư mục Frontend (`frontend/src/`)
```bash
frontend/src/
├── components/                 # Shared Components (dùng chung toàn dự án như Button, Input, Modal...)
│   └── LazyImage.tsx
├── features/                   # Phân tách theo tính năng nghiệp vụ chính
│   ├── admin/                  # Cụm tính năng dành cho quản trị viên, bác sĩ, lễ tân
│   │   ├── components/
│   │   │   └── appointments/   # Module quản lý lịch hẹn
│   │   │       ├── hooks/      # Business logic (useAppointmentsData.ts, useAppointmentActions.ts)
│   │   │       ├── ui/         # Sub-components UI (KpiCards.tsx, FilterBar.tsx...)
│   │   │       ├── constants.ts
│   │   │       └── types.ts
│   │   └── pages/              # Trang hoàn chỉnh (ManageAppointments.tsx)
│   └── public/                 # Cụm tính năng dành cho khách hàng vãng lai
│       ├── components/
│       │   ├── home/           # Các phần cấu thành nên trang chủ Landing Page
│       │   │   ├── Hero.tsx
│       │   │   ├── Benefits.tsx
│       │   │   └── Pricing.tsx
│       │   ├── booking/        # Module đặt lịch khám/trị liệu của khách
│       │   │   ├── hooks/      # useBookingState.ts
│       │   │   └── ui/         # BookingStepCard.tsx, BookingWizard.tsx...
│       │   ├── chatbot/        # Module AI Assistant
│       │   │   └── ChatbotWidget.tsx
│       │   └── shared/         # Các component dùng chung chỉ trong phạm vi public
│       │       └── ScrollReveal.tsx
│       └── pages/              # Trang hoàn chỉnh (Home.tsx, Booking.tsx)
├── stores/                     # Quản lý trạng thái toàn cục (Zustand, Redux)
└── utils/                      # Các hàm tiện ích dùng chung (date.ts, format.ts)
```

### 2. Cấu trúc thư mục Backend (`backend/src/`)
```bash
backend/src/
├── controllers/                # Tiếp nhận HTTP request, gọi Service và trả về JSON chuẩn
├── routes/                     # Định nghĩa các endpoint API và gắn Middleware bảo mật/xác thực
├── services/                   # Chứa logic nghiệp vụ chính (tính toán, xử lý dữ liệu phức tạp)
├── repositories/               # Tương tác trực tiếp với cơ sở dữ liệu (Prisma, SQL Queries)
├── schemas/                    # Zod validation schemas kiểm tra dữ liệu đầu vào
└── utils/                      # Helper nội bộ (xử lý date, mã hóa mật khẩu...)
```

---

## 🎨 PHẦN 3: BẢN THIẾT KẾ GIAO DIỆN UX/UI PRO MAX
*Tuyệt đối tránh tạo ra các giao diện chung chung hoặc đơn điệu. Mỗi chi tiết phải toát lên vẻ cao cấp:*

### 1. Tư duy Hình học Đột phá (Geometric Freedom)
*   **Cấm bo tròn mặc định:** Tránh lạm dụng góc bo `rounded-md` (6px - 8px) trên tất cả các hộp thông tin vì nó gây cảm giác nhàm chán như các template mẫu.
*   **Lựa chọn hình học rõ ràng:**
    *   **Nét sắc sảo (0px - 2px):** Dùng cho phong cách tối giản, cao cấp, kỹ thuật y khoa nghiêm túc (Brutalist / Swiss).
    *   **Bo tròn lớn (16px - 32px):** Dùng cho phong cách Bento Grid thân thiện, hiện đại, hoặc các nút hành động nổi bật.

### 2. Cấm sử dụng màu Tím AI (AI Purple Ban)
*   **Không lạm dụng màu tím:** Cấm sử dụng các dải màu tím (violet, indigo, magenta) làm tông màu chủ đạo hoặc hiệu ứng phát sáng neon tím. Đây là cliché phổ biến nhất của các AI thiết kế thiếu sáng tạo.
*   **Palette màu cao cấp:** Sử dụng các tone màu đặc trưng của OfficeCare:
    *   `Primary (Teal)`: `#2EC4B6` (Xanh mòng két chuẩn y khoa phục hồi).
    *   `Secondary (Slate tối)`: `#0F172A` (Mang lại cảm giác đáng tin cậy, vững chãi).
    *   `Accent (Amber/Emerald)`: Trạng thái khẩn cấp/thành công.

### 3. Hiệu ứng Chuyển động Sinh động (Framer Motion / Micro-interactions)
*   **Vật lý Đàn hồi (Spring Physics):** Không dùng các hàm easing tuyến tính (`linear` hoặc `ease-in-out` cơ bản). Hãy dùng lực đàn hồi tự nhiên:
    ```typescript
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    ```
*   **Stagger Reveal:** Khi hiển thị danh sách (như bảng giá, danh sách bác sĩ, danh sách ngày), các phần tử phải xuất hiện so le tuần tự (delay tăng dần) thay vì xuất hiện đồng loạt.
*   **Hover Physical Feedback:** Mọi nút và thẻ có thể nhấp chuột phải có hiệu ứng dịch chuyển tọa độ nhỏ (`y: -4` hoặc `y: -6`) kèm hiệu ứng đổ bóng lan tỏa (`box-shadow`).

### 4. Trải nghiệm Trạng thái Đỉnh cao (Premium UX)
*   **Skeleton Loader:** Cấm sử dụng vòng quay Spinner tròn ở giữa màn hình cho các hành động tải dữ liệu dài. Hãy dùng các khung xám nhấp nháy nhẹ (Skeleton Loading) đúng theo hình dáng cấu trúc của component.
*   **Double Confirmation cho ca khẩn cấp:** Hiển thị cảnh báo trực quan bằng màu cam/vàng đặc trưng nếu khách chọn khung giờ trong vòng 2 tiếng (Lịch hẹn cận giờ) để nhắc nhở di chuyển.

---

## 🧠 PHẦN 4: CƠ CHẾ CHUYỂN GIAO TRI THỨC GIỮA CÁC PHIÊN LÀM VIỆC
*Để đảm bảo các AI ở phiên làm việc sau kế thừa 100% logic nghiệp vụ mà không cần hỏi lại người dùng:*

### 1. File Tri thức Dự án (Project Logic Map)
Mọi logic nghiệp vụ cốt lõi của dự án bắt buộc phải được tài liệu hóa rõ ràng tại các file sau:
*   [docs/activity_diagrams.md](file:///d:/VLTT/VLTT/docs/activity_diagrams.md): Bản đồ trực quan các luồng đi của dữ liệu.
*   [DEVELOPMENT_STANDARDS.md](file:///d:/VLTT/VLTT/docs/DEVELOPMENT_STANDARDS.md): File quy chuẩn làm việc này.

### 2. Quy tắc lưu giữ Tri thức Nghiệp vụ Khóa (Business Constraints)
Dự án có những quy tắc bắt buộc sau đây mà bất kỳ AI nào khi chỉnh sửa code đều không được phép vi phạm:
1.  **Cách tính Sức chứa khả dụng:**
    *   Sức chứa tối đa của 1 khung giờ = `min(Số bác sĩ trực ca, Số giường điều trị sẵn sàng)`.
    *   Khi khách đặt lịch, hệ thống phải trừ sức chứa khả dụng lập tức và không cho phép overbooking nếu vượt quá con số này.
2.  **Logic Tiếp tiếp đón của Lễ tân:**
    *   Trạng thái mặc định khi khách đặt là `Chưa xác nhận`.
    *   Lễ tân có quyền gọi điện xác nhận. Nếu khách không nghe máy $\ge$ 3 cuộc, Lễ tân thực hiện hủy lịch bằng tay (Hệ thống không tự động hủy để đảm bảo tính nhân văn và linh hoạt).

### 3. File Ngữ cảnh Phiên làm việc (Session Context Handover)
Cuối mỗi phiên làm việc, AI phải cập nhật hoặc tạo hai tài liệu sau trong app data directory:
*   **`task.md`**: Checklist ghi nhận chi tiết nhiệm vụ đã hoàn thành `[x]` và nhiệm vụ đang dở dang `[/]`.
*   **`walkthrough.md`**: Tóm tắt các file đã chỉnh sửa, sự thay đổi trong cấu trúc code, hình ảnh hoặc các lệnh test kiểm tra lỗi đã chạy thành công.

---

*Quy chuẩn này là kim chỉ nam để giữ cho dự án OfficeCare luôn sạch đẹp, ổn định và phát triển bền vững.*

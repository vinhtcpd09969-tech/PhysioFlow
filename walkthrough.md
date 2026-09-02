# Walkthrough — OfficeCare

Nhật ký bàn giao giữa các phiên làm việc. Đọc mục mới nhất trước khi tiếp tục, đối chiếu với `C:\Users\ADMIN\.claude\plans\smooth-tinkering-island.md` (kế hoạch tổng 29 ngày, deadline bảo vệ lại 02/09/2026) để biết đang ở Phase nào.

> ⚠️ Cây làm việc hiện có nhiều file sửa đổi (`ManageArticles`, `ManageStaff`, `ManageRooms`, `ViewFeedback`, `chat/*`, `PlanDetailModal`, `VisitDetailModal`...) **không thuộc phạm vi các phiên đã ghi ở đây** — là việc dở dang từ trước, chưa rõ nội dung, không đụng tới khi tiếp tục Phase booking.

## 1. Phase 1 — Nền booking chuyển sang mô hình theo buổi (ngân sách phút)

### Vấn đề
Hội đồng bảo vệ (04/08/2026) đánh gãy nghiệp vụ khám vì booking khóa cứng slot 30 phút theo giờ chính xác, gây lãng phí công suất. Cần chuyển sang mô hình đặt theo **buổi** (sáng/chiều) với ngân sách phút thay vì đếm slot.

### Giải pháp
- **Backend** — [appointment.repository.ts](file:///d:/VLTT/VLTT/backend/src/repositories/appointment.repository.ts): thêm `domain/capacity.ts` (thuật toán ngân sách phút 2 tầng theo nhóm vai trò, 14 unit test), viết lại `createAppointment`/`createPublicAppointment` theo buổi + `da_xac_nhan` mặc định (bỏ luồng chờ xác nhận/OTP), thêm `getBuoiAvailability`, các hàm chống spam A12 (`checkCustomerDailyBookingLimit`/`checkCustomerPendingLimit` lúc đó, `checkCoLichChoTaiLuongGia`), xóa `getBookedSlots`/`createTempHold`/`releaseTempHold`.
- **Frontend** — viết lại toàn bộ luồng đặt lịch: [Booking.tsx](file:///d:/VLTT/VLTT/frontend/src/features/public/pages/Booking.tsx) + các step trong `features/public/components/booking/`, [WalkInBookingModal.tsx](file:///d:/VLTT/VLTT/frontend/src/components/WalkInBookingModal.tsx) (Lễ tân/Admin đặt tại quầy), [BookNextSessionModal.tsx](file:///d:/VLTT/VLTT/frontend/src/features/customer/pages/CustomerMedicalRecord/components/BookNextSessionModal.tsx) (đặt buổi tiếp theo trong gói) — tất cả chuyển từ chọn giờ chính xác sang chọn buổi.
- **Dọn dẹp theo C1/C2/C3**: xóa OTP xác nhận đặt lịch (kể cả UI còn sót ở `CustomerAppointments/index.tsx` và `BookingSuccess.tsx`), xóa bảng/luồng `tam_giu_cho`, xóa mọi UI chọn giờ cụ thể.

### Kết quả
`npx tsc --noEmit` sạch cả backend và frontend. Chưa chạy kiểm thử trình duyệt đầu-cuối (bị chặn do dữ liệu demo `lich_truc_nhan_su` không phủ ngày hiện tại — cần seed lại nếu muốn test luồng đặt thành công trọn vẹn).

## 2. Vá 3 lỗi hiển thị trong màn hình quản lý lịch hẹn Admin (phát hiện khi người dùng tự test Phase 1)

### Vấn đề
Người dùng test thực tế phát hiện: (a) badge "Trễ X phút" hiện sai trên ca đã check-in, (b) badge đếm ngược "Còn X giờ" vô nghĩa với mô hình buổi, (c) bác sĩ "biến mất" khỏi thẻ lịch hẹn (hiện "Chờ gán bác sĩ") dù `nhan_su_id` đúng trong DB. Gốc rễ: [AppointmentCalendar.tsx](file:///d:/VLTT/VLTT/frontend/src/components/appointments/AppointmentCalendar.tsx) chưa được cập nhật theo mô hình buổi (thuộc phạm vi A5, chưa tới lượt) — vẫn tính "trễ"/"còn bao lâu" từ `ngay_gio_bat_dau` tưởng đó là giờ hẹn chính xác, trong khi giờ là mốc NOMINAL của buổi; và coi 2 lịch cùng nhân sự có giờ nominal trùng nhau là "xung đột" (đúng ra là bình thường trong mô hình ngân sách phút).

### Giải pháp
- Gỡ hoàn toàn khối tính `isOverdue`/`delayMins` + component `CountdownTimer`/`CheckinTimingBadge` (tàn dư mô hình đặt giờ chính xác + OTP đã xóa) khỏi `AppointmentCalendar.tsx`.
- Sửa `getIsDoctorUnavailable` — bỏ nhánh kiểm tra "trùng giờ" (không còn ý nghĩa khi mọi lịch trong 1 buổi dùng chung mốc nominal), chỉ giữ kiểm tra ca trực. Sửa cả 2 nơi trùng lặp logic: `AppointmentCalendar.tsx` và [ManageAppointments/index.tsx](file:///d:/VLTT/VLTT/frontend/src/features/admin/pages/ManageAppointments/index.tsx).
- Đã phát hiện nhưng **chưa sửa** (cùng gốc, nằm ở luồng đổi lịch còn dùng UI giờ chính xác cũ — thuộc A7 chưa tới lượt): `DetailModal/index.tsx` (`occupiedStaffIds`) và `StaffRoomAllocation.tsx` có thể có cùng lỗi khi Admin/Lễ tân đổi nhân sự cho 1 ca.

### Kết quả
`npx tsc --noEmit` sạch. Test tay: mở `/admin/appointments?view=timeline`, xác nhận không còn badge "Trễ"/"Còn X giờ", 2 lịch hẹn cùng bác sĩ trong cùng buổi vẫn hiện đúng tên bác sĩ.

## 3. Đổi luật chống spam A12: "3 lịch/ngày + 3 lịch đang chờ" → "3 lịch đang hoạt động cùng lúc"

### Vấn đề
Người dùng chỉ ra giới hạn cũ (3 lịch/ngày) không chặn được kiểu spam trải nhiều ngày (đặt 3 lịch/ngày × nhiều ngày liên tiếp).

### Giải pháp
- [appointmentStatus.ts](file:///d:/VLTT/VLTT/backend/src/domain/appointmentStatus.ts): export `TERMINAL_STATUSES` để dùng chung.
- [appointment.repository.ts](file:///d:/VLTT/VLTT/backend/src/repositories/appointment.repository.ts): gộp `checkCustomerDailyBookingLimit` + `checkCustomerPendingLimit` thành `checkCustomerActiveLimit` — đếm lịch chưa `hoàn_thành`/`không_đến`/`đã_hủy` của khách, không lọc theo ngày, chặn khi ≥3. Áp dụng cho cả đặt tại quầy và khách tự đặt.
- [receptionist.controller.ts](file:///d:/VLTT/VLTT/backend/src/controllers/receptionist.controller.ts): endpoint `check-limit` (cảnh báo trong `WalkInBookingModal`/`TreatmentBookingModal`) chuyển sang gọi hàm mới.
- Sửa thông báo lỗi thời trong `WalkInBookingModal.tsx` và [TreatmentBookingModal.tsx](file:///d:/VLTT/VLTT/frontend/src/components/appointments/TreatmentBookingModal.tsx) (không còn khuyên "đặt ngày khác" — sai với luật mới).

### Kết quả
`npx tsc --noEmit` sạch cả 2 phía. Test tay: tạo 3 lịch cho 1 khách (rải nhiều ngày) → lịch thứ 4 phải bị chặn; hủy hoặc hoàn thành 1 lịch → đặt lại phải thành công.

## 4. Thiết kế bổ sung vào kế hoạch tổng (CHƯA code — chỉ cập nhật tài liệu)

Toàn bộ mục dưới đây đã ghi đầy đủ vào `smooth-tinkering-island.md`, chưa đụng code:

- **B24 — Check-in từ xa cho khách đã thanh toán** (ưu tiên hàng đợi thật, không khóa giờ cứng) — ⚠️ cờ "CHƯA CHỐT", hỏi lại người dùng khi code chạm tới Phase 3 (hàng đợi) hoặc Phase 5 (B12 thanh toán online cho khách).
- **Cơ chế chống xung đột Lễ tân đổi buổi/đổi nhân sự vs Nhân sự bấm "Gọi vào" cùng lúc** — khóa lạc quan theo `trang_thai` ở tầng UPDATE, áp dụng cho cả "Đổi buổi" (A15) và "Đổi nhân sự" (B15).
- **Làm rõ cơ chế "Gọi không có mặt" (B11)** — nút thao tác tay riêng biệt (không tự động), thẻ hàng đợi phải hiện badge đọc từ `phien_lam_viec.so_lan_goi_khong_co_mat` để nhân sự biết đang ở lần gọi thứ mấy trước khi bấm.
- Dọn các chỗ trong kế hoạch còn ghi luật "3 lịch/ngày" cũ (bảng A12, ví dụ Tầng 0, danh sách 12→11 điều kiện chặn, luồng kiểm thử E0/E, dữ liệu demo) khớp với luật mới ở mục 3.

## 5. Trạng thái hiện tại theo Phase (29 ngày, deadline 02/09/2026)

| Phase | Trạng thái |
|---|---|
| 1. Nền booking (A1, A1b, A2, A3, A4, C1, C2, C3) | ✅ Xong (mục 1) |
| 2. Lịch hẹn & thanh toán quầy (A5, A6, A7, A8, A8b, A9, A10, A10b, A10c, A12, A13, A14, A15, A15b, A15c, C4–C9, C11–C14) | 🔶 Chỉ mới A12 (giới hạn 3 lịch đang hoạt động) — mục 3. Còn lại **chưa làm**, gồm cả A5 (viết lại toàn bộ màn hình quản lý lịch hẹn — hiện đang dùng bản cũ vừa vá lỗi tạm ở mục 2) |
| 3. Hàng đợi & gọi khám (B1–B23, C10) | ❌ Chưa bắt đầu |
| 4. Lượng giá + tái cấu trúc giao diện (A11, A17, A17a–c, A18, B4–B7, B7d–e) | ❌ Chưa bắt đầu |
| 5. Thanh toán online (B12, B13) | ❌ Chưa bắt đầu |
| 6. Hoàn thiện (A16, kiểm thử, demo, báo cáo) | ❌ Chưa bắt đầu |

**Đề xuất việc tiếp theo (Phase 2, chưa chốt thứ tự — hỏi người dùng trước khi bắt đầu):** A5b (gộp bảng cấu hình trạng thái — nền tảng, file gốc `appointmentStatusConfig.ts`) → A10/A10b/A10c (đơn giản hóa trạng thái + tách thanh toán, nhiều phần khác phụ thuộc) → A5 (viết lại màn hình quản lý lịch hẹn, việc lớn nhất Phase 2) → A7 (đổi lịch theo buổi, liên quan trực tiếp cơ chế khóa lạc quan vừa thiết kế ở mục 4) → phần còn lại.

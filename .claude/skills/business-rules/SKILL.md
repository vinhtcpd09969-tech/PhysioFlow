---
name: business-rules
description: Quy tắc nghiệp vụ khóa của OfficeCare về sức chứa lịch hẹn, đặt lịch tuần tự, thanh toán trả góp/từng buổi, hủy gói và hoàn tiền. Dùng khi đọc/sửa code liên quan tới đặt lịch (appointment/cuoc_hen), gói dịch vụ (goi_dich_vu), thanh toán, hóa đơn, hủy/hoàn tiền, hoặc luồng xác nhận của Lễ tân.
allowed-tools: Read, Grep, Glob
---

# Business Rules — OfficeCare

Đây là các quy tắc nghiệp vụ đã bị khóa cứng bởi yêu cầu thực tế của phòng khám — sai một trong các quy tắc này gây thất thoát doanh thu hoặc overbooking thật.

**Nguồn sự thật kỹ thuật cho công thức tính toán: `backend/src/domain/billing.ts`** (pure function, có test ở `billing.test.ts`). `docs/BUSINESS_RULES.md` mô tả lại cho dễ đọc — nếu 2 nơi lệch nhau, tin theo `billing.ts`.

**Đọc toàn bộ `docs/BUSINESS_RULES.md` + `backend/src/domain/billing.ts` trước khi sửa bất kỳ code nào chạm vào:**
- `backend/src/services/appointment.service.ts`, `receptionist.service.ts`, `admin.service.ts`
- `backend/src/repositories/appointment.repository.ts`, `admin.repository.ts`, `receptionist.repository.ts`
- Mọi frontend hook/component đụng `daDangKyGoiId`, `paymentSuccessData`, `so_thu_tu_buoi`, hủy/hoàn tiền gói.

**Lưu ý quan trọng (Phase 2 chưa hoàn tất):** tính tới hiện tại, các repository/service kể trên **CHƯA được sửa để gọi `billing.ts`** — chúng vẫn chứa các bản cài đặt công thức cũ, một số đã xác nhận SAI/lệch nhau (xem lịch sử trong `docs/BUSINESS_RULES.md`). Khi sửa code ở các file này, ưu tiên thay bằng lời gọi tới hàm tương ứng trong `billing.ts` thay vì sửa công thức tại chỗ.

## Tóm tắt nhanh (bắt buộc nhớ đúng công thức — xem `billing.ts` để có công thức chính xác)

- Sức chứa khả dụng = `min(bác sĩ trực ca, giường sẵn sàng) − lịch hẹn trùng ca đang hoạt động`. Trừ ngay khi đặt, không overbooking.
- Buổi `M` cần buổi `M-1` = `hoan_thanh` mới được đặt (trừ pay-per-session: cần thanh toán xong buổi hiện tại) → `getMinPaymentRequired()`.
- Trả góp: đợt 2 phải đóng trước buổi `H = floor(N × 40 / 100) + 1` (biên độ an toàn: cọc 50% luôn dư ít nhất bằng % phạt hủy gói, không cố định `floor(N/2)`) → `getMinPaymentRequired()`.
- Miễn phí khám: gói `tra_thang`/`tra_gop` và giá gói ≥ 1.000.000đ (không phân biệt loại gói) → `isExamWaived()`.
- Hủy gói: phạt **10% trên giá gói đã chốt theo hình thức thanh toán** (`gia_thanh_toan_goi`) — cố định theo hợp đồng, KHÔNG đổi theo số tiền đã đóng thực tế hay cách xử lý phí khám → `calculatePackageCancellationRefund()`. Phí khám lâm sàng trừ trong hoàn tiền lấy giá **động** từ `goi_dich_vu.don_gia`, không hardcode, không trừ 2 lần nếu đã thanh toán riêng.
- Hủy/không đến (KHÔNG còn ân xá lần đầu) → `resolveNoShowOutcome()`. Nhóm A (KHAM/LE/`tung_buoi`): hủy −10đ, không đến −20đ, không mất buổi. Nhóm B (`tra_thang`/`tra_gop`): hủy −10đ không mất buổi, không đến −0đ nhưng MẤT buổi. Khách tự hủy qua client chỉ được khi còn ≥8h trước giờ hẹn (gate ở `cancelCustomerAppointment`); Lễ tân/Admin hủy giúp không giới hạn thời gian.
- Lịch mặc định `Chưa xác nhận`; Lễ tân hủy tay sau ≥3 cuộc không nghe máy — hệ thống không tự hủy.
- Lỗi nghiệp vụ ném từ service/repository → controller trả `400` kèm message gốc, không nuốt thành `500`.

Nếu yêu cầu thay đổi một trong các con số/công thức trên (vd đổi % phạt, đổi ngưỡng H) — đây là thay đổi nghiệp vụ nhạy cảm, phải hỏi lại người dùng trước khi sửa, không tự suy diễn theo "hợp lý".

Khi thay đổi lớn ở các khu vực trên, cân nhắc gọi subagent `business-rule-guardian` để rà lại trước khi chốt.

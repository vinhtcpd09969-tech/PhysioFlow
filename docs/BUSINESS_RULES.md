# Quy tắc nghiệp vụ khóa — OfficeCare

> Nguồn sự thật duy nhất cho các quy tắc nghiệp vụ bắt buộc của hệ thống đặt lịch & thanh toán. Hợp nhất từ `docs/DEVELOPMENT_STANDARDS.md` (cũ), `.agent/rules/CODE_STANDARDS.md` (cũ) và các quyết định đã áp dụng trong `walkthrough.md`. Bất kỳ thay đổi nào đụng tới đặt lịch/thanh toán/hóa đơn phải đối chiếu với file này trước khi code; nếu có 1% mơ hồ thì hỏi lại người dùng trước, không tự suy diễn.
>
> **Cập nhật quan trọng:** các công thức ở mục 3, 4, 5 đã được xác minh lại bằng cách đọc trực tiếp code thật (không chỉ suy từ tài liệu cũ) và cài đặt thành pure function trong `backend/src/domain/billing.ts` — coi file code đó là nguồn sự thật kỹ thuật, tài liệu này chỉ mô tả lại cho dễ đọc. Khi phát hiện sai lệch giữa tài liệu và `billing.ts`, tin theo `billing.ts` và sửa lại tài liệu này.
>
> 🔴 **CẢNH BÁO — MỘT PHẦN FILE NÀY ĐÃ LỖI THỜI (từ đợt tái thiết kế nghiệp vụ khám bắt đầu 04/08/2026):** các mục **1** (sức chứa theo giường/bác sĩ), **2** (danh sách trạng thái), **7** (mốc 8 tiếng khi tự hủy), **8** (đổi lịch qua hotline 8 tiếng), **9** (quy trình "Chưa xác nhận") đã bị **thay thế hoàn toàn** bởi mô hình đặt lịch theo buổi + ngân sách phút — xem cảnh báo chi tiết ngay tại đầu mỗi mục bên dưới. Nguồn sự thật mới nhất cho toàn bộ đặt lịch/trạng thái/hủy lịch/thanh toán là **`.agents/AGENTS.md`** — đọc file đó TRƯỚC khi áp dụng bất kỳ mục nào trong file này.
>
> Các mục **3, 4, 5, 6, 6b, 6c, 10** (trả góp/pay-per-session/miễn phí khám/hủy gói-hoàn tiền/hủy gói quá hạn/voucher/báo lỗi cho client) **KHÔNG bị đợt tái thiết kế chạm tới, vẫn đúng và vẫn là nguồn sự thật chính** cho các mảng đó.

## 1. Sức chứa khả dụng (Capacity)

> 🔴 **LỖI THỜI — TOÀN BỘ MỤC NÀY.** Mô hình "khung giờ + sức chứa giường" đã bị thay hoàn toàn bởi **mô hình đặt lịch theo buổi + ngân sách phút, tách 2 túi vai trò (Chuyên viên/KTV)**. Xem `.agents/AGENTS.md` §1.1. Công thức kỹ thuật đúng hiện tại nằm ở `backend/src/domain/capacity.ts` + `appointment.repository.ts` (không phải mục dưới đây).

- Sức chứa tối đa của 1 khung giờ = `min(Số bác sĩ trực ca đó, Tổng sức chứa giường của các phòng khám sẵn sàng)`.
- Sức chứa khả dụng = Sức chứa tối đa − Tổng số lịch hẹn trùng ca đang hoạt động.
- Khi khách đặt lịch, hệ thống phải trừ sức chứa khả dụng **ngay lập tức**. Không cho phép overbooking nếu vượt số này.
- Nếu sức chứa khả dụng ≤ 0: ẩn khung giờ hoặc hiển thị "Đầy". Xem chi tiết luồng trong `docs/activity_diagrams.md`.

## 2. Đặt lịch tuần tự (Sequential Session Booking)

> ⚠️ **MỘT PHẦN LỖI THỜI.** Quy tắc cốt lõi (buổi `M-1` phải `hoan_thanh` mới được đặt buổi `M`) **vẫn đúng**. Nhưng danh sách trạng thái "lịch đang hoạt động" bên dưới đã lỗi thời: `chua_xac_nhan`/`cho_xac_nhan` **không còn tồn tại** trong hệ thống (đã dọn sạch khỏi DB/code). Danh sách đúng hiện tại: `da_xac_nhan`, `da_checkin`, `dang_kham`, `cho_tai_luong_gia` — xem `.agents/AGENTS.md` §2.1.

- Bệnh nhân bắt buộc phải hoàn thành buổi trị liệu số `M-1` (`trang_thai = 'hoan_thanh'`) mới được đặt lịch cho buổi số `M`.
- **Frontend:** nút "Đặt lịch" của buổi `M` phải disabled + cảnh báo nếu buổi `M-1` chưa hoàn thành.
- **Backend:** chặn đặt buổi tiếp theo nếu khách đang có lịch hoạt động (`chua_xac_nhan`, `cho_xac_nhan`, `da_xac_nhan`, `da_checkin`, `dang_kham`) của cùng phác đồ.

## 3. Thanh toán trả góp 50% (Installment Plan Cutoff)

- Khách trả góp (`tra_gop`) phải đóng 50% còn lại (Đợt 2) **trước khi bắt đầu buổi số `H`**, với
  `H = floor(N × (%cọc − %phạt) / 100) + 1` (N = tổng số buổi của gói, %cọc = 50, %phạt = 10 —
  xem `TRA_GOP_DEPOSIT_PERCENT`/`DEFAULT_CANCELLATION_PENALTY_PERCENT` trong `billing.ts`).
  Đây là công thức **biên độ an toàn**: đảm bảo cọc 50% luôn còn dư ít nhất bằng mức phạt hủy gói
  sau khi trừ chi phí các buổi đã làm — không cố định `floor(N/2)`, vì gói càng nhiều buổi thì
  công thức cũ càng để dư biên độ mỏng dần (có thể âm với gói lớn).
  - Gói 8 buổi (N=8) → H=4.
  - Gói 10 buổi (N=10) → H=5.
  - Gói 12 buổi (N=12) → H=5 (khác `floor(12/2)=6` — bắt đóng sớm hơn 1 buổi để đủ an toàn).
  - Gói 15 buổi (N=15) → H=7 (trùng `floor(15/2)` ở trường hợp này).
  - Gói 16 buổi (N=16) → H=7 (khác `floor(16/2)=8`).
- **Frontend:** cảnh báo đóng Đợt 2 hiện khi `so_thu_tu_buoi >= H` theo đúng công thức trên (không hardcode `floor(N/2)`). Nút "Hoàn thành" của buổi đó bị chặn tới khi hóa đơn gói `da_thanh_toan`. Nhãn nút thanh toán phải ghi **"Vui lòng thanh toán liệu trình"**, không dùng từ ngữ gây hiểu lầm là thanh toán lẻ.

## 4. Thanh toán từng buổi (Pay-Per-Session)

- Khách trả `tung_buoi` phải thanh toán xong buổi hiện tại mới được đặt buổi kế tiếp.
- Sau khi thanh toán xong buổi hiện tại (vd buổi 4), màn hình thành công phải có nút nhanh **"Đặt lịch hẹn Buổi 5 ngay"** (truyền `daDangKyGoiId` và `nextSessionNum` vào `paymentSuccessData`).
- Chặn đặt buổi tiếp theo nếu tổng tiền đã trả thực tế nhỏ hơn tổng tiền tích lũy của các buổi đã dùng.

## 5. Miễn phí khám lâm sàng (Exam Fee Waiver)

- Khách được miễn phí khám lâm sàng khi mua gói bằng hình thức `tra_thang` hoặc `tra_gop` **và** giá gói (không tính phí khám, xem `resolvePackageBasePrice`) **≥ 1.000.000đ**. Không quan tâm loại gói (`LE`/`LIEU_TRINH`).
- Gói trả `tung_buoi` **không bao giờ** được miễn phí khám, dù giá cao.
- Cài đặt chuẩn: `isExamWaived()` trong `backend/src/domain/billing.ts`. **Trước đây có 4 bản cài đặt lệch nhau ở `admin.repository.ts` và `receptionist.service.ts`** (một số bản theo loại gói, một số theo ngưỡng giá, một số theo cả hai) — đã hợp nhất về đúng 1 quy tắc này.

## 6. Hủy gói & Hoàn tiền (Cancellation & Refund)

- **Phí phạt hủy gói = 10% trên tổng giá trị hợp đồng gói đã chốt theo hình thức thanh toán** (`gia_thanh_toan_goi`), **không phải** 10% trên số tiền khách đã đóng thực tế (`so_tien_da_dong`). Đây là giá trị **cố định theo hợp đồng**, không đổi theo tiến độ đóng tiền.
  ```ts
  const phi_phat_thuc_te = Math.round((gia_thanh_toan_goi * phi_phat_percent) / 100);
  ```
  Cài đặt chuẩn: `calculatePackageCancellationRefund()` trong `backend/src/domain/billing.ts`.
- Chi phí khám lâm sàng bị trừ trong hoàn tiền phải lấy **giá động** từ `goi_dich_vu.don_gia` thông qua `cuoc_hen → goi_dich_vu` tương ứng — **cấm hardcode** con số cố định (vd không được gán cứng `-200.000đ`).
- Nếu khách đã thanh toán hóa đơn khám riêng trước đó: chỉ trừ phí khám **đúng 1 lần**, không trừ lặp trong hoàn tiền gói.
- Khi truy vấn danh sách/chi tiết hóa đơn, cột chi phí khám phải tính động qua join với bảng dịch vụ, không trả cứng một con số.

### 6b. Hủy gói quá hạn sử dụng — không hoàn tiền (Expired Package — No Refund)

Quy tắc **riêng biệt**, khác hẳn mục 6 ở trên — áp dụng khi khách mua gói liệu trình rồi **mất liên lạc hoàn toàn** cho tới khi gói quá `phac_do_dieu_tri.han_su_dung`.

- Mỗi gói `LIEU_TRINH` được cấu hình "Hạn sử dụng mặc định (ngày)" tại màn Quản lý gói dịch vụ (`goi_dich_vu.han_su_dung_mac_dinh_ngay`) — áp dụng cho **cả 3 hình thức thanh toán** (trả thẳng/trả góp/từng buổi). Giá trị này chỉ là gợi ý mặc định tại thời điểm **đăng ký gói mới**; hạn sử dụng thật được **chốt cứng (snapshot)** vào `phac_do_dieu_tri.han_su_dung` = ngày kích hoạt + N ngày — đổi cấu hình gói sau này **không** ảnh hưởng các khách đã đăng ký trước đó.
- Khi gói đã quá hạn sử dụng, **Admin** (không phải lễ tân) có thể chủ động bấm "Hủy do quá hạn sử dụng" — **KHÔNG có cơ chế tự động chạy ngầm** (không cron/sweep), tránh hủy nhầm khách chỉ trễ hẹn.
- Kết quả: **giữ nguyên toàn bộ** số tiền khách đã đóng (`so_tien_da_tra`) vào doanh thu — **không hoàn, không thu thêm** — bất kể hình thức thanh toán nào (kể cả từng buổi, dù bản chất số đã thu ở từng buổi vốn không có phần dư để giữ thêm). **Không áp dụng công thức phạt 10% + hoàn phần dư của mục 6.**
- Backend tự re-validate `han_su_dung < CURRENT_DATE` trước khi cho hủy (không tin tuyệt đối vào UI), chặn 400 nếu gói chưa thực sự quá hạn.
- Cài đặt: `expirePackageNoRefund()` trong `backend/src/repositories/admin.repository.ts`, endpoint `POST /admin/invoices/:id/expire-no-refund` (roles Admin/Quản lý).

## 6c. Mã giảm giá (Voucher) — giới hạn theo hình thức thanh toán & lượt dùng

- `yeu_cau_thanh_toan` là **tập hợp nhiều lựa chọn** (mảng Postgres `text[]`), không phải 1 giá trị đơn — 1 voucher có thể áp dụng đồng thời cho nhiều hình thức thanh toán (vd Trả thẳng + Trả góp, loại trừ Từng buổi). Mảng rỗng hoặc chứa `'tat_ca'` nghĩa là không giới hạn.
- `so_luong_toi_da` (cột DB `so_luong_gioi_han`) giới hạn số lượt dùng **tính riêng theo từng khách hàng**, không phải tổng số lượt dùng gộp toàn hệ thống — mỗi khách được dùng mã tối đa bấy nhiêu lần, không giới hạn tổng số khách khác nhau. Đếm động qua `COUNT(hoa_don WHERE voucher_id = ... AND khach_hang_id = ...)`, không dùng cột đếm sẵn (cột `so_luong_da_dung` cũ đã bị xóa vì không bao giờ được cập nhật).
- Giá trị giảm loại % chỉ hợp lệ trong khoảng `(0, 100]`; loại số tiền cố định không có "giảm tối đa" (field đó chỉ áp dụng cho %).
- Cài đặt: `assertVoucherUsable()`/`countVoucherUsage()` trong `backend/src/services/receptionist.service.ts` + `backend/src/repositories/receptionist.repository.ts`.

## 7. Phạt điểm uy tín & mất buổi khi hủy/không đến (No-Show Penalty)

> ⚠️ **MỘT PHẦN LỖI THỜI.** Bảng hậu quả Nhóm A/B bên dưới **vẫn đúng cho Lễ tân/Admin hủy giúp** và cho quét tự động không-đến (B10). Nhưng dòng **"Mốc 8 tiếng"** (bullet cuối) đã bị **thay hoàn toàn**: khách tự hủy qua trang khách hàng giờ theo **cửa sổ 60 phút kể từ lúc đặt** (không phải 8 tiếng trước giờ hẹn), và khi hủy thành công trong cửa sổ đó thì **KHÔNG áp bảng Nhóm A/B** — luôn ra `loai_huy='khach_huy_som'`, **không trừ điểm uy tín**. Ngoài cửa sổ 60 phút, khách tự hủy bị **chặn hẳn** (không rơi về gọi Lễ tân như mốc 8 tiếng cũ). Xem `.agents/AGENTS.md` §2.2.

Không còn khái niệm "ân xá lần đầu"/đếm số lần vi phạm. Hậu quả chỉ phụ thuộc **hành động** (hủy vs không đến) và **nhóm gói**:

- **Nhóm A** (chưa thanh toán trước, trả sau khi hoàn thành): gói `KHAM`, `LE`, và `LIEU_TRINH` trả `tung_buoi`.
- **Nhóm B** (đã thanh toán trước): gói `LIEU_TRINH` trả `tra_thang` hoặc `tra_gop`.

| Hành động | Nhóm A | Nhóm B |
|---|---|---|
| **Hủy** (`da_huy`) | Trừ **10 điểm uy tín**. Không mất buổi. | Trừ **10 điểm uy tín**, **không mất buổi** (đặt lại đúng buổi đó được). |
| **Không đến** (`khong_den`) | Trừ **20 điểm uy tín**. **Không mất buổi** (đặt lại được — chưa mất tiền gì). | **Không trừ điểm** (đã mất tiền buổi đó = đủ hậu quả, tránh phạt kép). **Mất buổi** (tính vào `so_buoi_da_dung`, tiến sang buổi tiếp theo). |

- **Mốc 8 tiếng — chỉ áp cho khách tự hủy qua trang client:** khách chỉ được tự hủy khi còn ≥ 8 tiếng trước giờ hẹn; dưới mốc đó nút/API bị chặn (chặn cả FE lẫn BE tại `cancelCustomerAppointment`), buộc khách gọi Lễ tân. **Lễ tân/Admin hủy giúp không bị giới hạn 8 tiếng** — hủy được bất kỳ lúc nào, luôn cho ra hậu quả "hủy" (trừ 10đ, không mất buổi).
- Không còn bắn ra trạng thái escalated `da_huy_phat`/`khach_khong_den_phat` (giữ trong enum DB cho dữ liệu lịch sử, không gán mới).
- `so_buoi_da_dung` (buổi đã tiêu thụ) = đếm `hoan_thanh` luôn luôn + `khong_den` **chỉ khi** gói Nhóm B; `da_huy` không bao giờ tính (`updateCompletedSessionsCount` trong `appointment.repository.ts`).
- Quyền khóa tài khoản: Nếu điểm uy tín xuống quá thấp, OfficeCare có quyền chủ động khóa/tạm khóa tài khoản qua bộ phận kiểm duyệt định kỳ (không khóa tự động).
- Cài đặt chuẩn: `resolveNoShowOutcome()` trong `backend/src/domain/billing.ts` (hàm thuần, không biết mốc 8 tiếng — gate 8h nằm tách biệt ở `cancelCustomerAppointment`).

## 8. Đổi lịch hẹn (Rescheduling Policy)

> 🔴 **LỖI THỜI — TOÀN BỘ MỤC NÀY.** Không còn mốc 8 tiếng. Quy tắc mới: lịch **chưa thanh toán** thì không cần đổi (hủy rồi đặt lại trong cửa sổ 60 phút); lịch **đã thanh toán** thì **CHỈ Lễ tân được đổi buổi, không giới hạn số lần** (khách không tự đổi được, chỉ có nút "Yêu cầu đổi lịch" mở hộp thoại hotline). Xem `.agents/AGENTS.md` §2.2.

- Khách hàng được phép đổi lịch hẹn bằng cách liên hệ hotline trước ít nhất **8 tiếng** trước giờ bắt đầu của ca hẹn.
- Trong vòng 8 tiếng trước giờ hẹn, khách không được đổi lịch mà chỉ được hủy lịch hoặc vắng mặt.

## 9. Quy trình tiếp đón của Lễ tân (Receptionist Confirmation Flow)

> 🔴 **LỖI THỜI — TOÀN BỘ MỤC NÀY.** Trạng thái `Chưa xác nhận` không còn tồn tại — lịch đặt xong vào thẳng `da_xac_nhan`. Không còn bước Lễ tân gọi điện xác nhận (đã gỡ khỏi hệ thống theo C4 trong kế hoạch tái thiết kế). Xem `.agents/AGENTS.md` §2.1.

- Trạng thái mặc định khi khách đặt lịch: `Chưa xác nhận`.
- Lễ tân liên hệ điện thoại xác nhận trực tiếp. Nếu không liên lạc được, Lễ tân hủy lịch **bằng tay**.
- Hệ thống **không tự động hủy** lịch chưa xác nhận — giữ tính nhân văn và linh hoạt cho nghiệp vụ phòng khám.

## 10. Báo lỗi nghiệp vụ an toàn cho client

- Mọi lỗi ràng buộc nghiệp vụ (chưa thanh toán buổi trước, trùng lịch nhân sự, đã có lịch đang hoạt động...) ném ra từ Repository/Service dưới dạng `Error` phải được Controller bắt và trả về `400 Bad Request` kèm message gốc.
- **Cấm** nuốt lỗi nghiệp vụ rồi trả về `500 Lỗi server` chung chung — khách/nhân viên cần thấy đúng lý do bị chặn.

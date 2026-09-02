# AGENTS.md — Bộ não nghiệp vụ & kiến trúc OfficeCare

> **Mục đích file này:** đây là bản tổng hợp duy nhất, đầy đủ nhất về nghiệp vụ y tế PHCN, kiến trúc hệ thống, và các quyết định thiết kế của dự án OfficeCare — dành cho AI Agent đọc để có đủ ngữ cảnh làm việc mà không cần hỏi lại người dùng những gì đã quyết định.
>
> **Quan hệ với các tài liệu khác:**
> - `CLAUDE.md` (gốc dự án) — quy tắc bất di bất dịch (Socratic Gate, không code mù, DRY chủ động...). File này **không** lặp lại, chỉ tham chiếu.
> - `docs/BUSINESS_RULES.md`, `docs/ARCHITECTURE_CONVENTIONS.md`, `docs/DESIGN_SYSTEM.md` — vẫn là nguồn quy tắc chi tiết cho các mảng **chưa bị đợt tái thiết kế 04/08/2026 chạm tới** (sức chứa cũ theo giường/bác sĩ, đặt lịch tuần tự gói, trả góp, miễn phí khám, hủy gói/hoàn tiền, voucher). ⚠️ **CẢNH BÁO:** `BUSINESS_RULES.md` mục 2 ("Chưa xác nhận"/"cho_xac_nhan"), mục 7-8 (mốc 8 tiếng), mục 9 (quy trình xác nhận điện thoại) **đã bị thay thế** bởi các quyết định trong file này (xem §1.2, §2.1, §2.3) — coi file `AGENTS.md` này là nguồn sự thật mới nhất cho mọi thứ liên quan tới đặt lịch/trạng thái/hủy lịch, `BUSINESS_RULES.md` chỉ còn đúng cho phần **gói liệu trình/thanh toán/hoàn tiền** chưa đổi.
> - Kế hoạch chi tiết đầy đủ nhất (từng dòng quyết định, từng bảng ví dụ, từng luồng test) nằm ở plan gốc `smooth-tinkering-island` (đã dùng trong phiên làm việc tái thiết kế) — file này là bản **rút gọn có tổ chức lại** để AI đọc nhanh, không thay thế hoàn toàn plan gốc nếu cần tra cứu chi tiết cực nhỏ.
> - Skills tham chiếu khi code: `.claude/skills/business-rules/`, `.claude/skills/fsd-conventions/`, `.claude/skills/design-system/`.

---

## 0. Bối cảnh dự án (bắt buộc hiểu trước khi làm bất kỳ việc gì)

**OfficeCare** là hệ thống quản lý phòng khám **Phục Hồi Chức Năng (PHCN)** cho dân văn phòng — đặt lịch, lượng giá chức năng, trị liệu, thanh toán, hồ sơ điều trị. 5 actor: **Admin/Quản lý**, **Lễ tân**, **Chuyên viên Vật lý trị liệu** (tên cột/route cũ: "Bác sĩ"), **Kỹ thuật viên (KTV)**, **Khách hàng**.

**Sự kiện gốc:** Ngày 04/08/2026, hội đồng bảo vệ đồ án **đánh gãy toàn bộ nghiệp vụ khám**, yêu cầu làm lại. Deadline bảo vệ lại: **02/09/2026**. Ba điểm hội đồng chê cụ thể:

1. **Khám quá sơ sài** — màn hình khám chỉ có 3 ô nhập (chẩn đoán/chống chỉ định/ghi chú), không giống quy trình khám thật.
2. **Thiếu màn hình hàng đợi** — không tìm/tra cứu được khách tiếp theo để gọi vào khám.
3. **Booking khóa cứng nhân sự theo slot 30 phút** — khách xong sớm thì nhân sự ngồi chờ lãng phí công suất; khách đi làm dịch vụ khác thì cả dây chuyền tắc.

**Chẩn đoán gốc rễ:** hệ thống cũ mô phỏng mô hình đặt lịch kiểu phương Tây (mỗi khách một slot giờ chính xác, khóa nhân sự) trong khi phòng khám Việt Nam vận hành theo mô hình **lấy số – chờ gọi**. Toàn bộ đợt tái thiết kế là chuyển hệ thống sang đúng mô hình đó.

**Hai bẫy nghiệp vụ đã chủ động loại trừ** (từng cân nhắc rồi bác bỏ có chủ đích — nếu bị đề xuất lại, đây là lý do để từ chối):

| Bẫy | Vì sao bị loại |
|---|---|
| Xây module cận lâm sàng nội bộ (X-quang/MRI/PACS) | **Lý do pháp lý, không phải lý do phạm vi:** chụp X-quang cần giấy phép an toàn bức xạ + KTV chẩn đoán hình ảnh có chứng chỉ riêng — phòng khám PHCN **không được phép** làm việc này, phải **chuyển tuyến** ra cơ sở ngoài. Bỏ nó còn giải quyết luôn bài toán "chuyên viên ngồi chờ" (điểm chê #3). |
| Bán gói liệu trình **trước khi** lượng giá | Tạo xung đột lợi ích — người ra chỉ định (bán hàng) mất vai trò quyết định chuyên môn. Trình tự bắt buộc: lượng giá xong → có chỉ định → mới bán gói. |

---

## 1. 🏦 TỔNG QUAN NGHIỆP VỤ & BẢN CHẤT HỆ THỐNG

### 1.1. Mô hình đặt lịch theo buổi & ngân sách phút

**Vì sao bỏ slot 30 phút cố định:** slot cố định giả định mọi dịch vụ tốn đúng thời lượng dự kiến và không có công việc chen ngang — sai với thực tế PHCN, nơi một buổi trị liệu xen kẽ tay-đôi (hands-on, KTV bận hoàn toàn) và máy chạy (hands-off, KTV rảnh). Khóa cứng slot khiến khách xong sớm thì nhân sự ngồi không (lãng phí công suất thật), còn khách cần đi làm việc khác (chụp chiếu ngoài) thì cả dây chuyền slot phía sau bị đẩy lùi.

**Mô hình mới — đơn vị đặt lịch là BUỔI, sức chứa tính bằng NGÂN SÁCH PHÚT:**

| Hạng mục | Giá trị |
|---|---|
| Buổi Sáng | 07:30 – 12:00 (270 phút) |
| Buổi Chiều | 12:00 – 20:00 (480 phút) |
| Giờ đóng cửa | **20:00** — mọi ca phải xong trước mốc này (tham số `GIO_DONG_CUA` trong `backend/src/domain/capacity.ts`, hiện chưa được dùng ở đâu — xem §3 Pending) |
| Ca trực nhân sự | Giữ nguyên 2 ca: 7h–16h và 11h–20h |

**Công thức ngân sách phút của một (nhân sự × buổi):**
```
ngân_sách = (phần giao giữa ca trực và giờ nhận khách của buổi) × số_khách_song_song
```
- Trừ ngân sách **đúng bằng `thoi_luong_phut`** của dịch vụ khách chọn — không đếm lượt, vì các gói có thời lượng khác nhau (30/60/90/120 phút).
- **Hai tầng sức chứa:** ngân sách RIÊNG của từng nhân sự, và ngân sách CHUNG = tổng ngân sách riêng **trong cùng một nhóm vai trò** (xem tách túi bên dưới).
- Số khách song song mặc định: **Chuyên viên VLTL = 1** (lượng giá cần tập trung), **KTV = 2** (xen kẽ khi khách nằm máy — cấu hình được).
- Song song thực tế = `min(cấu hình số khách song song của nhân sự, sức_chứa phòng đang trực)`.

**⚠️ Tách túi theo vai trò — quy tắc dễ code sai nhất:**

| Loại buổi | Ai làm | Trừ vào túi |
|---|---|---|
| Buổi Lượng giá | Chuyên viên VLTL | **Túi Chuyên viên** |
| Dịch vụ lẻ | KTV | **Túi KTV** |
| Buổi gói liệu trình | KTV | **Túi KTV** (dùng chung với dịch vụ lẻ) |

Lượng giá **KHÔNG BAO GIỜ** trừ chung với trị liệu/dịch vụ lẻ. Hết chỗ lượng giá không có nghĩa hết chỗ trị liệu và ngược lại — mọi con số ngân sách phải nêu rõ đang nói về túi nào.

**Ba bẫy tính toán đã ghi nhận (đọc kỹ trước khi đụng code tính ngân sách):**

1. **Bẫy hai hệ số nhân:** công thức có CẢ số khách song song LẪN ngân sách riêng nhân với nhau. Ví dụ buổi sáng 270 phút: 1 Chuyên viên → 270 phút; 1 KTV bật song song 2 → 540 phút; 2 người CÙNG ca 7h–16h → 540 phút chung — không được nhầm các trường hợp này.
2. **Bẫy hai nhân sự KHÔNG đóng góp bằng nhau:** ca 7h–16h giao với buổi sáng 7h30→12h00 = 270 phút, nhưng ca 11h–20h chỉ giao 11h→12h00 = **60 phút**. Hai nhân sự mỗi người một ca khác nhau thì buổi sáng chỉ có 330 phút tổng, KHÔNG phải 540.
3. **Bẫy "Bất kỳ" phải kiểm tra ĐỦ HAI điều kiện:** `① Σ đã dùng + thời lượng mới ≤ ngân sách CHUNG` **VÀ** `② TỒN TẠI ít nhất 1 nhân sự còn đủ chỗ trong ngân sách RIÊNG`. Ví dụ: A dùng 250 phút, B dùng 250 phút (chung dùng 500/540, còn 40) — khách đặt 30 phút "Bất kỳ": điều kiện ① qua (530≤540) nhưng A và B đều chỉ còn 20 phút → không ai đủ 30 → **PHẢI CHẶN**. Chỉ kiểm tra ① thì hệ thống nhận ca mà tới nơi không ai làm được.

**Quy tắc chặn đặt lịch — theo THỜI LƯỢNG, không đếm số ca:**
```
CHẶN ⟺ thoi_luong_phut của dịch vụ > số phút còn lại trong ngân sách liên quan
```
Thông báo phải nói rõ **"Buổi sáng còn 60 phút — chỉ nhận dịch vụ ≤60 phút"**, tuyệt đối không báo "Hết chỗ" chung chung.

> ⚠️ `goi_dich_vu.thoi_luong_phut` là **MỐC KẾ HOẠCH**, không phải giới hạn cứng — dùng để tính ngân sách/dự báo, không thêm ràng buộc chặn nhân sự làm quá thời lượng đó (ca chạy dài hơn dự kiến là chuyện bình thường).

### 1.2. Luồng 3 bước: Đặt lịch → Check-in & Thu tiền linh hoạt → Hàng đợi

```
① ĐẶT LỊCH                    ② LỄ TÂN CHECK-IN & THU TIỀN         ③ HÀNG ĐỢI LƯỢNG GIÁ / TRỊ LIỆU
   chọn dịch vụ                   CHỈ Lễ tân được check-in             mô hình KÉO, không gán sẵn
   → ngày → buổi                  Thu tiền LINH HOẠT, tách rời          nhân sự bấm "Gọi vào" mới gán
   → nhân sự / "Bất kỳ"           khỏi tiến trình lâm sàng              → "Bắt đầu" mới chạy đồng hồ
   bắt buộc đăng nhập             (xem bảng thời điểm thu bên dưới)
```

**① Đặt lịch:**
- Bỏ hoàn toàn chọn giờ cụ thể — chỉ chọn buổi.
- **Bắt buộc đăng nhập** — đã bỏ luồng khách vãng lai đặt online (lý do: hồ sơ điều trị phải gắn đúng người được điều trị, xem §1.4).
- Giới hạn **3 lịch đang hoạt động cùng lúc, toàn thời gian** (không phân theo ngày) — khách được đặt nhiều lịch trong CÙNG một buổi (vd lượng giá xong làm trị liệu luôn), giới hạn duy nhất là tổng số lịch chưa kết thúc.
- Khách chọn nhân sự cụ thể → trừ ngân sách riêng người đó, biết trước tên + phòng (từ `lich_truc_nhan_su.phong_id`). Chọn "Bất kỳ" → trừ ngân sách chung, khuyến nghị (rải tải tốt hơn).

**② Lễ tân Check-in & Thu tiền linh hoạt — quy tắc cốt lõi:**

| Loại buổi | Thời điểm thu | Chặn cứng? |
|---|---|---|
| **Buổi Lượng giá** (khám) | **BẮT BUỘC trước khi bắt đầu** | ✅ Khóa nút "Bắt đầu khám" nếu `trang_thai_thanh_toan = chua_thanh_toan` |
| **Dịch vụ lẻ** | Linh hoạt: online / lúc check-in / sau khi làm xong | ❌ Không chặn |
| **Buổi gói 100%** | Đã trả trước → `da_thanh_toan` ngay khi tạo lịch | — |
| **Buổi gói từng buổi** | Linh hoạt (như dịch vụ lẻ) | ❌ Không chặn |
| **Mua gói liệu trình** | Tại quầy, sau khi có chỉ định | — |

**Vì sao CHỈ buổi Lượng giá chặn cứng** (không phải vì "lần đầu tiếp xúc" — khách cũ vẫn lượng giá lại được, lý do đó sai): **Lượng giá là con đường DUY NHẤT đưa khách ra khỏi trung tâm** — Chuyên viên có thể "Chuyển tuyến" và khách rời đi ngay, ngoài tầm kiểm soát. Chưa thu tiền mà khách không quay lại thì **mất trắng, không đòi được**. Trị liệu thì ngược lại — khách quẩn quanh trong trung tâm từ đầu tới cuối buổi, không có đường thất thoát, nên không cần chặn.

Chặn **mềm**: khách chưa trả vẫn check-in, vào hàng đợi bình thường, chỉ hiện cảnh báo đỏ "⚠️ Chưa thanh toán" trong hàng đợi để Chuyên viên báo Lễ tân — chỉ nút "Bắt đầu khám" bị khóa.

**Trạng thái lâm sàng TÁCH RỜI trạng thái thanh toán** (điều kiện kỹ thuật để có sự linh hoạt trên) — xem §2.1.

**③ Hàng đợi — mô hình KÉO, KHÔNG gán nhân sự lúc check-in:**

Lý do: gán theo "người ít ca nhất lúc check-in" là sai — ít ca nhất ≠ rảnh sớm nhất. Nếu gán khách cho nhân sự A lúc 9h rồi A nhận ngay ca 120 phút, trong khi nhân sự B xong lúc 9h15, khách bị "khóa" vào A dù B rảnh ngay cạnh.

Cách đúng: khách không chọn ai → vào **hàng đợi chung**, `nhan_su_id` để trống. Ai xong ca trước thì bấm **"Gọi vào"**, hệ thống gán ngay lúc đó.

**Phân biệt hai loại "rảnh"** — ⚠️ dựa THUẦN vào **số bàn đang giữ so với số bàn song song tối đa** (KTV = 2, xem §1.1), **KHÔNG dựa vào giai đoạn thiết bị nào** (cơ chế theo dõi máy real-time đã CẮT khỏi phạm vi 08/08/2026, xem §2.1 và §4.2):

| Trạng thái | Ai quyết định gán |
|---|---|
| Đang bận hết bàn (giữ đủ số bàn song song tối đa) | — bận, không gán |
| **Rảnh tạm** (đang giữ 1/2 bàn, còn 1 chỗ trống) | **Nhân sự tự quyết** — muốn kéo thêm thì tự bấm "Gọi vào" cho slot còn trống, hệ thống KHÔNG ép |
| **Rảnh hoàn toàn** (vừa xong ca, không còn khách nào) | ⭐ **Hệ thống TỰ GÁN** khách tiếp theo (ưu tiên: khách chọn đích danh > khách chờ lâu nhất), hiện nổi bật + nút "Gọi vào"; không bấm trong 5 phút thì trả về hàng đợi chung |

Hai nút tách biệt: **"Gọi vào khám"** (báo Lễ tân mời khách) → **"Bắt đầu khám"** (đồng hồ mới chạy).

Thứ tự hàng đợi theo `thoi_gian_checkin` (ai đến trước gọi trước), KHÔNG theo thời điểm đặt lịch.

**Cơ chế Gọi vào / Số thứ tự / Không có mặt — ĐÃ TRIỂN KHAI 08/08/2026 (B2/B11/B19/B23 một phần), server-side hoàn toàn:**

- **`phien_lam_viec` tạo đúng 1 dòng MỖI LẦN cuộc hẹn chuyển sang `da_checkin`** — kể cả check-in lại sau `cho_tai_luong_gia` (tạo dòng MỚI, `lan_thu` tăng dần, không tái dùng dòng cũ) → đếm "gọi không có mặt" của lần khám trước không dính sang lần tái lượng giá. Cài trong CÙNG transaction với `updateAppointmentStatus` (`appointment.repository.ts`).
- **Số thứ tự hàng đợi (`so_thu_tu_hang_doi`)** gán lúc tạo dòng trên — **MỘT DÃY SỐ RIÊNG cho mỗi túi vai trò** (Lượng giá vs Điều trị+dịch vụ lẻ, đúng ranh giới §1.1), reset về 1 mỗi ngày. Hiện ở cả `SpecialistFlowBoard.tsx` (badge số cạnh tên khách) và `TodayFlowBoard.tsx` (badge tròn góc avatar).
- **"Gọi vào" (`doctor.repository.ts::callInPatient`):** nếu ca đang "Bất kỳ" (`nhan_su_id NULL`) thì gán luôn cho người bấm (khóa lạc quan trong `WHERE`, 2 người bấm trùng thì người sau bị từ chối rõ ràng). Trả về **tên nhân sự + tên phòng THẬT** (tái dùng LATERAL join `lich_truc_nhan_su` theo ca trực hôm nay của người vừa được gán) — không còn hard-code chuỗi tĩnh.
- **"Không có mặt"/"Đẩy xuống" — HAI điểm vào, CÙNG một hiệu ứng cốt lõi** (tăng `so_lan_goi_khong_co_mat`, reset `thoi_gian_goi_vao`, đẩy `cuoc_hen.thoi_gian_checkin = NOW()` để tự rơi xuống cuối hàng đợi ở **cả 2 màn hình** vì cả hai đều sort theo `thoi_gian_checkin`):
  - **Nhân sự** (`doctor.repository.ts::markPatientAbsent`) — CẦN ownership (đang được gán ca đó). Lần 1: êm, không hỏi. **Lần 2: TỰ ĐỘNG chuyển `khong_den`** (qua `appointmentRepository.updateAppointmentStatus`, có popup xác nhận trước khi gọi API).
  - **Lễ tân** (`appointmentRepository.pushBackAppointment`, route `POST /admin/appointments/:id/push-back`) — KHÔNG cần ownership (quản lý cả hàng đợi). **KHÔNG BAO GIỜ tự động chuyển "Không đến"** dù đếm đạt 2 — Lễ tân luôn phải tự bấm nút **"Không đến" riêng** (carve-out xuyên qua khóa `da_checkin`, xem §2.1) để xác nhận bằng tay.
- ⚠️ **Carve-out `da_checkin → khong_den` phải sửa Ở HAI TẦNG, sửa 1 tầng là không đủ:** (1) `domain/appointmentStatus.ts::checkReceptionistTransition` (rule thuần), VÀ (2) gate `isReceptionistLockedStatus(...)` chạy TRƯỚC nó ngay trong `appointment.repository.ts::updateAppointmentStatus` (nhánh `actorRoleId === 2`) — gate này throw sớm nếu không loại trừ đúng transition, khiến sửa (1) trở thành dead code. Đây là lỗi thật đã xảy ra khi cài đặt lần đầu, đã vá cả 2 nơi + thêm test (`appointmentStatus.test.ts`).

### 1.3. Ranh giới thẩm quyền: Chuyên viên PHCN vs Bác sĩ y khoa

| ❌ KHÔNG được làm | ✅ ĐƯỢC làm, là chuyên môn chính |
|---|---|
| Chẩn đoán bệnh lý y khoa (vd đọc kết luận MRI "thoát vị đĩa đệm") | **ROM** (tầm vận động khớp) |
| Kê đơn thuốc | **MMT** (cơ lực, thang 0–5) |
| — | **VAS** — thang đau, xem 3 cách nhập bên dưới |
| — | **Kết luận lượng giá** — mô tả CHỨC NĂNG, không phải bệnh lý |
| — | **Chống chỉ định vận động/trị liệu** — bắt buộc phải có |
| — | **Chuyển tuyến** khi nghi ngờ vấn đề ngoài thẩm quyền |

⚠️ **Cột DB giữ tên `chan_doan` nhưng NỘI DUNG đổi bản chất:** không viết *"thoát vị đĩa đệm L4-L5"* (bệnh lý) mà viết *"hạn chế xoay cổ trái 40°, yếu nhóm cơ thang dưới bậc 3/5"* (chức năng). Nếu demo mà gõ một chẩn đoán bệnh lý vào ô này, hội đồng bắt lỗi ngay — toàn bộ việc đổi "Bác sĩ → Chuyên viên" mất tác dụng.

**VAS — 3 cách nhập, cùng ghi vào MỘT giá trị 0–10:**

| Cách | Mô tả | Mặc định |
|---|---|---|
| ⭐ **Thang mặt cười (Wong-Baker FACES)** | 6 khuôn mặt tươi→nhăn, tương ứng 0/2/4/6/8/10 | **MẶC ĐỊNH** — đa số khách chỉ cần chỉ tay |
| **Mô tả bằng lời** | Không đau · Nhẹ · Vừa · Nặng · Rất nặng · Không chịu nổi → tự quy đổi ra số | Khách quen mô tả bằng từ ngữ |
| **Thang số** | Thanh trượt 0–10 | Khách đã quen thang điểm |

Kèm câu hỏi neo chức năng khi khách lúng túng: *"Cơn đau có làm mất ngủ không? Có ảnh hưởng ngồi làm việc/lái xe không? Có phải uống thuốc giảm đau không?"*

**Nút "Chuyển tuyến":** KHÔNG chọn loại chụp (nói miệng ngoài đời), KHÔNG validation dữ liệu lâm sàng, chỉ hỏi **hạn quay lại** → ca sang trạng thái `cho_tai_luong_gia` (nhãn "Chờ tái lượng giá"), **giải phóng chuyên viên NGAY** (không chờ khách quay lại mới nhận khách mới). Khách quay lại: Lễ tân bấm "Check-in ngay" trên CHÍNH lịch đó (không tạo lịch mới, không thu tiền lần 2) → vào **đầu hàng đợi** của đúng chuyên viên cũ → mở lại CHÍNH bàn lượng giá cũ, nhập nốt ROM/chẩn đoán/chống chỉ định còn trống. Quá hạn không quay lại → ca **tự chuyển hoàn thành**, không hoàn tiền khám (vì chuyên viên đã lượng giá và đưa khuyến cáo kịp thời — đó là giá trị thật khách nhận được).

**Ảnh đính kèm:** chuyên viên CHỈ XEM (khách gửi ảnh lúc đặt lịch), KHÔNG có chức năng upload. Khách đi chụp chiếu về mang phim giấy đến, chuyên viên xem trực tiếp bằng mắt rồi nhập kết luận vào `chan_doan` — **không số hóa phim**.

### 1.4. Thuật ngữ hiển thị (chỉ đổi NHÃN UI, giữ nguyên tên bảng/cột/biến trong code)

| Hiện tại trong code | Hiển thị cho người dùng |
|---|---|
| Bác sĩ | **Chuyên viên Vật lý trị liệu** |
| Dịch vụ Khám | **Buổi Lượng giá** |
| Tái khám | **Lượng giá bổ sung** |
| Bàn khám | **Bàn lượng giá** |
| Chẩn đoán lâm sàng | **Kết luận lượng giá** |
| Phác đồ điều trị | **Kế hoạch trị liệu** |
| Hồ sơ bệnh án/điều trị | **Lịch sử điều trị** |
| Chuyển cận lâm sàng | **Chuyển tuyến** |
| `cho_tai_luong_gia` | **Chờ tái lượng giá** |
| Bệnh nhân | **Khách hàng** |
| Chống chỉ định | *giữ nguyên* (đúng thẩm quyền) |

> ⚠️ **KHÔNG** đổi thành "Tư vấn viên" — chức danh bán hàng không có thẩm quyền lâm sàng.

### 1.5. Vì sao bắt buộc đăng nhập, không cho nhập SĐT riêng từng lịch

Hai tình huống hay bị gộp nhầm:
- **Đổi sim** → sửa ở hồ sơ tài khoản, không phải từng lịch (sửa 1 lịch thì các lịch khác vẫn số cũ → loạn dữ liệu).
- **Đặt giùm người thân** → không phải vấn đề SĐT, mà là **hồ sơ y tế thuộc về ai**. Nếu A đặt cho mẹ mà chỉ đổi SĐT, kết luận lượng giá/VAS/chống chỉ định của mẹ bị ghi vào hồ sơ của A — lỗi nghiêm trọng về dữ liệu y tế.

→ **Mỗi người được điều trị phải có tài khoản riêng** (Lễ tân tạo giúp tại quầy nếu cần). *"Hệ thống bắt buộc đăng nhập vì hồ sơ điều trị phải gắn đúng người được điều trị — không thể dùng chung tài khoản, kể cả trong gia đình."*

---

## 2. 📐 QUY TẮC KIẾN TRÚC & RÀNG BUỘC CODE

### 2.1. Cấu trúc trạng thái — 2 tầng, KHÔNG được trộn

**Tầng 1 — LÂM SÀNG (`cuoc_hen.trang_thai`): đúng 7 giá trị**

| # | Giá trị | Nhãn |
|---|---|---|
| 1 | `da_xac_nhan` | Đã xác nhận (đặt xong vào thẳng đây, KHÔNG còn "chờ xác nhận") |
| 2 | `da_checkin` | Đã check-in (CHỈ Lễ tân bấm) |
| 3 | `dang_kham` | **Đang thực hiện** (đổi nhãn, giữ tên cột — dùng chung lượng giá lẫn trị liệu) |
| 4 | `cho_tai_luong_gia` | Chờ tái lượng giá |
| 5 | `hoan_thanh` | Hoàn thành |
| 6 | `da_huy` | Đã hủy (`loai_huy` là THUỘC TÍNH, không phải trạng thái riêng) |
| 7 | `khong_den` | Không đến (hệ thống tự quét) |

**Tầng 2 — THANH TOÁN (`cuoc_hen.trang_thai_thanh_toan`): đúng 3 giá trị**
`chua_thanh_toan` · `dang_cho_thanh_toan` · `da_thanh_toan` — **đã bỏ `mien_phi`** (buổi gói 100%/tái lượng giá cùng lịch/voucher 0đ đều quy về `da_thanh_toan`).

> ❌ **ĐÃ CẮT — không còn "Tầng 3" (giai đoạn trong buổi).** Bản thiết kế trước có tầng thứ ba `phien_lam_viec.giai_doan_hien_tai` (`dang_thuc_hien`/`dang_tren_may`/`cho_ktv`) cho cơ chế phục vụ song song có thiết bị (A17c) — **đã cắt khỏi phạm vi 08/08/2026** (xem §4.2 "A17c — đã cắt"). `phien_lam_viec` không còn cột này, cũng không còn `may_bat_dau_luc`/`may_ket_thuc_du_kien`/`thiet_bi_id`. **Nếu thấy code/tài liệu cũ nhắc `dang_tren_may`/`cho_ktv`/"Đưa vào máy" — đó là phần đã bị loại bỏ, không triển khai theo.**
>
> ✅ **`phien_lam_viec` ĐÃ TRIỂN KHAI ĐẦY ĐỦ 08/08/2026** đúng 5 cột thuần queue/no-show còn lại (`lan_thu`, `so_thu_tu_hang_doi`, `thoi_gian_goi_vao`, `so_lan_goi_khong_co_mat`, `thoi_gian_tao`) — tạo dòng lúc check-in, đọc/ghi qua `callInPatient`/`markPatientAbsent`/`pushBackAppointment`. Chi tiết đầy đủ ở §1.2 "Cơ chế Gọi vào / Số thứ tự / Không có mặt".

> **"Hoàn tất" KHÔNG phải trạng thái thứ 8** — tính động, một điều kiện duy nhất: `trang_thai = 'hoan_thanh'` **VÀ** `trang_thai_thanh_toan = 'da_thanh_toan'`. Không lưu cột thứ ba.

**Nguồn cấu hình UI duy nhất:** `frontend/src/components/appointmentStatusConfig.ts` — đã gộp 2 bảng lệch nhau (`statusConfig` 9 giá trị + `getClinicalStatusConfig` 8 giá trị có `cho_kham` không tồn tại trong DB) thành **1 bảng, 7 trạng thái**. Bất kỳ chuỗi nào ngoài 7 giá trị Tầng 1 xuất hiện trong bộ lọc lịch hẹn là lỗi.

### 2.2. Hủy & Hoàn tiền — mô hình 2 trạng thái (thay bảng nhiều nhánh cũ)

**Nguyên tắc gốc: tiền đã vào hệ thống thì không tự động đi ra.** Một câu hỏi duy nhất quyết định mọi nhánh: **lịch này đã thanh toán chưa?**

| | **CHƯA thanh toán** | **ĐÃ thanh toán** |
|---|---|---|
| Khách tự hủy | ✅ Trong **60 phút kể từ lúc đặt** (`thoi_gian_tao`) | ❌ Không có nút hủy |
| Hết cửa sổ | ❌ Khóa hủy → không đến thì tính no-show | — |
| Đổi buổi | Không cần (hủy rồi đặt lại) | ✅ **Không giới hạn số lần, CHỈ Lễ tân đổi** |
| Hoàn tiền | Không có gì để hoàn | ❌ Không hoàn |
| Không đến | Đếm no-show | Mất tiền; gói trả trước thì trừ 1 buổi |

> 🔒 **TOÀN HỆ THỐNG CHỈ CÒN ĐÚNG MỘT ĐƯỜNG HOÀN TIỀN: hủy cả gói liệu trình trả 100%** (xử lý tay tại quầy). Không hoàn tiền tự động cho bất kỳ ca đã thanh toán online nào — chỉ cho đổi lịch.

**Cửa sổ hủy 60 phút = VÀ của BA vế:** còn trong 60 phút từ lúc đặt **VÀ** chưa check-in **VÀ** buổi chưa kết thúc. Xóa **MỀM** (`trang_thai='da_huy'` + `loai_huy='khach_huy_som'`, KHÔNG phạt) — không xóa cứng, vì cần giữ dòng để chặn spam đặt→hủy→đặt lại vô hạn. **Trần 3 lần hủy-sớm/7 ngày.**

`loai_huy` (nullable): `khach_huy_som` (trong cửa sổ, không phạt) · `khach_huy` (Lễ tân hủy giúp) · `phong_kham_huy` (lỗi phòng khám → đổi buổi miễn phí, KHÔNG trừ hạn mức đổi của khách).

**Đổi buổi CHỈ Lễ tân, KHÔNG giới hạn số lần** — cố ý: nếu để khách tự đổi thì phải giới hạn số lần (chặn đẩy lịch vô hạn = hủy mềm trá hình), phát sinh cột đếm; giao Lễ tân thì con người là hạn mức, không cần cột đếm nào. Đổi buổi cho ca ĐÃ check-in phải đưa khách RA KHỎI hàng đợi trong CÙNG một `UPDATE` (đổi buổi + đưa `trang_thai` về `da_xac_nhan`), tránh khoảng hở với thao tác "Gọi vào" đang diễn ra song song — bảo vệ tầng cuối bằng khóa lạc quan: `UPDATE ... WHERE id=X AND trang_thai='da_checkin'`.

### 2.3. Giao dịch PayOS — webhook, idempotency, timeout 15 phút

**Trạng thái `dang_cho_thanh_toan` phát sinh trong đúng 3 tình huống** (điểm chung: mọi giao dịch qua cổng thanh toán, cổng trả kết quả bằng webhook không đồng bộ):
1. Khách bấm "Thanh toán online" trên web.
2. Lễ tân cho khách quét QR tại quầy qua PayOS.
3. Khách bị gắn cờ no-show buộc trả online.

> **KHÔNG phát sinh** khi Lễ tân thu tiền mặt/POS rồi bấm xác nhận — đi thẳng `chua_thanh_toan → da_thanh_toan`.

```
chua_thanh_toan
   │ tạo link PayOS
   ▼
dang_cho_thanh_toan   🔒 KHÓA nút Hủy · KHÓA tạo giao dịch thứ hai
   │
   ├─ webhook thành công ─────────▶ da_thanh_toan
   ├─ webhook thất bại/khách quay lại ─▶ chua_thanh_toan
   └─ quá 15 phút không webhook ──▶ chua_thanh_toan (TỰ ĐẢO — lazy sweep)
```

**Ba lớp bảo vệ:** (1) chặn hủy giữa chừng — hủy đúng lúc webhook đang bay sẽ ra `da_huy + da_thanh_toan` mà hệ thống không có đường hoàn tiền → tiền kẹt; (2) chặn trả 2 lần — khách mở 2 tab; (3) **nói thật với khách** — hiện *"Đang xác nhận thanh toán…"* thay vì báo sai "Chưa thanh toán" khiến khách hoảng và trả trùng.

**Ba nguồn được phép đảo trạng thái, theo độ tin cậy giảm dần:** webhook → tra cứu chủ động khi khách quay về `cancelUrl` (server gọi ngược PayOS tra trạng thái thật, **KHÔNG BAO GIỜ tin `cancelUrl` do client báo** — khách trả xong rồi bấm back trình duyệt mà tin client sẽ khiến hệ thống đảo nhầm về chưa-thanh-toán và khách trả lần 2) → timeout 15 phút lazy-sweep. **Client không nằm trong danh sách nguồn tin cậy.**

**Idempotent bắt buộc:** webhook về muộn SAU KHI đã tự đảo timeout vẫn phải xử lý đúng, không được làm mất tiền đã vào. Với tình huống 3 (khách bị gắn cờ no-show), hết 15 phút không trả → lịch **hủy mềm VÀ trả lại ngân sách phút**.

**Cửa sổ hủy 60 phút KHÔNG reset** khi vào/ra luồng thanh toán — tính cố định từ `thoi_gian_tao`, nếu không sẽ phá tầng chống spam.

**Cài đặt kỹ thuật:** cột `hoa_don.thoi_diem_tao_link_thanh_toan`; middleware `paymentPendingSweep.middleware.ts` theo đúng mẫu lazy-sweep đã dùng cho `packageExpirySweep`/`noShowSweep` (throttle tối đa 1 lần/60s/request qua module-level `lastSweepAt`/`sweepInFlight`, đăng ký global `app.use('/api', ...sweeps, apiRouter)` trong `index.ts`).

### 2.4. Thang chống spam 4 tầng cho lịch chưa thanh toán

> Cửa sổ 60 phút **KHÔNG phải "quyền được hủy"** — nó là ô sửa sai cho người bấm nhầm.

```
Đặt lịch, chọn trả tại quầy → da_xac_nhan + CHƯA THANH TOÁN
  │
  ├─ TẦNG 0 · lúc đặt: tối đa 3 lịch ĐANG HOẠT ĐỘNG cùng lúc (toàn thời gian, KHÔNG theo ngày)
  │
  ├─ TẦNG 1 · cửa sổ 60 phút: hủy = xóa mềm, KHÔNG phạt. Trần 3 lần hủy-sớm/7 ngày.
  │
  ├─ sau 60 phút → NÚT HỦY BIẾN MẤT
  │
  ├─ Đến ngày hẹn: có check-in → bình thường; KHÔNG đến → tự quét cuối buổi (+30 phút buffer) → +1 no-show
  │
  ├─ TẦNG 3 · đủ 2 no-show trong 60 ngày → gắn cờ BUỘC THANH TOÁN ONLINE
  │        (không trả tiền = không có lịch; trả rồi mà không đến = MẤT TIỀN, không đếm no-show tiếp — chống phạt kép)
  │
  └─ TẦNG 4 · sạch 60 ngày không no-show → tự gỡ cờ
```

**Vì sao bắt buộc có Tầng 3:** ba tầng đầu chỉ *làm chậm*, không chặn hẳn — chỉ Tầng 3 đổi bản chất trò chơi từ **miễn phí** sang **tốn tiền thật**.

**Thiệt hại thật của 1 lịch không-đến chưa-thanh-toán:** nó đã tiêu ngân sách phút của ca trong suốt thời gian tồn tại → khách khác bị báo hết chỗ. Mất doanh thu thật dù không mất tiền mặt.

> ❌ **Cố ý KHÔNG bịt:** khách tạo tài khoản mới né cờ — hệ thống đã bắt OTP xác thực email, ma sát đó đủ với quy mô 20–40 lịch/ngày. Chống sâu hơn (đối chiếu SĐT/thiết bị) không tương xứng chi phí.

### 2.5. Quy tắc backend/frontend chung (tham chiếu nhanh — chi tiết ở `docs/ARCHITECTURE_CONVENTIONS.md`)

- Backend: `controllers/` (nhận request, không business logic) → `services/` (logic) → `repositories/` (DB, nơi ném `Error` nghiệp vụ) → `schemas/` (Zod). RBAC khai báo **theo từng endpoint**, cấm catch-all middleware chặn đầu file nếu file có API mà Lễ tân/Chuyên viên/KTV cần đọc.
- Lỗi nghiệp vụ từ service/repository → controller trả `400` kèm message gốc — **cấm** nuốt lỗi thành `500` chung chung.
- Frontend: `features/<actor>/pages|components/{hooks,ui}` — mỗi actor 1 page riêng, route riêng. Logic API/state nằm trong custom hook, component UI chỉ nhận props. UI lặp lại giữa actor → tách Shared Component (không copy-paste).
- `frontend/src/shared/{stores,utils,api}/...` là nợ kỹ thuật đã biết (mồ côi từ 1 lần migrate dở dang) — **luôn dùng bản top-level** (`stores/authStore.ts`, `utils/date.ts`, `api/axios.ts`), không thêm import mới trỏ vào `shared/`.
- **Thay đổi schema CSDL: TUYỆT ĐỐI KHÔNG chạy `prisma migrate dev`** (gây reset dữ liệu). Dùng MCP `postgres` (`pg_manage_schema`) hoặc raw SQL, sau đó `npx prisma generate`.
- Test chạy bằng `npx vitest run`, KHÔNG dùng `npx jest` (lỗi ESM import trên codebase này).

> 🔴 **CẤM dùng `localStorage`/`sessionStorage`/`BroadcastChannel` làm nguồn sự thật hoặc kênh đồng bộ giữa 2 vai trò/2 thiết bị — kể cả cho tín hiệu tưởng chừng vô hại (chuông báo, "đang gọi vào"...).** Hệ thống này **sẽ deploy lên web chính thức**, nơi Lễ tân và Chuyên viên/KTV luôn ngồi **2 máy vật lý khác nhau** — các cơ chế này chỉ hoạt động trong CÙNG một trình duyệt (đúng bằng đúng sai lầm đã mắc và phải vá lại 08/08/2026: `utils/callInSignal.ts` từng dùng `localStorage` + `BroadcastChannel` để báo "Chuyên viên gọi vào" cho Lễ tân, chạy đúng lúc test 4 tab cùng Chrome nhưng sẽ **câm lặng hoàn toàn** khi 2 máy thật). Quy tắc thay thế bắt buộc: **mọi trạng thái cần chia sẻ giữa vai trò PHẢI ghi xuống DB** (bảng đã có sẵn, đừng thêm bảng mới nếu không cần), phía nhận đọc qua **polling/refetch định kỳ đã có sẵn** (`useAppointmentsData.ts` refetch mỗi 8s) — không cần hạ tầng realtime mới. `localStorage` chỉ được phép cho dữ liệu **thuần UI, mất cũng không sao** (nháp form chưa submit...) — xem thêm quy ước ở kế hoạch gốc mục "Quy ước localStorage/sessionStorage", đặc biệt cấm tuyệt đối cho bất kỳ thứ gì liên quan tới **tiền/thanh toán**.

---

## 3. ⚠️ NGUYÊN TẮC THIẾT KẾ GIAO DIỆN (UI/UX)

### 3.1. Bảng màu & chất liệu

- **Cấm tuyệt đối** tím/violet/indigo/magenta hoặc neon tím làm tông chủ đạo — cliché phổ biến nhất của giao diện AI thiếu sáng tạo.
- Palette chuẩn: **Primary Teal `#2EC4B6`** (xanh mòng két, chuẩn y khoa phục hồi) · **Secondary Slate `#0F172A`** (đáng tin cậy, vững chãi) · **Accent Amber/Emerald** (khẩn cấp/thành công).
- **Glassmorphism tươi sáng:** nền mờ mịn + border siêu mảnh (`border-slate-100/80` / `dark:border-zinc-800/60`) + đổ bóng mờ nhẹ. Gradient tinh tế cho thẻ KPI chính/thanh chỉ dẫn quy trình.
- Trạng thái lâm sàng (7 giá trị Tầng 1 ở §2.1) dùng **đúng 1 bảng màu duy nhất trên mọi trang của mọi actor** — nguồn: `appointmentStatusConfig.ts`.

### 3.2. Hình học

- **Cấm bo tròn mặc định `rounded-md`** lặp lại mọi nơi — nhàm chán kiểu template.
- Chọn rõ 1 trong 2 hướng theo ngữ cảnh: **nét sắc sảo 0–2px** (tối giản, kỹ thuật y khoa nghiêm túc) hoặc **bo tròn lớn 16–32px** (Bento Grid thân thiện, nút hành động nổi bật).

### 3.3. Chuyển động & trạng thái tải

- **Spring physics** (`type: "spring", stiffness: 300, damping: 20`), không easing tuyến tính cơ bản.
- **Stagger reveal** cho danh sách (bảng giá, danh sách nhân sự, danh sách ngày) — hiện so le, không đồng loạt.
- **Hover feedback vật lý:** nút/thẻ click được dịch `y: -4` đến `-6` + box-shadow lan tỏa.
- **Cấm spinner tròn giữa màn hình** cho tải dữ liệu dài → **Skeleton Loader** đúng khung component.
- Double confirmation (cảnh báo cam/vàng) khi khách chọn khung giờ cận (<2 tiếng).

### 3.4. Nguyên tắc màn hình vận hành — "1 màn hình dùng chung", không phân mảnh theo actor/ngày

**Bài học rút ra trong phiên tái thiết kế (chốt, áp dụng cho mọi màn hình vận hành mới):**

- Lễ tân và Admin xem cùng một loại dữ liệu (lịch hẹn), qua cùng permission scope backend (`authorizeRoles(2, 4, 5, 6)` cho phần đọc) — **không tạo 2 giao diện khác nhau cho cùng một nhu cầu xem chỉ vì khác actor**. Nếu Admin cần thêm quyền thao tác (đổi nhân sự, xem thống kê sâu hơn), thêm **prop tùy chọn** vào component dùng chung (vd `staffFilterOptions`/`onStaffFilterChange` chỉ Admin truyền), không tách file/component riêng.
- Cùng lý do: **không tạo giao diện khác nhau cho "hôm nay" so với "ngày khác"** nếu bản chất câu hỏi người dùng đặt ra giống nhau (xem danh sách lịch của 1 ngày). Component `TodayFlowBoard.tsx` (`frontend/src/components/appointments/ui/`) dùng CHUNG cho mọi ngày đơn lẻ và cả 2 actor Lễ tân/Admin — mọi tính toán "còn lại theo giờ hiện tại" bên trong nó (vd widget Sức khỏe ca) phải tự nhận biết đang xem hôm nay hay ngày khác (so `selectedDateStr` với ngày thực) để không tính sai khi tái sử dụng cho ngày không phải hôm nay.
- **Không dùng sidebar cố định chặn nội dung chính** nếu nội dung sidebar có thể gộp vào cùng hàng với widget đã có (vd dropdown lọc nhân sự gộp chung hàng với 2 ô "Sức khỏe ca Sáng/Chiều" thay vì làm card riêng trong sidebar phải) — ưu tiên nội dung chính full-width, mọi phần tử phụ trợ phải tự chứng minh nó thật sự cần một khu vực cố định riêng.
- Với các "tổng hợp theo khoảng ngày" (bảng công suất/KPI tuần), chỉ hiển thị các chỉ số **thật sự có ý nghĩa khi gộp theo khoảng thời gian dài** (Hoàn thành, Đã xác nhận/đang chờ, Đã hủy, Không đến) — loại bỏ các trạng thái vận hành trong-ngày (Đã check-in, Đang thực hiện, Chờ tái lượng giá) vì chúng chỉ có ý nghĩa tại một thời điểm, gộp theo tuần sẽ không actionable.

### 3.5. Timeline 1 cột cho Hồ sơ điều trị khách hàng (A18 — kiến trúc đã CHỐT, chưa code)

**Giữ nguyên kiến trúc thông tin hiện có** (`RecordTabs.tsx`) — 3 tab theo loại (Gói liệu trình/Dịch vụ lẻ/Khám lâm sàng) → mỗi tab là **timeline các buổi theo 1 cột dọc**, mỗi buổi tự chứa đầy đủ nội dung của chính nó (`SessionTimelineItem.tsx` render `TreatmentSessionDetailBody.tsx` trực tiếp — KHÔNG phải bảng phẳng + popup rời). Đây chính là "bấm vào lịch sử nào thì hiện nội dung của buổi đó" — **không đập đi xây lại cấu trúc này**.

**Vấn đề thật cần sửa không phải cấu trúc mà là NGÔN NGỮ THỊ GIÁC:**
- 🔴 **Bỏ "Điểm uy tín"** khỏi header khách hàng — đó là công cụ quản trị rủi ro no-show nội bộ, không phải thứ khách cần biết về sự hồi phục của chính họ. Thay 1 ô KPI bằng **"Mức đau đã giảm X%"** (tính từ VAS đầu so với VAS gần nhất).
- ⭐ **Nâng `VasTrendSparkline.tsx` thành "đường hành trình"** — mỗi buổi là 1 mốc trên tuyến ngang, buổi hiện tại nổi bật, buổi tương lai mờ. **CHỈ vẽ cho ĐÚNG MỘT gói liệu trình đang `dang_dieu_tri`** (nhiều gói active thì ưu tiên gói cập nhật gần nhất + nút chuyển gói) — KHÔNG gộp VAS của lượng giá (1 điểm chụp nhanh)/dịch vụ lẻ (từng lần độc lập)/nhiều gói khác nhau thành 1 biểu đồ, vì nối các nguồn khác bản chất là sai lâm sàng.
- Đổi icon ở điểm nhấn tiến độ sang ngôn ngữ vận động (dáng đi, tầm vận động khớp) thay vì check-mark/calendar hành chính — chỉ ở điểm nhấn, không đổi tràn lan.
- Nút **"Đặt lịch buổi tiếp theo"** phải là hành động CHÍNH của mỗi gói đang điều trị, hiện ngay ở trạng thái thu gọn của card gói — khi bị khóa (quy tắc đặt tuần tự) phải nói rõ lý do tại chỗ ("Cần hoàn thành buổi 4 trước"), không chỉ làm mờ nút.
- Tái dùng bắt buộc: `frontend/src/components/TreatmentSessionDetailBody.tsx` (đang phục vụ 6 vị trí ở 3 actor) — **mở rộng** component này (thêm khối "Kỹ thuật đã thực hiện" đọc từ JSONB `du_lieu_tri_lieu.nhat_ky`), không viết lại.

### 3.6. Quy tắc thực thi từ Skill `frontend-design` (Tự động áp dụng cho mọi giao diện mới & sửa lỗi)

> 📌 **Bắt buộc áp dụng:** Skill `.agents/skills/frontend-design/SKILL.md` đã được cài đặt vào hệ thống. Mọi thao tác làm mới (New Component/Page) hoặc sửa lỗi UI (Fix UI) phải tuân thủ nghiêm ngặt các chỉ dẫn sau:

1. **Gắn chặt vào ngữ cảnh sản phẩm (Ground in the Subject):**
   - OfficeCare là sản phẩm **Phục Hồi Chức Năng Y Tế Văn Phòng**. Mọi thiết kế phải toát lên tinh thần y khoa hiện đại, tin cậy, tự tin, không nhầm lẫn với các dashboard quản trị chung chung.
2. **Hero là một luận điểm (Hero as a Thesis):**
   - Mở đầu bằng điểm nhấn đặc trưng nhất của sản phẩm (ví dụ: Thang đau VAS Wong-Baker, Tiến độ phục hồi, Sức khỏe ca trực), không dùng các con số thống kê rải rác kiểu template AI.
3. **Phông chữ mang cá tính (Typography carries Personality):**
   - Đội ngũ Headings dùng **Plus Jakarta Sans** hoặc **Outfit** (weight 700-800, spacing `-0.01em`).
   - Đội ngũ Body dùng **Be Vietnam Pro** hoặc **Inter** (weight 400-600, line-height 1.6).
   - Áp dụng quy tắc mềm hóa font-weight: `.font-black` mềm hóa về `font-weight: 700`.
4. **Tăng tốc phần cứng cho hiệu ứng (Hardware-Accelerated Motion):**
   - Vi hiệu ứng hover/active **CHỈ ĐƯỢC PHÉP** thay đổi `transform` (`translateY(-2px)`, `scale(0.98)`) và `opacity`. CẤM animate `margin`, `padding`, `top`, `left` (gây sụt giảm FPS/layout thrashing).
   - Easing mượt: `transition-all duration-200 ease-out`. Focus ring bàn phím rõ ràng: `focus-visible:ring-2 focus-visible:ring-cyan-500/50`.
5. **Tiết chế & Tự phê bình (Restraint & Self-Critique):**
   - Mỗi màn hình chỉ dành sự nổi bật cho **MỘT yếu tố nhận diện duy nhất** (Signature Element). Mọi thứ xung quanh phải giữ kỷ luật, tinh tế, không lạm dụng hiệu ứng rườm rà.
6. **Tính hợp lý nghiệp vụ UX/UI (Business UX Rationality & Practical Filtering):**
   - Giao diện KHÔNG CHỈ ĐẸP mà BẮT BUỘC PHẢI HỢP LÝ VỚI THỰC TẾ VẬN HÀNH PHÒNG KHÁM PHCN.
   - Mọi nút bấm, ô nhập liệu, thẻ thông tin hay bộ lọc phải qua phân tích sàng lọc chuẩn thực tế (ví dụ: Chuyên viên tập trung ROM/MMT/VAS/Chống chỉ định; Lễ tân tập trung Hàng đợi/Trạng thái thanh toán/Thời gian chờ; Khách hàng tập trung Mức độ cải thiện đau & Đặt lịch tiếp theo).
   - Loại bỏ hoàn toàn các trang trí rườm rà gây nhiễu cho nhân sự khi thao tác trong ca làm việc thực tế.

---

## 4. 📋 TRẠNG THÁI TRIỂN KHAI — ĐÃ LÀM / DANG DỞ / VIỆC TIẾP THEO

> Cập nhật tại thời điểm viết file này (phiên làm việc liên tục kể từ 04/08/2026, hôm nay theo hệ thống là 08/08/2026 — còn **~25 ngày** tới deadline 02/09/2026).

### 4.1. ✅ ĐÃ LÀM XONG

**Nền tảng trạng thái & thanh toán:**
- **A10 — Chuẩn hóa 7 trạng thái lâm sàng:** gộp 2 bảng cấu hình lệch nhau thành 1 (`appointmentStatusConfig.ts`), dọn sạch `chua_xac_nhan`/`cho_xac_nhan`/`giu_cho`/`cho_kham` khỏi toàn bộ backend (`appointment/admin/doctor/technician/receptionist.repository.ts`) và frontend. Bổ sung `cho_tai_luong_gia` vào các nơi kiểm tra "lịch đang hoạt động".
- **A10b — Tách trạng thái thanh toán khỏi trạng thái lâm sàng:** `processPayment` (cả thu quầy lẫn webhook PayOS) giờ ghi đúng `cuoc_hen.trang_thai_thanh_toan` (trước đây cột tồn tại nhưng không ai từng ghi); SELECT đọc thẳng cột thật thay vì suy luận qua hóa đơn liên kết.
- **A10c — Hiển thị 2 badge cạnh nhau:** DetailModal, nút "Thu tiền" nằm ngay cạnh badge trạng thái lâm sàng.
- **A12 — Giới hạn đặt lịch:** `checkCustomerActiveLimit` (3 lịch đang hoạt động, toàn thời gian). Đã xóa hẳn `checkCustomerOverlap`/`checkDoctorOverlap` (kể cả 1 call site sống sót gây lỗi thật "đã có lịch trong khung giờ này" chặn check-in khách thứ 2 trở đi cùng buổi — đã tìm và xóa). Vẫn giữ `checkCustomerHasClinicalExamOnDate` (tối đa 1 buổi Lượng giá/ngày).
- **A13/A14 — Mô hình hủy 60 phút:** thay hẳn gate "≥8 tiếng trước giờ hẹn" cũ. Xem §2.2.
- **A15 — `dang_cho_thanh_toan` + PayOS:** middleware sweep 15 phút, markLinkCreated/revertPending, badge "Đang xác nhận" ở UI. Xem §2.3.
- **A15b/A15c — Phạt hủy gói không hồi tố:** snapshot `ti_le_phat_huy_goi` vào hóa đơn lúc bán, đọc lại đúng số đó lúc hủy (không đổi theo cấu hình hiện hành); `giaThanhToanGoi` lấy thẳng `tong_tien_phai_tra` (đúng cả khi có voucher).
- **B10 — Tự động đánh dấu không đến:** lazy sweep (`noShowSweep.middleware.ts`), điều kiện `da_xac_nhan` + qua giờ nhận khách + đệm 30 phút. Tái dùng nguyên vẹn `updateAppointmentStatus`.
- **B2/B11/B19/B23 (một phần) — Gọi vào / Số thứ tự hàng đợi / Không có mặt (08/08/2026):** đã cài đặt server-side đầy đủ trong `SpecialistFlowBoard.tsx` (Chuyên viên/KTV, dùng chung màn `DoctorAppointments`) + `TodayFlowBoard.tsx` (Lễ tân/Admin) — **KHÔNG chờ A17 tái cấu trúc xong**, cài trực tiếp vào màn hình hiện có. Xem đặc tả đầy đủ ở §1.2. Còn thiếu để B19/B23 trọn vẹn: hiển thị "dự kiến gọi lúc mấy giờ" (B23 phần dự báo thời gian thực), và chưa có màn hình Hàng đợi riêng theo đúng bản mẫu A17 (vẫn đang dùng bảng danh sách, chưa phải sidebar hàng đợi thật).

**Bàn Lượng Giá & Hàng đợi Chuyên viên (A11 / A17 / A17a / B1 — Đã xong 08/08/2026):**
- **A11/A17/A17a — Bàn Lượng Giá Chuyên Viên (`SpecialistAssessmentDesk.tsx` & `ClinicalAssessment/index.tsx`):**
  - **VAS 3 chế độ**: Wong-Baker FACES (6 mặt cười), Mô tả bằng lời, và Slider thang số 0-10.
  - **Chỉ số ROM (Tầm vận động)** & **MMT (Cơ lực 0-5)**: Bảng nhập động cho phép thêm/sửa/xóa linh hoạt từng khớp & nhóm cơ.
  - **Kết luận Lượng giá Chức năng** & **Chống chỉ định Trị liệu**: Tuân thủ chuẩn ranh giới chuyên môn PHCN (§1.3), không ghi chẩn đoán y khoa.
  - **Chỉ định Gói liệu trình**: Gắn gói liệu trình trực tiếp sau khi lượng giá.
  - **2 Nút kết thúc quy trình**:
    - **`[ 🩺 CHUYỂN TUYẾN / HẸN TÁI LƯỢNG GIÁ ]`**: Mở modal nhập hạn quay lại $\rightarrow$ ca chuyển sang `cho_tai_luong_gia` $\rightarrow$ giải phóng Chuyên viên ngay lập tức.
    - **`[ ✅ HOÀN THÀNH LƯỢNG GIÁ ]`**: Modal xác nhận kết thúc ca khám.
- **B1 / B2 / B11 / B19 / B23 — Luồng Hàng Đợi Chuyên Viên (`SpecialistFlowBoard.tsx`):**
  - Hiển thị Số thứ tự hàng đợi (`so_thu_tu_hang_doi`) theo dãy riêng.
  - **Phát tín hiệu Gọi vào (`📞 GỌI VÀO`)**: Thẻ thông báo tĩnh `🔔 Đã phát tín hiệu gọi vào lúc HH:mm` / `🔔 Đã gọi lần 2`.
  - **Thao tác Vắng mặt (`❗ Không vào / Đẩy xuống`)**: Tăng đếm `so_lan_goi_khong_co_mat`, đẩy ca rơi xuống cuối hàng đợi.
  - **Nút `[ 🩺 MỞ BÀN TƯ VẤN ]`**: Modal xác nhận khách đã vào phòng trước khi tạo nhật ký và điều hướng vào Bàn Lượng Giá.

**Màn hình quản lý lịch hẹn (A5 — mảng hoàn thành phiên 08/08/2026):**
- `TodayFlowBoard.tsx` — bảng 1 nhóm theo dòng chảy (Chưa đến/Đang chờ/Đang làm/Xong + Ngoại lệ thu gọn), thay hẳn `AppointmentCalendar` cũ (dạng slot-giờ cố định) cho **MỌI ngày đơn lẻ** (không chỉ "hôm nay" như bản đầu) và **CẢ HAI actor** Lễ tân + Admin dùng chung.
- Widget "Sức khỏe ca Sáng/Chiều" (B21 bản rút gọn) — đã sửa để nhận biết ngày đang xem có phải hôm nay không (tránh tính sai công suất khi xem ngày khác).
- Dropdown lọc theo nhân sự (thay hẳn card `DoctorWorkloadPanel` cũ) — gộp chung hàng với "Sức khỏe ca", chỉ Admin có (Lễ tân xem/lọc được, không có quyền phân bổ/đổi nhân sự cho lịch).
- Đã xóa hẳn sidebar phải chặn nội dung (cả 2 trang Admin/Lễ tân) — nội dung chính full-width. Đã xóa 2 component mồ côi phát sinh: `DoctorWorkloadPanel.tsx`, `PendingPaymentPanel.tsx`.
- Bảng công suất (7 ngày, `CapacityView`) — rút từ 8 thẻ KPI xuống **4 thẻ**: Hoàn thành, Đã xác nhận, Đã hủy, Không đến (bỏ các trạng thái vận hành trong-ngày không có ý nghĩa gộp tuần).
- B15 — Admin đổi nhân sự cho 1 ca: vá 3 điều kiện (status gate ca chưa bắt đầu/đang thực hiện, ngân sách phút, số bàn song song), tự thêm ghi chú "Không thể phân bổ vì..." dưới từng nhân sự bị chặn. Endpoint mới `GET /appointments/staff-budget`.
- Xác nhận trước khi Check-in (`ConfirmDialog`) ở TodayFlowBoard.
- Vá 3 chỗ badge "Sẵn sàng"/"Không khả dụng" coi nhầm nhân sự đang xếp hàng chờ (`da_checkin`) là đang bận — chỉ `dang_kham` mới tính chiếm chỗ thật.

### 4.2. ⚠️ DANG DỞ / CHƯA LÀM — theo mức độ ưu tiên

| Hạng mục | Hiện trạng |
|---|---|
| **A17b — Bàn trị liệu KTV** | Vẫn chỉ có VAS trước/sau + ghi chú tự do. Chưa có Nhật ký thao tác (KTV tự gõ tay tên kỹ thuật đã làm, hoàn toàn thủ công — xem A17c). |
| **A18 — Hồ sơ điều trị khách hàng** | Tái cấu trúc theo Timeline 1 cột + Biểu đồ SparklineVAS giảm đau % (xem §3.5). |
| **B20 / B20b — Công thức ngân sách realtime & Đèn 3 màu tại quầy** | Đèn 3 màu và modal 3 lựa chọn khi đặt lịch tại quầy cận giờ đóng cửa / hết ngân sách. |

> ❌ **A17c — Cơ chế phục vụ song song có thiết bị: ĐÃ CẮT KHỎI PHẠM VI (quyết định 08/08/2026), không phải "chưa làm".** Bản thiết kế trước đây bắt KTV chọn đích danh máy, nhập số phút, hệ thống đếm ngược/tự nhả/chặn gọi khách mới khi máy bận — đã bị hủy bỏ hoàn toàn sau khi khảo sát thực tế vận hành: KTV đang thao tác tay với khách không có tay rảnh để liên tục cập nhật trạng thái từng máy trên app (sẽ tạo dữ liệu giả); phần mềm phòng khám/spa thực tế cũng không làm chi tiết tới mức này; và quan trọng nhất — điểm hội đồng chê #3 (booking khóa cứng slot) đã được giải quyết trọn vẹn bằng mô hình buổi + ngân sách phút (§1.1), không cần thêm cơ chế này. **Thay bằng:** `thiet_bi` chỉ còn bảng CRUD thuần cho Admin (`trang_thai`: `san_sang`/`dang_su_dung`/`dang_bao_tri`/`hong`, tự tay đổi, không hệ thống nào ghi tự động) + `phong_id` (thuần kiểm kê tài sản); KTV mở tối đa 2 bàn song song vẫn giữ (A1b), nhưng do **KTV tự quyết** khi nào rảnh để gọi thêm khách, không do hệ thống phát hiện máy chạy xong. Đã dọn sạch cột `phien_lam_viec.giai_doan_hien_tai`/`may_bat_dau_luc`/`may_ket_thuc_du_kien`/`thiet_bi_id` và `thiet_bi.dang_su_dung_boi`/`ban_den_luc` khỏi cả `schema.prisma` lẫn DB dev thật (đã chạy `ALTER TABLE ... DROP COLUMN` + `prisma generate`, `tsc --noEmit` sạch). **Nếu có yêu cầu/tài liệu cũ nhắc lại cơ chế "Đưa vào máy"/"chọn thiết bị"/`cho_ktv` — đó là phần đã bị loại bỏ có chủ đích, không tự ý triển khai lại; nếu người dùng thật sự muốn làm lại, phải hỏi rõ lý do trước.**

**Còn lại theo nhóm (chưa làm, đúng như kế hoạch gốc):**

| Nhóm | Hạng mục | Ghi chú |
|---|---|---|
| Booking Lớp 2 | **B20/B20b** — công thức `MIN(tan ca, đóng cửa) − thời lượng − đệm`, đèn 3 màu tại quầy, modal 3 lựa chọn | Chỉ mới có 1 cảnh báo cam TĨNH ở `WalkInBookingModal` khi nhân sự tan ca sớm hơn buổi — chưa có công thức đầy đủ, chưa có đèn/modal |
| Hồ sơ khách hàng | **A18** — tái cấu trúc theo Timeline 1 cột (xem §3.5) | Kiến trúc đã CHỐT trong kế hoạch, code chưa động tới |
| Thanh toán online cho khách | **B12** | PayOS đã có sẵn cho Lễ tân, chỉ cần mở rộng endpoint cho vai trò khách hàng |
| Voucher điều kiện | **B13** | Thêm 3 cột `tu_dong_ap_dung`/`kenh_ap_dung`/`loai_goi_ap_dung` vào `khuyen_mai_voucher` |
| Dọn dữ liệu | **C12** — cron dọn triệt để `refresh_tokens`/`otp_codes` | Hiện chỉ có dọn lười (delete-expired-on-write) |
| Cố ý giữ lại | **C9** — nút "Không đến" thủ công của Lễ tân | Giữ song song làm lưới an toàn cạnh sweep tự động (B10), chưa gỡ vì rủi ro nếu sweep có ca biên chưa lường hết — cần hỏi lại trước khi gỡ |
| Chưa chốt | **B24** — Check-in từ xa cho khách đã thanh toán | Đã đặc tả cơ chế đầy đủ trong kế hoạch nhưng **CHƯA CHỐT triển khai** — hỏi lại khi làm tới Phase 3/5, phụ thuộc Hàng đợi + B12 xong trước |

### 4.3. Việc tiếp theo — thứ tự đề xuất

1. **A17b (Bàn trị liệu KTV)** — Nhật ký thao tác kỹ thuật trị liệu (KTV tự gõ các kỹ thuật thực hiện).
2. **A18 (Hồ sơ điều trị khách hàng)** — Timeline 1 cột hiển thị kết quả lượng giá (ROM/MMT) & Biểu đồ SparklineVAS giảm đau %.
3. **B20/B20b đầy đủ** — Công thức thời gian thực + đèn 3 màu cảnh báo khi đặt lịch sát giờ đóng cửa / hết ngân sách.
4. **B12/B13 (Thanh toán online khách + Voucher điều kiện)**.
5. **C12 (Cron dọn dữ liệu hệ thống)**.

**Mốc kiểm tra:** nếu tới ngày 21 (theo lịch trình gốc, tính từ 04/08) chưa xong A17/A18, thứ tự cắt: A17c đã cắt sẵn từ trước nên không còn là lựa chọn dự phòng — chỉ còn **(1) độ tinh chi tiết giao diện** để cắt tiếp nếu cần · **giữ bằng mọi giá** luồng chạy được trọn vẹn (A11, B4–B7) vì đó mới là điều hội đồng chê.

---

## 5. File tham chiếu nhanh khi code chạm các mảng trên

| Mảng | File chính |
|---|---|
| Công thức nghiệp vụ thuần (billing, phạt, hoàn tiền) | `backend/src/domain/billing.ts` (+ test `billing.test.ts`) |
| Ngân sách phút, giờ đóng cửa, buffer no-show | `backend/src/domain/capacity.ts` |
| Trạng thái lịch hẹn dùng chung | `backend/src/domain/appointmentStatus.ts` |
| Nguồn sự thật trạng thái UI | `frontend/src/components/appointmentStatusConfig.ts` |
| Ngân sách/booking/hủy lịch backend | `backend/src/repositories/appointment.repository.ts` |
| Thu tiền/PayOS/sweep thanh toán | `backend/src/repositories/receptionist.repository.ts`, `middlewares/paymentPendingSweep.middleware.ts` |
| Bảng dòng chảy dùng chung Lễ tân+Admin | `frontend/src/components/appointments/ui/TodayFlowBoard.tsx` |
| Hàng đợi Gọi vào/Số thứ tự/Không có mặt (Chuyên viên/KTV) | `frontend/src/features/doctor/components/SpecialistFlowBoard.tsx`, `backend/src/repositories/doctor.repository.ts` (`callInPatient`/`markPatientAbsent`) |
| Đẩy hàng đợi/Không đến thủ công (Lễ tân) | `backend/src/repositories/appointment.repository.ts` (`pushBackAppointment`, carve-out trong `updateAppointmentStatus`), `backend/src/domain/appointmentStatus.ts` |
| Trang quản lý lịch hẹn theo actor | `frontend/src/features/receptionist/pages/ReceptionistAppointments/`, `frontend/src/features/admin/pages/ManageAppointments/` |
| Bàn lượng giá/hàng đợi (CHƯA tái cấu trúc) | `frontend/src/pages/ClinicalAssessment/index.tsx` |
| Hồ sơ điều trị khách hàng (CHƯA tái cấu trúc) | `frontend/src/features/customer/pages/CustomerMedicalRecord/`, tái dùng `frontend/src/components/TreatmentSessionDetailBody.tsx` |
| Đặt lịch công khai | `frontend/src/features/public/components/booking/` |
| Đặt lịch tại quầy | `frontend/src/components/WalkInBookingModal.tsx` |

**MCP dùng khi làm việc trong các mảng trên:** `postgres` (chỉ đọc/kiểm tra dữ liệu dev, KHÔNG chạy migration) · `playwright` (test tay luồng UI phức tạp: đặt lịch, thanh toán, hàng đợi).

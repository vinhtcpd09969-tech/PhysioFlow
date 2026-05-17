# PHYSIOFLOW_CONTEXT.md

> [!IMPORTANT]
> **TÀI LIỆU NÀY BÂY GIỜ CHỈ MANG TÍNH CHẤT THAM KHẢO.**
> Dự án áp dụng triết lý tinh gọn: Làm đến đâu phát triển đến đó. Các quy chuẩn và quy trình trong tệp này sẽ được linh hoạt phát triển tiếp theo nhu cầu thực tế của dự án.

---

## 1. TECH STACK (BẮT BUỘC ÁP DỤNG)

Dự án PhysioFlow gồm hai phần tách biệt hoàn toàn:

### Frontend — Admin Dashboard & Giao diện Khách hàng
| Mục | Công nghệ |
|-----|-----------|
| Framework | **React** (bundler: Vite) |
| Styling | **Tailwind CSS** — utility-first, không dùng CSS modules hay styled-components |
| State Management | **Zustand** — không dùng Redux/Context API cho global state |
| Validation | **Zod** — validate form và response schema |
| HTTP Client | **Axios** — instance tập trung, interceptor cho JWT |
| Routing | React Router v6 |

### Backend — API Server
| Mục | Công nghệ |
|-----|-----------|
| Runtime | **Node.js + TypeScript** |
| Framework | **Express (TypeScript)** — theo pattern MVC (routes → controllers → services → models) |
| Database | **PostgreSQL** (schema V2 — xem Phần 2) |
| DB Driver | **`pg` (node-postgres)** — raw SQL, **KHÔNG dùng ORM** (không Sequelize, không Prisma) |
| Auth | **JWT** — access token (15 phút) + refresh token (7 ngày), lưu refresh token trong DB |
| File Upload | **Multer** — upload ảnh avatar, hình dịch vụ |
| Validation | **Joi** hoặc **Zod** (backend) — validate body trước khi vào controller |

> ⚠️ **Quy tắc cứng:** Mọi truy vấn DB đều là raw SQL qua `pg`. Agent không được tự ý import Sequelize, Prisma, TypeORM hay bất kỳ ORM nào.

### Infrastructure & Deployment
| Mục | Công nghệ |
|-----|-----------|
| Containerization | **Docker** & **Docker Compose** — chạy đồng bộ các dịch vụ (Frontend, Backend, PostgreSQL) |

---

## 2. DATABASE SCHEMA (ERD — PostgreSQL V2)

> Database sử dụng **PostgreSQL**. Schema được tối ưu với CHECK constraints tầng DB, soft delete, BIGINT cho VNĐ, và EXCLUDE USING gist chống trùng lịch.

### Quy ước chung
- Khóa chính: `UUID` (dùng `gen_random_uuid()`) cho các bảng nghiệp vụ; `BIGSERIAL` cho bảng catalog/log.
- Tiền tệ: `BIGINT` (đơn vị: đồng, không số lẻ) — **không dùng DECIMAL/FLOAT**.
- Soft delete: Các bảng `nguoi_dung`, `khach_hang` có cột `deleted_at TIMESTAMP` — truy vấn phải thêm `WHERE deleted_at IS NULL`.
- Enum giả: Dùng `VARCHAR + CHECK constraint` thay vì kiểu `ENUM` của Postgres.

---

### 2.1 AUTH & USERS

**`vai_tro`** — Bảng vai trò (seed-only, không thay đổi runtime) — [V4-4]
```
id              SMALLSERIAL PK
ma_vai_tro      VARCHAR(20)  UNIQUE NOT NULL  -- 'khach_hang' | 'le_tan' | 'ky_thuat_vien' | 'admin'
ten_hien_thi    VARCHAR(50)  NOT NULL
mo_ta_quyen     TEXT
```
> 4 bản ghi được INSERT ngay lúc migration. Không tạo/xóa vai trò tại runtime.

**`nguoi_dung`** — Tài khoản hệ thống (tất cả vai trò)
```
id                  UUID PK
ho_ten              VARCHAR(150) NOT NULL
email               VARCHAR(255) UNIQUE NOT NULL
so_dien_thoai       VARCHAR(20)  UNIQUE
mat_khau_hash       VARCHAR(255) NOT NULL
vai_tro_id          SMALLINT     NOT NULL FK → vai_tro   -- [V4-4] thay cho VARCHAR + CHECK
trang_thai          VARCHAR(20)  CHECK IN ('hoat_dong','tam_khoa','vo_hieu')
avatar_url          TEXT
thoi_gian_tao       TIMESTAMP DEFAULT NOW()
lan_dang_nhap_cuoi  TIMESTAMP
deleted_at          TIMESTAMP   -- Soft delete
```
> **Application layer:** dùng `vai_tro.ma_vai_tro` (join qua `vai_tro_id`) để kiểm tra quyền — giá trị không đổi so với chuỗi cũ. View `v_nguoi_dung_active` đã expose sẵn `ma_vai_tro` và `ten_vai_tro`.

**`khach_hang`** — Hồ sơ khách hàng (1-1 với nguoi_dung)
```
id                       UUID PK
nguoi_dung_id            UUID UNIQUE FK → nguoi_dung
ngay_sinh                DATE
gioi_tinh                VARCHAR(10)  CHECK IN ('nam','nu','khac')
nghe_nghiep              VARCHAR(100)
nghe_nghiep_cu_the       VARCHAR(100) -- Chi tiết để KTV điều chỉnh phác đồ
dia_chi                  TEXT
nguon_gioi_thieu         VARCHAR(100)
hang_khach_hang          VARCHAR(20)  CHECK IN ('thuong','bac','vang','kim_cuong') DEFAULT 'thuong'
preferred_ktv_id         UUID FK → ky_thuat_vien
-- [THU_NGHIEM] Thông tin định danh để đảm bảo cam kết gói thử nghiệm
so_cccd                  VARCHAR(20)
cccd_anh_mat_truoc_url   TEXT        -- URL ảnh mặt trước CCCD (lưu trên storage)
cccd_anh_mat_sau_url     TEXT        -- URL ảnh mặt sau CCCD
cccd_da_xac_minh         BOOLEAN NOT NULL DEFAULT FALSE
thoi_gian_tao            TIMESTAMP
deleted_at               TIMESTAMP   -- Soft delete
```

**`ho_so_y_te`** — Hồ sơ y tế (1-1 với khach_hang)
```
id                          UUID PK
khach_hang_id               UUID UNIQUE FK → khach_hang
tien_su_benh                TEXT
di_ung                      TEXT
thuoc_dang_dung             TEXT
chong_chi_dinh              TEXT
ghi_chu_suc_khoe            TEXT
so_gio_ngoi_may_tinh_per_ngay INT  -- Dành cho dân văn phòng
moi_truong_lam_viec         TEXT
cap_nhat_boi                UUID FK → nguoi_dung
cap_nhat_luc                TIMESTAMP
thoi_gian_tao               TIMESTAMP
```

---

### 2.2 THERAPIST OPERATIONS

**`ky_thuat_vien`** — Hồ sơ kỹ thuật viên (1-1 với nguoi_dung)
```
id                  UUID PK
nguoi_dung_id       UUID UNIQUE FK → nguoi_dung
ma_nhan_vien        VARCHAR(20)  UNIQUE NOT NULL
chuyen_mon_chinh    VARCHAR(200) NOT NULL
so_nam_kinh_nghiem  INT
chung_chi           TEXT
mo_ta_ban_than      TEXT
anh_dai_dien_url    TEXT
trang_thai          VARCHAR(20)  CHECK IN ('hoat_dong','nghi_phep','nghi_viec','tam_nghi')
ngay_vao_lam        DATE
```

**`chuyen_mon_ktv`** — Dịch vụ KTV được chứng nhận thực hiện (M-M: ktv ↔ dich_vu)
```
id                  UUID PK
ky_thuat_vien_id    UUID FK → ky_thuat_vien
dich_vu_id          UUID FK → dich_vu
ngay_cap_nhat       DATE
UNIQUE (ky_thuat_vien_id, dich_vu_id)
```

**`lich_lam_viec_ktv`** — Lịch làm việc định kỳ theo tuần
```
id                  UUID PK
ky_thuat_vien_id    UUID FK → ky_thuat_vien
thu_trong_tuan      VARCHAR(20)  CHECK IN ('thu_2'...'chu_nhat')
gio_bat_dau         TIME NOT NULL
gio_ket_thuc        TIME NOT NULL
trang_thai          VARCHAR(20)  CHECK IN ('hoat_dong','tam_nghi')
```

**`ngay_nghi_ktv`** — Ngày nghỉ đột xuất của KTV
```
id                  UUID PK
ky_thuat_vien_id    UUID FK → ky_thuat_vien
ngay_nghi           DATE NOT NULL
ly_do               VARCHAR(200) CHECK IN ('om','nghi_le','dao_tao','ca_nhan')
ghi_chu             TEXT
duyet_boi           UUID FK → nguoi_dung
UNIQUE (ky_thuat_vien_id, ngay_nghi)
```

---

### 2.3 SERVICE CATALOG

**`danh_muc_dich_vu`** — Danh mục nhóm dịch vụ
```
id              BIGSERIAL PK
ten_danh_muc    VARCHAR(100) UNIQUE NOT NULL
mo_ta           TEXT
thu_tu_hien_thi INT DEFAULT 0
an_hien         BOOLEAN DEFAULT TRUE
```

**`dich_vu`** — Dịch vụ đơn lẻ
```
id                  UUID PK
danh_muc_id         BIGINT FK → danh_muc_dich_vu
ten_dich_vu         VARCHAR(200) NOT NULL
mo_ta_ngan          VARCHAR(500)
mo_ta_chi_tiet      TEXT
thoi_luong_phut     INT NOT NULL
don_gia             BIGINT NOT NULL    -- VNĐ, không số lẻ
hinh_anh_url        TEXT
trang_thai          VARCHAR(20)  CHECK IN ('hoat_dong','tam_nghi','ngung')
thu_tu_hien_thi     INT DEFAULT 0
-- [V4-3] Loại thiết bị bắt buộc để thực hiện dịch vụ này
-- NULL = không yêu cầu thiết bị đặc thù (phòng nào cũng được)
-- VD: 'shockwave', 'tens', 'laser_class4', 'ultrasound'
thiet_bi_yeu_cau    VARCHAR(100)
```

**`phong`** — Phòng trị liệu
```
id                      BIGSERIAL PK
ten_phong               VARCHAR(100) NOT NULL
ma_phong                VARCHAR(20)  UNIQUE NOT NULL
loai_phong              VARCHAR(100)
loai_dich_vu_ho_tro     JSONB   -- Giữ nguyên để tương thích ngược; KHÔNG dùng cho đặt phòng
thiet_bi                JSONB   -- Danh sách thiết bị cố định (không theo dõi trạng thái)
mo_ta                   TEXT
trang_thai              VARCHAR(20)  CHECK IN ('san_sang','dang_dung','bao_tri','vo_hieu')
tang                    VARCHAR(20)
```

**`phong_dich_vu`** — Liên kết phòng ↔ danh mục dịch vụ (chuẩn hóa thay JSONB) — [V4-3]
```
id              BIGSERIAL PK
phong_id        BIGINT FK → phong  (ON DELETE CASCADE)
danh_muc_id     BIGINT FK → danh_muc_dich_vu
UNIQUE (phong_id, danh_muc_id)
```
> **Ghi chú:** Đây là nguồn chân lý cho logic đặt phòng. `phong.loai_dich_vu_ho_tro JSONB` được giữ nguyên để tương thích ngược nhưng **không được dùng** trong truy vấn phân bổ phòng.

---

### 2.4 BOOKING CORE

**`lich_dat`** — Lịch hẹn (trung tâm của hệ thống)
```
id                  UUID PK
ma_lich_dat         VARCHAR(20)  UNIQUE NOT NULL
khach_hang_id       UUID FK → khach_hang
dich_vu_id          UUID FK → dich_vu
ky_thuat_vien_id    UUID FK → ky_thuat_vien  (nullable — chưa chỉ định)
phong_id            BIGINT FK → phong         (nullable)
ngay_gio_bat_dau    TIMESTAMP NOT NULL
ngay_gio_ket_thuc   TIMESTAMP NOT NULL
loai_lich           VARCHAR(30)  CHECK IN ('dich_vu_don','danh_gia','buoi_trong_goi')
trang_thai          VARCHAR(30)  CHECK IN ('cho_xac_nhan','da_xac_nhan','da_checkin','hoan_thanh','da_huy','khong_den')
dang_ky_goi_id      UUID FK → dang_ky_goi    (nullable — nếu là lịch trong gói)
ghi_chu_dat_lich    TEXT
ghi_chu_noi_bo      TEXT
thoi_gian_checkin   TIMESTAMP
thoi_gian_huy       TIMESTAMP
ly_do_huy           TEXT
dat_lai_tu_lich_id  UUID FK → lich_dat        (self-ref — lịch đặt lại)
nguoi_tao           VARCHAR(20)  CHECK IN ('khach_hang','le_tan','admin')
thoi_gian_tao       TIMESTAMP DEFAULT NOW()
```
> **Ràng buộc tầng DB:** `EXCLUDE USING gist` chống trùng khung giờ KTV và Phòng — lịch bị hủy/không đến được loại khỏi constraint.

Indexes: `(ky_thuat_vien_id, ngay_gio_bat_dau)`, `(phong_id, ngay_gio_bat_dau)`, `(khach_hang_id, trang_thai)`, `(ngay_gio_bat_dau)`

---

### 2.5 ASSESSMENT FLOW

**`danh_gia`** — Phiếu đánh giá ban đầu (1-1 với lich_dat loại 'danh_gia')
```
id                      UUID PK
lich_dat_id             UUID UNIQUE FK → lich_dat
khach_hang_id           UUID FK → khach_hang
ky_thuat_vien_id        UUID FK → ky_thuat_vien
ngay_danh_gia           DATE NOT NULL
tong_diem_dau           INT
vung_dau_chinh          VARCHAR(500)
tu_the_tong_quat        VARCHAR(20)  CHECK IN ('tot','trung_binh','kem')
muc_do_linh_hoat        VARCHAR(20)  CHECK IN ('binh_thuong','han_che','rat_han_che')
tom_tat_kham            TEXT
chan_doan_so_bo         TEXT
ai_tom_tat              TEXT   -- [AI-GENERATED] Cần hiển thị nhãn AI trên UI
trang_thai              VARCHAR(20)  CHECK IN ('nhap','hoan_thanh','da_de_xuat')
thoi_gian_hoan_thanh    TIMESTAMP
```

**`ket_qua_danh_gia`** — Chi tiết từng vùng cơ thể trong đánh giá (1 danh_gia → N ket_qua)
```
id              BIGSERIAL PK
danh_gia_id     UUID FK → danh_gia
vung_co_the     VARCHAR(100) NOT NULL
muc_do_dau      INT
loai_dau        VARCHAR(100)
tinh_trang_co   VARCHAR(20)
pham_vi_van_dong VARCHAR(200)
van_de_tu_the   TEXT
hinh_anh_url    TEXT
ghi_chu_ktv     TEXT
```

**`khuyen_nghi`** — Khuyến nghị gói điều trị sau đánh giá (1-1 với danh_gia)
```
id                  UUID PK
danh_gia_id         UUID UNIQUE FK → danh_gia
khach_hang_id       UUID FK → khach_hang
ky_thuat_vien_id    UUID FK → ky_thuat_vien
goi_de_xuat_id      UUID FK → goi_dieu_tri  (gói ưu tiên #1 — shortcut)
so_buoi_de_xuat     INT
tan_suat_de_xuat    VARCHAR(100)
ly_do_de_xuat       TEXT NOT NULL
muc_tieu_dieu_tri   TEXT
trang_thai          VARCHAR(30)  CHECK IN ('cho_quyet_dinh','da_chap_nhan','tu_choi','het_han')
han_quyet_dinh      DATE
thoi_gian_tao       TIMESTAMP
```

**`khuyen_nghi_goi`** — Danh sách tối đa 3 gói được đề xuất trong 1 khuyến nghị
```
id                  BIGSERIAL PK
khuyen_nghi_id      UUID FK → khuyen_nghi (ON DELETE CASCADE)
goi_dieu_tri_id     UUID FK → goi_dieu_tri
thu_tu_uu_tien      INT CHECK BETWEEN 1 AND 3
ghi_chu_lua_chon    VARCHAR(300)
UNIQUE (khuyen_nghi_id, goi_dieu_tri_id)
UNIQUE (khuyen_nghi_id, thu_tu_uu_tien)
```

---

### 2.6 PACKAGE SYSTEM

**`goi_dieu_tri`** — Gói điều trị (catalog)
```
id                      UUID PK
ten_goi                 VARCHAR(200) NOT NULL
ma_goi                  VARCHAR(30)  UNIQUE NOT NULL
mo_ta                   TEXT
tong_so_buoi            INT NOT NULL
gia_goi                 BIGINT NOT NULL   -- Giá bán
gia_goc                 BIGINT            -- Giá gốc (hiển thị gạch ngang)
thoi_gian_su_dung_ngay  INT DEFAULT 90    -- Hạn sử dụng kể từ ngày kích hoạt
hien_thi_website        BOOLEAN DEFAULT TRUE
trang_thai              VARCHAR(20)  CHECK IN ('hoat_dong','ngung_ban','luu_tru')
thoi_gian_tao           TIMESTAMP
```

**`goi_dieu_tri_dich_vu`** — Dịch vụ trong từng gói (M-M: goi ↔ dich_vu)
```
id                  BIGSERIAL PK
goi_dieu_tri_id     UUID FK → goi_dieu_tri
dich_vu_id          UUID FK → dich_vu
so_buoi_phan_bo     INT NOT NULL
ghi_chu             VARCHAR(300)
UNIQUE (goi_dieu_tri_id, dich_vu_id)
```

**`dang_ky_goi`** — Đăng ký gói của khách hàng (instance của goi_dieu_tri)
```
id                  UUID PK
ma_dang_ky          VARCHAR(20)  UNIQUE NOT NULL
khach_hang_id       UUID FK → khach_hang
goi_dieu_tri_id     UUID FK → goi_dieu_tri
khuyen_nghi_id      UUID FK → khuyen_nghi  (nullable — mua tự do không cần khuyen_nghi)
hoa_don_id          UUID FK → hoa_don
ngay_mua            DATE DEFAULT NOW()
ngay_kich_hoat      DATE
ngay_het_han        DATE
tong_buoi           INT NOT NULL
buoi_da_dung        INT DEFAULT 0
buoi_con_lai        INT GENERATED ALWAYS AS (tong_buoi - buoi_da_dung) STORED
trang_thai          VARCHAR(20)  CHECK IN ('cho_kich_hoat','dang_su_dung','hoan_thanh','het_han','da_huy')
ghi_chu             TEXT
kich_hoat_boi       UUID FK → nguoi_dung
kich_hoat_luc       TIMESTAMP
-- [THU_NGHIEM] Luồng cho phép dùng thử trước khi thanh toán
loai_dang_ky        VARCHAR(20)  NOT NULL DEFAULT 'chinh_thuc'
                    CHECK IN ('thu_nghiem', 'chinh_thuc')
buoi_thu_toi_da     INT NOT NULL DEFAULT 3   -- Số buổi được dùng thử tối đa (thường = 3)
han_chot_ngay       DATE                     -- Deadline khách phải quyết định sau khi kết thúc thử
trang_thai_thu      VARCHAR(20)  DEFAULT NULL
                    CHECK IN ('dang_thu', 'da_chot', 'tu_choi', 'qua_han')
```

---

### 2.7 TREATMENT SESSIONS

**`buoi_tri_lieu`** — Buổi trị liệu thực tế (1-1 với lich_dat)
```
id                  UUID PK
lich_dat_id         UUID UNIQUE FK → lich_dat
khach_hang_id       UUID FK → khach_hang
ky_thuat_vien_id    UUID FK → ky_thuat_vien
phong_id            BIGINT FK → phong
dich_vu_id          UUID FK → dich_vu
thoi_gian_bat_dau   TIMESTAMP NOT NULL
thoi_gian_ket_thuc  TIMESTAMP
danh_gia_truoc_buoi INT   -- Điểm đau trước buổi (0-10)
danh_gia_sau_buoi   INT   -- Điểm đau sau buổi (0-10)
danh_gia_hieu_qua   INT   -- KTV chấm hiệu quả (0-10)
so_thu_tu_buoi      INT   -- Buổi thứ mấy trong gói
danh_gia_id         UUID FK → danh_gia  (liên kết về phiếu đánh giá ban đầu)
trang_thai          VARCHAR(20)  CHECK IN ('dang_thuc_hien','hoan_thanh','gian_doan')
canh_bao_dac_biet   TEXT
ai_tom_tat_ngan     VARCHAR(300)  -- [AI-GENERATED] Tóm tắt ≤300 ký tự, cần nhãn AI trên UI
thoi_gian_ghi_chu   TIMESTAMP
```

**`ghi_chu_buoi`** — Ghi chú chi tiết từng buổi (1 buoi → N ghi_chu)
```
id                  UUID PK
buoi_tri_lieu_id    UUID FK → buoi_tri_lieu
loai                VARCHAR(30)  CHECK IN ('ky_thuat','vung_tap_trung','phan_hoi_khach','tien_trinh','ke_hoach_buoi_ke','ai_tom_tat','ghi_chu_khac')
noi_dung            TEXT NOT NULL
vung_co_the         VARCHAR(100)  -- Vùng cơ thể tập trung trong ghi chú này
tao_boi             UUID FK → nguoi_dung
tao_luc             TIMESTAMP DEFAULT NOW()
sua_luc             TIMESTAMP
da_xac_nhan         BOOLEAN DEFAULT FALSE
xac_nhan_luc        TIMESTAMP
```

---

### 2.8 PAYMENT

**`hoa_don`** — Hóa đơn
```
id                      UUID PK
ma_hoa_don              VARCHAR(20)  UNIQUE NOT NULL
khach_hang_id           UUID FK → khach_hang
loai_hoa_don            VARCHAR(20)  CHECK IN ('dich_vu_don','danh_gia','goi_dieu_tri')
lich_dat_id             UUID FK → lich_dat      (nullable)
dang_ky_goi_id          UUID FK → dang_ky_goi   (nullable)
tong_tien_truoc_giam    BIGINT NOT NULL DEFAULT 0
so_tien_giam            BIGINT NOT NULL DEFAULT 0
tong_tien_thanh_toan    BIGINT NOT NULL
da_thanh_toan           BIGINT NOT NULL DEFAULT 0
trang_thai              VARCHAR(30)  CHECK IN ('chua_thanh_toan','thanh_toan_mot_phan','da_thanh_toan','da_hoan_tien')
ghi_chu                 TEXT
ngay_tao                TIMESTAMP DEFAULT NOW()
ngay_thanh_toan         TIMESTAMP
thu_boi                 UUID FK → nguoi_dung
```

**`hoa_don_chi_tiet`** — Dòng chi tiết hóa đơn
```
id          BIGSERIAL PK
hoa_don_id  UUID FK → hoa_don
mo_ta       VARCHAR(300) NOT NULL
don_gia     BIGINT NOT NULL
so_luong    INT DEFAULT 1
thanh_tien  BIGINT NOT NULL
dich_vu_id  UUID FK → dich_vu  (nullable)
```

**`thanh_toan`** — Giao dịch thanh toán (1 hoa_don → N giao dịch, hỗ trợ trả góp)
```
id                  UUID PK
ma_giao_dich        VARCHAR(50)  UNIQUE NOT NULL
hoa_don_id          UUID FK → hoa_don
so_tien             BIGINT NOT NULL
phuong_thuc         VARCHAR(20)  CHECK IN ('tien_mat','chuyen_khoan','the','momo','vnpay','zalopay')
trang_thai          VARCHAR(20)  CHECK IN ('cho_xu_ly','thanh_cong','that_bai','da_hoan_tien')
ma_tham_chieu       VARCHAR(100)  -- Mã từ cổng thanh toán
nguoi_thu_tien_id   UUID FK → nguoi_dung
thoi_gian_giao_dich TIMESTAMP DEFAULT NOW()
ghi_chu             TEXT
```

---

### 2.9 FEEDBACK & NOTIFICATIONS

**`danh_gia_dich_vu`** — Đánh giá của khách sau buổi trị liệu (1-1 với buoi_tri_lieu)
```
id                  UUID PK
buoi_tri_lieu_id    UUID UNIQUE FK → buoi_tri_lieu
khach_hang_id       UUID FK → khach_hang
ky_thuat_vien_id    UUID FK → ky_thuat_vien
so_sao_tong         INT NOT NULL CHECK BETWEEN 1 AND 5
so_sao_ktv          INT CHECK BETWEEN 1 AND 5
nhan_xet            TEXT
hieu_qua_dieu_tri   VARCHAR(30)
se_quay_lai         BOOLEAN
hien_thi_cong_khai  BOOLEAN DEFAULT FALSE
thoi_gian_danh_gia  TIMESTAMP DEFAULT NOW()
```

**`thong_bao`** — Thông báo tự động gửi cho khách
```
id              UUID PK
khach_hang_id   UUID FK → khach_hang
lich_dat_id     UUID FK → lich_dat  (nullable)
kenh            VARCHAR(20)  CHECK IN ('zalo','sms','email')
loai            VARCHAR(40)  CHECK IN ('xac_nhan_dat_lich','nhac_lich_24h','nhac_lich_2h','link_danh_gia','canh_bao_het_goi','canh_bao_het_han','hoa_don','marketing')
noi_dung        TEXT NOT NULL
link_hanh_dong  TEXT
trang_thai      VARCHAR(20)  CHECK IN ('cho_gui','da_gui','that_bai','da_doc')
gui_luc         TIMESTAMP
thoi_gian_tao   TIMESTAMP DEFAULT NOW()
```

---

### 2.10 AUDIT LOG

**`audit_log`** — Nhật ký hành động quan trọng
```
id              BIGSERIAL PK
nguoi_th_id     UUID FK → nguoi_dung
bang            VARCHAR(100) NOT NULL
ban_ghi_id      UUID
hanh_dong       VARCHAR(30)  CHECK IN ('tao','sua','xoa','huy_lich','doi_lich','kich_hoat_goi','hoan_tien','override_ai')
gia_tri_cu      JSONB
gia_tri_moi     JSONB
dia_chi_ip      INET
thuc_hien_luc   TIMESTAMP DEFAULT NOW()
```

---

### 2.11 VIEWS (Dùng sẵn, không cần tạo lại)

| View | Mục đích |
|------|----------|
| `v_phong_san_sang_theo_dich_vu` | Danh sách phòng hỗ trợ dịch vụ, có thiết bị đáp ứng yêu cầu; dùng làm template cho truy vấn phòng trống khi đặt lịch |
| `v_tien_trinh_hoi_phuc` | Đường cong hồi phục: điểm đau trước/sau qua các buổi |
| `v_goi_dang_ky_tom_tat` | Tóm tắt gói đăng ký kèm số buổi còn lại, ngày hết hạn |
| `v_nguoi_dung_active` | `nguoi_dung` lọc `deleted_at IS NULL`, join sẵn `vai_tro` → expose `ma_vai_tro`, `ten_vai_tro` |
| `v_khach_hang_active` | `khach_hang` lọc sẵn, join `nguoi_dung` kiểm tra soft delete cả hai |

> Agent nên ưu tiên dùng views này thay vì viết lại điều kiện lọc.

---

## 3. BUSINESS RULES & GIỚI HẠN PHẠM VI

### 3.1 Luồng cốt lõi CẦN TRIỂN KHAI

```
Đặt lịch → Check-in (ghi nhận CCCD) → Đánh giá (lần đầu) → Khuyến nghị gói
    → [Luồng thử nghiệm] Dùng thử 1-3 buổi → Quyết định chốt/từ chối
    → [Luồng chính thức] Khách chấp nhận → Thanh toán → Kích hoạt gói
    → Đặt lịch buổi trong gói → Thực hiện → Ghi chú → Feedback
```

### 3.2 Quy tắc nghiệp vụ bắt buộc

**Đặt lịch:**
- Một KTV không thể có 2 lịch trùng khung giờ — constraint đã ở tầng DB (`no_overlap_ktv`).
- Một Phòng không thể có 2 lịch trùng khung giờ — constraint đã ở tầng DB (`no_overlap_phong`).
- Backend PHẢI bắt lỗi `ExclusionConstraintViolation` từ Postgres và trả về HTTP 409 với message rõ ràng.
- KTV chỉ được nhận lịch nếu `trang_thai = 'hoat_dong'` và không nằm trong `ngay_nghi_ktv`.
- KTV chỉ được nhận lịch dịch vụ nếu có bản ghi trong `chuyen_mon_ktv` tương ứng.
- **[V4-3] Phân bổ phòng:** Khi tìm phòng trống cho một dịch vụ, PHẢI dùng `phong_dich_vu` (không dùng `phong.loai_dich_vu_ho_tro JSONB`). Nếu `dich_vu.thiet_bi_yeu_cau IS NOT NULL`, chỉ chọn phòng có thiết bị khớp trong `thiet_bi_y_te` với `trang_thai = 'san_sang'`. Dùng view `v_phong_san_sang_theo_dich_vu` làm template truy vấn.

**Gói điều trị:**
- `buoi_con_lai` là cột GENERATED — không bao giờ UPDATE trực tiếp; chỉ UPDATE `buoi_da_dung`.
- Mỗi lần hoàn thành buổi trị liệu: `UPDATE dang_ky_goi SET buoi_da_dung = buoi_da_dung + 1`.
- Gói hết hạn khi `ngay_het_han < CURRENT_DATE` hoặc `buoi_con_lai = 0` → `trang_thai = 'het_han'` hoặc `'hoan_thanh'`.
- Gói chỉ kích hoạt (`ngay_kich_hoat`) khi hóa đơn được thanh toán đủ.

**Luồng gói thử nghiệm (`loai_dang_ky = 'thu_nghiem'`):**
> ⚠️ Chỉ áp dụng cho `dang_ky_goi` (gói combo nhiều buổi). Dịch vụ lẻ (`lich_dat.loai_lich = 'dich_vu_don'`) **không có luồng thử nghiệm** — phải thanh toán trước hoặc ngay sau buổi như bình thường.

- Tạo `dang_ky_goi` với `loai_dang_ky = 'thu_nghiem'`, `trang_thai = 'cho_kich_hoat'`, `trang_thai_thu = 'dang_thu'`. Chưa cần `hoa_don_id`.
- Check-in buổi 1: lễ tân ghi nhận thông tin CCCD vào `khach_hang` (`so_cccd`, `cccd_anh_mat_truoc_url`, `cccd_anh_mat_sau_url`, `cccd_da_xac_minh = TRUE`). Khách ký cam kết thanh toán (lưu file vào storage).
- Hệ thống cho phép đặt lịch và thực hiện tối đa `buoi_thu_toi_da` buổi mà không cần thanh toán.
- Sau buổi cuối cùng trong gói thử: tự động tạo `hoa_don` và bắn `thong_bao` (kênh Zalo/SMS, loại `canh_bao_het_goi`) kèm deadline = `han_chot_ngay`.
- Nếu khách chấp nhận (`trang_thai_thu → 'da_chot'`): tạo thanh toán full gói → khi `da_thanh_toan >= tong_tien_thanh_toan` thì kích hoạt gói, `loai_dang_ky → 'chinh_thuc'`.
- Nếu khách từ chối (`trang_thai_thu → 'tu_choi'`): chuyển hóa đơn sang tính phí lẻ `buoi_da_dung` buổi theo `dich_vu.don_gia`.
- Nếu quá `han_chot_ngay` mà chưa phản hồi (`trang_thai_thu → 'qua_han'`): tương tự từ chối — tính phí lẻ, block đặt lịch mới cho đến khi thanh toán xong.
- Khách có `trang_thai_thu = 'qua_han'` hoặc `'tu_choi'` và `hoa_don.trang_thai != 'da_thanh_toan'`: không được tạo lịch mới (kể cả lịch dịch vụ lẻ).
- Thông tin CCCD (`so_cccd`, ảnh) **không được xóa** kể cả sau khi khách đã thanh toán — dùng cho lịch sử hồ sơ.

**Soft delete:**
- Không bao giờ `DELETE` từ `nguoi_dung` hay `khach_hang` — chỉ `SET deleted_at = NOW()`.
- Mọi query lấy danh sách người dùng/khách hàng phải lọc `WHERE deleted_at IS NULL`, hoặc dùng views `v_nguoi_dung_active` / `v_khach_hang_active`.

**Thanh toán:**
- 1 hóa đơn có thể có nhiều giao dịch `thanh_toan` (trả nhiều lần).
- `hoa_don.da_thanh_toan = SUM(thanh_toan.so_tien WHERE trang_thai = 'thanh_cong')`.
- Chỉ chuyển `trang_thai` hóa đơn sang `'da_thanh_toan'` khi `da_thanh_toan >= tong_tien_thanh_toan`.

**AI-generated content:**
- Các trường `ai_tom_tat` (danh_gia) và `ai_tom_tat_ngan` (buoi_tri_lieu) do AI sinh ra.
- UI **bắt buộc** hiển thị nhãn/badge "✦ AI" cạnh nội dung này.
- Người dùng (KTV/Admin) có thể override — hành động này phải được ghi vào `audit_log` với `hanh_dong = 'override_ai'`.

---

### 3.3 KHÔNG TRIỂN KHAI (ngoài phạm vi dự án)

> Những tính năng dưới đây **không có trong schema và không cần code**. Nếu yêu cầu xuất hiện, từ chối và ghi chú vào backlog.

- ❌ Hệ thống thẻ hội viên / điểm thưởng tích lũy (loyalty points)
- ❌ Module quản lý kho vật tư / thiết bị
- ❌ Tích hợp HIS (Hospital Information System)
- ❌ Đa chi nhánh / multi-tenant (schema hiện tại là single-clinic)
- ❌ Telemedicine / tư vấn online
- ❌ Module lương/hoa hồng KTV (chỉ có audit, không có payroll)
- ❌ Đặt lịch nhóm / lịch theo ca nhiều KTV cùng lúc
- ❌ Cổng thanh toán tự động (tích hợp MoMo/VNPay callback) — chỉ ghi nhận thủ công

---

### 3.4 Phân quyền (Role-Based Access)

> **[V4-4]** Vai trò được lưu trong bảng `vai_tro` và liên kết qua `nguoi_dung.vai_tro_id`. Khi kiểm tra quyền trong code, join lấy `vai_tro.ma_vai_tro` — giá trị không đổi so với chuỗi cũ.

| `ma_vai_tro` | Tên hiển thị | Quyền hạn chính |
|---|---|---|
| `khach_hang` | Khách hàng | Xem lịch của mình, đặt lịch, xem gói, gửi feedback |
| `le_tan` | Lễ tân | Quản lý lịch hẹn, check-in, tạo hóa đơn, thu tiền |
| `ky_thuat_vien` | Kỹ thuật viên | Xem lịch của mình, tạo đánh giá, ghi chú buổi, đề xuất gói |
| `admin` | Quản trị viên | Toàn quyền: quản lý người dùng, dịch vụ, gói, báo cáo |

> **Lưu ý `nguoi_tao` trong `lich_dat`:** Cột này là audit label (`VARCHAR + CHECK`), KHÔNG phải FK vào `vai_tro` — giữ nguyên thiết kế cũ.

---

### 3.5 Naming Convention (Backend)

- **Files:** `kebab-case` — `booking.controller.js`, `dang-ky-goi.service.js`
- **Functions:** `camelCase` — `getKhachHangById`, `createLichDat`
- **DB columns:** snake_case tiếng Việt — giữ nguyên tên trong schema, không đổi sang English
- **API routes:** `/api/v1/lich-dat`, `/api/v1/khach-hang/:id/ho-so-y-te`
- **HTTP:** GET (lấy), POST (tạo mới), PATCH (cập nhật một phần), PUT (thay toàn bộ), DELETE (xóa — soft delete)

---

*Cập nhật lần cuối: Bổ sung [V4-4] — tách bảng `vai_tro`, `nguoi_dung.vai_tro_id` FK, cập nhật view `v_nguoi_dung_active` join sẵn vai trò, ghi chú phân biệt `nguoi_tao` (audit label) vs `vai_tro_id` (FK)*

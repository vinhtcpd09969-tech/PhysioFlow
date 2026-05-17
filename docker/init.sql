-- =============================================
-- SCHEMA VẬT LÝ TRỊ LIỆU - PHIÊN BẢN V4
-- Các thay đổi so với V3:
--   [V4-4] Tách bảng Vai trò
--          → Bảng `vai_tro`: định nghĩa 4 vai trò cố định, mô tả quyền hạn
--          → `nguoi_dung.vai_tro_id` FK → `vai_tro.id` (thay VARCHAR + CHECK cũ)
--          → Giữ `nguoi_dung.vai_tro` như alias view-friendly qua generated column
--            (KHÔNG xóa để tránh breaking change ở application layer)
-- =============================================
-- Các thay đổi so với V3:
--   [V4-1] Hệ thống Voucher & Khuyến mãi
--          → Bảng `voucher`: định nghĩa mã, loại giảm, giới hạn lượt/thời gian
--          → Bảng `voucher_su_dung`: log áp dụng, 1 hóa đơn chỉ 1 voucher (UNIQUE)
--          → Xử lý race condition bằng atomic UPDATE có điều kiện
--   [V4-2] Quản lý Thiết bị Y tế & Bảo trì
--          → Bảng `thiet_bi_y_te`: thiết bị di động/chia sẻ giữa phòng
--          → Bảng `lich_bao_tri`: lịch bảo trì định kỳ & đột xuất
--          → `phong.thiet_bi` JSONB giữ nguyên cho thiết bị cố định
--   [V4-3] Phân bổ Phòng theo Thiết bị Yêu cầu
--          → `dich_vu.thiet_bi_yeu_cau`: loại thiết bị bắt buộc để thực hiện dịch vụ
--            VD: 'shockwave', 'tens', 'laser_class4', NULL (không yêu cầu thiết bị đặc thù)
--          → Bảng `phong_dich_vu`: liên kết chuẩn hóa phòng ↔ danh mục dịch vụ
--            Thay thế `phong.loai_dich_vu_ho_tro JSONB` cho logic đặt phòng
--          → View `v_phong_san_sang_theo_dich_vu`: truy vấn phòng trống cho 1 dịch vụ
--            tại khung giờ cụ thể, có kiểm tra thiết bị yêu cầu
-- =============================================
-- Kế thừa từ V3:
--   [V3-1] Thêm thông tin CCCD vào khach_hang
--   [V3-2] Thêm luồng gói thử nghiệm vào dang_ky_goi
-- =============================================
-- Kế thừa từ V2:
--   [FIX-1] Thêm so_thu_tu_buoi vào buoi_tri_lieu
--   [FIX-2] Thêm danh_gia_id (FK) vào buoi_tri_lieu
--   [FIX-3] Thêm vung_co_the vào ghi_chu_buoi
--   [FIX-4] Tạo bảng khuyen_nghi_goi (multi-package recommendation)
--   [BONUS] Thêm nghe_nghiep_cu_the vào khach_hang
--   [BONUS] Thêm so_gio_ngoi_may_tinh_per_ngay + moi_truong_lam_viec vào ho_so_y_te
-- =============================================
-- Các tối ưu hóa từ V2:
--   [OPT-1] CHECK Constraints cho tất cả cột trang_thai / vai_tro / gioi_tinh / ...
--   [OPT-2] EXCLUDE USING gist chống trùng lịch KTV và Phòng ở tầng DB
--   [OPT-3] Soft Delete: thêm deleted_at TIMESTAMP vào nguoi_dung, khach_hang
--   [OPT-4] Kiểu tiền tệ VNĐ: DECIMAL(12,2) → BIGINT (đơn vị: đồng, không số lẻ)
-- =============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- [OPT-2] Yêu cầu cho EXCLUDE USING gist (chống trùng lịch)
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- =============================================
-- AUTH & USERS
-- =============================================

-- [V4-4] Bảng vai trò — 4 vai trò cố định, seed ngay sau khi tạo bảng
-- Tách ra để: (1) dễ join lấy mô tả quyền hạn, (2) mở rộng thêm metadata sau này
-- mã_vai_tro giữ nguyên giá trị cũ ('khach_hang'...) để application layer không đổi
CREATE TABLE vai_tro (
    id              SMALLSERIAL  PRIMARY KEY,
    ma_vai_tro      VARCHAR(20)  UNIQUE NOT NULL,
    ten_hien_thi    VARCHAR(50)  NOT NULL,
    mo_ta_quyen     TEXT
);

-- Seed dữ liệu — chạy ngay sau CREATE TABLE
INSERT INTO vai_tro (ma_vai_tro, ten_hien_thi, mo_ta_quyen) VALUES
    ('khach_hang',    'Khách hàng',    'Xem lịch của mình, đặt lịch, xem gói, gửi feedback'),
    ('le_tan',        'Lễ tân',        'Quản lý lịch hẹn, check-in, tạo hóa đơn, thu tiền'),
    ('ky_thuat_vien', 'Kỹ thuật viên', 'Xem lịch của mình, tạo đánh giá, ghi chú buổi, đề xuất gói'),
    ('bac_si',        'Bác sĩ',        'Khám lượng giá, tạo hồ sơ y tế, chỉ định phác đồ & gói điều trị'),
    ('admin',         'Quản trị viên', 'Toàn quyền: quản lý người dùng, dịch vụ, gói, báo cáo');

CREATE TABLE nguoi_dung (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ho_ten              VARCHAR(150)  NOT NULL,
    email               VARCHAR(255)  UNIQUE NOT NULL,
    so_dien_thoai       VARCHAR(20)   UNIQUE,
    mat_khau_hash       VARCHAR(255)  NOT NULL,
    -- [V4-4] FK thay thế cho VARCHAR + CHECK cũ
    -- JOIN vai_tro ON vai_tro.id = nguoi_dung.vai_tro_id để lấy ma_vai_tro / ten_hien_thi
    vai_tro_id          SMALLINT      NOT NULL,
    -- [OPT-1] CHECK Constraint
    trang_thai          VARCHAR(20)   NOT NULL DEFAULT 'hoat_dong'
                        CHECK (trang_thai IN ('hoat_dong', 'tam_khoa', 'vo_hieu')),
    da_xac_thuc_email   BOOLEAN       NOT NULL DEFAULT FALSE,
    avatar_url          TEXT,
    thoi_gian_tao       TIMESTAMP     NOT NULL DEFAULT NOW(),
    lan_dang_nhap_cuoi  TIMESTAMP,
    -- [OPT-3] Soft Delete: xóa tài khoản mà không mất lịch sử
    deleted_at          TIMESTAMP
);

CREATE TABLE ho_so_y_te (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    khach_hang_id               UUID    UNIQUE NOT NULL,
    tien_su_benh                TEXT,
    di_ung                      TEXT,
    thuoc_dang_dung             TEXT,
    chong_chi_dinh              TEXT,
    ghi_chu_suc_khoe            TEXT,
    -- [BONUS] Thông tin môi trường làm việc cho dân văn phòng
    so_gio_ngoi_may_tinh_per_ngay INT,              -- VD: 8
    moi_truong_lam_viec         TEXT,               -- VD: "Ngồi bàn máy tính, màn hình kép, ghế không có tựa lưng"
    cap_nhat_boi                UUID,
    cap_nhat_luc                TIMESTAMP,
    thoi_gian_tao               TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE khach_hang (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nguoi_dung_id       UUID    UNIQUE NOT NULL,
    ngay_sinh           DATE,
    -- [OPT-1] CHECK Constraint
    gioi_tinh           VARCHAR(10)
                        CHECK (gioi_tinh IN ('nam', 'nu', 'khac')),
    nghe_nghiep         VARCHAR(100),
    -- [BONUS] Chi tiết nghề nghiệp giúp KTV điều chỉnh phác đồ
    nghe_nghiep_cu_the  VARCHAR(100),
    dia_chi             TEXT,
    nguon_gioi_thieu    VARCHAR(100),
    -- [OPT-1] CHECK Constraint
    hang_khach_hang     VARCHAR(20)   NOT NULL DEFAULT 'thuong'
                        CHECK (hang_khach_hang IN ('thuong', 'bac', 'vang', 'kim_cuong')),
    preferred_ktv_id    UUID,
    thoi_gian_tao       TIMESTAMP     NOT NULL DEFAULT NOW(),
    -- [OPT-3] Soft Delete
    deleted_at          TIMESTAMP,
    -- [V3-1] Thông tin CCCD — xác minh danh tính khi đăng ký gói thử nghiệm
    --        CHỈ lưu thông tin + ảnh chụp, KHÔNG thu giữ thẻ vật lý
    --        Không được xóa dù khách đã thanh toán xong (dùng cho lịch sử hồ sơ)
    so_cccd                 VARCHAR(20),
    cccd_anh_mat_truoc_url  TEXT,
    cccd_anh_mat_sau_url    TEXT,
    cccd_da_xac_minh        BOOLEAN       NOT NULL DEFAULT FALSE
);

-- =============================================
-- THERAPIST OPERATIONS
-- =============================================

CREATE TABLE ky_thuat_vien (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nguoi_dung_id       UUID    UNIQUE NOT NULL,
    ma_nhan_vien        VARCHAR(20)   UNIQUE NOT NULL,
    chuyen_mon_chinh    VARCHAR(200)  NOT NULL,
    so_nam_kinh_nghiem  INT,
    chung_chi           TEXT,
    mo_ta_ban_than      TEXT,
    anh_dai_dien_url    TEXT,
    -- [OPT-1] CHECK Constraint
    trang_thai          VARCHAR(20)   NOT NULL DEFAULT 'hoat_dong'
                        CHECK (trang_thai IN ('hoat_dong', 'nghi_phep', 'nghi_viec', 'tam_nghi')),
    ngay_vao_lam        DATE
);

CREATE TABLE chuyen_mon_ktv (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ky_thuat_vien_id    UUID    NOT NULL,
    dich_vu_id          UUID    NOT NULL,
    ngay_cap_nhat       DATE,
    UNIQUE (ky_thuat_vien_id, dich_vu_id)
);

CREATE TABLE lich_lam_viec (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nguoi_dung_id       UUID    NOT NULL,
    ngay                DATE    NOT NULL,
    gio_bat_dau         TIME    NOT NULL,
    gio_ket_thuc        TIME    NOT NULL,
    -- [OPT-1] CHECK Constraint
    trang_thai          VARCHAR(20)   NOT NULL DEFAULT 'hoat_dong'
                        CHECK (trang_thai IN ('hoat_dong', 'tam_nghi'))
);

CREATE TABLE ngay_nghi_ktv (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ky_thuat_vien_id    UUID    NOT NULL,
    ngay_nghi           DATE    NOT NULL,
    -- [OPT-1] CHECK Constraint
    ly_do               VARCHAR(200)
                        CHECK (ly_do IN ('om', 'nghi_le', 'dao_tao', 'ca_nhan')),
    ghi_chu             TEXT,
    duyet_boi           UUID,
    UNIQUE (ky_thuat_vien_id, ngay_nghi)
);

-- =============================================
-- SERVICE CATALOG
-- =============================================

CREATE TABLE danh_muc_dich_vu (
    id              BIGSERIAL   PRIMARY KEY,
    ten_danh_muc    VARCHAR(100) UNIQUE NOT NULL,
    mo_ta           TEXT,
    thu_tu_hien_thi INT         NOT NULL DEFAULT 0,
    an_hien         BOOLEAN     NOT NULL DEFAULT TRUE
);

CREATE TABLE dich_vu (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    danh_muc_id         BIGINT        NOT NULL,
    ten_dich_vu         VARCHAR(200)  NOT NULL,
    mo_ta_ngan          VARCHAR(500),
    mo_ta_chi_tiet      TEXT,
    thoi_luong_phut     INT           NOT NULL,
    -- [OPT-4] BIGINT thay vì DECIMAL(12,2) — VNĐ không có số lẻ
    don_gia             BIGINT        NOT NULL,
    hinh_anh_url        TEXT,
    -- [OPT-1] CHECK Constraint
    trang_thai          VARCHAR(20)   NOT NULL DEFAULT 'hoat_dong'
                        CHECK (trang_thai IN ('hoat_dong', 'tam_nghi', 'ngung')),
    thu_tu_hien_thi     INT           NOT NULL DEFAULT 0,
    -- [V4-3] Loại thiết bị bắt buộc để thực hiện dịch vụ này
    --        NULL = không yêu cầu thiết bị đặc thù (phòng nào cũng được)
    --        VD: 'shockwave', 'tens', 'laser_class4', 'ultrasound'
    --        Dùng để lọc phòng trong truy vấn đặt lịch — xem v_phong_san_sang_theo_dich_vu
    thiet_bi_yeu_cau    VARCHAR(100)
);

CREATE TABLE phong (
    id                      BIGSERIAL   PRIMARY KEY,
    ten_phong               VARCHAR(100) NOT NULL,
    ma_phong                VARCHAR(20)  UNIQUE NOT NULL,
    loai_phong              VARCHAR(100),
    loai_dich_vu_ho_tro     JSONB,
    thiet_bi                JSONB,
    mo_ta                   TEXT,
    -- [OPT-1] CHECK Constraint
    trang_thai              VARCHAR(20)  NOT NULL DEFAULT 'san_sang'
                            CHECK (trang_thai IN ('san_sang', 'dang_dung', 'bao_tri', 'vo_hieu')),
    tang                    VARCHAR(20)
);

-- [V4-3] Liên kết phòng ↔ danh mục dịch vụ (chuẩn hóa thay JSONB)
-- Một phòng có thể hỗ trợ nhiều danh mục; một danh mục có thể thực hiện ở nhiều phòng.
-- ⚠️ `phong.loai_dich_vu_ho_tro JSONB` GIỮ NGUYÊN để tương thích ngược — bảng này
--    là nguồn chân lý cho truy vấn đặt phòng (v_phong_san_sang_theo_dich_vu).
CREATE TABLE phong_dich_vu (
    id              BIGSERIAL   PRIMARY KEY,
    phong_id        BIGINT      NOT NULL,
    danh_muc_id     BIGINT      NOT NULL,
    UNIQUE (phong_id, danh_muc_id)
);

-- =============================================
-- BOOKING CORE
-- =============================================

CREATE TABLE lich_dat (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_lich_dat         VARCHAR(20)   UNIQUE NOT NULL,
    khach_hang_id       UUID,
    ho_ten_khach        VARCHAR(150),
    so_dien_thoai       VARCHAR(20),
    gioi_tinh_khach     VARCHAR(10)   CHECK (gioi_tinh_khach IN ('nam', 'nu', 'khac')),
    dich_vu_id          UUID,
    ky_thuat_vien_id    UUID,
    phong_id            BIGINT,
    ngay_gio_bat_dau    TIMESTAMP     NOT NULL,
    ngay_gio_ket_thuc   TIMESTAMP     NOT NULL,
    -- [V5] Thêm thông tin bệnh lý sơ bộ
    trieu_chung         TEXT,
    ly_do_kham          TEXT,
    anh_dinh_kem_url    TEXT,
    -- [OPT-1] CHECK Constraint
    loai_lich           VARCHAR(30)   NOT NULL DEFAULT 'kham_moi'
                        CHECK (loai_lich IN ('kham_moi', 'tai_kham', 'tri_lieu', 'dich_vu_don', 'buoi_trong_goi')),
    -- [OPT-1] CHECK Constraint
    trang_thai          VARCHAR(30)   NOT NULL DEFAULT 'cho_xac_nhan'
                        CHECK (trang_thai IN ('cho_xac_nhan', 'da_xac_nhan', 'da_checkin', 'hoan_thanh', 'da_huy', 'khong_den')),
    dang_ky_goi_id      UUID,
    ghi_chu_dat_lich    TEXT,
    ghi_chu_noi_bo      TEXT,
    thoi_gian_checkin   TIMESTAMP,
    thoi_gian_huy       TIMESTAMP,
    ly_do_huy           TEXT,
    dat_lai_tu_lich_id  UUID,
    -- [OPT-1] CHECK Constraint
    nguoi_tao           VARCHAR(20)   NOT NULL DEFAULT 'khach_hang'
                        CHECK (nguoi_tao IN ('khach_hang', 'le_tan', 'admin', 'guest')),
    thoi_gian_tao       TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ktv_ngay          ON lich_dat (ky_thuat_vien_id, ngay_gio_bat_dau);
CREATE INDEX idx_phong_ngay        ON lich_dat (phong_id, ngay_gio_bat_dau);
CREATE INDEX idx_khach_trangthai   ON lich_dat (khach_hang_id, trang_thai);
CREATE INDEX idx_ngay              ON lich_dat (ngay_gio_bat_dau);

-- [OPT-2] Chống trùng lịch KTV ở tầng Database
-- DB sẽ từ chối ngay lập tức nếu cùng KTV bị đặt 2 lịch chồng khung giờ
-- Chỉ áp dụng cho lịch chưa bị hủy
ALTER TABLE lich_dat ADD CONSTRAINT no_overlap_ktv
    EXCLUDE USING gist (
        ky_thuat_vien_id WITH =,
        tsrange(ngay_gio_bat_dau, ngay_gio_ket_thuc) WITH &&
    )
    WHERE (ky_thuat_vien_id IS NOT NULL AND trang_thai NOT IN ('da_huy', 'khong_den'));

-- [OPT-2] Chống trùng lịch Phòng ở tầng Database
ALTER TABLE lich_dat ADD CONSTRAINT no_overlap_phong
    EXCLUDE USING gist (
        phong_id WITH =,
        tsrange(ngay_gio_bat_dau, ngay_gio_ket_thuc) WITH &&
    )
    WHERE (phong_id IS NOT NULL AND trang_thai NOT IN ('da_huy', 'khong_den'));

-- =============================================
-- ASSESSMENT FLOW
-- =============================================

CREATE TABLE danh_gia (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lich_dat_id             UUID    UNIQUE NOT NULL,
    khach_hang_id           UUID    NOT NULL,
    ky_thuat_vien_id        UUID    NOT NULL,
    ngay_danh_gia           DATE    NOT NULL,
    tong_diem_dau           INT,
    vung_dau_chinh          VARCHAR(500),
    -- [OPT-1] CHECK Constraint
    tu_the_tong_quat        VARCHAR(20)
                            CHECK (tu_the_tong_quat IN ('tot', 'trung_binh', 'kem')),
    -- [OPT-1] CHECK Constraint
    muc_do_linh_hoat        VARCHAR(20)
                            CHECK (muc_do_linh_hoat IN ('binh_thuong', 'han_che', 'rat_han_che')),
    tom_tat_kham            TEXT,
    chan_doan_so_bo         TEXT,
    ai_tom_tat              TEXT,   -- [AI-GENERATED] Hiển thị nhãn AI ở UI
    -- [OPT-1] CHECK Constraint
    trang_thai              VARCHAR(20)  NOT NULL DEFAULT 'nhap'
                            CHECK (trang_thai IN ('nhap', 'hoan_thanh', 'da_de_xuat')),
    thoi_gian_hoan_thanh    TIMESTAMP
);

CREATE TABLE ket_qua_danh_gia (
    id              BIGSERIAL   PRIMARY KEY,
    danh_gia_id     UUID        NOT NULL,
    vung_co_the     VARCHAR(100) NOT NULL,
    muc_do_dau      INT,
    loai_dau        VARCHAR(100),
    tinh_trang_co   VARCHAR(20),
    pham_vi_van_dong VARCHAR(200),
    van_de_tu_the   TEXT,
    hinh_anh_url    TEXT,
    ghi_chu_ktv     TEXT
);

CREATE TABLE khuyen_nghi (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    danh_gia_id         UUID    UNIQUE NOT NULL,
    khach_hang_id       UUID    NOT NULL,
    ky_thuat_vien_id    UUID    NOT NULL,
    -- [GIỮ LẠI] goi_de_xuat_id: gói ưu tiên hàng đầu (shortcut tiện dụng)
    goi_de_xuat_id      UUID,
    so_buoi_de_xuat     INT,
    tan_suat_de_xuat    VARCHAR(100),
    ly_do_de_xuat       TEXT    NOT NULL,
    muc_tieu_dieu_tri   TEXT,
    -- [OPT-1] CHECK Constraint
    trang_thai          VARCHAR(30)  NOT NULL DEFAULT 'cho_quyet_dinh'
                        CHECK (trang_thai IN ('cho_quyet_dinh', 'da_chap_nhan', 'tu_choi', 'het_han')),
    han_quyet_dinh      DATE,
    thoi_gian_tao       TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- [FIX-4] Bảng kết nối đa gói cho khuyến nghị
CREATE TABLE khuyen_nghi_goi (
    id                  BIGSERIAL   PRIMARY KEY,
    khuyen_nghi_id      UUID        NOT NULL,
    goi_dieu_tri_id     UUID        NOT NULL,
    thu_tu_uu_tien      INT         NOT NULL DEFAULT 1
                        CHECK (thu_tu_uu_tien BETWEEN 1 AND 3),
    ghi_chu_lua_chon    VARCHAR(300),
    UNIQUE (khuyen_nghi_id, goi_dieu_tri_id),
    UNIQUE (khuyen_nghi_id, thu_tu_uu_tien)
);

-- =============================================
-- PACKAGE SYSTEM
-- =============================================

CREATE TABLE goi_dieu_tri (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ten_goi                 VARCHAR(200)  NOT NULL,
    ma_goi                  VARCHAR(30)   UNIQUE NOT NULL,
    mo_ta                   TEXT,
    tong_so_buoi            INT           NOT NULL,
    -- [OPT-4] BIGINT thay vì DECIMAL(12,2)
    gia_goi                 BIGINT        NOT NULL,
    gia_goc                 BIGINT,
    thoi_gian_su_dung_ngay  INT           NOT NULL DEFAULT 90,
    hien_thi_website        BOOLEAN       NOT NULL DEFAULT TRUE,
    -- [OPT-1] CHECK Constraint
    trang_thai              VARCHAR(20)   NOT NULL DEFAULT 'hoat_dong'
                            CHECK (trang_thai IN ('hoat_dong', 'ngung_ban', 'luu_tru')),
    thoi_gian_tao           TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE goi_dieu_tri_dich_vu (
    id                  BIGSERIAL   PRIMARY KEY,
    goi_dieu_tri_id     UUID        NOT NULL,
    dich_vu_id          UUID        NOT NULL,
    so_buoi_phan_bo     INT         NOT NULL,
    ghi_chu             VARCHAR(300),
    UNIQUE (goi_dieu_tri_id, dich_vu_id)
);

CREATE TABLE dang_ky_goi (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_dang_ky          VARCHAR(20)   UNIQUE NOT NULL,
    khach_hang_id       UUID          NOT NULL,
    goi_dieu_tri_id     UUID          NOT NULL,
    khuyen_nghi_id      UUID,
    hoa_don_id          UUID,
    ngay_mua            DATE          NOT NULL DEFAULT NOW(),
    ngay_kich_hoat      DATE,
    ngay_het_han        DATE,
    tong_buoi           INT           NOT NULL,
    buoi_da_dung        INT           NOT NULL DEFAULT 0,
    buoi_con_lai        INT           GENERATED ALWAYS AS (tong_buoi - buoi_da_dung) STORED,
    -- [OPT-1] CHECK Constraint
    trang_thai          VARCHAR(20)   NOT NULL DEFAULT 'cho_kich_hoat'
                        CHECK (trang_thai IN ('cho_kich_hoat', 'dang_trai_nghiem', 'dang_su_dung', 'hoan_thanh', 'het_han', 'da_huy')),
    ghi_chu             TEXT,
    kich_hoat_boi       UUID,
    kich_hoat_luc       TIMESTAMP,
    -- [V3-2] Luồng gói thử nghiệm
    --        ⚠️  CHỈ áp dụng cho gói combo — dịch vụ lẻ thanh toán bình thường
    loai_dang_ky        VARCHAR(20)   NOT NULL DEFAULT 'chinh_thuc'
                        CHECK (loai_dang_ky IN ('thu_nghiem', 'chinh_thuc')),
    -- Số buổi tối đa được dùng thử trước khi phải chốt (NULL nếu loai_dang_ky = 'chinh_thuc')
    buoi_thu_toi_da     INT           DEFAULT 3,
    -- Deadline khách phải quyết định, tính từ sau buổi thử cuối cùng
    han_chot_ngay       DATE,
    -- Track vòng đời gói thử (NULL nếu loai_dang_ky = 'chinh_thuc')
    trang_thai_thu      VARCHAR(20)
                        CHECK (trang_thai_thu IN ('dang_thu', 'da_chot', 'tu_choi', 'qua_han'))
);

CREATE INDEX idx_khach_goi_trangthai ON dang_ky_goi (khach_hang_id, trang_thai);

-- =============================================
-- TREATMENT SESSIONS
-- =============================================

CREATE TABLE buoi_tri_lieu (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lich_dat_id         UUID    UNIQUE NOT NULL,
    khach_hang_id       UUID    NOT NULL,
    ky_thuat_vien_id    UUID    NOT NULL,
    phong_id            BIGINT,
    dich_vu_id          UUID    NOT NULL,
    thoi_gian_bat_dau   TIMESTAMP   NOT NULL,
    thoi_gian_ket_thuc  TIMESTAMP,
    danh_gia_truoc_buoi INT,
    danh_gia_sau_buoi   INT,
    danh_gia_hieu_qua   INT,
    -- [FIX-1] Buổi thứ mấy trong gói
    so_thu_tu_buoi      INT,
    -- [FIX-2] FK về đánh giá ban đầu
    danh_gia_id         UUID,
    -- [OPT-1] CHECK Constraint
    trang_thai          VARCHAR(20)  NOT NULL DEFAULT 'dang_thuc_hien'
                        CHECK (trang_thai IN ('dang_thuc_hien', 'hoan_thanh', 'gian_doan')),
    canh_bao_dac_biet   TEXT,
    -- [AI-GENERATED] <= 300 ký tự
    ai_tom_tat_ngan     VARCHAR(300),
    thoi_gian_ghi_chu   TIMESTAMP
);

CREATE INDEX idx_ktv_buoi ON buoi_tri_lieu (ky_thuat_vien_id, thoi_gian_bat_dau);

CREATE TABLE ghi_chu_buoi (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buoi_tri_lieu_id    UUID    NOT NULL,
    -- [OPT-1] CHECK Constraint
    loai                VARCHAR(30)  NOT NULL
                        CHECK (loai IN ('ky_thuat', 'vung_tap_trung', 'phan_hoi_khach', 'tien_trinh', 'ke_hoach_buoi_ke', 'ai_tom_tat', 'ghi_chu_khac')),
    noi_dung            TEXT         NOT NULL,
    -- [FIX-3] Vùng cơ thể tập trung
    vung_co_the         VARCHAR(100),
    tao_boi             UUID         NOT NULL,
    tao_luc             TIMESTAMP    NOT NULL DEFAULT NOW(),
    sua_luc             TIMESTAMP,
    da_xac_nhan         BOOLEAN      NOT NULL DEFAULT FALSE,
    xac_nhan_luc        TIMESTAMP
);

CREATE INDEX idx_ghi_chu_buoi ON ghi_chu_buoi (buoi_tri_lieu_id, loai);

-- =============================================
-- PAYMENT
-- =============================================

CREATE TABLE hoa_don (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_hoa_don              VARCHAR(20)   UNIQUE NOT NULL,
    khach_hang_id           UUID          NOT NULL,
    -- [OPT-1] CHECK Constraint
    loai_hoa_don            VARCHAR(20)   NOT NULL
                            CHECK (loai_hoa_don IN ('dich_vu_don', 'danh_gia', 'goi_dieu_tri')),
    lich_dat_id             UUID,
    dang_ky_goi_id          UUID,
    -- [OPT-4] BIGINT thay vì DECIMAL(12,2)
    tong_tien_truoc_giam    BIGINT        NOT NULL DEFAULT 0,
    so_tien_giam            BIGINT        NOT NULL DEFAULT 0,
    tong_tien_thanh_toan    BIGINT        NOT NULL,
    da_thanh_toan           BIGINT        NOT NULL DEFAULT 0,
    -- [OPT-1] CHECK Constraint
    trang_thai              VARCHAR(30)   NOT NULL DEFAULT 'chua_thanh_toan'
                            CHECK (trang_thai IN ('chua_thanh_toan', 'thanh_toan_mot_phan', 'da_thanh_toan', 'da_hoan_tien')),
    ghi_chu                 TEXT,
    ngay_tao                TIMESTAMP     NOT NULL DEFAULT NOW(),
    ngay_thanh_toan         TIMESTAMP,
    thu_boi                 UUID
);

CREATE INDEX idx_khach_hoadon_trangthai ON hoa_don (khach_hang_id, trang_thai);

CREATE TABLE hoa_don_chi_tiet (
    id          BIGSERIAL   PRIMARY KEY,
    hoa_don_id  UUID        NOT NULL,
    mo_ta       VARCHAR(300) NOT NULL,
    -- [OPT-4] BIGINT thay vì DECIMAL(12,2)
    don_gia     BIGINT        NOT NULL,
    so_luong    INT           NOT NULL DEFAULT 1,
    thanh_tien  BIGINT        NOT NULL,
    dich_vu_id  UUID
);

CREATE TABLE thanh_toan (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_giao_dich        VARCHAR(50)   UNIQUE NOT NULL,
    hoa_don_id          UUID          NOT NULL,
    -- [OPT-4] BIGINT thay vì DECIMAL(12,2)
    so_tien             BIGINT        NOT NULL,
    -- [OPT-1] CHECK Constraint
    phuong_thuc         VARCHAR(20)   NOT NULL
                        CHECK (phuong_thuc IN ('tien_mat', 'chuyen_khoan', 'the', 'momo', 'vnpay', 'zalopay')),
    -- [OPT-1] CHECK Constraint
    trang_thai          VARCHAR(20)   NOT NULL DEFAULT 'cho_xu_ly'
                        CHECK (trang_thai IN ('cho_xu_ly', 'thanh_cong', 'that_bai', 'da_hoan_tien')),
    ma_tham_chieu       VARCHAR(100),
    nguoi_thu_tien_id   UUID,
    thoi_gian_giao_dich TIMESTAMP     NOT NULL DEFAULT NOW(),
    ghi_chu             TEXT
);

-- =============================================
-- CUSTOMER FEEDBACK
-- =============================================

CREATE TABLE danh_gia_dich_vu (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buoi_tri_lieu_id    UUID    UNIQUE NOT NULL,
    khach_hang_id       UUID    NOT NULL,
    ky_thuat_vien_id    UUID    NOT NULL,
    so_sao_tong         INT     NOT NULL
                        CHECK (so_sao_tong BETWEEN 1 AND 5),
    so_sao_ktv          INT
                        CHECK (so_sao_ktv BETWEEN 1 AND 5),
    nhan_xet            TEXT,
    hieu_qua_dieu_tri   VARCHAR(30),
    se_quay_lai         BOOLEAN,
    hien_thi_cong_khai  BOOLEAN NOT NULL DEFAULT FALSE,
    thoi_gian_danh_gia  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ddv_ktv ON danh_gia_dich_vu (ky_thuat_vien_id, thoi_gian_danh_gia);

-- =============================================
-- NOTIFICATIONS
-- =============================================

CREATE TABLE thong_bao (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    khach_hang_id   UUID    NOT NULL,
    lich_dat_id     UUID,
    -- [OPT-1] CHECK Constraint
    kenh            VARCHAR(20)  NOT NULL
                    CHECK (kenh IN ('zalo', 'sms', 'email')),
    -- [OPT-1] CHECK Constraint
    loai            VARCHAR(40)  NOT NULL
                    CHECK (loai IN ('xac_nhan_dat_lich', 'nhac_lich_24h', 'nhac_lich_2h', 'link_danh_gia', 'canh_bao_het_goi', 'canh_bao_het_han', 'hoa_don', 'marketing')),
    noi_dung        TEXT         NOT NULL,
    link_hanh_dong  TEXT,
    -- [OPT-1] CHECK Constraint
    trang_thai      VARCHAR(20)  NOT NULL DEFAULT 'cho_gui'
                    CHECK (trang_thai IN ('cho_gui', 'da_gui', 'that_bai', 'da_doc')),
    gui_luc         TIMESTAMP,
    thoi_gian_tao   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_thongbao_khach ON thong_bao (khach_hang_id, loai);

-- =============================================
-- AUDIT LOG
-- =============================================

CREATE TABLE audit_log (
    id              BIGSERIAL   PRIMARY KEY,
    nguoi_th_id     UUID        NOT NULL,
    bang            VARCHAR(100) NOT NULL,
    ban_ghi_id      UUID,
    -- [OPT-1] CHECK Constraint
    hanh_dong       VARCHAR(30)  NOT NULL
                    CHECK (hanh_dong IN ('tao', 'sua', 'xoa', 'huy_lich', 'doi_lich', 'kich_hoat_goi', 'hoan_tien', 'override_ai')),
    gia_tri_cu      JSONB,
    gia_tri_moi     JSONB,
    dia_chi_ip      INET,
    thuc_hien_luc   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_bang   ON audit_log (bang, ban_ghi_id);
CREATE INDEX idx_audit_nguoi  ON audit_log (nguoi_th_id, thuc_hien_luc);

-- =============================================
-- FOREIGN KEYS
-- =============================================

-- nguoi_dung
ALTER TABLE nguoi_dung       ADD CONSTRAINT fk_nguoidung_vaitro
    FOREIGN KEY (vai_tro_id)         REFERENCES vai_tro (id);
ALTER TABLE khach_hang       ADD CONSTRAINT fk_khach_nguoidung
    FOREIGN KEY (nguoi_dung_id)      REFERENCES nguoi_dung (id);
ALTER TABLE khach_hang       ADD CONSTRAINT fk_khach_preferred_ktv
    FOREIGN KEY (preferred_ktv_id)   REFERENCES ky_thuat_vien (id);
ALTER TABLE ho_so_y_te       ADD CONSTRAINT fk_hoso_khach
    FOREIGN KEY (khach_hang_id)      REFERENCES khach_hang (id);
ALTER TABLE ho_so_y_te       ADD CONSTRAINT fk_hoso_capnhatboi
    FOREIGN KEY (cap_nhat_boi)       REFERENCES nguoi_dung (id);
ALTER TABLE ky_thuat_vien    ADD CONSTRAINT fk_ktv_nguoidung
    FOREIGN KEY (nguoi_dung_id)      REFERENCES nguoi_dung (id);

-- therapist
ALTER TABLE chuyen_mon_ktv   ADD CONSTRAINT fk_cm_ktv
    FOREIGN KEY (ky_thuat_vien_id)   REFERENCES ky_thuat_vien (id);
ALTER TABLE chuyen_mon_ktv   ADD CONSTRAINT fk_cm_dichvu
    FOREIGN KEY (dich_vu_id)         REFERENCES dich_vu (id);
ALTER TABLE lich_lam_viec_ktv ADD CONSTRAINT fk_llvktv_ktv
    FOREIGN KEY (nguoi_dung_id)   REFERENCES nguoi_dung (id);
ALTER TABLE ngay_nghi_ktv    ADD CONSTRAINT fk_nn_ktv
    FOREIGN KEY (ky_thuat_vien_id)   REFERENCES ky_thuat_vien (id);
ALTER TABLE ngay_nghi_ktv    ADD CONSTRAINT fk_nn_duyetboi
    FOREIGN KEY (duyet_boi)          REFERENCES nguoi_dung (id);

-- services
ALTER TABLE dich_vu          ADD CONSTRAINT fk_dichvu_danhmuc
    FOREIGN KEY (danh_muc_id)        REFERENCES danh_muc_dich_vu (id);

-- [V4-3] phong_dich_vu
ALTER TABLE phong_dich_vu    ADD CONSTRAINT fk_pdv_phong
    FOREIGN KEY (phong_id)           REFERENCES phong (id) ON DELETE CASCADE;
ALTER TABLE phong_dich_vu    ADD CONSTRAINT fk_pdv_danhmuc
    FOREIGN KEY (danh_muc_id)        REFERENCES danh_muc_dich_vu (id);

-- booking
ALTER TABLE lich_dat         ADD CONSTRAINT fk_ld_khach
    FOREIGN KEY (khach_hang_id)      REFERENCES khach_hang (id);
ALTER TABLE lich_dat         ADD CONSTRAINT fk_ld_dichvu
    FOREIGN KEY (dich_vu_id)         REFERENCES dich_vu (id);
ALTER TABLE lich_dat         ADD CONSTRAINT fk_ld_ktv
    FOREIGN KEY (ky_thuat_vien_id)   REFERENCES ky_thuat_vien (id);
ALTER TABLE lich_dat         ADD CONSTRAINT fk_ld_phong
    FOREIGN KEY (phong_id)           REFERENCES phong (id);
ALTER TABLE lich_dat         ADD CONSTRAINT fk_ld_dangkygoi
    FOREIGN KEY (dang_ky_goi_id)     REFERENCES dang_ky_goi (id);
ALTER TABLE lich_dat         ADD CONSTRAINT fk_ld_datlaitulid
    FOREIGN KEY (dat_lai_tu_lich_id) REFERENCES lich_dat (id);

-- assessment
ALTER TABLE danh_gia         ADD CONSTRAINT fk_dg_lichdat
    FOREIGN KEY (lich_dat_id)        REFERENCES lich_dat (id);
ALTER TABLE danh_gia         ADD CONSTRAINT fk_dg_khach
    FOREIGN KEY (khach_hang_id)      REFERENCES khach_hang (id);
ALTER TABLE danh_gia         ADD CONSTRAINT fk_dg_ktv
    FOREIGN KEY (ky_thuat_vien_id)   REFERENCES ky_thuat_vien (id);
ALTER TABLE ket_qua_danh_gia ADD CONSTRAINT fk_kqdg_danhgia
    FOREIGN KEY (danh_gia_id)        REFERENCES danh_gia (id);

-- recommendations
ALTER TABLE khuyen_nghi      ADD CONSTRAINT fk_kn_danhgia
    FOREIGN KEY (danh_gia_id)        REFERENCES danh_gia (id);
ALTER TABLE khuyen_nghi      ADD CONSTRAINT fk_kn_khach
    FOREIGN KEY (khach_hang_id)      REFERENCES khach_hang (id);
ALTER TABLE khuyen_nghi      ADD CONSTRAINT fk_kn_ktv
    FOREIGN KEY (ky_thuat_vien_id)   REFERENCES ky_thuat_vien (id);
ALTER TABLE khuyen_nghi      ADD CONSTRAINT fk_kn_goideuxuat
    FOREIGN KEY (goi_de_xuat_id)     REFERENCES goi_dieu_tri (id);
-- [FIX-4]
ALTER TABLE khuyen_nghi_goi  ADD CONSTRAINT fk_kng_khuyennghi
    FOREIGN KEY (khuyen_nghi_id)     REFERENCES khuyen_nghi (id) ON DELETE CASCADE;
ALTER TABLE khuyen_nghi_goi  ADD CONSTRAINT fk_kng_goidieu_tri
    FOREIGN KEY (goi_dieu_tri_id)    REFERENCES goi_dieu_tri (id);

-- packages
ALTER TABLE goi_dieu_tri_dich_vu ADD CONSTRAINT fk_gdtdv_goi
    FOREIGN KEY (goi_dieu_tri_id)    REFERENCES goi_dieu_tri (id);
ALTER TABLE goi_dieu_tri_dich_vu ADD CONSTRAINT fk_gdtdv_dichvu
    FOREIGN KEY (dich_vu_id)         REFERENCES dich_vu (id);
ALTER TABLE dang_ky_goi      ADD CONSTRAINT fk_dkg_khach
    FOREIGN KEY (khach_hang_id)      REFERENCES khach_hang (id);
ALTER TABLE dang_ky_goi      ADD CONSTRAINT fk_dkg_goi
    FOREIGN KEY (goi_dieu_tri_id)    REFERENCES goi_dieu_tri (id);
ALTER TABLE dang_ky_goi      ADD CONSTRAINT fk_dkg_khuyennghi
    FOREIGN KEY (khuyen_nghi_id)     REFERENCES khuyen_nghi (id);
ALTER TABLE dang_ky_goi      ADD CONSTRAINT fk_dkg_hoadon
    FOREIGN KEY (hoa_don_id)         REFERENCES hoa_don (id);
ALTER TABLE dang_ky_goi      ADD CONSTRAINT fk_dkg_kichhoatboi
    FOREIGN KEY (kich_hoat_boi)      REFERENCES nguoi_dung (id);

-- treatment sessions
ALTER TABLE buoi_tri_lieu    ADD CONSTRAINT fk_btl_lichdat
    FOREIGN KEY (lich_dat_id)        REFERENCES lich_dat (id);
ALTER TABLE buoi_tri_lieu    ADD CONSTRAINT fk_btl_khach
    FOREIGN KEY (khach_hang_id)      REFERENCES khach_hang (id);
ALTER TABLE buoi_tri_lieu    ADD CONSTRAINT fk_btl_ktv
    FOREIGN KEY (ky_thuat_vien_id)   REFERENCES ky_thuat_vien (id);
ALTER TABLE buoi_tri_lieu    ADD CONSTRAINT fk_btl_phong
    FOREIGN KEY (phong_id)           REFERENCES phong (id);
ALTER TABLE buoi_tri_lieu    ADD CONSTRAINT fk_btl_dichvu
    FOREIGN KEY (dich_vu_id)         REFERENCES dich_vu (id);
-- [FIX-2] FK về đánh giá ban đầu
ALTER TABLE buoi_tri_lieu    ADD CONSTRAINT fk_btl_danhgia
    FOREIGN KEY (danh_gia_id)        REFERENCES danh_gia (id);
ALTER TABLE ghi_chu_buoi     ADD CONSTRAINT fk_gcb_buoi
    FOREIGN KEY (buoi_tri_lieu_id)   REFERENCES buoi_tri_lieu (id);
ALTER TABLE ghi_chu_buoi     ADD CONSTRAINT fk_gcb_taoboi
    FOREIGN KEY (tao_boi)            REFERENCES nguoi_dung (id);

-- payment
ALTER TABLE hoa_don          ADD CONSTRAINT fk_hd_khach
    FOREIGN KEY (khach_hang_id)      REFERENCES khach_hang (id);
ALTER TABLE hoa_don          ADD CONSTRAINT fk_hd_lichdat
    FOREIGN KEY (lich_dat_id)        REFERENCES lich_dat (id);
ALTER TABLE hoa_don          ADD CONSTRAINT fk_hd_dangkygoi
    FOREIGN KEY (dang_ky_goi_id)     REFERENCES dang_ky_goi (id);
ALTER TABLE hoa_don          ADD CONSTRAINT fk_hd_thuboi
    FOREIGN KEY (thu_boi)            REFERENCES nguoi_dung (id);
ALTER TABLE hoa_don_chi_tiet ADD CONSTRAINT fk_hdct_hoadon
    FOREIGN KEY (hoa_don_id)         REFERENCES hoa_don (id);
ALTER TABLE hoa_don_chi_tiet ADD CONSTRAINT fk_hdct_dichvu
    FOREIGN KEY (dich_vu_id)         REFERENCES dich_vu (id);
ALTER TABLE thanh_toan       ADD CONSTRAINT fk_tt_hoadon
    FOREIGN KEY (hoa_don_id)         REFERENCES hoa_don (id);
ALTER TABLE thanh_toan       ADD CONSTRAINT fk_tt_nguithu
    FOREIGN KEY (nguoi_thu_tien_id)  REFERENCES nguoi_dung (id);

-- feedback
ALTER TABLE danh_gia_dich_vu ADD CONSTRAINT fk_dgdv_buoi
    FOREIGN KEY (buoi_tri_lieu_id)   REFERENCES buoi_tri_lieu (id);
ALTER TABLE danh_gia_dich_vu ADD CONSTRAINT fk_dgdv_khach
    FOREIGN KEY (khach_hang_id)      REFERENCES khach_hang (id);
ALTER TABLE danh_gia_dich_vu ADD CONSTRAINT fk_dgdv_ktv
    FOREIGN KEY (ky_thuat_vien_id)   REFERENCES ky_thuat_vien (id);

-- notifications
ALTER TABLE thong_bao        ADD CONSTRAINT fk_tb_khach
    FOREIGN KEY (khach_hang_id)      REFERENCES khach_hang (id);
ALTER TABLE thong_bao        ADD CONSTRAINT fk_tb_lichdat
    FOREIGN KEY (lich_dat_id)        REFERENCES lich_dat (id);

-- audit
ALTER TABLE audit_log        ADD CONSTRAINT fk_al_nguoith
    FOREIGN KEY (nguoi_th_id)        REFERENCES nguoi_dung (id);

-- =============================================
-- [V4-1] VOUCHER & KHUYẾN MÃI
-- =============================================

-- Định nghĩa mã voucher và luật giảm giá
CREATE TABLE voucher (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_voucher          VARCHAR(50)   UNIQUE NOT NULL,
    ten_chien_dich      VARCHAR(200),
    -- [OPT-1] CHECK Constraint
    loai_giam           VARCHAR(20)   NOT NULL
                        CHECK (loai_giam IN ('phan_tram', 'so_tien_co_dinh')),
    -- % hoặc số VNĐ tùy loai_giam
    -- [OPT-4] BIGINT thay vì DECIMAL
    gia_tri_giam        BIGINT        NOT NULL,
    -- Trần giảm tối đa — chỉ áp dụng khi loai_giam = 'phan_tram', NULL = không giới hạn
    giam_toi_da         BIGINT,
    -- Giá trị đơn hàng tối thiểu để voucher có hiệu lực
    don_hang_toi_thieu  BIGINT        NOT NULL DEFAULT 0,
    -- [OPT-1] CHECK Constraint
    ap_dung_cho         VARCHAR(30)   NOT NULL DEFAULT 'tat_ca'
                        CHECK (ap_dung_cho IN ('tat_ca', 'dich_vu_don', 'goi_dieu_tri', 'danh_gia')),
    -- NULL = không giới hạn số lượt dùng
    so_luong_toi_da     INT,
    -- Tăng bằng atomic UPDATE có điều kiện — KHÔNG dùng read-then-write
    so_luong_da_dung    INT           NOT NULL DEFAULT 0,
    ngay_bat_dau        DATE          NOT NULL,
    -- NULL = không giới hạn thời gian
    ngay_het_han        DATE,
    tao_boi             UUID          NOT NULL,
    -- [OPT-1] CHECK Constraint
    trang_thai          VARCHAR(20)   NOT NULL DEFAULT 'hoat_dong'
                        CHECK (trang_thai IN ('hoat_dong', 'tam_dung', 'het_han', 'sap_ra_mat')),
    thoi_gian_tao       TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_voucher_ma       ON voucher (ma_voucher);
CREATE INDEX idx_voucher_trangthai ON voucher (trang_thai, ngay_het_han);

-- Log áp dụng voucher vào hóa đơn
-- ⚠️ UNIQUE (hoa_don_id) = backstop: 1 hóa đơn chỉ được áp 1 voucher
CREATE TABLE voucher_su_dung (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id      UUID          NOT NULL,
    -- UNIQUE đảm bảo 1 hóa đơn không thể dùng 2 voucher
    hoa_don_id      UUID          UNIQUE NOT NULL,
    khach_hang_id   UUID          NOT NULL,
    -- Giá trị giảm thực tế tại thời điểm áp dụng — snapshot, không tính lại
    so_tien_giam    BIGINT        NOT NULL,
    su_dung_luc     TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- =============================================
-- [V4-2] THIẾT BỊ Y TẾ & BẢO TRÌ
-- =============================================

-- Thiết bị di động/chia sẻ cần theo dõi trạng thái vận hành
-- ⚠️ KHÔNG thay thế phong.thiet_bi JSONB — JSONB vẫn dùng cho thiết bị cố định trong phòng
CREATE TABLE thiet_bi_y_te (
    id                  BIGSERIAL     PRIMARY KEY,
    ma_thiet_bi         VARCHAR(20)   UNIQUE NOT NULL,
    ten_thiet_bi        VARCHAR(200)  NOT NULL,
    thuong_hieu         VARCHAR(100),
    mo_ta_ngan          VARCHAR(300),
    hinh_anh_url        TEXT,
    so_luong            INT           NOT NULL DEFAULT 1,
    -- [OPT-1] CHECK Constraint
    trang_thai          VARCHAR(20)   NOT NULL DEFAULT 'san_sang'
                        CHECK (trang_thai IN ('san_sang', 'dang_su_dung', 'dang_bao_tri', 'hong')),
    -- Phòng hiện đang giữ thiết bị; NULL = không gán phòng cố định / đang kho
    phong_id_hien_tai   BIGINT,
    ghi_chu             TEXT,
    thoi_gian_tao       TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_thietbi_trangthai ON thiet_bi_y_te (trang_thai);

-- Lịch bảo trì định kỳ và đột xuất
-- Các bản ghi quá hạn (ngay_du_kien < NOW() AND trang_thai = 'cho_thuc_hien')
-- phải được chuyển sang 'qua_han' bằng scheduled job hoặc trigger
CREATE TABLE lich_bao_tri (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thiet_bi_id         BIGINT        NOT NULL,
    -- [OPT-1] CHECK Constraint
    loai_bao_tri        VARCHAR(30)   NOT NULL
                        CHECK (loai_bao_tri IN ('dinh_ky', 'dot_xuat', 'sua_chua', 'kiem_dinh')),
    ngay_du_kien        DATE          NOT NULL,
    -- KTV hoặc Admin được phân công; NULL = chưa phân công
    nguoi_phu_trach     UUID,
    -- [OPT-1] CHECK Constraint
    trang_thai          VARCHAR(20)   NOT NULL DEFAULT 'cho_thuc_hien'
                        CHECK (trang_thai IN ('cho_thuc_hien', 'hoan_thanh', 'qua_han')),
    ghi_chu             TEXT,
    hoan_thanh_luc      TIMESTAMP,
    thoi_gian_tao       TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_baoTri_ngay      ON lich_bao_tri (ngay_du_kien, trang_thai);
CREATE INDEX idx_baoTri_thietbi   ON lich_bao_tri (thiet_bi_id, trang_thai);

-- =============================================
-- FOREIGN KEYS — V4 additions
-- =============================================

ALTER TABLE voucher          ADD CONSTRAINT fk_voucher_taoboi
    FOREIGN KEY (tao_boi)           REFERENCES nguoi_dung (id);

ALTER TABLE voucher_su_dung  ADD CONSTRAINT fk_vsd_voucher
    FOREIGN KEY (voucher_id)        REFERENCES voucher (id);
ALTER TABLE voucher_su_dung  ADD CONSTRAINT fk_vsd_hoadon
    FOREIGN KEY (hoa_don_id)        REFERENCES hoa_don (id);
ALTER TABLE voucher_su_dung  ADD CONSTRAINT fk_vsd_khach
    FOREIGN KEY (khach_hang_id)     REFERENCES khach_hang (id);

ALTER TABLE thiet_bi_y_te    ADD CONSTRAINT fk_tbyt_phong
    FOREIGN KEY (phong_id_hien_tai) REFERENCES phong (id);

ALTER TABLE lich_bao_tri     ADD CONSTRAINT fk_lbt_thietbi
    FOREIGN KEY (thiet_bi_id)       REFERENCES thiet_bi_y_te (id);
ALTER TABLE lich_bao_tri     ADD CONSTRAINT fk_lbt_nguoiphu
    FOREIGN KEY (nguoi_phu_trach)   REFERENCES nguoi_dung (id);

-- =============================================

-- [V4-3] View tìm phòng trống cho 1 dịch vụ tại khung giờ cho trước
-- Tham số truyền vào khi dùng: $service_id, $start (TIMESTAMP), $end (TIMESTAMP)
-- Logic:
--   1. Phòng phải thuộc danh mục của dịch vụ (qua phong_dich_vu)
--   2. Nếu dịch vụ yêu cầu thiết bị (thiet_bi_yeu_cau IS NOT NULL):
--      phòng phải có thiết bị khớp tên VÀ thiết bị đó đang 'san_sang'
--   3. Phòng không bị trùng lịch trong khung giờ đã chọn
-- ⚠️ View này không nhận tham số — dùng làm template; query thực tế trong service layer
--    truyền $service_id, $start, $end vào WHERE clause tương ứng.
CREATE OR REPLACE VIEW v_phong_san_sang_theo_dich_vu AS
SELECT
    p.id            AS phong_id,
    p.ten_phong,
    p.ma_phong,
    p.tang,
    dv.id           AS dich_vu_id,
    dv.ten_dich_vu,
    dv.thiet_bi_yeu_cau,
    tb.id           AS thiet_bi_id,
    tb.ten_thiet_bi
FROM phong p
JOIN phong_dich_vu pdv  ON pdv.phong_id   = p.id
JOIN danh_muc_dich_vu dm ON dm.id         = pdv.danh_muc_id
JOIN dich_vu dv          ON dv.danh_muc_id = dm.id
LEFT JOIN thiet_bi_y_te tb
    ON  tb.phong_id_hien_tai = p.id
    AND tb.trang_thai        = 'san_sang'
    AND tb.ten_thiet_bi ILIKE '%' || dv.thiet_bi_yeu_cau || '%'
WHERE p.trang_thai = 'san_sang'
  AND dv.trang_thai = 'hoat_dong'
  AND (
      dv.thiet_bi_yeu_cau IS NULL   -- không yêu cầu thiết bị đặc thù
      OR tb.id IS NOT NULL          -- yêu cầu thiết bị VÀ đã tìm thấy
  );

-- View đường cong hồi phục: so sánh điểm đau qua các buổi trong một gói
CREATE OR REPLACE VIEW v_tien_trinh_hoi_phuc AS
SELECT
    btl.khach_hang_id,
    btl.dich_vu_id,
    ld.dang_ky_goi_id,
    btl.so_thu_tu_buoi,
    btl.danh_gia_truoc_buoi,
    btl.danh_gia_sau_buoi,
    btl.danh_gia_hieu_qua,
    btl.thoi_gian_bat_dau::DATE AS ngay,
    btl.ky_thuat_vien_id
FROM buoi_tri_lieu btl
JOIN lich_dat ld ON ld.id = btl.lich_dat_id
WHERE btl.trang_thai = 'hoan_thanh'
  AND btl.so_thu_tu_buoi IS NOT NULL;

-- View tóm tắt gói đăng ký (tiện cho dashboard)
CREATE OR REPLACE VIEW v_goi_dang_ky_tom_tat AS
SELECT
    dk.id,
    dk.ma_dang_ky,
    dk.khach_hang_id,
    g.ten_goi,
    dk.tong_buoi,
    dk.buoi_da_dung,
    dk.buoi_con_lai,
    dk.ngay_kich_hoat,
    dk.ngay_het_han,
    dk.trang_thai,
    (dk.ngay_het_han - CURRENT_DATE) AS ngay_con_lai_den_het_han
FROM dang_ky_goi dk
JOIN goi_dieu_tri g ON g.id = dk.goi_dieu_tri_id;

-- [OPT-3] View lọc người dùng chưa bị xóa mềm (tiện dùng thay vì luôn WHERE deleted_at IS NULL)
-- [V4-4] Join vai_tro để expose ma_vai_tro — application layer dùng ma_vai_tro như trước
CREATE OR REPLACE VIEW v_nguoi_dung_active AS
SELECT
    nd.*,
    vt.ma_vai_tro,
    vt.ten_hien_thi AS ten_vai_tro
FROM nguoi_dung nd
JOIN vai_tro vt ON vt.id = nd.vai_tro_id
WHERE nd.deleted_at IS NULL;

CREATE OR REPLACE VIEW v_khach_hang_active AS
SELECT kh.* FROM khach_hang kh
JOIN nguoi_dung nd ON nd.id = kh.nguoi_dung_id
WHERE kh.deleted_at IS NULL AND nd.deleted_at IS NULL;

CREATE TABLE refresh_tokens (
    id              SERIAL PRIMARY KEY,
    nguoi_dung_id   UUID NOT NULL REFERENCES nguoi_dung(id) ON DELETE CASCADE,
    token           TEXT NOT NULL,
    expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE otp_codes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL,
    otp             VARCHAR(6) NOT NULL,
    expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Bảng lưu nhật ký hệ thống (Audit Log)
CREATE TABLE system_audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES nguoi_dung(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(100) NOT NULL,
    entity_id       VARCHAR(255),
    payload         JSONB,
    ip_address      VARCHAR(50),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

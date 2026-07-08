-- PhysioFlow Demo Data
-- Exported on: 2026-07-02T07:01:08.741Z

SET session_replication_role = 'replica';

-- Table: khach_hang
TRUNCATE TABLE "khach_hang" CASCADE;

INSERT INTO "khach_hang" ("id", "ho_ten", "email", "mat_khau_hash", "so_dien_thoai", "dia_chi", "ngay_sinh", "gioi_tinh", "trang_thai") VALUES ('10000000-0000-0000-0000-000000000011', 'Nguyễn Văn An', 'kh1@gmail.com', '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', '0912000011', '12 Nguyễn Huệ, Q1, TP.HCM', '1988-03-14T17:00:00.000Z', 'nam', 'hoat_dong');
INSERT INTO "khach_hang" ("id", "ho_ten", "email", "mat_khau_hash", "so_dien_thoai", "dia_chi", "ngay_sinh", "gioi_tinh", "trang_thai") VALUES ('10000000-0000-0000-0000-000000000012', 'Trần Thị Bảo', 'kh2@gmail.com', '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', '0912000012', '45 Lê Lợi, Q1, TP.HCM', '1992-07-21T17:00:00.000Z', 'nu', 'hoat_dong');
INSERT INTO "khach_hang" ("id", "ho_ten", "email", "mat_khau_hash", "so_dien_thoai", "dia_chi", "ngay_sinh", "gioi_tinh", "trang_thai") VALUES ('10000000-0000-0000-0000-000000000013', 'Lê Quang Cường', 'kh3@gmail.com', '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', '0912000013', '78 Trần Hưng Đạo, Q5, TP.HCM', '1985-11-07T17:00:00.000Z', 'nam', 'hoat_dong');
INSERT INTO "khach_hang" ("id", "ho_ten", "email", "mat_khau_hash", "so_dien_thoai", "dia_chi", "ngay_sinh", "gioi_tinh", "trang_thai") VALUES ('10000000-0000-0000-0000-000000000014', 'Phạm Thị Dung', 'kh4@gmail.com', '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', '0912000014', '23 Điện Biên Phủ, Q3, TP.HCM', '1995-04-29T17:00:00.000Z', 'nu', 'hoat_dong');

-- Table: hoa_don
TRUNCATE TABLE "hoa_don" CASCADE;

-- No data for hoa_don

-- Table: thong_bao
TRUNCATE TABLE "thong_bao" CASCADE;

-- No data for thong_bao

SET session_replication_role = 'origin';

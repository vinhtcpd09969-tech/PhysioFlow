-- PhysioFlow Base System Data
-- Exported on: 2026-07-02T07:01:08.478Z

SET session_replication_role = 'replica';

-- Table: vai_tro
TRUNCATE TABLE "vai_tro" CASCADE;

INSERT INTO "vai_tro" ("id", "ma_vai_tro", "ten_vai_tro") VALUES (1, 'khach_hang', 'Khách hàng');
INSERT INTO "vai_tro" ("id", "ma_vai_tro", "ten_vai_tro") VALUES (2, 'le_tan', 'Lễ tân');
INSERT INTO "vai_tro" ("id", "ma_vai_tro", "ten_vai_tro") VALUES (3, 'ky_thuat_vien', 'Kỹ thuật viên');
INSERT INTO "vai_tro" ("id", "ma_vai_tro", "ten_vai_tro") VALUES (4, 'bac_si', 'Bác sĩ');
INSERT INTO "vai_tro" ("id", "ma_vai_tro", "ten_vai_tro") VALUES (5, 'admin', 'Quản trị viên');
INSERT INTO "vai_tro" ("id", "ma_vai_tro", "ten_vai_tro") VALUES (6, 'quan_ly', 'Quản lý');

-- Table: goi_dich_vu
TRUNCATE TABLE "goi_dich_vu" CASCADE;

INSERT INTO "goi_dich_vu" ("id", "ten_goi", "loai_goi", "tong_so_buoi", "thoi_luong_phut", "don_gia", "don_gia_theo_buoi", "trang_thai", "anh_goi", "danh_muc_goi_id", "muc_tieu", "quy_trinh") VALUES ('c1000000-0000-0000-0000-000000000003', 'Gói Phục Hồi Chấn Thương Thể Thao & Viêm Gân Cấp', 'LIEU_TRINH', 12, 60, '5400000', '450000', 'hoat_dong', '/goi/images/laser_tri_lieu.png', 'd1000000-0000-0000-0000-000000000003', NULL, NULL);
INSERT INTO "goi_dich_vu" ("id", "ten_goi", "loai_goi", "tong_so_buoi", "thoi_luong_phut", "don_gia", "don_gia_theo_buoi", "trang_thai", "anh_goi", "danh_muc_goi_id", "muc_tieu", "quy_trinh") VALUES ('c1000000-0000-0000-0000-000000000000', 'Khám lâm sàng & Lượng giá chức năng cơ xương khớp', 'KHAM', 1, 30, '200000', '200000', 'hoat_dong', '/goi/images/kham_sang_loc.png', 'd1000000-0000-0000-0000-000000000001', NULL, NULL);
INSERT INTO "goi_dich_vu" ("id", "ten_goi", "loai_goi", "tong_so_buoi", "thoi_luong_phut", "don_gia", "don_gia_theo_buoi", "trang_thai", "anh_goi", "danh_muc_goi_id", "muc_tieu", "quy_trinh") VALUES ('c1000000-0000-0000-0000-000000000101', 'Trị liệu Laser công suất cao giảm sưng viêm', 'LE', 1, 15, '250000', '250000', 'hoat_dong', '/goi/images/laser_tri_lieu.png', NULL, NULL, NULL);
INSERT INTO "goi_dich_vu" ("id", "ten_goi", "loai_goi", "tong_so_buoi", "thoi_luong_phut", "don_gia", "don_gia_theo_buoi", "trang_thai", "anh_goi", "danh_muc_goi_id", "muc_tieu", "quy_trinh") VALUES ('c1000000-0000-0000-0000-000000000102', 'Trị liệu sóng xung kích Focused Shockwave', 'LE', 1, 20, '300000', '300000', 'hoat_dong', '/goi/images/song_xung_kich.png', NULL, NULL, NULL);
INSERT INTO "goi_dich_vu" ("id", "ten_goi", "loai_goi", "tong_so_buoi", "thoi_luong_phut", "don_gia", "don_gia_theo_buoi", "trang_thai", "anh_goi", "danh_muc_goi_id", "muc_tieu", "quy_trinh") VALUES ('c1000000-0000-0000-0000-000000000103', 'Giải cơ sâu & màng cơ chuyên sâu Myofascial Release', 'LE', 1, 45, '350000', '350000', 'hoat_dong', '/goi/images/giai_co_sau.png', 'd1000000-0000-0000-0000-000000000002', NULL, NULL);
INSERT INTO "goi_dich_vu" ("id", "ten_goi", "loai_goi", "tong_so_buoi", "thoi_luong_phut", "don_gia", "don_gia_theo_buoi", "trang_thai", "anh_goi", "danh_muc_goi_id", "muc_tieu", "quy_trinh") VALUES ('c1000000-0000-0000-0000-000000000002', 'Gói Trị Liệu Thoát Vị Đĩa Đệm Cột Sống Thắt Lưng', 'LIEU_TRINH', 10, 60, '4500000', '450000', 'hoat_dong', '/goi/images/song_xung_kich.png', NULL, NULL, NULL);
INSERT INTO "goi_dich_vu" ("id", "ten_goi", "loai_goi", "tong_so_buoi", "thoi_luong_phut", "don_gia", "don_gia_theo_buoi", "trang_thai", "anh_goi", "danh_muc_goi_id", "muc_tieu", "quy_trinh") VALUES ('c1000000-0000-0000-0000-000000000001', 'Gói Phục Hồi Cột Sống & Đau Vai Gáy Chuyên Sâu', 'LIEU_TRINH', 8, 60, '3200000', '450000', 'hoat_dong', '/goi/images/giai_co_sau.png', NULL, NULL, NULL);

-- Table: nguoi_dung
TRUNCATE TABLE "nguoi_dung" CASCADE;

INSERT INTO "nguoi_dung" ("id", "ho_ten", "email", "so_dien_thoai", "mat_khau_hash", "vai_tro_id", "trang_thai", "anh_dai_dien") VALUES (1, 'Nguyễn Admin Hệ Thống', 'admin@officecare.vn', '0901000001', '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', 5, 'hoat_dong', NULL);
INSERT INTO "nguoi_dung" ("id", "ho_ten", "email", "so_dien_thoai", "mat_khau_hash", "vai_tro_id", "trang_thai", "anh_dai_dien") VALUES (2, 'Trần Minh Quản Lý', 'quanly@officecare.vn', '0901000002', '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', 6, 'hoat_dong', NULL);
INSERT INTO "nguoi_dung" ("id", "ho_ten", "email", "so_dien_thoai", "mat_khau_hash", "vai_tro_id", "trang_thai", "anh_dai_dien") VALUES (3, 'Lê Thị Hoa', 'letan1@officecare.vn', '0901000003', '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', 2, 'hoat_dong', NULL);
INSERT INTO "nguoi_dung" ("id", "ho_ten", "email", "so_dien_thoai", "mat_khau_hash", "vai_tro_id", "trang_thai", "anh_dai_dien") VALUES (4, 'Phạm Ngọc Mai', 'letan2@officecare.vn', '0901000004', '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', 2, 'hoat_dong', NULL);
INSERT INTO "nguoi_dung" ("id", "ho_ten", "email", "so_dien_thoai", "mat_khau_hash", "vai_tro_id", "trang_thai", "anh_dai_dien") VALUES (5, 'BS. Nguyễn Văn Khoa', 'bacsi1@officecare.vn', '0901000005', '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', 4, 'hoat_dong', '/nhan_su/images/dr_nguyen_van_a.png');
INSERT INTO "nguoi_dung" ("id", "ho_ten", "email", "so_dien_thoai", "mat_khau_hash", "vai_tro_id", "trang_thai", "anh_dai_dien") VALUES (6, 'BS. Trần Thị Lan Anh', 'bacsi2@officecare.vn', '0901000006', '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', 4, 'hoat_dong', '/nhan_su/images/dr_tran_thi_b.png');
INSERT INTO "nguoi_dung" ("id", "ho_ten", "email", "so_dien_thoai", "mat_khau_hash", "vai_tro_id", "trang_thai", "anh_dai_dien") VALUES (7, 'KTV. Đỗ Thanh Tùng', 'ktv1@officecare.vn', '0901000007', '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', 3, 'hoat_dong', '/nhan_su/images/ktv_le_van_c.png');
INSERT INTO "nguoi_dung" ("id", "ho_ten", "email", "so_dien_thoai", "mat_khau_hash", "vai_tro_id", "trang_thai", "anh_dai_dien") VALUES (8, 'KTV. Nguyễn Thị Bích', 'ktv2@officecare.vn', '0901000008', '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', 3, 'hoat_dong', '/nhan_su/images/ktv_pham_thi_d.png');
INSERT INTO "nguoi_dung" ("id", "ho_ten", "email", "so_dien_thoai", "mat_khau_hash", "vai_tro_id", "trang_thai", "anh_dai_dien") VALUES (9, 'KTV. Hoàng Văn Minh', 'ktv3@officecare.vn', '0901000009', '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', 3, 'hoat_dong', '/nhan_su/images/ktv_le_van_c.png');
INSERT INTO "nguoi_dung" ("id", "ho_ten", "email", "so_dien_thoai", "mat_khau_hash", "vai_tro_id", "trang_thai", "anh_dai_dien") VALUES (10, 'KTV. Vũ Thị Thanh', 'ktv4@officecare.vn', '0901000010', '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', 3, 'hoat_dong', '/nhan_su/images/ktv_pham_thi_d.png');

SET session_replication_role = 'origin';

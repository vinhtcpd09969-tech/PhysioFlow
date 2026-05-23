import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const ROOT_CONNECTION_STRING = 'postgresql://postgres:password@localhost:5432/postgres';
const DB_NAME = 'office_care';
const TARGET_CONNECTION_STRING = `postgresql://postgres:password@localhost:5432/${DB_NAME}`;

const DDL = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. vai_tro
CREATE TABLE IF NOT EXISTS vai_tro (
  id smallserial PRIMARY KEY,
  ma_vai_tro varchar(20) UNIQUE NOT NULL,
  ten_hien_thi varchar(50) NOT NULL,
  mo_ta_quyen text
);

-- 2. nguoi_dung
CREATE TABLE IF NOT EXISTS nguoi_dung (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ho_ten varchar(150) NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  so_dien_thoai varchar(20) UNIQUE,
  mat_khau_hash varchar(255) NOT NULL,
  vai_tro_id smallint NOT NULL REFERENCES vai_tro(id),
  trang_thai varchar(20) NOT NULL DEFAULT 'hoat_dong',
  da_xac_thuc_email boolean NOT NULL DEFAULT false,
  avatar_url text,
  thoi_gian_tao timestamp without time zone NOT NULL DEFAULT now(),
  lan_dang_nhap_cuoi timestamp without time zone,
  deleted_at timestamp without time zone
);

-- 3. khach_hang
CREATE TABLE IF NOT EXISTS khach_hang (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nguoi_dung_id uuid NOT NULL REFERENCES nguoi_dung(id),
  ngay_sinh date,
  gioi_tinh varchar(10),
  dia_chi text,
  hang_khach_hang varchar(20) NOT NULL DEFAULT 'thuong',
  preferred_ktv_id uuid,
  thoi_gian_tao timestamp without time zone NOT NULL DEFAULT now(),
  deleted_at timestamp without time zone,
  so_cccd varchar(20)
);

-- 4. chuyen_gia_y_te (Replaces older ky_thuat_vien table)
CREATE TABLE IF NOT EXISTS chuyen_gia_y_te (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nguoi_dung_id uuid NOT NULL REFERENCES nguoi_dung(id),
  ma_nhan_vien varchar(20) NOT NULL,
  chuyen_mon_chinh varchar(200) NOT NULL,
  so_nam_kinh_nghiem integer,
  chung_chi text,
  mo_ta_ban_than text,
  anh_dai_dien_url text,
  trang_thai varchar(20) NOT NULL DEFAULT 'hoat_dong',
  ngay_vao_lam date
);

-- 5. danh_muc_dich_vu
CREATE TABLE IF NOT EXISTS danh_muc_dich_vu (
  id bigserial PRIMARY KEY,
  ten_danh_muc varchar(100) NOT NULL,
  mo_ta text,
  thu_tu_hien_thi integer NOT NULL DEFAULT 0,
  an_hien boolean NOT NULL DEFAULT true
);

-- 6. dich_vu
CREATE TABLE IF NOT EXISTS dich_vu (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  danh_muc_id bigint NOT NULL REFERENCES danh_muc_dich_vu(id),
  ten_dich_vu varchar(200) NOT NULL,
  mo_ta_ngan varchar(500),
  mo_ta_chi_tiet text,
  thoi_luong_phut integer NOT NULL,
  don_gia bigint NOT NULL,
  hinh_anh_url text,
  trang_thai varchar(20) NOT NULL DEFAULT 'hoat_dong',
  loai_dich_vu varchar(20) NOT NULL DEFAULT 'chinh',
  thu_tu_hien_thi integer NOT NULL DEFAULT 0,
  thiet_bi_yeu_cau varchar(100),
  hien_thi_website boolean NOT NULL DEFAULT true,
  loai_dich_vu_ho_tro jsonb DEFAULT '[]'::jsonb
);

-- 7. phong
CREATE TABLE IF NOT EXISTS phong (
  id bigserial PRIMARY KEY,
  ten_phong varchar(100) NOT NULL,
  ma_phong varchar(20) NOT NULL,
  loai_phong varchar(100),
  loai_dich_vu_ho_tro jsonb,
  thiet_bi jsonb,
  mo_ta text,
  trang_thai varchar(20) NOT NULL DEFAULT 'san_sang',
  tang varchar(20)
);


-- 9. lich_dat
CREATE TABLE IF NOT EXISTS lich_dat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_lich_dat varchar(20) NOT NULL,
  khach_hang_id uuid REFERENCES khach_hang(id),
  ho_ten_khach varchar(150),
  so_dien_thoai varchar(20),
  gioi_tinh_khach varchar(10),
  dich_vu_id uuid REFERENCES dich_vu(id),
  ky_thuat_vien_id uuid REFERENCES chuyen_gia_y_te(id),
  phong_id bigint REFERENCES phong(id),
  ngay_gio_bat_dau timestamp without time zone NOT NULL,
  ngay_gio_ket_thuc timestamp without time zone NOT NULL,
  ly_do_kham text,
  anh_dinh_kem_url text,
  trang_thai varchar(30) NOT NULL DEFAULT 'cho_xac_nhan',
  dang_ky_goi_id uuid,
  ghi_chu_dat_lich text,
  ghi_chu_noi_bo text,
  thoi_gian_checkin timestamp without time zone,
  thoi_gian_huy timestamp without time zone,
  ly_do_huy text,
  nguoi_tao varchar(20) NOT NULL DEFAULT 'khach_hang',
  thoi_gian_tao timestamp without time zone NOT NULL DEFAULT now(),
  chan_doan text,
  chong_chi_dinh text,
  khuyen_nghi_dich_vu_id uuid REFERENCES dich_vu(id),
  khuyen_nghi_goi_id uuid
);

-- 10. lich_lam_viec
CREATE TABLE IF NOT EXISTS lich_lam_viec (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nguoi_dung_id uuid NOT NULL REFERENCES nguoi_dung(id),
  ngay DATE NOT NULL,
  gio_bat_dau time NOT NULL,
  gio_ket_thuc time NOT NULL,
  trang_thai varchar(20) DEFAULT 'hoat_dong'
);

-- 11. goi_dich_vu
CREATE TABLE IF NOT EXISTS goi_dich_vu (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ten_goi varchar(200) NOT NULL,
  ma_goi varchar(30) UNIQUE NOT NULL,
  mo_ta text,
  tong_so_buoi integer NOT NULL,
  gia_goi bigint NOT NULL,
  gia_goc bigint,
  han_dung_thang integer NOT NULL DEFAULT 6,
  hien_thi_website boolean NOT NULL DEFAULT true,
  trang_thai varchar(20) NOT NULL DEFAULT 'hoat_dong',
  chi_tiet_dich_vu jsonb DEFAULT '[]'::jsonb,
  thoi_gian_tao timestamp without time zone NOT NULL DEFAULT now(),
  danh_muc_id bigint REFERENCES danh_muc_dich_vu(id)
);

-- 12. goi_dich_vu_chi_tiet
CREATE TABLE IF NOT EXISTS goi_dich_vu_chi_tiet (
  id serial PRIMARY KEY,
  goi_dich_vu_id uuid REFERENCES goi_dich_vu(id) ON DELETE CASCADE,
  dich_vu_id uuid REFERENCES dich_vu(id),
  so_buoi_trong_goi integer DEFAULT 1
);

-- Add reference for khuyen_nghi_goi_id in lich_dat now that goi_dich_vu is created
ALTER TABLE lich_dat ADD CONSTRAINT lich_dat_khuyen_nghi_goi_id_fkey FOREIGN KEY (khuyen_nghi_goi_id) REFERENCES goi_dich_vu(id);

-- 13. lich_dieu_tri
CREATE TABLE IF NOT EXISTS lich_dieu_tri (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  khach_hang_id uuid NOT NULL REFERENCES khach_hang(id),
  loai_dieu_tri varchar(20) NOT NULL,
  dich_vu_id uuid REFERENCES dich_vu(id),
  goi_dich_vu_id uuid REFERENCES goi_dich_vu(id),
  tong_so_buoi integer NOT NULL,
  so_buoi_da_dung integer NOT NULL DEFAULT 0,
  trang_thai varchar(20) NOT NULL DEFAULT 'dang_dieu_tri',
  thoi_gian_tao timestamp without time zone NOT NULL DEFAULT now(),
  ma_lich_dieu_tri varchar(20) UNIQUE,
  phong_id bigint REFERENCES phong(id),
  ho_ten_khach varchar(150),
  so_dien_thoai varchar(20),
  ghi_chu_noi_bo text,
  lich_dat_id uuid REFERENCES lich_dat(id),
  ngay_bat_dau timestamp without time zone,
  ngay_ket_thuc timestamp without time zone
);

-- 14. buoi_tri_lieu
CREATE TABLE IF NOT EXISTS buoi_tri_lieu (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lich_dieu_tri_id uuid NOT NULL REFERENCES lich_dieu_tri(id),
  khach_hang_id uuid NOT NULL REFERENCES khach_hang(id),
  ky_thuat_vien_id uuid NOT NULL REFERENCES chuyen_gia_y_te(id),
  phong_id bigint REFERENCES phong(id),
  dich_vu_id uuid REFERENCES dich_vu(id),
  thoi_gian_bat_dau timestamp without time zone NOT NULL,
  thoi_gian_ket_thuc timestamp without time zone,
  danh_gia_truoc_buoi integer,
  danh_gia_sau_buoi integer,
  danh_gia_hieu_qua integer,
  so_thu_tu_buoi integer,
  danh_gia_id uuid,
  trang_thai varchar(20) NOT NULL DEFAULT 'dang_thuc_hien',
  canh_bao_dac_biet text,
  ai_tom_tat_ngan varchar(300),
  thoi_gian_ghi_chu timestamp without time zone
);

-- 15. danh_gia_dich_vu
CREATE TABLE IF NOT EXISTS danh_gia_dich_vu (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buoi_tri_lieu_id uuid NOT NULL REFERENCES buoi_tri_lieu(id),
  khach_hang_id uuid NOT NULL REFERENCES khach_hang(id),
  ky_thuat_vien_id uuid NOT NULL REFERENCES chuyen_gia_y_te(id),
  so_sao_tong integer NOT NULL,
  so_sao_ktv integer,
  nhan_xet text,
  hieu_qua_dieu_tri varchar(30),
  se_quay_lai boolean,
  hien_thi_cong_khai boolean NOT NULL DEFAULT false,
  thoi_gian_danh_gia timestamp without time zone NOT NULL DEFAULT now()
);

-- 16. hoa_don
CREATE TABLE IF NOT EXISTS hoa_don (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_hoa_don varchar(20) NOT NULL,
  khach_hang_id uuid NOT NULL REFERENCES khach_hang(id),
  loai_hoa_don varchar(20) NOT NULL,
  lich_dat_id uuid REFERENCES lich_dat(id),
  dang_ky_goi_id uuid,
  tong_tien_truoc_giam bigint NOT NULL DEFAULT 0,
  so_tien_giam bigint NOT NULL DEFAULT 0,
  tong_tien_thanh_toan bigint NOT NULL,
  da_thanh_toan bigint NOT NULL DEFAULT 0,
  trang_thai varchar(30) NOT NULL DEFAULT 'chua_thanh_toan',
  ghi_chu text,
  ngay_tao timestamp without time zone NOT NULL DEFAULT now(),
  ngay_thanh_toan timestamp without time zone,
  thu_boi uuid
);

-- 17. thanh_toan
CREATE TABLE IF NOT EXISTS thanh_toan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_giao_dich varchar(50) NOT NULL,
  hoa_don_id uuid NOT NULL REFERENCES hoa_don(id),
  so_tien bigint NOT NULL,
  phuong_thuc varchar(20) NOT NULL,
  trang_thai varchar(20) NOT NULL DEFAULT 'cho_xu_ly',
  ma_tham_chieu varchar(100),
  nguoi_thu_tien_id uuid,
  thoi_gian_giao_dich timestamp without time zone NOT NULL DEFAULT now(),
  ghi_chu text
);

-- 18. voucher
CREATE TABLE IF NOT EXISTS voucher (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_voucher varchar(50) NOT NULL,
  ten_chien_dich varchar(200),
  loai_giam varchar(20) NOT NULL,
  gia_tri_giam bigint NOT NULL,
  giam_toi_da bigint,
  don_hang_toi_thieu bigint NOT NULL DEFAULT 0,
  ap_dung_cho varchar(30) NOT NULL DEFAULT 'tat_ca',
  so_luong_toi_da integer,
  so_luong_da_dung integer NOT NULL DEFAULT 0,
  ngay_bat_dau date NOT NULL,
  ngay_het_han date,
  tao_boi uuid NOT NULL REFERENCES nguoi_dung(id),
  trang_thai varchar(20) NOT NULL DEFAULT 'hoat_dong',
  thoi_gian_tao timestamp without time zone NOT NULL DEFAULT now()
);

-- 19. otp_codes
CREATE TABLE IF NOT EXISTS otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL,
  otp varchar(6) NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 20. refresh_tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id serial PRIMARY KEY,
  nguoi_dung_id uuid NOT NULL REFERENCES nguoi_dung(id),
  token text NOT NULL,
  expires_at timestamp without time zone NOT NULL,
  created_at timestamp without time zone DEFAULT now()
);


-- 22. thiet_bi_y_te
CREATE TABLE IF NOT EXISTS thiet_bi_y_te (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_thiet_bi varchar(20) UNIQUE NOT NULL,
  ten_thiet_bi varchar(100) NOT NULL,
  loai_thiet_bi varchar(100),
  ngay_mua date,
  ngay_bao_tri_tiep_theo date,
  trang_thai varchar(20) NOT NULL DEFAULT 'san_sang',
  phong_id_hien_tai bigint,
  ghi_chu text,
  thoi_gian_tao timestamp without time zone NOT NULL DEFAULT now()
);


`;

async function run() {
  const rootClient = new Client({ connectionString: ROOT_CONNECTION_STRING });
  try {
    await rootClient.connect();
    console.log('[1/3] Connected to postgres root database...');

    // Close existing connections
    await rootClient.query(`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE datname = '${DB_NAME}';
    `);

    // Create DB (will fail if exists, so we drop first)
    await rootClient.query(`DROP DATABASE IF EXISTS ${DB_NAME}`);
    await rootClient.query(`CREATE DATABASE ${DB_NAME}`);
    console.log(`[2/3] Database ${DB_NAME} recreated successfully.`);
    await rootClient.end();

    const targetClient = new Client({ connectionString: TARGET_CONNECTION_STRING });
    await targetClient.connect();
    console.log(`[3/3] Connected to ${DB_NAME}. Executing schema...`);
    await targetClient.query(DDL);
    console.log('✅ Schema initialized successfully!');
    await targetClient.end();
  } catch (err) {
    console.error('❌ Error initializing database:', err);
  }
}

run();

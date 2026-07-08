-- CreateTable
CREATE TABLE "vai_tro" (
    "id" SMALLSERIAL NOT NULL,
    "ma_vai_tro" VARCHAR(20) NOT NULL,
    "ten_vai_tro" VARCHAR(50) NOT NULL,

    CONSTRAINT "vai_tro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nguoi_dung" (
    "id" SERIAL NOT NULL,
    "ho_ten" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "so_dien_thoai" VARCHAR(20),
    "mat_khau_hash" VARCHAR(255) NOT NULL,
    "vai_tro_id" SMALLINT NOT NULL,
    "trang_thai" VARCHAR(20) NOT NULL DEFAULT 'hoat_dong',

    CONSTRAINT "nguoi_dung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ho_so_chuyen_gia" (
    "id" SERIAL NOT NULL,
    "nguoi_dung_id" INTEGER NOT NULL,
    "so_nam_kinh_nghiem" INTEGER,
    "bang_cap_chung_chi" TEXT,

    CONSTRAINT "ho_so_chuyen_gia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lich_truc_nhan_su" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nhan_su_id" INTEGER NOT NULL,
    "ngay_truc" DATE NOT NULL,
    "ca_truc" VARCHAR(20) NOT NULL,
    "gio_bat_dau" TIME(6) NOT NULL,
    "gio_ket_thuc" TIME(6) NOT NULL,
    "trang_thai" VARCHAR(20) NOT NULL DEFAULT 'hoat_dong',

    CONSTRAINT "lich_truc_nhan_su_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khach_hang" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ho_ten" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255),
    "mat_khau_hash" VARCHAR(255),
    "so_dien_thoai" VARCHAR(20),
    "dia_chi" TEXT,
    "ngay_sinh" DATE,
    "gioi_tinh" VARCHAR(10),
    "trang_thai" VARCHAR(20) NOT NULL DEFAULT 'hoat_dong',

    CONSTRAINT "khach_hang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ho_so_dieu_tri" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "khach_hang_id" UUID NOT NULL,
    "trang_thai" VARCHAR(20) NOT NULL DEFAULT 'dang_dieu_tri',
    "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ho_so_dieu_tri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nhat_ky_buoi_dieu_tri" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ho_so_dieu_tri_id" UUID NOT NULL,
    "cuoc_hen_id" UUID NOT NULL,
    "nguoi_tao_id" INTEGER NOT NULL,
    "loai" VARCHAR(20) NOT NULL,
    "vas_truoc" INTEGER,
    "vas_sau" INTEGER,
    "chan_doan" TEXT,
    "chong_chi_dinh" TEXT,
    "ghi_chu" TEXT,
    "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nhat_ky_buoi_dieu_tri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chi_tiet_buoi_dieu_tri" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nhat_ky_buoi_dieu_tri_id" UUID NOT NULL,
    "dich_vu_id" UUID NOT NULL,

    CONSTRAINT "chi_tiet_buoi_dieu_tri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chi_dinh_buoi" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nhat_ky_id" UUID NOT NULL,
    "loai" VARCHAR(20) NOT NULL,
    "goi_dich_vu_id" UUID,
    "dich_vu_id" UUID,
    "ghi_chu" TEXT,

    CONSTRAINT "chi_dinh_buoi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuoc_hen" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "khach_hang_id" UUID NOT NULL,
    "nhan_su_id" INTEGER,
    "dich_vu_id" UUID,
    "phac_do_dieu_tri_id" UUID,
    "so_thu_tu_buoi" INTEGER,
    "ngay_gio_bat_dau" TIMESTAMPTZ(6) NOT NULL,
    "ngay_gio_ket_thuc" TIMESTAMPTZ(6) NOT NULL,
    "loai" VARCHAR(20) NOT NULL,
    "trang_thai" VARCHAR(20) NOT NULL DEFAULT 'cho_xac_nhan',
    "ghi_chu" TEXT,

    CONSTRAINT "cuoc_hen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "danh_muc_dich_vu" (
    "id" SERIAL NOT NULL,
    "ten" VARCHAR(100) NOT NULL,

    CONSTRAINT "danh_muc_dich_vu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dich_vu" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ten_dich_vu" VARCHAR(200) NOT NULL,
    "don_gia" BIGINT NOT NULL,
    "thoi_luong_phut" INTEGER NOT NULL,
    "danh_muc_id" INTEGER NOT NULL,
    "la_dich_vu_kham" BOOLEAN NOT NULL DEFAULT false,
    "yeu_cau_chi_dinh_kham" BOOLEAN NOT NULL DEFAULT false,
    "dang_hoat_dong" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "dich_vu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goi_dich_vu" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ten_goi" VARCHAR(200) NOT NULL,
    "mo_ta" TEXT,
    "tong_so_buoi" INTEGER NOT NULL,
    "thoi_luong_phut" INTEGER NOT NULL,
    "don_gia" BIGINT NOT NULL,
    "don_gia_theo_buoi" BIGINT NOT NULL,
    "dang_hoat_dong" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "goi_dich_vu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chi_tiet_goi" (
    "id" SERIAL NOT NULL,
    "goi_dich_vu_id" UUID NOT NULL,
    "dich_vu_id" UUID NOT NULL,

    CONSTRAINT "chi_tiet_goi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phac_do_dieu_tri" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ho_so_dieu_tri_id" UUID NOT NULL,
    "goi_dich_vu_id" UUID NOT NULL,
    "tong_so_buoi" INTEGER NOT NULL,
    "so_buoi_da_dung" INTEGER NOT NULL DEFAULT 0,
    "trang_thai" VARCHAR(20) NOT NULL DEFAULT 'cho_kich_hoat',
    "ngay_kich_hoat" DATE,
    "han_su_dung" DATE,

    CONSTRAINT "phac_do_dieu_tri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hoa_don" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "khach_hang_id" UUID NOT NULL,
    "phac_do_dieu_tri_id" UUID,
    "cuoc_hen_id" UUID,
    "tong_tien_goc" BIGINT NOT NULL DEFAULT 0,
    "hinh_thuc_thanh_toan_goi" VARCHAR(20),
    "ti_le_giam_gia_goi" INTEGER DEFAULT 0,
    "voucher_id" UUID,
    "so_tien_giam_voucher" BIGINT DEFAULT 0,
    "tong_tien_phai_tra" BIGINT NOT NULL,
    "so_tien_da_tra" BIGINT NOT NULL DEFAULT 0,
    "trang_thai" VARCHAR(30) NOT NULL DEFAULT 'chua_thanh_toan',
    "ghi_chu" TEXT,
    "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hoa_don_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "giao_dich_thanh_toan" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hoa_don_id" UUID NOT NULL,
    "so_tien" BIGINT NOT NULL,
    "loai_giao_dich" VARCHAR(20) NOT NULL,
    "phuong_thuc" VARCHAR(20) NOT NULL,
    "ma_tham_chieu" VARCHAR(100),
    "nhan_vien_thuc_hien_id" INTEGER NOT NULL,
    "ngay_giao_dich" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "giao_dich_thanh_toan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khuyen_mai_voucher" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ma_code" VARCHAR(50) NOT NULL,
    "loai_giam_gia" VARCHAR(20) NOT NULL,
    "gia_tri_giam" BIGINT NOT NULL,
    "giam_toi_da" BIGINT,
    "don_hang_toi_thieu" BIGINT NOT NULL DEFAULT 0,
    "ngay_bat_dau" TIMESTAMPTZ(6) NOT NULL,
    "ngay_het_han" TIMESTAMPTZ(6),
    "so_luong_gioi_han" INTEGER,
    "so_luong_da_dung" INTEGER NOT NULL DEFAULT 0,
    "dang_kich_hoat" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "khuyen_mai_voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "danh_gia_chat_luong" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cuoc_hen_id" UUID NOT NULL,
    "khach_hang_id" UUID NOT NULL,
    "so_sao" INTEGER NOT NULL,
    "nhan_xet" TEXT,

    CONSTRAINT "danh_gia_chat_luong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "otp" VARCHAR(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "nguoi_dung_id" INTEGER,
    "khach_hang_id" UUID,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thong_bao" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nguoi_dung_id" INTEGER,
    "khach_hang_id" UUID,
    "tieu_de" VARCHAR(200) NOT NULL,
    "noi_dung" TEXT NOT NULL,
    "loai" VARCHAR(30) NOT NULL DEFAULT 'he_thong',
    "da_doc" BOOLEAN NOT NULL DEFAULT false,
    "thoi_gian_tao" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "thong_bao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nguoi_dung_email_key" ON "nguoi_dung"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ho_so_chuyen_gia_nguoi_dung_id_key" ON "ho_so_chuyen_gia"("nguoi_dung_id");

-- CreateIndex
CREATE UNIQUE INDEX "khach_hang_email_key" ON "khach_hang"("email");

-- CreateIndex
CREATE UNIQUE INDEX "nhat_ky_buoi_dieu_tri_cuoc_hen_id_key" ON "nhat_ky_buoi_dieu_tri"("cuoc_hen_id");

-- CreateIndex
CREATE UNIQUE INDEX "khuyen_mai_voucher_ma_code_key" ON "khuyen_mai_voucher"("ma_code");

-- CreateIndex
CREATE UNIQUE INDEX "danh_gia_chat_luong_cuoc_hen_id_key" ON "danh_gia_chat_luong"("cuoc_hen_id");

-- AddForeignKey
ALTER TABLE "nguoi_dung" ADD CONSTRAINT "nguoi_dung_vai_tro_id_fkey" FOREIGN KEY ("vai_tro_id") REFERENCES "vai_tro"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ho_so_chuyen_gia" ADD CONSTRAINT "ho_so_chuyen_gia_nguoi_dung_id_fkey" FOREIGN KEY ("nguoi_dung_id") REFERENCES "nguoi_dung"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lich_truc_nhan_su" ADD CONSTRAINT "lich_truc_nhan_su_nhan_su_id_fkey" FOREIGN KEY ("nhan_su_id") REFERENCES "nguoi_dung"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ho_so_dieu_tri" ADD CONSTRAINT "ho_so_dieu_tri_khach_hang_id_fkey" FOREIGN KEY ("khach_hang_id") REFERENCES "khach_hang"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nhat_ky_buoi_dieu_tri" ADD CONSTRAINT "nhat_ky_buoi_dieu_tri_ho_so_dieu_tri_id_fkey" FOREIGN KEY ("ho_so_dieu_tri_id") REFERENCES "ho_so_dieu_tri"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nhat_ky_buoi_dieu_tri" ADD CONSTRAINT "nhat_ky_buoi_dieu_tri_cuoc_hen_id_fkey" FOREIGN KEY ("cuoc_hen_id") REFERENCES "cuoc_hen"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nhat_ky_buoi_dieu_tri" ADD CONSTRAINT "nhat_ky_buoi_dieu_tri_nguoi_tao_id_fkey" FOREIGN KEY ("nguoi_tao_id") REFERENCES "nguoi_dung"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chi_tiet_buoi_dieu_tri" ADD CONSTRAINT "chi_tiet_buoi_dieu_tri_nhat_ky_buoi_dieu_tri_id_fkey" FOREIGN KEY ("nhat_ky_buoi_dieu_tri_id") REFERENCES "nhat_ky_buoi_dieu_tri"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chi_tiet_buoi_dieu_tri" ADD CONSTRAINT "chi_tiet_buoi_dieu_tri_dich_vu_id_fkey" FOREIGN KEY ("dich_vu_id") REFERENCES "dich_vu"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chi_dinh_buoi" ADD CONSTRAINT "chi_dinh_buoi_nhat_ky_id_fkey" FOREIGN KEY ("nhat_ky_id") REFERENCES "nhat_ky_buoi_dieu_tri"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chi_dinh_buoi" ADD CONSTRAINT "chi_dinh_buoi_goi_dich_vu_id_fkey" FOREIGN KEY ("goi_dich_vu_id") REFERENCES "goi_dich_vu"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chi_dinh_buoi" ADD CONSTRAINT "chi_dinh_buoi_dich_vu_id_fkey" FOREIGN KEY ("dich_vu_id") REFERENCES "dich_vu"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cuoc_hen" ADD CONSTRAINT "cuoc_hen_khach_hang_id_fkey" FOREIGN KEY ("khach_hang_id") REFERENCES "khach_hang"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cuoc_hen" ADD CONSTRAINT "cuoc_hen_nhan_su_id_fkey" FOREIGN KEY ("nhan_su_id") REFERENCES "nguoi_dung"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cuoc_hen" ADD CONSTRAINT "cuoc_hen_dich_vu_id_fkey" FOREIGN KEY ("dich_vu_id") REFERENCES "dich_vu"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cuoc_hen" ADD CONSTRAINT "cuoc_hen_phac_do_dieu_tri_id_fkey" FOREIGN KEY ("phac_do_dieu_tri_id") REFERENCES "phac_do_dieu_tri"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dich_vu" ADD CONSTRAINT "dich_vu_danh_muc_id_fkey" FOREIGN KEY ("danh_muc_id") REFERENCES "danh_muc_dich_vu"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chi_tiet_goi" ADD CONSTRAINT "chi_tiet_goi_goi_dich_vu_id_fkey" FOREIGN KEY ("goi_dich_vu_id") REFERENCES "goi_dich_vu"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chi_tiet_goi" ADD CONSTRAINT "chi_tiet_goi_dich_vu_id_fkey" FOREIGN KEY ("dich_vu_id") REFERENCES "dich_vu"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "phac_do_dieu_tri" ADD CONSTRAINT "phac_do_dieu_tri_ho_so_dieu_tri_id_fkey" FOREIGN KEY ("ho_so_dieu_tri_id") REFERENCES "ho_so_dieu_tri"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "phac_do_dieu_tri" ADD CONSTRAINT "phac_do_dieu_tri_goi_dich_vu_id_fkey" FOREIGN KEY ("goi_dich_vu_id") REFERENCES "goi_dich_vu"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hoa_don" ADD CONSTRAINT "hoa_don_khach_hang_id_fkey" FOREIGN KEY ("khach_hang_id") REFERENCES "khach_hang"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hoa_don" ADD CONSTRAINT "hoa_don_phac_do_dieu_tri_id_fkey" FOREIGN KEY ("phac_do_dieu_tri_id") REFERENCES "phac_do_dieu_tri"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hoa_don" ADD CONSTRAINT "hoa_don_cuoc_hen_id_fkey" FOREIGN KEY ("cuoc_hen_id") REFERENCES "cuoc_hen"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hoa_don" ADD CONSTRAINT "hoa_don_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "khuyen_mai_voucher"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "giao_dich_thanh_toan" ADD CONSTRAINT "giao_dich_thanh_toan_hoa_don_id_fkey" FOREIGN KEY ("hoa_don_id") REFERENCES "hoa_don"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "giao_dich_thanh_toan" ADD CONSTRAINT "giao_dich_thanh_toan_nhan_vien_thuc_hien_id_fkey" FOREIGN KEY ("nhan_vien_thuc_hien_id") REFERENCES "nguoi_dung"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "danh_gia_chat_luong" ADD CONSTRAINT "danh_gia_chat_luong_cuoc_hen_id_fkey" FOREIGN KEY ("cuoc_hen_id") REFERENCES "cuoc_hen"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "danh_gia_chat_luong" ADD CONSTRAINT "danh_gia_chat_luong_khach_hang_id_fkey" FOREIGN KEY ("khach_hang_id") REFERENCES "khach_hang"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_khach_hang_id_fkey" FOREIGN KEY ("khach_hang_id") REFERENCES "khach_hang"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_nguoi_dung_id_fkey" FOREIGN KEY ("nguoi_dung_id") REFERENCES "nguoi_dung"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thong_bao" ADD CONSTRAINT "thong_bao_khach_hang_id_fkey" FOREIGN KEY ("khach_hang_id") REFERENCES "khach_hang"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "thong_bao" ADD CONSTRAINT "thong_bao_nguoi_dung_id_fkey" FOREIGN KEY ("nguoi_dung_id") REFERENCES "nguoi_dung"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

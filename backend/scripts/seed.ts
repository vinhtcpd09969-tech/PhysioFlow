import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting intelligent seeding for 19-table schema...');

  try {
    // 1. Seed vai_tro
    const roleCount = await prisma.vai_tro.count();
    if (roleCount === 0) {
      console.log('Seeding roles...');
      await prisma.vai_tro.createMany({
        data: [
          { id: 1, ma_vai_tro: 'khach_hang', ten_vai_tro: 'Khách hàng' },
          { id: 2, ma_vai_tro: 'le_tan', ten_vai_tro: 'Lễ tân' },
          { id: 3, ma_vai_tro: 'ky_thuat_vien', ten_vai_tro: 'Kỹ thuật viên' },
          { id: 4, ma_vai_tro: 'bac_si', ten_vai_tro: 'Bác sĩ' },
          { id: 5, ma_vai_tro: 'admin', ten_vai_tro: 'Quản trị viên' },
          { id: 6, ma_vai_tro: 'quan_ly', ten_vai_tro: 'Quản lý' },
        ],
      });
      await pool.query('SELECT setval(\'vai_tro_id_seq\', 6, true);');
    }

    // 2. Seed nguoi_dung
    const userCount = await prisma.nguoi_dung.count();
    if (userCount === 0) {
      console.log('Seeding users...');
      await prisma.nguoi_dung.createMany({
        data: [
          {
            id: 1,
            ho_ten: 'Nguyễn Admin Hệ Thống',
            email: 'admin@officecare.vn',
            so_dien_thoai: '0901000001',
            mat_khau_hash: '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', // admin123
            vai_tro_id: 5,
            trang_thai: 'hoat_dong',
          },
          {
            id: 2,
            ho_ten: 'Trần Minh Quản Lý',
            email: 'quanly@officecare.vn',
            so_dien_thoai: '0901000002',
            mat_khau_hash: '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu',
            vai_tro_id: 6,
            trang_thai: 'hoat_dong',
          },
          {
            id: 3,
            ho_ten: 'Lê Thị Hoa',
            email: 'letan1@officecare.vn',
            so_dien_thoai: '0901000003',
            mat_khau_hash: '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu',
            vai_tro_id: 2,
            trang_thai: 'hoat_dong',
          },
          {
            id: 4,
            ho_ten: 'Phạm Ngọc Mai',
            email: 'letan2@officecare.vn',
            so_dien_thoai: '0901000004',
            mat_khau_hash: '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu',
            vai_tro_id: 2,
            trang_thai: 'hoat_dong',
          },
          {
            id: 5,
            ho_ten: 'BS. Nguyễn Văn Khoa',
            email: 'bacsi1@officecare.vn',
            so_dien_thoai: '0901000005',
            mat_khau_hash: '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu',
            vai_tro_id: 4,
            trang_thai: 'hoat_dong',
          },
          {
            id: 6,
            ho_ten: 'BS. Trần Thị Lan Anh',
            email: 'bacsi2@officecare.vn',
            so_dien_thoai: '0901000006',
            mat_khau_hash: '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu',
            vai_tro_id: 4,
            trang_thai: 'hoat_dong',
          },
          {
            id: 7,
            ho_ten: 'KTV. Đỗ Thanh Tùng',
            email: 'ktv1@officecare.vn',
            so_dien_thoai: '0901000007',
            mat_khau_hash: '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu',
            vai_tro_id: 3,
            trang_thai: 'hoat_dong',
          },
          {
            id: 8,
            ho_ten: 'KTV. Nguyễn Thị Bích',
            email: 'ktv2@officecare.vn',
            so_dien_thoai: '0901000008',
            mat_khau_hash: '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu',
            vai_tro_id: 3,
            trang_thai: 'hoat_dong',
          },
          {
            id: 9,
            ho_ten: 'KTV. Hoàng Văn Minh',
            email: 'ktv3@officecare.vn',
            so_dien_thoai: '0901000009',
            mat_khau_hash: '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu',
            vai_tro_id: 3,
            trang_thai: 'hoat_dong',
          },
          {
            id: 10,
            ho_ten: 'KTV. Vũ Thị Thanh',
            email: 'ktv4@officecare.vn',
            so_dien_thoai: '0901000010',
            mat_khau_hash: '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu',
            vai_tro_id: 3,
            trang_thai: 'hoat_dong',
          },
        ],
      });
      await pool.query('SELECT setval(\'nguoi_dung_id_seq\', 10, true);');
    }

    // 3. Seed ho_so_chuyen_gia
    const expertCount = await prisma.ho_so_chuyen_gia.count();
    if (expertCount === 0) {
      console.log('Seeding expert profiles...');
      await prisma.ho_so_chuyen_gia.createMany({
        data: [
          { id: 1, nguoi_dung_id: 5, so_nam_kinh_nghiem: 8, bang_cap_chung_chi: 'Chứng chỉ VLTL - Bộ Y Tế' },
          { id: 2, nguoi_dung_id: 6, so_nam_kinh_nghiem: 6, bang_cap_chung_chi: 'Chứng chỉ YHCT - Bộ Y Tế' },
          { id: 3, nguoi_dung_id: 7, so_nam_kinh_nghiem: 5, bang_cap_chung_chi: 'Chứng chỉ KTV VLTL' },
          { id: 4, nguoi_dung_id: 8, so_nam_kinh_nghiem: 4, bang_cap_chung_chi: 'Chứng chỉ KTV VLTL' },
          { id: 5, nguoi_dung_id: 9, so_nam_kinh_nghiem: 3, bang_cap_chung_chi: 'Chứng chỉ KTV VLTL' },
          { id: 6, nguoi_dung_id: 10, so_nam_kinh_nghiem: 3, bang_cap_chung_chi: 'Chứng chỉ KTV Massage' },
        ],
      });
      await pool.query('SELECT setval(\'ho_so_chuyen_gia_id_seq\', 6, true);');
    }

    // 4. Seed khach_hang
    const customerCount = await prisma.khach_hang.count();
    if (customerCount === 0) {
      console.log('Seeding customers...');
      await prisma.khach_hang.createMany({
        data: [
          {
            id: '10000000-0000-0000-0000-000000000011',
            ho_ten: 'Nguyễn Văn An',
            email: 'kh1@gmail.com',
            so_dien_thoai: '0912000011',
            mat_khau_hash: '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu',
            dia_chi: '12 Nguyễn Huệ, Q1, TP.HCM',
            ngay_sinh: new Date('1988-03-15'),
            gioi_tinh: 'nam',
            trang_thai: 'hoat_dong',
          },
          {
            id: '10000000-0000-0000-0000-000000000012',
            ho_ten: 'Trần Thị Bảo',
            email: 'kh2@gmail.com',
            so_dien_thoai: '0912000012',
            mat_khau_hash: '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu',
            dia_chi: '45 Lê Lợi, Q1, TP.HCM',
            ngay_sinh: new Date('1992-07-22'),
            gioi_tinh: 'nu',
            trang_thai: 'hoat_dong',
          },
          {
            id: '10000000-0000-0000-0000-000000000013',
            ho_ten: 'Lê Quang Cường',
            email: 'kh3@gmail.com',
            so_dien_thoai: '0912000013',
            mat_khau_hash: '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu',
            dia_chi: '78 Trần Hưng Đạo, Q5, TP.HCM',
            ngay_sinh: new Date('1985-11-08'),
            gioi_tinh: 'nam',
            trang_thai: 'hoat_dong',
          },
          {
            id: '10000000-0000-0000-0000-000000000014',
            ho_ten: 'Phạm Thị Dung',
            email: 'kh4@gmail.com',
            so_dien_thoai: '0912000014',
            mat_khau_hash: '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu',
            dia_chi: '23 Điện Biên Phủ, Q3, TP.HCM',
            ngay_sinh: new Date('1995-04-30'),
            gioi_tinh: 'nu',
            trang_thai: 'hoat_dong',
          },
        ],
      });
    }

    // 4.5. Seed danh_muc_goi
    const catCount = await prisma.danh_muc_goi.count();
    if (catCount === 0) {
      console.log('Seeding package categories...');
      await prisma.danh_muc_goi.createMany({
        data: [
          { id: 'd1000000-0000-0000-0000-000000000001', ten_danh_muc: 'Khám & Lượng Giá Chuyên Sâu', mo_ta: 'Các gói khám và đánh giá ban đầu với Bác sĩ', loai_goi_ap_dung: 'KHAM' },
          { id: 'd1000000-0000-0000-0000-000000000002', ten_danh_muc: 'Trị Liệu Giải Quyết Cơn Đau', mo_ta: 'Các gói lẻ điện xung, laser, sóng xung kích điều trị triệu chứng', loai_goi_ap_dung: 'LE' },
          { id: 'd1000000-0000-0000-0000-000000000003', ten_danh_muc: 'Phục Hồi Chức Năng Chuyên Sâu', mo_ta: 'Các gói liệu trình chuyên sâu điều trị phục hồi cột sống, khớp xương gối', loai_goi_ap_dung: 'LIEU_TRINH' },
        ]
      });
    }

    // 5. Seed goi_dich_vu (Unified Packages)
    const pkgCount = await prisma.goi_dich_vu.count();
    if (pkgCount === 0) {
      console.log('Seeding unified packages...');
      await prisma.goi_dich_vu.createMany({
        data: [
          // 5.1 Gói Khám (KHAM)
          {
            id: 'c1000000-0000-0000-0000-000000000000',
            ten_goi: 'Khám lâm sàng & Lượng giá chức năng cơ xương khớp',
            loai_goi: 'KHAM',
            tong_so_buoi: 1,
            thoi_luong_phut: 30,
            don_gia: BigInt(200000),
            don_gia_theo_buoi: BigInt(200000),
            mo_ta: 'Bác sĩ khám lâm sàng, lượng giá tầm vận động cột sống, kiểm tra biến dạng khớp và lên phác đồ điều trị.',
            trang_thai: 'hoat_dong',
            danh_muc_goi_id: 'd1000000-0000-0000-0000-000000000001',
          },
          // 5.2 Gói Lẻ (LE)
          {
            id: 'c1000000-0000-0000-0000-000000000101',
            ten_goi: 'Trị liệu Laser công suất cao giảm sưng viêm',
            loai_goi: 'LE',
            tong_so_buoi: 1,
            thoi_luong_phut: 15,
            don_gia: BigInt(250000),
            don_gia_theo_buoi: BigInt(250000),
            mo_ta: 'Sử dụng tia Laser cao tần kích thích sâu dưới da, tăng tuần hoàn và giảm sưng viêm tại chỗ khớp xương.',
            trang_thai: 'hoat_dong',
            danh_muc_goi_id: 'd1000000-0000-0000-0000-000000000002',
          },
          {
            id: 'c1000000-0000-0000-0000-000000000102',
            ten_goi: 'Trị liệu sóng xung kích Focused Shockwave',
            loai_goi: 'LE',
            tong_so_buoi: 1,
            thoi_luong_phut: 20,
            don_gia: BigInt(300000),
            don_gia_theo_buoi: BigInt(300000),
            mo_ta: 'Giải tỏa điểm kích hoạt đau (trigger points), hóa lỏng các điểm xơ hóa cơ bằng xung kích cơ học.',
            trang_thai: 'hoat_dong',
            danh_muc_goi_id: 'd1000000-0000-0000-0000-000000000002',
          },
          {
            id: 'c1000000-0000-0000-0000-000000000103',
            ten_goi: 'Giải cơ sâu & màng cơ chuyên sâu Myofascial Release',
            loai_goi: 'LE',
            tong_so_buoi: 1,
            thoi_luong_phut: 45,
            don_gia: BigInt(350000),
            don_gia_theo_buoi: BigInt(350000),
            mo_ta: 'Kỹ thuật viên xoa bóp, di động cơ học chuyên sâu giải phóng các bó cơ co thắt gây đau đầu, vai gáy, thắt lưng.',
            trang_thai: 'hoat_dong',
            danh_muc_goi_id: 'd1000000-0000-0000-0000-000000000002',
          },
          // 5.3 Gói Liệu Trình (LIEU_TRINH)
          {
            id: 'c1000000-0000-0000-0000-000000000001',
            ten_goi: 'Gói Phục Hồi Cột Sống & Đau Vai Gáy Chuyên Sâu',
            loai_goi: 'LIEU_TRINH',
            tong_so_buoi: 8,
            thoi_luong_phut: 60,
            don_gia: BigInt(3200000),
            don_gia_theo_buoi: BigInt(400000),
            mo_ta: 'Mỗi buổi KTV thực hiện: Điện xung giảm đau vai gáy (15 phút), Nhiệt trị liệu làm mềm cơ (15 phút), và Nắn chỉnh di động khớp cổ (30 phút).',
            trang_thai: 'hoat_dong',
            danh_muc_goi_id: 'd1000000-0000-0000-0000-000000000003',
          },
          {
            id: 'c1000000-0000-0000-0000-000000000002',
            ten_goi: 'Gói Trị Liệu Thoát Vị Đĩa Đệm Cột Sống Thắt Lưng',
            loai_goi: 'LIEU_TRINH',
            tong_so_buoi: 10,
            thoi_luong_phut: 60,
            don_gia: BigInt(4500000),
            don_gia_theo_buoi: BigInt(450000),
            mo_ta: 'Mỗi buổi KTV thực hiện: Kéo giãn cột sống cổ/thắt lưng giảm áp đĩa đệm (20 phút), Laser công suất cao giảm viêm rễ thần kinh (15 phút), và Tập phục hồi nhóm cơ lõi thắt lưng (25 phút).',
            trang_thai: 'hoat_dong',
            danh_muc_goi_id: 'd1000000-0000-0000-0000-000000000003',
          },
          {
            id: 'c1000000-0000-0000-0000-000000000003',
            ten_goi: 'Gói Phục Hồi Chấn Thương Thể Thao & Viêm Gân Cấp',
            loai_goi: 'LIEU_TRINH',
            tong_so_buoi: 12,
            thoi_luong_phut: 60,
            don_gia: BigInt(5400000),
            don_gia_theo_buoi: BigInt(450000),
            mo_ta: 'Mỗi buổi KTV thực hiện: Trị liệu sóng xung kích hội tụ Focused Shockwave (20 phút), Laser tiêu viêm sâu (15 phút), và Tập Kinetic Rehab tăng sức mạnh gân cơ dây chằng (25 phút).',
            trang_thai: 'hoat_dong',
            danh_muc_goi_id: 'd1000000-0000-0000-0000-000000000003',
          },
        ],
      });
    }

    // 6. Seed khuyen_mai_voucher
    const voucherCount = await prisma.khuyen_mai_voucher.count();
    if (voucherCount === 0) {
      console.log('Seeding vouchers...');
      await prisma.khuyen_mai_voucher.createMany({
        data: [
          {
            id: '50000000-0000-0000-0000-000000000001',
            ma_code: 'WELCOME10',
            loai_giam_gia: 'phan_tram',
            gia_tri_giam: BigInt(10),
            giam_toi_da: BigInt(200000),
            don_hang_toi_thieu: BigInt(500000),
            ngay_bat_dau: new Date('2026-06-29T00:00:00Z'),
            ngay_het_han: new Date('2026-09-27T00:00:00Z'),
            so_luong_gioi_han: 100,
            so_luong_da_dung: 0,
            dang_kich_hoat: true,
          },
          {
            id: '50000000-0000-0000-0000-000000000002',
            ma_code: 'SUMMER200',
            loai_giam_gia: 'tien_mat',
            gia_tri_giam: BigInt(200000),
            giam_toi_da: BigInt(200000),
            don_hang_toi_thieu: BigInt(1000000),
            ngay_bat_dau: new Date('2026-06-29T00:00:00Z'),
            ngay_het_han: new Date('2026-07-29T00:00:00Z'),
            so_luong_gioi_han: 50,
            so_luong_da_dung: 0,
            dang_kich_hoat: true,
          },
        ],
      });
    }

    // 7. Seed phong_lam_viec
    const roomCount = await prisma.phong_lam_viec.count();
    if (roomCount === 0) {
      console.log('Seeding rooms...');
      await prisma.phong_lam_viec.createMany({
        data: [
          { id: 1, ten_phong: 'Phòng Khám Lâm Sàng 01', ma_phong: 'PK-01', loai_phong: 'phong_kham', suc_chua: 2, trang_thai: 'san_sang', mo_ta: 'Phòng khám bệnh lâm sàng ban đầu' },
          { id: 2, ten_phong: 'Phòng Trị Liệu 01', ma_phong: 'TL-01', loai_phong: 'phong_tri_lieu', suc_chua: 4, trang_thai: 'san_sang', mo_ta: 'Phòng trị liệu cơ bản' },
          { id: 3, ten_phong: 'Phòng Tập Phục Hồi Chức Năng', ma_phong: 'PHCN-01', loai_phong: 'phong_tap', suc_chua: 6, trang_thai: 'san_sang', mo_ta: 'Phòng tập PHCN chuyên biệt' },
          { id: 4, ten_phong: 'Phòng Trị Liệu Đặc Biệt', ma_phong: 'TL-DB', loai_phong: 'phong_tri_lieu', suc_chua: 2, trang_thai: 'san_sang', mo_ta: 'Phòng trị liệu cao cấp' },
        ],
      });
      await pool.query('SELECT setval(\'phong_lam_viec_id_seq\', 4, true);');
    }

    // 8. Seed thiet_bi
    const eqCount = await prisma.thiet_bi.count();
    if (eqCount === 0) {
      console.log('Seeding equipment...');
      await prisma.thiet_bi.createMany({
        data: [
          { id: '90000000-0000-0000-0000-000000000001', ma_thiet_bi: 'LASER-01', ten_thiet_bi: 'Máy Laser trị liệu công suất cao', ngay_mua: new Date('2025-01-10'), trang_thai: 'san_sang', ghi_chu: 'Máy điều trị viêm sưng' },
          { id: '90000000-0000-0000-0000-000000000002', ma_thiet_bi: 'SHOCK-01', ten_thiet_bi: 'Máy sóng xung kích hội tụ Focused Shockwave', ngay_mua: new Date('2025-02-15'), trang_thai: 'san_sang', ghi_chu: 'Máy xung kích giảm đau điểm kích hoạt' },
          { id: '90000000-0000-0000-0000-000000000003', ma_thiet_bi: 'US-01', ten_thiet_bi: 'Máy siêu âm trị liệu', ngay_mua: new Date('2024-11-20'), trang_thai: 'san_sang', ghi_chu: 'Siêu âm giảm co thắt' },
          { id: '90000000-0000-0000-0000-000000000004', ma_thiet_bi: 'TRACT-01', ten_thiet_bi: 'Giường kéo giãn cột sống áp lực âm', ngay_mua: new Date('2024-12-05'), trang_thai: 'san_sang', ghi_chu: 'Giường kéo giãn cổ/thắt lưng' },
          { id: '90000000-0000-0000-0000-000000000005', ma_thiet_bi: 'BIO-01', ten_thiet_bi: 'Thiết bị phản hồi sinh học Biofeedback', ngay_mua: new Date('2025-03-01'), trang_thai: 'dang_bao_tri', ghi_chu: 'Bảo trì định kỳ hàng tháng' },
        ],
      });
    }

    console.log('🎉 Seeding successfully completed for 19-table schema!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();

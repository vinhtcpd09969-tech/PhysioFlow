import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { fakerVI as faker } from '@faker-js/faker';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/office_care',
});

const clearDatabase = async () => {
  console.log('Đang xóa dữ liệu cũ...');
  await pool.query(`
    TRUNCATE TABLE 
      nguoi_dung, vai_tro, khach_hang, ky_thuat_vien, danh_muc_dich_vu, dich_vu,
      hoa_don, thanh_toan, voucher, lich_dat, buoi_tri_lieu, danh_gia_dich_vu
    CASCADE;
    ALTER SEQUENCE vai_tro_id_seq RESTART WITH 1;
  `);
};

const seedRoles = async () => {
  console.log('Seeding roles...');
  const { rows } = await pool.query(`
    INSERT INTO vai_tro (ma_vai_tro, ten_hien_thi, mo_ta_quyen) VALUES
      ('khach_hang', 'Khách hàng', 'Xem lịch của mình, đặt lịch, xem gói, gửi feedback'),
      ('le_tan', 'Lễ tân', 'Quản lý lịch hẹn, check-in, tạo hóa đơn, thu tiền'),
      ('ky_thuat_vien', 'Kỹ thuật viên', 'Xem lịch của mình, tạo đánh giá, ghi chú buổi, đề xuất gói'),
      ('bac_si', 'Bác sĩ', 'Quản lý phác đồ điều trị, chẩn đoán, xem hồ sơ bệnh án'),
      ('admin', 'Quản trị viên', 'Toàn quyền hệ thống')
    RETURNING id, ma_vai_tro;
  `);
  return rows.reduce((acc, row) => ({ ...acc, [row.ma_vai_tro]: row.id }), {});
};

const seedUsers = async (roles: any) => {
  console.log('Seeding users...');
  const passwordHash = await bcrypt.hash('123456', 10);
  
  // Admin
  const { rows: adminRows } = await pool.query(`
    INSERT INTO nguoi_dung (ho_ten, email, so_dien_thoai, mat_khau_hash, vai_tro_id)
    VALUES ('Admin Master', 'admin@officecare.com', '0901234567', $1, $2) RETURNING id
  `, [passwordHash, roles['admin']]);
  const adminId = adminRows[0].id;

  // Lễ tân
  await pool.query(`
    INSERT INTO nguoi_dung (ho_ten, email, so_dien_thoai, mat_khau_hash, vai_tro_id)
    VALUES ('Lễ tân 1', 'letan@officecare.com', '0901234568', $1, $2)
  `, [passwordHash, roles['le_tan']]);

  // KTVs
  const ktvUsers = [];
  for (let i = 1; i <= 5; i++) {
    const { rows } = await pool.query(`
      INSERT INTO nguoi_dung (ho_ten, email, so_dien_thoai, mat_khau_hash, vai_tro_id)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [`KTV ${faker.person.fullName()}`, `ktv${i}@officecare.com`, faker.phone.number(), passwordHash, roles['ky_thuat_vien']]);
    ktvUsers.push(rows[0].id);

    await pool.query(`
      INSERT INTO ky_thuat_vien (nguoi_dung_id, ma_nhan_vien, chuyen_mon_chinh, so_nam_kinh_nghiem)
      VALUES ($1, $2, $3, $4)
    `, [rows[0].id, `KTV${String(i).padStart(3, '0')}`, 'Vật lý trị liệu', faker.number.int({ min: 1, max: 10 })]);
  }

  // Khách hàng
  const customerUsers = [];
  for (let i = 1; i <= 20; i++) {
    const { rows } = await pool.query(`
      INSERT INTO nguoi_dung (ho_ten, email, so_dien_thoai, mat_khau_hash, vai_tro_id)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [faker.person.fullName(), faker.internet.email(), faker.phone.number(), passwordHash, roles['khach_hang']]);
    
    const { rows: khRows } = await pool.query(`
      INSERT INTO khach_hang (nguoi_dung_id, ngay_sinh, gioi_tinh, hang_khach_hang)
      VALUES ($1, $2, $3, $4) RETURNING id
    `, [rows[0].id, faker.date.birthdate({ min: 18, max: 65, mode: 'age' }), faker.helpers.arrayElement(['nam', 'nu']), faker.helpers.arrayElement(['thuong', 'bac', 'vang'])]);
    customerUsers.push(khRows[0].id);
  }

  return { ktvUsers, customerUsers, adminId };
};

const seedServices = async () => {
  console.log('Seeding services...');
  
  // Danh mục
  const { rows: categories } = await pool.query(`
    INSERT INTO danh_muc_dich_vu (ten_danh_muc, mo_ta) VALUES
    ('Khám & Tư vấn', 'Khám lâm sàng và lượng giá'),
    ('Vật lý trị liệu', 'Các phương pháp trị liệu cơ xương khớp'),
    ('Phục hồi chức năng', 'Tập vận động phục hồi sau chấn thương')
    RETURNING id;
  `);

  // Dịch vụ
  const services = [
    { catId: categories[0].id, name: 'Khám lượng giá ban đầu', price: 300000, duration: 30 },
    { catId: categories[1].id, name: 'Siêu âm trị liệu', price: 250000, duration: 45 },
    { catId: categories[1].id, name: 'Điện xung trị liệu', price: 200000, duration: 45 },
    { catId: categories[2].id, name: 'Tập vận động thụ động', price: 400000, duration: 60 },
  ];

  const serviceIds = [];
  for (const s of services) {
    const { rows } = await pool.query(`
      INSERT INTO dich_vu (danh_muc_id, ten_dich_vu, thoi_luong_phut, don_gia)
      VALUES ($1, $2, $3, $4) RETURNING id
    `, [s.catId, s.name, s.duration, s.price]);
    serviceIds.push({ id: rows[0].id, price: s.price });
  }

  return serviceIds;
};

const seedInvoicesAndAnalytics = async (customerIds: string[], serviceIds: any[]) => {
  console.log('Seeding invoices and analytics...');
  
  // Tạo dữ liệu doanh thu trong 6 tháng qua
  for (let i = 0; i < 50; i++) {
    const customer = faker.helpers.arrayElement(customerIds);
    const service = faker.helpers.arrayElement(serviceIds);
    const date = faker.date.past({ years: 0.5 }); // Trong 6 tháng qua

    // 1. Tạo hóa đơn
    const { rows: invRows } = await pool.query(`
      INSERT INTO hoa_don (ma_hoa_don, khach_hang_id, loai_hoa_don, tong_tien_truoc_giam, tong_tien_thanh_toan, da_thanh_toan, trang_thai, ngay_tao)
      VALUES ($1, $2, 'dich_vu_don', $3, $3, $3, 'da_thanh_toan', $4) RETURNING id
    `, [`HD${faker.string.numeric(6)}`, customer, service.price, date]);

    // 2. Tạo thanh toán
    await pool.query(`
      INSERT INTO thanh_toan (hoa_don_id, ma_giao_dich, so_tien, phuong_thuc, trang_thai, thoi_gian_giao_dich)
      VALUES ($1, $2, $3, 'chuyen_khoan', 'thanh_cong', $4)
    `, [invRows[0].id, `GD${faker.string.numeric(8)}`, service.price, date]);
  }
};

const seedFeedback = async (customerIds: string[]) => {
  console.log('Seeding feedbacks...');
  
  // Lấy danh sách KTV thực tế
  const { rows: ktvs } = await pool.query('SELECT id FROM ky_thuat_vien');
  
  // Cần ít nhất 1 buổi trị liệu để đánh giá
  const { rows: services } = await pool.query('SELECT id FROM dich_vu LIMIT 1');
  if(services.length === 0 || ktvs.length === 0) return;

  for (let i = 0; i < 15; i++) {
    const customer = faker.helpers.arrayElement(customerIds);
    const ktv = faker.helpers.arrayElement(ktvs).id;
    
    // Giả lập lịch đặt
    const { rows: ld } = await pool.query(`
      INSERT INTO lich_dat (ma_lich_dat, khach_hang_id, dich_vu_id, ky_thuat_vien_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, loai_lich, trang_thai)
      VALUES ($1, $2, $3, $4, NOW() - interval '${i} days', NOW() - interval '${i} days' + interval '1 hour', 'dich_vu_don', 'hoan_thanh') RETURNING id
    `, [`LD${faker.string.numeric(6)}`, customer, services[0].id, ktv]);

    // Giả lập buổi trị liệu
    const { rows: btl } = await pool.query(`
      INSERT INTO buoi_tri_lieu (lich_dat_id, dich_vu_id, ky_thuat_vien_id, khach_hang_id, trang_thai, thoi_gian_bat_dau, thoi_gian_ket_thuc)
      VALUES ($1, $2, $3, $4, 'hoan_thanh', NOW() - interval '${i} days', NOW() - interval '${i} days' + interval '1 hour') RETURNING id
    `, [ld[0].id, services[0].id, ktv, customer]);

    await pool.query(`
      INSERT INTO danh_gia_dich_vu (khach_hang_id, buoi_tri_lieu_id, ky_thuat_vien_id, so_sao_tong, so_sao_ktv, nhan_xet, hieu_qua_dieu_tri, thoi_gian_danh_gia)
      VALUES ($1, $2, $3, $4, $4, $5, 'tot', NOW() - interval '${i} days' + interval '2 hours')
    `, [customer, btl[0].id, ktv, faker.number.int({ min: 3, max: 5 }), faker.lorem.sentence()]);
  }
};

const seedVouchers = async (adminId: string) => {
  console.log('Seeding vouchers...');
  await pool.query(`
    INSERT INTO voucher (ma_voucher, ten_chien_dich, loai_giam, gia_tri_giam, don_hang_toi_thieu, ngay_bat_dau, ngay_het_han, trang_thai, tao_boi) VALUES
    ('SUMMER2024', 'Khuyến mãi Hè 2024', 'phan_tram', 15, 500000, NOW() - interval '1 month', NOW() + interval '1 month', 'hoat_dong', $1),
    ('NEWUSER', 'Khách hàng mới', 'so_tien_co_dinh', 100000, 0, NOW() - interval '1 year', NOW() + interval '1 year', 'hoat_dong', $1)
  `, [adminId]);
};

const runSeed = async () => {
  try {
    await clearDatabase();
    const roles = await seedRoles();
    const { ktvUsers, customerUsers, adminId } = await seedUsers(roles);
    const services = await seedServices();
    await seedInvoicesAndAnalytics(customerUsers, services);
    await seedFeedback(customerUsers);
    await seedVouchers(adminId);

    console.log('✅ Seed dữ liệu thành công!');
  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu:', error);
  } finally {
    pool.end();
  }
};

runSeed();

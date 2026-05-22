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
      nguoi_dung, vai_tro, khach_hang, chuyen_gia_y_te, danh_muc_dich_vu, dich_vu,
      hoa_don, thanh_toan, voucher, phong, lich_dat, buoi_tri_lieu, danh_gia_dich_vu,
      goi_dich_vu, goi_dich_vu_chi_tiet, lich_dieu_tri, thiet_bi_y_te, lich_lam_viec
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
    INSERT INTO nguoi_dung (ho_ten, email, so_dien_thoai, mat_khau_hash, vai_tro_id, da_xac_thuc_email)
    VALUES ('Admin Master', 'admin@officecare.com', '0901234567', $1, $2, TRUE) RETURNING id
  `, [passwordHash, roles['admin']]);
  const adminId = adminRows[0].id;

  // Lễ tân
  const { rows: leTanRows } = await pool.query(`
    INSERT INTO nguoi_dung (ho_ten, email, so_dien_thoai, mat_khau_hash, vai_tro_id, da_xac_thuc_email)
    VALUES ('Lễ tân 1', 'letan@officecare.com', '0901234568', $1, $2, TRUE) RETURNING id
  `, [passwordHash, roles['le_tan']]);
  const leTanId = leTanRows[0].id;

  // Bác sĩ
  const { rows: bacSiRows } = await pool.query(`
    INSERT INTO nguoi_dung (ho_ten, email, so_dien_thoai, mat_khau_hash, vai_tro_id, da_xac_thuc_email)
    VALUES ('BS Trần Văn Khám', 'bacsi@officecare.com', '0901234569', $1, $2, TRUE) RETURNING id
  `, [passwordHash, roles['bac_si']]);
  const bacSiId = bacSiRows[0].id;

  await pool.query(`
    INSERT INTO chuyen_gia_y_te (nguoi_dung_id, ma_nhan_vien, chuyen_mon_chinh, so_nam_kinh_nghiem)
    VALUES ($1, 'BS001', 'Bác sĩ chuyên khoa', 10)
  `, [bacSiId]);

  // KTVs
  const ktvUsers = [];
  for (let i = 1; i <= 5; i++) {
    const { rows } = await pool.query(`
      INSERT INTO nguoi_dung (ho_ten, email, so_dien_thoai, mat_khau_hash, vai_tro_id, da_xac_thuc_email)
      VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id
    `, [`KTV ${faker.person.fullName()}`, `ktv${i}@officecare.com`, faker.phone.number(), passwordHash, roles['ky_thuat_vien']]);
    ktvUsers.push(rows[0].id);

    await pool.query(`
      INSERT INTO chuyen_gia_y_te (nguoi_dung_id, ma_nhan_vien, chuyen_mon_chinh, so_nam_kinh_nghiem)
      VALUES ($1, $2, $3, $4)
    `, [rows[0].id, `KTV${String(i).padStart(3, '0')}`, 'Vật lý trị liệu', faker.number.int({ min: 1, max: 10 })]);
  }

  // Khách hàng
  const customerUsers = [];
  for (let i = 1; i <= 20; i++) {
    const { rows } = await pool.query(`
      INSERT INTO nguoi_dung (ho_ten, email, so_dien_thoai, mat_khau_hash, vai_tro_id, da_xac_thuc_email)
      VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id
    `, [faker.person.fullName(), faker.internet.email(), faker.phone.number(), passwordHash, roles['khach_hang']]);

    const { rows: khRows } = await pool.query(`
      INSERT INTO khach_hang (nguoi_dung_id, ngay_sinh, gioi_tinh, hang_khach_hang)
      VALUES ($1, $2, $3, $4) RETURNING id
    `, [rows[0].id, faker.date.birthdate({ min: 18, max: 65, mode: 'age' }), faker.helpers.arrayElement(['nam', 'nu']), faker.helpers.arrayElement(['thuong', 'bac', 'vang'])]);
    customerUsers.push(khRows[0].id);
  }

  return { ktvUsers, customerUsers, adminId, leTanId, bacSiId };
};

const seedServices = async () => {
  console.log('Seeding services...');

  // Danh mục
  const { rows: categories } = await pool.query(`
    INSERT INTO danh_muc_dich_vu (ten_danh_muc, mo_ta) VALUES
    ('Khám & Lượng giá', 'Khám lâm sàng và đánh giá tư thế'),
    ('Trị liệu chuyên sâu', 'Các liệu trình trị liệu cơ xương khớp chuyên sâu cho dân văn phòng'),
    ('Phục hồi & Phòng ngừa', 'Tập luyện phục hồi chức năng và định hình tư thế')
    RETURNING id;
  `);

  // Dịch vụ
  const services = [
    { catId: categories[0].id, name: 'Khám lượng giá cột sống & tư thế', price: 150000, duration: 30, type: 'chinh' },
    { catId: categories[1].id, name: 'Trị liệu Cổ Vai Gáy cấp tốc (Giải cứu giờ trưa)', price: 250000, duration: 45, type: 'chinh' },
    { catId: categories[1].id, name: 'Trị liệu Hội chứng văn phòng chuyên sâu', price: 390000, duration: 75, type: 'chinh' },
    { catId: categories[2].id, name: 'Phục hồi cột sống & Định hình tư thế', price: 590000, duration: 90, type: 'chinh' },
    { catId: categories[1].id, name: 'Chườm nóng hồng ngoại giảm đau', price: 80000, duration: 15, type: 'bo_sung' },
    { catId: categories[2].id, name: 'Đắp Paraffin trị liệu khớp bàn tay', price: 120000, duration: 25, type: 'bo_sung' }
  ];

  const serviceIds = [];
  for (const s of services) {
    const { rows } = await pool.query(`
      INSERT INTO dich_vu (danh_muc_id, ten_dich_vu, thoi_luong_phut, don_gia, loai_dich_vu)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [s.catId, s.name, s.duration, s.price, s.type]);
    serviceIds.push({ id: rows[0].id, name: s.name, price: s.price });
  }

  return serviceIds;
};

const seedPackages = async (services: any[]) => {
  console.log('Seeding packages...');

  // Tìm các dịch vụ tương ứng
  const g1Service = services.find(s => s.name === 'Trị liệu Cổ Vai Gáy cấp tốc (Giải cứu giờ trưa)');
  const g2Service = services.find(s => s.name === 'Trị liệu Hội chứng văn phòng chuyên sâu');
  const g3Service = services.find(s => s.name === 'Phục hồi cột sống & Định hình tư thế');

  if (!g1Service || !g2Service || !g3Service) {
    console.error('Không tìm thấy dịch vụ tương ứng để seed gói!');
    return;
  }

  const package1Details = JSON.stringify([
    { dich_vu_id: g1Service.id, so_buoi: 5 }
  ]);
  const package2Details = JSON.stringify([
    { dich_vu_id: g2Service.id, so_buoi: 10 }
  ]);
  const package3Details = JSON.stringify([
    { dich_vu_id: g3Service.id, so_buoi: 15 }
  ]);

  // Insert packages
  const { rows: p1Rows } = await pool.query(`
    INSERT INTO goi_dich_vu (ten_goi, ma_goi, mo_ta, tong_so_buoi, gia_goi, gia_goc, han_dung_thang, hien_thi_website, trang_thai, chi_tiet_dich_vu)
    VALUES ('Combo 5 buổi - Giải cứu cột sống cấp tốc', 'PKG-5-SPINE', 'Cắt nhanh cơn đau thắt lưng, vai gáy cấp tính cho người ngồi làm việc nhiều.', 5, 1180000, 1250000, 3, true, 'hoat_dong', $1)
    RETURNING id
  `, [package1Details]);
  const p1Id = p1Rows[0].id;

  const { rows: p2Rows } = await pool.query(`
    INSERT INTO goi_dich_vu (ten_goi, ma_goi, mo_ta, tong_so_buoi, gia_goi, gia_goc, han_dung_thang, hien_thi_website, trang_thai, chi_tiet_dich_vu)
    VALUES ('Combo 10 buổi - Tái tạo & Trị liệu chuyên sâu', 'PKG-10-OFFICE', 'Liệu trình 10 buổi trị liệu dứt điểm cơn đau vai gáy, tê bì tay chân mãn tính.', 10, 3400000, 3900000, 6, true, 'hoat_dong', $1)
    RETURNING id
  `, [package2Details]);
  const p2Id = p2Rows[0].id;

  const { rows: p3Rows } = await pool.query(`
    INSERT INTO goi_dich_vu (ten_goi, ma_goi, mo_ta, tong_so_buoi, gia_goi, gia_goc, han_dung_thang, hien_thi_website, trang_thai, chi_tiet_dich_vu)
    VALUES ('Combo 15 buổi - Định hình tư thế & Bảo dưỡng trọn đời', 'PKG-15-POSTURE', 'Liệu trình 15 buổi sửa hoàn toàn tư thế gù lưng, cổ rùa, lệch xương chậu.', 15, 7000000, 8850000, 9, true, 'hoat_dong', $1)
    RETURNING id
  `, [package3Details]);
  const p3Id = p3Rows[0].id;

  // Insert package services details
  await pool.query(`
    INSERT INTO goi_dich_vu_chi_tiet (goi_dich_vu_id, dich_vu_id, so_buoi_trong_goi)
    VALUES 
      ($1, $2, 5),
      ($3, $4, 10),
      ($5, $6, 15)
  `, [
    p1Id, g1Service.id,
    p2Id, g2Service.id,
    p3Id, g3Service.id
  ]);
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
  const { rows: ktvs } = await pool.query('SELECT id FROM chuyen_gia_y_te');

  // Cần ít nhất 1 buổi trị liệu để đánh giá
  const { rows: services } = await pool.query('SELECT id FROM dich_vu LIMIT 1');
  if (services.length === 0 || ktvs.length === 0) return;

  for (let i = 0; i < 15; i++) {
    const customer = faker.helpers.arrayElement(customerIds);
    const ktv = faker.helpers.arrayElement(ktvs).id;

    // Giả lập lịch đặt khám ban đầu (Bác sĩ)
    const { rows: ld } = await pool.query(`
      INSERT INTO lich_dat (ma_lich_dat, khach_hang_id, dich_vu_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, trang_thai)
      VALUES ($1, $2, $3, NOW() - interval '${i} days', NOW() - interval '${i} days' + interval '1 hour', 'hoan_thanh') RETURNING id
    `, [`LD${faker.string.numeric(6)}`, customer, services[0].id]);

    // Giả lập hồ sơ điều trị
    const { rows: ldt } = await pool.query(`
      INSERT INTO lich_dieu_tri (khach_hang_id, loai_dieu_tri, dich_vu_id, tong_so_buoi, so_buoi_da_dung, trang_thai)
      VALUES ($1, 'dich_vu_le', $2, 1, 1, 'hoan_thanh') RETURNING id
    `, [customer, services[0].id]);

    // Giả lập buổi trị liệu thực tế
    const { rows: btl } = await pool.query(`
      INSERT INTO buoi_tri_lieu (lich_dieu_tri_id, dich_vu_id, ky_thuat_vien_id, khach_hang_id, trang_thai, thoi_gian_bat_dau, thoi_gian_ket_thuc)
      VALUES ($1, $2, $3, $4, 'hoan_thanh', NOW() - interval '${i} days', NOW() - interval '${i} days' + interval '1 hour') RETURNING id
    `, [ldt[0].id, services[0].id, ktv, customer]);

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

const seedSchedules = async (users: any) => {
  console.log('Seeding schedules...');

  // Lấy Thứ 2 của tuần này và tuần sau
  const current = new Date();
  const distanceToMonday = current.getDay() === 0 ? -6 : 1 - current.getDay();
  const thisMonday = new Date(current);
  thisMonday.setDate(current.getDate() + distanceToMonday);

  const nextMonday = new Date(thisMonday);
  nextMonday.setDate(thisMonday.getDate() + 7);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const getWeekDates = (startMonday: Date) => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startMonday);
      d.setDate(startMonday.getDate() + i);
      dates.push(formatDate(d));
    }
    return dates;
  };

  const datesThisWeek = getWeekDates(thisMonday);
  const datesNextWeek = getWeekDates(nextMonday);

  // --- SEED TUẦN NÀY ---
  // Lễ tân (users.leTanId): Thứ 2 -> Thứ 6 (08:00 - 17:00), Thứ 7 (08:00 - 12:00)
  for (let i = 0; i < 5; i++) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '08:00', '17:00', 'hoat_dong')`, [users.leTanId, datesThisWeek[i]]);
  }
  await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '08:00', '12:00', 'hoat_dong')`, [users.leTanId, datesThisWeek[5]]);

  // Bác sĩ (users.bacSiId): Trực Sáng (08:30 - 12:00) Thứ 2, 3, 4; Trực Chiều (13:30 - 17:30) Thứ 5, 6, 7
  for (const i of [0, 1, 2]) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '08:30', '12:00', 'hoat_dong')`, [users.bacSiId, datesThisWeek[i]]);
  }
  for (const i of [3, 4, 5]) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '13:30', '17:30', 'hoat_dong')`, [users.bacSiId, datesThisWeek[i]]);
  }

  // KTV 1 (users.ktvUsers[0]): Trực Chiều (13:00 - 17:00) Thứ 2 -> Thứ 6
  for (let i = 0; i < 5; i++) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '13:00', '17:00', 'hoat_dong')`, [users.ktvUsers[0], datesThisWeek[i]]);
  }

  // KTV 2 (users.ktvUsers[1]): Trực Sáng (08:00 - 12:00) Thứ 2, 3, 4; Trực Chiều (13:00 - 17:00) Thứ 5, 6
  for (const i of [0, 1, 2]) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '08:00', '12:00', 'hoat_dong')`, [users.ktvUsers[1], datesThisWeek[i]]);
  }
  for (const i of [3, 4]) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '13:00', '17:00', 'hoat_dong')`, [users.ktvUsers[1], datesThisWeek[i]]);
  }

  // KTV 3 (users.ktvUsers[2]): Trực Chiều (13:00 - 17:00) Thứ 2, 3, 6; Nghỉ phép Thứ 4, 5
  for (const i of [0, 1, 5]) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '13:00', '17:00', 'hoat_dong')`, [users.ktvUsers[2], datesThisWeek[i]]);
  }
  for (const i of [2, 3]) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '08:00', '17:00', 'tam_nghi')`, [users.ktvUsers[2], datesThisWeek[i]]);
  }


  // --- SEED TUẦN SAU ---
  // Lễ tân (users.leTanId): Thứ 2, 3, 5, 6 (08:00 - 17:00); Thứ 4 Nghỉ phép; Thứ 7 Trực Tối (17:00 - 21:00)
  for (const i of [0, 1, 3, 4]) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '08:00', '17:00', 'hoat_dong')`, [users.leTanId, datesNextWeek[i]]);
  }
  await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '08:00', '17:00', 'tam_nghi')`, [users.leTanId, datesNextWeek[2]]);
  await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '17:00', '21:00', 'hoat_dong')`, [users.leTanId, datesNextWeek[5]]);

  // Bác sĩ (users.bacSiId): Trực Sáng (08:30 - 12:00) Thứ 2, 4, 6; Trực Tối (17:30 - 21:30) Thứ 3, 5
  for (const i of [0, 2, 4]) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '08:30', '12:00', 'hoat_dong')`, [users.bacSiId, datesNextWeek[i]]);
  }
  for (const i of [1, 3]) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '17:30', '21:30', 'hoat_dong')`, [users.bacSiId, datesNextWeek[i]]);
  }

  // KTV 1 (users.ktvUsers[0]): Trực Tối (17:00 - 21:00) Thứ 2 -> Thứ 6
  for (let i = 0; i < 5; i++) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '17:00', '21:00', 'hoat_dong')`, [users.ktvUsers[0], datesNextWeek[i]]);
  }

  // KTV 2 (users.ktvUsers[1]): Trực Sáng (08:00 - 12:00) Thứ 2, 4, 6
  for (const i of [0, 2, 4]) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '08:00', '12:00', 'hoat_dong')`, [users.ktvUsers[1], datesNextWeek[i]]);
  }

  // KTV 3 (users.ktvUsers[2]): Trực Sáng (08:00 - 12:00) Thứ 2 -> Thứ 6
  for (let i = 0; i < 5; i++) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '08:00', '12:00', 'hoat_dong')`, [users.ktvUsers[2], datesNextWeek[i]]);
  }
};

const seedRooms = async () => {
  console.log('Seeding rooms...');
  const rooms = [
    { ten_phong: 'Phòng 101 - Khám VIP 1', ma_phong: 'P101', loai_phong: 'kham_benh', tang: 'Tang 1' },
    { ten_phong: 'Phòng 102 - Khám tổng quát', ma_phong: 'P102', loai_phong: 'kham_benh', tang: 'Tang 1' },
    { ten_phong: 'Phòng 201 - Trị liệu Vật lý', ma_phong: 'P201', loai_phong: 'tri_lieu', tang: 'Tang 2' },
    { ten_phong: 'Phòng 202 - Điện xung trị liệu', ma_phong: 'P202', loai_phong: 'tri_lieu', tang: 'Tang 2' },
    { ten_phong: 'Phòng 203 - Kéo giãn cột sống', ma_phong: 'P203', loai_phong: 'tri_lieu', tang: 'Tang 2' },
    { ten_phong: 'Phòng 301 - Phục hồi chức năng', ma_phong: 'P301', loai_phong: 'phuc_hoi', tang: 'Tang 3' }
  ];

  for (const r of rooms) {
    await pool.query(`
      INSERT INTO phong (ten_phong, ma_phong, loai_phong, tang, trang_thai)
      VALUES ($1, $2, $3, $4, 'san_sang')
    `, [r.ten_phong, r.ma_phong, r.loai_phong, r.tang]);
  }
};

const runSeed = async () => {
  try {
    await clearDatabase();
    const roles = await seedRoles();
    const { ktvUsers, customerUsers, adminId, leTanId, bacSiId } = await seedUsers(roles);
    const services = await seedServices();
    await seedPackages(services);
    await seedRooms();
    await seedInvoicesAndAnalytics(customerUsers, services);
    await seedFeedback(customerUsers);
    await seedVouchers(adminId);
    await seedSchedules({ ktvUsers, adminId, leTanId, bacSiId });

    console.log('✅ Seed dữ liệu thành công!');
  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu:', error);
  } finally {
    pool.end();
  }
};

runSeed();

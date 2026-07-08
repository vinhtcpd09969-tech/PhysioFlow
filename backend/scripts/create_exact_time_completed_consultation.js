const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    console.log('Connecting to database...');
    // 1. Get first customer
    const { rows: customers } = await pool.query('SELECT id, ho_ten FROM khach_hang LIMIT 1');
    if (customers.length === 0) {
      throw new Error('No customers found in database.');
    }
    const customer = customers[0];
    console.log(`Found Customer: ${customer.ho_ten} (${customer.id})`);

    // 2. Get first service
    const { rows: services } = await pool.query("SELECT id, ten_dich_vu FROM dich_vu WHERE trang_thai = 'hoat_dong' LIMIT 1");
    if (services.length === 0) {
      throw new Error('No services found in database.');
    }
    const service = services[0];
    console.log(`Found Service: ${service.ten_dich_vu} (${service.id})`);

    // 3. Get first doctor
    const { rows: doctors } = await pool.query("SELECT id, ma_nhan_vien FROM chuyen_gia_y_te WHERE trang_thai = 'hoat_dong' LIMIT 1");
    if (doctors.length === 0) {
      throw new Error('No doctors found in database.');
    }
    const doctor = doctors[0];
    console.log(`Found Doctor: ${doctor.ma_nhan_vien} (${doctor.id})`);

    // 4. Get first package
    const { rows: packages } = await pool.query("SELECT id, ten_goi FROM goi_dich_vu WHERE trang_thai = 'hoat_dong' LIMIT 1");
    if (packages.length === 0) {
      throw new Error('No packages found in database.');
    }
    const pkg = packages[0];
    console.log(`Found Package: ${pkg.ten_goi} (${pkg.id})`);

    // 5. Create a new completed consultation (lich_dat) exactly at 08:00 AM Vietnam time
    // 08:00 AM UTC+7 is 01:00 AM UTC
    const maLichDat = 'LD-EXACT' + Math.floor(100 + Math.random() * 900);
    const start = new Date('2026-06-29T01:00:00.000Z');
    const end = new Date('2026-06-29T01:30:00.000Z');

    const { rows: newLichDat } = await pool.query(`
      INSERT INTO lich_dat (
        id, ma_lich_dat, khach_hang_id, dich_vu_id, bac_si_id, 
        ngay_gio_bat_dau, ngay_gio_ket_thuc, trang_thai, ly_do_kham, nguoi_tao
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'hoan_thanh', 'Đau cột sống cổ mãn tính', 'le_tan'
      ) RETURNING id, ma_lich_dat
    `, [maLichDat, customer.id, service.id, doctor.id, start, end]);

    const lichDat = newLichDat[0];
    console.log(`Created completed consultation: ${lichDat.ma_lich_dat} (${lichDat.id})`);

    // 6. Create a treatment record (ho_so_dieu_tri) for this consultation
    const { rows: newHsdt } = await pool.query(`
      INSERT INTO ho_so_dieu_tri (
        id, lich_dat_id, chuyen_gia_id, chan_doan, chong_chi_dinh, goi_dich_vu_id, ghi_chu
      ) VALUES (
        gen_random_uuid(), $1, $2, 'Co thắt cơ cạnh sống cổ', 'Tránh nhiệt nóng cường độ cao', $3, 'Khuyên dùng liệu trình phục hồi cột sống cổ 10 buổi'
      ) RETURNING id
    `, [lichDat.id, doctor.id, pkg.id]);

    console.log(`Created medical record with recommended package!`);
    console.log(`SUCCESS! Completed consultation ${lichDat.ma_lich_dat} is ready and matches standard 08:00 AM slot!`);

  } catch (err) {
    console.error('Error executing script:', err);
  } finally {
    pool.end();
  }
}

run();

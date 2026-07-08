const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:password@localhost:5432/office_care' });

client.connect()
  .then(async () => {
    console.log('--- Database Inspection for 2026-07-04 ---');
    
    // 1. Check all staff schedules for July 4th
    const schedules = await client.query(`
      SELECT s.id, s.nhan_su_id, u.ho_ten, u.vai_tro_id, s.ngay_truc, s.gio_bat_dau, s.gio_ket_thuc, s.trang_thai, s.phong_id
      FROM lich_truc_nhan_su s
      JOIN nguoi_dung u ON s.nhan_su_id = u.id
      WHERE DATE(s.ngay_truc) = '2026-07-04'::date
    `);
    console.log('Schedules count:', schedules.rows.length);
    console.log(schedules.rows.map(r => ({
      name: r.ho_ten,
      role: r.vai_tro_id === 4 ? 'Doctor' : 'Technician',
      time: `${r.gio_bat_dau} - ${r.gio_ket_thuc}`,
      status: r.trang_thai,
      room: r.phong_id
    })));

    // 2. Check all active appointments on July 4th
    const appointments = await client.query(`
      SELECT ch.id, ch.nhan_su_id, u.ho_ten as staff_name, ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc, ch.trang_thai, ch.loai
      FROM cuoc_hen ch
      LEFT JOIN nguoi_dung u ON ch.nhan_su_id = u.id
      WHERE DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = '2026-07-04'::date
        AND ch.trang_thai NOT IN ('huy', 'khong_den')
    `);
    console.log('\nActive appointments count:', appointments.rows.length);
    console.log(appointments.rows.map(r => ({
      id: r.id,
      staff: r.staff_name,
      start: r.ngay_gio_bat_dau,
      end: r.ngay_gio_ket_thuc,
      status: r.trang_thai,
      type: r.loai
    })));

    // 3. Check active temporary holds on July 4th
    const holds = await client.query(`
      SELECT t.id, t.nhan_su_id, u.ho_ten as staff_name, t.ngay_gio_bat_dau, t.ngay_gio_ket_thuc, t.thoi_gian_het_han
      FROM tam_giu_cho t
      LEFT JOIN nguoi_dung u ON t.nhan_su_id = u.id
      WHERE DATE(t.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = '2026-07-04'::date
        AND t.thoi_gian_het_han > NOW()
    `);
    console.log('\nActive holds count:', holds.rows.length);
    console.log(holds.rows.map(r => ({
      staff: r.staff_name,
      start: r.ngay_gio_bat_dau,
      end: r.ngay_gio_ket_thuc,
      expires: r.thoi_gian_het_han
    })));

    client.end();
  })
  .catch(e => {
    console.error(e);
    client.end();
  });

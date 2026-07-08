const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:password@localhost:5432/office_care' });

client.connect()
  .then(async () => {
    const res = await client.query(`
      SELECT id, nhan_su_id, loai, trang_thai, ngay_gio_bat_dau, ngay_gio_ket_thuc 
      FROM cuoc_hen 
      WHERE nhan_su_id = 7
    `);
    console.log('Appointments for nhan_su_id = 7:', res.rows);

    const all = await client.query(`
      SELECT id, nhan_su_id, loai, trang_thai, ngay_gio_bat_dau, ngay_gio_ket_thuc 
      FROM cuoc_hen 
      WHERE loai = 'DIEU_TRI'
    `);
    console.log('All DIEU_TRI appointments:', all.rows);

    client.end();
  })
  .catch(e => {
    console.error(e);
    client.end();
  });

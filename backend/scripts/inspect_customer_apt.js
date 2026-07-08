const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:password@localhost:5432/office_care' });

client.connect()
  .then(async () => {
    const res = await client.query(`
      SELECT ch.id, ch.khach_hang_id, kh.ho_ten, kh.so_dien_thoai, ch.trang_thai, ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc
      FROM cuoc_hen ch
      LEFT JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      WHERE ch.id = '152b230c-d768-4bf6-b6d6-43046c5adda0'
    `);
    console.log(res.rows);
    client.end();
  })
  .catch(e => {
    console.error(e);
    client.end();
  });

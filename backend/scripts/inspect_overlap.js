const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:password@localhost:5432/office_care' });

client.connect()
  .then(async () => {
    const start = new Date('2026-07-05T07:50:00.000Z').toISOString();
    const end = new Date('2026-07-05T08:20:00.000Z').toISOString();
    const phone = '0398655532';
    const khach_hang_id = 'f4a36fe7-4ef3-400c-9f28-5e96e52598a4';

    console.log('Parameters:', { khach_hang_id, phone, start, end });

    const query = `
      SELECT ch.id, ch.khach_hang_id, kh.so_dien_thoai, ch.trang_thai, ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc, ch.loai
      FROM cuoc_hen ch
      LEFT JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      WHERE (
        ($1::uuid IS NOT NULL AND ch.khach_hang_id = $1::uuid)
        OR ($2::text IS NOT NULL AND kh.so_dien_thoai = $2::text)
      )
        AND ch.trang_thai NOT IN ('da_huy', 'huy', 'hoan_thanh', 'khong_den')
        AND ch.ngay_gio_bat_dau < $4::timestamptz
        AND ch.ngay_gio_ket_thuc > $3::timestamptz
    `;
    const res = await client.query(query, [khach_hang_id, phone, start, end]);
    console.log('Overlap query results:', res.rows);

    // Let's print all appointments on that day to see what is there
    const allRes = await client.query("SELECT ch.id, ch.khach_hang_id, kh.ho_ten, kh.so_dien_thoai, ch.trang_thai, ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc, ch.loai FROM cuoc_hen ch LEFT JOIN khach_hang kh ON ch.khach_hang_id = kh.id WHERE DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = '2026-07-05'::date");
    console.log('All appointments on 2026-07-05:', allRes.rows);

    client.end();
  })
  .catch(e => {
    console.error(e);
    client.end();
  });

const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:password@localhost:5432/office_care' });

client.connect()
  .then(async () => {
    console.log('--- Testing checkCustomerOverlap after fix ---');
    const customerId = 'd5d1baf4-628a-4622-ba35-95da33c19c16';
    
    // Test slot 14:45 - 15:00
    const start1 = '2026-07-04T07:45:00.000Z'; // 14:45 VN
    const end1 = '2026-07-04T08:00:00.000Z';   // 15:00 VN

    const query = `
      SELECT 1 FROM cuoc_hen ch
      LEFT JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      WHERE (
        ($1::uuid IS NOT NULL AND ch.khach_hang_id = $1::uuid)
        OR ($2::text IS NOT NULL AND kh.so_dien_thoai = $2::text)
      )
        AND ch.trang_thai NOT IN ('da_huy', 'huy', 'hoan_thanh', 'khong_den')
        AND ch.ngay_gio_bat_dau < $4::timestamptz
        AND ch.ngay_gio_ket_thuc > $3::timestamptz
      LIMIT 1
    `;
    const res1 = await client.query(query, [customerId, null, start1, end1]);
    console.log('Overlap for slot 14:45 - 15:00:', res1.rows.length > 0);

    // Test slot 15:10 - 15:25
    const start2 = '2026-07-04T08:10:00.000Z'; // 15:10 VN
    const end2 = '2026-07-04T08:25:00.000Z';   // 15:25 VN
    const res2 = await client.query(query, [customerId, null, start2, end2]);
    console.log('Overlap for slot 15:10 - 15:25:', res2.rows.length > 0);

    client.end();
  })
  .catch(e => {
    console.error(e);
    client.end();
  });

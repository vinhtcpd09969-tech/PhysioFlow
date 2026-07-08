const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:password@localhost:5432/office_care' });

client.connect()
  .then(async () => {
    const custRes = await client.query("SELECT id, ho_ten, so_dien_thoai FROM khach_hang WHERE so_dien_thoai = '0398655532'");
    console.log('Customer info:', custRes.rows);
    if (custRes.rows.length > 0) {
      const custId = custRes.rows[0].id;
      const apptsRes = await client.query("SELECT id, ngay_gio_bat_dau, ngay_gio_ket_thuc, trang_thai, loai, ghi_chu, ly_do_huy FROM cuoc_hen WHERE khach_hang_id = $1 ORDER BY ngay_gio_bat_dau", [custId]);
      console.log('Appointments:', apptsRes.rows);
    } else {
      console.log('No customer found with phone 0398655532');
    }
    client.end();
  })
  .catch(e => {
    console.error(e);
    client.end();
  });

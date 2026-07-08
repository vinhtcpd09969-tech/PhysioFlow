const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:password@localhost:5432/office_care' });

client.connect()
  .then(async () => {
    const res = await client.query('SELECT * FROM ho_so_chuyen_gia');
    console.log('ho_so_chuyen_gia rows:', res.rows);
    const users = await client.query('SELECT id, ho_ten, vai_tro_id FROM nguoi_dung');
    console.log('nguoi_dung rows:', users.rows);
    client.end();
  })
  .catch(e => {
    console.error(e);
    client.end();
  });

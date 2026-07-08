const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:password@localhost:5432/office_care' });

client.connect()
  .then(async () => {
    const res = await client.query("SELECT id, ten_goi, loai_goi FROM goi_dich_vu");
    console.log(res.rows);
    client.end();
  })
  .catch(e => {
    console.error(e);
    client.end();
  });

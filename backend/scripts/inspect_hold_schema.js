const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:password@localhost:5432/office_care' });

client.connect()
  .then(async () => {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tam_giu_cho'
    `);
    console.log(res.rows);
    client.end();
  })
  .catch(e => {
    console.error(e);
    client.end();
  });

const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:password@localhost:5432/office_care' });

client.connect()
  .then(async () => {
    const views = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
    `);
    console.log('Views:', views.rows.map(r => r.table_name));

    const checkView = await client.query(`
      SELECT * FROM chuyen_gia_y_te LIMIT 1
    `);
    console.log('chuyen_gia_y_te first row:', checkView.rows);

    client.end();
  })
  .catch(e => {
    console.error(e);
    client.end();
  });

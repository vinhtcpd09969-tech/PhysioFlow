const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:password@localhost:5432/office_care' });

client.connect()
  .then(async () => {
    console.log('Connected to DB');
    await client.query('ALTER TABLE cuoc_hen DROP COLUMN IF EXISTS ghi_chu_noi_bo;');
    console.log('Column ghi_chu_noi_bo dropped successfully!');
    client.end();
  })
  .catch(e => {
    console.error('Error dropping column:', e);
    client.end();
  });

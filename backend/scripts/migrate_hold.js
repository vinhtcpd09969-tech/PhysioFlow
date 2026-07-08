const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:password@localhost:5432/office_care' });

client.connect()
  .then(async () => {
    console.log('Connected to DB');
    await client.query(`
      ALTER TABLE tam_giu_cho 
      ADD COLUMN IF NOT EXISTS khach_hang_id UUID,
      ADD COLUMN IF NOT EXISTS so_dien_thoai TEXT;
    `);
    console.log('Columns khach_hang_id and so_dien_thoai added to tam_giu_cho successfully!');
    client.end();
  })
  .catch(e => {
    console.error('Error adding columns:', e);
    client.end();
  });

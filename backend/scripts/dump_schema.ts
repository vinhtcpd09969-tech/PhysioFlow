import { Client } from 'pg';
import * as fs from 'fs';

async function extractSchema() {
  const client = new Client({
    connectionString: 'postgresql://postgres:password@localhost:5432/physioflow_db'
  });

  try {
    await client.connect();
    
    // Get all tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    let schemaStr = '';
    
    for (let row of res.rows) {
      const tableName = row.table_name;
      schemaStr += `-- Table: ${tableName}\n`;
      
      const columnsRes = await client.query(`
        SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
      `, [tableName]);
      
      for (let col of columnsRes.rows) {
        schemaStr += `${col.column_name} | ${col.data_type} | MaxLength: ${col.character_maximum_length} | Nullable: ${col.is_nullable} | Default: ${col.column_default}\n`;
      }
      schemaStr += '\n';
    }
    
    fs.writeFileSync('schema_dump.txt', schemaStr);
    console.log('Schema extracted to schema_dump.txt');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

extractSchema();

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    console.log('--- CHECKING APPTS ON JULY 4 & 5 ---');
    const { rows: appts } = await pool.query(`
      SELECT id, khach_hang_id, nhan_su_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, loai, trang_thai
      FROM cuoc_hen
      WHERE ngay_gio_bat_dau >= '2026-07-04 00:00:00+07' AND ngay_gio_bat_dau < '2026-07-06 00:00:00+07'
    `);
    console.log('Appointments:', appts);

    console.log('--- CHECKING DUTY SHIFTS ON JULY 4 & 5 ---');
    const { rows: shifts } = await pool.query(`
      SELECT id, nhan_su_id, ngay_truc, gio_bat_dau, gio_ket_thuc, trang_thai
      FROM lich_truc_nhan_su
      WHERE ngay_truc >= '2026-07-04' AND ngay_truc <= '2026-07-05'
    `);
    console.log('Shifts:', shifts);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();

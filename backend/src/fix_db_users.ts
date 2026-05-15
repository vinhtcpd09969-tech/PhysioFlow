import { pool } from './config/db';
import bcrypt from 'bcryptjs';

async function fixUsers() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);

    console.log('Ensuring roles are correct...');
    // Roles should already be there from init.sql, but let's be sure about the IDs
    // 1: khach_hang, 2: le_tan, 3: ky_thuat_vien, 4: bac_si, 5: admin

    console.log('Resetting/Creating test users...');

    const users = [
      { email: 'admin@physioflow.com', ho_ten: 'System Admin', vai_tro_id: 5 },
      { email: 'letan@physioflow.com', ho_ten: 'Lễ Tân Main', vai_tro_id: 2 },
      { email: 'vinhtcpd09969@gmail.com', ho_ten: 'Trần Công Vinh', vai_tro_id: 5 }, // Make this one admin too if needed
    ];

    for (const user of users) {
      const { rows } = await pool.query('SELECT id FROM nguoi_dung WHERE email = $1', [user.email]);
      
      if (rows.length === 0) {
        console.log(`Creating user ${user.email}...`);
        await pool.query(
          `INSERT INTO nguoi_dung (ho_ten, email, mat_khau_hash, vai_tro_id, trang_thai, da_xac_thuc_email)
           VALUES ($1, $2, $3, $4, 'hoat_dong', TRUE)`,
          [user.ho_ten, user.email, hash, user.vai_tro_id]
        );
      } else {
        console.log(`Updating password for user ${user.email}...`);
        await pool.query(
          `UPDATE nguoi_dung SET mat_khau_hash = $1, vai_tro_id = $2, da_xac_thuc_email = TRUE, trang_thai = 'hoat_dong' WHERE email = $3`,
          [hash, user.vai_tro_id, user.email]
        );
      }
    }

    console.log('Database users fixed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to fix users:', err);
    process.exit(1);
  }
}

fixUsers();

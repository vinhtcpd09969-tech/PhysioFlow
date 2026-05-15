import { pool } from './src/config/db';
import bcrypt from 'bcryptjs';

async function fixUser() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('password123', salt);
  
  await pool.query(
    `INSERT INTO nguoi_dung (ho_ten, email, mat_khau_hash, vai_tro_id, da_xac_thuc_email) 
     VALUES ('Trần Công Vinh', 'vinhtcpd09969@gmail.com', $1, 4, TRUE)
     ON CONFLICT (email) DO NOTHING`,
    [hash]
  );
  console.log('User created');
  process.exit(0);
}
fixUser();

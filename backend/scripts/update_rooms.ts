import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Updating room links on July 2...');

  // 1. Update schedules (lich_truc_nhan_su)
  const docSchedules = await prisma.$executeRawUnsafe(`
    UPDATE lich_truc_nhan_su
    SET phong_id = 1
    FROM nguoi_dung nd
    WHERE lich_truc_nhan_su.nhan_su_id = nd.id
      AND nd.vai_tro_id = 4
      AND lich_truc_nhan_su.ngay_truc = '2026-07-02'
  `);
  console.log(`Updated doctor schedules count: ${docSchedules}`);

  const ktvSchedules = await prisma.$executeRawUnsafe(`
    UPDATE lich_truc_nhan_su
    SET phong_id = 2
    FROM nguoi_dung nd
    WHERE lich_truc_nhan_su.nhan_su_id = nd.id
      AND nd.vai_tro_id = 3
      AND lich_truc_nhan_su.ngay_truc = '2026-07-02'
  `);
  console.log(`Updated ktv schedules count: ${ktvSchedules}`);

  // 2. Update appointments (cuoc_hen)
  const khamAppts = await prisma.$executeRawUnsafe(`
    UPDATE cuoc_hen
    SET phong_id = 1
    WHERE loai = 'KHAM'
      AND DATE(ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = '2026-07-02'
  `);
  console.log(`Updated check-in appointments count: ${khamAppts}`);

  const treatAppts = await prisma.$executeRawUnsafe(`
    UPDATE cuoc_hen
    SET phong_id = 2
    WHERE loai = 'DIEU_TRI'
      AND DATE(ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = '2026-07-02'
  `);
  console.log(`Updated treatment appointments count: ${treatAppts}`);

  const singleAppts = await prisma.$executeRawUnsafe(`
    UPDATE cuoc_hen
    SET phong_id = 3
    WHERE loai = 'DICH_VU_LE'
      AND DATE(ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = '2026-07-02'
  `);
  console.log(`Updated single service appointments count: ${singleAppts}`);

  console.log('Success!');
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});

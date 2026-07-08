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
  console.log('Connecting to database:', process.env.DATABASE_URL);
  
  try {
    const userCount = await prisma.nguoi_dung.count();
    const customerCount = await prisma.khach_hang.count();
    const apptCount = await prisma.cuoc_hen.count();
    const txJournalCount = await prisma.nhat_ky_buoi_dieu_tri.count();
    const packageCount = await prisma.goi_dich_vu.count();
    const invoiceCount = await prisma.hoa_don.count();
    const reviews = await prisma.danh_gia_chat_luong.findMany({
      include: {
        khach_hang: true
      }
    });

    console.log('\n--- NEW DB RECORD COUNTS ---');
    console.log(`- nguoi_dung (Staff): ${userCount}`);
    console.log(`- khach_hang (Patients): ${customerCount}`);
    console.log(`- cuoc_hen (Appointments): ${apptCount}`);
    console.log(`- nhat_ky_buoi_dieu_tri (Treatment Journals): ${txJournalCount}`);
    console.log(`- goi_dich_vu (Packages): ${packageCount}`);
    console.log(`- hoa_don (Invoices): ${invoiceCount}`);
    console.log(`- danh_gia_chat_luong (Reviews): ${reviews.length}`);
    console.log('----------------------------\n');
    console.log('--- REVIEWS ---');
    console.log(JSON.stringify(reviews, null, 2));
    console.log('---------------\n');
    console.log('--- APPOINTMENTS ---');
    const appts = await prisma.cuoc_hen.findMany({ take: 5, include: { khach_hang: true } });
    console.log(JSON.stringify(appts, null, 2));
    console.log('---------------\n');
    console.log('--- SPECIALISTS ---');
    const specialists = await prisma.ho_so_chuyen_gia.findMany({ include: { nguoi_dung: true } });
    console.log(JSON.stringify(specialists, null, 2));
    console.log('---------------\n');
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();

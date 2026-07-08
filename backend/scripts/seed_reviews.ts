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
  console.log('Seeding reviews (danh_gia_chat_luong)...');

  try {
    // Delete existing reviews first
    await prisma.danh_gia_chat_luong.deleteMany({});
    console.log('Cleared existing reviews.');

    // Fetch appointments with khach_hang
    const appts = await prisma.cuoc_hen.findMany({
      include: {
        khach_hang: true,
      },
      orderBy: {
        ngay_gio_bat_dau: 'desc',
      },
    });

    if (appts.length === 0) {
      console.log('No appointments found to attach reviews to.');
      return;
    }

    const reviewTexts = [
      {
        nhan_xet: 'Bác sĩ Nguyễn An tận tâm, phác đồ điều trị thoái hóa cột sống rất hiệu quả. Sau 3 buổi đã giảm hẳn đau mỏi vai gáy.',
        so_sao: 5,
      },
      {
        nhan_xet: 'Phòng khám khang trang, sạch sẽ. Máy móc hiện đại, KTV Hoàng Yến hướng dẫn bài tập rất kỹ, tôi đã hết đau khớp gối.',
        so_sao: 5,
      },
      {
        nhan_xet: 'Dịch vụ 5 sao thực sự! Đặt lịch hẹn nhanh chóng, KTV Lê Văn C rất nhiệt tình. Tôi phục hồi chấn thương dây chằng cổ chân rất tốt.',
        so_sao: 5,
      },
      {
        nhan_xet: 'Trải nghiệm lượng giá lâm sàng ban đầu rất chi tiết. Bác sĩ giải thích rõ ràng nguyên lý. Tôi cảm thấy rất an tâm khi điều trị.',
        so_sao: 5,
      },
      {
        nhan_xet: 'Siêu âm trị liệu sâu kết hợp kéo giãn cơ của phòng khám cực kỳ đỉnh. Lưng của tôi đã linh hoạt trở lại sau thời gian dài bị cứng cơ.',
        so_sao: 5,
      },
    ];

    // Seed up to the number of appointments we have
    const seedCount = Math.min(appts.length, reviewTexts.length);
    for (let i = 0; i < seedCount; i++) {
      const appt = appts[i];
      const reviewInfo = reviewTexts[i];

      await prisma.danh_gia_chat_luong.create({
        data: {
          cuoc_hen_id: appt.id,
          khach_hang_id: appt.khach_hang_id,
          so_sao: reviewInfo.so_sao,
          nhan_xet: reviewInfo.nhan_xet,
        },
      });
      console.log(`Created review for client "${appt.khach_hang.ho_ten}" (Appt ID: ${appt.id})`);
    }

    console.log(`Successfully seeded ${seedCount} reviews!`);
  } catch (error) {
    console.error('Error seeding reviews:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();

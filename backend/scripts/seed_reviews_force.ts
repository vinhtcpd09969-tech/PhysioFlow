import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log('Force Seeding Reviews using raw SQL...');

  try {
    // 1. Clear existing reviews
    await pool.query('DELETE FROM danh_gia_chat_luong');
    console.log('Cleared existing reviews.');

    // 2. Fetch or create customers
    let { rows: customers } = await pool.query('SELECT id, ho_ten FROM khach_hang LIMIT 5');
    if (customers.length === 0) {
      console.log('No customers found. Creating dummy customers...');
      const dummyCustomers = [
        ['Lê Hoàng Nam', 'nam.le@gmail.com', '0987654321', 'nam'],
        ['Nguyễn Thị Hương', 'huong.nguyen@gmail.com', '0977654322', 'nu'],
        ['Trần Văn Hùng', 'hung.tran@gmail.com', '0967654323', 'nam'],
        ['Phạm Mai Chi', 'chi.pham@gmail.com', '0957654324', 'nu'],
        ['Đỗ Hải Đăng', 'dang.do@gmail.com', '0947654325', 'nam'],
      ];
      for (const c of dummyCustomers) {
        const { rows } = await pool.query(
          `INSERT INTO khach_hang (ho_ten, email, so_dien_thoai, gioi_tinh)
           VALUES ($1, $2, $3, $4) RETURNING id, ho_ten`,
          c
        );
        customers.push(rows[0]);
      }
      console.log(`Created ${customers.length} dummy customers.`);
    }

    // 3. Fetch first service (goi_dich_vu)
    const { rows: services } = await pool.query('SELECT id FROM goi_dich_vu LIMIT 1');
    let serviceId = services.length > 0 ? services[0].id : null;
    if (!serviceId) {
      console.log('No service found. Creating a default clinic service...');
      const { rows } = await pool.query(
        `INSERT INTO goi_dich_vu (id, ten_goi, loai_goi, tong_so_buoi, thoi_luong_phut, don_gia, don_gia_theo_buoi, trang_thai)
         VALUES (gen_random_uuid(), 'Khám lâm sàng Vật lý trị liệu', 'KHAM', 1, 30, 150000, 150000, 'hoat_dong')
         RETURNING id`
      );
      serviceId = rows[0].id;
    }

    // 4. Fetch first doctor (nguoi_dung with role_id = 4)
    const { rows: doctors } = await pool.query('SELECT id FROM nguoi_dung WHERE vai_tro_id = 4 LIMIT 1');
    const doctorId = doctors.length > 0 ? doctors[0].id : 5;

    // 5. Create completed appointments for these customers
    console.log('Creating mock appointments...');
    const appts = [];
    const now = new Date();

    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      const start = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000); // 1-5 days ago
      const end = new Date(start.getTime() + 30 * 60000);

      const { rows } = await pool.query(
        `INSERT INTO cuoc_hen (khach_hang_id, goi_dich_vu_id, nhan_su_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, loai, trang_thai, ghi_chu)
         VALUES ($1, $2, $3, $4, $5, 'KHAM', 'hoan_thanh', 'Khám phục hồi chức năng định kỳ')
         RETURNING id, khach_hang_id`,
        [customer.id, serviceId, doctorId, start.toISOString(), end.toISOString()]
      );
      appts.push(rows[0]);
    }
    console.log(`Created ${appts.length} completed appointments.`);

    // 6. Create reviews (danh_gia_chat_luong)
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

    console.log('Creating reviews...');
    for (let i = 0; i < appts.length; i++) {
      const appt = appts[i];
      const reviewInfo = reviewTexts[i];

      await pool.query(
        `INSERT INTO danh_gia_chat_luong (cuoc_hen_id, khach_hang_id, so_sao, nhan_xet)
         VALUES ($1, $2, $3, $4)`,
        [appt.id, appt.khach_hang_id, reviewInfo.so_sao, reviewInfo.nhan_xet]
      );
      console.log(`Created review for customer ID: ${appt.khach_hang_id}`);
    }

    console.log(`Successfully force seeded ${appts.length} reviews!`);
  } catch (error) {
    console.error('Error force seeding reviews:', error);
  } finally {
    await pool.end();
  }
}

main();

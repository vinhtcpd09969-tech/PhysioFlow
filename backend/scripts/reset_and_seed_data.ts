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
  console.log('--- BẮT ĐẦU THIẾT LẬP LẠI VÀ CHÈN MỚI DỮ LIỆU ---');

  try {
    // Phase 1: Disable trigger & Clean transactions
    console.log('Phase 1: Đang vô hiệu hóa trigger bảo mật giao dịch...');
    try {
      await pool.query('ALTER TABLE giao_dich_thanh_toan DISABLE TRIGGER trg_protect_giao_dich_thanh_toan');
    } catch (e: any) {
      console.log('Thông báo: Không thể tắt trigger (có thể không tồn tại):', e.message);
    }

    console.log('Phase 1: Đang dọn dẹp các bảng giao dịch cũ...');
    await prisma.giao_dich_thanh_toan.deleteMany();
    await prisma.hoa_don.deleteMany();
    await prisma.danh_gia.deleteMany();
    await prisma.chi_dinh_buoi.deleteMany();
    await prisma.nhat_ky_buoi_dieu_tri.deleteMany();
    await prisma.cuoc_hen.deleteMany();
    await prisma.phac_do_dieu_tri.deleteMany();
    await prisma.lich_truc_nhan_su.deleteMany();
    await prisma.bai_viet.deleteMany();

    console.log('Phase 1: Đang dọn dẹp hồ sơ chuyên gia và tài khoản chuyên gia cũ...');
    await prisma.ho_so_chuyen_gia.deleteMany();
    // Delete only users with roles 3 (KTV) and 4 (Doctor)
    await prisma.nguoi_dung.deleteMany({
      where: {
        vai_tro_id: { in: [3, 4] }
      }
    });

    console.log('Phase 1: Đang dọn dẹp danh mục gói và các gói cũ...');
    await prisma.goi_dich_vu.deleteMany();

    // Reseed Gói Khám (KHAM) - Giữ 1 gói duy nhất
    console.log('Phase 2: Đang chèn Gói Lượng giá chức năng chuẩn...');
    await prisma.goi_dich_vu.create({
      data: {
        id: 'c1000000-0000-0000-0000-000000000000',
        ten_goi: 'Lượng giá chức năng cơ xương khớp',
        loai_goi: 'KHAM',
        tong_so_buoi: 1,
        thoi_luong_phut: 30,
        don_gia: BigInt(200000),
        don_gia_theo_buoi: BigInt(200000),
        anh_goi: '/images/goi/anh_dai_dien_luong_gia_chuc_nang_co_xuong_khop.png',
        anh_gallery: ['/images/goi/anh_dai_dien_luong_gia_chuc_nang_co_xuong_khop.png'],
        muc_tieu: 'Đánh giá toàn diện chức năng hệ cơ xương khớp và tư thế cột sống (ROM, MMT, VAS).\nXác định nguyên nhân gốc rễ gây đau mỏi, tầm vận động hạn chế và sai lệch tư thế.\nThiết lập kế hoạch trị liệu cá nhân hóa và các bài tập vận động phòng ngừa phù hợp.',
        quy_trinh: '1. Khai thác bệnh sử & thói quen làm việc: Lắng nghe triệu chứng, tiền sử chấn thương và đánh giá môi trường làm việc thực tế.\n2. Lượng giá chức năng lâm sàng: Đo tầm vận động khớp (ROM), đánh giá cơ lực (MMT thang 0-5) và mức độ đau (thang VAS).\n3. Đọc kết quả chẩn đoán hình ảnh: Tiếp nhận và đối chiếu phim chụp X-quang/MRI ngoài để xác định chẩn đoán chức năng chính xác.\n4. Kết luận lượng giá & Cảnh báo chống chỉ định: Xác định tình trạng co cứng/yếu cơ và các lưu ý chống chỉ định vận động.\n5. Tư vấn kế hoạch trị liệu: Đề xuất phác đồ điều trị và hướng dẫn bài tập chỉnh tư thế tại nơi làm việc.',
        han_su_dung_mac_dinh_ngay: 30,
        trang_thai: 'hoat_dong'
      }
    });

    // Seed 4 Gói Lẻ (LE) cho dân văn phòng (Thuần kỹ thuật tay & nhiệt)
    console.log('Phase 2: Đang chèn 4 gói lẻ thư giãn...');
    await prisma.goi_dich_vu.createMany({
      data: [
        {
          id: 'c1000000-0000-0000-0000-000000000101',
          ten_goi: 'Gói Thư Giãn Nhanh Cổ Vai Gáy',
          loai_goi: 'LE',
          tong_so_buoi: 1,
          thoi_luong_phut: 30,
          don_gia: BigInt(180000),
          don_gia_theo_buoi: BigInt(180000),
          anh_goi: '/images/goi/anh_goi_dich_vu_le_thu_gian_nhanh.png',
          anh_gallery: ['/images/goi/anh_con_goi_le_thu_gian_nhanh_1.png', '/images/goi/anh_con_goi_le_thu_gian_nhanh_2.png'],
          muc_tieu: 'Giải tỏa nhanh cảm giác căng cơ, co cứng vùng cổ vai gáy sau nhiều giờ làm việc liên tục.\nTăng lưu thông máu vùng đầu cổ, giúp tinh thần sảng khoái và giảm đau đầu do căng thẳng cơ học.',
          quy_trinh: '1. Chườm ấm thảo dược: Nhiệt ấm tự nhiên giúp giãn mềm các bó cơ nông vùng cổ và vai gáy.\n2. Kỹ thuật day ấn & xoa bóp mô mềm bằng tay: Thao tác xoa bóp, miết cơ nhẹ nhàng dọc theo cơ thang và cơ nâng vai.\n3. Kéo giãn thụ động vùng cổ: Kỹ thuật kéo giãn cơ bản nhẹ nhàng giúp giải tỏa áp lực đè nén lên các đốt sống cổ.\n4. Thư giãn đầu & thái dương: Thao tác xoa bóp nhẹ vùng thái dương và chân tóc giúp xua tan căng thẳng mệt mỏi.',
          han_su_dung_mac_dinh_ngay: 30,
          trang_thai: 'hoat_dong'
        },
        {
          id: 'c1000000-0000-0000-0000-000000000102',
          ten_goi: 'Gói Thư Giãn Cơ Toàn Thân',
          loai_goi: 'LE',
          tong_so_buoi: 1,
          thoi_luong_phut: 60,
          don_gia: BigInt(299000),
          don_gia_theo_buoi: BigInt(299000),
          anh_goi: '/images/goi/anh_goi_dich_vu_le_thu_gian_toan_than.png',
          anh_gallery: ['/images/goi/anh_nho_goi_thu_gian_toan_than_1.png', '/images/goi/anh_nho_goi_thu_gian_toan_than_2.png'],
          muc_tieu: 'Thư giãn toàn diện các nhóm cơ vùng cổ, vai, lưng, tay và chân sau thời gian làm việc kéo dài.\nHỗ trợ giảm căng cứng cơ, cải thiện tuần hoàn máu toàn thân và nâng cao sự dẻo dai cơ thể.',
          quy_trinh: '1. Chườm nhiệt thảo dược toàn lưng: Tác động nhiệt ấm giúp giãn mạch, làm mềm các nhóm cơ dựng sống và lưng dưới.\n2. Kỹ thuật xoa bóp & day ấn cơ lưng - cổ vai: Thao tác trị liệu bằng tay chuyên sâu vào các khối cơ bị căng mỏi do ngồi lâu.\n3. Massage tay & cẳng tay: Giải phóng căng thẳng vùng cơ gấp duỗi cổ tay và ngón tay do gõ bàn phím liên tục.\n4. Xoa bóp thư giãn bắp chân & bàn chân: Tăng hồi lưu tĩnh mạch, giảm cảm giác nặng chân và tê mỏi khi ngồi làm việc.\n5. Kéo giãn cơ toàn thân nhẹ nhàng: Thực hiện các động tác kéo giãn dẻo dai giúp khôi phục sự linh hoạt cơ thể.',
          han_su_dung_mac_dinh_ngay: 30,
          trang_thai: 'hoat_dong'
        },
        {
          id: 'c1000000-0000-0000-0000-000000000103',
          ten_goi: 'Gói Phục Hồi & Thư Giãn Toàn Diện',
          loai_goi: 'LE',
          tong_so_buoi: 1,
          thoi_luong_phut: 90,
          don_gia: BigInt(399000),
          don_gia_theo_buoi: BigInt(399000),
          anh_goi: '/images/goi/anh_dai_dien_goi_le_phuc_hoi_toan_dien.png',
          anh_gallery: ['/images/goi/anh_con_goi_le_phuc_hoi_toan_dien_1.png', '/images/goi/anh_con_goi_le_phuc_hoi_toan_dien_2.png'],
          muc_tieu: 'Liệu trình thư giãn sâu đa tầng kết hợp nhiệt trị liệu thảo dược và kỹ thuật giải tỏa mô mềm toàn thân.\nKhôi phục năng lượng thể chất, giảm mệt mỏi mạn tính và hỗ trợ cải thiện chất lượng giấc ngủ sâu.',
          quy_trinh: '1. Liệu pháp nhiệt thảo dược toàn thân: Ủ ấm vùng lưng, cổ vai gáy và khớp gối bằng thảo mộc tự nhiên.\n2. Massage trị liệu mô mềm sâu bằng tay: Kỹ thuật xoa bóp chuyên sâu giải tỏa triệt để các bó cơ co cứng từ cổ đến gót chân.\n3. Thao tác xoa bóp đầu - mặt - thái dương: Kỹ thuật thư giãn hệ thần kinh giao cảm, giải tỏa stress và căng thẳng tinh thần.\n4. Kéo giãn thụ động đa khớp (Stretching): Kéo giãn nhẹ nhàng các khớp cột sống, khớp háng, khớp vai giúp mở rộng lồng ngực.\n5. Nghỉ ngơi tĩnh dưỡng & Thưởng trà thảo mộc: Giúp cơ thể cân bằng huyết áp và duy trì cảm giác thư thái dài lâu.',
          han_su_dung_mac_dinh_ngay: 30,
          trang_thai: 'hoat_dong'
        },
        {
          id: 'c1000000-0000-0000-0000-000000000104',
          ten_goi: 'Gói Thư Giãn Cổ Tay & Bàn Tay Văn Phòng',
          loai_goi: 'LE',
          tong_so_buoi: 1,
          thoi_luong_phut: 30,
          don_gia: BigInt(180000),
          don_gia_theo_buoi: BigInt(180000),
          anh_goi: '/images/goi/anh_dai_dien_goi_le_thu_gian_co_tay.png',
          anh_gallery: ['/images/goi/anh_con_goi_le_thu_gian_co_tay_1.png'],
          muc_tieu: 'Giải tỏa tình trạng căng cứng, mỏi cơ cẳng tay và ngón tay do gõ phím và sử dụng chuột máy tính liên tục.\nHỗ trợ tăng cường lưu thông tuần hoàn máu ngoại vi, giảm cảm giác căng tức bao gân và đau nhức cổ tay.',
          quy_trinh: '1. Ngâm ấm thảo dược cổ tay: Ngâm và ủ ấm thảo mộc tự nhiên giúp giãn mềm các bó gân cơ cẳng tay và cổ tay.\n2. Massage & xoa bóp mô mềm cẳng tay bằng tay: Kỹ thuật day miết giải phóng điểm căng cứng nhóm cơ gấp và duỗi cổ tay.\n3. Kéo giãn thụ động gân cơ bàn tay & ngón tay: Thao tác kéo giãn nhẹ nhàng từng ngón tay và khớp cổ tay giúp phục hồi biên độ linh hoạt.\n4. Hướng dẫn bài tập thả lỏng tại bàn làm việc: Chuyên viên hướng dẫn các động tác xoay cổ tay và thư giãn nhanh sau mỗi giờ làm việc.',
          han_su_dung_mac_dinh_ngay: 30,
          trang_thai: 'hoat_dong'
        }
      ]
    });

    // Seed 5 Gói Liệu trình (LIEU_TRINH) chuyên sâu
    console.log('Phase 2: Đang chèn 5 gói liệu trình chuyên sâu...');
    await prisma.goi_dich_vu.createMany({
      data: [
        {
          id: 'c1000000-0000-0000-0000-000000000201',
          ten_goi: 'Liệu trình Điều trị Cổ - Vai - Gáy',
          loai_goi: 'LIEU_TRINH',
          tong_so_buoi: 8,
          thoi_luong_phut: 60,
          don_gia: BigInt(2600000),
          don_gia_theo_buoi: BigInt(325000),
          anh_goi: '/images/goi/anh_dai_dien_lieu_trinh_dieu_tri_co_vai_gay.png',
          anh_gallery: ['/images/goi/anh_con_lieu_trinh_dieu_tri_co_vai_gay_1.png'],
          muc_tieu: 'Giảm đau, giảm co cứng cơ vùng cổ, vai và gáy do duy trì tư thế ngồi lâu.\nKhôi phục biên độ vận động của cổ (cúi, ngửa, xoay cổ linh hoạt).\nTăng tuần hoàn máu, giảm chèn ép rễ thần kinh và hạn chế đau mỏi tái phát.',
          quy_trinh: '1. Nhiệt trị liệu & Thư giãn mô mềm: Chườm nóng kết hợp xoa bóp day miết làm mềm mô cơ nông và tăng lưu thông máu vùng cổ vai gáy.\n2. Trị liệu thủ công (Manual Therapy) & Kéo giãn: Tác động sâu giải phóng nút thắt cơ (Trigger points) và kéo giãn tăng độ linh hoạt đốt sống cổ.\n3. Điện xung & Siêu âm trị liệu: Dòng điện xung và sóng siêu âm điều trị giúp tiêu viêm, giảm đau rễ thần kinh sâu và chống co thắt cơ.\n4. Bài tập phục hồi chức năng & HEP: Hướng dẫn bài tập tăng sức mạnh cơ cổ vai gáy, cải thiện tư thế và chương trình tự tập tại nhà.',
          han_su_dung_mac_dinh_ngay: 60,
          trang_thai: 'hoat_dong'
        },
        {
          id: 'c1000000-0000-0000-0000-000000000202',
          ten_goi: 'Liệu trình Điều trị Đau Lưng Văn Phòng',
          loai_goi: 'LIEU_TRINH',
          tong_so_buoi: 10,
          thoi_luong_phut: 75,
          don_gia: BigInt(3200000),
          don_gia_theo_buoi: BigInt(320000),
          anh_goi: '/images/goi/anh_dai_dien_lieu_trinh_dieu_tri_dau_lung_van_phong.png',
          anh_gallery: ['/images/goi/anh_con_lieu_trinh_dieu_tri_dau_lung_van_phong_1.png'],
          muc_tieu: 'Giảm đau thắt lưng, giảm co cứng cơ lưng do ngồi lâu hoặc sai tư thế.\nCải thiện sự dẻo dai cột sống và tăng khả năng chịu tải của cơ thắt lưng.\nTăng cường sức mạnh nhóm cơ lõi (Core) giúp ổn định cột sống và hạn chế tái phát.',
          quy_trinh: '1. Nhiệt trị liệu & Thư giãn mô mềm vùng lưng: Chườm nóng làm giãn nở vi mạch, giảm căng cứng các nhóm cơ thắt lưng dưới.\n2. Trị liệu thủ công & Kéo giãn cột sống: Nắn chỉnh di động khớp nhẹ nhàng, kéo giãn giảm áp lực lên đĩa đệm và rễ thần kinh thắt lưng.\n3. Điện xung & Siêu âm trị liệu: Sử dụng dòng điện xung TENS/EMS và sóng siêu âm ức chế đường truyền đau, giảm co thắt cơ lưng sâu.\n4. Bài tập tăng cường cơ Core & HEP: Hướng dẫn bài tập củng cố nhóm cơ lõi lưng bụng và thiết lập chương trình tự tập tại nhà.',
          han_su_dung_mac_dinh_ngay: 60,
          trang_thai: 'hoat_dong'
        },
        {
          id: 'c1000000-0000-0000-0000-000000000203',
          ten_goi: 'Liệu trình Cải thiện Tư thế Văn phòng',
          loai_goi: 'LIEU_TRINH',
          tong_so_buoi: 12,
          thoi_luong_phut: 90,
          don_gia: BigInt(3600000),
          don_gia_theo_buoi: BigInt(300000),
          anh_goi: '/images/goi/anh_dai_dien_lieu_trinh_cai_thien_tu_the_van_phong.png',
          anh_gallery: ['/images/goi/anh_con_lieu_trinh_cai_thien_tu_the_van_phong_1.png'],
          muc_tieu: 'Đánh giá và cải thiện sai lệch tư thế cổ đưa ra trước, vai lệch và gù lưng nhẹ.\nGiảm đau mỏi vùng cổ, vai, lưng do duy trì tư thế không đúng kéo dài.\nTăng cường sức mạnh cơ trung tâm (Core) và duy trì tư thế công thái học chuẩn.',
          quy_trinh: '1. Giải cơ sâu & Kéo giãn cơ co rút: Tác động giải phóng các bó cơ ngực lớn và cơ cổ trước bị co ngắn do thói quen gù lưng vai tròn.\n2. Trị liệu thủ công nắn chỉnh cột sống: Cải thiện tầm vận động khớp, điều chỉnh sự sai lệch nhẹ của trục cột sống cổ, ngực và thắt lưng.\n3. Điện xung kích thích cơ yếu: Dùng dòng điện xung kích thích phục hồi các nhóm cơ lưng sau bị suy yếu, tăng khả năng giữ tư thế thẳng.\n4. Bài tập chỉnh tư thế & Kinetic Core: Rèn luyện bài tập chuyên biệt điều chỉnh gù lưng, vai tròn và hướng dẫn thói quen tư thế đúng.',
          han_su_dung_mac_dinh_ngay: 60,
          trang_thai: 'hoat_dong'
        },
        {
          id: 'c1000000-0000-0000-0000-000000000204',
          ten_goi: 'Liệu trình Phục hồi Chức năng Văn phòng (Chuyên sâu)',
          loai_goi: 'LIEU_TRINH',
          tong_so_buoi: 15,
          thoi_luong_phut: 90,
          don_gia: BigInt(4500000),
          don_gia_theo_buoi: BigInt(300000),
          anh_goi: '/images/goi/anh_dai_dien_lieu_trinh_phuc_hoi_chuc_nang_van_phong.png',
          anh_gallery: ['/images/goi/anh_con_lieu_trinh_phuc_hoi_chuc_nang_van_phong_1.png'],
          muc_tieu: 'Phục hồi chức năng vận động toàn diện cho khách hàng gặp đau vai gáy, đau lưng và sai tư thế.\nTăng sức mạnh hệ cơ, độ dẻo dai của khớp và khả năng ổn định cột sống.\nXây dựng nền tảng vận động bền vững, ngăn ngừa đau mỏi mạn tính tái phát.',
          quy_trinh: '1. Nhiệt trị liệu & Thư giãn mô mềm toàn thân: Chườm nóng kết hợp xoa bóp giải tỏa căng cứng cơ đa vùng (cổ, vai, lưng).\n2. Trị liệu thủ công chuyên sâu: Nắn chỉnh di động khớp, giải phóng chèn ép rễ thần kinh và kéo giãn phục hồi biên độ vận động.\n3. Điện xung & Siêu âm trị liệu công nghệ cao: Tiêu viêm sâu, giảm đau tức thì và tăng tốc độ tái tạo mô cơ xương khớp.\n4. Bài tập PHCN cá nhân hóa & HEP: Thiết lập bài tập củng cố hệ cơ core toàn diện, chỉnh tư thế chuẩn và bài tập duy trì tại nhà.',
          han_su_dung_mac_dinh_ngay: 70,
          trang_thai: 'hoat_dong'
        },
        {
          id: 'c1000000-0000-0000-0000-000000000205',
          ten_goi: 'Liệu trình Điều trị Hội chứng Ống Cổ Tay & Bao Gân',
          loai_goi: 'LIEU_TRINH',
          tong_so_buoi: 6,
          thoi_luong_phut: 45,
          don_gia: BigInt(1800000),
          don_gia_theo_buoi: BigInt(300000),
          anh_goi: '/images/goi/anh_dai_dien_lieu_trinh_dieu_tri_ong_co_tay.png',
          anh_gallery: ['/images/goi/anh_con_lieu_trinh_dieu_tri_ong_co_tay_1.png'],
          muc_tieu: 'Giảm đau, giảm viêm bao gân ngón cái và giải phóng áp lực chèn ép dây thần kinh giữa trong ống cổ tay.\nChấm dứt cảm giác tê bì đầu ngón tay cái, trỏ, giữa; khôi phục lực cầm nắm và khả năng làm việc bình thường.\nXây dựng thói quen công thái học khi dùng chuột/bàn phím, ngăn ngừa tái phát hội chứng Mouse Arm.',
          quy_trinh: '1. Nhiệt trị liệu & Giải cơ mô mềm cẳng tay: Chườm nóng thảo dược kết hợp xoa bóp làm mềm các cơ gấp ngón tay.\n2. Siêu âm trị liệu & Điện xung tiêu viêm: Sóng siêu âm tần số 3MHz tác động sâu vào bao gân ngón cái kết hợp điện xung giảm tê bì rễ thần kinh.\n3. Kỹ thuật trượt dây thần kinh giữa (Nerve Gliding): Vận động trị liệu chuyên biệt giúp dây thần kinh giữa trượt trơn tru trong ống cổ tay.\n4. Di động khớp cổ tay & Nẹp hỗ trợ: Nắn chỉnh di động xương cổ tay và tư vấn băng nẹp bảo vệ khớp cổ tay đúng cách.\n5. Bài tập tăng cơ lực bàn tay & Thói quen công thái học: Hướng dẫn bài tập bóp bóng phục hồi lực nắm và điều chỉnh góc tì cổ tay.',
          han_su_dung_mac_dinh_ngay: 45,
          trang_thai: 'hoat_dong'
        }
      ]
    });

    // Phase 3: Expert Database Reconstruction (Bác sĩ & Kỹ thuật viên)
    console.log('Phase 3: Đang chèn tài khoản các Chuyên gia...');
    const hash = '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu'; // admin123

    // Insert Users (Bác sĩ id: 5,6. KTV id: 7,8,9,10)
    await prisma.nguoi_dung.createMany({
      data: [
        {
          id: 5,
          ho_ten: 'BS. CKI Nguyễn Minh Đức',
          email: 'duc.nguyen@officecare.vn',
          so_dien_thoai: '0901000105',
          mat_khau_hash: hash,
          vai_tro_id: 4,
          trang_thai: 'hoat_dong',
          anh_dai_dien: '/images/nhansu/dr_nguyen_minh_duc.png'
        },
        {
          id: 6,
          ho_ten: 'BS. Trần Thị Thu Trang',
          email: 'trang.tran@officecare.vn',
          so_dien_thoai: '0901000106',
          mat_khau_hash: hash,
          vai_tro_id: 4,
          trang_thai: 'hoat_dong',
          anh_dai_dien: '/images/nhansu/dr_tran_thi_thu_trang.png'
        },
        {
          id: 7,
          ho_ten: 'Lê Văn Dương',
          email: 'duong.le@officecare.vn',
          so_dien_thoai: '0901000107',
          mat_khau_hash: hash,
          vai_tro_id: 3,
          trang_thai: 'hoat_dong',
          anh_dai_dien: '/images/nhansu/ktv_le_van_duong.png'
        },
        {
          id: 8,
          ho_ten: 'Nguyễn Thùy Linh',
          email: 'linh.nguyen@officecare.vn',
          so_dien_thoai: '0901000108',
          mat_khau_hash: hash,
          vai_tro_id: 3,
          trang_thai: 'hoat_dong',
          anh_dai_dien: '/images/nhansu/ktv_nguyen_thuy_linh.png'
        },
        {
          id: 9,
          ho_ten: 'Phạm Thành Nam',
          email: 'nam.pham@officecare.vn',
          so_dien_thoai: '0901000109',
          mat_khau_hash: hash,
          vai_tro_id: 3,
          trang_thai: 'hoat_dong',
          anh_dai_dien: '/images/nhansu/ktv_pham_thanh_nam.png'
        },
        {
          id: 10,
          ho_ten: 'Đặng Minh Anh',
          email: 'anh.dang@officecare.vn',
          so_dien_thoai: '0901000110',
          mat_khau_hash: hash,
          vai_tro_id: 3,
          trang_thai: 'hoat_dong',
          anh_dai_dien: '/images/nhansu/ktv_dang_minh_anh.png'
        }
      ]
    });

    console.log('Phase 3: Đang tạo hồ sơ chi tiết cho các Chuyên gia...');
    await prisma.ho_so_chuyen_gia.createMany({
      data: [
        {
          id: 1,
          nguoi_dung_id: 5,
          so_nam_kinh_nghiem: 12,
          bang_cap_chung_chi: JSON.stringify({
            text: 'Bác sĩ Chuyên khoa I PHCN - ĐH Y Dược TP.HCM\nChứng nhận đào tạo Trị liệu thần kinh cột sống Chiropractic y khoa Singapore\nChứng chỉ hành nghề Phục hồi chức năng cơ xương khớp Bộ Y tế cấp',
            images: ['/images/nhansu/cert_chiropractic_singapore.png', '/images/nhansu/cert_laser_shockwave_intl.png']
          }),
          mo_ta: 'Bác sĩ Nguyễn Minh Đức là chuyên gia hàng đầu về cơ xương khớp cột sống với hơn 12 năm kinh nghiệm thực tế. Từng công tác tại các chuyên khoa Phục hồi chức năng lớn, ông nổi tiếng với phương pháp khám cơ sinh học vận động sâu sắc, tìm ra chính xác trục lệch cột sống do ngồi sai tư thế. Bác sĩ Đức đã trực tiếp xây dựng phác đồ phục hồi không dùng thuốc cho hơn 2.000 bệnh nhân văn phòng gặp tình trạng thoát vị đĩa đệm lưng và thoái hóa cột sống cổ, giúp họ giải thoát khỏi cơn đau mạn tính dai dẳng, khôi phục chất lượng cuộc sống cao.',
          the_manh: ['Trị liệu thoát vị đĩa đệm thắt lưng', 'Khám lượng giá sinh cơ học cột sống', 'Điều trị Chiropractic y khoa', 'Thiết lập phác đồ PHCN cá nhân hóa']
        },
        {
          id: 2,
          nguoi_dung_id: 6,
          so_nam_kinh_nghiem: 8,
          bang_cap_chung_chi: JSON.stringify({
            text: 'Thạc sĩ Vật lý trị liệu & PHCN - Đại học Y Hà Nội\nChứng chỉ kỹ thuật Laser siêu cao tần và Shockwave hội tụ chuẩn Quốc tế\nChứng chỉ hành nghề Chuyên môn vật lý trị liệu Bộ Y tế cấp',
            images: ['/images/nhansu/cert_laser_shockwave_intl.png', '/images/nhansu/cert_manual_therapy_aus.png']
          }),
          mo_ta: 'Bác sĩ Trần Thị Thu Trang sở hữu chuyên môn vững vàng trong điều trị các bệnh lý đau mỏi vai gáy cấp và mạn tính của dân công sở. Với 8 năm kinh nghiệm chuyên sâu, bà luôn áp dụng sáng tạo các công nghệ y học vật lý như Laser công suất cao tiêu viêm sâu và sóng xung kích Shockwave phá vỡ các điểm xơ cơ (Trigger Points), mang lại hiệu quả giảm đau tức thì cho bệnh nhân mà không gây đau buốt hay cần can thiệp xâm lấn.',
          the_manh: ['Trị liệu hội chứng cổ vai gáy mạn tính', 'Tiêu viêm rễ thần kinh bằng Laser', 'Sóng xung kích giải trigger points', 'Phục hồi chấn thương bả vai']
        },
        {
          id: 3,
          nguoi_dung_id: 7,
          so_nam_kinh_nghiem: 6,
          bang_cap_chung_chi: JSON.stringify({
            text: 'Cử nhân Vật lý trị liệu - Đại học Y Dược TP.HCM\nChứng chỉ kỹ thuật di động khớp khớp cột sống Manual Therapy tiêu chuẩn Úc',
            images: ['/images/nhansu/cert_manual_therapy_aus.png']
          }),
          mo_ta: 'Kỹ thuật viên Lê Văn Dương được mệnh danh là chuyên gia có đôi tay vàng trong trị liệu giải phóng cơ khớp. Với 6 năm kinh nghiệm thực hành trị liệu bằng tay (Manual Therapy) và di động khớp chuyên sâu, anh giúp bệnh nhân khôi phục hoàn toàn biên độ vận động của các khớp đốt sống cổ và thắt lưng bị kẹt do tư thế làm việc gù ngồi kéo dài.',
          the_manh: ['Kỹ thuật di động khớp Manual Therapy', 'Giải cơ sâu Myofascial Release', 'Nắn khớp thắt lưng giải kẹt', 'Xoa bóp cơ học y khoa sâu']
        },
        {
          id: 4,
          nguoi_dung_id: 8,
          so_nam_kinh_nghiem: 5,
          bang_cap_chung_chi: JSON.stringify({
            text: 'Cử nhân Vật lý trị liệu - PHCN Đại học Y Dược\nChứng chỉ bài tập y khoa phục hồi vận động Kinetic Rehab do Hội PHCN cấp',
            images: ['/images/nhansu/cert_chiropractic_singapore.png']
          }),
          mo_ta: 'Kỹ thuật viên Nguyễn Thùy Linh chuyên trách vận động trị liệu chủ động. Cô có hơn 5 năm kinh nghiệm đồng hành cùng bệnh nhân thực hiện các bài tập Kinetic phục hồi tư thế, tăng cơ lõi core lưng bụng. Cô đặc biệt mát tay trong điều trị bảo tồn hội chứng ống cổ tay cho dân IT, thiết kế đồ họa và kế toán.',
          the_manh: ['Vận động trị liệu Kinetic Rehab', 'Phục hồi hội chứng ống cổ tay', 'Hướng dẫn tập chỉnh lệch tư thế', 'Kéo giãn cơ co rút sâu']
        },
        {
          id: 5,
          nguoi_dung_id: 9,
          so_nam_kinh_nghiem: 4,
          bang_cap_chung_chi: JSON.stringify({
            text: 'Chứng chỉ Kỹ thuật viên Vật lý trị liệu Trường Cao đẳng Y tế\nChứng chỉ Vận hành máy trị liệu công nghệ cao Bệnh viện Chợ Rẫy',
            images: ['/images/nhansu/cert_laser_shockwave_intl.png']
          }),
          mo_ta: 'Kỹ thuật viên Phạm Thành Nam là chuyên gia vận hành thiết bị vật lý trị liệu hiện đại. Anh chịu trách nhiệm chính điều phối giường kéo giãn cột sống giảm áp áp lực âm kỹ thuật số, cài đặt thông số điện xung giảm đau mỏi lưng dưới. Sự chu đáo và theo dõi thông số chuẩn xác của anh giúp bệnh nhân phục hồi cực kỳ an tâm.',
          the_manh: ['Vận hành máy kéo giãn giảm áp', 'Cài đặt điện xung y khoa', 'Siêu âm bao gân trị liệu', 'Theo dõi thông số an toàn thiết bị']
        },
        {
          id: 6,
          nguoi_dung_id: 10,
          so_nam_kinh_nghiem: 4,
          bang_cap_chung_chi: JSON.stringify({
            text: 'Chứng chỉ Kỹ thuật viên Massage trị liệu y học cổ truyền\nChứng chỉ trị liệu giải phóng màng cơ myofascial sâu Viện PHCN',
            images: ['/images/nhansu/cert_manual_therapy_aus.png']
          }),
          mo_ta: 'Kỹ thuật viên Đặng Minh Anh chuyên sâu về trị liệu giải cơ ngực lớn, cơ chéo cổ trước và phục hồi thẩm mỹ tư thế vai tròn gù lưng. Cô áp dụng nhuần nhuyễn sự kết hợp lực tay mềm mại, ấn huyệt kích hoạt lưu thông máu vùng vai cổ giúp bệnh nhân xua tan căng thẳng thể chất lẫn tinh thần sau ngày làm việc bận rộn.',
          the_manh: ['Điều chỉnh vai tròn gù lưng', 'Giải tỏa cơ co thắt ngực/cổ', 'Massage bấm huyệt trị liệu', 'Giãn cơ sâu thư giãn vùng gáy']
        }
      ]
    });

    // Reset sequences for auto-increments
    await pool.query("SELECT setval('nguoi_dung_id_seq', (SELECT MAX(id) FROM nguoi_dung));");
    await pool.query("SELECT setval('ho_so_chuyen_gia_id_seq', (SELECT MAX(id) FROM ho_so_chuyen_gia));");

    // Phase 4: Create SEO-Optimized Articles
    console.log('Phase 4: Đang chèn 10 bài viết chuẩn SEO chất lượng cao...');

    const articles = [
      // 1. Sức khỏe
      {
        tieu_de: 'Tác hại khôn lường của ngồi sai tư thế đối với dân văn phòng',
        slug: 'tac-hai-ngoi-sai-tu-the-dan-van-phong',
        tom_tat: 'Ngồi làm việc liên tục 8 tiếng sai tư thế tàn phá cột sống thắt lưng và cổ vai gáy của bạn như thế nào? Tìm hiểu ngay tác hại khôn lường và cách khắc phục hiệu quả.',
        danh_muc: 'suc_khoe',
        trang_thai: 'xuat_ban',
        meta_title: 'Tác hại khôn lường của ngồi sai tư thế đối với dân văn phòng',
        meta_description: 'Ngồi sai tư thế khi làm việc 8 tiếng tàn phá cột sống nghiêm trọng. Tìm hiểu các tác hại khôn lường và phương pháp phục hồi cột sống hiệu quả tại OfficeCare.',
        meta_keywords: 'ngồi sai tư thế, đau cột sống, dân văn phòng, thoái hóa cột sống, phục hồi chức năng',
        anh_bia: '/images/physio_hero.png',
        nguoi_viet_id: 1, // Admin
        ngay_dang: new Date(),
        noi_dung: `
          <p>Hơn 80% nhân viên văn phòng gặp các vấn đề về cơ xương khớp do thói quen ngồi làm việc liên tục trước máy tính mà không chú ý đến tư thế đúng. Việc này không chỉ gây ra những cơn mỏi mệt tạm thời mà còn dẫn đến các bệnh lý thoái hóa nghiêm trọng.</p>
          
          <h2>1. Cột sống bị tàn phá do ngồi sai tư thế như thế nào?</h2>
          <p>Khi ngồi gù lưng hoặc nhô đầu về phía trước, trọng lượng đầu tác động lên cột sống cổ tăng gấp 2-3 lần thông thường. Lâu ngày, các đĩa đệm giữa các đốt sống bị ép lệch tâm, dẫn đến thoát vị đĩa đệm, chèn ép rễ thần kinh gây đau đớn và tê bì tay chân.</p>
          
          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/physio_hero.png" alt="Mô phỏng cột sống cổ chịu áp lực khi ngồi sai tư thế" />
          
          <h2>2. Những hội chứng phổ biến nhất ở giới công sở</h2>
          <ul>
            <li><strong>Hội chứng Tech-Neck (Cổ công nghệ):</strong> Do nhô đầu ra trước quá nhiều để nhìn màn hình, cơ cổ sau bị căng giãn quá mức và xơ cứng.</li>
            <li><strong>Đau thắt lưng cơ năng:</strong> Do ngồi thụ động trên ghế không hỗ trợ cột sống, cơ core thắt lưng yếu dẫn đến toàn bộ trọng lượng dồn lên đĩa đệm thắt lưng.</li>
            <li><strong>Hội chứng ống cổ tay:</strong> Cổ tay bị tì đè liên tục lên mặt bàn hoặc chuột máy tính làm chèn ép dây thần kinh giữa.</li>
          </ul>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/recovery_journey.png" alt="Khách hàng tập phục hồi chức năng cột sống thắt lưng tại OfficeCare" />

          <h2>3. Giải pháp khắc phục hiệu quả tại OfficeCare</h2>
          <p>Tại OfficeCare, chúng tôi áp dụng phác đồ điều trị <strong>không dùng thuốc - không phẫu thuật</strong>, kết hợp kỹ thuật trị liệu bằng tay giải cơ sâu điểm xơ cơ và các bài tập phục hồi tư thế Kinetic Core. Nếu bạn đang có dấu hiệu đau mỏi kéo dài, hãy liên hệ ngay với chúng tôi để được Bác sĩ lượng giá cột sống cổ và thắt lưng kịp thời.</p>
        `
      },
      {
        tieu_de: 'Chế độ dinh dưỡng và sinh hoạt tối ưu cho hệ xương khớp dẻo dai',
        slug: 'dinh-duong-sinh-hoat-xuong-khop-deo-dai',
        tom_tat: 'Duy trì hệ xương khớp khỏe mạnh cho dân công sở bằng chế độ ăn giàu canxi, vitamin D và thói quen vận động thông minh tại bàn làm việc.',
        danh_muc: 'suc_khoe',
        trang_thai: 'xuat_ban',
        meta_title: 'Dinh dưỡng và sinh hoạt tối ưu giúp xương khớp dẻo dai',
        meta_description: 'Chế độ dinh dưỡng giàu canxi, vitamin D kết hợp thói quen sinh hoạt khoa học là chìa khóa duy trì hệ xương khớp dẻo dai cho dân công sở.',
        meta_keywords: 'dinh dưỡng xương khớp, canxi, vitamin d, dân văn phòng, đau xương khớp',
        anh_bia: '/images/physio_premium_facility.png',
        nguoi_viet_id: 1,
        ngay_dang: new Date(),
        noi_dung: `
          <p>Xương khớp dẻo dai không chỉ đến từ việc tập luyện mà còn phụ thuộc lớn vào nguồn dinh dưỡng nạp vào hàng ngày và lối sống năng động. Với giới văn phòng thường xuyên làm việc trong máy lạnh, thiếu ánh nắng mặt trời, việc bổ sung vi chất là vô cùng cần thiết.</p>

          <h2>1. Nhóm chất dinh dưỡng vàng cho đĩa đệm và sụn khớp</h2>
          <p>Đĩa đệm cột sống có cấu trúc ngậm nước, do đó uống đủ từ 2-2.5 lít nước mỗi ngày giúp giữ đĩa đệm luôn căng phồng đàn hồi. Bên cạnh đó, các thực phẩm giàu Omega-3 (cá hồi, hạt chia), Canxi (sữa, rau màu xanh đậm) và Vitamin D3-K2 giúp tối ưu hóa mật độ xương, giảm viêm cơ bắp.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/physio_premium_facility.png" alt="Không gian thư giãn bổ sung vi chất sức khỏe tại OfficeCare" />

          <h2>2. Tăng cường vận động chủ động tại văn phòng</h2>
          <p>Tránh ngồi liên tục quá 60 phút. Cứ mỗi giờ làm việc, bạn nên đứng dậy thực hiện vài động tác xoay cổ, nghiêng sườn hoặc đi lại lấy nước. Hoạt động này kích thích sản sinh dịch khớp, bôi trơn các đầu sụn khớp ngăn ngừa thoái hóa sớm.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/therapist_treatment.png" alt="Chuyên gia xoa bóp trị liệu giúp tuần hoàn máu lưu thông tốt hơn" />

          <h2>3. Lượng giá và chăm sóc xương khớp định kỳ</h2>
          <p>Định kỳ thăm khám và lượng giá tầm vận động cơ xương khớp giúp phát hiện sớm các điểm lệch cơ sinh học trước khi chúng phát triển thành đau nhức cấp tính. OfficeCare cung cấp gói tầm soát cột sống ban đầu giúp bạn có cái nhìn tổng quan về hệ cơ xương khớp của mình.</p>
        `
      },
      // 2. Điều trị
      {
        tieu_de: 'Trị liệu giải cơ sâu - Khắc tinh của đau vai gáy mãn tính',
        slug: 'tri-lieu-giai-co-sau-dau-vai-gay-man-tinh',
        tom_tat: 'Giải thích nguyên lý khoa học của trị liệu giải cơ sâu (Myofascial Release) trong việc giải phóng các nút thắt cơ đau nhức bả vai ở dân văn phòng.',
        danh_muc: 'dieu_tri',
        trang_thai: 'xuat_ban',
        meta_title: 'Trị liệu giải cơ sâu - Giải pháp đau vai gáy mãn tính',
        meta_description: 'Trị liệu giải cơ sâu Myofascial Release tác động vào điểm xơ cơ bả vai, chấm dứt ngay tình trạng đau mỏi cổ vai gáy mãn tính cho dân văn phòng.',
        meta_keywords: 'giải cơ sâu, myofascial release, đau vai gáy, trigger points, trị liệu bằng tay',
        anh_bia: '/images/goi/giai_co_sau.png',
        nguoi_viet_id: 5, // Bác sĩ Minh Đức
        ngay_dang: new Date(),
        noi_dung: `
          <p>Đau vai gáy mạn tính là nỗi ám ảnh thường trực của dân công sở. Dù đã massage thông thường nhưng cảm giác đau nhức vẫn quay lại sau vài ngày. Đó là do các nút thắt xơ hóa (trigger points) nằm sâu bên dưới màng cơ chưa được giải tỏa hoàn toàn.</p>

          <h2>1. Trị liệu giải cơ sâu Myofascial Release là gì?</h2>
          <p>Khác với massage thư giãn bề mặt, trị liệu giải cơ sâu là kỹ thuật trị liệu bằng tay chuyên khoa. Kỹ thuật viên sẽ sử dụng lực ngón tay và cùi chỏ tác động sâu, liên tục vào lớp màng bao bọc cơ (fascia) bị co thắt, hóa cứng để phá vỡ các nút thắt xơ, phục hồi độ đàn hồi tự nhiên của bó cơ.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/goi/giai_co_sau.png" alt="Kỹ thuật viên thực hiện giải cơ sâu vai gáy bằng tay" />

          <h2>2. Tác dụng vượt trội của giải cơ sâu tại OfficeCare</h2>
          <ul>
            <li><strong>Chấm dứt đau nhức tận gốc:</strong> Giải phóng hoàn toàn các sợi cơ bị căng cứng, trả lại trạng thái thư giãn ban đầu.</li>
            <li><strong>Tăng lưu lượng tuần hoàn máu:</strong> Loại bỏ các chất thải chuyển hóa tích tụ trong cơ, giúp máu mang oxy nuôi dưỡng tế bào cơ tốt hơn.</li>
            <li><strong>Khôi phục tầm vận động cổ:</strong> Giúp cổ xoay, nghiêng dễ dàng không còn bị giới hạn biên độ.</li>
          </ul>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/therapist_treatment.png" alt="Khách hàng trải nghiệm buổi giải cơ nhiệt trị liệu chuyên nghiệp" />

          <h2>3. Quy trình thực hiện chuẩn y khoa</h2>
          <p>Mỗi ca giải cơ sâu tại OfficeCare đều được chườm nóng hồng ngoại trước để làm mềm mô cơ nông. Sau đó KTV mới thực hiện giải cơ bằng tay và kết hợp tập vận động kéo giãn chủ động. Phác đồ này giúp tối đa hiệu quả giảm đau mà không gây bầm tím tổn thương mô mềm.</p>
        `
      },
      {
        tieu_de: 'Điều trị thoát vị đĩa đệm không phẫu thuật bằng giường kéo giãn giảm áp cột sống',
        slug: 'dieu-tri-thoat-vi-dia-dem-giuong-keo-gian-giam-ap',
        tom_tat: 'Phương pháp kéo giãn giảm áp cột sống bằng giường áp lực âm kỹ thuật số giúp co hồi đĩa đệm thoát vị, giải ép rễ thần kinh an toàn và hiệu quả.',
        danh_muc: 'dieu_tri',
        trang_thai: 'xuat_ban',
        meta_title: 'Kéo giãn giảm áp cột sống trị thoát vị đĩa đệm',
        meta_description: 'Phương pháp kéo giãn cột sống áp lực âm kỹ thuật số tại OfficeCare giúp phục hồi thoát vị đĩa đệm nhẹ và vừa không cần phẫu thuật.',
        meta_keywords: 'kéo giãn cột sống, thoát vị đĩa đệm, giải áp cột sống, giảm đau lưng, vật lý trị liệu',
        anh_bia: '/images/physio_treatment_room.png',
        nguoi_viet_id: 5,
        ngay_dang: new Date(),
        noi_dung: `
          <p>Thoát vị đĩa đệm thắt lưng là hậu quả nghiêm trọng của việc ngồi quá lâu và sai tư thế kéo dài. Rất nhiều người lo lắng phải can thiệp phẫu thuật đau đớn. Tuy nhiên, y học hiện đại đã chứng minh phương pháp kéo giãn giảm áp cột sống có thể điều trị bảo tồn hiệu quả đến 90% các ca bệnh nhẹ và trung bình.</p>

          <h2>1. Nguyên lý cơ học của giường kéo giãn giảm áp cột sống</h2>
          <p>Khi cột sống thắt lưng được kéo giãn nhẹ nhàng với lực kéo được tính toán tự động bằng máy tính dựa trên cân nặng của bệnh nhân, khoảng cách giữa các đốt sống sẽ được mở rộng ra. Quá trình này tạo nên một áp suất âm bên trong đĩa đệm, giúp hút nhân nhầy thoát vị co hồi ngược trở lại vị trí ban đầu.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/physio_treatment_room.png" alt="Hệ thống giường kéo giãn giảm áp thắt lưng tại OfficeCare" />

          <h2>2. Lợi ích của phương pháp kéo giãn giảm áp cột sống</h2>
          <ul>
            <li><strong>Giải phóng chèn ép rễ thần kinh:</strong> Giảm tê bì chân và mông nhanh chóng.</li>
            <li><strong>Tăng cường dinh dưỡng đĩa đệm:</strong> Tạo điều kiện cho oxy, nước và chất dinh dưỡng thấm sâu phục hồi nhân nhầy đĩa đệm.</li>
            <li><strong>An toàn tuyệt đối:</strong> Lực kéo được cá nhân hóa hoàn toàn qua phần mềm y khoa, không gây đau buốt cho người bệnh.</li>
          </ul>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/recovery_journey.png" alt="Bác sĩ thăm khám theo dõi thông số kéo giãn đĩa đệm" />

          <h2>3. Liệu trình kết hợp tại OfficeCare</h2>
          <p>Tại OfficeCare, chúng tôi không chỉ kéo giãn cơ học mà còn kết hợp chiếu tia Laser công suất cao để tiêu viêm rễ thần kinh cấp tốc và hướng dẫn các bài tập phục hồi nhóm cơ core giữ vững cột sống lâu dài sau điều trị.</p>
        `
      },
      // 3. Tin tức
      {
        tieu_de: 'OfficeCare khai trương phòng trị liệu và phục hồi chức năng Kinetic Rehab cao cấp',
        slug: 'officecare-khai-truong-phong-tri-lieu-kinetic-rehab',
        tom_tat: 'OfficeCare Premium Rehab chính thức khai trương cơ sở mới, mang đến không gian sang trọng cùng công nghệ phục hồi chức năng vận động Kinetic tối tân nhất.',
        danh_muc: 'tin_tuc',
        trang_thai: 'xuat_ban',
        meta_title: 'Khai trương phòng trị liệu OfficeCare Kinetic Rehab cao cấp',
        meta_description: 'OfficeCare Premium Rehab khai trương cơ sở mới với không gian đẳng cấp, trang thiết bị tối tân chuyên sâu phục hồi cơ xương khớp cho giới văn phòng.',
        meta_keywords: 'officecare khai trương, phòng khám vật lý trị liệu, phục hồi chức năng, quận 1',
        anh_bia: '/images/physio_clinic_villa.png',
        nguoi_viet_id: 1,
        ngay_dang: new Date(),
        noi_dung: `
          <p>Với mục tiêu nâng tầm chất lượng dịch vụ chăm sóc sức khỏe xương khớp chủ động, OfficeCare chính thức khai trương trung tâm phục hồi chức năng cao cấp chuẩn Premium Rehab tại trung tâm thành phố. Đây hứa hẹn là địa chỉ tin cậy chăm sóc sức khỏe cho giới tri thức và nhân viên văn phòng bận rộn.</p>

          <h2>1. Không gian trị liệu Premium biệt lập và đẳng cấp</h2>
          <p>Được thiết kế theo phong cách tối giản xanh, tinh tế và riêng tư, cơ sở mới của OfficeCare xóa tan cảm giác ngột ngạt của bệnh viện truyền thống. Khách hàng đến khám và trị liệu sẽ được tận hưởng không gian thư thái, biệt lập để vừa phục hồi cột sống vừa tái tạo năng lượng tinh thần.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/physio_clinic_villa.png" alt="Toàn cảnh không gian villa phòng khám cao cấp OfficeCare" />

          <h2>2. Đầu tư công nghệ phục hồi chức năng hàng đầu thế giới</h2>
          <p>Phòng khám được trang bị đầy đủ các máy móc y khoa hiện đại nhất như: Máy sóng xung kích Focused Shockwave, Laser công suất cao thế hệ mới nhất và hệ thống giường kéo giãn kỹ thuật số tự động cân bằng lực kéo. Giúp tối đa hóa hiệu quả giảm đau, đẩy nhanh tiến trình hồi phục của mô cơ khớp bị tổn thương.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/physio_premium_facility.png" alt="Thiết bị máy móc hiện đại tại phòng tập phục hồi chức năng" />

          <h2>3. Đội ngũ chuyên gia bác sĩ tận tâm chuyên nghiệp</h2>
          <p>Đến với cơ sở mới, khách hàng sẽ được trực tiếp thăm khám và lên phác đồ bởi các Bác sĩ chuyên khoa I PHCN và thực hiện kỹ thuật bởi các Kỹ thuật viên tốt nghiệp Đại học Y Dược có tay nghề cao, tận tâm chu đáo.</p>
        `
      },
      {
        tieu_de: 'Xu hướng phục hồi chức năng chủ động: Bước tiến mới trong chăm sóc sức khỏe năm 2026',
        slug: 'xu-huong-phuc-hoi-chuc-nang-chu-dong-nam-2026',
        tom_tat: 'Thay vì lạm dụng thuốc giảm đau gây hại dạ dày, phục hồi chức năng chủ động thông qua trị liệu tay và vận động y khoa đang trở thành lối sống lành mạnh mới.',
        danh_muc: 'tin_tuc',
        trang_thai: 'xuat_ban',
        meta_title: 'Xu hướng phục hồi chức năng cơ xương khớp chủ động 2026',
        meta_description: 'Phục hồi chức năng chủ động không dùng thuốc, không phẫu thuật đang là xu hướng bảo vệ xương khớp văn phòng bền vững nhất hiện nay.',
        meta_keywords: 'phục hồi chức năng chủ động, không dùng thuốc, cơ xương khớp văn phòng, xu hướng sức khỏe',
        anh_bia: '/images/therapist_treatment.png',
        nguoi_viet_id: 1,
        ngay_dang: new Date(),
        noi_dung: `
          <p>Trong năm 2026, nhận thức của người dân, đặc biệt là giới văn phòng tri thức về sức khỏe cơ xương khớp đã dịch chuyển mạnh mẽ. Thay vì chờ đến khi đau nặng mới uống thuốc hay phẫu thuật, xu hướng chăm sóc sức khỏe chủ động từ sớm đang dần lên ngôi.</p>

          <h2>1. Tại sao không nên lạm dụng thuốc giảm đau?</h2>
          <p>Các loại thuốc giảm đau kháng viêm nhanh chỉ tạm thời làm lu mờ cảm giác đau nhức nhưng không giải quyết được nguyên nhân gốc rễ là sự lệch cơ và chèn ép cơ học cột sống. Hơn nữa, dùng thuốc kéo dài tàn phá niêm mạc dạ dày, gây suy giảm chức năng gan, thận nghiêm trọng.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/therapist_treatment.png" alt="Trị liệu bằng tay thay thế phương án sử dụng thuốc giảm đau" />

          <h2>2. Phục hồi chức năng chủ động là gì?</h2>
          <p>Đây là sự kết hợp giữa các tác nhân vật lý (laser, xung điện), các kỹ thuật giải cơ nắn khớp bằng tay của chuyên gia để giải quyết điểm đau cơ học, đồng thời người bệnh được tập luyện các bài tập phục hồi y khoa Kinetic để chủ động củng cố hệ cơ, ngăn ngừa đau quay lại.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/recovery_journey.png" alt="Khách hàng tập phục hồi vận động chủ động cùng huấn luyện viên" />

          <h2>3. OfficeCare đi đầu trong xu hướng phục hồi chủ động</h2>
          <p>Chúng tôi tự hào mang đến các gói liệu trình được nghiên cứu chuyên biệt cho giới văn phòng Việt Nam, chú trọng giáo dục tư thế đúng và theo dõi hành trình hồi phục tự nhiên một cách toàn diện nhất.</p>
        `
      },
      // 4. Khuyến mãi
      {
        tieu_de: 'Chương trình OfficeCare Companion: Giải pháp nâng tầm sức khỏe doanh nghiệp công nghệ',
        slug: 'chuong-trinh-officecare-companion-suc-khoe-doanh-nghiep',
        tom_tat: 'Gói chăm sóc cột sống toàn diện tại văn phòng cho các công ty công nghệ và tài chính, giúp nâng cao năng suất và giữ chân nhân tài.',
        danh_muc: 'khuyen_mai',
        trang_thai: 'xuat_ban',
        meta_title: 'OfficeCare Companion - Giải pháp sức khỏe doanh nghiệp',
        meta_description: 'OfficeCare Companion cung cấp dịch vụ khám tầm soát xương khớp và ưu đãi lớn cho các gói tập thể của doanh nghiệp công nghệ, tài chính.',
        meta_keywords: 'sức khỏe doanh nghiệp, officecare companion, tầm soát cột sống, chăm sóc sức khỏe nhân viên',
        anh_bia: '/images/physio_clinic_villa.png',
        nguoi_viet_id: 1,
        ngay_dang: new Date(),
        noi_dung: `
          <p>Nhân sự ngồi nhiều, đau vai gáy và nghỉ ốm thường xuyên là bài toán đau đầu của nhiều doanh nghiệp công nghệ, tài chính hiện nay. Chương trình <strong>OfficeCare Companion</strong> ra đời để mang giải pháp phục hồi chức năng xương khớp cao cấp đến tận văn phòng của bạn.</p>

          <h2>1. Tầm soát cột sống miễn phí tại văn phòng doanh nghiệp</h2>
          <p>OfficeCare phối hợp tổ chức các buổi Workshop chia sẻ kiến thức tư thế ngồi đúng, kết hợp hoạt động tầm soát cột sống cổ và thắt lưng miễn phí bằng các chuyên gia y tế cho toàn bộ nhân viên trong công ty đối tác.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/physio_clinic_villa.png" alt="Workshop tầm soát sức khỏe xương khớp tại doanh nghiệp công nghệ" />

          <h2>2. Chiết khấu đặc quyền cho gói liệu trình tập thể</h2>
          <p>Các doanh nghiệp đăng ký chương trình Companion sẽ nhận được mức chiết khấu độc quyền lên đến 25% cho toàn bộ nhân sự khi mua các gói liệu trình trị liệu đau vai gáy, thoát vị đĩa đệm thắt lưng hay hội chứng ống cổ tay tại hệ thống phòng khám OfficeCare.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/physio_premium_facility.png" alt="Trải nghiệm trị liệu cao cấp cho nhân viên doanh nghiệp đối tác" />

          <h2>3. Nâng cao năng suất và hạnh phúc nhân viên</h2>
          <p>Nhân viên khỏe mạnh, không còn đau nhức mỏi cổ vai gáy sẽ làm việc tập trung hơn, nâng cao hiệu suất công việc rõ rệt và gắn kết bền vững hơn với doanh nghiệp.</p>
        `
      },
      {
        tieu_de: 'Quà tặng đặc quyền: Miễn phí 100% gói khám lâm sàng ban đầu cho nhân viên văn phòng',
        slug: 'mien-phi-goi-kham-lam-sang-ban-dau-van-phong',
        tom_tat: 'Chào đón tháng mới, OfficeCare gửi tặng 50 suất miễn phí khám lâm sàng ban đầu trị giá 150.000đ dành riêng cho nhân sự khối văn phòng.',
        danh_muc: 'khuyen_mai',
        trang_thai: 'xuat_ban',
        meta_title: 'Miễn phí khám lâm sàng cột sống cổ vai gáy OfficeCare',
        meta_description: 'Nhận ngay đặc quyền ưu đãi miễn phí 100% gói khám lâm sàng ban đầu với Bác sĩ PHCN chuyên sâu cho nhân viên văn phòng. Số lượng có hạn!',
        meta_keywords: 'miễn phí gói khám, khám cột sống miễn phí, officecare ưu đãi, đau vai gáy khám ở đâu',
        anh_bia: '/images/goi/kham_sang_loc.png',
        nguoi_viet_id: 1,
        ngay_dang: new Date(),
        noi_dung: `
          <p>Bạn có đang phải chịu đựng những cơn mỏi cổ vai gáy âm ỉ khi gõ phím? Đừng bỏ qua cơ hội vàng để hiểu rõ tình trạng cột sống của mình hoàn toàn miễn phí cùng đội ngũ bác sĩ hàng đầu tại OfficeCare Premium Rehab.</p>

          <h2>1. Nội dung gói khám lâm sàng được tài trợ 100%</h2>
          <p>Gói khám ban đầu trị giá 150.000đ bao gồm đầy đủ các bước khám lâm sàng chuyên sâu:</p>
          <ul>
            <li>Bác sĩ kiểm tra tầm vận động xoay, cúi nghiêng cột sống cổ và thắt lưng.</li>
            <li>Lượng giá sức mạnh nhóm cơ bả vai và cơ liên sườn.</li>
            <li>Phát hiện các điểm lệch trục vai, gù lưng vai tròn gây mất thẩm mỹ tư thế.</li>
            <li>Thiết lập phác đồ trị liệu khoa học phù hợp riêng cho thể trạng từng người.</li>
          </ul>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/goi/kham_sang_loc.png" alt="Bác sĩ khám lâm sàng cột sống cổ cho khách hàng văn phòng" />

          <h2>2. Điều kiện áp dụng chương trình khuyến mãi</h2>
          <p>Chương trình áp dụng cho tất cả khách hàng mới đăng ký qua website hoặc hotline, có mang theo thẻ nhân viên văn phòng hoặc chứng minh công việc văn phòng khi đến thăm khám tại OfficeCare.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/physio_premium_facility.png" alt="Không gian tiếp đón sang trọng hiện đại tại OfficeCare" />

          <h2>3. Đăng ký nhận ưu đãi cực kỳ đơn giản</h2>
          <p>Chỉ cần nhấp vào nút "Đặt lịch hẹn" tại thanh menu, điền thông tin và nhập mã "KHAMFREE2026" để nhận ngay đặc quyền khám miễn phí từ bác sĩ của chúng tôi.</p>
        `
      },
      // 5. Phòng ngừa
      {
        tieu_de: '5 bài tập giãn cơ tại chỗ cực đơn giản giúp ngăn ngừa gù lưng vai tròn',
        slug: '5-bai-tap-gian-co-ngan-ngua-gu-lung-vai-tron',
        tom_tat: 'Dành ra 3 phút mỗi ngày thực hiện các bài tập giãn cơ ngực, cơ cổ vai gáy ngay tại ghế làm việc giúp bảo vệ tư thế chuẩn thẳng đẹp.',
        danh_muc: 'phong_ngua',
        trang_thai: 'xuat_ban',
        meta_title: '5 bài tập giãn cơ tại chỗ ngừa gù lưng vai tròn cho dân công sở',
        meta_description: 'Thực hành ngay 5 bài tập giãn cơ tại chỗ ngay tại văn phòng giúp thư giãn vai gáy và ngăn ngừa hội chứng gù lưng vai tròn hiệu quả.',
        meta_keywords: 'giãn cơ tại chỗ, bài tập gù lưng, phòng ngừa đau vai gáy, bài tập văn phòng, giãn cơ vai gáy',
        anh_bia: '/images/recovery_journey.png',
        nguoi_viet_id: 6, // Bác sĩ Thu Trang
        ngay_dang: new Date(),
        noi_dung: `
          <p>Hội chứng vai tròn gù lưng (Rounded Shoulders) khiến bạn mất đi dáng vẻ tự tin và là nguồn cơn của đau vai gáy mạn tính. Hãy thực hành ngay 5 bài tập giãn cơ y khoa đơn giản ngay tại bàn làm việc để giữ cột sống luôn thẳng đẹp.</p>

          <h2>Bài 1: Giãn cơ ngực lớn chống gù vai</h2>
          <p>Đan hai tay ra sau gáy, từ từ mở rộng khuỷu tay sang hai bên và ưỡn ngực ra trước. Giữ trong 15 giây, lặp lại 3 lần. Bài tập này kéo giãn cơ ngực lớn đang bị co ngắn do gõ phím.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/recovery_journey.png" alt="Kỹ thuật viên hướng dẫn bài tập giãn cơ bả vai" />

          <h2>Bài 2: Kéo giãn cơ thang nghiêng cổ</h2>
          <p>Ngồi thẳng ghế, tay phải vòng qua đầu đặt lên tai trái nhẹ nhàng nghiêng đầu sang bên phải cho đến khi cảm thấy cơ cổ trái căng nhẹ. Giữ 15 giây và đổi bên.</p>

          <h2>Bài 3: Bài tập rụt cằm (Chin Tuck) sửa đầu nhô</h2>
          <p>Nhìn thẳng về phía trước, đặt ngón tay lên cằm và đẩy nhẹ cằm ra phía sau giống như tạo cằm đôi (không cúi đầu). Giữ 5 giây rồi thả lỏng. Thực hiện 10 lần.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/therapist_treatment_banner.png" alt="Khách hàng tự thực hành giãn cơ cổ vai gáy theo hướng dẫn chuyên khoa" />

          <h2>Bài 4: Xoay bả vai mở rộng lồng ngực</h2>
          <p>Đặt các đầu ngón tay lên bả vai cùng bên, xoay khủyu tay theo vòng tròn rộng từ trước ra sau 10 lần giúp khôi phục biên độ vận động của khớp vai bả vai.</p>

          <h2>Tập luyện chủ động định kỳ cùng chuyên gia</h2>
          <p>Nếu bạn đã tập các bài tập trên nhưng vẫn cảm thấy cơ bị bó chặt cứng đau mỏi kéo dài, hãy đến ngay OfficeCare để được chuyên gia nắn chỉnh cơ học và hướng dẫn bài tập chuyên sâu thiết kế riêng cho tư thế của bạn.</p>
        `
      },
      {
        tieu_de: 'Hướng dẫn phòng ngừa hội chứng ống cổ tay cho lập trình viên và kế toán',
        slug: 'huong-dan-phong-ngua-hoi-chung-ong-co-tay',
        tom_tat: 'Tê bì ngón cái và ngón trỏ là biểu hiện ban đầu của hội chứng ống cổ tay. Xem ngay hướng dẫn đặt bàn tay đúng chuẩn khoa học để phòng tránh bệnh.',
        danh_muc: 'phong_ngua',
        trang_thai: 'xuat_ban',
        meta_title: 'Cách phòng ngừa hội chứng ống cổ tay hiệu quả cho lập trình viên',
        meta_description: 'Bí quyết đặt tay gõ phím đúng chuẩn công thái học ngăn ngừa hội chứng ống cổ tay tê bì ngón tay cho lập trình viên và kế toán viên.',
        meta_keywords: 'hội chứng ống cổ tay, tê bì tay, chuột công thái học, dân văn phòng phòng ngừa bệnh',
        anh_bia: '/images/physio_treatment_room.png',
        nguoi_viet_id: 6,
        ngay_dang: new Date(),
        noi_dung: `
          <p>Hội chứng ống cổ tay (Carpal Tunnel Syndrome) rất phổ biến ở những người sử dụng máy tính tần suất cao như lập trình viên, kế toán viên và thiết kế đồ họa. Tổn thương này xảy ra do dây thần kinh giữa bị đè nén liên tục khi đi qua ống cổ tay chật hẹp.</p>

          <h2>1. Nhận diện sớm dấu hiệu chèn ép thần kinh cổ tay</h2>
          <p>Nếu bạn có cảm giác tê buốt như kim châm ở ngón tay cái, ngón trỏ và ngón giữa, đặc biệt là tê nhiều hơn vào ban đêm hoặc khi cầm vô lăng lái xe, cầm điện thoại lâu - đó chính là dấu hiệu cảnh báo dây thần kinh cổ tay của bạn đang bị tổn thương.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/physio_treatment_room.png" alt="Khám sàng lọc tầm soát chèn ép thần kinh cổ tay" />

          <h2>2. Nguyên tắc công thái học (Ergonomics) bảo vệ cổ tay</h2>
          <ul>
            <li><strong>Giữ cổ tay luôn thẳng:</strong> Tránh gập cổ tay lên hoặc xuống quá mức khi gõ phím. Sử dụng đệm nâng đỡ cổ tay nếu cần.</li>
            <li><strong>Sử dụng chuột dọc công thái học:</strong> Chuột công thái học giúp bàn tay xoay nghiêng tự nhiên như khi bắt tay, giảm triệt để lực xoắn chèn ép ống cổ tay.</li>
            <li><strong>Nghỉ ngơi giãn cơ tay:</strong> Cứ sau 45 phút gõ phím, hãy dành ra 1 phút gập giãn ngược cổ tay và xoay nhẹ khớp cổ tay.</li>
          </ul>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/recovery_journey.png" alt="Bài tập giãn cơ cổ tay và bắp tay y khoa tại OfficeCare" />

          <h2>3. Giải quyết hội chứng ống cổ tay từ sớm</h2>
          <p>Tại OfficeCare, chúng tôi điều trị hội chứng ống cổ tay nhẹ và trung bình bằng sóng siêu âm y khoa làm giảm sưng bao gân kết hợp di động xương cổ tay bằng tay giúp giải ép dây thần kinh giữa nhanh chóng mà không cần tiêm thuốc hay phẫu thuật.</p>
        `
      }
    ];

    for (const art of articles) {
      await prisma.bai_viet.create({
        data: art
      });
    }

    console.log('Phase 4: Chèn bài viết chuẩn SEO thành công!');

    // Re-enable trigger
    try {
      await pool.query('ALTER TABLE giao_dich_thanh_toan ENABLE TRIGGER trg_protect_giao_dich_thanh_toan');
    } catch (e) {}

    console.log('🎉 🎉 TẤT CẢ DỮ LIỆU ĐÃ ĐƯỢC THIẾT LẬP LẠI THÀNH CÔNG HÀM SÚC & ĐỦ ĐẦY 🎉 🎉');
  } catch (error) {
    console.error('❌ Có lỗi xảy ra trong quá trình reset và seed dữ liệu:', error);
    try {
      await pool.query('ALTER TABLE giao_dich_thanh_toan ENABLE TRIGGER trg_protect_giao_dich_thanh_toan');
    } catch (e) {}
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();

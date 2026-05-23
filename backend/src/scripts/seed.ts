import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { fakerVI as faker } from '@faker-js/faker';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/office_care',
});

const clearDatabase = async () => {
  console.log('Đang xóa dữ liệu cũ...');
  await pool.query(`
    TRUNCATE TABLE 
      nguoi_dung, vai_tro, khach_hang, chuyen_gia_y_te, danh_muc_dich_vu, dich_vu,
      hoa_don, thanh_toan, voucher, phong, lich_dat, buoi_tri_lieu, danh_gia_dich_vu,
      goi_dich_vu, goi_dich_vu_chi_tiet, lich_dieu_tri, thiet_bi_y_te, lich_lam_viec
    CASCADE;
    ALTER SEQUENCE vai_tro_id_seq RESTART WITH 1;
  `);
};

const seedRoles = async () => {
  console.log('Seeding roles...');
  const { rows } = await pool.query(`
    INSERT INTO vai_tro (ma_vai_tro, ten_hien_thi, mo_ta_quyen) VALUES
      ('khach_hang', 'Khách hàng', 'Xem lịch của mình, đặt lịch, xem gói, gửi feedback'),
      ('le_tan', 'Lễ tân', 'Quản lý lịch hẹn, check-in, tạo hóa đơn, thu tiền'),
      ('ky_thuat_vien', 'Kỹ thuật viên', 'Xem lịch của mình, tạo đánh giá, ghi chú buổi, đề xuất gói'),
      ('bac_si', 'Bác sĩ', 'Quản lý phác đồ điều trị, chẩn đoán, xem hồ sơ bệnh án'),
      ('admin', 'Quản trị viên', 'Toàn quyền hệ thống')
    RETURNING id, ma_vai_tro;
  `);
  return rows.reduce((acc, row) => ({ ...acc, [row.ma_vai_tro]: row.id }), {});
};

const seedUsers = async (roles: any) => {
  console.log('Seeding users...');
  const passwordHash = await bcrypt.hash('123456', 10);

  // Admin
  const { rows: adminRows } = await pool.query(`
    INSERT INTO nguoi_dung (ho_ten, email, so_dien_thoai, mat_khau_hash, vai_tro_id, da_xac_thuc_email)
    VALUES ('Admin Master', 'admin@officecare.com', '0901234567', $1, $2, TRUE) RETURNING id
  `, [passwordHash, roles['admin']]);
  const adminId = adminRows[0].id;

  // Lễ tân
  const { rows: leTanRows } = await pool.query(`
    INSERT INTO nguoi_dung (ho_ten, email, so_dien_thoai, mat_khau_hash, vai_tro_id, da_xac_thuc_email)
    VALUES ('Lễ tân 1', 'letan@officecare.com', '0901234568', $1, $2, TRUE) RETURNING id
  `, [passwordHash, roles['le_tan']]);
  const leTanId = leTanRows[0].id;

  // Bác sĩ
  const { rows: bacSiRows } = await pool.query(`
    INSERT INTO nguoi_dung (ho_ten, email, so_dien_thoai, mat_khau_hash, vai_tro_id, da_xac_thuc_email)
    VALUES ('BS Trần Văn Khám', 'bacsi@officecare.com', '0901234569', $1, $2, TRUE) RETURNING id
  `, [passwordHash, roles['bac_si']]);
  const bacSiId = bacSiRows[0].id;

  await pool.query(`
    INSERT INTO chuyen_gia_y_te (nguoi_dung_id, ma_nhan_vien, chuyen_mon_chinh, so_nam_kinh_nghiem)
    VALUES ($1, 'BS001', 'Bác sĩ chuyên khoa', 10)
  `, [bacSiId]);

  // KTVs
  const ktvUsers = [];
  for (let i = 1; i <= 5; i++) {
    const { rows } = await pool.query(`
      INSERT INTO nguoi_dung (ho_ten, email, so_dien_thoai, mat_khau_hash, vai_tro_id, da_xac_thuc_email)
      VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id
    `, [`KTV ${faker.person.fullName()}`, `ktv${i}@officecare.com`, faker.phone.number(), passwordHash, roles['ky_thuat_vien']]);
    ktvUsers.push(rows[0].id);

    await pool.query(`
      INSERT INTO chuyen_gia_y_te (nguoi_dung_id, ma_nhan_vien, chuyen_mon_chinh, so_nam_kinh_nghiem)
      VALUES ($1, $2, $3, $4)
    `, [rows[0].id, `KTV${String(i).padStart(3, '0')}`, 'Vật lý trị liệu', faker.number.int({ min: 1, max: 10 })]);
  }

  // Khách hàng
  const customerUsers = [];
  for (let i = 1; i <= 20; i++) {
    const { rows } = await pool.query(`
      INSERT INTO nguoi_dung (ho_ten, email, so_dien_thoai, mat_khau_hash, vai_tro_id, da_xac_thuc_email)
      VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id
    `, [faker.person.fullName(), faker.internet.email(), faker.phone.number(), passwordHash, roles['khach_hang']]);

    const { rows: khRows } = await pool.query(`
      INSERT INTO khach_hang (nguoi_dung_id, ngay_sinh, gioi_tinh, hang_khach_hang)
      VALUES ($1, $2, $3, $4) RETURNING id
    `, [rows[0].id, faker.date.birthdate({ min: 18, max: 65, mode: 'age' }), faker.helpers.arrayElement(['nam', 'nu']), faker.helpers.arrayElement(['thuong', 'bac', 'vang'])]);
    customerUsers.push(khRows[0].id);
  }

  return { ktvUsers, customerUsers, adminId, leTanId, bacSiId };
};

const seedServices = async () => {
  console.log('Seeding services...');

  // Danh mục
  const { rows: categories } = await pool.query(`
    INSERT INTO danh_muc_dich_vu (ten_danh_muc, mo_ta) VALUES
    ('Khám & Lượng giá', 'Khám lâm sàng và đánh giá tư thế'),
    ('Trị liệu cơ sâu & Chuyên sâu', 'Các dịch vụ linh động cấu thành liệu trình hoặc bán lẻ'),
    ('Phục hồi & Phòng ngừa', 'Tập luyện phục hồi chức năng và định hình tư thế'),
    ('Dịch vụ bổ trợ (Add-on)', 'Các liệu pháp thư giãn và phục hồi bổ trợ')
    RETURNING id, ten_danh_muc;
  `);

  const catKham = categories.find(c => c.ten_danh_muc.includes('Khám'))?.id;
  const catTriLieu = categories.find(c => c.ten_danh_muc.includes('Trị liệu'))?.id;
  const catPhucHoi = categories.find(c => c.ten_danh_muc.includes('Phục hồi'))?.id;
  const catAddon = categories.find(c => c.ten_danh_muc.includes('bổ trợ'))?.id;

  const services = [
    // 13 Shared services library (loai_dich_vu = 'chinh')
    { 
      catId: catTriLieu, 
      name: 'Kéo giãn cột sống cổ bằng tay', 
      price: 100000, 
      duration: 15, 
      type: 'chinh', 
      thiet_bi: null, 
      ma: 'SVC-CST',
      mo_ta_chi_tiet: 'Kỹ thuật viên sử dụng lực tay chuyên môn thực hiện các kỹ thuật kéo giãn dọc trục cột sống cổ, di động nhẹ nhàng nhằm giải áp đĩa đệm vùng cổ vai gáy.',
      loai_dich_vu_ho_tro: [
        'Giải phóng chèn ép rễ thần kinh cổ, giảm nhanh chứng đau vai gáy lan xuống cánh tay.',
        'Phục hồi tầm vận động tự nhiên khi xoay, cúi, nghiêng cổ.',
        'Tăng cường lưu thông tuần hoàn máu não bộ, giảm đau đầu chóng mặt do chèn ép mạch.'
      ]
    },
    { 
      catId: catTriLieu, 
      name: 'Kỹ thuật giải cơ chuyên sâu', 
      price: 150000, 
      duration: 20, 
      type: 'chinh', 
      thiet_bi: null, 
      ma: 'SVC-DTT',
      mo_ta_chi_tiet: 'Tác động lực vật lý sâu và chậm dọc theo thớ cơ nông đến cơ sâu, xác định và giải phóng các nút thắt cơ (Trigger Points) gây co cứng dai dẳng.',
      loai_dich_vu_ho_tro: [
        'Phá tan các bó cơ co thắt mãn tính, trả lại chiều dài sinh lý tối ưu cho thớ cơ.',
        'Kích thích tuần hoàn máu mang dưỡng chất và oxy đến nuôi dưỡng vùng mô cơ bị xơ hóa.',
        'Giảm nhức mỏi cơ bắp tức thì sau vận động nặng hoặc ngồi làm việc sai tư thế kéo dài.'
      ]
    },
    { 
      catId: catTriLieu, 
      name: 'Trị liệu giảm đau bằng dòng điện xung', 
      price: 120000, 
      duration: 15, 
      type: 'chinh', 
      thiet_bi: 'Máy điện xung', 
      ma: 'SVC-ELT',
      mo_ta_chi_tiet: 'Dán các điện cực hydrogel y khoa lên vùng cơ đau nhức, sử dụng thiết bị chuyên dụng phát dòng điện xung tần số thấp thích hợp để cắt đứt tín hiệu đau dây thần kinh.',
      loai_dich_vu_ho_tro: [
        'Ức chế lập tức đường truyền tín hiệu đau lên não bộ theo cơ chế cổng kiểm soát đau.',
        'Kích thích cơ thể tự giải phóng Endorphin (hormone giảm đau tự nhiên) để xoa dịu vùng tổn thương.',
        'Kích thích tuần hoàn máu sâu giúp tiêu viêm, giảm sưng nề mô mềm cục bộ.'
      ]
    },
    { 
      catId: catPhucHoi, 
      name: 'Hướng dẫn tập phục hồi chức năng', 
      price: 70000, 
      duration: 10, 
      type: 'chinh', 
      thiet_bi: null, 
      ma: 'SVC-CEG',
      mo_ta_chi_tiet: 'Bác sĩ hoặc Kỹ thuật viên trực tiếp hướng dẫn khách thực hiện chuẩn xác các bài tập ổn định khớp, kích hoạt cơ lõi yếu và điều chỉnh tư thế đứng/ngồi chuẩn y khoa.',
      loai_dich_vu_ho_tro: [
        'Tăng cường sức mạnh và độ bền cho các nhóm cơ hỗ trợ bảo vệ cột sống.',
        'Sửa sai lệch tư thế (gù lưng, cổ rùa, lệch xương chậu) tận gốc.',
        'Duy trì hiệu quả trị liệu lâu dài, ngăn ngừa tái phát cơn đau cơ xương khớp.'
      ]
    },
    { 
      catId: catTriLieu, 
      name: 'Nhiệt trị liệu hồng ngoại', 
      price: 80000, 
      duration: 15, 
      type: 'chinh', 
      thiet_bi: 'Đèn hồng ngoại', 
      ma: 'SVC-HET',
      mo_ta_chi_tiet: 'Sử dụng đèn hồng ngoại y khoa chuyên khoa chiếu tia nhiệt trực tiếp lên vùng khớp viêm hoặc thắt lưng đau nhức ở cự ly y khoa tiêu chuẩn.',
      loai_dich_vu_ho_tro: [
        'Tác dụng nhiệt nóng sâu làm giãn cơ toàn vùng, loại bỏ tình trạng cứng khớp buổi sáng.',
        'Giãn nở mạch máu ngoại vi, đẩy nhanh tốc độ đào thải độc tố và hấp thụ viêm sưng.',
        'Làm dịu hệ thần kinh nhạy cảm, đem lại cảm giác ấm áp và thư giãn sâu cho khách hàng.'
      ]
    },
    { 
      catId: catTriLieu, 
      name: 'Kỹ thuật di động khớp tăng biên độ', 
      price: 130000, 
      duration: 15, 
      type: 'chinh', 
      thiet_bi: null, 
      ma: 'SVC-JMT',
      mo_ta_chi_tiet: 'Áp dụng kỹ thuật trượt khớp cơ học bậc 1-3 theo chuẩn y khoa quốc tế lên các diện khớp bị hạn chế biên độ vận động do xơ hóa dây chằng.',
      loai_dich_vu_ho_tro: [
        'Kích thích tăng tiết dịch khớp tự nhiên để bôi trơn diện khớp, giảm ma sát gây thoái hóa.',
        'Mở rộng nhanh biên độ khớp bị giới hạn do viêm bám gân hoặc thoái hóa diện khớp.',
        'Ngăn chặn triệt để nguy cơ dính khớp và xơ cứng bao khớp gây tàn tật.'
      ]
    },
    { 
      catId: catTriLieu, 
      name: 'Di động mô mềm giải phóng cơ', 
      price: 100000, 
      duration: 15, 
      type: 'chinh', 
      thiet_bi: null, 
      ma: 'SVC-MRL',
      mo_ta_chi_tiet: 'Kỹ thuật sử dụng các ngón tay và lòng bàn tay vuốt miết, trượt mô liên kết mềm dọc bó cơ căng thẳng nhằm phá vỡ các điểm kết dính cơ nông.',
      loai_dich_vu_ho_tro: [
        'Tháo xoắn cơ tức thì, loại bỏ cảm giác căng tức bứt rứt khó chịu ở cơ bắp.',
        'Phục hồi độ đàn hồi tự nhiên linh hoạt của hệ thống mô mềm quanh khớp.',
        'Tạo cảm giác nhẹ nhõm, thư thái ngay trong buổi trị liệu.'
      ]
    },
    { 
      catId: catTriLieu, 
      name: 'Giải phóng cơ hình lê chuyên sâu', 
      price: 130000, 
      duration: 15, 
      type: 'chinh', 
      thiet_bi: null, 
      ma: 'SVC-PMR',
      mo_ta_chi_tiet: 'Kỹ thuật ấn bấm chuyên sâu giải phóng căng cơ vùng mông (đặc biệt cơ hình lê - Piriformis) để giảm áp cho dây thần kinh tọa chạy bên dưới cơ mông.',
      loai_dich_vu_ho_tro: [
        'Cắt đứt ngay cơn đau tê dọc mông lan xuống đùi và bắp chân (đau thần kinh tọa).',
        'Giảm co thắt sâu vùng hông chậu, khôi phục bước đi linh hoạt vững vàng.',
        'Giải phóng tình trạng mỏi khớp háng khi ngồi làm việc quá lâu một chỗ.'
      ]
    },
    { 
      catId: catTriLieu, 
      name: 'Vận động trị liệu khớp vai', 
      price: 120000, 
      duration: 15, 
      type: 'chinh', 
      thiet_bi: null, 
      ma: 'SVC-SMT',
      mo_ta_chi_tiet: 'Kỹ thuật viên thực hiện các kỹ thuật vận động khớp thụ động và chủ động có trợ giúp khớp vai nhằm khôi phục cơ học xoay vai.',
      loai_dich_vu_ho_tro: [
        'Hỗ trợ phá vỡ tổ chức xơ dính quanh bao khớp vai gây đông cứng vai (frozen shoulder).',
        'Giúp khách hàng dễ dàng thực hiện các động tác sinh hoạt như chải đầu, giơ tay cao, gãi lưng.',
        'Giải tỏa chứng đau mỏi vai sâu bứt rứt gây mất ngủ về đêm.'
      ]
    },
    { 
      catId: catTriLieu, 
      name: 'Kéo giãn cột sống thắt lưng bằng máy', 
      price: 100000, 
      duration: 15, 
      type: 'chinh', 
      thiet_bi: 'Giường kéo giãn', 
      ma: 'SVC-SST',
      mo_ta_chi_tiet: 'Sử dụng thiết bị kéo giãn cột sống tự động y khoa, cài đặt đai ngực đai chậu và lực kéo kéo - nhả theo chu kỳ phù hợp với trọng lượng cơ thể để giải áp cột sống.',
      loai_dich_vu_ho_tro: [
        'Giảm áp suất nội đĩa đệm thắt lưng tối đa, tạo lực hút âm giúp nhân nhầy thoát vị co hồi về vị trí cũ.',
        'Mở rộng các lỗ liên hợp cột sống giải phóng chèn ép rễ thần kinh thắt lưng.',
        'Cắt cơn đau lưng cấp và tê bì chân do thoát vị đĩa đệm gây ra.'
      ]
    },
    { 
      catId: catTriLieu, 
      name: 'Kéo giãn cơ toàn thân chủ động', 
      price: 100000, 
      duration: 15, 
      type: 'chinh', 
      thiet_bi: null, 
      ma: 'SVC-STR',
      mo_ta_chi_tiet: 'Kỹ thuật viên phối hợp cùng khách thực hiện các chuỗi động tác kéo giãn cơ chuỗi sau, cơ liên sườn và giải áp toàn bộ các khớp chính.',
      loai_dich_vu_ho_tro: [
        'Gia tăng độ dẻo dai đàn hồi của toàn bộ hệ thống cơ xương khớp.',
        'Giải phóng chứng đau mỏi tích tụ toàn thân do thói quen ngồi lì làm việc cả ngày.',
        'Tăng cường độ linh hoạt, giúp cơ thể chuyển động nhẹ nhàng thanh thoát.'
      ]
    },
    { 
      catId: catTriLieu, 
      name: 'Kỹ thuật giải phóng điểm bám gân', 
      price: 120000, 
      duration: 15, 
      type: 'chinh', 
      thiet_bi: null, 
      ma: 'SVC-TRT',
      mo_ta_chi_tiet: 'Tác động miết bấm ngang thớ gân cơ bị tổn thương tại khuỷu tay hoặc cổ tay nhằm kích thích tăng sinh tuần hoàn máu tại điểm bám tận của gân.',
      loai_dich_vu_ho_tro: [
        'Đặc trị đau mỏi cổ tay, khuỷu tay (Hội chứng ống cổ tay, viêm gân khuỷu tay Tennis Elbow).',
        'Tiêu trừ các điểm viêm dính vi mô quanh bao gân cơ.',
        'Tăng cường lực cầm nắm của bàn tay, giúp gõ phím di chuột không đau nhức.'
      ]
    },
    { 
      catId: catTriLieu, 
      name: 'Vận động trị liệu khớp cổ tay', 
      price: 120000, 
      duration: 15, 
      type: 'chinh', 
      thiet_bi: null, 
      ma: 'SVC-WMT',
      mo_ta_chi_tiet: 'Di động nhẹ nhàng và vận động các diện khớp xương nhỏ vùng cổ tay và bàn ngón tay để kéo giãn dây chằng quanh ống cổ tay.',
      loai_dich_vu_ho_tro: [
        'Giải phóng chèn ép thần kinh giữa trong hội chứng ống cổ tay.',
        'Khắc phục chứng tê rần, mất cảm giác hoặc đau buốt ngón tay khi làm việc văn phòng.',
        'Khôi phục khả năng xoay gấp cổ tay mượt mà không lục cục.'
      ]
    },

    // Nhóm Cổ truyền & Chuyên sâu (loai_dich_vu = 'chinh')
    { catId: catKham, name: 'Khám lượng giá cột sống & tư thế', price: 150000, duration: 30, type: 'chinh', thiet_bi: null, ma: 'SVC-KHAM' },
    { catId: catTriLieu, name: 'Trị liệu Cổ - Vai - Gáy "Khơi Thông Kinh Lạc"', price: 400000, duration: 75, type: 'chinh', thiet_bi: null, ma: 'CVG-CS-75' },
    { catId: catTriLieu, name: 'Phục Hồi Đau Lưng - Thoát Vị Đĩa Đệm', price: 650000, duration: 90, type: 'chinh', thiet_bi: null, ma: 'DL-TVDD-90' },
    { catId: catTriLieu, name: 'Giảm Đau Cấp Tốc - Co Thắt Cơ Cấp', price: 450000, duration: 60, type: 'chinh', thiet_bi: null, ma: 'GDC-CAP-60' },
    { catId: catTriLieu, name: 'Trị liệu Hội Chứng Ống Cổ Tay & Tê Bì', price: 300000, duration: 45, type: 'chinh', thiet_bi: null, ma: 'CL-HAND-45' },
    { catId: catTriLieu, name: 'Trị liệu Đau Nhức Khớp Gối / Khớp Vai', price: 350000, duration: 60, type: 'chinh', thiet_bi: null, ma: 'CL-JOINT-60' },
    { catId: catPhucHoi, name: 'Phục Hồi Cơ Bắp Thể Thao Chuyên Sâu', price: 800000, duration: 90, type: 'chinh', thiet_bi: null, ma: 'PT-SPORTS-90' },
    { catId: catPhucHoi, name: 'Điều Trị Thoái Hóa Khớp (Gối/Vai/Háng)', price: 900000, duration: 90, type: 'chinh', thiet_bi: null, ma: 'PT-ARTH-90' },
    { catId: catPhucHoi, name: 'Phục Hồi Sau Chấn Thương / Phẫu Thuật', price: 1100000, duration: 105, type: 'chinh', thiet_bi: null, ma: 'PT-POST-105' },
    { catId: catPhucHoi, name: 'Trị Liệu & Phục Hồi Chức Năng Thần Kinh', price: 1300000, duration: 120, type: 'chinh', thiet_bi: null, ma: 'PT-NEURO-120' },
    { catId: catPhucHoi, name: 'Trị Liệu Cong Vẹo Cột Sống & Sửa Tư Thế', price: 700000, duration: 60, type: 'chinh', thiet_bi: null, ma: 'PT-POSTURE-60' },
    { catId: catTriLieu, name: 'Trải Nghiệm Thư Giãn Wellness Toàn Thân', price: 500000, duration: 90, type: 'chinh', thiet_bi: null, ma: 'WELL-BODY-90' },

    // 10 Dịch vụ bổ trợ (loai_dich_vu = 'bo_sung')
    { catId: catAddon, name: 'Massage Thư Giãn Phục Hồi', price: 350000, duration: 60, type: 'bo_sung', thiet_bi: null, ma: 'ADD-MASSAGE-60' },
    { catId: catAddon, name: 'Giác Hơi Phục Hồi', price: 180000, duration: 40, type: 'bo_sung', thiet_bi: null, ma: 'ADD-CUPPING-40' },
    { catId: catAddon, name: 'Trị Liệu Đá Nóng', price: 250000, duration: 50, type: 'bo_sung', thiet_bi: null, ma: 'ADD-HOTSTONE-50' },
    { catId: catAddon, name: 'Ngâm Đá Lạnh Phục Hồi', price: 150000, duration: 12, type: 'bo_sung', thiet_bi: 'Bể ngâm lạnh', ma: 'ADD-ICEBATH-12' },
    { catId: catAddon, name: 'Massage Đầu Cổ Vai Gáy', price: 200000, duration: 40, type: 'bo_sung', thiet_bi: null, ma: 'ADD-HEADNECK-40' },
    { catId: catAddon, name: 'Kéo Giãn Toàn Thân Chuyên Sâu', price: 220000, duration: 45, type: 'bo_sung', thiet_bi: null, ma: 'ADD-FULLSTR-45' },
    { catId: catAddon, name: 'Trị Liệu Tinh Dầu Thư Giãn', price: 230000, duration: 45, type: 'bo_sung', thiet_bi: null, ma: 'ADD-AROMA-45' },
    { catId: catAddon, name: 'Xông Phục Hồi Cơ Thể', price: 130000, duration: 25, type: 'bo_sung', thiet_bi: 'Phòng xông hơi', ma: 'ADD-STEAM-25' },
    { catId: catAddon, name: 'Massage Chân Phục Hồi', price: 180000, duration: 45, type: 'bo_sung', thiet_bi: null, ma: 'ADD-FOOT-45' },
    { catId: catAddon, name: 'Trị Liệu Ép Phục Hồi Cơ', price: 160000, duration: 25, type: 'bo_sung', thiet_bi: 'Máy nén ép', ma: 'ADD-COMPRESS-25' }
  ];

  const serviceIds = [];
  for (const s of services) {
    const { rows } = await pool.query(`
      INSERT INTO dich_vu (danh_muc_id, ten_dich_vu, thoi_luong_phut, don_gia, loai_dich_vu, thiet_bi_yeu_cau, mo_ta_ngan, mo_ta_chi_tiet, loai_dich_vu_ho_tro)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
    `, [
      s.catId, 
      s.name, 
      s.duration, 
      s.price, 
      s.type, 
      s.thiet_bi, 
      `Dịch vụ ${s.name} (Mã: ${s.ma})`,
      (s as any).mo_ta_chi_tiet || null,
      (s as any).loai_dich_vu_ho_tro ? JSON.stringify((s as any).loai_dich_vu_ho_tro) : '[]'
    ]);
    serviceIds.push({ id: rows[0].id, name: s.name, price: s.price, code: s.ma });
  }

  return serviceIds;
};

const seedPackages = async (services: any[]) => {
  console.log('Seeding packages...');

  // Helper to find service ID by shorthand matching
  const findSvcId = (shorthand: string) => {
    const code = 'SVC-' + shorthand;
    const found = services.find(s => s.code === code);
    if (!found) {
      throw new Error(`Shorthand service not found for code: ${code}`);
    }
    return found.id;
  };

  const officePackages = [
    {
      code: 'PKG-CVG',
      name: 'Cervical Spine Recovery (Trị Liệu Cổ Vai Gáy)',
      desc: 'Liệu trình giảm đau mỏi vai gáy cho người làm việc máy tính nhiều, tái tạo vận động đốt sống cổ.',
      sessions: 10,
      price: 4000000,
      originalPrice: 5000000,
      services: ['DTT', 'ELT', 'HET', 'CST', 'CEG']
    },
    {
      code: 'PKG-LBR',
      name: 'Lower Back Recovery (Trị Liệu Đau Lưng)',
      desc: 'Hỗ trợ giải tỏa căng thẳng vùng thắt lưng, định hình tư thế ngồi, giảm nhức mỏi thắt lưng cấp và mãn tính.',
      sessions: 10,
      price: 4000000,
      originalPrice: 5000000,
      services: ['ELT', 'HET', 'SST', 'CEG']
    },
    {
      code: 'PKG-OPC',
      name: 'Office Posture Correction (Chỉnh Dáng Văn Phòng)',
      desc: 'Khắc phục tư thế cổ rùa, gù lưng, lệch khớp do ngồi sai tư thế nhiều năm.',
      sessions: 12,
      price: 4704000,
      originalPrice: 5880000,
      services: ['MRL', 'SST', 'SMT', 'CEG']
    },
    {
      code: 'PKG-SUR',
      name: 'Shoulder & Upper Back (Phục Hồi Khớp Vai)',
      desc: 'Trị liệu căng cơ bả vai, khó giơ tay, mỏi vùng lưng trên do áp lực làm việc kéo dài.',
      sessions: 10,
      price: 4160000,
      originalPrice: 5200000,
      services: ['DTT', 'ELT', 'HET', 'STR', 'SMT']
    },
    {
      code: 'PKG-SCR',
      name: 'Sciatica Relief (Giải Tỏa Đau Thần Kinh Tọa)',
      desc: 'Tập trung giải phóng chèn ép rễ thần kinh lưng hông và mông, giúp đi lại linh hoạt.',
      sessions: 10,
      price: 4000000,
      originalPrice: 5000000,
      services: ['DTT', 'ELT', 'HET', 'PMR', 'CEG']
    },
    {
      code: 'PKG-WER',
      name: 'Wrist & Elbow Recovery (Trị Liệu Cổ Tay/Khuỷu Tay)',
      desc: 'Đặc trị hội chứng ống cổ tay, mỏi khớp ngón tay gõ phím, khuỷu tay tennis elbow.',
      sessions: 8,
      price: 3136000,
      originalPrice: 3920000,
      services: ['ELT', 'HET', 'WMT', 'TRT', 'CEG']
    },
    {
      code: 'PKG-SRT',
      name: 'Stress Recovery (Hồi Phục Căng Thẳng)',
      desc: 'Liệu trình ngắn ngày kết hợp nhiệt và giải phóng cơ nông giúp ngủ ngon, giải tỏa mệt mỏi hệ thần kinh.',
      sessions: 6,
      price: 2064000,
      originalPrice: 2580000,
      services: ['MRL', 'HET']
    },
    {
      code: 'PKG-FBR',
      name: 'Full Body Office Recovery (Trị Liệu Xương Khớp Toàn Thân)',
      desc: 'Sự kết hợp hoàn hảo từ cột sống cổ đến thắt lưng, giúp cơ thể sảng khoái và tràn đầy năng lượng.',
      sessions: 10,
      price: 4000000,
      originalPrice: 5000000,
      services: ['DTT', 'MRL', 'ELT', 'HET', 'SST']
    },
    {
      code: 'PKG-MFP',
      name: 'Mobility & Flexibility (Tăng Cường Độ Linh Hoạt)',
      desc: 'Kéo giãn và vận động khớp chủ động, lấy lại biên độ chuyển động tự nhiên cho cơ thể.',
      sessions: 8,
      price: 3200000,
      originalPrice: 4000000,
      services: ['MRL', 'STR', 'JMT', 'CEG']
    },
    {
      code: 'PKG-PVC',
      name: 'Preventive Office Care (Chăm Sóc Chủ Động)',
      desc: 'Gói chăm sóc định kỳ hàng tuần ngăn ngừa thoái hóa đốt sống sớm cho quản lý và nhân viên.',
      sessions: 12,
      price: 3648000,
      originalPrice: 4560000,
      services: ['MRL', 'HET', 'STR', 'CEG']
    }
  ];

  for (const pkg of officePackages) {
    const pkgDetailArr = pkg.services.map((svcShort, index) => {
      const svcId = findSvcId(svcShort);
      return {
        dich_vu_id: svcId,
        so_buoi: pkg.sessions,
        so_lan_toi_da_trong_goi: pkg.sessions,
        bat_buoc: true,
        thu_tu_thuc_hien: index + 1
      };
    });

    const { rows } = await pool.query(`
      INSERT INTO goi_dich_vu (ten_goi, ma_goi, mo_ta, tong_so_buoi, gia_goi, gia_goc, han_dung_thang, hien_thi_website, trang_thai, chi_tiet_dich_vu, so_dv_toi_da_moi_buoi, loai_goi)
      VALUES ($1, $2, $3, $4, $5, $6, 6, true, 'hoat_dong', $7, 5, 'lieu_trinh')
      RETURNING id
    `, [pkg.name, pkg.code, pkg.desc, pkg.sessions, pkg.price, pkg.originalPrice, JSON.stringify(pkgDetailArr)]);
    const pkgId = rows[0].id;

    for (const item of pkgDetailArr) {
      await pool.query(`
        INSERT INTO goi_dich_vu_chi_tiet (goi_dich_vu_id, dich_vu_id, so_buoi_trong_goi, so_lan_toi_da_trong_goi, bat_buoc, thu_tu_thuc_hien)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [pkgId, item.dich_vu_id, item.so_buoi, item.so_lan_toi_da_trong_goi, item.bat_buoc, item.thu_tu_thuc_hien]);
    }
  }
};

const seedInvoicesAndAnalytics = async (customerIds: string[], serviceIds: any[]) => {
  console.log('Seeding invoices and analytics...');

  // Tạo dữ liệu doanh thu trong 6 tháng qua
  for (let i = 0; i < 50; i++) {
    const customer = faker.helpers.arrayElement(customerIds);
    const service = faker.helpers.arrayElement(serviceIds);
    const date = faker.date.past({ years: 0.5 }); // Trong 6 tháng qua

    // 1. Tạo hóa đơn
    const { rows: invRows } = await pool.query(`
      INSERT INTO hoa_don (ma_hoa_don, khach_hang_id, loai_hoa_don, tong_tien_truoc_giam, tong_tien_thanh_toan, da_thanh_toan, trang_thai, ngay_tao)
      VALUES ($1, $2, 'dich_vu_don', $3, $3, $3, 'da_thanh_toan', $4) RETURNING id
    `, [`HD${faker.string.numeric(6)}`, customer, service.price, date]);

    // 2. Tạo thanh toán
    await pool.query(`
      INSERT INTO thanh_toan (hoa_don_id, ma_giao_dich, so_tien, phuong_thuc, trang_thai, thoi_gian_giao_dich)
      VALUES ($1, $2, $3, 'chuyen_khoan', 'thanh_cong', $4)
    `, [invRows[0].id, `GD${faker.string.numeric(8)}`, service.price, date]);
  }
};

const seedFeedback = async (customerIds: string[]) => {
  console.log('Seeding feedbacks...');

  // Lấy danh sách KTV thực tế
  const { rows: ktvs } = await pool.query('SELECT id FROM chuyen_gia_y_te');

  // Cần ít nhất 1 buổi trị liệu để đánh giá
  const { rows: services } = await pool.query('SELECT id FROM dich_vu LIMIT 1');
  if (services.length === 0 || ktvs.length === 0) return;

  for (let i = 0; i < 15; i++) {
    const customer = faker.helpers.arrayElement(customerIds);
    const ktv = faker.helpers.arrayElement(ktvs).id;

    // Giả lập lịch đặt khám ban đầu (Bác sĩ)
    const { rows: ld } = await pool.query(`
      INSERT INTO lich_dat (ma_lich_dat, khach_hang_id, dich_vu_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, trang_thai)
      VALUES ($1, $2, $3, NOW() - interval '${i} days', NOW() - interval '${i} days' + interval '1 hour', 'hoan_thanh') RETURNING id
    `, [`LD${faker.string.numeric(6)}`, customer, services[0].id]);

    // Giả lập hồ sơ điều trị
    const { rows: ldt } = await pool.query(`
      INSERT INTO lich_dieu_tri (khach_hang_id, loai_dieu_tri, dich_vu_id, tong_so_buoi, so_buoi_da_dung, trang_thai)
      VALUES ($1, 'dich_vu_le', $2, 1, 1, 'hoan_thanh') RETURNING id
    `, [customer, services[0].id]);

    // Giả lập buổi trị liệu thực tế
    const { rows: btl } = await pool.query(`
      INSERT INTO buoi_tri_lieu (lich_dieu_tri_id, dich_vu_id, ky_thuat_vien_id, khach_hang_id, trang_thai, thoi_gian_bat_dau, thoi_gian_ket_thuc)
      VALUES ($1, $2, $3, $4, 'hoan_thanh', NOW() - interval '${i} days', NOW() - interval '${i} days' + interval '1 hour') RETURNING id
    `, [ldt[0].id, services[0].id, ktv, customer]);

    await pool.query(`
      INSERT INTO danh_gia_dich_vu (khach_hang_id, buoi_tri_lieu_id, ky_thuat_vien_id, so_sao_tong, so_sao_ktv, nhan_xet, hieu_qua_dieu_tri, thoi_gian_danh_gia)
      VALUES ($1, $2, $3, $4, $4, $5, 'tot', NOW() - interval '${i} days' + interval '2 hours')
    `, [customer, btl[0].id, ktv, faker.number.int({ min: 3, max: 5 }), faker.lorem.sentence()]);
  }
};

const seedVouchers = async (adminId: string) => {
  console.log('Seeding vouchers...');
  await pool.query(`
    INSERT INTO voucher (ma_voucher, ten_chien_dich, loai_giam, gia_tri_giam, don_hang_toi_thieu, ngay_bat_dau, ngay_het_han, trang_thai, tao_boi) VALUES
    ('SUMMER2024', 'Khuyến mãi Hè 2024', 'phan_tram', 15, 500000, NOW() - interval '1 month', NOW() + interval '1 month', 'hoat_dong', $1),
    ('NEWUSER', 'Khách hàng mới', 'so_tien_co_dinh', 100000, 0, NOW() - interval '1 year', NOW() + interval '1 year', 'hoat_dong', $1)
  `, [adminId]);
};

const seedSchedules = async (users: any) => {
  console.log('Seeding schedules...');

  // Lấy Thứ 2 của tuần này và tuần sau
  const current = new Date();
  const distanceToMonday = current.getDay() === 0 ? -6 : 1 - current.getDay();
  const thisMonday = new Date(current);
  thisMonday.setDate(current.getDate() + distanceToMonday);

  const nextMonday = new Date(thisMonday);
  nextMonday.setDate(thisMonday.getDate() + 7);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const getWeekDates = (startMonday: Date) => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startMonday);
      d.setDate(startMonday.getDate() + i);
      dates.push(formatDate(d));
    }
    return dates;
  };

  const datesThisWeek = getWeekDates(thisMonday);
  const datesNextWeek = getWeekDates(nextMonday);

  // --- SEED TUẦN NÀY ---
  // Lễ tân (users.leTanId): Thứ 2 -> Thứ 6 (08:00 - 17:00), Thứ 7 (08:00 - 12:00)
  for (let i = 0; i < 5; i++) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '08:00', '17:00', 'hoat_dong')`, [users.leTanId, datesThisWeek[i]]);
  }
  await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '08:00', '12:00', 'hoat_dong')`, [users.leTanId, datesThisWeek[5]]);

  // Bác sĩ (users.bacSiId): Trực Sáng (08:30 - 12:00) Thứ 2, 3, 4; Trực Chiều (13:30 - 17:30) Thứ 5, 6, 7
  for (const i of [0, 1, 2]) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '08:30', '12:00', 'hoat_dong')`, [users.bacSiId, datesThisWeek[i]]);
  }
  for (const i of [3, 4, 5]) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '13:30', '17:30', 'hoat_dong')`, [users.bacSiId, datesThisWeek[i]]);
  }

  // KTV 1 (users.ktvUsers[0]): Trực Chiều (13:00 - 17:00) Thứ 2 -> Thứ 6
  for (let i = 0; i < 5; i++) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '13:00', '17:00', 'hoat_dong')`, [users.ktvUsers[0], datesThisWeek[i]]);
  }

  // KTV 2 (users.ktvUsers[1]): Trực Sáng (08:00 - 12:00) Thứ 2, 3, 4; Trực Chiều (13:00 - 17:00) Thứ 5, 6
  for (const i of [0, 1, 2]) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '08:00', '12:00', 'hoat_dong')`, [users.ktvUsers[1], datesThisWeek[i]]);
  }
  for (const i of [3, 4]) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '13:00', '17:00', 'hoat_dong')`, [users.ktvUsers[1], datesThisWeek[i]]);
  }

  // KTV 3 (users.ktvUsers[2]): Trực Chiều (13:00 - 17:00) Thứ 2, 3, 6; Nghỉ phép Thứ 4, 5
  for (const i of [0, 1, 5]) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '13:00', '17:00', 'hoat_dong')`, [users.ktvUsers[2], datesThisWeek[i]]);
  }
  for (const i of [2, 3]) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '08:00', '17:00', 'tam_nghi')`, [users.ktvUsers[2], datesThisWeek[i]]);
  }


  // --- SEED TUẦN SAU ---
  // Lễ tân (users.leTanId): Thứ 2, 3, 5, 6 (08:00 - 17:00); Thứ 4 Nghỉ phép; Thứ 7 Trực Tối (17:00 - 21:00)
  for (const i of [0, 1, 3, 4]) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '08:00', '17:00', 'hoat_dong')`, [users.leTanId, datesNextWeek[i]]);
  }
  await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '08:00', '17:00', 'tam_nghi')`, [users.leTanId, datesNextWeek[2]]);
  await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '17:00', '21:00', 'hoat_dong')`, [users.leTanId, datesNextWeek[5]]);

  // Bác sĩ (users.bacSiId): Trực Sáng (08:30 - 12:00) Thứ 2, 4, 6; Trực Tối (17:30 - 21:30) Thứ 3, 5
  for (const i of [0, 2, 4]) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '08:30', '12:00', 'hoat_dong')`, [users.bacSiId, datesNextWeek[i]]);
  }
  for (const i of [1, 3]) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '17:30', '21:30', 'hoat_dong')`, [users.bacSiId, datesNextWeek[i]]);
  }

  // KTV 1 (users.ktvUsers[0]): Trực Tối (17:00 - 21:00) Thứ 2 -> Thứ 6
  for (let i = 0; i < 5; i++) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '17:00', '21:00', 'hoat_dong')`, [users.ktvUsers[0], datesNextWeek[i]]);
  }

  // KTV 2 (users.ktvUsers[1]): Trực Sáng (08:00 - 12:00) Thứ 2, 4, 6
  for (const i of [0, 2, 4]) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '08:00', '12:00', 'hoat_dong')`, [users.ktvUsers[1], datesNextWeek[i]]);
  }

  // KTV 3 (users.ktvUsers[2]): Trực Sáng (08:00 - 12:00) Thứ 2 -> Thứ 6
  for (let i = 0; i < 5; i++) {
    await pool.query(`INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES ($1, $2, '08:00', '12:00', 'hoat_dong')`, [users.ktvUsers[2], datesNextWeek[i]]);
  }
};

const seedRooms = async () => {
  console.log('Seeding rooms...');
  const rooms = [
    { ten_phong: 'Phòng 101 - Khám VIP 1', ma_phong: 'P101', loai_phong: 'kham_benh', tang: 'Tang 1' },
    { ten_phong: 'Phòng 102 - Khám tổng quát', ma_phong: 'P102', loai_phong: 'kham_benh', tang: 'Tang 1' },
    { ten_phong: 'Phòng 201 - Trị liệu Vật lý', ma_phong: 'P201', loai_phong: 'tri_lieu', tang: 'Tang 2' },
    { ten_phong: 'Phòng 202 - Điện xung trị liệu', ma_phong: 'P202', loai_phong: 'tri_lieu', tang: 'Tang 2' },
    { ten_phong: 'Phòng 203 - Kéo giãn cột sống', ma_phong: 'P203', loai_phong: 'tri_lieu', tang: 'Tang 2' },
    { ten_phong: 'Phòng 301 - Phục hồi chức năng', ma_phong: 'P301', loai_phong: 'phuc_hoi', tang: 'Tang 3' }
  ];

  for (const r of rooms) {
    await pool.query(`
      INSERT INTO phong (ten_phong, ma_phong, loai_phong, tang, trang_thai)
      VALUES ($1, $2, $3, $4, 'san_sang')
    `, [r.ten_phong, r.ma_phong, r.loai_phong, r.tang]);
  }
};

const runSeed = async () => {
  try {
    await clearDatabase();
    const roles = await seedRoles();
    const { ktvUsers, customerUsers, adminId, leTanId, bacSiId } = await seedUsers(roles);
    const services = await seedServices();
    await seedPackages(services);
    await seedRooms();
    await seedInvoicesAndAnalytics(customerUsers, services);
    await seedFeedback(customerUsers);
    await seedVouchers(adminId);
    await seedSchedules({ ktvUsers, adminId, leTanId, bacSiId });

    console.log('✅ Seed dữ liệu thành công!');
  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu:', error);
  } finally {
    pool.end();
  }
};

runSeed();

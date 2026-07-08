import { Router } from 'express';
import {
  createPublicAppointment,
  getCustomerAppointments,
  cancelCustomerAppointment,
  getBookedSlots,
  getActiveDoctorDates,
  getPublicServices,
  getPublicAppointmentById,
  getCustomerMedicalRecord,
  getCustomerTreatmentSessions,
  confirmEmailAppointment,
  confirmOTPAppointment,
  resendConfirmationEmail,
  createTempHold,
  releaseTempHold
} from '../controllers/appointment.controller';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notification.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import adminService from '../services/admin.service';
import { pool } from '../config/db';

const router = Router();

router.post('/appointments/public', createPublicAppointment);
router.get('/appointments/public/track/:id', getPublicAppointmentById);
router.get('/appointments/public/confirm-email/:id', confirmEmailAppointment);
router.post('/appointments/public/confirm-otp', confirmOTPAppointment);
router.post('/appointments/public/:id/resend-otp', resendConfirmationEmail);
router.post('/appointments/hold', createTempHold);
router.delete('/appointments/hold/:session_id', releaseTempHold);

router.get('/services', async (req, res) => {
  try {
    const packages = await adminService.getPackages();
    // Trả về gói lẻ (LE) và gói khám (KHAM) làm danh sách dịch vụ
    const publicServices = packages
      .filter((pkg: any) => (pkg.loai_goi === 'LE' || pkg.loai_goi === 'KHAM') && pkg.trang_thai === 'hoat_dong')
      .map((pkg: any) => ({
        id: pkg.id,
        ten_goi: pkg.ten_goi,
        ten_dich_vu: pkg.ten_goi, // backward compatibility
        don_gia: Number(pkg.don_gia),
        thoi_luong_phut: pkg.thoi_luong_phut,
        loai_goi: pkg.loai_goi,
        loai_dich_vu: pkg.loai_goi === 'KHAM' ? 'KHAM' : 'DIEU_TRI', // backward compatibility
        trang_thai: pkg.trang_thai,
        dang_hoat_dong: pkg.trang_thai === 'hoat_dong',
        hien_thi_website: pkg.trang_thai === 'hoat_dong',
        quy_trinh: pkg.quy_trinh,
        muc_tieu: pkg.muc_tieu,
        anh_goi: pkg.anh_goi,
        danh_muc_goi_id: pkg.danh_muc_id,
        danh_muc_id: pkg.danh_muc_id, // backward compatibility
        luot_dung: Number(pkg.luot_dung || 0),
      }));
    res.json(publicServices);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách dịch vụ' });
  }
});

router.get('/packages', async (req, res) => {
  try {
    const packages = await adminService.getPackages();
    // Trả về gói liệu trình (LIEU_TRINH) làm danh sách gói
    const publicPackages = packages.filter((p: any) => p.loai_goi === 'LIEU_TRINH' && p.trang_thai === 'hoat_dong');
    res.json(publicPackages);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách gói dịch vụ' });
  }
});

router.get('/top-services', async (req, res) => {
  try {
    const queryStr = `
      SELECT gdv.id, gdv.ten_goi, gdv.loai_goi, gdv.tong_so_buoi, gdv.thoi_luong_phut, gdv.don_gia, gdv.anh_goi,
             COUNT(ch.id) AS luot_dung
      FROM goi_dich_vu gdv
      LEFT JOIN cuoc_hen ch ON gdv.id = ch.goi_dich_vu_id
      WHERE gdv.trang_thai = 'hoat_dong'
      GROUP BY gdv.id
      ORDER BY luot_dung DESC, gdv.ten_goi ASC
      LIMIT 3
    `;
    const { rows } = await pool.query(queryStr);
    const formatted = rows.map((p: any) => ({
      id: p.id,
      ten_goi: p.ten_goi,
      loai_goi: p.loai_goi,
      tong_so_buoi: p.tong_so_buoi,
      thoi_luong_phut: p.thoi_luong_phut,
      don_gia: Number(p.don_gia),
      anh_goi: p.anh_goi,
      luot_dung: Number(p.luot_dung)
    }));
    res.json(formatted);
  } catch (error) {
    console.error('Lỗi khi lấy top dịch vụ:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy top dịch vụ' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, ten_danh_muc, mo_ta, loai_goi_ap_dung FROM danh_muc_goi ORDER BY id ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh mục' });
  }
});

router.get('/specialists', async (req, res) => {
  try {
    const queryStr = `
      SELECT nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.anh_dai_dien, vt.ten_vai_tro as vai_tro,
             hs.so_nam_kinh_nghiem, hs.bang_cap_chung_chi, hs.mo_ta,
             COALESCE(AVG(dg.so_sao)::numeric(3,1), 5.0) as trung_binh_sao,
             COUNT(dg.id)::int as tong_danh_gia
      FROM nguoi_dung nd
      JOIN vai_tro vt ON nd.vai_tro_id = vt.id
      LEFT JOIN ho_so_chuyen_gia hs ON nd.id = hs.nguoi_dung_id
      LEFT JOIN cuoc_hen ch ON nd.id = ch.nhan_su_id
      LEFT JOIN danh_gia_chat_luong dg ON ch.id = dg.cuoc_hen_id
      WHERE nd.vai_tro_id IN (3, 4) AND nd.trang_thai = 'hoat_dong'
      GROUP BY nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.anh_dai_dien, vt.ten_vai_tro, hs.so_nam_kinh_nghiem, hs.bang_cap_chung_chi, hs.mo_ta
      ORDER BY nd.vai_tro_id DESC, nd.ho_ten ASC
    `;
    const { rows } = await pool.query(queryStr);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách chuyên gia' });
  }
});

router.get('/specialists/:id', async (req, res) => {
  try {
    const queryStr = `
      SELECT nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.anh_dai_dien, vt.ten_vai_tro as vai_tro,
             hs.so_nam_kinh_nghiem, hs.bang_cap_chung_chi, hs.mo_ta,
             COALESCE(AVG(dg.so_sao)::numeric(3,1), 5.0) as trung_binh_sao,
             COUNT(dg.id)::int as tong_danh_gia
      FROM nguoi_dung nd
      JOIN vai_tro vt ON nd.vai_tro_id = vt.id
      LEFT JOIN ho_so_chuyen_gia hs ON nd.id = hs.nguoi_dung_id
      LEFT JOIN cuoc_hen ch ON nd.id = ch.nhan_su_id
      LEFT JOIN danh_gia_chat_luong dg ON ch.id = dg.cuoc_hen_id
      WHERE nd.id = $1 AND nd.vai_tro_id IN (3, 4)
      GROUP BY nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.anh_dai_dien, vt.ten_vai_tro, hs.so_nam_kinh_nghiem, hs.bang_cap_chung_chi, hs.mo_ta
    `;
    const { rows } = await pool.query(queryStr, [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy chuyên gia' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin chi tiết chuyên gia' });
  }
});

router.get('/testimonials', async (req, res) => {
  try {
    const queryStr = `
      SELECT dg.id, dg.so_sao, dg.nhan_xet, kh.ho_ten, kh.gioi_tinh
      FROM danh_gia_chat_luong dg
      JOIN khach_hang kh ON dg.khach_hang_id = kh.id
      ORDER BY dg.id DESC
    `;
    const { rows } = await pool.query(queryStr);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy đánh giá' });
  }
});

router.get('/appointments/booked-slots', getBookedSlots);
router.get('/appointments/active-doctor-dates', getActiveDoctorDates);
router.get('/appointments', verifyToken, getCustomerAppointments);
router.patch('/appointments/:id/cancel', verifyToken, cancelCustomerAppointment);

router.get('/appointments/pending-rating', verifyToken, async (req, res) => {
  try {
    const khach_hang_id = (req as any).user.id;
    const queryStr = `
      SELECT ch.id, ch.ngay_gio_bat_dau, g.ten_goi as ten_dich_vu, nd.ho_ten as ten_bac_si
      FROM cuoc_hen ch
      LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      LEFT JOIN nguoi_dung nd ON ch.nhan_su_id = nd.id
      LEFT JOIN danh_gia_chat_luong dg ON ch.id = dg.cuoc_hen_id
      WHERE ch.khach_hang_id = $1 
        AND ch.trang_thai = 'hoan_thanh' 
        AND dg.id IS NULL
      ORDER BY ch.ngay_gio_bat_dau DESC
    `;
    const { rows } = await pool.query(queryStr, [khach_hang_id]);
    res.json(rows);
  } catch (error) {
    console.error('Lỗi khi lấy lịch hẹn chưa đánh giá:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.post('/appointments/:id/rate', verifyToken, async (req, res) => {
  try {
    const { so_sao, nhan_xet } = req.body;
    const cuoc_hen_id = req.params.id;
    const khach_hang_id = (req as any).user.id;

    // Check if appointment exists, is completed, and belongs to this client
    const { rows: apptRows } = await pool.query(
      'SELECT id, trang_thai, khach_hang_id FROM cuoc_hen WHERE id = $1',
      [cuoc_hen_id]
    );

    if (apptRows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
    }

    const appt = apptRows[0];
    if (appt.khach_hang_id !== khach_hang_id) {
      return res.status(403).json({ message: 'Không có quyền đánh giá lịch hẹn này' });
    }

    if (appt.trang_thai !== 'hoan_thanh') {
      return res.status(400).json({ message: 'Chỉ có thể đánh giá các lịch hẹn đã hoàn thành khám' });
    }

    // Check if already rated
    const { rows: checkRows } = await pool.query(
      'SELECT id FROM danh_gia_chat_luong WHERE cuoc_hen_id = $1',
      [cuoc_hen_id]
    );
    if (checkRows.length > 0) {
      return res.status(400).json({ message: 'Lịch hẹn này đã được đánh giá trước đó' });
    }

    // Create review
    const { rows: newReview } = await pool.query(
      `INSERT INTO danh_gia_chat_luong (cuoc_hen_id, khach_hang_id, so_sao, nhan_xet)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [cuoc_hen_id, khach_hang_id, Number(so_sao), nhan_xet]
    );

    res.status(201).json(newReview[0]);
  } catch (error) {
    console.error('Lỗi khi lưu đánh giá:', error);
    res.status(500).json({ message: 'Lỗi server khi lưu đánh giá' });
  }
});
router.get('/medical-record', verifyToken, getCustomerMedicalRecord);
router.get('/treatment-sessions', verifyToken, getCustomerTreatmentSessions);
router.get('/notifications', verifyToken, getNotifications);
router.patch('/notifications/read-all', verifyToken, markAllAsRead);
router.patch('/notifications/:id/read', verifyToken, markAsRead);

export default router;

import { pool } from '../../config/db';
import { updateCompletedSessionsCount } from '../appointments';

const UPSERT_NHAT_KY_SQL = `
  INSERT INTO nhat_ky_buoi_dieu_tri (cuoc_hen_id, nguoi_tao_id, ghi_chu, vas_truoc, vas_sau, du_lieu_tri_lieu)
  VALUES ($1, $2, $3, $4, $5, $6::jsonb)
  ON CONFLICT (cuoc_hen_id)
  DO UPDATE SET
    nguoi_tao_id = EXCLUDED.nguoi_tao_id,
    ghi_chu = EXCLUDED.ghi_chu,
    vas_truoc = EXCLUDED.vas_truoc,
    vas_sau = EXCLUDED.vas_sau,
    du_lieu_tri_lieu = EXCLUDED.du_lieu_tri_lieu
  RETURNING id;
`;

export class TechnicianRecordRepository {
  // 3. Lấy chi tiết lịch trị liệu hiện tại (bao gồm cả chẩn đoán/chống chỉ định chính xác của buổi lượng giá gốc)
  async getAppointmentDetail(appointmentId: string) {
    const queryStr = `
      SELECT 
        ch.id, 
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat,
        kh.ho_ten as ho_ten_khach, kh.so_dien_thoai as so_dien_thoai, kh.gioi_tinh as gioi_tinh_khach,
        ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc, ch.ghi_chu_khach_hang as ly_do_kham, ch.trang_thai, ch.anh_dinh_kem_url,
        ch.thoi_gian_tao, ch.thoi_gian_checkin, ch.thoi_gian_bat_dau, ch.thoi_gian_hoan_thanh,
        kh.id as khach_hang_id, kh.ngay_sinh, kh.gioi_tinh,
        kh.ho_ten as ten_khach_hang, kh.so_dien_thoai as sdt_khach_hang, NULL::text as avatar_url,
        nk.id as ho_so_dieu_tri_id, nk.id as ho_so_benh_an_id,
        CASE WHEN ch.phac_do_dieu_tri_id IS NOT NULL THEN nk_origin.chan_doan ELSE NULL END as chan_doan,
        CASE WHEN ch.phac_do_dieu_tri_id IS NOT NULL THEN nk_origin.chong_chi_dinh ELSE NULL END as chong_chi_dinh,
        nk.ghi_chu as ghi_chu,
        CASE WHEN ch.phac_do_dieu_tri_id IS NOT NULL THEN nk_origin.ghi_chu ELSE NULL END as ghi_chu_chuyen_vien,
        CASE WHEN ch.phac_do_dieu_tri_id IS NOT NULL THEN COALESCE(nd_origin.ho_ten, 'Chuyên viên PHCN OfficeCare') ELSE NULL END as chuyen_vien_chi_dinh,
        CASE WHEN ch.phac_do_dieu_tri_id IS NOT NULL AND ch_origin.id IS NOT NULL THEN 'LH-' || UPPER(SUBSTRING(ch_origin.id::text FROM 1 FOR 6)) ELSE NULL END as ma_lich_kham_goc,
        CASE WHEN ch.phac_do_dieu_tri_id IS NOT NULL THEN COALESCE(ch_origin.ngay_gio_bat_dau, nk_origin.ngay_tao) ELSE NULL END as ngay_luong_gia,
        nk.vas_truoc, nk.vas_sau, nk.du_lieu_tri_lieu,
        COALESCE(ch.goi_dich_vu_id, pd.goi_dich_vu_id, cd.goi_dich_vu_id) as goi_dich_vu_id,
        ch.phac_do_dieu_tri_id,
        ch.so_thu_tu_buoi,
        COALESCE(g.ten_goi, gpd.ten_goi) as ten_dich_vu,
        COALESCE(g.ten_goi, gpd.ten_goi) as ten_goi,
        COALESCE(g.quy_trinh, gpd.quy_trinh) as quy_trinh,
        COALESCE(g.muc_tieu, gpd.muc_tieu) as mo_ta_goi,
        COALESCE(ch.thoi_luong_phut, g.thoi_luong_phut, gpd.thoi_luong_phut, 30) as thoi_luong_phut,
        COALESCE(g.tong_so_buoi, pd.tong_so_buoi) as tong_so_buoi,
        pd.tong_so_buoi as pd_tong_so_buoi,
        nk.ngay_tao as nhat_ky_ngay_tao
      FROM cuoc_hen ch
      JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN chi_dinh_buoi cd ON cd.nhat_ky_id = nk.id
      LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      LEFT JOIN phac_do_dieu_tri pd ON ch.phac_do_dieu_tri_id = pd.id
      LEFT JOIN goi_dich_vu gpd ON pd.goi_dich_vu_id = gpd.id
      LEFT JOIN chi_dinh_buoi cd_origin ON cd_origin.phac_do_dieu_tri_id = pd.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk_origin ON cd_origin.nhat_ky_id = nk_origin.id
      LEFT JOIN cuoc_hen ch_origin ON nk_origin.cuoc_hen_id = ch_origin.id
      LEFT JOIN nguoi_dung nd_origin ON (nk_origin.nguoi_tao_id = nd_origin.id OR ch_origin.nhan_su_id = nd_origin.id)
      WHERE ch.id = $1::uuid;
    `;
    const { rows } = await pool.query(queryStr, [appointmentId]);
    return rows[0] || null;
  }

  // 4. Lưu lượng giá VAS, nhật ký thao tác và ghi chú của KTV (Chạy trong transaction)
  async saveTreatmentRecord(data: {
    lich_dat_id: string;
    ktv_id: string;
    vas_truoc: number;
    vas_sau: number;
    ghi_chu?: string | null;
    du_lieu_tri_lieu?: any;
  }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const currentRes = await client.query('SELECT trang_thai FROM cuoc_hen WHERE id = $1', [data.lich_dat_id]);
      if (currentRes.rows.length === 0) {
        throw new Error('Không tìm thấy cuộc hẹn.');
      }
      if (['hoan_thanh', 'da_huy', 'khong_den'].includes(currentRes.rows[0].trang_thai)) {
        throw new Error('Ca trị liệu này đã kết thúc (hoàn thành/hủy/không đến), không thể chỉnh sửa hoặc hoàn thành lại.');
      }

      // Ràng buộc nghiệp vụ: Bắt buộc KTV phải tick chọn ít nhất 1 kỹ thuật / thao tác trị liệu đã làm
      const nhatKyArr = data.du_lieu_tri_lieu?.nhat_ky;
      if (!Array.isArray(nhatKyArr) || nhatKyArr.length === 0) {
        throw new Error('Vui lòng tích chọn ít nhất 1 quy trình / thao tác kỹ thuật trị liệu trước khi hoàn thành ca.');
      }

      const duLieuTriLieuJson = data.du_lieu_tri_lieu ? JSON.stringify(data.du_lieu_tri_lieu) : null;

      const nkRes = await client.query(UPSERT_NHAT_KY_SQL, [
        data.lich_dat_id,
        parseInt(data.ktv_id, 10),
        data.ghi_chu || null,
        data.vas_truoc,
        data.vas_sau,
        duLieuTriLieuJson
      ]);
      const nhatKyId = nkRes.rows[0].id;

      const getPdRes = await client.query('SELECT phac_do_dieu_tri_id FROM cuoc_hen WHERE id = $1', [data.lich_dat_id]);
      const phacDoId = getPdRes.rows[0]?.phac_do_dieu_tri_id;

      const updateLdQuery = `
        UPDATE cuoc_hen 
        SET trang_thai = 'hoan_thanh',
            thoi_gian_bat_dau = COALESCE(thoi_gian_bat_dau, thoi_gian_checkin, NOW()),
            thoi_gian_hoan_thanh = COALESCE(thoi_gian_hoan_thanh, NOW())
        WHERE id = $1;
      `;
      await client.query(updateLdQuery, [data.lich_dat_id]);

      if (phacDoId) {
        await updateCompletedSessionsCount(client, phacDoId);
      }

      await client.query('COMMIT');
      return { success: true, medicalRecordId: nhatKyId };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // 4b. Lưu NHÁP VAS/nhật ký/ghi chú — KHÔNG đổi trang_thai cuộc hẹn
  async saveTreatmentDraft(data: {
    lich_dat_id: string;
    ktv_id: string;
    vas_truoc?: number | null;
    vas_sau?: number | null;
    ghi_chu?: string | null;
    du_lieu_tri_lieu?: any;
  }) {
    const duLieuTriLieuJson = data.du_lieu_tri_lieu ? JSON.stringify(data.du_lieu_tri_lieu) : null;
    await pool.query(UPSERT_NHAT_KY_SQL, [
      data.lich_dat_id,
      parseInt(data.ktv_id, 10),
      data.ghi_chu || null,
      data.vas_truoc ?? null,
      data.vas_sau ?? null,
      duLieuTriLieuJson,
    ]);
    return { success: true };
  }
}

export default new TechnicianRecordRepository();

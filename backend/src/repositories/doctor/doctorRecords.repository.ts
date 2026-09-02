import { pool } from '../../config/db';
import adminCustomerRepository from '../admin/adminCustomer.repository';

export class DoctorRecordsRepository {
  // 3. Lấy lịch sử bệnh án lâm sàng của bệnh nhân (các lần chẩn đoán trước của Bác sĩ)
  async getPatientHistory(patientId: string) {
    const queryStr = `
      SELECT
        nk.id, nk.chan_doan, nk.chong_chi_dinh, nk.ghi_chu, nk.vas_truoc, nk.du_lieu_luong_gia, nk.du_lieu_tri_lieu, nk.ngay_tao as thoi_gian_tao,
        ch.id as lich_dat_id, 'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat,
        ch.trang_thai as trang_thai,
        ch.ghi_chu_khach_hang as ly_do_kham, ch.anh_dinh_kem_url,
        nd_bs.ho_ten as ten_bac_si, nd_bs.anh_dai_dien as anh_bac_si,
        goi.ten_goi as khuyen_nghi_goi
      FROM nhat_ky_buoi_dieu_tri nk
      JOIN cuoc_hen ch ON nk.cuoc_hen_id = ch.id
      LEFT JOIN chi_dinh_buoi cd ON cd.nhat_ky_id = nk.id
      LEFT JOIN nguoi_dung nd_bs ON COALESCE(ch.nhan_su_id, nk.nguoi_tao_id, ch.nguoi_tao_id) = nd_bs.id
      LEFT JOIN goi_dich_vu goi ON cd.goi_dich_vu_id = goi.id
      WHERE ch.khach_hang_id = $1::uuid AND UPPER(ch.loai) LIKE '%KHAM%' AND ch.trang_thai IN ('hoan_thanh', 'cho_tai_luong_gia')
      ORDER BY nk.ngay_tao DESC;
    `;
    const { rows } = await pool.query(queryStr, [patientId]);
    return rows;
  }

  // 4. Lấy danh sách lịch điều trị của bệnh nhân
  async getPatientTreatments(patientId: string) {
    const queryStr = `
      SELECT
        pd.id,
        pd.goi_dich_vu_id as goi_dich_vu_id,
        CASE WHEN goi.loai_goi = 'LIEU_TRINH' THEN 'goi' ELSE 'dich_vu' END as loai_dieu_tri,
        pd.tong_so_buoi,
        pd.so_buoi_da_dung,
        pd.trang_thai, pd.ngay_kich_hoat as thoi_gian_tao,
        'PD-' || UPPER(SUBSTRING(pd.id::text FROM 1 FOR 6)) as ma_lich_dieu_tri,
        NULL::text as ten_dich_vu, goi.ten_goi,
        'Hội chẩn lâm sàng' as chan_doan,
        origin_ch.id as goc_kham_id,
        nd_origin.ho_ten as bac_si_chi_dinh,
        CAST(hd.tong_tien_goc AS double precision) as gia_goc_goi,
        CAST(hd.so_tien_giam_voucher AS double precision) as so_tien_giam_voucher,
        CAST(hd.tong_tien_phai_tra AS double precision) as tong_tien_thanh_toan,
        CAST(hd.so_tien_da_tra AS double precision) as da_thanh_toan,
        hd.trang_thai as trang_thai_thanh_toan,
        hd.hinh_thuc_thanh_toan_goi
      FROM phac_do_dieu_tri pd
      LEFT JOIN hoa_don hd ON hd.phac_do_dieu_tri_id = pd.id
      LEFT JOIN goi_dich_vu goi ON pd.goi_dich_vu_id = goi.id
      LEFT JOIN chi_dinh_buoi cd_origin ON cd_origin.phac_do_dieu_tri_id = pd.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk_origin ON cd_origin.nhat_ky_id = nk_origin.id
      LEFT JOIN cuoc_hen origin_ch ON nk_origin.cuoc_hen_id = origin_ch.id
      LEFT JOIN nguoi_dung nd_origin ON COALESCE(origin_ch.nhan_su_id, nk_origin.nguoi_tao_id, origin_ch.nguoi_tao_id) = nd_origin.id
      WHERE pd.khach_hang_id = $1::uuid
      ORDER BY pd.ngay_kich_hoat DESC NULLS LAST;
    `;
    const { rows } = await pool.query(queryStr, [patientId]);
    return rows;
  }

  // 4b. Lấy các lượt dịch vụ lẻ ĐỘC LẬP
  async getStandaloneServiceVisits(patientId: string) {
    const queryStr = `
      SELECT
        ch.id,
        ch.ngay_gio_bat_dau as thoi_gian_tao,
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat,
        ch.trang_thai,
        dv.ten_goi as ten_dich_vu,
        nk.ghi_chu as ghi_chu,
        nk.vas_truoc as vas_truoc,
        nk.vas_sau as vas_sau,
        nk.du_lieu_tri_lieu as du_lieu_tri_lieu,
        nd_nhan_su.ho_ten as ten_nhan_su,
        nd_nhan_su.anh_dai_dien as anh_nhan_su
      FROM cuoc_hen ch
      LEFT JOIN goi_dich_vu dv ON ch.goi_dich_vu_id = dv.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN nguoi_dung nd_nhan_su ON COALESCE(ch.nhan_su_id, nk.nguoi_tao_id, ch.nguoi_tao_id) = nd_nhan_su.id
      WHERE ch.khach_hang_id = $1::uuid
        AND ch.loai = 'DICH_VU_LE'
        AND ch.phac_do_dieu_tri_id IS NULL
        AND ch.trang_thai IN ('hoan_thanh', 'da_huy', 'khong_den')
      ORDER BY ch.ngay_gio_bat_dau DESC;
    `;
    const { rows } = await pool.query(queryStr, [patientId]);
    return rows;
  }

  // 5. Lấy danh sách chi tiết các buổi trị liệu của 1 lịch điều trị cụ thể
  async getTreatmentSessions(treatmentPlanId: string) {
    const queryStr = `
      SELECT
        ch.id, ch.so_thu_tu_buoi, ch.trang_thai, ch.ngay_gio_bat_dau as thoi_gian_bat_dau, ch.ngay_gio_ket_thuc as thoi_gian_ket_thuc,
        nk.vas_truoc as danh_gia_truoc_buoi, nk.vas_sau as danh_gia_sau_buoi, nk.ghi_chu as danh_gia_hieu_qua,
        nk.chong_chi_dinh as canh_bao_dac_biet, nk.chan_doan as ai_tom_tat_ngan, nk.du_lieu_tri_lieu as du_lieu_tri_lieu,
        ch.nhan_su_id as thuc_hien_id,
        nd_ktv.ho_ten as ten_ky_thuat_vien, nd_ktv.anh_dai_dien as anh_ky_thuat_vien
      FROM cuoc_hen ch
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN nguoi_dung nd_ktv ON COALESCE(ch.nhan_su_id, nk.nguoi_tao_id, ch.nguoi_tao_id) = nd_ktv.id
      WHERE ch.phac_do_dieu_tri_id = $1::uuid AND ch.loai = 'DIEU_TRI' AND ch.trang_thai != 'da_huy'
      ORDER BY ch.so_thu_tu_buoi ASC;
    `;
    const { rows } = await pool.query(queryStr, [treatmentPlanId]);
    return rows;
  }

  // 8. Lấy lịch làm việc của bác sĩ / chuyên viên PHCN
  async getDoctorSchedules(userId: string) {
    const queryStr = `
      SELECT 
        lt.id, lt.nhan_su_id as nguoi_dung_id, to_char(lt.ngay_truc, 'YYYY-MM-DD') as ngay, 
        to_char(lt.gio_bat_dau, 'HH24:MI') as gio_bat_dau, to_char(lt.gio_ket_thuc, 'HH24:MI') as gio_ket_thuc, lt.trang_thai,
        lt.phong_id, p.ma_phong, p.ten_phong
      FROM lich_truc_nhan_su lt
      LEFT JOIN phong_lam_viec p ON lt.phong_id = p.id
      WHERE lt.nhan_su_id = $1::integer
      ORDER BY lt.ngay_truc ASC;
    `;
    const { rows } = await pool.query(queryStr, [userId]);
    return rows;
  }

  // 9. Lấy danh sách bệnh nhân kèm thông tin chống chỉ định cho bác sĩ
  async getPatients(userId: string) {
    const queryStr = `
      SELECT DISTINCT kh.id as khach_hang_id, kh.id as id, kh.id as nguoi_dung_id, kh.ngay_sinh, kh.gioi_tinh, kh.dia_chi,
             COALESCE(kh.ho_ten, 'Khách vãng lai') as ho_ten,
             kh.email,
             kh.so_dien_thoai,
             kh.trang_thai,
             EXISTS (
                SELECT 1
                FROM cuoc_hen ch_inner
                JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch_inner.id
                WHERE ch_inner.khach_hang_id = kh.id
                  AND nk.chong_chi_dinh IS NOT NULL
                  AND nk.chong_chi_dinh <> ''
                  AND nk.chong_chi_dinh <> 'Chưa điền'
             ) as has_chong_chi_dinh,
             (
                SELECT MAX(ch_last.ngay_gio_bat_dau)
                FROM cuoc_hen ch_last
                LEFT JOIN nhat_ky_buoi_dieu_tri nk_last ON nk_last.cuoc_hen_id = ch_last.id
                WHERE ch_last.khach_hang_id = kh.id
                  AND (ch_last.nhan_su_id = $1::integer OR nk_last.nguoi_tao_id = $1::integer)
             ) as lan_cuoi_su_dung
      FROM khach_hang kh
      JOIN cuoc_hen ch ON ch.khach_hang_id = kh.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      WHERE (ch.nhan_su_id = $1::integer OR nk.nguoi_tao_id = $1::integer)
      ORDER BY ho_ten ASC;
    `;
    const { rows } = await pool.query(queryStr, [userId]);
    return rows;
  }

  async getPatientInfoById(patientId: string) {
    return await adminCustomerRepository.findCustomerByIdOrIdentifier(patientId);
  }
}

export default new DoctorRecordsRepository();

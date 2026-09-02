import { pool } from '../../config/db';

export class DoctorTreatmentPlanRepository {
  async isPackageLieuTrinh(goi_dich_vu_id: string) {
    const { rows } = await pool.query('SELECT loai_goi FROM goi_dich_vu WHERE id = $1', [goi_dich_vu_id]);
    return rows.length > 0 && rows[0].loai_goi === 'LIEU_TRINH';
  }

  // Chặn chỉ định liệu trình mới khi khách đang có 1 liệu trình LIỆU_TRÌNH đang chạy, HOẶC còn 1
  // chỉ định liệu trình từ ca khám trước chưa thanh toán/kích hoạt
  async getBlockingLieuTrinh(cuoc_hen_id: string) {
    const { rows: activeRows } = await pool.query(`
      SELECT pd.id, g.ten_goi
      FROM phac_do_dieu_tri pd
      JOIN goi_dich_vu g ON pd.goi_dich_vu_id = g.id
      WHERE pd.khach_hang_id = (SELECT khach_hang_id FROM cuoc_hen WHERE id = $1)
        AND pd.trang_thai = 'dang_dieu_tri' AND g.loai_goi = 'LIEU_TRINH'
        AND pd.so_buoi_da_dung < pd.tong_so_buoi
      LIMIT 1
    `, [cuoc_hen_id]);
    if (activeRows.length > 0) {
      return {
        blocked: true,
        type: 'active_plan' as const,
        ten_goi: activeRows[0].ten_goi,
        reason: `Khách hàng đang có liệu trình "${activeRows[0].ten_goi}" hoạt động. Chỉ có thể chỉ định liệu trình mới sau khi liệu trình này hoàn thành hoặc bị hủy.`
      };
    }

    const { rows: pendingRows } = await pool.query(`
      SELECT cd.id as chi_dinh_buoi_id, g.ten_goi
      FROM chi_dinh_buoi cd
      JOIN nhat_ky_buoi_dieu_tri nk ON cd.nhat_ky_id = nk.id
      JOIN cuoc_hen ch ON nk.cuoc_hen_id = ch.id
      JOIN goi_dich_vu g ON cd.goi_dich_vu_id = g.id
      WHERE ch.khach_hang_id = (SELECT khach_hang_id FROM cuoc_hen WHERE id = $1)
        AND ch.id != $1
        AND cd.phac_do_dieu_tri_id IS NULL
        AND g.loai_goi = 'LIEU_TRINH'
      ORDER BY ch.ngay_gio_bat_dau DESC
      LIMIT 1
    `, [cuoc_hen_id]);
    if (pendingRows.length > 0) {
      return {
        blocked: true,
        type: 'pending_chi_dinh' as const,
        ten_goi: pendingRows[0].ten_goi,
        chi_dinh_buoi_id: pendingRows[0].chi_dinh_buoi_id,
        reason: `Khách hàng đã được chỉ định liệu trình "${pendingRows[0].ten_goi}" từ ca khám trước, chưa thanh toán/kích hoạt. Chỉ có thể chỉ định liệu trình khác sau khi xử lý xong chỉ định này.`
      };
    }

    return { blocked: false as const };
  }

  // Xóa hẳn 1 chỉ định gói CHƯA kích hoạt
  async deletePendingChiDinh(chi_dinh_buoi_id: string) {
    const { rowCount } = await pool.query(
      'DELETE FROM chi_dinh_buoi WHERE id = $1 AND phac_do_dieu_tri_id IS NULL',
      [chi_dinh_buoi_id]
    );
    return (rowCount ?? 0) > 0;
  }

  async getBlockedPackagesForAppointment(appointmentId: string) {
    const { rows } = await pool.query(`
      SELECT pd.goi_dich_vu_id, g.ten_goi, 'dang_dieu_tri' as reason_type,
             ('Khách hàng đang điều trị gói này (' || pd.so_buoi_da_dung || '/' || pd.tong_so_buoi || ' buổi)') as message
      FROM phac_do_dieu_tri pd
      JOIN goi_dich_vu g ON pd.goi_dich_vu_id = g.id
      WHERE pd.khach_hang_id = (SELECT khach_hang_id FROM cuoc_hen WHERE id = $1)
        AND pd.trang_thai = 'dang_dieu_tri'
        AND pd.so_buoi_da_dung < pd.tong_so_buoi
      UNION ALL
      SELECT cd.goi_dich_vu_id, g.ten_goi, 'cho_thanh_toan' as reason_type,
             'Khách hàng đã được chỉ định gói này từ ca trước (chưa thanh toán)' as message
      FROM chi_dinh_buoi cd
      JOIN nhat_ky_buoi_dieu_tri nk ON cd.nhat_ky_id = nk.id
      JOIN cuoc_hen ch ON nk.cuoc_hen_id = ch.id
      JOIN goi_dich_vu g ON cd.goi_dich_vu_id = g.id
      WHERE ch.khach_hang_id = (SELECT khach_hang_id FROM cuoc_hen WHERE id = $1)
        AND ch.id != $1
        AND cd.phac_do_dieu_tri_id IS NULL
        AND cd.goi_dich_vu_id NOT IN (
          SELECT goi_dich_vu_id FROM phac_do_dieu_tri 
          WHERE khach_hang_id = (SELECT khach_hang_id FROM cuoc_hen WHERE id = $1) 
            AND trang_thai IN ('dang_dieu_tri', 'hoan_thanh')
        )
    `, [appointmentId]);
    return rows;
  }
}

export default new DoctorTreatmentPlanRepository();

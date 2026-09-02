import { pool } from '../../config/db';

export class ClientPublicRepository {
  async getTopServices() {
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
    return rows.map((p: any) => ({
      id: p.id,
      ten_goi: p.ten_goi,
      loai_goi: p.loai_goi,
      tong_so_buoi: p.tong_so_buoi,
      thoi_luong_phut: p.thoi_luong_phut,
      don_gia: Number(p.don_gia),
      anh_goi: p.anh_goi,
      luot_dung: Number(p.luot_dung)
    }));
  }

  async getSpecialists() {
    const queryStr = `
      SELECT nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.anh_dai_dien, vt.ten_vai_tro as vai_tro,
             hs.so_nam_kinh_nghiem, hs.bang_cap_chung_chi, hs.mo_ta, hs.the_manh,
             COALESCE(AVG(dg.so_sao)::numeric(3,1), 5.0) as trung_binh_sao,
             COUNT(dg.id)::int as tong_danh_gia
      FROM nguoi_dung nd
      JOIN vai_tro vt ON nd.vai_tro_id = vt.id
      LEFT JOIN ho_so_chuyen_gia hs ON nd.id = hs.nguoi_dung_id
      LEFT JOIN danh_gia dg ON dg.nhan_su_id = nd.id AND dg.loai_danh_gia = 'NHAN_SU'
      WHERE nd.vai_tro_id IN (3, 4) AND nd.trang_thai = 'hoat_dong'
      GROUP BY nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.anh_dai_dien, vt.ten_vai_tro, hs.so_nam_kinh_nghiem, hs.bang_cap_chung_chi, hs.mo_ta, hs.the_manh
      ORDER BY nd.vai_tro_id DESC, nd.ho_ten ASC
    `;
    const { rows } = await pool.query(queryStr);
    return rows;
  }

  async getSpecialistById(id: string | number) {
    const queryStr = `
      SELECT nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.anh_dai_dien, vt.ten_vai_tro as vai_tro,
             hs.so_nam_kinh_nghiem, hs.bang_cap_chung_chi, hs.mo_ta, hs.the_manh,
             COALESCE(AVG(dg.so_sao)::numeric(3,1), 5.0) as trung_binh_sao,
             COUNT(dg.id)::int as tong_danh_gia
      FROM nguoi_dung nd
      JOIN vai_tro vt ON nd.vai_tro_id = vt.id
      LEFT JOIN ho_so_chuyen_gia hs ON nd.id = hs.nguoi_dung_id
      LEFT JOIN danh_gia dg ON dg.nhan_su_id = nd.id AND dg.loai_danh_gia = 'NHAN_SU'
      WHERE nd.id = $1 AND nd.vai_tro_id IN (3, 4)
      GROUP BY nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.anh_dai_dien, vt.ten_vai_tro, hs.so_nam_kinh_nghiem, hs.bang_cap_chung_chi, hs.mo_ta, hs.the_manh
    `;
    const { rows } = await pool.query(queryStr, [id]);
    return rows[0] || null;
  }

  async getTestimonials() {
    const queryStr = `
      SELECT dg.id, dg.so_sao, dg.nhan_xet, kh.ho_ten, kh.gioi_tinh, dg.phan_hoi_nhan_xet as reply
      FROM danh_gia dg
      JOIN khach_hang kh ON dg.khach_hang_id = kh.id
      WHERE dg.loai_danh_gia = 'GOI_DICH_VU'
      ORDER BY dg.ngay_cap_nhat DESC
    `;
    const { rows } = await pool.query(queryStr);
    return rows;
  }

  async getActiveTreatmentPlans(customerId: string | number) {
    const queryStr = `
      SELECT pd.id,
             pd.goi_dich_vu_id,
             gdv.ten_goi AS ten_goi_dich_vu,
             gdv.thoi_luong_phut,
             pd.tong_so_buoi,
             pd.so_buoi_da_dung,
             pd.trang_thai,
             hd.hinh_thuc_thanh_toan_goi,
             hd.so_tien_da_tra,
             hd.tong_tien_phai_tra,
             hd.trang_thai AS trang_thai_hoa_don
      FROM phac_do_dieu_tri pd
      JOIN goi_dich_vu gdv ON pd.goi_dich_vu_id = gdv.id
      LEFT JOIN hoa_don hd ON hd.phac_do_dieu_tri_id = pd.id
      WHERE pd.khach_hang_id = $1
        AND pd.trang_thai IN ('dang_dieu_tri', 'moi_tao')
      ORDER BY COALESCE(pd.ngay_kich_hoat, hd.ngay_tao) DESC
    `;
    const { rows } = await pool.query(queryStr, [customerId]);
    return rows;
  }

  async agreeTerms(customerId: string | number) {
    await pool.query(
      `UPDATE khach_hang SET ngay_dong_y_dieu_khoan = NOW() WHERE id = $1`,
      [customerId]
    );
  }

  async getActiveVouchers(khachHangId?: string) {
    const { rows } = await pool.query(`
      SELECT v.id,
             v.ma_code AS ma_voucher,
             v.ten_chien_dich,
             v.ten_chien_dich AS ten_khuyen_mai,
             v.loai_giam_gia AS loai_giam,
             v.gia_tri_giam::text AS gia_tri_giam,
             v.giam_toi_da::text AS giam_toi_da,
             v.don_hang_toi_thieu::text AS don_hang_toi_thieu,
             v.tu_dong_ap_dung,
             v.loai_goi_ap_dung,
             v.yeu_cau_thanh_toan,
             v.so_luong_gioi_han
      FROM khuyen_mai_voucher v
      LEFT JOIN hoa_don hd ON hd.voucher_id = v.id AND ($1::text IS NULL OR hd.khach_hang_id::text = $1::text) AND hd.trang_thai NOT IN ('da_huy', 'da_hoan_tien')
      WHERE v.dang_kich_hoat = true
        AND (v.ngay_bat_dau IS NULL OR v.ngay_bat_dau <= NOW())
        AND (v.ngay_het_han IS NULL OR v.ngay_het_han >= NOW())
      GROUP BY v.id, v.ma_code, v.ten_chien_dich, v.loai_giam_gia, v.gia_tri_giam, v.giam_toi_da, v.don_hang_toi_thieu, v.tu_dong_ap_dung, v.loai_goi_ap_dung, v.yeu_cau_thanh_toan, v.so_luong_gioi_han
      HAVING v.so_luong_gioi_han IS NULL OR $1::text IS NULL OR COUNT(hd.id) < v.so_luong_gioi_han
      ORDER BY v.tu_dong_ap_dung DESC, v.gia_tri_giam DESC
    `, [khachHangId || null]);

    return rows.map((r: any) => ({
      ...r,
      gia_tri_giam: Number(r.gia_tri_giam || 0),
      giam_toi_da: r.giam_toi_da ? Number(r.giam_toi_da) : null,
      don_hang_toi_thieu: Number(r.don_hang_toi_thieu || 0),
    }));
  }
}

export default new ClientPublicRepository();

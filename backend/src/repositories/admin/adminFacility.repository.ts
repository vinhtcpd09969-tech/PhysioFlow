import { pool } from '../../config/db';
import prisma from '../../config/prisma';

export class AdminFacilityRepository {
  // --- QUẢN LÝ PHÒNG KHÁM ───────────────────────────────────────────────────
  async getRooms() {
    const { rows } = await pool.query(`
      SELECT id, ten_phong, ma_phong, loai_phong, suc_chua, trang_thai, mo_ta
      FROM phong_lam_viec
      ORDER BY id ASC
    `);
    return rows;
  }

  async createRoom(data: any) {
    const { rows } = await pool.query(`
      INSERT INTO phong_lam_viec (ten_phong, ma_phong, loai_phong, suc_chua, trang_thai, mo_ta)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, ten_phong, ma_phong, loai_phong, suc_chua, trang_thai, mo_ta
    `, [data.ten_phong, data.ma_phong, data.loai_phong, data.suc_chua || 1, data.trang_thai || 'san_sang', data.mo_ta]);
    return rows[0];
  }

  async updateRoom(id: string | number, data: any) {
    if (data.trang_thai && data.trang_thai !== 'san_sang') {
      await this.checkRoomFutureShifts(Number(id));
    }
    const { rows } = await pool.query(`
      UPDATE phong_lam_viec
      SET ten_phong = $1, ma_phong = $2, loai_phong = $3, suc_chua = $4, trang_thai = $5, mo_ta = $6
      WHERE id = $7
      RETURNING id, ten_phong, ma_phong, loai_phong, suc_chua, trang_thai, mo_ta
    `, [data.ten_phong, data.ma_phong, data.loai_phong, data.suc_chua || 1, data.trang_thai || 'san_sang', data.mo_ta, Number(id)]);
    return rows[0];
  }

  async deleteRoom(id: string | number) {
    await this.checkRoomFutureShifts(Number(id));
    const { rows } = await pool.query(`
      DELETE FROM phong_lam_viec
      WHERE id = $1
      RETURNING id, ten_phong, ma_phong, loai_phong
    `, [Number(id)]);
    return rows[0];
  }

  async checkRoomFutureShifts(roomId: number) {
    const { rows: shiftRows } = await pool.query(`
      SELECT lt.id, lt.ngay_truc, nd.ho_ten, p.ten_phong
      FROM lich_truc_nhan_su lt
      JOIN nguoi_dung nd ON lt.nhan_su_id = nd.id
      JOIN phong_lam_viec p ON lt.phong_id = p.id
      WHERE lt.phong_id = $1 
        AND lt.ngay_truc >= CURRENT_DATE
        AND lt.trang_thai = 'hoat_dong'
      LIMIT 1
    `, [roomId]);
    if (shiftRows.length > 0) {
      throw new Error(`Hiện tại đang có nhân viên trực ở phòng này, vui lòng đổi nhân viên sang phòng khác rồi mới được thao tác bảo trì hoặc ngưng sử dụng.`);
    }

    const { rows: apptRows } = await pool.query(`
      SELECT ch.id, ch.ngay_gio_bat_dau, kh.ho_ten as ten_khach_hang
      FROM cuoc_hen ch
      JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      WHERE ch.phong_id = $1
        AND ch.ngay_gio_ket_thuc >= NOW()
        AND ch.trang_thai NOT IN ('da_huy', 'hoan_thanh', 'khong_den')
      LIMIT 1
    `, [roomId]);
    if (apptRows.length > 0) {
      const appt = apptRows[0];
      const dateStr = new Date(appt.ngay_gio_bat_dau).toLocaleString('vi-VN');
      throw new Error(`Phòng đang có lịch hẹn của khách "${appt.ten_khach_hang}" lúc ${dateStr}. Không thể đổi trạng thái.`);
    }
  }

  // --- QUẢN LÝ GÓI DỊCH VỤ / KHÁM / LIỆU TRÌNH ────────────────────────────────
  async getPackages() {
    const packages = await prisma.goi_dich_vu.findMany({
      where: { trang_thai: { not: 'da_xoa' } },
      orderBy: { ten_goi: 'asc' },
      include: { _count: { select: { cuoc_hen: true } } }
    });

    return packages.map(({ _count, ...pkg }) => ({
      ...pkg,
      gia_tien: pkg.don_gia,
      gia_goi: pkg.don_gia,
      gia_goc: pkg.don_gia,
      thoi_luong_buoi_phut: pkg.thoi_luong_phut,
      luot_dung: _count.cuoc_hen
    }));
  }

  async createPackage(data: any) {
    const isAct = data.trang_thai || 'hoat_dong';
    const donGia = data.don_gia ? BigInt(data.don_gia) : BigInt(0);
    const tongSoBuoi = data.tong_so_buoi ? Number(data.tong_so_buoi) : 1;
    const donGiaTheoBuoi = data.don_gia_theo_buoi ? BigInt(data.don_gia_theo_buoi) : BigInt(Math.round(Number(donGia) / tongSoBuoi));

    const pkg = await prisma.goi_dich_vu.create({
      data: {
        ten_goi: data.ten_goi,
        loai_goi: data.loai_goi || 'KHAM',
        tong_so_buoi: tongSoBuoi,
        thoi_luong_phut: data.thoi_luong_phut || 30,
        don_gia: donGia,
        don_gia_theo_buoi: donGiaTheoBuoi,
        quy_trinh: data.quy_trinh || null,
        muc_tieu: data.muc_tieu || null,
        trang_thai: isAct,
        anh_goi: data.anh_goi || null,
        anh_gallery: data.anh_gallery || [],
        han_su_dung_mac_dinh_ngay: data.loai_goi === 'LIEU_TRINH' && data.han_su_dung_mac_dinh_ngay
          ? Number(data.han_su_dung_mac_dinh_ngay)
          : null
      }
    });

    return {
      ...pkg,
      gia_tien: pkg.don_gia,
      thoi_luong_buoi_phut: pkg.thoi_luong_phut
    };
  }

  async updatePackage(id: string, data: any) {
    const isAct = data.trang_thai || 'hoat_dong';
    const donGia = data.don_gia ? BigInt(data.don_gia) : BigInt(0);
    const tongSoBuoi = data.tong_so_buoi ? Number(data.tong_so_buoi) : 1;
    const donGiaTheoBuoi = data.don_gia_theo_buoi ? BigInt(data.don_gia_theo_buoi) : BigInt(Math.round(Number(donGia) / tongSoBuoi));

    const pkg = await prisma.goi_dich_vu.update({
      where: { id },
      data: {
        ten_goi: data.ten_goi,
        loai_goi: data.loai_goi,
        tong_so_buoi: tongSoBuoi,
        thoi_luong_phut: data.thoi_luong_phut || 30,
        don_gia: donGia,
        don_gia_theo_buoi: donGiaTheoBuoi,
        quy_trinh: data.quy_trinh || null,
        muc_tieu: data.muc_tieu || null,
        trang_thai: isAct,
        anh_goi: data.anh_goi || null,
        anh_gallery: data.anh_gallery || [],
        han_su_dung_mac_dinh_ngay: data.loai_goi === 'LIEU_TRINH' && data.han_su_dung_mac_dinh_ngay
          ? Number(data.han_su_dung_mac_dinh_ngay)
          : null
      }
    });

    return {
      ...pkg,
      gia_tien: pkg.don_gia,
      thoi_luong_buoi_phut: pkg.thoi_luong_phut
    };
  }

  async deletePackage(id: string) {
    return prisma.goi_dich_vu.update({
      where: { id },
      data: { trang_thai: 'ngung_hoat_dong' }
    });
  }

  // --- QUẢN LÝ THIẾT BỊ Y TẾ ---
  async getEquipment(): Promise<any[]> {
    const { rows } = await pool.query(`
      SELECT tb.id, tb.ma_thiet_bi, tb.ten_thiet_bi, tb.ngay_mua, tb.trang_thai, tb.ghi_chu,
             tb.phong_id, p.ten_phong, p.ma_phong
      FROM thiet_bi tb
      LEFT JOIN phong_lam_viec p ON tb.phong_id = p.id
      ORDER BY tb.ten_thiet_bi ASC
    `);
    return rows;
  }

  async createEquipment(ma_thiet_bi: string, data: any): Promise<any> {
    const ma = data.ma_thiet_bi || ma_thiet_bi || ('TB-' + Math.random().toString(36).substring(2, 8).toUpperCase());
    const phongId = data.phong_id ? Number(data.phong_id) : null;
    const { rows } = await pool.query(`
      INSERT INTO thiet_bi (ma_thiet_bi, ten_thiet_bi, ngay_mua, trang_thai, ghi_chu, phong_id)
      VALUES ($1, $2, $3::date, $4, $5, $6)
      RETURNING id, ma_thiet_bi, ten_thiet_bi, ngay_mua, trang_thai, ghi_chu, phong_id
    `, [ma, data.ten_thiet_bi, data.ngay_mua || null, data.trang_thai || 'san_sang', data.ghi_chu, phongId]);
    return rows[0];
  }

  async updateEquipment(id: string, data: any): Promise<any> {
    const phongId = data.phong_id ? Number(data.phong_id) : null;
    const { rows } = await pool.query(`
      UPDATE thiet_bi
      SET ma_thiet_bi = $1, ten_thiet_bi = $2, ngay_mua = $3::date, trang_thai = $4, ghi_chu = $5, phong_id = $6
      WHERE id = $7::uuid
      RETURNING id, ma_thiet_bi, ten_thiet_bi, ngay_mua, trang_thai, ghi_chu, phong_id
    `, [data.ma_thiet_bi, data.ten_thiet_bi, data.ngay_mua || null, data.trang_thai, data.ghi_chu, phongId, id]);
    return rows[0];
  }

  async deleteEquipment(id: string): Promise<any> {
    const { rows } = await pool.query(`
      DELETE FROM thiet_bi
      WHERE id = $1::uuid
      RETURNING id, ma_thiet_bi, ten_thiet_bi
    `, [id]);
    return rows[0];
  }
}

export default new AdminFacilityRepository();

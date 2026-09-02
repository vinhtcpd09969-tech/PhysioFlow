import { LoaiCuocHen } from './types';

/**
 * Sức chứa đặt lịch theo mô hình NGÂN SÁCH PHÚT — thay thế slot 30 phút cố định (A1).
 * Nguồn sự thật duy nhất cho công thức ngân sách; UI/repository PHẢI gọi qua các hàm ở đây,
 * không tự tính lại overlap/ngân sách ở nơi khác (xem docs/BUSINESS_RULES.md khi bổ sung).
 *
 * Nguyên tắc cốt lõi (xem kế hoạch tái thiết kế — mục "Ba lớp kiểm soát sức chứa"):
 *   ngân sách riêng 1 nhân sự = (giao giữa ca trực và giờ nhận khách của buổi) × số khách song song
 *   ngân sách chung 1 buổi   = Σ ngân sách riêng — NHƯNG TÁCH RIÊNG theo 2 túi vai trò:
 *     - buổi Lượng giá (KHAM/KHAM_MOI)      → túi Chuyên viên Vật lý trị liệu (vai_tro_id = 4)
 *     - dịch vụ lẻ + buổi liệu trình (DIEU_TRI/DICH_VU_LE) → túi KTV (vai_tro_id = 3)
 *   Lượng giá và Trị liệu KHÔNG BAO GIỜ trừ chung một túi — hết chỗ bên này không có nghĩa hết
 *   chỗ bên kia.
 */

/** Giờ nhận khách theo buổi — tham số cấu hình, KHÔNG viết cứng ở nơi khác. */
export const GIO_NHAN_KHACH: Record<Buoi, { batDau: string; ketThuc: string }> = {
  sang: { batDau: '07:30', ketThuc: '12:00' },
  chieu: { batDau: '12:00', ketThuc: '20:00' },
};

/** Giờ đóng cửa trung tâm — mọi ca phải xong trước mốc này (dùng ở Lớp 2, xem B20). */
export const GIO_DONG_CUA = '20:00';

/** Đệm sau khi hết buổi trước khi hệ thống tự đánh dấu "không đến" (B10) — cho khách đến sát giờ. */
export const NO_SHOW_SWEEP_BUFFER_MINUTES = 30;

/** vai_tro.id thật trong DB (đã xác nhận qua truy vấn — không đoán). */
export const VAI_TRO_ID_KTV = 3;
export const VAI_TRO_ID_CHUYEN_VIEN = 4;

export type Buoi = 'sang' | 'chieu';
export type NhomVaiTro = 'chuyen_vien' | 'ktv';

/**
 * Buổi Lượng giá (KHAM/KHAM_MOI) → túi Chuyên viên. Dịch vụ lẻ + buổi liệu trình → túi KTV.
 * Đây là điểm DUY NHẤT ánh xạ loại lịch hẹn sang túi ngân sách — mọi nơi khác phải gọi hàm này,
 * không tự if/else lại logic map để tránh lệch nhau khi thêm loại lịch hẹn mới.
 */
export function resolveNhomVaiTro(loaiCuocHen: LoaiCuocHen | string): NhomVaiTro {
  const upper = loaiCuocHen.toUpperCase();
  return upper === 'KHAM' || upper === 'KHAM_MOI' ? 'chuyen_vien' : 'ktv';
}

export function vaiTroIdCuaNhom(nhom: NhomVaiTro): number {
  return nhom === 'chuyen_vien' ? VAI_TRO_ID_CHUYEN_VIEN : VAI_TRO_ID_KTV;
}

/**
 * Số khách tối đa 1 nhân sự được gọi vào đồng thời, suy THẲNG từ vai_tro_id — không còn cột DB
 * riêng (ho_so_chuyen_gia.so_khach_song_song đã bỏ vì data thật chưa từng lệch khỏi công thức
 * này). KTV = 2 (xen kẽ được khi khách nằm máy), còn lại (Chuyên viên VLTL) = 1 (lượng giá cần
 * tập trung). Đây là nguồn sự thật DUY NHẤT — mọi câu SQL raw cần giá trị này phải dùng CASE
 * đúng theo công thức ở đây (`vai_tro_id = ${VAI_TRO_ID_KTV} THEN 2 ELSE 1`), không tự bịa anchor khác.
 */
export function soKhachSongSongTheoVaiTro(vaiTroId: number): number {
  return vaiTroId === VAI_TRO_ID_KTV ? 2 : 1;
}

/** Chuyển "HH:MM" hoặc "HH:MM:SS" (node-postgres trả TIME dạng chuỗi) thành số phút từ 00:00. */
export function parseGioThanhPhut(gio: string): number {
  const [h, m] = gio.split(':').map((x) => parseInt(x, 10));
  return h * 60 + (m || 0);
}

export function getKhungGioBuoi(buoi: Buoi): { batDauPhut: number; ketThucPhut: number } {
  const { batDau, ketThuc } = GIO_NHAN_KHACH[buoi];
  return { batDauPhut: parseGioThanhPhut(batDau), ketThucPhut: parseGioThanhPhut(ketThuc) };
}

/**
 * Phút giao nhau giữa 1 ca trực (lich_truc_nhan_su.gio_bat_dau/gio_ket_thuc) và khung giờ nhận
 * khách của 1 buổi.
 * Nếu có gioHienTaiPhut (khi đặt lịch cho chính ngày HÔM NAY):
 *   Điểm bắt đầu tính khả dụng = max(giờ bắt đầu ca, giờ bắt đầu buổi, giờ hiện tại).
 *   Nhờ đó, thời gian đã trôi qua trong ca trực sẽ tự động được khấu trừ trong ngày.
 */
export function tinhPhutGiaoNhau(
  gioBatDauCa: string,
  gioKetThucCa: string,
  buoi: Buoi,
  gioHienTaiPhut?: number
): number {
  const batDauCaPhut = parseGioThanhPhut(gioBatDauCa);
  const ketThucCaPhut = parseGioThanhPhut(gioKetThucCa);
  const { batDauPhut, ketThucPhut } = getKhungGioBuoi(buoi);
  const giaoBatDauGoc = Math.max(batDauCaPhut, batDauPhut);
  const giaoKetThuc = Math.min(ketThucCaPhut, ketThucPhut);

  if (gioHienTaiPhut !== undefined) {
    const giaoBatDauHienTai = Math.max(giaoBatDauGoc, gioHienTaiPhut);
    return Math.max(0, giaoKetThuc - giaoBatDauHienTai);
  }

  return Math.max(0, giaoKetThuc - giaoBatDauGoc);
}

export interface NhanSuTrucCa {
  nhanSuId: number;
  gioBatDau: string;
  gioKetThuc: string;
  /** Suy thẳng từ vai_tro_id (không còn cột DB riêng) — Chuyên viên = 1, KTV = 2. */
  soKhachSongSong: number;
}

/**
 * Ngân sách riêng của 1 nhân sự cho 1 buổi = phút giao nhau giữa ca trực và buổi.
 * Thời lượng ngân sách tính đúng 1:1 theo thời lượng ca trực thực tế (không nhân đôi số phút cho KTV,
 * dù KTV có thể mở tối đa 2 bàn đồng thời khi phục vụ lâm sàng).
 */
export function tinhNganSachRieng(nhanSu: NhanSuTrucCa, buoi: Buoi, gioHienTaiPhut?: number): number {
  return tinhPhutGiaoNhau(nhanSu.gioBatDau, nhanSu.gioKetThuc, buoi, gioHienTaiPhut);
}

/** Ngân sách chung của túi vai trò trong 1 buổi = Σ ngân sách riêng của mọi nhân sự đang trực. */
export function tinhNganSachChung(danhSachNhanSu: NhanSuTrucCa[], buoi: Buoi, gioHienTaiPhut?: number): number {
  return danhSachNhanSu.reduce((tong, ns) => tong + tinhNganSachRieng(ns, buoi, gioHienTaiPhut), 0);
}

/** 1 lịch đã đặt, quy về số phút đã chiếm dụng — nhanSuId = null nghĩa là khách chọn "Bất kỳ". */
export interface PhutDaDat {
  nhanSuId: number | null;
  soPhut: number;
}

export interface KetQuaKiemTraDatLich {
  choPhep: boolean;
  lyDo?: string;
  /** Số phút còn lại SAU KHI trừ lịch mới (chỉ có ý nghĩa khi choPhep = true). */
  soPhutConLai?: number;
}

/**
 * Kiểm tra đặt lịch cho MỘT nhân sự cụ thể (khách chọn đích danh).
 * Chỉ trừ vào ngân sách RIÊNG của đúng người đó — không đụng tới người khác trong cùng túi.
 */
export function kiemTraDatChoNhanSuCuThe(
  nhanSuId: number,
  danhSachNhanSu: NhanSuTrucCa[],
  daDat: PhutDaDat[],
  thoiLuongMoiPhut: number,
  buoi: Buoi,
  gioHienTaiPhut?: number
): KetQuaKiemTraDatLich {
  const nhanSu = danhSachNhanSu.find((n) => n.nhanSuId === nhanSuId);
  if (!nhanSu) {
    return { choPhep: false, lyDo: 'Nhân sự không trực buổi này.' };
  }
  const nganSach = gioHienTaiPhut !== undefined
    ? tinhNganSachRieng(nhanSu, buoi, gioHienTaiPhut)
    : tinhNganSachRieng(nhanSu, buoi);
  const daDungRieng = daDat
    .filter((d) => d.nhanSuId === nhanSuId)
    .reduce((tong, d) => tong + d.soPhut, 0);
  const conLai = Math.max(0, nganSach - daDungRieng);

  if (thoiLuongMoiPhut > conLai) {
    return {
      choPhep: false,
      lyDo: `Nhân sự này chỉ còn ${Math.max(0, conLai)} phút trong buổi — không đủ cho dịch vụ ${thoiLuongMoiPhut} phút.`,
      soPhutConLai: Math.max(0, conLai),
    };
  }
  return { choPhep: true, soPhutConLai: conLai - thoiLuongMoiPhut };
}

/**
 * Kiểm tra đặt lịch khi khách chọn "Bất kỳ" — BẮT BUỘC đủ CẢ HAI điều kiện:
 * ① Ngân sách CHUNG còn đủ
 * ② TỒN TẠI ít nhất 1 nhân sự còn đủ thời lượng RIÊNG
 */
export function kiemTraDatBatKy(
  danhSachNhanSu: NhanSuTrucCa[],
  daDat: PhutDaDat[],
  thoiLuongMoiPhut: number,
  buoi: Buoi,
  gioHienTaiPhut?: number
): KetQuaKiemTraDatLich {
  // ① Ngân sách CHUNG của cả túi
  const nganSachChung = gioHienTaiPhut !== undefined
    ? tinhNganSachChung(danhSachNhanSu, buoi, gioHienTaiPhut)
    : tinhNganSachChung(danhSachNhanSu, buoi);
  const tongDaDung = daDat.reduce((tong, d) => tong + d.soPhut, 0);
  const conLaiChung = Math.max(0, nganSachChung - tongDaDung);

  if (thoiLuongMoiPhut > conLaiChung) {
    return {
      choPhep: false,
      lyDo: `Buổi chỉ còn ${Math.max(0, conLaiChung)} phút — không đủ cho dịch vụ ${thoiLuongMoiPhut} phút.`,
      soPhutConLai: Math.max(0, conLaiChung),
    };
  }

  // ② TỒN TẠI ít nhất 1 nhân sự còn đủ chỗ RIÊNG (không suy từ tổng chung)
  const coNguoiConDu = danhSachNhanSu.some((ns) => {
    const nganSachRieng = gioHienTaiPhut !== undefined
      ? tinhNganSachRieng(ns, buoi, gioHienTaiPhut)
      : tinhNganSachRieng(ns, buoi);
    const daDungRieng = daDat
      .filter((d) => d.nhanSuId === ns.nhanSuId)
      .reduce((tong, d) => tong + d.soPhut, 0);
    const conLaiRieng = Math.max(0, nganSachRieng - daDungRieng);
    return conLaiRieng >= thoiLuongMoiPhut;
  });

  if (!coNguoiConDu) {
    return {
      choPhep: false,
      lyDo: 'Không có nhân sự nào còn đủ thời lượng cho dịch vụ này, dù tổng ngân sách buổi vẫn còn.',
      soPhutConLai: 0,
    };
  }

  return { choPhep: true, soPhutConLai: conLaiChung - thoiLuongMoiPhut };
}

export interface CaSangAppointment {
  thoiGianCheckin: string | Date | null;
  thoiLuongPhut: number;
}

/**
 * Tính số phút các ca Sáng tràn sang ca Chiều sau mốc 12:00.
 * Khách ca Sáng check-in muộn (vd 11h45) làm gói 90 phút (xong lúc 13h15) -> Tràn 75 phút sang ca Chiều.
 * Số phút tràn này sẽ tự động khấu trừ vào Ngân sách Buổi Chiều để ca Chiều không bị quá tải ngầm.
 */
export function tinhPhutTranCa(caSangAppointments: CaSangAppointment[]): number {
  const KET_THUC_SANG_PHUT = 12 * 60; // 12:00 = 720 phút
  let tongPhutTran = 0;

  for (const apt of caSangAppointments) {
    if (!apt.thoiGianCheckin) continue;
    const checkinDate = new Date(apt.thoiGianCheckin);
    const checkinMins = checkinDate.getHours() * 60 + checkinDate.getMinutes();
    const duKienXongMins = checkinMins + Math.max(0, apt.thoiLuongPhut);

    if (duKienXongMins > KET_THUC_SANG_PHUT) {
      tongPhutTran += (duKienXongMins - KET_THUC_SANG_PHUT);
    }
  }

  return tongPhutTran;
}


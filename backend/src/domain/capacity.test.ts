import { describe, expect, it } from 'vitest';
import {
  NhanSuTrucCa,
  kiemTraDatBatKy,
  kiemTraDatChoNhanSuCuThe,
  resolveNhomVaiTro,
  tinhNganSachChung,
  tinhNganSachRieng,
  tinhPhutGiaoNhau,
} from './capacity';

describe('resolveNhomVaiTro', () => {
  it('KHAM/KHAM_MOI -> túi chuyên viên', () => {
    expect(resolveNhomVaiTro('KHAM')).toBe('chuyen_vien');
    expect(resolveNhomVaiTro('KHAM_MOI')).toBe('chuyen_vien');
  });

  it('DIEU_TRI/DICH_VU_LE -> túi KTV', () => {
    expect(resolveNhomVaiTro('DIEU_TRI')).toBe('ktv');
    expect(resolveNhomVaiTro('DICH_VU_LE')).toBe('ktv');
  });
});

describe('tinhPhutGiaoNhau — bẫy 2: hai ca trực KHÔNG đóng góp bằng nhau', () => {
  it('ca 7h-16h giao buổi sáng (7h30-12h) = 270 phút', () => {
    expect(tinhPhutGiaoNhau('07:00', '16:00', 'sang')).toBe(270);
  });

  it('ca 11h-20h giao buổi sáng (7h30-12h) chỉ = 60 phút, KHÔNG phải 270', () => {
    expect(tinhPhutGiaoNhau('11:00', '20:00', 'sang')).toBe(60);
  });

  it('ca không giao gì với buổi -> 0 phút, không âm', () => {
    expect(tinhPhutGiaoNhau('13:00', '20:00', 'sang')).toBe(0);
  });
});

describe('Ví dụ tính ngân sách trong kế hoạch — buổi sáng 2 nhân sự', () => {
  it('2 nhân sự CÙNG ca 7h-16h, song song 1 -> ngân sách chung 540 phút', () => {
    const danhSach: NhanSuTrucCa[] = [
      { nhanSuId: 1, gioBatDau: '07:00', gioKetThuc: '16:00', soKhachSongSong: 1 },
      { nhanSuId: 2, gioBatDau: '07:00', gioKetThuc: '16:00', soKhachSongSong: 1 },
    ];
    expect(tinhNganSachChung(danhSach, 'sang')).toBe(540);
  });

  it('mỗi người MỘT ca khác nhau (7h-16h + 11h-20h) -> ngân sách chung 330 phút, KHÔNG phải 540', () => {
    const danhSach: NhanSuTrucCa[] = [
      { nhanSuId: 1, gioBatDau: '07:00', gioKetThuc: '16:00', soKhachSongSong: 1 },
      { nhanSuId: 2, gioBatDau: '11:00', gioKetThuc: '20:00', soKhachSongSong: 1 },
    ];
    expect(tinhNganSachChung(danhSach, 'sang')).toBe(330);
  });

  it('ngân sách tính 1:1 theo thời lượng ca trực thực tế (270 phút cho ca sáng 7h-16h)', () => {
    const mot: NhanSuTrucCa = { nhanSuId: 1, gioBatDau: '07:00', gioKetThuc: '16:00', soKhachSongSong: 1 };
    const hai: NhanSuTrucCa = { nhanSuId: 1, gioBatDau: '07:00', gioKetThuc: '16:00', soKhachSongSong: 2 };
    expect(tinhNganSachRieng(mot, 'sang')).toBe(270);
    expect(tinhNganSachRieng(hai, 'sang')).toBe(270);
  });
});

describe('kiemTraDatChoNhanSuCuThe — đặt xen kẽ nhiều thời lượng, chặn theo phút còn lại', () => {
  const nhanSu: NhanSuTrucCa[] = [
    { nhanSuId: 1, gioBatDau: '07:00', gioKetThuc: '16:00', soKhachSongSong: 1 },
  ];

  it('đặt xen kẽ 30/60/90/120 phút trừ đúng số phút, không lệch', () => {
    // Ngân sách riêng = 270 phút.
    let daDat = [{ nhanSuId: 1, soPhut: 30 }, { nhanSuId: 1, soPhut: 60 }, { nhanSuId: 1, soPhut: 90 }];
    // Đã dùng 180/270, còn 90 -> đặt tiếp 120 phải bị chặn.
    const ketQua = kiemTraDatChoNhanSuCuThe(1, nhanSu, daDat, 120, 'sang');
    expect(ketQua.choPhep).toBe(false);
    expect(ketQua.soPhutConLai).toBe(90);
  });

  it('còn đúng 60 phút: đặt 30 phải CHO, đặt 90 phải CHẶN — chặn theo thời lượng, không theo số ca', () => {
    // 270 - 210 = còn 60.
    const daDat = [{ nhanSuId: 1, soPhut: 210 }];
    expect(kiemTraDatChoNhanSuCuThe(1, nhanSu, daDat, 30, 'sang').choPhep).toBe(true);
    expect(kiemTraDatChoNhanSuCuThe(1, nhanSu, daDat, 90, 'sang').choPhep).toBe(false);
  });

  it('nhân sự không trực buổi này -> luôn chặn', () => {
    expect(kiemTraDatChoNhanSuCuThe(99, nhanSu, [], 30, 'sang').choPhep).toBe(false);
  });
});

describe('kiemTraDatBatKy — bẫy hai tầng (chỗ dễ sai nhất)', () => {
  it('A đích danh 250 + B đích danh 250 (chung còn 40) -> đặt 30 phút "Bất kỳ" PHẢI BỊ CHẶN dù chung còn đủ', () => {
    const nhanSu: NhanSuTrucCa[] = [
      { nhanSuId: 1, gioBatDau: '07:00', gioKetThuc: '16:00', soKhachSongSong: 1 }, // riêng 270
      { nhanSuId: 2, gioBatDau: '07:00', gioKetThuc: '16:00', soKhachSongSong: 1 }, // riêng 270
    ];
    // Chung = 540, đã dùng 500 (250 A + 250 B) -> còn 40 chung, nhưng A còn 20, B còn 20.
    const daDat = [
      { nhanSuId: 1, soPhut: 250 },
      { nhanSuId: 2, soPhut: 250 },
    ];
    const ketQua = kiemTraDatBatKy(nhanSu, daDat, 30, 'sang');
    expect(ketQua.choPhep).toBe(false);
    expect(ketQua.lyDo).toMatch(/không có nhân sự/i);
  });

  it('cùng kịch bản trên nhưng đặt 20 phút thì CHO (A hoặc B còn đúng 20)', () => {
    const nhanSu: NhanSuTrucCa[] = [
      { nhanSuId: 1, gioBatDau: '07:00', gioKetThuc: '16:00', soKhachSongSong: 1 },
      { nhanSuId: 2, gioBatDau: '07:00', gioKetThuc: '16:00', soKhachSongSong: 1 },
    ];
    const daDat = [
      { nhanSuId: 1, soPhut: 250 },
      { nhanSuId: 2, soPhut: 250 },
    ];
    expect(kiemTraDatBatKy(nhanSu, daDat, 20, 'sang').choPhep).toBe(true);
  });

  it('vượt ngân sách CHUNG thì chặn ở tầng ① luôn, không cần xét tầng ②', () => {
    const nhanSu: NhanSuTrucCa[] = [
      { nhanSuId: 1, gioBatDau: '07:00', gioKetThuc: '16:00', soKhachSongSong: 1 },
    ];
    const ketQua = kiemTraDatBatKy(nhanSu, [], 300, 'sang'); // ngân sách chung chỉ có 270
    expect(ketQua.choPhep).toBe(false);
    expect(ketQua.lyDo).toMatch(/buổi chỉ còn/i);
  });
});

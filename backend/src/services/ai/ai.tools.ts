import { SchemaType, FunctionDeclaration } from '@google/generative-ai';
import prisma from '../../config/prisma';
import appointmentService from '../appointment.service';

export const AI_TOOLS: FunctionDeclaration[] = [
  {
    name: 'kiem_tra_lich_kham_trong',
    description:
      'Tra cứu buổi sáng/chiều còn nhận khách THẬT trong hệ thống đặt lịch của OfficeCare cho một ngày cụ thể (YYYY-MM-DD).',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        ngay: {
          type: SchemaType.STRING,
          description: 'Ngày cần tra cứu, định dạng YYYY-MM-DD.',
        },
      },
      required: ['ngay'],
    },
  },
  {
    name: 'xem_thong_tin_ca_nhan',
    description:
      'Lấy thông tin cá nhân của khách hàng ĐANG ĐĂNG NHẬP: TẤT CẢ các gói liệu trình đang điều trị, số buổi còn lại của từng gói, chuyên viên PHCN chỉ định, danh sách KTV phụ trách từng buổi cụ thể, và lịch hẹn sắp tới.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: 'tra_cuu_chuyen_gia_uy_tin',
    description:
      'Tra cứu danh sách Chuyên viên tư vấn & Kỹ thuật viên uy tín của trung tâm OfficeCare (kèm học vị, số năm kinh nghiệm, thế mạnh chuyên môn lâm sàng). Dùng khi khách hỏi chung về đội ngũ nhân sự của trung tâm.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        the_manh_hoac_tu_khoa: {
          type: SchemaType.STRING,
          description: 'Từ khóa thế mạnh hoặc chuyên khoa (ví dụ: cột sống, vai gáy, thoát vị, phục hồi sau mổ...). Để trống nếu muốn xem tất cả.',
        },
      },
    },
  },
  {
    name: 'tra_cuu_goi_dich_vu',
    description:
      'Tra cứu danh sách chi tiết các gói trị liệu & dịch vụ lẻ của OfficeCare theo từ khóa nhu cầu (ví dụ: vai gáy, thắt lưng, xung kích, laser, giãn cơ...). Trả về giá, số buổi, thời lượng, mục tiêu trị liệu.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        tu_khoa: {
          type: SchemaType.STRING,
          description: 'Từ khóa tìm kiếm gói dịch vụ (ví dụ: cổ vai gáy, lưng, cột sống, laser, massage...).',
        },
      },
      required: ['tu_khoa'],
    },
  },
  {
    name: 'tra_cuu_chinh_sach_phong_kham',
    description:
      'Tra cứu chính sách trung tâm OfficeCare: đặt lịch theo buổi, hủy lịch trong 60 phút, đổi lịch trước mốc 50% thời gian buổi, hoàn tiền trong 7 ngày, trả góp từng buổi, quy định no-show (vắng mặt 2 lần).',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        chu_de: {
          type: SchemaType.STRING,
          description: 'Chủ đề chính sách cần tra cứu: "hoan_tien", "huy_doi_lich", "tra_gop", "dat_lich", "voucher", "quy_trinh_kham".',
        },
      },
      required: ['chu_de'],
    },
  },
];

export async function toolKiemTraLichKhamTrong(args: any): Promise<object> {
  const ngay = typeof args?.ngay === 'string' ? args.ngay.trim() : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay)) {
    return { error: 'Ngày không hợp lệ, cần đúng định dạng YYYY-MM-DD.' };
  }
  const todayVN = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  if (ngay < todayVN) {
    return { error: 'Ngày đã qua, không thể tra cứu lịch trống cho ngày trong quá khứ.' };
  }

  const result = await appointmentService.getBuoiAvailability(ngay);

  return {
    ngay,
    buoi_sang: {
      con_cho: result?.sang?.choPhep ?? false,
      so_phut_con_lai_uoc_tinh: result?.sang?.conLaiChung ?? 0,
    },
    buoi_chieu: {
      con_cho: result?.chieu?.choPhep ?? false,
      so_phut_con_lai_uoc_tinh: result?.chieu?.conLaiChung ?? 0,
    },
    so_nhan_su_truc_hom_do: (result?.nhanSu || []).length,
  };
}

export async function toolXemThongTinCaNhan(khachHangId: string | null): Promise<object> {
  if (!khachHangId) {
    return { error: 'Khách đang chat ở chế độ vãng lai (chưa đăng nhập). Vui lòng nhắc khách đăng nhập tài khoản để tra cứu chính xác số buổi còn lại và chuyên viên/KTV phụ trách hồ sơ của họ.' };
  }

  const customer = await prisma.khach_hang.findUnique({
    where: { id: khachHangId },
    select: { ho_ten: true, so_dien_thoai: true, email: true },
  });
  if (!customer) {
    return { error: 'Không tìm thấy thông tin tài khoản khách hàng.' };
  }

  // Lấy TẤT CẢ các phác đồ đang điều trị hoặc chờ kích hoạt
  const activePlans = await prisma.phac_do_dieu_tri.findMany({
    where: {
      khach_hang_id: khachHangId,
      trang_thai: { in: ['dang_dieu_tri', 'cho_kich_hoat'] }
    },
    orderBy: { ngay_kich_hoat: 'desc' },
    include: {
      goi_dich_vu: {
        select: { id: true, ten_goi: true, don_gia: true, tong_so_buoi: true, thoi_luong_phut: true }
      },
      chi_dinh_buoi: {
        include: {
          nhat_ky_buoi_dieu_tri: {
            include: {
              nguoi_dung: { select: { ho_ten: true, vai_tro_id: true } }
            }
          }
        }
      },
      cuoc_hen: {
        orderBy: { so_thu_tu_buoi: 'asc' },
        include: {
          nguoi_dung: { select: { ho_ten: true, vai_tro_id: true } }
        }
      }
    }
  });

  const dsGoi = activePlans.map(plan => {
    const specialistPrescribed = plan.chi_dinh_buoi?.[0]?.nhat_ky_buoi_dieu_tri?.nguoi_dung?.ho_ten || 'Chuyên viên PHCN OfficeCare';

    const sessions = plan.cuoc_hen.map(appt => {
      const staffName = appt.nguoi_dung?.ho_ten || 'Chưa phân công / Bất kỳ KTV';
      const staffRole = appt.nguoi_dung?.vai_tro_id === 4 ? 'Chuyên viên PHCN' : 'Kỹ thuật viên';
      const dateFormatted = appt.ngay_gio_bat_dau.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      const buoiStr = appt.buoi === 'sang' ? 'Sáng' : 'Chiều';
      
      let statusLabel = 'Chưa diễn ra';
      if (appt.trang_thai === 'hoan_thanh') statusLabel = 'Đã hoàn thành';
      else if (appt.trang_thai === 'da_checkin') statusLabel = 'Đã check-in (Đang chờ)';
      else if (appt.trang_thai === 'dang_kham') statusLabel = 'Đang thực hiện';
      else if (appt.trang_thai === 'da_xac_nhan') statusLabel = 'Đã đặt lịch';
      else if (appt.trang_thai === 'khong_den') statusLabel = 'Vắng mặt';
      else if (appt.trang_thai === 'da_huy') statusLabel = 'Đã hủy';

      return {
        buoi_so: appt.so_thu_tu_buoi || 'N/A',
        ngay: `${dateFormatted} (${buoiStr})`,
        trang_thai: statusLabel,
        nhan_su_phu_trach: `${staffRole} ${staffName}`
      };
    });

    return {
      phac_do_id: plan.id,
      ten_goi: plan.goi_dich_vu.ten_goi,
      so_buoi_da_dung: plan.so_buoi_da_dung,
      tong_so_buoi: plan.tong_so_buoi,
      so_buoi_con_lai: plan.tong_so_buoi - plan.so_buoi_da_dung,
      han_su_dung: plan.han_su_dung ? plan.han_su_dung.toISOString().slice(0, 10) : 'Chưa giới hạn',
      chuyen_vien_chi_dinh_ban_dau: specialistPrescribed,
      danh_sach_buoi_va_ktv_phu_trach: sessions
    };
  });

  const nextAppointment = await prisma.cuoc_hen.findFirst({
    where: {
      khach_hang_id: khachHangId,
      trang_thai: { in: ['da_xac_nhan', 'da_checkin'] },
      ngay_gio_bat_dau: { gte: new Date(Date.now() - 2 * 3600 * 1000) },
    },
    orderBy: { ngay_gio_bat_dau: 'asc' },
    include: {
      nguoi_dung: { select: { ho_ten: true, vai_tro_id: true } },
      goi_dich_vu: { select: { ten_goi: true } }
    }
  });

  return {
    ten_khach_hang: customer.ho_ten,
    so_luong_goi_dang_dung: dsGoi.length,
    danh_sach_goi_dang_dieu_tri: dsGoi,
    lich_hen_sap_toi_gan_nhat: nextAppointment
      ? {
          ten_dich_vu: nextAppointment.goi_dich_vu?.ten_goi || (nextAppointment.loai === 'kham_moi' ? 'Lượng giá chức năng' : 'Trị liệu phục hồi'),
          thoi_gian: nextAppointment.ngay_gio_bat_dau.toLocaleString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }),
          buoi: nextAppointment.buoi === 'sang' ? 'Buổi Sáng (07:30 - 12:00)' : 'Buổi Chiều (12:00 - 20:00)',
          nhan_su_phu_trach: nextAppointment.nguoi_dung ? `${nextAppointment.nguoi_dung.vai_tro_id === 4 ? 'Chuyên viên' : 'KTV'} ${nextAppointment.nguoi_dung.ho_ten}` : 'Chờ phân công tại quầy',
          trang_thai: nextAppointment.trang_thai === 'da_checkin' ? 'Đã check-in tại quầy' : 'Đã xác nhận'
        }
      : 'Không có lịch hẹn nào sắp tới.'
  };
}

export async function toolTraCuuChuyenGiaUyTin(args: any): Promise<object> {
  const kw = typeof args?.the_manh_hoac_tu_khoa === 'string' ? args.the_manh_hoac_tu_khoa.toLowerCase().trim() : '';
  const specialists = await prisma.nguoi_dung.findMany({
    where: {
      trang_thai: 'hoat_dong',
      vai_tro_id: { in: [3, 4] }
    },
    select: {
      id: true,
      ho_ten: true,
      vai_tro_id: true,
      vai_tro: { select: { ten_vai_tro: true } },
      ho_so_chuyen_gia: {
        select: {
          so_nam_kinh_nghiem: true,
          bang_cap_chung_chi: true,
          mo_ta: true,
          the_manh: true
        }
      }
    }
  });

  const list = specialists.map(s => ({
    ho_ten: s.ho_ten,
    vai_tro: s.vai_tro_id === 4 ? 'Chuyên viên tư vấn' : 'Kỹ thuật viên Phục hồi chức năng',
    kinh_nghiem: `${s.ho_so_chuyen_gia?.so_nam_kinh_nghiem || 3}+ năm lâm sàng`,
    bang_cap: s.ho_so_chuyen_gia?.bang_cap_chung_chi || 'Cử nhân Vật lý trị liệu & Phục hồi chức năng',
    the_manh: s.ho_so_chuyen_gia?.the_manh || ['Cơ xương khớp văn phòng', 'Cột sống & Đĩa đệm', 'Giải cơ sâu'],
    mo_ta: s.ho_so_chuyen_gia?.mo_ta || 'Tận tâm, chuyên môn cao trong lượng giá và trị liệu phục hồi 1:1.'
  }));

  if (!kw) return { danh_sach_chuyen_gia: list };
  const filtered = list.filter(item =>
    item.ho_ten.toLowerCase().includes(kw) ||
    item.the_manh.some(tm => tm.toLowerCase().includes(kw)) ||
    item.vai_tro.toLowerCase().includes(kw) ||
    item.mo_ta.toLowerCase().includes(kw)
  );
  return { danh_sach_chuyen_gia: filtered.length > 0 ? filtered : list };
}

export async function toolTraCuuGoiDichVu(args: any): Promise<object> {
  const kw = typeof args?.tu_khoa === 'string' ? args.tu_khoa.toLowerCase().trim() : '';
  const packages = await prisma.goi_dich_vu.findMany({
    where: { trang_thai: 'hoat_dong' },
    select: {
      id: true,
      ten_goi: true,
      loai_goi: true,
      don_gia: true,
      tong_so_buoi: true,
      thoi_luong_phut: true,
      muc_tieu: true,
      quy_trinh: true
    },
    orderBy: { don_gia: 'asc' }
  });

  const mapped = packages.map(p => ({
    id: p.id,
    ten_goi: p.ten_goi,
    loai_hinh: p.loai_goi === 'KHAM' ? 'Lượng giá ban đầu' : p.loai_goi === 'LE' ? 'Dịch vụ lẻ 1 buổi' : `Liệu trình ${p.tong_so_buoi} buổi`,
    don_gia: `${Number(p.don_gia).toLocaleString('vi-VN')} VNĐ`,
    don_gia_so: Number(p.don_gia),
    thoi_luong: `${p.thoi_luong_phut || 60} phút/buổi`,
    tong_so_buoi: p.tong_so_buoi,
    muc_tieu: p.muc_tieu,
    quy_trinh: p.quy_trinh
  }));

  if (!kw) return { danh_sach_goi: mapped };
  const filtered = mapped.filter(p =>
    p.ten_goi.toLowerCase().includes(kw) ||
    (p.muc_tieu && p.muc_tieu.toLowerCase().includes(kw)) ||
    (p.quy_trinh && p.quy_trinh.toLowerCase().includes(kw))
  );
  return { danh_sach_goi: filtered.length > 0 ? filtered : mapped.slice(0, 5) };
}

export async function toolTraCuuChinhSachPhongKham(args: any): Promise<object> {
  const policies: Record<string, string> = {
    dat_lich: 'OfficeCare phục vụ theo mô hình BUỔI (Sáng: 07:30 - 12:00, Chiều: 12:00 - 20:00). Khách hàng bắt buộc đăng nhập tài khoản để gắn đúng hồ sơ y tế chính chủ. Mỗi khách hàng được giữ tối đa 3 lịch hẹn đang hoạt động đồng thời. Lưu ý: Đặt lịch buổi tiếp theo của gói liệu trình đang sử dụng phải được thực hiện trực tiếp trong mục Hồ sơ điều trị.',
    huy_doi_lich: 'Lịch chưa thanh toán: Được tự hủy online miễn phí trong vòng 60 phút sau khi đặt lịch. Lịch đã thanh toán: Được tự dời/đổi lịch online trước mốc 50% thời gian của buổi hẹn diễn ra (trước 09:45 cho buổi sáng, trước 15:45 cho buổi chiều). Sau các mốc này, quý khách vui lòng liên hệ hotline lễ tân.',
    hoan_tien: 'Chính sách hoàn tiền liệu trình: Khách hàng được quyền yêu cầu hoàn tiền trong vòng 7 ngày kể từ ngày mua gói. Số tiền hoàn lại = (Tổng tiền gói đã thanh toán) - (Số buổi đã dùng tính theo giá dịch vụ lẻ niêm yết) - (10% phí quản lý hành chính).',
    tra_gop: 'Chính sách thanh toán linh hoạt: Khách hàng có thể chọn thanh toán 100% trước để hưởng các mã ưu đãi voucher tốt nhất, hoặc chọn hình thức thanh toán từng buổi linh hoạt khi đến thực hiện trị liệu tại trung tâm.',
    no_show: 'Quy định vắng mặt (No-show): Nếu khách hàng vắng mặt không đến và không hủy quá 2 lần, hệ thống sẽ tự động khóa quyền đặt lịch trả sau tại quầy. Khách hàng bắt buộc phải thanh toán online 100% khi đặt các lịch hẹn tiếp theo.',
    quy_trinh_kham: 'Quy trình 4 bước chuẩn y khoa: 1. Đặt lịch online / Quầy -> 2. Lễ tân Check-in & Thanh toán linh hoạt -> 3. Lượng giá chức năng 1:1 với Chuyên viên PHCN (đo ROM khớp, MMT cơ lực, VAS Wong-Baker) -> 4. Kế hoạch trị liệu chuyên sâu kết hợp công nghệ cao với Kỹ thuật viên (KTV).'
  };
  const key = String(args?.chu_de || 'dat_lich');
  return {
    chinh_sach_tra_cuu: policies[key] || policies.dat_lich,
    cac_chu_de_co_san: Object.keys(policies)
  };
}

export async function executeAiTool(name: string, args: any, khachHangId: string | null): Promise<object> {
  try {
    if (name === 'kiem_tra_lich_kham_trong') return await toolKiemTraLichKhamTrong(args);
    if (name === 'xem_thong_tin_ca_nhan') return await toolXemThongTinCaNhan(khachHangId);
    if (name === 'tra_cuu_chuyen_gia_uy_tin') return await toolTraCuuChuyenGiaUyTin(args);
    if (name === 'tra_cuu_goi_dich_vu') return await toolTraCuuGoiDichVu(args);
    if (name === 'tra_cuu_chinh_sach_phong_kham') return await toolTraCuuChinhSachPhongKham(args);
    return { error: `Không hỗ trợ công cụ "${name}".` };
  } catch (error) {
    console.error(`Lỗi khi thực thi tool AI "${name}":`, error);
    return { error: 'Không thể truy vấn dữ liệu hệ thống lúc này.' };
  }
}

import prisma from '../config/prisma';

class NotificationService {
  /**
   * Tạo thông báo mới cho người dùng
   */
  async createNotification(nguoi_dung_id: string, tieu_de: string, noi_dung: string, loai: string = 'he_thong') {
    try {
      return await prisma.thong_bao.create({
        data: {
          nguoi_dung_id,
          tieu_de,
          noi_dung,
          loai,
          da_doc: false
        }
      });
    } catch (error) {
      console.error('Lỗi khi tạo thông báo:', error);
      // Fail silently to prevent interrupting main clinical flows
      return null;
    }
  }

  /**
   * Lấy danh sách 50 thông báo gần nhất của người dùng
   */
  async getNotifications(nguoi_dung_id: string) {
    return prisma.thong_bao.findMany({
      where: { nguoi_dung_id },
      orderBy: { thoi_gian_tao: 'desc' },
      take: 50
    });
  }

  /**
   * Đánh dấu 1 thông báo cụ thể là đã đọc
   */
  async markAsRead(id: string, nguoi_dung_id: string) {
    const notification = await prisma.thong_bao.findFirst({
      where: { id, nguoi_dung_id }
    });

    if (!notification) {
      throw new Error('Thông báo không tồn tại hoặc không thuộc quyền sở hữu của bạn.');
    }

    return prisma.thong_bao.update({
      where: { id },
      data: { da_doc: true }
    });
  }

  /**
   * Đánh dấu toàn bộ thông báo của người dùng là đã đọc
   */
  async markAllAsRead(nguoi_dung_id: string) {
    return prisma.thong_bao.updateMany({
      where: { nguoi_dung_id, da_doc: false },
      data: { da_doc: true }
    });
  }

  /**
   * Trigger thông báo tự động từ lịch hẹn sang người dùng (khách hàng)
   */
  async triggerAppointmentNotification(lich_dat_id: string, trang_thai: string, raw_appointment?: any) {
    try {
      let appointment = raw_appointment;
      
      // Nếu không truyền dữ liệu lịch hẹn, tiến hành fetch từ DB
      if (!appointment) {
        appointment = await prisma.lich_dat.findUnique({
          where: { id: lich_dat_id },
          include: {
            khach_hang: true,
            dich_vu_lich_dat_dich_vu_idTodich_vu: true,
            chuyen_gia_y_te: {
              include: {
                nguoi_dung: true
              }
            },
            phong: true
          }
        });
      }

      if (!appointment || !appointment.khach_hang) return;

      const nguoi_dung_id = appointment.khach_hang.nguoi_dung_id;
      const ma_lich_dat = appointment.ma_lich_dat;
      const ten_dich_vu = appointment.dich_vu_lich_dat_dich_vu_idTodich_vu?.ten_dich_vu || 'Khám Lâm sàng & Lượng giá';

      let tieu_de = 'Cập nhật trạng thái lịch khám';
      let noi_dung = '';

      switch (trang_thai) {
        case 'da_xac_nhan':
          const doctorName = appointment.chuyen_gia_y_te?.nguoi_dung?.ho_ten || 'Đang chờ phân công';
          const roomName = appointment.phong?.ten_phong || 'Đang chờ xếp phòng';
          noi_dung = `Lịch khám "${ten_dich_vu}" (Mã: ${ma_lich_dat}) của bạn đã được Lễ tân duyệt thành công. Phòng khám: ${roomName}. Bác sĩ/KTV phụ trách: ${doctorName}.`;
          break;
        case 'da_checkin':
          const activeRoom = appointment.phong?.ten_phong || 'Phòng khám lâm sàng';
          noi_dung = `Bạn đã hoàn tất thủ tục check-in cho lịch khám ${ma_lich_dat}. Vui lòng di chuyển đến ${activeRoom} để được hỗ trợ điều trị.`;
          break;
        case 'hoan_thanh':
          noi_dung = `Buổi khám lượng giá ${ma_lich_dat} của bạn đã hoàn thành. Chúc bạn một ngày tốt lành và nhiều sức khỏe!`;
          break;
        case 'da_huy':
          const lyDo = appointment.ly_do_huy || 'Hủy bởi hệ thống phòng khám';
          noi_dung = `Lịch hẹn khám ${ma_lich_dat} của bạn đã bị hủy bỏ. Lý do chi tiết: "${lyDo}".`;
          break;
        default:
          return;
      }

      await this.createNotification(nguoi_dung_id, tieu_de, noi_dung, 'lich_hen');
    } catch (error) {
      console.error('Lỗi khi trigger thông báo lịch hẹn:', error);
    }
  }
}

export default new NotificationService();

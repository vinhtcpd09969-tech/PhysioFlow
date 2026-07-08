import prisma from '../config/prisma';

class NotificationService {
  /**
   * Tạo thông báo mới cho người dùng hoặc khách hàng
   */
  async createNotification(id: string, tieu_de: string, noi_dung: string, loai: string = 'he_thong', isCustomer: boolean = false) {
    try {
      return await prisma.thong_bao.create({
        data: {
          nguoi_dung_id: isCustomer ? null : parseInt(id, 10),
          khach_hang_id: isCustomer ? id : null,
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
   * Lấy danh sách 50 thông báo gần nhất của người dùng hoặc khách hàng
   */
  async getNotifications(id: string, isCustomer: boolean = false) {
    return prisma.thong_bao.findMany({
      where: isCustomer ? { khach_hang_id: id } : { nguoi_dung_id: parseInt(id, 10) },
      orderBy: { thoi_gian_tao: 'desc' },
      take: 50
    });
  }

  /**
   * Đánh dấu 1 thông báo cụ thể là đã đọc
   */
  async markAsRead(id: string, userId: string, isCustomer: boolean = false) {
    const notification = await prisma.thong_bao.findFirst({
      where: isCustomer ? { id, khach_hang_id: userId } : { id, nguoi_dung_id: parseInt(userId, 10) }
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
  async markAllAsRead(userId: string, isCustomer: boolean = false) {
    return prisma.thong_bao.updateMany({
      where: isCustomer ? { khach_hang_id: userId, da_doc: false } : { nguoi_dung_id: parseInt(userId, 10), da_doc: false },
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
        appointment = await prisma.cuoc_hen.findUnique({
          where: { id: lich_dat_id },
          include: {
            khach_hang: true,
            dich_vu: true,
            nguoi_dung: true
          }
        });
      }

      if (!appointment || !appointment.khach_hang) return;

      const customerId = appointment.khach_hang.id;
      const ma_lich_dat = 'LH-' + appointment.id.substring(0, 6).toUpperCase();
      const ten_dich_vu = appointment.dich_vu?.ten_dich_vu || 'Khám Lâm sàng & Lượng giá';

      let tieu_de = 'Cập nhật trạng thái lịch khám';
      let noi_dung = '';

      switch (trang_thai) {
        case 'da_xac_nhan':
          const doctorName = appointment.nguoi_dung?.ho_ten || 'Đang chờ phân công';
          noi_dung = `Lịch khám "${ten_dich_vu}" (Mã: ${ma_lich_dat}) của bạn đã được Lễ tân duyệt thành công. Bác sĩ/KTV phụ trách: ${doctorName}.`;
          break;
        case 'da_checkin':
        case 'check_in':
          noi_dung = `Bạn đã hoàn tất thủ tục check-in cho lịch khám ${ma_lich_dat}. Vui lòng chuẩn bị để vào trị liệu.`;
          break;
        case 'hoan_thanh':
          noi_dung = `Buổi khám lượng giá ${ma_lich_dat} của bạn đã hoàn thành. Chúc bạn một ngày tốt lành và nhiều sức khỏe!`;
          break;
        case 'da_huy':
        case 'huy':
          noi_dung = `Lịch hẹn khám ${ma_lich_dat} của bạn đã bị hủy bỏ.`;
          break;
        default:
          return;
      }

      await this.createNotification(customerId, tieu_de, noi_dung, 'lich_hen', true);
    } catch (error) {
      console.error('Lỗi khi trigger thông báo lịch hẹn:', error);
    }
  }

  /**
   * Gửi thông báo cho toàn bộ người dùng theo vai trò
   */
  async notifyRole(vai_tro_id: number, tieu_de: string, noi_dung: string, loai: string = 'he_thong') {
    try {
      const users = await prisma.nguoi_dung.findMany({
        where: { vai_tro_id }
      });
      const promises = users.map(user => 
        this.createNotification(String(user.id), tieu_de, noi_dung, loai, false)
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Lỗi khi gửi thông báo theo vai trò:', error);
    }
  }
}

export default new NotificationService();

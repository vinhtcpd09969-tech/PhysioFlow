import prisma from '../config/prisma';
import { sendAppointmentReminder } from '../utils/mailer';

// Bộ nhớ đệm tạm thời trên RAM để tránh gửi tin nhắn nhắc nhở trùng lặp: "appointmentId_timestamp"
const sentReminderKeys = new Set<string>();

// Ghi nhớ ngày hiện tại để thực hiện dọn dẹp RAM tự động mỗi đêm
let lastCleanupDay = new Date().getDate();

const runReminderScan = async () => {
  // Giải phóng bộ nhớ RAM định kỳ hàng ngày khi bước sang ngày mới
  const currentDay = new Date().getDate();
  if (currentDay !== lastCleanupDay) {
    sentReminderKeys.clear();
    lastCleanupDay = currentDay;
    console.log('[Reminder Job] Đã dọn dẹp bộ nhớ RAM lưu lịch nhắc hẹn của ngày hôm qua.');
  }

  console.log('[Reminder Job] Bắt đầu quét lịch hẹn sắp diễn ra...');

  try {
    const now = new Date();
    // Quét các lịch hẹn diễn ra trong khoảng 4 tiếng tới
    const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    const incomingAppointments = await prisma.cuoc_hen.findMany({
      where: {
        trang_thai: 'da_xac_nhan', // Chỉ nhắc các lịch đã được xác nhận
        ngay_gio_bat_dau: {
          gte: now,
          lte: fourHoursLater,
        },
      },
      include: {
        khach_hang: true,
        goi_dich_vu: true,
        phong: true,
      },
    });

    console.log(`[Reminder Job] Tìm thấy ${incomingAppointments.length} lịch hẹn đã xác nhận trong khung 4 giờ tới.`);

    for (const apt of incomingAppointments) {
      const timeKey = new Date(apt.ngay_gio_bat_dau).getTime();
      const reminderKey = `${apt.id}_${timeKey}`;

      // Bỏ qua nếu lịch hẹn này đã được gửi nhắc nhở ở khung giờ này rồi
      if (sentReminderKeys.has(reminderKey)) {
        continue;
      }

      console.log(`[Reminder Job] Tiến hành gửi nhắc nhở cho: ${apt.khach_hang.ho_ten} (Lịch lúc: ${apt.ngay_gio_bat_dau})`);

      // Gửi email nếu khách hàng có điền email
      if (apt.khach_hang.email) {
        const dateString = new Date(apt.ngay_gio_bat_dau).toLocaleDateString('vi-VN');
        const timeString = new Date(apt.ngay_gio_bat_dau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

        await sendAppointmentReminder(
          apt.khach_hang.email,
          apt.khach_hang.ho_ten,
          {
            tenGoi: apt.goi_dich_vu?.ten_goi || 'Trị liệu phục hồi',
            thoiGian: `${timeString} - Ngày ${dateString}`,
            tenPhong: apt.phong?.ten_phong || 'Khu vực chung',
          }
        );
      }

      // Đánh dấu đã nhắc thành công vào bộ nhớ tạm RAM
      sentReminderKeys.add(reminderKey);
    }
  } catch (error) {
    console.error('[Reminder Job] Lỗi khi thực hiện quét nhắc lịch:', error);
  }
};

export const initReminderJob = () => {
  console.log('🤖 Chức năng nhắc lịch hẹn tự động (Native Interval Scheduler) đã khởi động!');
  
  // Chờ 3 giây sau khi server và database pool khởi tạo xong mới quét lần đầu
  setTimeout(runReminderScan, 3000);

  // Thiết lập quét định kỳ mỗi 15 phút (15 phút * 60 giây * 1000 ms)
  setInterval(runReminderScan, 15 * 60 * 1000);
};

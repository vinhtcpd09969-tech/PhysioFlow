import { Request, Response } from 'express';
import notificationService from '../services/notification.service';

export const getNotifications = async (req: Request, res: Response): Promise<any> => {
  try {
    const nguoi_dung_id = (req as any).user.id;
    const notifications = await notificationService.getNotifications(nguoi_dung_id);
    return res.json(notifications);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách thông báo:', error);
    return res.status(500).json({ message: 'Lỗi server khi tải thông báo.' });
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const nguoi_dung_id = (req as any).user.id;
    const notification = await notificationService.markAsRead(id, nguoi_dung_id);
    return res.json({ success: true, notification });
  } catch (error: any) {
    console.error('Lỗi khi đánh dấu thông báo đã đọc:', error);
    return res.status(500).json({ message: error.message || 'Lỗi server.' });
  }
};

export const markAllAsRead = async (req: Request, res: Response): Promise<any> => {
  try {
    const nguoi_dung_id = (req as any).user.id;
    await notificationService.markAllAsRead(nguoi_dung_id);
    return res.json({ success: true, message: 'Đã đánh dấu tất cả thông báo là đã đọc.' });
  } catch (error) {
    console.error('Lỗi khi đánh dấu đã đọc tất cả:', error);
    return res.status(500).json({ message: 'Lỗi server khi cập nhật thông báo.' });
  }
};

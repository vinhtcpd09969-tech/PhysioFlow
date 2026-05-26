import { Router } from 'express';
import { createPublicAppointment, getCustomerAppointments, cancelCustomerAppointment } from '../controllers/appointment.controller';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notification.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// API Đặt lịch cho khách vãng lai
router.post('/appointments/public', createPublicAppointment);

// API có bảo mật cho Khách hàng
router.get('/appointments', verifyToken, getCustomerAppointments);
router.patch('/appointments/:id/cancel', verifyToken, cancelCustomerAppointment);

// API Thông báo cho khách hàng
router.get('/notifications', verifyToken, getNotifications);
router.patch('/notifications/read-all', verifyToken, markAllAsRead);
router.patch('/notifications/:id/read', verifyToken, markAsRead);

export default router;

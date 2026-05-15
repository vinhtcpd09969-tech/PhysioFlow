import { Router } from 'express';
import { getAllAppointments, createAppointment, updateAppointmentStatus, createPublicAppointment } from '../controllers/appointment.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Route công khai cho khách vãng lai đặt lịch từ website
router.post('/public', createPublicAppointment);

// Yêu cầu đăng nhập cho tất cả các route lịch hẹn khác
router.use(verifyToken);

router.get('/', getAllAppointments);
router.post('/', createAppointment);
router.patch('/:id/status', updateAppointmentStatus);

export default router;

import { Router } from 'express';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware';
import * as technicianController from '../controllers/technician.controller';

const router = Router();

// Các route của KTV yêu cầu đăng nhập và có vai trò KTV (3) hoặc Admin (5) hoặc Manager (6)
router.use(verifyToken);
router.use(authorizeRoles(3, 5, 6));

router.get('/queue', technicianController.getQueue);
router.get('/appointments', technicianController.getAppointments);
router.get('/schedules', technicianController.getSchedules);
router.get('/appointments/:id', technicianController.getAppointmentDetail);
router.post('/appointments/assess', technicianController.saveTreatmentRecord);

export default router;

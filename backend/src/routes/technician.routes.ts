import { Router } from 'express';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware';
import { requireActiveShift } from '../middlewares/shiftGuard.middleware';
import * as technicianController from '../controllers/technician.controller';

const router = Router();

// Tất cả các route trong file này đều yêu cầu đăng nhập
router.use(verifyToken);

router.get('/queue', authorizeRoles(3, 5, 6), technicianController.getQueue);
router.get('/appointments', authorizeRoles(3, 5, 6), technicianController.getAppointments);
router.get('/schedules', authorizeRoles(3, 5, 6), technicianController.getSchedules);
router.get('/workstation-info', authorizeRoles(3, 4, 5, 6), technicianController.getWorkstationInfo);
router.get('/active-session', authorizeRoles(3, 5, 6), technicianController.getActiveSession);
router.get('/appointments/:id', authorizeRoles(3, 5, 6), technicianController.getAppointmentDetail);
router.post('/appointments/assess', authorizeRoles(3, 5, 6), requireActiveShift, technicianController.saveTreatmentRecord);
router.post('/appointments/draft', authorizeRoles(3, 5, 6), requireActiveShift, technicianController.saveTreatmentDraft);

export default router;

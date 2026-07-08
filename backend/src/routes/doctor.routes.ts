import { Router } from 'express';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware';
import * as doctorController from '../controllers/doctor.controller';

const router = Router();

// Tất cả các route của Bác sĩ đều yêu cầu đăng nhập và có vai trò Bác sĩ (4) hoặc Admin (5)
router.use(verifyToken);
router.use(authorizeRoles(3, 4, 5));

router.get('/queue', doctorController.getQueue);
router.get('/appointments', doctorController.getAppointments);
router.get('/services', doctorController.getServices);
router.get('/packages', doctorController.getPackages);
router.get('/schedules', doctorController.getSchedules);
router.get('/patients', doctorController.getPatients);
router.get('/appointments/:id', doctorController.getAppointmentDetail);
router.get('/patients/:patientId/profile', doctorController.getPatientProfile);
router.post('/appointments/assess', doctorController.saveAssessment);

export default router;

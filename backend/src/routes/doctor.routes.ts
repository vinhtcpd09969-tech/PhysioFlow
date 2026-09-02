import { Router } from 'express';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware';
import { requireActiveShift } from '../middlewares/shiftGuard.middleware';
import * as doctorController from '../controllers/doctor.controller';

const router = Router();

// Tất cả các route trong file này đều yêu cầu đăng nhập
router.use(verifyToken);

router.get('/queue', authorizeRoles(2, 3, 4, 5), doctorController.getQueue);
router.get('/appointments', authorizeRoles(2, 3, 4, 5), doctorController.getAppointments);
router.get('/packages', authorizeRoles(2, 3, 4, 5), doctorController.getPackages);
router.get('/schedules', authorizeRoles(2, 3, 4, 5), doctorController.getSchedules);
router.get('/patients', authorizeRoles(2, 3, 4, 5), doctorController.getPatients);
router.get('/active-session', authorizeRoles(2, 3, 4, 5), doctorController.getActiveSession);
router.post('/queue/:id/call-in', authorizeRoles(3, 4), requireActiveShift, doctorController.callInPatient);
router.post('/queue/:id/mark-absent', authorizeRoles(3, 4), requireActiveShift, doctorController.markPatientAbsent);
router.get('/appointments/:id', authorizeRoles(2, 3, 4, 5), doctorController.getAppointmentDetail);
router.get('/patients/:patientId/profile', authorizeRoles(1, 2, 3, 4, 5), doctorController.getPatientProfile);
router.post('/appointments/assess', authorizeRoles(2, 3, 4, 5), requireActiveShift, doctorController.saveAssessment);
router.post('/appointments/draft', authorizeRoles(2, 3, 4, 5), requireActiveShift, doctorController.saveAssessmentDraft);

export default router;

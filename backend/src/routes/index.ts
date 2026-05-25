import { Router } from 'express';
import authRoutes from './auth.routes';
import clientRoutes from './client.routes';
import adminRoutes from './admin.routes';
import receptionistRoutes from './receptionist.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/client', clientRoutes);
router.use('/admin', adminRoutes);
router.use('/receptionist', receptionistRoutes);

export default router;

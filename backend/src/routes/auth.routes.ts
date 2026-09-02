import { Router } from 'express';
import {
  login,
  register,
  verifyEmail,
  refreshToken,
  getMe,
  resendOTP,
  checkEmail,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  sendChangePasswordOTP,
  getMyShiftToday,
} from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  loginSchema,
  registerSchema,
  verifyEmailSchema,
  refreshTokenSchema,
  resendOTPSchema,
  checkEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/register', validate(registerSchema), register);
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);
router.post('/resend-otp', validate(resendOTPSchema), resendOTP);
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken);
router.post('/check-email', validate(checkEmailSchema), checkEmail);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.get('/me', verifyToken, getMe);
router.get('/my-shift-today', verifyToken, getMyShiftToday);
router.put('/profile', verifyToken, updateProfile);
router.post('/send-change-password-otp', verifyToken, sendChangePasswordOTP);
router.put('/change-password', verifyToken, changePassword);

export default router;

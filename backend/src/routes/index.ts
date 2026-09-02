import { Router } from 'express';
import authRoutes from './auth.routes';
import clientRoutes from './client.routes';
import adminRoutes from './admin.routes';
import receptionistRoutes from './receptionist.routes';
import doctorRoutes from './doctor.routes';
import technicianRoutes from './technician.routes';
import aiRoutes from './ai.routes';
import { payosWebhookHandler } from '../controllers/payos_webhook.controller';

import { getTransporter, dispatchEmail } from '../utils/mailer';

const router = Router();

router.use('/auth', authRoutes);
router.use('/client', clientRoutes);
router.use('/admin', adminRoutes);
router.use('/receptionist', receptionistRoutes);
router.use('/doctor', doctorRoutes);
router.use('/technician', technicianRoutes);
router.use('/ai', aiRoutes);

// Public payment webhook for PayOS
router.post('/payment/payos-webhook', payosWebhookHandler);

// Live Email / SMTP diagnostic endpoint
router.get('/test-smtp', async (req, res) => {
  const targetEmail = (req.query.to as string || '').trim();
  if (!targetEmail) {
    return res.status(400).json({
      status: 'error',
      message: 'Vui lòng cung cấp tham số email người nhận qua query param: ?to=email_cua_ban@example.com'
    });
  }
  const brevoApiKey = process.env.BREVO_API_KEY || '';
  const brevoSender = process.env.BREVO_SENDER_EMAIL || 'vinhtcpd09969@gmail.com';
  const emailUser = process.env.EMAIL_USER || '';
  const emailPass = process.env.EMAIL_PASS || '';
  const emailHost = process.env.EMAIL_HOST || '';
  const emailPort = process.env.EMAIL_PORT || '';

  const maskedBrevo = brevoApiKey ? `${brevoApiKey.slice(0, 10)}****${brevoApiKey.slice(-4)}` : 'NOT_SET';
  const maskedPass = emailPass ? `${emailPass.slice(0, 3)}****${emailPass.slice(-3)}` : 'NOT_SET';

  const diagnostics: any = {
    driver: brevoApiKey ? 'BREVO_REST_API' : 'NODEMAILER_SMTP',
    env: {
      BREVO_API_KEY: maskedBrevo,
      BREVO_SENDER_EMAIL: brevoSender,
      EMAIL_HOST: emailHost || 'NOT_SET',
      EMAIL_PORT: emailPort || 'NOT_SET',
      EMAIL_USER: emailUser || 'NOT_SET',
      EMAIL_PASS: maskedPass,
    },
    targetEmail
  };

  try {
    const sendStart = Date.now();
    const result = await dispatchEmail({
      toEmail: targetEmail,
      subject: `[OfficeCare Live Test] Kiểm tra gửi mail từ Render lúc ${new Date().toLocaleTimeString('vi-VN')}`,
      htmlContent: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #0D9488; border-radius: 8px;">
          <h2 style="color: #0D9488;">🎉 Gửi Email trên Render Live THÀNH CÔNG!</h2>
          <p>Phương thức gửi: <strong>${brevoApiKey ? 'Brevo REST API (HTTPS Port 443)' : 'Nodemailer Gmail SMTP'}</strong></p>
          <p>Email này được gửi trực tiếp tới: <strong>${targetEmail}</strong></p>
          <p>Thời gian gửi: <strong>${new Date().toLocaleString('vi-VN')}</strong></p>
          <hr/>
          <small>Hệ thống Quản lý Y tế Phục hồi chức năng OfficeCare</small>
        </div>
      `,
      senderName: 'OfficeCare Diagnostics'
    });

    diagnostics.sendMail = {
      success: true,
      messageId: result.messageId || result.id || 'OK',
      latencyMs: Date.now() - sendStart,
      response: result
    };

    res.json({
      status: 'success',
      message: 'Email dispatch succeeded via ' + (brevoApiKey ? 'Brevo REST API' : 'SMTP'),
      diagnostics
    });
  } catch (err: any) {
    diagnostics.error = {
      message: err.message,
      code: err.code,
      command: err.command,
      stack: err.stack
    };
    res.status(500).json({
      status: 'error',
      message: 'Email dispatch failed',
      diagnostics
    });
  }
});

export default router;

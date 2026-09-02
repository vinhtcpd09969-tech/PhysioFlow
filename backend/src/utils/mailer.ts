import 'dotenv/config';
import nodemailer from 'nodemailer';
import dns from 'dns';
import {
  PaymentReceiptEmailParams,
  BookingSuccessEmailParams,
  renderOtpEmail,
  renderForgotPasswordEmail,
  renderBookingConfirmationEmail,
  renderBookingSuccessEmail,
  renderAppointmentReminderEmail,
  renderAccountLockedEmail,
  renderPaymentReceiptEmail,
  renderAdminSecurityOtpEmail,
} from '../templates/emails/emailTemplates';

export { PaymentReceiptEmailParams, BookingSuccessEmailParams };

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (_) {}

const customIpv4Lookup = (hostname: string, _options: any, callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void) => {
  dns.lookup(hostname, { family: 4, all: false }, callback);
};

const checkSMTPConfigured = () => Boolean(
  process.env.EMAIL_USER && 
  process.env.EMAIL_USER !== 'your_email@gmail.com' && 
  process.env.EMAIL_PASS && 
  process.env.EMAIL_PASS !== 'your_app_password'
);

export const getTransporter = async (): Promise<nodemailer.Transporter> => {
  if (checkSMTPConfigured()) {
    const user = (process.env.EMAIL_USER || '').trim();
    const pass = (process.env.EMAIL_PASS || '').trim();
    const host = (process.env.EMAIL_HOST || 'smtp.gmail.com').trim();
    const port = parseInt(process.env.EMAIL_PORT || '465', 10);
    const isGmail = host.includes('gmail') || user.includes('@gmail.com');

    if (isGmail) {
      return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        family: 4,
        lookup: customIpv4Lookup,
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
      } as any);
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      family: 4,
      lookup: customIpv4Lookup,
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    } as any);
  }

  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

const getFromAddress = (senderName = 'OfficeCare Clinic', customEmail?: string) => {
  return checkSMTPConfigured()
    ? `"${senderName}" <${customEmail || process.env.EMAIL_USER}>`
    : `"${senderName}" <noreply@officecareclinic.com>`;
};

export interface SendEmailPayload {
  toEmail: string;
  subject: string;
  htmlContent: string;
  senderName?: string;
  customSenderEmail?: string;
}

/**
 * Gửi email qua Brevo REST API (HTTPS Port 443)
 * Tốc độ ~200ms, không bao giờ bị Render firewall chặn cổng socket
 */
const sendViaBrevo = async (payload: SendEmailPayload): Promise<any> => {
  const apiKey = (process.env.BREVO_API_KEY || '').trim();
  const senderEmail = (
    process.env.BREVO_SENDER_EMAIL || 
    process.env.EMAIL_USER || 
    'vinhtcpd09969@gmail.com'
  ).trim();
  const senderName = payload.senderName || process.env.BREVO_SENDER_NAME || 'OfficeCare Clinic';

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: payload.toEmail }],
      subject: payload.subject,
      htmlContent: payload.htmlContent,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Brevo API Response (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
};

/**
 * Điều phối gửi email thông minh (Dual-Mode):
 * 1. Ưu tiên Brevo REST API (cổng 443, tốc độ 200ms) khi có BREVO_API_KEY
 * 2. Tự động fallback sang Nodemailer SMTP nếu không có Brevo hoặc có lỗi
 */
export const dispatchEmail = async (payload: SendEmailPayload): Promise<any> => {
  const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();

  if (brevoApiKey && brevoApiKey.startsWith('xkeysib-')) {
    try {
      const result = await sendViaBrevo(payload);
      console.log('⚡ [BREVO REST API] Đã gửi email tới %s thành công! (MsgID: %s)', payload.toEmail, result.messageId || 'OK');
      return result;
    } catch (brevoErr) {
      console.warn('⚠️ Gửi qua Brevo API gặp sự cố, chuyển sang fallback Nodemailer:', brevoErr);
    }
  }

  // Fallback sang Nodemailer
  const transporter = await getTransporter();
  const fromAddr = getFromAddress(payload.senderName || 'OfficeCare Clinic', payload.customSenderEmail);
  const info = await transporter.sendMail({
    from: fromAddr,
    to: payload.toEmail,
    subject: payload.subject,
    html: payload.htmlContent,
  });

  console.log('📧 [SMTP Transport] Đã gửi email tới: %s', payload.toEmail);
  if (!checkSMTPConfigured() && !brevoApiKey) {
    console.log('📩 Link xem email test (Ethereal): %s', nodemailer.getTestMessageUrl(info));
  }
  return info;
};

export const sendOTP = async (toEmail: string, otpCode: string, userName: string) => {
  try {
    const htmlContent = renderOtpEmail(userName, otpCode);
    const result = await dispatchEmail({
      toEmail,
      subject: 'Mã xác thực OTP đăng ký tài khoản OfficeCare',
      htmlContent,
      senderName: 'OfficeCare',
    });

    console.log('----------------------------------------------------');
    console.log('🔑 MÃ OTP CỦA BẠN LÀ: %s', otpCode);
    console.log('✅ Đã gửi Email OTP tới: %s', toEmail);
    console.log('----------------------------------------------------');

    return result;
  } catch (error) {
    console.error('Lỗi khi gửi email OTP:', error);
    throw new Error('Không thể gửi email lúc này');
  }
};

export const sendForgotPasswordOTP = async (toEmail: string, otpCode: string, userName: string) => {
  try {
    const htmlContent = renderForgotPasswordEmail(userName, otpCode);
    const result = await dispatchEmail({
      toEmail,
      subject: 'Mã xác thực khôi phục mật khẩu OfficeCare',
      htmlContent,
      senderName: 'OfficeCare',
    });

    console.log('----------------------------------------------------');
    console.log('🔑 MÃ OTP QUÊN MẬT KHẨU CỦA BẠN LÀ: %s', otpCode);
    console.log('✅ Đã gửi Email OTP khôi phục tới: %s', toEmail);
    console.log('----------------------------------------------------');

    return result;
  } catch (error) {
    console.error('Lỗi khi gửi email OTP khôi phục mật khẩu:', error);
    throw new Error('Không thể gửi email lúc này');
  }
};

export const sendBookingConfirmationOTP = async (
  toEmail: string,
  userName: string,
  otpCode: string,
  dateStr: string,
  timeStr: string,
  serviceName: string
) => {
  try {
    const htmlContent = renderBookingConfirmationEmail({ userName, otpCode, dateStr, timeStr, serviceName });
    const result = await dispatchEmail({
      toEmail,
      subject: 'Mã OTP xác nhận lịch hẹn tại OfficeCare Clinic',
      htmlContent,
      senderName: 'OfficeCare Clinic',
    });

    console.log('----------------------------------------------------');
    console.log('🔑 MÃ OTP LỊCH HẸN CỦA BẠN LÀ: %s', otpCode);
    console.log('✅ Đã gửi Email OTP xác thực lịch hẹn tới: %s', toEmail);
    console.log('----------------------------------------------------');

    return result;
  } catch (error) {
    console.error('Lỗi khi gửi email OTP xác thực lịch hẹn:', error);
    throw new Error('Không thể gửi email lúc này');
  }
};

export const sendAppointmentReminder = async (
  toEmail: string,
  userName: string,
  appointmentDetails: {
    tenGoi: string;
    thoiGian: string;
    tenPhong: string;
  }
) => {
  try {
    const htmlContent = renderAppointmentReminderEmail(userName, appointmentDetails);
    const result = await dispatchEmail({
      toEmail,
      subject: `[Nhắc Lịch Hẹn] Lịch hẹn trị liệu tại OfficeCare`,
      htmlContent,
      senderName: 'OfficeCare Clinic',
    });

    console.log('----------------------------------------------------');
    console.log('✅ Đã gửi Email Nhắc hẹn tới: %s', toEmail);
    console.log('----------------------------------------------------');

    return result;
  } catch (error) {
    console.error('Lỗi khi gửi email nhắc hẹn:', error);
  }
};

export const sendAccountLockedNotification = async (toEmail: string, userName: string) => {
  try {
    const htmlContent = renderAccountLockedEmail(userName);
    const result = await dispatchEmail({
      toEmail,
      subject: `[Thông báo quan trọng] Tài khoản của bạn tại OfficeCare đã bị khóa`,
      htmlContent,
      senderName: 'OfficeCare Clinic',
    });

    console.log('----------------------------------------------------');
    console.log('🔒 Đã gửi Email Thông báo Khóa tài khoản tới: %s', toEmail);
    console.log('----------------------------------------------------');

    return result;
  } catch (error) {
    console.error('Lỗi khi gửi email thông báo khóa tài khoản:', error);
  }
};

export const sendPaymentReceiptEmail = async (params: PaymentReceiptEmailParams) => {
  try {
    const { toEmail, maHoaDon } = params;

    if (!toEmail || !toEmail.includes('@')) {
      console.log('⚠️ Không có địa chỉ email hợp lệ để gửi biên nhận thanh toán:', toEmail);
      return;
    }

    const htmlContent = renderPaymentReceiptEmail(params);
    const result = await dispatchEmail({
      toEmail,
      subject: `[OfficeCare] Biên lai xác nhận thanh toán thành công - Hóa đơn #${maHoaDon}`,
      htmlContent,
      senderName: 'OfficeCare Clinic',
    });

    console.log('----------------------------------------------------');
    console.log('✅ Đã gửi Email Biên lai Thanh toán tới: %s (Hóa đơn: %s)', toEmail, maHoaDon);
    console.log('----------------------------------------------------');

    return result;
  } catch (error) {
    console.error('Lỗi khi gửi email biên lai thanh toán:', error);
  }
};

export const sendAdminSecurityOTP = async (
  toEmail: string,
  otpCode: string,
  actionTitle: string,
  userName: string
) => {
  try {
    const htmlContent = renderAdminSecurityOtpEmail(userName, otpCode, actionTitle);
    const result = await dispatchEmail({
      toEmail,
      subject: `[OfficeCare Security] Mã OTP xác thực: ${actionTitle}`,
      htmlContent,
      senderName: 'OfficeCare Security',
      customSenderEmail: 'security@officecare.vn',
    });

    console.log('----------------------------------------------------');
    console.log('🛡️ Đã gửi OTP Bảo mật Admin tới: %s (Hành động: %s)', toEmail, actionTitle);
    console.log('----------------------------------------------------');

    return result;
  } catch (error) {
    console.error('Lỗi khi gửi email OTP bảo mật Admin:', error);
  }
};

export const sendBookingSuccessEmail = async (toEmail: string, params: BookingSuccessEmailParams) => {
  try {
    if (!toEmail || !toEmail.includes('@') || toEmail.endsWith('@officecare.placeholder')) {
      console.log('⚠️ Không có địa chỉ email hợp lệ để gửi thông báo đặt lịch:', toEmail);
      return;
    }

    const htmlContent = renderBookingSuccessEmail(params);
    const result = await dispatchEmail({
      toEmail,
      subject: `[OfficeCare] Xác nhận đặt lịch hẹn thành công - Mã #${params.maLichDat}`,
      htmlContent,
      senderName: 'OfficeCare Clinic',
    });

    console.log('----------------------------------------------------');
    console.log('✅ Đã gửi Email Xác nhận Đặt lịch tới: %s (Mã LH: #%s)', toEmail, params.maLichDat);
    console.log('----------------------------------------------------');

    return result;
  } catch (error) {
    console.error('Lỗi khi gửi email xác nhận đặt lịch hẹn:', error);
  }
};

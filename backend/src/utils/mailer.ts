import nodemailer from 'nodemailer';

// Khởi tạo Transporter.
// Ở môi trường Dev, chúng ta dùng Ethereal Email để tạo test account on-the-fly nếu chưa cấu hình Gmail.
export const sendOTP = async (toEmail: string, otpCode: string, userName: string) => {
  try {
    let transporter;
    const isSMTPConfigured = process.env.EMAIL_USER && 
                              process.env.EMAIL_USER !== 'your_email@gmail.com' && 
                              process.env.EMAIL_PASS && 
                              process.env.EMAIL_PASS !== 'your_app_password';

    if (isSMTPConfigured) {
      // Dùng SMTP thật từ tệp .env (Gmail SMTP)
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    } else {
      // Fallback: Tạo một tài khoản test giả lập Ethereal
      const testAccount = await nodemailer.createTestAccount();

      // Tạo transporter kết nối tới Ethereal
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    // Thiết kế Email Giao diện Sạch sẽ, Hiện đại, Chống Spam và Tương thích 100% Mobile (Kể cả chế độ Dark Mode của Gmail)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Xác thực tài khoản OffiCare</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 30px 10px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="560" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03); border: 1px solid #E2E8F0;">
                
                <!-- Header Banner: Màu tối sang trọng giúp bảo vệ độ tương phản chữ trong mọi chế độ Dark Mode/Light Mode -->
                <tr>
                  <td align="center" style="background-color: #0F172A; padding: 35px 30px; text-align: center;">
                    <div style="font-size: 28px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; line-height: 1.2; font-family: sans-serif;">
                      <span style="color: #14B8A6;">O</span>ffiCare
                    </div>
                    <div style="font-size: 11px; color: #94A3B8; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px; font-family: sans-serif;">
                      Trung Tâm Trị Liệu & Chăm Sóc Sức Khỏe
                    </div>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 35px 35px 25px 35px;">
                    <p style="margin: 0 0 16px 0; color: #0F172A; font-size: 17px; font-weight: 700; font-family: sans-serif;">Chào ${userName},</p>
                    <p style="margin: 0 0 24px 0; color: #334155; font-size: 14px; line-height: 1.7; font-family: sans-serif;">Cảm ơn bạn đã lựa chọn OffiCare. Để hoàn tất việc đăng ký tài khoản thành viên mới, bạn vui lòng sử dụng mã xác thực OTP dưới đây:</p>
                    
                    <!-- OTP Box -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F0FDFA; border-radius: 12px; border: 1px solid #CCFBF1; margin-bottom: 24px;">
                      <tr>
                        <td align="center" style="padding: 20px 16px;">
                          <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #0D9488;">${otpCode}</div>
                          <div style="font-size: 11px; color: #0D9488; font-weight: 600; margin-top: 6px; text-transform: uppercase; letter-spacing: 1px; font-family: sans-serif;">Mã xác thực OTP (Hết hạn trong 10 phút)</div>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 0 0 24px 0; color: #64748B; font-size: 12px; line-height: 1.6; font-style: italic; font-family: sans-serif;">⚠️ Lưu ý bảo mật: Hãy giữ bí mật mã số này và không chia sẻ cho bất kỳ ai khác.</p>
                    
                    <hr style="border: none; border-top: 1px solid #F1F5F9; margin: 25px 0;" />
                    
                    <!-- Clinic Info -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="color: #64748B; font-size: 12px; line-height: 1.7; font-family: sans-serif;">
                      <tr>
                        <td>
                          <strong>Hỗ trợ khách hàng OffiCare:</strong><br>
                          📞 Hotline: 1900 6868 (Phím 1)<br>
                          ✉️ Email support: support@officareclinic.com
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td align="center" style="background-color: #F8FAFC; padding: 20px 35px; border-top: 1px solid #E2E8F0;">
                    <p style="margin: 0; color: #94A3B8; font-size: 11px; line-height: 1.5; font-family: sans-serif;">Bản quyền thuộc về © 2026 OffiCare Clinic. Bảo lưu mọi quyền.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const fromAddress = isSMTPConfigured 
      ? `"OffiCare Clinic" <${process.env.EMAIL_USER}>` 
      : '"OffiCare Clinic" <noreply@officareclinic.com>';

    const info = await transporter.sendMail({
      from: fromAddress, 
      to: toEmail, 
      subject: 'Mã xác thực tài khoản OffiCare của bạn', 
      html: htmlContent, 
    });

    console.log('----------------------------------------------------');
    console.log('🔑 MÃ OTP CỦA BẠN LÀ: %s', otpCode);
    console.log('✅ Đã gửi Email OTP tới: %s', toEmail);
    if (!isSMTPConfigured) {
      console.log('📩 Bấm vào Link này để XEM EMAIL (Ethereal): %s', nodemailer.getTestMessageUrl(info));
    } else {
      console.log('📧 Đã gửi qua cổng SMTP Gmail thật!');
    }
    console.log('----------------------------------------------------');

    return info;
  } catch (error) {
    console.error('Lỗi khi gửi email OTP:', error);
    throw new Error('Không thể gửi email lúc này');
  }
};

export const sendForgotPasswordOTP = async (toEmail: string, otpCode: string, userName: string) => {
  try {
    let transporter;
    const isSMTPConfigured = process.env.EMAIL_USER && 
                              process.env.EMAIL_USER !== 'your_email@gmail.com' && 
                              process.env.EMAIL_PASS && 
                              process.env.EMAIL_PASS !== 'your_app_password';

    if (isSMTPConfigured) {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_PORT === '465',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    } else {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Khôi phục mật khẩu OffiCare</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 30px 10px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="560" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03); border: 1px solid #E2E8F0;">
                
                <!-- Header Banner -->
                <tr>
                  <td align="center" style="background-color: #0F172A; padding: 35px 30px; text-align: center;">
                    <div style="font-size: 28px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; line-height: 1.2; font-family: sans-serif;">
                      <span style="color: #14B8A6;">O</span>ffiCare
                    </div>
                    <div style="font-size: 11px; color: #94A3B8; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px; font-family: sans-serif;">
                      Trung Tâm Trị Liệu & Chăm Sóc Sức Khỏe
                    </div>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 35px 35px 25px 35px;">
                    <p style="margin: 0 0 16px 0; color: #0F172A; font-size: 17px; font-weight: 700; font-family: sans-serif;">Chào ${userName},</p>
                    <p style="margin: 0 0 24px 0; color: #334155; font-size: 14px; line-height: 1.7; font-family: sans-serif;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản OffiCare của bạn. Vui lòng sử dụng mã xác thực OTP dưới đây để hoàn tất việc đặt lại mật khẩu:</p>
                    
                    <!-- OTP Box -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F0FDFA; border-radius: 12px; border: 1px solid #CCFBF1; margin-bottom: 24px;">
                      <tr>
                        <td align="center" style="padding: 20px 16px;">
                          <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #0D9488;">${otpCode}</div>
                          <div style="font-size: 11px; color: #0D9488; font-weight: 600; margin-top: 6px; text-transform: uppercase; letter-spacing: 1px; font-family: sans-serif;">Mã OTP khôi phục mật khẩu (Hết hạn trong 10 phút)</div>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 0 0 24px 0; color: #64748B; font-size: 12px; line-height: 1.6; font-style: italic; font-family: sans-serif;">⚠️ Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ hỗ trợ để bảo vệ tài khoản.</p>
                    
                    <hr style="border: none; border-top: 1px solid #F1F5F9; margin: 25px 0;" />
                    
                    <!-- Clinic Info -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="color: #64748B; font-size: 12px; line-height: 1.7; font-family: sans-serif;">
                      <tr>
                        <td>
                          <strong>Hỗ trợ khách hàng OffiCare:</strong><br>
                          📞 Hotline: 1900 6868 (Phím 1)<br>
                          ✉️ Email support: support@officareclinic.com
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td align="center" style="background-color: #F8FAFC; padding: 20px 35px; border-top: 1px solid #E2E8F0;">
                    <p style="margin: 0; color: #94A3B8; font-size: 11px; line-height: 1.5; font-family: sans-serif;">Bản quyền thuộc về © 2026 OffiCare Clinic. Bảo lưu mọi quyền.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const fromAddress = isSMTPConfigured 
      ? `"OffiCare Clinic" <${process.env.EMAIL_USER}>` 
      : '"OffiCare Clinic" <noreply@officareclinic.com>';

    const info = await transporter.sendMail({
      from: fromAddress, 
      to: toEmail, 
      subject: 'Mã khôi phục mật khẩu tài khoản OffiCare', 
      html: htmlContent, 
    });

    console.log('----------------------------------------------------');
    console.log('🔑 MÃ OTP KHÔI PHỤC MẬT KHẨU LÀ: %s', otpCode);
    console.log('✅ Đã gửi Email OTP tới: %s', toEmail);
    if (!isSMTPConfigured) {
      console.log('📩 Bấm vào Link này để XEM EMAIL (Ethereal): %s', nodemailer.getTestMessageUrl(info));
    }
    console.log('----------------------------------------------------');

    return info;
  } catch (error) {
    console.error('Lỗi khi gửi email OTP khôi phục mật khẩu:', error);
    throw new Error('Không thể gửi email lúc này');
  }
};


export const sendBookingConfirmationEmail = async (
  toEmail: string,
  userName: string,
  bookingId: string,
  dateStr: string,
  timeStr: string,
  serviceName: string
) => {
  try {
    let transporter;
    const isSMTPConfigured = process.env.EMAIL_USER && 
                              process.env.EMAIL_USER !== 'your_email@gmail.com' && 
                              process.env.EMAIL_PASS && 
                              process.env.EMAIL_PASS !== 'your_app_password';

    if (isSMTPConfigured) {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_PORT === '465',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    } else {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const confirmUrl = `http://localhost:5001/api/client/appointments/public/confirm-email/${bookingId}`;
    
    // Giao diện Thư Xác nhận lịch hẹn Premium thích ứng tốt Mobile
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Xác nhận lịch hẹn khám tại OffiCare</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 30px 10px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="560" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03); border: 1px solid #E2E8F0;">
                
                <!-- Header Banner: Màu tối sang trọng giúp bảo vệ độ tương phản chữ trong mọi chế độ Dark Mode/Light Mode -->
                <tr>
                  <td align="center" style="background-color: #0F172A; padding: 35px 30px; text-align: center;">
                    <div style="font-size: 28px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; line-height: 1.2; font-family: sans-serif;">
                      <span style="color: #14B8A6;">O</span>ffiCare
                    </div>
                    <div style="font-size: 11px; color: #94A3B8; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px; font-family: sans-serif;">
                      Trung Tâm Trị Liệu & Chăm Sóc Sức Khỏe
                    </div>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 35px 35px 25px 35px;">
                    <p style="margin: 0 0 16px 0; color: #0F172A; font-size: 17px; font-weight: 700; font-family: sans-serif;">Chào ${userName},</p>
                    <p style="margin: 0 0 24px 0; color: #334155; font-size: 14px; line-height: 1.7; font-family: sans-serif;">Cảm ơn bạn đã lựa chọn OffiCare. Dưới đây là tóm tắt thông tin lịch hẹn đăng ký của bạn:</p>
                    
                    <!-- Details Card -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; margin-bottom: 24px; font-size: 13.5px; color: #334155; font-family: sans-serif;">
                      <tr>
                        <td style="padding: 16px;">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="line-height: 1.8;">
                            <tr>
                              <td width="35%" style="color: #64748B; font-weight: 600; font-family: sans-serif;">Dịch vụ trị liệu:</td>
                              <td style="color: #0F172A; font-weight: 700; font-family: sans-serif;">${serviceName}</td>
                            </tr>
                            <tr>
                              <td style="color: #64748B; font-weight: 600; font-family: sans-serif;">Thời gian:</td>
                              <td style="color: #0F172A; font-weight: 600; font-family: sans-serif;">${timeStr}</td>
                            </tr>
                            <tr>
                              <td style="color: #64748B; font-weight: 600; font-family: sans-serif;">Ngày hẹn:</td>
                              <td style="color: #0F172A; font-weight: 600; font-family: sans-serif;">${dateStr}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Action Button -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                      <tr>
                        <td align="center">
                          <a href="${confirmUrl}" style="background-color: #0D9488; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 8px; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px; font-family: sans-serif;">
                            Xác Nhận Giữ Chỗ Ngay
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 0 0 24px 0; color: #64748B; font-size: 12px; line-height: 1.6; font-family: sans-serif;">💡 <em>Vui lòng nhấn vào nút trên để hoàn tất việc xác thực thông tin lịch hẹn và giữ chỗ thành công trên hệ thống.</em></p>
                    
                    <hr style="border: none; border-top: 1px solid #F1F5F9; margin: 25px 0;" />
                    
                    <!-- Contact Info -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="color: #64748B; font-size: 12px; line-height: 1.7; font-family: sans-serif;">
                      <tr>
                        <td>
                          <strong>Bộ phận lễ tân OffiCare Clinic:</strong><br>
                          📞 Hotline đặt lịch: 1900 6868 (Phím 2)<br>
                          ✉️ Email tư vấn: reception@officareclinic.com
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td align="center" style="background-color: #F8FAFC; padding: 20px 35px; border-top: 1px solid #E2E8F0;">
                    <p style="margin: 0; color: #94A3B8; font-size: 11px; line-height: 1.5; font-family: sans-serif;">Bản quyền thuộc về © 2026 OffiCare Clinic. Bảo lưu mọi quyền.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const fromAddress = isSMTPConfigured 
      ? `"OffiCare Clinic" <${process.env.EMAIL_USER}>` 
      : '"OffiCare Clinic" <noreply@officareclinic.com>';

    const info = await transporter.sendMail({
      from: fromAddress, 
      to: toEmail, 
      subject: 'Xác nhận giữ chỗ lịch hẹn tại OffiCare Clinic', 
      html: htmlContent, 
    });

    console.log('----------------------------------------------------');
    console.log('✅ Đã gửi Email Xác nhận lịch hẹn tới: %s', toEmail);
    console.log('🔗 Link xác nhận: %s', confirmUrl);
    if (!isSMTPConfigured) {
      console.log('📩 Bấm vào Link này để XEM EMAIL (Ethereal): %s', nodemailer.getTestMessageUrl(info));
    }
    console.log('----------------------------------------------------');

    return info;
  } catch (error) {
    console.error('Lỗi khi gửi email xác nhận lịch đặt:', error);
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
    let transporter;
    const isSMTPConfigured = process.env.EMAIL_USER && 
                              process.env.EMAIL_USER !== 'your_email@gmail.com' && 
                              process.env.EMAIL_PASS && 
                              process.env.EMAIL_PASS !== 'your_app_password';

    if (isSMTPConfigured) {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_PORT === '465',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    } else {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mã xác thực lịch hẹn OffiCare</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 30px 10px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="560" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03); border: 1px solid #E2E8F0;">
                
                <tr style="background-color: #0F172A; text-align: center;">
                  <td align="center" style="padding: 35px 30px;">
                    <div style="font-size: 28px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; line-height: 1.2;">
                      <span style="color: #14B8A6;">O</span>ffiCare
                    </div>
                    <div style="font-size: 11px; color: #94A3B8; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px;">
                      Trung Tâm Trị Liệu & Chăm Sóc Sức Khỏe
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 35px 35px 25px 35px;">
                    <p style="margin: 0 0 16px 0; color: #0F172A; font-size: 17px; font-weight: 700;">Chào ${userName},</p>
                    <p style="margin: 0 0 24px 0; color: #334155; font-size: 14px; line-height: 1.7;">Cảm ơn bạn đã đặt lịch hẹn tại OffiCare. Vui lòng sử dụng mã OTP dưới đây để hoàn tất việc xác thực lịch hẹn của bạn:</p>
                    
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F0FDFA; border-radius: 12px; border: 1px solid #CCFBF1; margin-bottom: 24px;">
                      <tr>
                        <td align="center" style="padding: 20px 16px;">
                          <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #0D9488;">${otpCode}</div>
                          <div style="font-size: 11px; color: #0D9488; font-weight: 600; margin-top: 6px; text-transform: uppercase; letter-spacing: 1px;">Mã OTP xác thực lịch hẹn (Hết hạn trong 10 phút)</div>
                        </td>
                      </tr>
                    </table>

                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; margin-bottom: 24px; font-size: 13.5px; color: #334155;">
                      <tr>
                        <td style="padding: 16px;">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="line-height: 1.8;">
                            <tr>
                              <td width="35%" style="color: #64748B; font-weight: 600;">Dịch vụ:</td>
                              <td style="color: #0F172A; font-weight: 700;">${serviceName}</td>
                            </tr>
                            <tr>
                              <td style="color: #64748B; font-weight: 600;">Thời gian:</td>
                              <td style="color: #0F172A; font-weight: 600;">${timeStr}</td>
                            </tr>
                            <tr>
                              <td style="color: #64748B; font-weight: 600;">Ngày hẹn:</td>
                              <td style="color: #0F172A; font-weight: 600;">${dateStr}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 0 0 24px 0; color: #64748B; font-size: 12px; line-height: 1.6;">⚠️ Lưu ý bảo mật: Hãy giữ bí mật mã số này và không chia sẻ cho bất kỳ ai khác.</p>
                    
                    <hr style="border: none; border-top: 1px solid #F1F5F9; margin: 25px 0;" />
                    
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="color: #64748B; font-size: 12px; line-height: 1.7;">
                      <tr>
                        <td>
                          <strong>Bộ phận lễ tân OffiCare Clinic:</strong><br>
                          📞 Hotline đặt lịch: 1900 6868 (Phím 2)<br>
                          ✉️ Email tư vấn: reception@officareclinic.com
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="background-color: #F8FAFC; padding: 20px 35px; border-top: 1px solid #E2E8F0;">
                    <p style="margin: 0; color: #94A3B8; font-size: 11px; line-height: 1.5;">Bản quyền thuộc về © 2026 OffiCare Clinic. Bảo lưu mọi quyền.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const fromAddress = isSMTPConfigured 
      ? `"OffiCare Clinic" <${process.env.EMAIL_USER}>` 
      : '"OffiCare Clinic" <noreply@officareclinic.com>';

    const info = await transporter.sendMail({
      from: fromAddress, 
      to: toEmail, 
      subject: 'Mã OTP xác nhận lịch hẹn tại OffiCare Clinic', 
      html: htmlContent, 
    });

    console.log('----------------------------------------------------');
    console.log('🔑 MÃ OTP LỊCH HẸN CỦA BẠN LÀ: %s', otpCode);
    console.log('✅ Đã gửi Email OTP xác thực lịch hẹn tới: %s', toEmail);
    if (!isSMTPConfigured) {
      console.log('📩 Bấm vào Link này để XEM EMAIL (Ethereal): %s', nodemailer.getTestMessageUrl(info));
    }
    console.log('----------------------------------------------------');

    return info;
  } catch (error) {
    console.error('Lỗi khi gửi email OTP xác thực lịch hẹn:', error);
    throw new Error('Không thể gửi email lúc này');
  }
};

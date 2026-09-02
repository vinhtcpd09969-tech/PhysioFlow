export interface PaymentReceiptEmailParams {
  toEmail: string;
  userName: string;
  maHoaDon: string;
  tenDichVu: string;
  soTienThanhToan: number;
  tongTienHoaDon: number;
  daThanhToan: number;
  conLai: number;
  phuongThuc: string;
  hinhThucGoi?: string;
  soBuoi?: number;
  ngayThanhToan?: Date | string;
}

export const renderOtpEmail = (userName: string, otpCode: string): string => {
  return `
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
              <tr>
                <td style="padding: 35px 35px 25px 35px;">
                  <p style="margin: 0 0 16px 0; color: #0F172A; font-size: 17px; font-weight: 700; font-family: sans-serif;">Chào ${userName},</p>
                  <p style="margin: 0 0 24px 0; color: #334155; font-size: 14px; line-height: 1.7; font-family: sans-serif;">Cảm ơn bạn đã lựa chọn OffiCare. Để hoàn tất việc đăng ký tài khoản thành viên mới, bạn vui lòng sử dụng mã xác thực OTP dưới đây:</p>
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
};

export const renderForgotPasswordEmail = (userName: string, otpCode: string): string => {
  return `
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
              <tr>
                <td style="padding: 35px 35px 25px 35px;">
                  <p style="margin: 0 0 16px 0; color: #0F172A; font-size: 17px; font-weight: 700; font-family: sans-serif;">Chào ${userName},</p>
                  <p style="margin: 0 0 24px 0; color: #334155; font-size: 14px; line-height: 1.7; font-family: sans-serif;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản OffiCare của bạn. Vui lòng sử dụng mã xác thực OTP dưới đây để hoàn tất việc đặt lại mật khẩu:</p>
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
};

export const renderBookingConfirmationEmail = (params: {
  userName: string;
  otpCode: string;
  dateStr: string;
  timeStr: string;
  serviceName: string;
}): string => {
  const { userName, otpCode, dateStr, timeStr, serviceName } = params;
  return `
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
};

export const renderAppointmentReminderEmail = (
  userName: string,
  appointmentDetails: { tenGoi: string; thoiGian: string; tenPhong: string }
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nhắc lịch hẹn OfficeCare</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 30px 10px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="560" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03); border: 1px solid #E2E8F0;">
              <tr>
                <td align="center" style="background-color: #0F172A; padding: 35px 30px; text-align: center;">
                  <div style="font-size: 28px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; line-height: 1.2; font-family: sans-serif;">
                    <span style="color: #14B8A6;">O</span>fficeCare
                  </div>
                  <div style="font-size: 11px; color: #94A3B8; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px; font-family: sans-serif;">
                    Nhắc Lịch Hẹn Trị Liệu Chủ Động
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 35px 35px 25px 35px;">
                  <p style="margin: 0 0 16px 0; color: #0F172A; font-size: 17px; font-weight: 700; font-family: sans-serif;">Chào ${userName},</p>
                  <p style="margin: 0 0 24px 0; color: #334155; font-size: 14px; line-height: 1.7; font-family: sans-serif;">OfficeCare trân trọng nhắc bạn về lịch hẹn điều trị sắp diễn ra của mình:</p>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F0FDFA; border-radius: 12px; border: 1px solid #CCFBF1; margin-bottom: 24px; font-size: 14px; color: #0F172A; font-family: sans-serif;">
                    <tr>
                      <td style="padding: 20px 16px;">
                        <div style="margin-bottom: 10px;">🔹 <strong>Dịch vụ:</strong> ${appointmentDetails.tenGoi}</div>
                        <div style="margin-bottom: 10px;">🕒 <strong>Thời gian:</strong> ${appointmentDetails.thoiGian}</div>
                        <div>🏢 <strong>Địa điểm:</strong> Phòng ${appointmentDetails.tenPhong} - Trung tâm OfficeCare</div>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 0 0 24px 0; color: #0D9488; font-size: 13px; font-weight: bold; font-style: italic; font-family: sans-serif;">💡 Lời khuyên: Bạn vui lòng đến sớm hơn lịch hẹn khoảng 5 - 10 phút để đội ngũ chuyên gia chuẩn bị đón tiếp và hỗ trợ trị liệu tốt nhất.</p>
                  <hr style="border: none; border-top: 1px solid #F1F5F9; margin: 25px 0;" />
                  <p style="font-size: 12px; color: #64748B; text-align: center; font-family: sans-serif;">Đây là email nhắc lịch hẹn tự động được gửi từ hệ thống OfficeCare.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export const renderAccountLockedEmail = (userName: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thông báo khóa tài khoản OfficeCare</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 30px 10px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="560" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03); border: 1px solid #E2E8F0;">
              <tr>
                <td align="center" style="background-color: #EF4444; padding: 35px 30px; text-align: center;">
                  <div style="font-size: 28px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; line-height: 1.2; font-family: sans-serif;">
                    OfficeCare
                  </div>
                  <div style="font-size: 11px; color: #FEE2E2; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px; font-family: sans-serif;">
                    Thông Báo Khóa Tài Khoản
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 35px 35px 25px 35px;">
                  <p style="margin: 0 0 16px 0; color: #0F172A; font-size: 17px; font-weight: 700; font-family: sans-serif;">Chào ${userName},</p>
                  <p style="margin: 0 0 20px 0; color: #334155; font-size: 14px; line-height: 1.7; font-family: sans-serif;">Chúng tôi rất tiếc phải thông báo rằng tài khoản khách hàng của bạn tại OfficeCare đã bị <strong>khóa</strong>.</p>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FEF2F2; border-radius: 12px; border: 1px solid #FEE2E2; margin-bottom: 24px; font-size: 14px; color: #991B1B; font-family: sans-serif;">
                    <tr>
                      <td style="padding: 20px 16px; line-height: 1.6;">
                        ⚠️ <strong>Lý do:</strong> Bạn đã vi phạm chính sách của trung tâm <strong>OfficeCare</strong> nên đã bị khóa tài khoản.<br><br>
                        📞 Mọi thắc mắc vui lòng liên hệ hotline hỗ trợ hoặc Fanpage của trung tâm để được giải đáp và hỗ trợ mở lại nếu có nhầm lẫn.
                      </td>
                    </tr>
                  </table>
                  <div style="margin-bottom: 24px; text-align: center;">
                    <a href="https://www.facebook.com/profile.php?id=61591064963268" target="_blank" style="display: inline-block; background-color: #1877F2; color: #FFFFFF; font-weight: bold; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-family: sans-serif; box-shadow: 0 2px 4px rgba(24, 119, 242, 0.2);">
                      Liên hệ qua Fanpage
                    </a>
                  </div>
                  <hr style="border: none; border-top: 1px solid #F1F5F9; margin: 25px 0;" />
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="color: #64748B; font-size: 12px; line-height: 1.7; font-family: sans-serif;">
                    <tr>
                      <td>
                        <strong>Hỗ trợ khách hàng OfficeCare:</strong><br>
                        📞 Hotline: 1900 6868 (Phím 1)<br>
                        ✉️ Email support: support@officareclinic.com
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="background-color: #F8FAFC; padding: 20px; border-top: 1px solid #F1F5F9; text-align: center; font-size: 11px; color: #94A3B8; font-family: sans-serif;">
                  © 2026 OfficeCare. Tất cả các quyền được bảo lưu.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export const renderPaymentReceiptEmail = (params: PaymentReceiptEmailParams): string => {
  const {
    userName,
    maHoaDon,
    tenDichVu,
    soTienThanhToan,
    tongTienHoaDon,
    daThanhToan,
    conLai,
    phuongThuc,
    hinhThucGoi,
    soBuoi,
    ngayThanhToan = new Date()
  } = params;

  const formatVND = (num: number) => num.toLocaleString('vi-VN') + 'đ';
  const dateFormatted = new Date(ngayThanhToan).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const methodLabel = phuongThuc === 'tien_mat' 
    ? 'Tiền mặt' 
    : phuongThuc === 'chuyen_khoan' 
      ? 'Chuyển khoản (Ngân hàng/QR)' 
      : phuongThuc === 'the' 
        ? 'Thẻ POS' 
        : (phuongThuc || 'Thanh toán trực tuyến').toUpperCase();

  const planLabel = hinhThucGoi 
    ? hinhThucGoi.replace(/_/g, ' ').toUpperCase() 
    : 'MỘT LẦN (100%)';

  const isPaidFull = conLai <= 0;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Biên lai xác nhận thanh toán OfficeCare</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F1F5F9; padding: 30px 10px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06); border: 1px solid #E2E8F0;">
              <tr>
                <td style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 36px 30px; text-align: center;">
                  <div style="font-size: 26px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; line-height: 1.2;">
                    <span style="color: #0D9488;">O</span>FFICE<span style="color: #0D9488;">CARE</span>
                  </div>
                  <div style="font-size: 11px; color: #94A3B8; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px;">
                    Trung Tâm Phục Hồi Chức Năng
                  </div>
                  <div style="display: inline-block; margin-top: 18px; background-color: rgba(13, 148, 136, 0.15); border: 1px solid #0D9488; border-radius: 20px; padding: 5px 16px;">
                    <span style="color: #2DD4BF; font-size: 12px; font-weight: 700; letter-spacing: 0.5px;">✓ BIÊN LAI THANH TOÁN ĐIỆN TỬ</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px 30px 24px 30px;">
                  <p style="margin: 0 0 10px 0; color: #1E293B; font-size: 16px; font-weight: 700; letter-spacing: -0.2px;">
                    Kính chào Quý khách <span style="color: #0D9488;">${userName}</span>,
                  </p>
                  <p style="margin: 0 0 22px 0; color: #475569; font-size: 13.5px; line-height: 1.6;">
                    OfficeCare xin chân thành cảm ơn Quý khách đã tin tưởng và sử dụng dịch vụ trị liệu phục hồi chức năng của chúng tôi. Hệ thống xác nhận đã ghi nhận giao dịch thanh toán thành công với chi tiết như sau:
                  </p>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; margin-bottom: 22px;">
                    <tr>
                      <td style="padding: 18px 20px;">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px;">
                          <tr>
                            <td style="padding: 5px 0; color: #64748B; width: 42%;">Mã hóa đơn:</td>
                            <td style="padding: 5px 0; color: #0D9488; font-weight: 800; font-family: monospace; text-align: right;">${maHoaDon}</td>
                          </tr>
                          <tr>
                            <td style="padding: 5px 0; color: #64748B;">Thời gian giao dịch:</td>
                            <td style="padding: 5px 0; color: #0F172A; font-weight: 600; text-align: right;">${dateFormatted}</td>
                          </tr>
                          <tr>
                            <td style="padding: 5px 0; color: #64748B;">Phương thức thanh toán:</td>
                            <td style="padding: 5px 0; color: #0F172A; font-weight: 600; text-align: right;">${methodLabel}</td>
                          </tr>
                          ${hinhThucGoi ? `
                          <tr>
                            <td style="padding: 5px 0; color: #64748B;">Hình thức gói:</td>
                            <td style="padding: 5px 0; color: #0F172A; font-weight: 600; text-align: right;">${planLabel}</td>
                          </tr>` : ''}
                        </table>
                      </td>
                    </tr>
                  </table>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 22px; font-size: 13px;">
                    <thead>
                      <tr style="background-color: #F1F5F9; border-bottom: 2px solid #CBD5E1;">
                        <th style="padding: 10px 12px; text-align: left; color: #334155; font-weight: 700; font-size: 12px; text-transform: uppercase;">Dịch vụ / Liệu trình</th>
                        <th style="padding: 10px 12px; text-align: right; color: #334155; font-weight: 700; font-size: 12px; text-transform: uppercase;">Số tiền thu</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style="border-bottom: 1px solid #E2E8F0;">
                        <td style="padding: 14px 12px; color: #0F172A; font-weight: 600;">
                          ${tenDichVu}
                          ${soBuoi ? `<div style="font-size: 11.5px; color: #64748B; font-weight: normal; margin-top: 3px;">Quy mô: ${soBuoi} buổi trị liệu chuyên sâu</div>` : ''}
                        </td>
                        <td style="padding: 14px 12px; text-align: right; font-weight: 800; color: #0D9488; font-size: 14px;">
                          ${formatVND(soTienThanhToan)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F0FDFA; border: 1px solid #CCFBF1; border-radius: 12px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 16px 20px;">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px;">
                          <tr>
                            <td style="padding: 4px 0; color: #475569;">Tổng giá trị hóa đơn:</td>
                            <td style="padding: 4px 0; color: #0F172A; font-weight: 700; text-align: right;">${formatVND(tongTienHoaDon)}</td>
                          </tr>
                          <tr>
                            <td style="padding: 4px 0; color: #059669; font-weight: 700;">Tổng số tiền đã nộp:</td>
                            <td style="padding: 4px 0; color: #059669; font-weight: 800; text-align: right;">${formatVND(daThanhToan)}</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0 2px 0; color: ${isPaidFull ? '#059669' : '#D97706'}; font-weight: 700; border-top: 1px dashed #99F6E4;">
                              ${isPaidFull ? 'Trạng thái quyết toán:' : 'Số tiền còn lại cần nộp:'}
                            </td>
                            <td style="padding: 6px 0 2px 0; color: ${isPaidFull ? '#059669' : '#D97706'}; font-weight: 800; text-align: right; border-top: 1px dashed #99F6E4; font-size: 14px;">
                              ${isPaidFull ? '✓ ĐÃ HOÀN TẤT 100%' : formatVND(conLai)}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 0 0 20px 0; color: #475569; font-size: 12.5px; line-height: 1.6; background-color: #F8FAFC; border-left: 3px solid #0D9488; padding: 12px 16px; border-radius: 0 10px 10px 0;">
                    💡 Quý khách có thể xem và tra cứu toàn bộ lịch sử lượng giá, lịch tập trị liệu và tiến trình phục hồi chức năng của mình trên ứng dụng OfficeCare bằng số điện thoại đã đăng ký.
                  </p>
                  <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="color: #64748B; font-size: 12px; line-height: 1.7;">
                    <tr>
                      <td>
                        <strong style="color: #0F172A;">Trung Tâm Phục Hồi Chức Năng OfficeCare</strong><br>
                        🏢 Địa chỉ: Tòa nhà OfficeCare Clinic, TP. Hồ Chí Minh<br>
                        📞 Tổng đài CSKH: <strong>1900 6868</strong> (Hỗ trợ 24/7)<br>
                        ✉️ Email hỗ trợ: support@officecare.vn
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="background-color: #F8FAFC; padding: 18px 24px; border-top: 1px solid #E2E8F0; text-align: center; font-size: 11px; color: #94A3B8;">
                  © 2026 OfficeCare Clinic. Đây là email tự động gửi biên nhận thanh toán, quý khách vui lòng không phản hồi trực tiếp vào địa chỉ email này.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export const renderAdminSecurityOtpEmail = (
  userName: string,
  otpCode: string,
  actionTitle: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mã xác thực bảo mật Admin - OfficeCare</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 30px 10px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="560" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03); border: 1px solid #E2E8F0;">
              <tr>
                <td align="center" style="background-color: #0F172A; padding: 30px 20px; text-align: center;">
                  <div style="font-size: 24px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; line-height: 1.2;">
                    <span style="color: #14B8A6;">O</span>fficeCare
                  </div>
                  <div style="font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">
                    Xác thực bảo mật Quản trị viên
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 35px 30px;">
                  <div style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 20px;">
                    Xin chào <strong style="color: #0F172A;">${userName || 'Quản trị viên'}</strong>,
                  </div>
                  <div style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 25px;">
                    Hệ thống ghi nhận yêu cầu <strong style="color: #0F172A;">${actionTitle}</strong> cho tài khoản Quản trị viên của bạn. Vui lòng sử dụng mã xác thực OTP 6 số dưới đây để xác nhận:
                  </div>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;">
                    <tr>
                      <td align="center" style="background-color: #F0FDFA; border: 2px dashed #0D9488; border-radius: 12px; padding: 20px;">
                        <div style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #0D9488; font-family: monospace;">
                          ${otpCode}
                        </div>
                        <div style="font-size: 12px; color: #64748B; margin-top: 8px; font-weight: 500;">
                          Mã có hiệu lực trong vòng <strong>10 phút</strong>
                        </div>
                      </td>
                    </tr>
                  </table>
                  <div style="font-size: 12px; color: #DC2626; line-height: 1.5; background-color: #FEF2F2; padding: 12px 15px; border-radius: 8px; border-left: 4px solid #EF4444; margin-bottom: 25px;">
                    ⚠️ <strong>Cảnh báo an toàn:</strong> Tuyệt đối không chia sẻ mã này cho bất kỳ ai. Nếu bạn không thực hiện yêu cầu này, vui lòng kiểm tra ngay lịch sử bảo mật tài khoản.
                  </div>
                  <div style="font-size: 13px; color: #64748B; line-height: 1.5; border-top: 1px solid #F1F5F9; padding-top: 20px;">
                    Trân trọng,<br>
                    <strong>Đội ngũ Bảo mật Hệ thống OfficeCare</strong>
                  </div>
                </td>
              </tr>
              <tr>
                <td align="center" style="background-color: #F8FAFC; padding: 20px; text-align: center; border-top: 1px solid #E2E8F0;">
                  <div style="font-size: 11px; color: #94A3B8;">
                    © ${new Date().getFullYear()} OfficeCare Clinic Management System. All rights reserved.
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export interface BookingSuccessEmailParams {
  userName: string;
  maLichDat: string;
  tenDichVu: string;
  ngayHen: string;
  buoiHen: string;
  khungGio: string;
  gioDenMuonNhat?: string;
  tenChuyenVien?: string;
  tenPhong?: string;
  diaChiTrungTam?: string;
  ghiChu?: string;
}

export const renderBookingSuccessEmail = (params: BookingSuccessEmailParams): string => {
  const {
    userName,
    maLichDat,
    tenDichVu,
    ngayHen,
    buoiHen,
    khungGio,
    gioDenMuonNhat,
    tenChuyenVien,
    tenPhong,
    diaChiTrungTam = 'Tòa nhà OfficeCare, Số 123 Đường Nguyễn Văn Cừ, Quận 5, TP.HCM',
    ghiChu
  } = params;

  const defaultLatestArrival = buoiHen.toLowerCase().includes('sáng') ? '11h30' : '19h30';
  const latestArrivalStr = gioDenMuonNhat || defaultLatestArrival;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Xác nhận đặt lịch hẹn thành công - OfficeCare</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 30px 10px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="560" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03); border: 1px solid #E2E8F0;">
              <tr>
                <td align="center" style="background-color: #0F172A; padding: 35px 30px; text-align: center;">
                  <div style="font-size: 28px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; line-height: 1.2;">
                    <span style="color: #14B8A6;">O</span>fficeCare
                  </div>
                  <div style="font-size: 11px; color: #94A3B8; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px;">
                    Trung Tâm Phục Hồi Chức Năng Cho Dân Văn Phòng
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 35px 35px 25px 35px;">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; background-color: #F0FDF4; border-radius: 50%; color: #16A34A; font-size: 28px; border: 1px solid #DCFCE7;">
                      ✓
                    </div>
                    <h2 style="margin: 12px 0 4px 0; color: #0F172A; font-size: 20px; font-weight: 800;">Đặt Lịch Hẹn Thành Công!</h2>
                    <p style="margin: 0; color: #64748B; font-size: 13px;">Mã lịch hẹn: <strong style="color: #0D9488; font-family: monospace; font-size: 15px;">#${maLichDat}</strong></p>
                  </div>

                  <p style="margin: 0 0 20px 0; color: #334155; font-size: 14px; line-height: 1.7;">Chào <strong>${userName || 'Quý khách'}</strong>, hệ thống đã ghi nhận lịch hẹn của bạn tại <strong>Trung tâm OfficeCare</strong> với thông tin chi tiết như sau:</p>

                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; margin-bottom: 24px; font-size: 13.5px; color: #334155;">
                    <tr>
                      <td style="padding: 18px;">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="line-height: 2;">
                          <tr>
                            <td width="38%" style="color: #64748B; font-weight: 600;">Dịch vụ:</td>
                            <td style="color: #0F172A; font-weight: 700;">${tenDichVu}</td>
                          </tr>
                          <tr>
                            <td style="color: #64748B; font-weight: 600;">Ngày hẹn:</td>
                            <td style="color: #0F172A; font-weight: 700;">${ngayHen}</td>
                          </tr>
                          <tr>
                            <td style="color: #64748B; font-weight: 600;">Khung giờ:</td>
                            <td style="color: #0D9488; font-weight: 700;">${buoiHen} (${khungGio})</td>
                          </tr>
                          ${tenChuyenVien ? `
                          <tr>
                            <td style="color: #64748B; font-weight: 600;">Chuyên viên:</td>
                            <td style="color: #0F172A; font-weight: 600;">${tenChuyenVien}</td>
                          </tr>
                          ` : `
                          <tr>
                            <td style="color: #64748B; font-weight: 600;">Chuyên viên:</td>
                            <td style="color: #0F172A; font-weight: 600;">Phân công linh hoạt tại quầy (Ưu tiên)</td>
                          </tr>
                          `}
                          ${tenPhong ? `
                          <tr>
                            <td style="color: #64748B; font-weight: 600;">Phòng:</td>
                            <td style="color: #0F172A; font-weight: 600;">${tenPhong}</td>
                          </tr>
                          ` : ''}
                          ${ghiChu ? `
                          <tr>
                            <td style="color: #64748B; font-weight: 600;">Ghi chú:</td>
                            <td style="color: #0F172A; font-style: italic;">${ghiChu}</td>
                          </tr>
                          ` : ''}
                        </table>
                      </td>
                    </tr>
                  </table>

                  <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 14px 16px; border-radius: 8px; margin-bottom: 24px; font-size: 12.5px; color: #1E40AF; line-height: 1.6;">
                    <strong>📌 Hướng dẫn khi đến trung tâm:</strong><br>
                    • Quý khách có thể đến trung tâm bất kỳ lúc nào trong khung giờ buổi hẹn đã chọn, vui lòng có mặt <strong>trước ${latestArrivalStr}</strong> để làm thủ tục check-in tại quầy Lễ tân và đảm bảo trọn vẹn thời lượng trị liệu.<br>
                    • Cung cấp Mã lịch hẹn <strong>#${maLichDat}</strong> hoặc Số điện thoại đăng ký cho Lễ tân khi đến nơi.<br>
                    • Địa chỉ trung tâm: <em>${diaChiTrungTam}</em>
                  </div>

                  <hr style="border: none; border-top: 1px solid #F1F5F9; margin: 25px 0;" />
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="color: #64748B; font-size: 12px; line-height: 1.7;">
                    <tr>
                      <td>
                        <strong>Hỗ trợ khách hàng OfficeCare:</strong><br>
                        📞 Hotline: 1900 6868<br>
                        ✉️ Email: support@officecare.vn
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center" style="background-color: #F8FAFC; padding: 20px 35px; border-top: 1px solid #E2E8F0;">
                  <p style="margin: 0; color: #94A3B8; font-size: 11px; line-height: 1.5;">© ${new Date().getFullYear()} OfficeCare Clinic. Bảo lưu mọi quyền.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

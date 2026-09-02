import { z } from 'zod';
import { validateEmail } from '../utils/validators';

export const loginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email là bắt buộc' }).email('Email không hợp lệ'),
    password: z.string({ required_error: 'Mật khẩu là bắt buộc' }).min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
  })
});

export const registerSchema = z.object({
  body: z.object({
    ho_ten: z.string({ required_error: 'Họ tên là bắt buộc' }).min(2, 'Họ tên phải có ít nhất 2 ký tự'),
    email: z.string({ required_error: 'Email là bắt buộc' }).superRefine((val, ctx) => {
      const res = validateEmail(val);
      if (!res.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: res.message || 'Email không hợp lệ',
        });
      }
    }),
    so_dien_thoai: z.string({ required_error: 'Số điện thoại là bắt buộc' }).regex(/^(0|\+84)(3|5|7|8|9)\d{8}$/, 'Số điện thoại không hợp lệ'),
    gioi_tinh: z.enum(['nam', 'nu', 'khac'], { required_error: 'Vui lòng chọn giới tính' }),
    ngay_sinh: z.string({ required_error: 'Ngày sinh là bắt buộc' }).refine((val) => !isNaN(Date.parse(val)) && new Date(val) <= new Date(), {
      message: 'Ngày sinh không hợp lệ'
    }),
    dia_chi: z.string().optional(),
    password: z.string({ required_error: 'Mật khẩu là bắt buộc' }).min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    dong_y_dieu_khoan: z.literal(true, {
      errorMap: () => ({ message: 'Bạn cần đồng ý với Điều khoản dịch vụ để đăng ký tài khoản' })
    })
  })
});

export const verifyEmailSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email là bắt buộc' }).email('Email không hợp lệ'),
    otp: z.string({ required_error: 'Mã OTP là bắt buộc' }).length(6, 'Mã OTP phải có đúng 6 ký tự')
  })
});


export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string({
      required_error: 'Refresh token là bắt buộc'
    })
  })
});

export const resendOTPSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email là bắt buộc' }).email('Email không hợp lệ'),
  })
});

export const checkEmailSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email là bắt buộc' }).email('Email không hợp lệ'),
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email là bắt buộc' }).email('Email không hợp lệ'),
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email là bắt buộc' }).email('Email không hợp lệ'),
    otp: z.string({ required_error: 'Mã OTP là bắt buộc' }).length(6, 'Mã OTP phải có đúng 6 ký số'),
    newPassword: z.string({ required_error: 'Mật khẩu mới là bắt buộc' }).min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  })
});


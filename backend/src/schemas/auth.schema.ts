import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email là bắt buộc' }).email('Email không hợp lệ'),
    password: z.string({ required_error: 'Mật khẩu là bắt buộc' }).min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
  })
});

export const registerSchema = z.object({
  body: z.object({
    ho_ten: z.string({ required_error: 'Họ tên là bắt buộc' }).min(2, 'Họ tên phải có ít nhất 2 ký tự'),
    email: z.string({ required_error: 'Email là bắt buộc' }).email('Email không hợp lệ'),
    password: z.string({ required_error: 'Mật khẩu là bắt buộc' }).min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
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


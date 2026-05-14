import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email hoặc số điện thoại là bắt buộc' }).min(1, 'Vui lòng nhập email hoặc số điện thoại'),
    password: z.string({ required_error: 'Mật khẩu là bắt buộc' }).min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
  })
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string({
      required_error: 'Refresh token là bắt buộc'
    })
  })
});

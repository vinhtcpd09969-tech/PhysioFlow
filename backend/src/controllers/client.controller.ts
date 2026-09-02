import { Request, Response } from 'express';
import clientService from '../services/client.service';
import axios from 'axios';
import { asyncHandler } from '../utils/asyncHandler';
import { BadRequestError, NotFoundError } from '../utils/appError';

export const getServices = asyncHandler(async (req: Request, res: Response) => {
  const services = await clientService.getPublicServices();
  res.json(services);
});

export const getPackages = asyncHandler(async (req: Request, res: Response) => {
  const packages = await clientService.getPublicPackages();
  res.json(packages);
});

export const getTopServices = asyncHandler(async (req: Request, res: Response) => {
  const topServices = await clientService.getTopServices();
  res.json(topServices);
});

export const getSpecialists = asyncHandler(async (req: Request, res: Response) => {
  const specialists = await clientService.getSpecialists();
  res.json(specialists);
});

export const getSpecialistById = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const specialist = await clientService.getSpecialistById(id);
  if (!specialist) {
    throw new NotFoundError('Không tìm thấy chuyên gia');
  }
  res.json(specialist);
});

export const getSpecialistReviews = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const reviews = await clientService.getSpecialistReviews(id);
  res.json(reviews);
});

export const getServiceReviews = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const reviews = await clientService.getServiceReviews(id);
  res.json(reviews);
});

export const getTestimonials = asyncHandler(async (req: Request, res: Response) => {
  const testimonials = await clientService.getTestimonials();
  res.json(testimonials);
});

export const getTreatmentPlans = asyncHandler(async (req: Request, res: Response) => {
  const customerId = (req as any).user?.id;
  if (!customerId) {
    res.json([]);
    return;
  }
  const plans = await clientService.getActiveTreatmentPlans(customerId);
  res.json(plans);
});

export const getPendingRatingAppointments = asyncHandler(async (req: Request, res: Response) => {
  const customerId = (req as any).user?.id;
  const appts = await clientService.getPendingRatingAppointments(customerId);
  res.json(appts);
});

export const rateAppointment = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const customerId = (req as any).user?.id;
  if (!customerId) {
    throw new BadRequestError('Chưa xác thực người dùng');
  }
  const result = await clientService.submitAppointmentRating(id, customerId, req.body);
  res.status(200).json(result);
});

export const getMyReviews = asyncHandler(async (req: Request, res: Response) => {
  const customerId = (req as any).user?.id;
  const reviews = await clientService.getMyReviews(customerId);
  res.json(reviews);
});

export const updateServiceReview = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { rating, comment } = req.body;
  const customerId = (req as any).user?.id;
  await clientService.updateServiceReview(id, customerId, Number(rating), comment);
  res.json({ message: 'Cập nhật đánh giá dịch vụ thành công' });
});

export const updateStaffReview = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { rating, comment } = req.body;
  const customerId = (req as any).user?.id;
  await clientService.updateStaffReview(id, customerId, Number(rating), comment);
  res.json({ message: 'Cập nhật đánh giá nhân sự thành công' });
});

export const agreeTerms = asyncHandler(async (req: Request, res: Response) => {
  const customerId = (req as any).user?.id;
  await clientService.agreeTerms(customerId);
  res.json({ success: true, message: 'Đồng ý điều khoản thành công' });
});

export const getTtsProxy = asyncHandler(async (req: Request, res: Response) => {
  const text = req.query.text as string;
  if (!text) {
    throw new BadRequestError('Missing text parameter');
  }

  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=vi&client=tw-ob`;
  const response = await axios({
    method: 'get',
    url,
    responseType: 'stream',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
    }
  });

  res.setHeader('Content-Type', 'audio/mpeg');
  response.data.pipe(res);
});

export const getActiveVouchers = asyncHandler(async (req: Request, res: Response) => {
  const khach_hang_id = (req.query.khach_hang_id as string) || (req.query.userId as string) || (req as any).user?.id;
  const vouchers = await clientService.getActiveVouchers(khach_hang_id);
  res.json({ vouchers });
});

export const applyClientVoucher = asyncHandler(async (req: Request, res: Response) => {
  const { ma_voucher, loai_thanh_toan, khach_hang_id, kenh, loai_goi } = req.body;
  const effectiveKhachHangId = khach_hang_id || (req as any).user?.id;
  if (!ma_voucher || !String(ma_voucher).trim()) {
    throw new BadRequestError('Vui lòng nhập mã giảm giá');
  }
  const voucher = await clientService.applyVoucher(ma_voucher, loai_thanh_toan, effectiveKhachHangId, kenh || 'online', loai_goi);
  res.json({ voucher });
});

export const createPayosPaymentLink = asyncHandler(async (req: Request, res: Response) => {
  const { amount, phone, description } = req.body;
  const linkRes = await clientService.createPayOSPaymentLink(amount, phone, description);
  res.json(linkRes);
});

export const getPayosPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const orderCode = req.params.orderCode as string;
  if (!orderCode) {
    throw new BadRequestError('Thiếu orderCode');
  }
  const statusRes = await clientService.checkPayOSPaymentStatus(orderCode);
  res.json(statusRes);
});

// --- BÀI VIẾT & TIN TỨC PUBLIC (BLOG) ---

export const getPublicArticles = asyncHandler(async (req: Request, res: Response) => {
  const { danh_muc } = req.query as { danh_muc?: string };
  const articles = await clientService.getPublicArticles(danh_muc);
  res.json(articles);
});

export const getPublicArticleBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params as { slug: string };
  const article = await clientService.getPublicArticleBySlug(slug);
  res.json(article);
});

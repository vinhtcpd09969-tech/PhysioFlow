import clientRepository from '../repositories/client';
import adminRepository from '../repositories/admin';
import adminService from './admin.service';
import billingService from './billing.service';
import { SentimentService } from './ai/ai.sentiment';
import { payos } from '../config/payos';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/appError';

export class ClientService {
  async getPublicServices() {
    const packages = await adminService.getPackages();
    return packages
      .filter((pkg: any) => (pkg.loai_goi === 'LE' || pkg.loai_goi === 'KHAM') && pkg.trang_thai === 'hoat_dong')
      .map((pkg: any) => ({
        id: pkg.id,
        ten_goi: pkg.ten_goi,
        ten_dich_vu: pkg.ten_goi,
        don_gia: Number(pkg.don_gia),
        thoi_luong_phut: pkg.thoi_luong_phut,
        loai_goi: pkg.loai_goi,
        loai_dich_vu: pkg.loai_goi === 'KHAM' ? 'KHAM' : 'DIEU_TRI',
        trang_thai: pkg.trang_thai,
        dang_hoat_dong: pkg.trang_thai === 'hoat_dong',
        hien_thi_website: pkg.trang_thai === 'hoat_dong',
        quy_trinh: pkg.quy_trinh,
        muc_tieu: pkg.muc_tieu,
        anh_goi: pkg.anh_goi,
        anh_gallery: pkg.anh_gallery || [],
        luot_dung: Number(pkg.luot_dung || 0),
      }));
  }

  async getPublicPackages() {
    const packages = await adminService.getPackages();
    return packages.filter((p: any) => p.loai_goi === 'LIEU_TRINH' && p.trang_thai === 'hoat_dong');
  }

  async getTopServices() {
    return clientRepository.getTopServices();
  }

  async getSpecialists() {
    return clientRepository.getSpecialists();
  }

  async getSpecialistById(id: string | number) {
    return clientRepository.getSpecialistById(id);
  }

  async getSpecialistReviews(id: string | number) {
    return clientRepository.getSpecialistReviews(id);
  }

  async getServiceReviews(id: string | number) {
    return clientRepository.getServiceReviews(id);
  }

  async getTestimonials() {
    return clientRepository.getTestimonials();
  }

  async getActiveTreatmentPlans(customerId: string | number) {
    return clientRepository.getActiveTreatmentPlans(customerId);
  }

  async getPendingRatingAppointments(customerId: string | number) {
    return clientRepository.getPendingRatingAppointments(customerId);
  }

  async submitAppointmentRating(cuocHenId: string | number, customerId: string | number, ratingData: {
    rating_dich_vu?: number;
    comment_dich_vu?: string;
    rating_ktv?: number;
    comment_ktv?: string;
    so_sao?: number;
    nhan_xet?: string;
  }) {
    let { rating_dich_vu, comment_dich_vu, rating_ktv, comment_ktv, so_sao, nhan_xet } = ratingData;
    if (so_sao) {
      if (rating_dich_vu === undefined) rating_dich_vu = so_sao;
      if (comment_dich_vu === undefined) comment_dich_vu = nhan_xet;
      if (rating_ktv === undefined) rating_ktv = so_sao;
      if (comment_ktv === undefined) comment_ktv = nhan_xet;
    }

    const appt = await clientRepository.getAppointmentForRating(cuocHenId);
    if (!appt) {
      throw new NotFoundError('Không tìm thấy lịch hẹn');
    }

    if (String(appt.khach_hang_id) !== String(customerId)) {
      throw new ForbiddenError('Không có quyền đánh giá lịch hẹn này');
    }

    if (appt.trang_thai !== 'hoan_thanh') {
      throw new BadRequestError('Chỉ có thể đánh giá các lịch hẹn đã hoàn thành khám');
    }

    // 1. KTV review
    if (rating_ktv && appt.nhan_su_id) {
      const staffReviewId = await clientRepository.saveStaffReview(
        customerId,
        appt.nhan_su_id,
        cuocHenId,
        Number(rating_ktv),
        comment_ktv
      );

      if (comment_ktv && comment_ktv.trim() && staffReviewId) {
        SentimentService.classifyAndSaveStaffReview(staffReviewId, comment_ktv, Number(rating_ktv))
          .catch(err => console.error('Lỗi phân tích cảm xúc đánh giá nhân sự:', err));
      }
    }

    // 2. Service package review
    if (rating_dich_vu && appt.goi_dich_vu_id) {
      if (appt.loai_goi === 'LIEU_TRINH') {
        const isValidPackageEnd = appt.phac_do_status === 'hoan_thanh' || appt.phac_do_status === 'huy_ngang';
        if (!isValidPackageEnd) {
          throw new BadRequestError('Gói liệu trình chưa hoàn thành hoặc chưa bị hủy để đánh giá dịch vụ');
        }
      }

      const serviceReviewId = await clientRepository.saveServiceReview(
        customerId,
        appt.goi_dich_vu_id,
        cuocHenId,
        Number(rating_dich_vu),
        comment_dich_vu
      );

      if (comment_dich_vu && comment_dich_vu.trim() && serviceReviewId) {
        SentimentService.classifyAndSaveServiceReview(serviceReviewId, comment_dich_vu, Number(rating_dich_vu))
          .catch(err => console.error('Lỗi phân tích cảm xúc đánh giá dịch vụ:', err));
      }
    }

    return { message: 'Lưu đánh giá thành công!' };
  }

  async getMyReviews(customerId: string | number) {
    return clientRepository.getMyReviews(customerId);
  }

  async updateServiceReview(reviewId: string | number, customerId: string | number, rating: number, comment?: string) {
    await clientRepository.updateServiceReview(reviewId, customerId, rating, comment);
    if (comment && comment.trim()) {
      SentimentService.classifyAndSaveServiceReview(String(reviewId), comment, Number(rating))
        .catch(err => console.error('Lỗi phân tích cảm xúc đánh giá dịch vụ (sửa):', err));
    }
  }

  async updateStaffReview(reviewId: string | number, customerId: string | number, rating: number, comment?: string) {
    await clientRepository.updateStaffReview(reviewId, customerId, rating, comment);
    if (comment && comment.trim()) {
      SentimentService.classifyAndSaveStaffReview(String(reviewId), comment, Number(rating))
        .catch(err => console.error('Lỗi phân tích cảm xúc đánh giá nhân sự (sửa):', err));
    }
  }

  async agreeTerms(customerId: string | number) {
    return clientRepository.agreeTerms(customerId);
  }

  async getActiveVouchers(khachHangId?: string) {
    return clientRepository.getActiveVouchers(khachHangId);
  }

  async applyVoucher(ma_voucher: string, loai_thanh_toan?: string, khach_hang_id?: string, kenh?: 'online' | 'tai_quay', loai_goi?: 'KHAM' | 'LE' | 'LIEU_TRINH') {
    return billingService.applyVoucher(ma_voucher, loai_thanh_toan, khach_hang_id, kenh || 'online', loai_goi);
  }

  async createPayOSPaymentLink(amount: number, phone?: string, description?: string) {
    const finalAmount = Math.round(Number(amount) || 0);
    if (finalAmount <= 0) {
      throw new BadRequestError('Số tiền thanh toán phải lớn hơn 0');
    }

    const removeAccents = (str: string) => {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9 ]/g, '');
    };
    const cleanPhone = removeAccents(phone || 'CLIENT').replace(/\s+/g, '');
    const orderCode = Date.now() % 2000000000;
    const descText = (description || `PAY ${cleanPhone}`).substring(0, 25).trim();

    const cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/booking`;
    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/appointments`;

    const paymentData = {
      orderCode,
      amount: finalAmount,
      description: descText,
      cancelUrl,
      returnUrl,
      expiredAt: Math.floor(Date.now() / 1000) + 600, // 10 minutes
    };

    const paymentLinkRes = await payos.paymentRequests.create(paymentData);
    return {
      ...paymentLinkRes,
      orderCode,
      amount: finalAmount,
      accountNumber: paymentLinkRes.accountNumber || '0358966332',
      accountName: paymentLinkRes.accountName || 'PHONG KHAM PHCN OFFICECARE',
    };
  }

  async checkPayOSPaymentStatus(orderCode: string | number) {
    const paymentLinkInfo = await payos.paymentRequests.get(Number(orderCode));
    const isPaid = paymentLinkInfo && paymentLinkInfo.status === 'PAID';
    return {
      status: paymentLinkInfo?.status,
      paid: isPaid,
      amountPaid: paymentLinkInfo?.amountPaid || paymentLinkInfo?.amount
    };
  }

  // --- BÀI VIẾT PUBLIC ---
  async getPublicArticles(danhMuc?: string) {
    return adminService.getArticles({ danh_muc: danhMuc, trang_thai: 'xuat_ban' });
  }

  async getPublicArticleBySlug(slug: string) {
    const article = await adminRepository.getPublicArticleBySlug(slug);
    if (!article) {
      throw new Error('Không tìm thấy bài viết');
    }
    await adminRepository.incrementArticleView(article.id);
    return article;
  }
}

export default new ClientService();

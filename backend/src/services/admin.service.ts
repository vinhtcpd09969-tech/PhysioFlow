import adminRepository from '../repositories/admin';
import bcrypt from 'bcryptjs';
import sanitizeHtml from 'sanitize-html';
import { SentimentService } from './ai/ai.sentiment';
import { BadRequestError, NotFoundError } from '../utils/appError';
import { validateEmail } from '../utils/validators';

const ALLOWED_TAGS = ['p', 'h2', 'h3', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'br'];
const COMBINING_MARKS = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

class AdminService {
  // --- QUẢN LÝ PHÒNG KHÁM ---
  async getRooms() {
    return adminRepository.getRooms();
  }

  async createRoom(data: any) {
    return adminRepository.createRoom(data);
  }

  async updateRoom(id: string | number, data: any) {
    return adminRepository.updateRoom(id, data);
  }

  async deleteRoom(id: string | number) {
    return adminRepository.deleteRoom(id);
  }

  // --- QUẢN LÝ GÓI ĐIỀU TRỊ ---
  async getPackages() {
    return adminRepository.getPackages();
  }

  async createPackage(data: any) {
    return adminRepository.createPackage(data);
  }

  async updatePackage(id: string, data: any) {
    return adminRepository.updatePackage(id, data);
  }

  async deletePackage(id: string) {
    return adminRepository.deletePackage(id);
  }

  // --- QUẢN LÝ NHÂN SỰ ---
  async getStaff() {
    return adminRepository.getStaff();
  }

  async createStaff(data: any) {
    if (data.email) {
      const emailTrim = data.email.trim().toLowerCase();
      const existingUserEmail = await adminRepository.findUserByEmail(emailTrim);
      if (existingUserEmail) {
        throw new BadRequestError('Email này đã được sử dụng bởi nhân sự khác trong hệ thống.');
      }
      const existingCustomerEmail = await adminRepository.findCustomerByEmail(emailTrim);
      if (existingCustomerEmail) {
        throw new BadRequestError('Email này đã được sử dụng bởi khách hàng trong hệ thống.');
      }
      data.email = emailTrim;
    }

    if (data.so_dien_thoai) {
      const phoneTrim = data.so_dien_thoai.trim();
      const existingUserPhone = await adminRepository.findUserByPhone(phoneTrim);
      if (existingUserPhone) {
        throw new BadRequestError('Số điện thoại này đã được đăng ký bởi nhân sự khác trên hệ thống.');
      }
      const existingCustomerPhone = await adminRepository.findCustomerByPhone(phoneTrim);
      if (existingCustomerPhone) {
        throw new BadRequestError('Số điện thoại này đã được đăng ký bởi khách hàng trên hệ thống.');
      }
      data.so_dien_thoai = phoneTrim;
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(data.mat_khau, salt);

    return adminRepository.createStaff(data, hash);
  }

  async updateStaffStatus(id: string, status: string) {
    const user = await adminRepository.updateStaffStatus(id, status);
    if (!user) throw new NotFoundError('Không tìm thấy nhân sự');
    return user;
  }

  async updateStaffDetails(id: string, data: any) {
    if (data.email) {
      const emailTrim = data.email.trim().toLowerCase();
      const existingUserEmail = await adminRepository.findUserByEmail(emailTrim, id);
      if (existingUserEmail) {
        throw new BadRequestError('Email này đã được sử dụng bởi nhân sự khác trong hệ thống.');
      }
      const existingCustomerEmail = await adminRepository.findCustomerByEmail(emailTrim);
      if (existingCustomerEmail) {
        throw new BadRequestError('Email này đã được sử dụng bởi khách hàng trong hệ thống.');
      }
      data.email = emailTrim;
    }

    if (data.so_dien_thoai) {
      const phoneTrim = data.so_dien_thoai.trim();
      const existingUserPhone = await adminRepository.findUserByPhone(phoneTrim, id);
      if (existingUserPhone) {
        throw new BadRequestError('Số điện thoại này đã được sử dụng bởi nhân sự khác trong hệ thống.');
      }
      const existingCustomerPhone = await adminRepository.findCustomerByPhone(phoneTrim);
      if (existingCustomerPhone) {
        throw new BadRequestError('Số điện thoại này đã được sử dụng bởi khách hàng trong hệ thống.');
      }
      data.so_dien_thoai = phoneTrim;
    }

    const user = await adminRepository.updateStaffDetails(id, data);
    if (!user) throw new NotFoundError('Không tìm thấy nhân sự');
    return user;
  }

  async deleteStaffAvatar(id: string) {
    const user = await adminRepository.deleteStaffAvatar(id);
    if (!user) throw new NotFoundError('Không tìm thấy nhân sự');
    return user;
  }

  async updateStaffPassword(id: string, password: string) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = await adminRepository.updateStaffPassword(id, hash);
    if (!user) throw new NotFoundError('Không tìm thấy nhân sự');
    return user;
  }

  // --- QUẢN LÝ KHÁCH HÀNG ---
  async getCustomers() {
    return adminRepository.getCustomers();
  }

  async updateCustomer(id: string, data: any) {
    if (data.email) {
      const emailTrim = data.email.trim().toLowerCase();
      const emailValidation = validateEmail(emailTrim);
      if (!emailValidation.isValid) {
        throw new BadRequestError(emailValidation.message || 'Địa chỉ email không hợp lệ.');
      }
      const existingCustomerEmail = await adminRepository.findCustomerByEmail(emailTrim, id);
      if (existingCustomerEmail) {
        throw new BadRequestError('Email này đã được sử dụng bởi khách hàng khác trên hệ thống.');
      }
      const existingUserEmail = await adminRepository.findUserByEmail(emailTrim);
      if (existingUserEmail) {
        throw new BadRequestError('Email này đã được đăng ký bởi người dùng khác trong hệ thống.');
      }
      data.email = emailTrim;
    }

    if (data.so_dien_thoai) {
      const phoneTrim = data.so_dien_thoai.trim();
      const existingCustomerPhone = await adminRepository.findCustomerByPhone(phoneTrim, id);
      if (existingCustomerPhone) {
        throw new BadRequestError('Số điện thoại này đã được sử dụng bởi khách hàng khác trên hệ thống.');
      }
      const existingUserPhone = await adminRepository.findUserByPhone(phoneTrim);
      if (existingUserPhone) {
        throw new BadRequestError('Số điện thoại này đã được đăng ký bởi người dùng khác trong hệ thống.');
      }
      data.so_dien_thoai = phoneTrim;
    }

    return adminRepository.updateCustomer(id, data);
  }

  async updateCustomerLock(id: string, isLocked: boolean) {
    return adminRepository.updateCustomerLock(id, isLocked);
  }

  async getCustomerLockImpact(id: string) {
    return adminRepository.getCustomerLockImpact(id);
  }

  async getCustomersOverview(filters: { page: number; pageSize: number; search: string; status: string[]; repTier?: 'low' | 'mid' | 'high' }) {
    return adminRepository.getCustomersOverview(filters);
  }

  async getTreatmentPlansOverview(filters: { page: number; pageSize: number; search: string; status?: string }) {
    return adminRepository.getTreatmentPlansOverview(filters);
  }

  async getCompletedSingleVisits(params: { page: number; pageSize: number; search?: string; loai?: string }) {
    return adminRepository.getCompletedSingleVisits(params);
  }

  async getCustomerEmr(id: string) {
    const record: any = await adminRepository.getCustomerEmr(id);
    if (!record) throw new NotFoundError('Không tìm thấy khách hàng');
    const { reminder_raw, ...rest } = record;
    return { ...rest, reminder: this.formatCustomerReminder(reminder_raw) };
  }

  private formatCustomerReminder(raw: any): { type: string; message: string } | null {
    if (raw?.pending_activation?.han_kich_hoat) {
      const diffMs = new Date(raw.pending_activation.han_kich_hoat).getTime() - Date.now();
      if (diffMs > 0) {
        const days = Math.floor(diffMs / 86400000);
        const hours = Math.floor((diffMs % 86400000) / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        const conLai = days >= 1 ? `${days} ngày ${hours} giờ` : hours >= 1 ? `${hours} giờ ${minutes} phút` : `${Math.max(1, minutes)} phút`;
        return {
          type: 'pending_activation',
          message: `Gói "${raw.pending_activation.ten_goi}" còn ${conLai} để kích hoạt`
        };
      }
    }
    if (raw?.last_active_session_at) {
      const days = Math.max(0, Math.floor((Date.now() - new Date(raw.last_active_session_at).getTime()) / 86400000));
      return {
        type: 'in_treatment',
        message: `Buổi điều trị gần nhất của gói "${raw.active_plan_name}" cách đây ${days} ngày`
      };
    }
    return null;
  }

  // --- QUẢN LÝ THIẾT BỊ Y TẾ ---
  async getEquipment() {
    return adminRepository.getEquipment();
  }

  async createEquipment(data: any) {
    return adminRepository.createEquipment('', data);
  }

  async updateEquipment(id: string, data: any) {
    return adminRepository.updateEquipment(id, data);
  }

  async deleteEquipment(id: string) {
    return adminRepository.deleteEquipment(id);
  }

  // --- QUẢN LÝ LỊCH LÀM VIỆC ---
  async getSchedules() {
    return adminRepository.getSchedules();
  }

  async createSchedule(data: any) {
    return adminRepository.createSchedule(data);
  }

  async updateSchedule(id: string, data: any) {
    return adminRepository.updateSchedule(id, data);
  }

  async deleteSchedule(id: string) {
    return adminRepository.deleteSchedule(id);
  }

  // --- QUẢN LÝ HỒ SƠ ĐIỀU TRỊ ---
  async getMedicalRecords() {
    return adminRepository.getMedicalRecords();
  }

  // --- QUẢN LÝ TÀI CHÍNH ---
  async getInvoices() {
    return adminRepository.getInvoices();
  }

  async getPayments() {
    return adminRepository.getPayments();
  }

  async handleRefund(id: string, data: any) {
    const result = await adminRepository.handleRefund(id, data.ly_do_hoan_tien);
    if (result.error) {
      const err = new Error(result.error) as any;
      err.code = result.code;
      err.statusCode = 400;
      throw err;
    }
    return result;
  }

  async handlePackageRefund(id: string, data: any, userId: number) {
    const result = await adminRepository.handlePackageRefund(
      id,
      Number(data.so_buoi_dung || 0),
      data.ly_do || 'Hủy gói theo yêu cầu của Admin',
      userId
    );
    if (result.error) {
      const err = new Error(result.error) as any;
      err.code = result.code;
      err.statusCode = 400;
      throw err;
    }
    return result;
  }

  async expirePackageNoRefund(id: string, data: any, userId: number) {
    const result = await adminRepository.expirePackageNoRefund(id, data.ly_do, userId);
    if (result.error) {
      const err = new Error(result.error) as any;
      err.code = result.code;
      err.statusCode = 400;
      throw err;
    }
    return result;
  }

  // --- QUẢN LÝ MARKETING ---
  async getVouchers() {
    return adminRepository.getVouchers();
  }

  async createVoucher(data: any, userId: string) {
    const existing = await adminRepository.getVoucherByCode(data.ma_voucher);
    if (existing) throw new BadRequestError('Mã voucher đã tồn tại');

    return adminRepository.createVoucher(data, userId);
  }

  async updateVoucher(id: string, data: any) {
    const voucher = await adminRepository.updateVoucher(id, data);
    if (!voucher) throw new NotFoundError('Không tìm thấy voucher');
    return voucher;
  }

  async deleteVoucher(id: string) {
    const voucher = await adminRepository.deleteVoucher(id);
    if (!voucher) throw new NotFoundError('Không tìm thấy voucher');
    return voucher;
  }

  // --- QUẢN LÝ ĐÁNH GIÁ ---
  async getFeedback() {
    return adminRepository.getFeedback();
  }

  async replyServiceFeedback(id: string, phanHoi: string, staffId: number) {
    return adminRepository.replyServiceFeedback(id, phanHoi, staffId);
  }

  async replyStaffFeedback(id: string, phanHoi: string, staffId: number) {
    return adminRepository.replyStaffFeedback(id, phanHoi, staffId);
  }

  async analyzeFeedback(type: 'service' | 'staff', id: string) {
    const review = await adminRepository.getFeedbackReviewText(id);
    if (!review) throw new NotFoundError('Không tìm thấy đánh giá');
    if (!review.nhan_xet || !review.nhan_xet.trim()) {
      throw new BadRequestError('Đánh giá này không có nội dung nhận xét để AI phân tích');
    }

    const result = type === 'service'
      ? await SentimentService.classifyAndSaveServiceReview(id, review.nhan_xet, review.so_sao)
      : await SentimentService.classifyAndSaveStaffReview(id, review.nhan_xet, review.so_sao);

    if (!result) {
      throw new BadRequestError('AI hiện không thể phân tích (có thể đã hết lượt gọi miễn phí trong hôm nay). Vui lòng thử lại sau.');
    }
    return result;
  }

  // --- BÁO CÁO & THỐNG KÊ ---
  async getDashboardSummary(range?: string, startDate?: string, endDate?: string) {
    return adminRepository.getDashboardSummary(range, startDate, endDate);
  }

  async getRevenueStats(range?: string, startDate?: string, endDate?: string, bucket?: string) {
    return adminRepository.getRevenueStats(range, startDate, endDate, bucket);
  }

  async getStaffPerformance(startDate?: string, endDate?: string) {
    return adminRepository.getStaffPerformance(startDate, endDate);
  }

  async getTopPackages() {
    return adminRepository.getTopPackages();
  }

  async getTopVipCustomers() {
    return adminRepository.getTopVipCustomers();
  }

  async getAvailableStaff(dich_vu_id: string | null, dang_ky_goi_id: string | null, ngay: string, gio_bat_dau: string) {
    return adminRepository.getAvailableStaff(dich_vu_id, dang_ky_goi_id, ngay, gio_bat_dau);
  }

  // --- QUẢN LÝ BÀI VIẾT & TIN TỨC CMS ---
  async getArticles(filter: { danh_muc?: string; trang_thai?: string; search?: string }) {
    return adminRepository.getArticles(filter);
  }

  async getArticleById(id: string) {
    const article = await adminRepository.getArticleById(id);
    if (!article) {
      throw new NotFoundError('Không tìm thấy bài viết');
    }
    return article;
  }

  async createArticle(data: any, nguoiVietId: number) {
    const slug = data.slug ? slugify(data.slug) : slugify(data.tieu_de);
    const existing = await adminRepository.findArticleBySlugExcludingId(slug);
    if (existing) {
      throw new BadRequestError(`Slug "${slug}" đã tồn tại, vui lòng chọn tiêu đề hoặc slug khác`);
    }

    const noiDungSach = sanitizeHtml(data.noi_dung, {
      allowedTags: ALLOWED_TAGS,
      allowedAttributes: { a: ['href', 'target', 'rel'], img: ['src', 'alt', 'loading'] }
    });

    return adminRepository.createArticle({
      ...data,
      slug,
      noi_dung: noiDungSach,
      nguoi_viet_id: nguoiVietId,
      ngay_dang: data.trang_thai === 'xuat_ban' ? new Date() : null
    });
  }

  async updateArticle(id: string, data: any) {
    const current = await adminRepository.getArticleById(id);
    if (!current) {
      throw new NotFoundError('Không tìm thấy bài viết');
    }

    const slug = data.slug ? slugify(data.slug) : slugify(data.tieu_de);
    const existing = await adminRepository.findArticleBySlugExcludingId(slug, id);
    if (existing) {
      throw new BadRequestError(`Slug "${slug}" đã tồn tại, vui lòng chọn tiêu đề hoặc slug khác`);
    }

    const noiDungSach = sanitizeHtml(data.noi_dung, {
      allowedTags: ALLOWED_TAGS,
      allowedAttributes: { a: ['href', 'target', 'rel'], img: ['src', 'alt', 'loading'] }
    });

    const ngayDang = current.trang_thai !== 'xuat_ban' && data.trang_thai === 'xuat_ban'
      ? new Date()
      : current.ngay_dang;

    return adminRepository.updateArticle(id, {
      ...data,
      slug,
      noi_dung: noiDungSach,
      ngay_dang: ngayDang
    });
  }

  async deleteArticle(id: string) {
    const current = await adminRepository.getArticleById(id);
    if (!current) {
      throw new NotFoundError('Không tìm thấy bài viết');
    }
    return adminRepository.deleteArticle(id);
  }
}

export default new AdminService();

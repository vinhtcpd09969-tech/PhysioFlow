import prisma from '../../config/prisma';

export class AuthProfileRepository {
  async updatePassword(email: string, mat_khau_hash: string) {
    const staff = await prisma.nguoi_dung.findFirst({
      where: { email }
    });
    if (staff) {
      return prisma.nguoi_dung.update({
        where: { id: staff.id },
        data: { mat_khau_hash }
      });
    }

    const customer = await prisma.khach_hang.findFirst({
      where: { email }
    });
    if (customer) {
      return prisma.khach_hang.update({
        where: { id: customer.id },
        data: { mat_khau_hash }
      });
    }

    return null;
  }

  async updateProfile(userId: string | number, data: {
    ho_ten: string;
    so_dien_thoai: string;
    anh_dai_dien?: string;
    so_nam_kinh_nghiem?: number;
    bang_cap_chung_chi?: string;
    mo_ta?: string;
    the_manh?: string[];
    gioi_tinh?: string;
    dia_chi?: string;
    ngay_sinh?: string | Date;
  }) {
    const isNguoiDung = typeof userId === 'number' || (typeof userId === 'string' && /^\d+$/.test(userId));
    if (isNguoiDung) {
      const parsedId = typeof userId === 'number' ? userId : parseInt(userId, 10);
      
      const updatedUser = await prisma.nguoi_dung.update({
        where: { id: parsedId },
        data: {
          ho_ten: data.ho_ten,
          so_dien_thoai: data.so_dien_thoai,
          anh_dai_dien: data.anh_dai_dien !== undefined ? data.anh_dai_dien : undefined
        },
        select: {
          id: true,
          ho_ten: true,
          email: true,
          so_dien_thoai: true,
          vai_tro_id: true,
          trang_thai: true,
          anh_dai_dien: true
        }
      });

      const isExpertRole = [3, 4].includes(updatedUser.vai_tro_id);
      let hoSoChuyenGia = null;
      if (isExpertRole && (data.so_nam_kinh_nghiem !== undefined || data.bang_cap_chung_chi !== undefined || data.mo_ta !== undefined || data.the_manh !== undefined)) {
        hoSoChuyenGia = await prisma.ho_so_chuyen_gia.upsert({
          where: { nguoi_dung_id: parsedId },
          create: {
            nguoi_dung_id: parsedId,
            so_nam_kinh_nghiem: data.so_nam_kinh_nghiem || 0,
            bang_cap_chung_chi: data.bang_cap_chung_chi || '',
            mo_ta: data.mo_ta || '',
            the_manh: data.the_manh || []
          },
          update: {
            so_nam_kinh_nghiem: data.so_nam_kinh_nghiem !== undefined ? data.so_nam_kinh_nghiem : undefined,
            bang_cap_chung_chi: data.bang_cap_chung_chi !== undefined ? data.bang_cap_chung_chi : undefined,
            mo_ta: data.mo_ta !== undefined ? data.mo_ta : undefined,
            the_manh: data.the_manh !== undefined ? data.the_manh : undefined
          },
          select: {
            so_nam_kinh_nghiem: true,
            bang_cap_chung_chi: true,
            mo_ta: true,
            the_manh: true
          }
        });
      } else {
        hoSoChuyenGia = await prisma.ho_so_chuyen_gia.findUnique({
          where: { nguoi_dung_id: parsedId },
          select: {
            so_nam_kinh_nghiem: true,
            bang_cap_chung_chi: true,
            mo_ta: true,
            the_manh: true
          }
        });
      }

      return {
        ...updatedUser,
        ho_so_chuyen_gia: hoSoChuyenGia
      };
    } else {
      const customer = await prisma.khach_hang.update({
        where: { id: String(userId) },
        data: {
          ho_ten: data.ho_ten,
          so_dien_thoai: data.so_dien_thoai,
          gioi_tinh: data.gioi_tinh,
          dia_chi: data.dia_chi,
          ngay_sinh: data.ngay_sinh ? new Date(data.ngay_sinh) : undefined,
        },
        select: {
          id: true,
          ho_ten: true,
          email: true,
          so_dien_thoai: true,
          trang_thai: true,
          gioi_tinh: true,
          dia_chi: true,
          ngay_sinh: true,
          ngay_dong_y_dieu_khoan: true
        }
      });
      return {
        ...customer,
        vai_tro_id: 1
      };
    }
  }

  async findPasswordHashById(userId: string | number) {
    const isNguoiDung = typeof userId === 'number' || (typeof userId === 'string' && /^\d+$/.test(userId));
    if (isNguoiDung) {
      const parsedId = typeof userId === 'number' ? userId : parseInt(userId, 10);
      const staff = await prisma.nguoi_dung.findUnique({
        where: { id: parsedId },
        select: { mat_khau_hash: true }
      });
      return staff?.mat_khau_hash || null;
    } else {
      const customer = await prisma.khach_hang.findUnique({
        where: { id: String(userId) },
        select: { mat_khau_hash: true }
      });
      return customer?.mat_khau_hash || null;
    }
  }

  async changePassword(userId: string | number, newHash: string) {
    const isNguoiDung = typeof userId === 'number' || (typeof userId === 'string' && /^\d+$/.test(userId));
    if (isNguoiDung) {
      const parsedId = typeof userId === 'number' ? userId : parseInt(userId, 10);
      return prisma.nguoi_dung.update({
        where: { id: parsedId },
        data: { mat_khau_hash: newHash }
      });
    } else {
      return prisma.khach_hang.update({
        where: { id: String(userId) },
        data: { mat_khau_hash: newHash, phai_doi_mat_khau: false }
      });
    }
  }
}

export default new AuthProfileRepository();

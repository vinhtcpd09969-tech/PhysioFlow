import prisma from '../config/prisma';

class AuthRepository {
  async findUserByEmail(email: string) {
    // 1. Search in staff (nguoi_dung)
    const staff = await prisma.nguoi_dung.findFirst({
      where: { email }
    });
    if (staff) {
      return staff;
    }

    // 2. Search in customer (khach_hang)
    const customer = await prisma.khach_hang.findFirst({
      where: { email }
    });
    if (customer) {
      return {
        ...customer,
        vai_tro_id: 1
      };
    }

    return null;
  }

  async findActiveUserByEmail(email: string) {
    // 1. Search in staff (nguoi_dung)
    const staff = await prisma.nguoi_dung.findFirst({
      where: {
        email,
        trang_thai: 'hoat_dong'
      }
    });
    if (staff) {
      return staff;
    }

    // 2. Search in customer (khach_hang)
    const customer = await prisma.khach_hang.findFirst({
      where: {
        email,
        trang_thai: 'hoat_dong'
      }
    });
    if (customer) {
      return {
        ...customer,
        vai_tro_id: 1
      };
    }

    return null;
  }

  async createUser(data: { ho_ten: string, email: string, mat_khau_hash: string }) {
    return prisma.khach_hang.create({
      data: {
        ho_ten: data.ho_ten,
        email: data.email,
        mat_khau_hash: data.mat_khau_hash,
        trang_thai: 'hoat_dong',
      },
      select: {
        id: true,
        email: true,
      }
    });
  }

  async saveOTP(email: string, otp: string, expiresAt: Date) {
    await prisma.otp_codes.create({
      data: {
        email,
        otp,
        expires_at: expiresAt,
      }
    });
  }

  async findValidOTP(email: string, otp: string) {
    return prisma.otp_codes.findFirst({
      where: {
        email,
        otp,
        expires_at: {
          gt: new Date()
        }
      },
      select: {
        id: true
      }
    });
  }

  async verifyEmail(email: string) {
    // 1. Check if it's a staff member
    const staff = await prisma.nguoi_dung.findFirst({
      where: { email }
    });
    if (staff) {
      return prisma.nguoi_dung.update({
        where: { id: staff.id },
        data: { trang_thai: 'hoat_dong' }
      });
    }

    // 2. Check if it's a customer
    const customer = await prisma.khach_hang.findFirst({
      where: { email }
    });
    if (customer) {
      const updatedCustomer = await prisma.khach_hang.update({
        where: { id: customer.id },
        data: { trang_thai: 'hoat_dong' }
      });
      return {
        ...updatedCustomer,
        vai_tro_id: 1
      };
    }

    return null;
  }

  async saveRefreshToken(userId: string, token: string, expiresAt: Date, isCustomer: boolean) {
    await prisma.refresh_tokens.create({
      data: {
        nguoi_dung_id: isCustomer ? null : parseInt(userId, 10),
        khach_hang_id: isCustomer ? userId : null,
        token,
        expires_at: expiresAt,
      }
    });
  }

  async findValidRefreshToken(token: string) {
    return prisma.refresh_tokens.findFirst({
      where: {
        token,
        expires_at: {
          gt: new Date()
        }
      }
    });
  }

  async findUserById(id: string) {
    // 1. Search staff (nguoi_dung) - only if id is numeric string
    const isNguoiDung = /^\d+$/.test(id);
    if (isNguoiDung) {
      const parsedId = parseInt(id, 10);
      const staff = await prisma.nguoi_dung.findFirst({
        where: {
          id: parsedId,
          trang_thai: 'hoat_dong'
        },
        select: {
          id: true,
          ho_ten: true,
          email: true,
          so_dien_thoai: true,
          vai_tro_id: true,
          trang_thai: true,
        }
      });
      if (staff) return staff;
    }

    // 2. Search customer (khach_hang)
    const customer = await prisma.khach_hang.findFirst({
      where: {
        id,
        trang_thai: 'hoat_dong'
      },
      select: {
        id: true,
        ho_ten: true,
        email: true,
        so_dien_thoai: true,
        trang_thai: true,
      }
    });
    if (customer) {
      return {
        ...customer,
        vai_tro_id: 1
      };
    }

    return null;
  }

  async updateLastLogin(userId: string | number) {
    // No last login timestamp column in DB schema
  }

  async deleteOTPsByEmail(email: string) {
    await prisma.otp_codes.deleteMany({
      where: { email }
    });
  }

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

  async updateProfile(userId: string | number, data: { ho_ten: string; so_dien_thoai: string }) {
    const isNguoiDung = typeof userId === 'number' || (typeof userId === 'string' && /^\d+$/.test(userId));
    if (isNguoiDung) {
      const parsedId = typeof userId === 'number' ? userId : parseInt(userId, 10);
      return prisma.nguoi_dung.update({
        where: { id: parsedId },
        data: {
          ho_ten: data.ho_ten,
          so_dien_thoai: data.so_dien_thoai
        },
        select: {
          id: true,
          ho_ten: true,
          email: true,
          so_dien_thoai: true,
          vai_tro_id: true,
          trang_thai: true
        }
      });
    } else {
      const customer = await prisma.khach_hang.update({
        where: { id: String(userId) },
        data: {
          ho_ten: data.ho_ten,
          so_dien_thoai: data.so_dien_thoai
        },
        select: {
          id: true,
          ho_ten: true,
          email: true,
          so_dien_thoai: true,
          trang_thai: true
        }
      });
      return {
        ...customer,
        vai_tro_id: 1
      };
    }
  }
}

export default new AuthRepository();

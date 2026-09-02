import prisma from '../../config/prisma';

export class AuthAccountRepository {
  async findUserByEmail(email: string) {
    const cleanEmail = (email || '').trim();
    // 1. Search in staff (nguoi_dung)
    const staff = await prisma.nguoi_dung.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } }
    });
    if (staff) {
      return staff;
    }

    // 2. Search in customer (khach_hang)
    const customer = await prisma.khach_hang.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } }
    });
    if (customer) {
      return {
        ...customer,
        vai_tro_id: 1
      };
    }

    return null;
  }

  async findStaffByEmail(email: string) {
    const cleanEmail = (email || '').trim();
    return prisma.nguoi_dung.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } }
    });
  }

  async findCustomerByEmail(email: string) {
    const cleanEmail = (email || '').trim();
    const customer = await prisma.khach_hang.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } }
    });
    if (customer) {
      return {
        ...customer,
        vai_tro_id: 1
      };
    }
    return null;
  }

  async findActiveCustomerByEmail(email: string) {
    const cleanEmail = (email || '').trim();
    const customer = await prisma.khach_hang.findFirst({
      where: {
        email: { equals: cleanEmail, mode: 'insensitive' },
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

  async createUser(data: {
    ho_ten: string;
    email: string;
    so_dien_thoai: string;
    mat_khau_hash: string;
    gioi_tinh: string;
    ngay_sinh: Date;
    dia_chi?: string;
    ngay_dong_y_dieu_khoan: Date;
  }) {
    return prisma.khach_hang.create({
      data: {
        ho_ten: data.ho_ten,
        email: data.email,
        so_dien_thoai: data.so_dien_thoai,
        mat_khau_hash: data.mat_khau_hash,
        gioi_tinh: data.gioi_tinh,
        ngay_sinh: data.ngay_sinh,
        dia_chi: data.dia_chi,
        trang_thai: 'cho_kich_hoat',
        ngay_dong_y_dieu_khoan: data.ngay_dong_y_dieu_khoan,
      },
      select: {
        id: true,
        email: true,
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
          anh_dai_dien: true,
          ho_so_chuyen_gia: {
            select: {
              so_nam_kinh_nghiem: true,
              bang_cap_chung_chi: true,
              mo_ta: true,
              the_manh: true
            }
          }
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
        gioi_tinh: true,
        ngay_sinh: true,
        ngay_dong_y_dieu_khoan: true,
        dia_chi: true,
        mat_khau_hash: true,
        phai_doi_mat_khau: true
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

  async updateLastLogin(_userId: string | number) {
    // No last login timestamp column in DB schema
  }
}

export default new AuthAccountRepository();

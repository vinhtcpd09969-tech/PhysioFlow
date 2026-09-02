import prisma from '../../config/prisma';

export class AdminArticleRepository {
  async getAll(filter: { danh_muc?: string; trang_thai?: string; search?: string } = {}) {
    return prisma.bai_viet.findMany({
      where: {
        ...(filter.danh_muc && { danh_muc: filter.danh_muc }),
        ...(filter.trang_thai && { trang_thai: filter.trang_thai }),
        ...(filter.search && { tieu_de: { contains: filter.search, mode: 'insensitive' } })
      },
      include: { nguoi_dung: { select: { ho_ten: true } } },
      orderBy: { ngay_cap_nhat: 'desc' }
    });
  }

  async getById(id: string) {
    return prisma.bai_viet.findUnique({
      where: { id },
      include: { nguoi_dung: { select: { ho_ten: true } } }
    });
  }

  async findBySlugExcludingId(slug: string, excludeId?: string) {
    return prisma.bai_viet.findFirst({
      where: { slug, ...(excludeId && { id: { not: excludeId } }) }
    });
  }

  async create(data: any) {
    return prisma.bai_viet.create({
      data: {
        ...data,
        ngay_tao: new Date(),
        ngay_cap_nhat: new Date()
      }
    });
  }

  async update(id: string, data: any) {
    return prisma.bai_viet.update({
      where: { id },
      data: {
        ...data,
        ngay_cap_nhat: new Date()
      }
    });
  }

  async delete(id: string) {
    return prisma.bai_viet.delete({ where: { id } });
  }

  async incrementViewCount(id: string) {
    return prisma.bai_viet.update({
      where: { id },
      data: { luot_xem: { increment: 1 } }
    });
  }

  async getPublicList(danhMuc?: string) {
    return prisma.bai_viet.findMany({
      where: {
        trang_thai: 'xuat_ban',
        ...(danhMuc && { danh_muc: danhMuc })
      },
      include: { nguoi_dung: { select: { ho_ten: true } } },
      orderBy: { ngay_dang: 'desc' }
    });
  }

  async getPublicBySlug(slug: string) {
    return prisma.bai_viet.findFirst({
      where: { slug, trang_thai: 'xuat_ban' },
      include: { nguoi_dung: { select: { ho_ten: true } } }
    });
  }
}

export default new AdminArticleRepository();

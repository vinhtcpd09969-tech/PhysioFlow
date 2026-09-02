import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { updateCustomer, toggleCustomerLock, getCustomerLockImpact } from '../../../api/admin.api';
import { validateEmail } from '../../../../../utils/validators';
import type { CustomerLockImpact } from '../types';

export interface CustomerEditForm {
  ho_ten: string;
  so_dien_thoai: string;
  email: string;
  gioi_tinh: string;
  dia_chi: string;
  ngay_sinh: string;
}

const EMPTY_FORM: CustomerEditForm = {
  ho_ten: '', so_dien_thoai: '', email: '', gioi_tinh: 'khac', dia_chi: '', ngay_sinh: ''
};

// Sửa thông tin hành chính + khóa/mở khóa tài khoản — dùng ConfirmDialog thay window.confirm cho
// đúng convention xác nhận của codebase.
export function useCustomerActions(onChanged: () => void) {
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CustomerEditForm>(EMPTY_FORM);
  const [lockTarget, setLockTarget] = useState<{ id: string; ho_ten: string; isLocked: boolean } | null>(null);
  const [lockImpact, setLockImpact] = useState<CustomerLockImpact | null>(null);
  const [lockImpactLoading, setLockImpactLoading] = useState(false);

  const startEdit = (customer: any) => {
    setEditingCustomerId(customer.id);
    setEditForm({
      ho_ten: customer.ho_ten || '',
      so_dien_thoai: customer.so_dien_thoai || '',
      email: customer.email || '',
      gioi_tinh: customer.gioi_tinh || 'khac',
      dia_chi: customer.dia_chi || '',
      ngay_sinh: customer.ngay_sinh ? format(new Date(customer.ngay_sinh), 'yyyy-MM-dd') : ''
    });
  };

  const cancelEdit = () => setEditingCustomerId(null);

  const saveProfile = async () => {
    if (!editingCustomerId) return;

    if (!editForm.ho_ten || editForm.ho_ten.trim().length < 2) {
      toast.error('Họ tên khách hàng phải có ít nhất 2 ký tự.');
      return;
    }

    if (editForm.so_dien_thoai) {
      const phoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
      if (!phoneRegex.test(editForm.so_dien_thoai.trim())) {
        toast.error('Số điện thoại không hợp lệ (phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09).');
        return;
      }
    }

    if (editForm.email) {
      const emailRes = validateEmail(editForm.email.trim());
      if (!emailRes.isValid) {
        toast.error(emailRes.message || 'Địa chỉ email không đúng định dạng.');
        return;
      }
    }

    try {
      const payload = {
        ...editForm,
        ho_ten: editForm.ho_ten.trim(),
        email: editForm.email ? editForm.email.trim().toLowerCase() : null,
        so_dien_thoai: editForm.so_dien_thoai ? editForm.so_dien_thoai.trim() : null,
      };
      await updateCustomer(editingCustomerId, payload);
      toast.success('Đã cập nhật thông tin khách hàng thành công!');
      setEditingCustomerId(null);
      onChanged();
    } catch (error: any) {
      console.error('Failed to update customer:', error);
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin khách hàng.';
      toast.error(msg);
    }
  };

  // Khóa không còn bị chặn cứng theo lịch hẹn/gói liệu trình (xem admin.controller.ts) — chỉ tra
  // thêm thông tin này để CẢNH BÁO admin trong dialog xác nhận, không dùng để ngăn thao tác.
  const requestToggleLock = (customer: any) => {
    const willLock = customer.trang_thai !== 'vo_hieu';
    setLockTarget({ id: customer.id, ho_ten: customer.ho_ten, isLocked: willLock });
    setLockImpact(null);
    if (willLock) {
      setLockImpactLoading(true);
      getCustomerLockImpact(customer.id)
        .then(res => setLockImpact(res.data))
        .catch(() => setLockImpact(null))
        .finally(() => setLockImpactLoading(false));
    }
  };
  const cancelToggleLock = () => {
    setLockTarget(null);
    setLockImpact(null);
  };

  const confirmToggleLock = async () => {
    if (!lockTarget) return;
    try {
      await toggleCustomerLock(lockTarget.id, lockTarget.isLocked);
      toast.success(lockTarget.isLocked ? 'Đã khóa tài khoản khách hàng thành công' : 'Đã mở khóa tài khoản khách hàng thành công');
      setLockTarget(null);
      setLockImpact(null);
      onChanged();
    } catch (error: any) {
      console.error('Failed to toggle customer lock:', error);
      setLockTarget(null);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi thực hiện thao tác.', {
        style: {
          background: '#E11D48',
          color: '#FFFFFF',
          fontWeight: 700,
          fontSize: '13px',
          borderRadius: '16px',
          padding: '12px 16px',
          boxShadow: '0 20px 25px -5px rgba(225, 29, 72, 0.3)'
        },
        iconTheme: {
          primary: '#FFFFFF',
          secondary: '#E11D48',
        },
        duration: 6000,
      });
    }
  };

  return {
    editingCustomerId, editForm, setEditForm, startEdit, cancelEdit, saveProfile,
    lockTarget, lockImpact, lockImpactLoading, requestToggleLock, cancelToggleLock, confirmToggleLock
  };
}

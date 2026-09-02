import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  getStaff,
  createStaff,
  updateStaffStatus,
  deleteStaffAvatar,
} from '../../api/admin.api';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';
import { StaffTable } from './components/StaffTable';
import { CreateStaffModal, StaffFormValues } from './components/CreateStaffModal';
import { StaffDetailView } from './components/StaffDetailView';

export default function ManageStaff() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | '2' | '3' | '4' | '5' | '6'>('all');

  // Edit / Details Screen State
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Confirmation dialogs state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string | React.ReactNode;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  } | null>(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await getStaff();
      setStaffList(res.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Không thể tải danh sách nhân sự.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleOpenDetails = (staff: any) => {
    setSelectedStaff(staff);
  };

  const handleToggleStatus = (staff: any) => {
    const isCurrentlyActive = staff.trang_thai === 'hoat_dong';
    const newStatus = isCurrentlyActive ? 'vo_hieu' : 'hoat_dong';
    const actionLabel = isCurrentlyActive ? 'khóa' : 'mở khóa';

    setConfirmConfig({
      isOpen: true,
      title: isCurrentlyActive ? 'Xác nhận khóa tài khoản' : 'Xác nhận mở khóa tài khoản',
      type: isCurrentlyActive ? 'danger' : 'info',
      message: (
        <div className="space-y-2">
          <p>
            Bạn có chắc chắn muốn <span className="font-black text-rose-600 dark:text-rose-400">{actionLabel}</span> tài khoản nhân sự{' '}
            <strong>{staff.ho_ten}</strong> ({staff.email})?
          </p>
          {isCurrentlyActive && (
            <p className="text-xs text-zinc-500">
              * Nhân viên này sẽ không thể đăng nhập hoặc nhận các ca chỉ định điều trị mới cho đến khi được kích hoạt lại.
            </p>
          )}
        </div>
      ),
      onConfirm: async () => {
        try {
          await updateStaffStatus(staff.id, newStatus);
          toast.success(`Đã ${actionLabel} tài khoản ${staff.ho_ten} thành công.`);
          fetchStaff();
          if (selectedStaff && selectedStaff.id === staff.id) {
            setSelectedStaff({ ...selectedStaff, trang_thai: newStatus });
          }
        } catch (error: any) {
          console.error(`Error toggling staff status:`, error);
          toast.error(error.response?.data?.message || `Không thể ${actionLabel} tài khoản nhân sự.`);
        } finally {
          setConfirmConfig(null);
        }
      }
    });
  };

  const handleDeleteAvatar = (staff: any) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận xóa ảnh đại diện',
      type: 'danger',
      message: (
        <p>
          Bạn có chắc chắn muốn xóa ảnh đại diện của nhân sự <strong>{staff.ho_ten}</strong>?
        </p>
      ),
      onConfirm: async () => {
        try {
          await deleteStaffAvatar(staff.id);
          toast.success('Đã xóa ảnh đại diện.');
          fetchStaff();
          if (selectedStaff && selectedStaff.id === staff.id) {
            setSelectedStaff({ ...selectedStaff, anh_dai_dien: null });
          }
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Lỗi khi xóa ảnh đại diện.');
        } finally {
          setConfirmConfig(null);
        }
      }
    });
  };

  const onCreateSubmit = async (data: StaffFormValues) => {
    try {
      await createStaff(data);
      toast.success('Tạo tài khoản nhân sự thành công!');
      setIsCreateOpen(false);
      fetchStaff();
    } catch (error: any) {
      console.error('Error creating staff:', error);
      const errMsg = error.response?.data?.message || 'Có lỗi xảy ra khi tạo nhân sự';
      toast.error(errMsg);
    }
  };

  return (
    <div className="space-y-6 pb-8 text-zinc-800 font-sans text-sm min-h-[600px] animate-in fade-in duration-300">
      {selectedStaff ? (
        <StaffDetailView
          selectedStaff={selectedStaff}
          setSelectedStaff={setSelectedStaff}
          setStaffList={setStaffList}
          onToggleStatus={handleToggleStatus}
          onDeleteAvatar={handleDeleteAvatar}
        />
      ) : (
        <StaffTable
          staffList={staffList}
          loading={loading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedRoleFilter={selectedRoleFilter}
          setSelectedRoleFilter={setSelectedRoleFilter}
          onOpenCreate={() => setIsCreateOpen(true)}
          onOpenDetails={handleOpenDetails}
          onToggleStatus={handleToggleStatus}
          onDeleteAvatar={handleDeleteAvatar}
        />
      )}

      <CreateStaffModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={onCreateSubmit}
      />

      <ConfirmDialog
        isOpen={!!confirmConfig?.isOpen}
        title={confirmConfig?.title || ''}
        message={confirmConfig?.message || ''}
        type={confirmConfig?.type}
        onConfirm={confirmConfig?.onConfirm || (() => {})}
        onCancel={() => setConfirmConfig(null)}
      />
    </div>
  );
}

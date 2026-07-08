import { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../../api/admin.api';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: any[];
  packages: any[];
  fetchData: () => void;
  setConfirmConfig: (config: any) => void;
}

export function CategoryManagerModal({
  isOpen,
  onClose,
  categories,
  packages,
  fetchData,
  setConfirmConfig
}: CategoryManagerModalProps) {
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatType, setNewCatType] = useState<'KHAM' | 'LE' | 'LIEU_TRINH'>('LIEU_TRINH');

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [editingCatDesc, setEditingCatDesc] = useState('');
  const [editingCatType, setEditingCatType] = useState<'KHAM' | 'LE' | 'LIEU_TRINH'>('LIEU_TRINH');

  if (!isOpen) return null;

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      toast.error('Vui lòng nhập tên danh mục!');
      return;
    }
    setConfirmConfig({
      isOpen: true,
      title: 'Tạo danh mục mới',
      message: `Bạn có chắc chắn muốn tạo mới danh mục "${newCatName.trim()}" không?`,
      type: 'info',
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          await createCategory({
            ten_danh_muc: newCatName.trim(),
            mo_ta: newCatDesc.trim(),
            loai_goi_ap_dung: newCatType
          });
          toast.success(`Tạo danh mục "${newCatName.trim()}" thành công!`);
          setNewCatName('');
          setNewCatDesc('');
          fetchData();
        } catch (error) {
          console.error('Error creating category:', error);
          toast.error('Có lỗi xảy ra khi tạo danh mục mới.');
        }
      }
    });
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editingCatName.trim()) {
      toast.error('Tên danh mục không được để trống!');
      return;
    }
    setConfirmConfig({
      isOpen: true,
      title: 'Cập nhật danh mục',
      message: `Bạn có chắc chắn muốn lưu các thay đổi cho danh mục này không?`,
      type: 'info',
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          await updateCategory(id, {
            ten_danh_muc: editingCatName.trim(),
            mo_ta: editingCatDesc.trim(),
            loai_goi_ap_dung: editingCatType
          });
          toast.success('Cập nhật danh mục thành công!');
          setEditingCatId(null);
          fetchData();
        } catch (error) {
          console.error('Error updating category:', error);
          toast.error('Có lỗi xảy ra khi cập nhật danh mục.');
        }
      }
    });
  };

  const handleDeleteCategory = async (cat: any) => {
    const isUsed = packages.some((pkg: any) => String(pkg.danh_muc_id) === String(cat.id));
    if (isUsed) {
      toast.error(`Không thể xóa danh mục "${cat.ten_danh_muc}" vì hiện tại có gói dịch vụ đang sử dụng danh mục này!`);
      return;
    }
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa danh mục',
      message: `Bạn có chắc chắn muốn xóa danh mục chuyên khoa "${cat.ten_danh_muc}" không?`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          await deleteCategory(cat.id);
          toast.success(`Xóa danh mục "${cat.ten_danh_muc}" thành công!`);
          fetchData();
        } catch (error) {
          console.error('Error deleting category:', error);
          toast.error('Có lỗi xảy ra khi xóa danh mục.');
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white border border-zinc-150 rounded-3xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col text-xs text-secondary">
        
        {/* Modal Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-zinc-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-teal-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="font-heading font-black text-sm uppercase text-slate-800">QUẢN LÝ DANH MỤC GÓI Y KHOA</h3>
          </div>
          <button 
            onClick={() => {
              onClose();
              setEditingCatId(null);
            }}
            className="text-zinc-500 hover:text-slate-700 font-bold border border-zinc-200 hover:border-zinc-300 px-3 py-1.5 rounded-xl bg-white shadow-sm transition-all"
          >
            [ ĐÓNG ]
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* FORM THÊM MỚI DANH MỤC */}
          <div className="p-4 border border-zinc-150 rounded-2xl bg-slate-50/50 space-y-3">
            <h4 className="font-bold text-[10px] text-teal-700 uppercase tracking-wider">Tạo mới Danh mục Chuyên khoa</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <input 
                  type="text" 
                  placeholder="Tên danh mục..." 
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl outline-none focus:border-teal-600 font-bold text-xs"
                />
              </div>
              <div>
                <input 
                  type="text" 
                  placeholder="Mô tả ngắn..." 
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl outline-none focus:border-teal-600 text-xs"
                />
              </div>
              <div>
                <select
                  value={newCatType}
                  onChange={(e) => setNewCatType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl outline-none focus:border-teal-600 font-semibold text-xs cursor-pointer"
                >
                  <option value="KHAM">Áp dụng: Khám</option>
                  <option value="LE">Áp dụng: Lẻ</option>
                  <option value="LIEU_TRINH">Áp dụng: Liệu trình</option>
                </select>
              </div>
              <button
                onClick={handleCreateCategory}
                className="px-4 py-2 bg-teal-650 hover:bg-teal-700 text-white font-bold rounded-xl shadow transition-all active:scale-95 text-center text-xs"
              >
                THÊM MỚI
              </button>
            </div>
          </div>

          {/* DANH SÁCH DANH MỤC HIỆN TẠI */}
          <div className="space-y-3">
            <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Danh sách hiện tại ({categories.length})</h4>
            
            <div className="divide-y divide-zinc-100 max-h-[300px] overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div key={cat.id} className="py-3.5 flex items-center justify-between gap-4">
                  {editingCatId === cat.id ? (
                    /* Edit Mode Row */
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <input 
                        type="text" 
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        className="px-2 py-1 bg-white border border-teal-600 rounded-lg outline-none font-bold text-xs"
                      />
                      <input 
                        type="text" 
                        value={editingCatDesc}
                        onChange={(e) => setEditingCatDesc(e.target.value)}
                        className="px-2 py-1 bg-white border border-teal-600 rounded-lg outline-none text-xs"
                      />
                      <select
                        value={editingCatType}
                        onChange={(e) => setEditingCatType(e.target.value as any)}
                        className="px-2 py-1 bg-white border border-teal-600 rounded-lg outline-none text-xs cursor-pointer"
                      >
                        <option value="KHAM">Khám</option>
                        <option value="LE">Lẻ</option>
                        <option value="LIEU_TRINH">Liệu trình</option>
                      </select>
                    </div>
                  ) : (
                    /* Read Mode Row */
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800 text-xs uppercase">{cat.ten_danh_muc}</p>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${
                          cat.loai_goi_ap_dung === 'KHAM'
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                            : cat.loai_goi_ap_dung === 'LE'
                              ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-sm'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                        }`}>
                          {cat.loai_goi_ap_dung === 'KHAM' ? 'KHÁM' : cat.loai_goi_ap_dung === 'LE' ? 'LẺ' : 'LIỆU TRÌNH'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-450 mt-0.5">{cat.mo_ta || 'Không có mô tả.'}</p>
                    </div>
                  )}

                  {/* CRUD Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    {editingCatId === cat.id ? (
                      <>
                        <button 
                          onClick={() => handleUpdateCategory(cat.id)}
                          className="px-2.5 py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-[10px] transition-all hover:bg-emerald-700"
                        >
                          LƯU
                        </button>
                        <button 
                          onClick={() => setEditingCatId(null)}
                          className="px-2.5 py-1.5 bg-zinc-100 text-slate-550 font-bold rounded-lg text-[10px] transition-all hover:bg-zinc-200"
                        >
                          HỦY
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => {
                            setEditingCatId(cat.id);
                            setEditingCatName(cat.ten_danh_muc);
                            setEditingCatDesc(cat.mo_ta || '');
                            setEditingCatType(cat.loai_goi_ap_dung || 'LIEU_TRINH');
                          }}
                          className="px-2.5 py-1.5 border border-zinc-200 hover:border-teal-350 hover:bg-teal-50 text-slate-650 hover:text-teal-700 font-bold rounded-lg text-[10px] transition-all"
                        >
                          SỬA
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(cat)}
                          className="px-2.5 py-1.5 border border-zinc-200 hover:border-rose-350 hover:bg-rose-50 text-slate-405 hover:text-rose-600 font-bold rounded-lg text-[10px] transition-all"
                        >
                          XÓA
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

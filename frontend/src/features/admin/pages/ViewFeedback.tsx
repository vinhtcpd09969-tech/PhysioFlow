import { useEffect, useState } from 'react';
import api from '../../../api/axios';

interface Feedback {
  id: string;
  ten_khach_hang: string;
  ten_ky_thuat_vien: string;
  ten_dich_vu: string;
  so_sao_tong: number;
  so_sao_ktv: number;
  nhan_xet: string;
  hieu_qua_dieu_tri: string;
  thoi_gian_danh_gia: string;
}

export default function ViewFeedback() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const res = await api.get('/admin/feedback');
      setFeedbacks(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Lỗi khi tải đánh giá:', error);
    }
  };

  const renderStars = (feedbackId: string, count: number) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <span key={`${feedbackId}-star-${i}`} className={i < count ? 'text-amber-400' : 'text-zinc-200'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const formatDate = (isoString: string) => {
    if (!isClient) return ''; 
    const d = new Date(isoString);
    return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN')}`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-secondary tracking-tight">Đánh giá & Phản hồi</h1>
        <p className="text-zinc-500 mt-1">Xem ý kiến của khách hàng về dịch vụ và kỹ thuật viên.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {feedbacks.map((f) => (
          <div key={f.id} className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 text-xl shadow-inner">
                  👤
                </div>
                <div>
                  <h3 className="font-semibold text-secondary">{f.ten_khach_hang}</h3>
                  <p className="text-xs text-zinc-400 font-medium">{formatDate(f.thoi_gian_danh_gia)}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Dịch vụ</div>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg uppercase tracking-tight">{f.ten_dich_vu}</span>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div className="flex items-center justify-between bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100">
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Đánh giá chung</p>
                  {renderStars(f.id, f.so_sao_tong)}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">KTV: <span className="text-secondary">{f.ten_ky_thuat_vien}</span></p>
                  {renderStars(`${f.id}-ktv`, f.so_sao_ktv)}
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Nhận xét:</p>
                <div className="relative">
                  <span className="absolute -top-2 -left-2 text-4xl text-primary/10 font-serif leading-none">"</span>
                  <p className="text-secondary leading-relaxed bg-primary/5 p-6 rounded-2xl border border-primary/10 italic text-[15px]">
                    {f.nhan_xet || 'Khách hàng không để lại bình luận.'}
                  </p>
                </div>
              </div>

              {f.hieu_qua_dieu_tri && (
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Hiệu quả:</span>
                  <span className="text-[10px] font-bold text-secondary bg-secondary/5 px-2 py-0.5 rounded-md uppercase tracking-tight">{f.hieu_qua_dieu_tri}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

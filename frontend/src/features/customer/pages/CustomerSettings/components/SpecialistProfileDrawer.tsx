import React from 'react';
import { Sparkles, ArrowLeft, BadgeCheck, Tag, Trash2, Award, FileText, Upload, Save, Loader2 } from 'lucide-react';

interface SpecialistProfileDrawerProps {
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  soNamKinhNghiem: number;
  setSoNamKinhNghiem: (val: number) => void;
  moTa: string;
  setMoTa: (val: string) => void;
  moTaTab: 'edit' | 'preview';
  setMoTaTab: (val: 'edit' | 'preview') => void;
  theManh: string[];
  theManhInput: string;
  setTheManhInput: (val: string) => void;
  addTheManh: () => void;
  removeTheManh: (idx: number) => void;
  bangCapChungChi: string;
  setBangCapChungChi: (val: string) => void;
  anhChungChiList: string[];
  handleCertFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeCertImage: (idx: number) => void;
}

export const SpecialistProfileDrawer: React.FC<SpecialistProfileDrawerProps> = ({
  onBack,
  onSubmit,
  loading,
  soNamKinhNghiem,
  setSoNamKinhNghiem,
  moTa,
  setMoTa,
  moTaTab,
  setMoTaTab,
  theManh,
  theManhInput,
  setTheManhInput,
  addTheManh,
  removeTheManh,
  bangCapChungChi,
  setBangCapChungChi,
  anhChungChiList,
  handleCertFileChange,
  removeCertImage
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-teal-600 animate-pulse" />
          <h3 className="text-xs font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
            Hồ sơ năng lực chuyên môn
          </h3>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-teal-600 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          Quay lại thông tin cơ bản
        </button>
      </div>

      <div className="space-y-6">
        {/* Row 1: Experience Years */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
            Số năm kinh nghiệm làm việc thực tế
          </label>
          <div className="flex items-center gap-3">
            <input 
              type="number" 
              value={soNamKinhNghiem}
              onChange={(e) => setSoNamKinhNghiem(Math.max(0, parseInt(e.target.value) || 0))}
              min="0"
              className="w-24 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-200 font-bold outline-none text-center focus:ring-2 focus:ring-teal-500/20"
            />
            <span className="text-xs text-slate-600 dark:text-zinc-400 font-semibold">năm hoạt động lâm sàng</span>
          </div>
        </div>

        {/* Row 2: Description with Tabs & Live Preview */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-1.5">
            <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <BadgeCheck size={14} className="text-teal-600" />
              Mô tả tóm tắt hồ sơ năng lực chuyên môn
            </label>
            
            {/* Selector Tabs */}
            <div className="flex bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5 w-fit select-none">
              <button
                type="button"
                onClick={() => setMoTaTab('edit')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  moTaTab === 'edit'
                    ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Chỉnh sửa
              </button>
              <button
                type="button"
                onClick={() => setMoTaTab('preview')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  moTaTab === 'preview'
                    ? 'bg-white dark:bg-zinc-900 text-teal-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Xem trước
              </button>
            </div>
          </div>

          {moTaTab === 'edit' ? (
            <textarea 
              value={moTa}
              onChange={(e) => setMoTa(e.target.value)}
              placeholder="Hãy viết giới thiệu đầy đủ về bản thân, kinh nghiệm điều trị và thế mạnh của bạn..."
              rows={8}
              className="w-full bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 focus:border-teal-500 rounded-2xl px-4 py-3.5 text-xs text-slate-800 dark:text-zinc-200 font-semibold outline-none resize-y leading-relaxed focus:ring-2 focus:ring-teal-500/20"
            />
          ) : (
            <div className="w-full bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 min-h-[200px] transition-all">
              <h4 className="text-xs font-black uppercase tracking-wider text-teal-600 mb-3">
                🔬 HỒ SƠ CHUYÊN MÔN
              </h4>
              <p className="text-slate-700 dark:text-zinc-300 text-xs md:text-sm font-medium leading-relaxed whitespace-pre-line text-left">
                {moTa.trim() || 'Chưa nhập thông tin hồ sơ chuyên môn...'}
              </p>
            </div>
          )}
        </div>

        {/* Row 2.5: Thế mạnh chuyên sâu */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
            <Tag size={13} className="text-teal-600" />
            Thế mạnh chuyên sâu (tối đa 6 thẻ)
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {theManh.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/60 px-3 py-1.5 rounded-xl text-xs font-bold"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTheManh(idx)}
                  className="text-teal-600/60 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Xóa thế mạnh này"
                >
                  <Trash2 size={11} />
                </button>
              </span>
            ))}
            {theManh.length === 0 && (
              <span className="text-[10px] text-slate-400 font-semibold">Chưa có thế mạnh nào được thêm.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={theManhInput}
              onChange={(e) => setTheManhInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTheManh();
                }
              }}
              placeholder="Ví dụ: Trị liệu bằng tay (Manual Therapy)..."
              className="flex-1 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-200 font-semibold outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <button
              type="button"
              onClick={addTheManh}
              className="shrink-0 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 text-teal-700 dark:text-teal-300 border border-teal-200/60 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Thêm
            </button>
          </div>
        </div>

        {/* Row 3: Credentials & Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <Award size={13} className="text-teal-600" />
              Văn bằng / Chứng chỉ y khoa
            </label>
            <textarea 
              value={bangCapChungChi}
              onChange={(e) => setBangCapChungChi(e.target.value)}
              placeholder="Ví dụ: Cử nhân Phục hồi chức năng - Đại học Y Dược..."
              rows={5}
              className="w-full bg-slate-50 dark:bg-zinc-855 border border-slate-200 dark:border-zinc-800 focus:border-teal-500 rounded-2xl px-4 py-3.5 text-xs text-slate-800 dark:text-zinc-200 font-semibold outline-none resize-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <FileText size={13} className="text-teal-600" />
              Tệp ảnh Chứng chỉ đính kèm
            </label>
            
            <div className="grid grid-cols-2 gap-3 min-h-[110px] items-start">
              {anhChungChiList.map((certSrc, idx) => (
                <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 p-0.5 bg-slate-50 dark:bg-zinc-950 group/cert shadow-xs">
                  <img src={certSrc} alt={`Cert ${idx + 1}`} className="size-full object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removeCertImage(idx)}
                    className="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full size-5 flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
                    title="Xóa ảnh chứng chỉ này"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}

              <label className="border-2 border-dashed border-slate-250 dark:border-zinc-800 hover:border-teal-500/60 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50/50 dark:bg-zinc-900/10 hover:bg-teal-50/20 transition-all text-center aspect-video shadow-2xs">
                <Upload size={16} className="text-teal-600" />
                <span className="text-[9px] font-black uppercase text-slate-500 dark:text-zinc-400">Tải tệp ảnh mới</span>
                <input type="file" accept="image/*" onChange={handleCertFileChange} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button for specialist profile */}
      <div className="pt-4">
        <button 
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl text-xs shadow-md shadow-teal-600/20 hover:scale-[1.005] transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Đang cập nhật...
            </>
          ) : (
            <>
              <Save size={16} /> Lưu hồ sơ chuyên môn
            </>
          )}
        </button>
      </div>
    </form>
  );
};

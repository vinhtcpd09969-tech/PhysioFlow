import { Search, Loader2, X, Sparkles } from 'lucide-react';
import { z } from 'zod';
import { validateEmail } from '../../../../utils/validators';

export const phoneRegex = /^(03|05|07|08|09)[0-9]{8}$/;
export const nameRegex = /^[\p{L}\s']{2,}$/u;

export const newCustomerSchema = z.object({
  hoTen: z.string().trim()
    .min(2, 'Họ tên khách hàng phải có ít nhất 2 ký tự.')
    .regex(nameRegex, 'Họ tên khách hàng chỉ được chứa chữ cái và khoảng trắng.'),
  sdt: z.string().trim()
    .regex(phoneRegex, 'Số điện thoại không hợp lệ (phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09).'),
  email: z.string().trim()
    .min(1, 'Email khách hàng là bắt buộc.')
    .superRefine((val, ctx) => {
      const res = validateEmail(val);
      if (!res.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: res.message || 'Địa chỉ email không đúng định dạng.',
        });
      }
    }),
});

export type NewCustomerErrors = Partial<Record<keyof z.infer<typeof newCustomerSchema>, string>>;

interface WalkInCustomerSearchProps {
  isNewCustomer: boolean;
  setIsNewCustomer: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  searchLoading: boolean;
  searchResults: any[];
  selectedCustomer: any;
  onSelectCustomer: (cust: any) => void;
  onClearCustomer: () => void;
  hoTen: string;
  setHoTen: (val: string) => void;
  sdt: string;
  setSdt: (val: string) => void;
  gioiTinh: string;
  setGioiTinh: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  newCustomerErrors: NewCustomerErrors;
  hasReachedLimit: boolean;
}

export function WalkInCustomerSearch({
  isNewCustomer,
  setIsNewCustomer,
  searchQuery,
  setSearchQuery,
  searchLoading,
  searchResults,
  selectedCustomer,
  onSelectCustomer,
  onClearCustomer,
  hoTen,
  setHoTen,
  sdt,
  setSdt,
  gioiTinh,
  setGioiTinh,
  email,
  setEmail,
  newCustomerErrors,
  hasReachedLimit
}: WalkInCustomerSearchProps) {
  return (
    <div className="space-y-4">
      {/* Tab Switch: Khách hàng cũ vs Khách mới */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsNewCustomer(false);
              onClearCustomer();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              !isNewCustomer
                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60'
                : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400'
            }`}
          >
            Khách Đã Có Hồ Sơ
          </button>
          <button
            type="button"
            onClick={() => {
              setIsNewCustomer(true);
              onClearCustomer();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              isNewCustomer
                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60'
                : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400'
            }`}
          >
            + Tiếp Nhận Khách Mới
          </button>
        </div>
      </div>

      {!isNewCustomer ? (
        /* Autocomplete Search */
        <div className="space-y-2">
          {!selectedCustomer ? (
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm khách bằng Tên, Số điện thoại (tối thiểu 2 ký tự)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:border-teal-500"
              />
              {searchLoading && (
                <Loader2 size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-teal-600 animate-spin" />
              )}

              {/* Autocomplete Dropdown List */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl shadow-xl z-50 p-2 max-h-60 overflow-y-auto space-y-1">
                  {searchResults.map((c, index) => (
                    <button
                      key={c.id || c.khach_hang_id || `cust-${index}`}
                      type="button"
                      onClick={() => onSelectCustomer(c)}
                      className="w-full p-2.5 rounded-xl hover:bg-teal-50/80 dark:hover:bg-teal-950/40 text-left transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                          {c.ho_ten.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800 dark:text-zinc-100">{c.ho_ten}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{c.so_dien_thoai || 'Chưa có SĐT'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">Chọn →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Selected Customer Card */
            <div className="p-3.5 bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-sm">
                  {selectedCustomer.ho_ten.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 dark:text-zinc-100">{selectedCustomer.ho_ten}</span>
                    <span className="text-[9px] font-mono text-teal-700 bg-teal-100 dark:bg-teal-900 px-1.5 py-0.5 rounded font-black">
                      #{selectedCustomer.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                    {selectedCustomer.so_dien_thoai} · {selectedCustomer.gioi_tinh === 'nu' ? 'Nữ' : 'Nam'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClearCustomer}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                title="Chọn khách hàng khác"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {hasReachedLimit && (
            <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
              ⚠️ Khách hàng đã có tối đa số lịch hẹn đang hoạt động.
            </p>
          )}
        </div>
      ) : (
        /* Create New Customer Form */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Họ và tên khách hàng *
            </label>
            <input
              type="text"
              placeholder="Nguyễn Văn A..."
              value={hoTen}
              onChange={(e) => setHoTen(e.target.value)}
              className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800/60 border rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 outline-none ${
                newCustomerErrors.hoTen ? 'border-rose-400' : 'border-slate-200 dark:border-zinc-700 focus:border-teal-500'
              }`}
            />
            {newCustomerErrors.hoTen && (
              <p className="text-[10px] text-rose-500 font-bold mt-1">{newCustomerErrors.hoTen}</p>
            )}
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Số điện thoại *
            </label>
            <input
              type="text"
              placeholder="0912345678..."
              value={sdt}
              onChange={(e) => setSdt(e.target.value)}
              className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800/60 border rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 outline-none ${
                newCustomerErrors.sdt ? 'border-rose-400' : 'border-slate-200 dark:border-zinc-700 focus:border-teal-500'
              }`}
            />
            {newCustomerErrors.sdt && (
              <p className="text-[10px] text-rose-500 font-bold mt-1">{newCustomerErrors.sdt}</p>
            )}
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Địa chỉ email *
            </label>
            <input
              type="email"
              placeholder="khachhang@gmail.com..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800/60 border rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 outline-none ${
                newCustomerErrors.email ? 'border-rose-400' : 'border-slate-200 dark:border-zinc-700 focus:border-teal-500'
              }`}
            />
            {newCustomerErrors.email && (
              <p className="text-[10px] text-rose-500 font-bold mt-1">{newCustomerErrors.email}</p>
            )}
            {validateEmail(email).suggestion && (
              <button
                type="button"
                onClick={() => {
                  const sug = validateEmail(email).suggestion;
                  if (sug) setEmail(sug);
                }}
                className="mt-1.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 text-teal-700 dark:text-teal-300 text-[10px] font-bold hover:bg-teal-100 transition-colors cursor-pointer text-left"
              >
                <Sparkles size={12} className="shrink-0 text-teal-600 animate-pulse" />
                <span>Gợi ý sửa: <strong>{validateEmail(email).suggestion}</strong> (Bấm để áp dụng)</span>
              </button>
            )}
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Giới tính
            </label>
            <div className="flex gap-2">
              {['nam', 'nu'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGioiTinh(g)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                    gioiTinh === g
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
                  }`}
                >
                  {g === 'nam' ? 'Nam' : 'Nữ'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

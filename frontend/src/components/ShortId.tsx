import React, { useState } from 'react';

interface ShortIdProps {
  id: string | number;
  /** Số ký tự hiển thị khi rút gọn (mặc định: 8) */
  length?: number;
  /** CSS class thêm vào */
  className?: string;
  /** Prefix hiển thị trước id rút gọn (VD: "#") */
  prefix?: string;
}

/**
 * Hiển thị UUID rút gọn (8 ký tự đầu) với tooltip full ID khi hover.
 * Dùng cho các bảng admin cần hiển thị ID dễ đọc hơn.
 *
 * @example
 * <ShortId id="cb6991bc-aba9-4ab9-9442-7b6df6aa397d" />
 * // Hiển thị: cb6991bc... (hover → full UUID)
 */
const ShortId: React.FC<ShortIdProps> = ({
  id,
  length = 8,
  className = '',
  prefix = '',
}) => {
  const [copied, setCopied] = useState(false);
  const fullId = String(id);
  // UUID rút gọn: lấy phần đầu trước dấu '-' thứ nhất, hoặc slice nếu không có '-'
  const short = fullId.includes('-') ? fullId.split('-')[0] : fullId.slice(0, length);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(fullId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <span
      className={`
        group relative inline-flex items-center gap-1 cursor-pointer select-none
        font-mono text-[11px] font-bold tracking-wider
        bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700
        px-1.5 py-0.5 rounded transition-all duration-150
        ${className}
      `}
      onClick={handleCopy}
      title={`Full ID: ${fullId}\nClick để copy`}
    >
      {prefix && <span className="text-slate-400 font-normal">{prefix}</span>}
      <span>{short}</span>
      <span className="text-slate-300 text-[9px]">···</span>

      {/* Tooltip hiện full UUID khi hover */}
      <span
        className="
          pointer-events-none absolute bottom-full left-0 mb-1.5 z-50
          bg-slate-900 text-white font-mono text-[10px] font-normal
          px-2 py-1 rounded whitespace-nowrap shadow-lg
          opacity-0 group-hover:opacity-100 transition-opacity duration-150
        "
      >
        {copied ? (
          <span className="text-emerald-400 font-bold">✓ Đã copy!</span>
        ) : (
          fullId
        )}
      </span>
    </span>
  );
};

export default ShortId;

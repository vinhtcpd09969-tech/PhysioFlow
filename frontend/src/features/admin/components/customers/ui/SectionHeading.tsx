import type { ReactNode } from 'react';

interface SectionHeadingProps {
  icon: ReactNode;
  label: string;
  count: number;
  countLabel: string;
}

// Tiêu đề khối cho tab "Hồ sơ điều trị" — trước đây chỉ là 1 dòng chữ trần (rc-display text-base),
// dễ bị lướt qua. Thêm icon badge + số lượng dạng pill + đường kẻ phân cách để rõ ràng đây là 1
// khối card lớn, không phải chú thích phụ.
export function SectionHeading({ icon, label, count, countLabel }: SectionHeadingProps) {
  return (
    <div className="recovery-arc-scope flex items-center gap-3 pb-3 mb-1" style={{ borderBottom: '1px solid var(--rc-line)' }}>
      <div
        className="size-8 rounded-[10px] flex items-center justify-center shrink-0"
        style={{ background: 'var(--rc-sage-soft)', color: 'var(--rc-sage)' }}
      >
        {icon}
      </div>
      <h3 className="rc-display text-base font-semibold flex-1" style={{ color: 'var(--rc-ink)' }}>
        {label}
      </h3>
      <span
        className="rc-mono text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
        style={{ background: 'var(--rc-track)', color: 'var(--rc-taupe)' }}
      >
        {count} {countLabel}
      </span>
    </div>
  );
}

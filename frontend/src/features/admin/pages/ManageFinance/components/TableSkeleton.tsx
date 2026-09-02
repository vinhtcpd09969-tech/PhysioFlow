interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

// Skeleton dạng hàng bảng — thay cho spinner tròn giữa màn hình (vi phạm docs/DESIGN_SYSTEM.md).
// Dùng animate-shimmer đã khai báo sẵn trong tailwind.config.js nhưng trước giờ chưa ai dùng.
export function TableSkeleton({ columns, rows = 6 }: TableSkeletonProps) {
  return (
    <div className="divide-y divide-zinc-100">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-6 py-4.5 flex items-center gap-6">
          {Array.from({ length: columns }).map((_, c) => (
            <div
              key={c}
              className="h-3.5 rounded-lg bg-gradient-to-r from-zinc-100 via-zinc-50 to-zinc-100 bg-[length:200%_100%] animate-shimmer"
              style={{ width: c === 0 ? 90 : c === columns - 1 ? 70 : 120 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default TableSkeleton;

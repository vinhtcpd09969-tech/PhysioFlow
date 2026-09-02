import React from 'react';
import { formatCurrency } from '../../utils/format';
import type { PackageRefundCalculationResult } from '../../utils/billing';

interface PackageRefundBreakdownProps {
  calculation: PackageRefundCalculationResult | Record<string, any>;
  examDateStr?: string;
  className?: string;
}

/**
 * Component hiển thị Bảng tính Hoàn tiền Hủy gói dùng chung cho:
 * - Admin Invoice Detail Modal (Quản lý tài chính)
 * - Customer Invoice Detail Modal (Hóa đơn của tôi)
 * - Patient Dossier Timeline (Hồ sơ phác đồ điều trị)
 */
export const PackageRefundBreakdown: React.FC<PackageRefundBreakdownProps> = ({
  calculation,
  examDateStr,
  className = ''
}) => {
  const calc = (calculation || {}) as any;
  const giaThanhToanGoi = Number(calc.giaThanhToanGoi ?? calc.gia_thanh_toan_goi ?? calc.gia_goc_goi ?? 0);
  const soTienDaDong = Number(calc.soTienDaDong ?? calc.so_tien_da_dong ?? 0);
  const totalSessions = Number(calc.totalSessions ?? calc.tong_so_buoi ?? 1);
  const usedSessions = Number(calc.usedSessions ?? calc.so_buoi_dung ?? calc.so_buoi_da_dung ?? 0);
  const perSessionCost = Number(calc.perSessionCost ?? (totalSessions > 0 ? Math.round(giaThanhToanGoi / totalSessions) : 0));
  const usedSessionsCost = Number(calc.usedSessionsCost ?? calc.chi_phi_buoi_dung ?? (usedSessions * perSessionCost));
  const penaltyPercent = Number(calc.penaltyPercent ?? calc.phi_phat_percent ?? 10);
  const penaltyAmount = Number(calc.penaltyAmount ?? calc.phi_phat_thuc_te ?? Math.round(giaThanhToanGoi * penaltyPercent / 100));
  const examFeeToCharge = Number(calc.examFeeToCharge ?? calc.exam_fee_to_charge ?? 0);
  const totalDeduction = Number(calc.totalDeduction ?? (usedSessionsCost + penaltyAmount + examFeeToCharge));
  const estimatedRefund = Number(calc.estimatedRefund ?? calc.so_tien_hoan_tra ?? Math.max(0, soTienDaDong - totalDeduction));
  const keptRevenue = Number(calc.keptRevenue ?? (soTienDaDong - estimatedRefund));
  const shortfall = Number(calc.shortfall ?? Math.max(0, totalDeduction - soTienDaDong));

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 rounded-xl overflow-hidden shadow-2xs">
        {/* Giá hợp đồng */}
        <div className="flex justify-between items-center px-4 py-2.5 bg-amber-50/50 dark:bg-amber-950/20 border-b border-amber-100/60 dark:border-amber-900/40">
          <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">Giá gói theo hợp đồng</span>
          <span className="text-amber-900 dark:text-amber-200 font-black text-xs">{formatCurrency(giaThanhToanGoi)}</span>
        </div>

        {/* Khách đã đóng */}
        <div className="flex justify-between items-center px-4 py-3 bg-zinc-50/70 dark:bg-zinc-800/40">
          <span className="text-xs font-bold text-zinc-650 dark:text-zinc-300 block">Khách đã đóng</span>
          <span className="text-secondary dark:text-zinc-100 font-black text-sm shrink-0">{formatCurrency(soTienDaDong)}</span>
        </div>

        {/* Các khoản trừ */}
        <div className="px-4 py-3 space-y-3 border-t border-slate-100 dark:border-zinc-800">
          <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-wider">
            Trừ đi các khoản sau:
          </p>

          <div className="flex justify-between items-start gap-3">
            <div className="text-left">
              <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
                {usedSessions}/{totalSessions} buổi khách đã thực hiện
              </p>
              <p className="text-[10px] text-zinc-450 dark:text-zinc-400 font-medium leading-relaxed tabular-nums">
                {formatCurrency(perSessionCost)} × {usedSessions} buổi
              </p>
            </div>
            <span className="text-rose-600 dark:text-rose-400 font-black text-xs shrink-0 tabular-nums">
              −{formatCurrency(usedSessionsCost)}
            </span>
          </div>

          <div className="flex justify-between items-start gap-3">
            <div className="text-left">
              <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">Phí phạt hủy gói giữa chừng</p>
              <p className="text-[10px] text-zinc-450 dark:text-zinc-400 font-medium leading-relaxed tabular-nums">
                {penaltyPercent}% × giá gói sau giảm ({formatCurrency(giaThanhToanGoi)})
              </p>
            </div>
            <span className="text-rose-600 dark:text-rose-400 font-black text-xs shrink-0 tabular-nums">
              −{formatCurrency(penaltyAmount)}
            </span>
          </div>

          {examFeeToCharge > 0 && (
            <div className="flex justify-between items-start gap-3">
              <div className="text-left">
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">Phí buổi Lượng giá kèm theo</p>
                {examDateStr && (
                  <p className="text-[10px] text-zinc-450 dark:text-zinc-400 font-medium leading-relaxed">
                    Ca thực hiện: {examDateStr}
                  </p>
                )}
              </div>
              <span className="text-rose-600 dark:text-rose-400 font-black text-xs shrink-0 tabular-nums">
                −{formatCurrency(examFeeToCharge)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2.5 border-t border-dashed border-zinc-200 dark:border-zinc-700">
            <span className="text-xs font-black text-zinc-700 dark:text-zinc-200">Tổng cộng bị trừ</span>
            <span className="text-rose-600 dark:text-rose-400 font-black text-sm tabular-nums">
              {formatCurrency(totalDeduction)}
            </span>
          </div>
        </div>

        {/* Hoàn lại cho khách */}
        <div
          className={`flex justify-between items-center px-4 py-3.5 border-t-2 ${
            estimatedRefund > 0
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
              : 'bg-zinc-100/70 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700'
          }`}
        >
          <span
            className={`text-xs font-black ${
              estimatedRefund > 0 ? 'text-emerald-800 dark:text-emerald-300' : 'text-zinc-650 dark:text-zinc-400'
            }`}
          >
            Hoàn lại cho khách
          </span>
          <span
            className={`font-black text-base tabular-nums ${
              estimatedRefund > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-450 dark:text-zinc-500'
            }`}
          >
            {formatCurrency(estimatedRefund)}
          </span>
        </div>

        {/* Trung tâm giữ lại */}
        <div className="flex justify-between items-center px-4 py-2.5 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">Trung tâm giữ lại</span>
          <span className="text-secondary dark:text-zinc-100 font-black text-xs tabular-nums">
            {formatCurrency(keptRevenue)}
          </span>
        </div>
      </div>

      {/* Cảnh báo khi không hoàn tiền */}
      {estimatedRefund === 0 && (
        <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 rounded-xl space-y-1 animate-in fade-in duration-200">
          <p className="text-rose-700 dark:text-rose-300 text-xs font-black flex items-center gap-1.5">
            <span>⚠️</span> Không hoàn tiền
          </p>
          <p className="text-[11px] text-rose-800/90 dark:text-rose-300/90 font-semibold leading-relaxed">
            Các khoản phải trừ ({formatCurrency(totalDeduction)}) đã{' '}
            {shortfall > 0 ? 'vượt quá' : 'dùng hết'} số tiền khách đóng ({formatCurrency(soTienDaDong)})
            {shortfall > 0 ? ` — vượt ${formatCurrency(shortfall)}` : ''}. Khách đã dùng {usedSessions}/{totalSessions}{' '}
            buổi của gói nên không thể hoàn tiền.
            {shortfall > 0 && ' Trung tâm KHÔNG truy thu thêm phần vượt này.'}
          </p>
        </div>
      )}
    </div>
  );
};

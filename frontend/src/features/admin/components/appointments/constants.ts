import React from 'react';
import { Clock, CalendarCheck, MapPin, Stethoscope, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export const standardTimeSlots = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
];

export const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  chua_xac_nhan: { label: 'Chưa xác nhận', color: 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-955/10 dark:text-amber-450 dark:border-amber-900/30', icon: React.createElement(Clock, { size: 13, className: "text-amber-500 animate-pulse" }) },
  cho_xac_nhan: { label: 'Chưa xác nhận', color: 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-955/10 dark:text-amber-450 dark:border-amber-900/30', icon: React.createElement(Clock, { size: 13, className: "text-amber-600" }) },
  da_xac_nhan: { label: 'Đã xác nhận', color: 'bg-blue-50 text-blue-700 border-blue-200/50 dark:bg-blue-955/10 dark:text-blue-450 dark:border-blue-900/30', icon: React.createElement(CalendarCheck, { size: 13, className: "text-blue-500" }) },
  da_checkin: { label: 'Đã check-in', color: 'bg-teal-50 text-teal-700 border-teal-200/50 dark:bg-teal-955/10 dark:text-teal-450 dark:border-teal-900/30', icon: React.createElement(MapPin, { size: 13, className: "text-teal-500" }) },
  dang_kham: { label: 'Đang khám', color: 'bg-emerald-50 text-emerald-800 border-emerald-250 dark:bg-emerald-955/10 dark:text-emerald-400 dark:border-emerald-900/30', icon: React.createElement(Stethoscope, { size: 13, className: "text-emerald-500" }) },
  hoan_thanh: { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-800 border-emerald-200/60 dark:bg-emerald-955/20 dark:text-emerald-455 dark:border-emerald-900/30', icon: React.createElement(CheckCircle2, { size: 13, className: "text-emerald-600" }) },
  da_huy: { label: 'Đã hủy', color: 'bg-rose-50 text-rose-700 border-rose-150/40 dark:bg-rose-955/10 dark:text-rose-455 dark:border-rose-900/30', icon: React.createElement(XCircle, { size: 13, className: "text-rose-500" }) },
  khong_den: { label: 'Không đến', color: 'bg-slate-100 text-slate-400 border-slate-200/50 dark:bg-zinc-800/20 dark:text-zinc-500 dark:border-zinc-850/80', icon: React.createElement(AlertTriangle, { size: 13, className: "text-slate-400" }) },
  giu_cho: { label: 'Đang giữ chỗ', color: 'bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-955/10 dark:text-rose-455 dark:border-rose-900/30', icon: React.createElement(Clock, { size: 13, className: "text-rose-500 animate-pulse" }) },
};

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Stethoscope, Package, Search, X } from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PatientDossierTimeline } from '@/features/clinical/components/PatientDossierTimeline';
import { CustomerSummaryCards } from '../../components/customers/ui/CustomerSummaryCards';
import { CustomerTable } from '../../components/customers/ui/CustomerTable';
import { CompletedSingleVisitTable } from '../../components/customers/ui/CompletedSingleVisitTable';
import { TreatmentPlanTable } from '../../components/customers/ui/TreatmentPlanTable';
import { EditCustomerModal } from '../../components/customers/ui/EditCustomerModal';
import { CustomerLockDialogMessage } from '../../components/customers/ui/CustomerLockDialogMessage';
import { useCustomerFilters } from '../../components/customers/hooks/useCustomerFilters';
import { useCustomerListData } from '../../components/customers/hooks/useCustomerListData';
import { useCustomerActions } from '../../components/customers/hooks/useCustomerActions';
import { useCustomerEmr } from '../../components/customers/hooks/useCustomerEmr';
import { useTreatmentPlanFilters } from '../../components/customers/hooks/useTreatmentPlanFilters';
import { useTreatmentPlanListData } from '../../components/customers/hooks/useTreatmentPlanListData';
import { useCompletedSingleVisitData } from '../../components/customers/hooks/useCompletedSingleVisitData';
import { PLAN_STATUS_META } from '../../components/customers/constants';
import type { CustomerOverviewItem, TreatmentPlanStatus } from '../../components/customers/types';

type MainViewMode = 'customer' | 'emr';
type EmrSubTab = 'buoi_le' | 'goi_lieu_trinh';

const CHIP_ORDER: (TreatmentPlanStatus | 'all')[] = ['all', 'dang_dieu_tri', 'qua_han', 'hoan_thanh', 'huy'];

function chipCount(key: TreatmentPlanStatus | 'all', counts: { dang_dieu_tri: number; qua_han: number; hoan_thanh: number; huy: number; tong: number }) {
  if (key === 'all') return counts.dang_dieu_tri + counts.qua_han + counts.hoan_thanh + counts.huy;
  return counts[key] || 0;
}

export default function ManageCustomers() {
  const navigate = useNavigate();
  const [view, setView] = useState<MainViewMode>('customer');
  const [emrSubTab, setEmrSubTab] = useState<EmrSubTab>('buoi_le');

  // Customer List Tab States & Data
  const filters = useCustomerFilters();
  const list = useCustomerListData({
    showLockedOnly: filters.showLockedOnly,
    recordFilter: filters.recordFilter,
    search: filters.debouncedSearch
  });
  const actions = useCustomerActions(list.refetch);
  const emr = useCustomerEmr();

  // Shared Search Input for EMR Tab
  const [emrSearch, setEmrSearch] = useState('');
  const [debouncedEmrSearch, setDebouncedEmrSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedEmrSearch(emrSearch.trim()), 350);
    return () => clearTimeout(t);
  }, [emrSearch]);

  // EMR Sub-tab 1: Lượng giá & Dịch vụ lẻ hoàn thành
  const singleVisits = useCompletedSingleVisitData({
    search: debouncedEmrSearch
  });

  // EMR Sub-tab 2: Gói liệu trình
  const planFilters = useTreatmentPlanFilters();
  const plans = useTreatmentPlanListData({
    activeStatus: planFilters.activeStatus,
    search: debouncedEmrSearch
  });
  const planCounts = list.emrStats?.lieu_trinh || { dang_dieu_tri: 0, qua_han: 0, hoan_thanh: 0, huy: 0, cho_kich_hoat: 0, tong: 0 };

  const handleViewProfile = (customer: CustomerOverviewItem) => emr.openCustomer(customer.id);
  const handleViewPlanProfile = (khachHangId: string, planId: string) =>
    emr.openCustomer(khachHangId, { type: 'plan', id: planId });
  const handleViewVisitProfile = (khachHangId: string, visitId: string) =>
    emr.openCustomer(khachHangId, { type: 'visit', id: visitId });

  return (
    <div className="space-y-5 sm:space-y-6 pb-12">
      {!emr.patient ? (
        <div className="space-y-5 sm:space-y-6 animate-fade-in font-jakarta">
          {/* Master HUD Header Card (Chứa Header + View Mode Switcher + KPI Stats nếu ở tab customer) */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[28px] border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-none relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Top Control Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 relative">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span>
                <span className="text-xs font-black uppercase tracking-wider text-teal-700 dark:text-teal-400">
                  Hồ sơ y tế & Khách hàng
                </span>
              </div>

              {/* Primary View Tab Switcher */}
              <div className="flex bg-slate-100/90 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-inner shrink-0">
                <button
                  type="button"
                  onClick={() => setView('customer')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    view === 'customer'
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Theo khách hàng
                </button>
                <button
                  type="button"
                  onClick={() => setView('emr')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    view === 'emr'
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Hồ sơ điều trị
                </button>
              </div>
            </div>

            {/* Bottom KPI Section (khi ở view customer) */}
            {view === 'customer' && (
              <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
                <CustomerSummaryCards
                  totalCustomers={list.totalCustomers}
                  customersWithoutRecord={list.emrStats?.customers_without_record || 0}
                  activeFilter={filters.recordFilter}
                  onFilterChange={filters.toggleRecordFilter}
                />
              </div>
            )}
          </div>

          {/* VIEW 1: THEO KHÁCH HÀNG */}
          {view === 'customer' && (
            <div className="space-y-4">
              <CustomerTable
                data={list.data}
                loading={list.loading}
                meta={list.meta}
                onPageChange={list.setPage}
                onViewProfile={handleViewProfile}
                onEdit={actions.startEdit}
                onToggleLock={actions.requestToggleLock}
                search={filters.searchInput}
                onSearchChange={filters.setSearchInput}
                showLockedOnly={filters.showLockedOnly}
                onToggleLockedOnly={filters.toggleLockedOnly}
              />
            </div>
          )}

          {/* VIEW 2: HỒ SƠ ĐIỀU TRỊ (GỒM 2 SUB-TABS) */}
          {view === 'emr' && (
            <div className="space-y-4">
              {/* EMR Sub-tabs & Search Toolbar */}
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5">
                {/* Row 1: 2 Sub-tab Pills & Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* 2 Sub-tabs */}
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEmrSubTab('buoi_le')}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        emrSubTab === 'buoi_le'
                          ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs font-bold'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold'
                      }`}
                    >
                      <Stethoscope size={14} className="text-teal-600 dark:text-teal-400" />
                      <span>Lượng giá &amp; Dịch vụ lẻ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEmrSubTab('goi_lieu_trinh')}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        emrSubTab === 'goi_lieu_trinh'
                          ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs font-bold'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold'
                      }`}
                    >
                      <Package size={14} className="text-amber-600 dark:text-amber-400" />
                      <span>Gói liệu trình</span>
                    </button>
                  </div>

                  {/* Search Input for EMR */}
                  <div className="relative flex-1 max-w-md min-w-[240px]">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder={
                        emrSubTab === 'buoi_le'
                          ? 'Tìm theo tên khách hàng, SĐT, dịch vụ, nhân sự…'
                          : 'Tìm theo tên khách hàng, SĐT hoặc tên gói…'
                      }
                      value={emrSearch}
                      onChange={(e) => setEmrSearch(e.target.value)}
                      className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-semibold placeholder:text-slate-400 placeholder:font-normal outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all h-9"
                    />
                    {emrSearch && (
                      <button
                        type="button"
                        onClick={() => setEmrSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Row 2: Status Chips for Gói Liệu Trình Only */}
                {emrSubTab === 'goi_lieu_trinh' && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-[11px] font-semibold text-slate-400 mr-1 shrink-0">
                      Trạng thái:
                    </span>
                    {CHIP_ORDER.map(key => {
                      const isActive = planFilters.activeStatus === key;
                      const count = chipCount(key, planCounts);
                      const label = key === 'all' ? 'Tất cả' : PLAN_STATUS_META[key].label;

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => planFilters.setActiveStatus(key)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer border ${
                            isActive
                              ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 shadow-xs'
                              : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <span>{label}</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                              isActive
                                ? 'bg-teal-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sub-tab 1: Lượng Giá & Dịch Vụ Lẻ Table */}
              {emrSubTab === 'buoi_le' && (
                <CompletedSingleVisitTable
                  data={singleVisits.data}
                  loading={singleVisits.loading}
                  meta={singleVisits.meta}
                  onPageChange={singleVisits.setPage}
                  onViewProfile={handleViewVisitProfile}
                />
              )}

              {/* Sub-tab 2: Gói Liệu Trình Table */}
              {emrSubTab === 'goi_lieu_trinh' && (
                <TreatmentPlanTable
                  data={plans.data}
                  loading={plans.loading}
                  meta={plans.meta}
                  onPageChange={plans.setPage}
                  onViewProfile={handleViewPlanProfile}
                />
              )}
            </div>
          )}
        </div>
      ) : (
        /* Patient Dossier Timeline View */
        <div className="animate-fade-in">
          {emr.loading || !emr.patientInfo ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-14 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
              <div className="size-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 animate-pulse">
                Đang tải hồ sơ điều trị &amp; dòng thời gian...
              </p>
            </div>
          ) : (
            <PatientDossierTimeline
              selectedPatient={emr.patientInfo}
              profile={emr.profile}
              onBack={emr.closeCustomer}
              highlightTarget={emr.highlightTarget}
              onBookNextSession={(plan) => {
                const nextSessionNum = (plan.so_buoi_da_dung || 0) + 1;
                const todayStr = format(new Date(), 'yyyy-MM-dd');
                navigate(`/admin/appointments?khach_hang_id=${emr.patientInfo?.id}&goi_dich_vu_id=${(plan as any).goi_dich_vu_id || ''}&phac_do_id=${plan.id}&buoi=${nextSessionNum}&startDate=${todayStr}&endDate=${todayStr}&view=timeline`);
              }}
            />
          )}
        </div>
      )}

      {/* Edit Customer Profile Modal */}
      <EditCustomerModal
        isOpen={!!actions.editingCustomerId}
        form={actions.editForm}
        onChange={actions.setEditForm}
        onSave={actions.saveProfile}
        onCancel={actions.cancelEdit}
      />

      {/* Lock/Unlock Customer Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!actions.lockTarget}
        type={actions.lockTarget?.isLocked ? 'danger' : 'success'}
        title={actions.lockTarget?.isLocked ? 'Khóa tài khoản khách hàng?' : 'Mở khóa tài khoản khách hàng?'}
        message={
          <CustomerLockDialogMessage
            hoTen={actions.lockTarget?.ho_ten || ''}
            willLock={!!actions.lockTarget?.isLocked}
            impactLoading={actions.lockImpactLoading}
            impact={actions.lockImpact}
          />
        }
        confirmLabel={actions.lockTarget?.isLocked ? 'Khóa tài khoản' : 'Mở khóa'}
        onConfirm={actions.confirmToggleLock}
        onCancel={actions.cancelToggleLock}
      />
    </div>
  );
}

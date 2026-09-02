import { CustomerRosterFilters } from './components/CustomerRosterFilters';
import { CustomerRosterTable } from './components/CustomerRosterTable';
import { CustomerHistoryView } from './components/CustomerHistoryView';
import { useCustomerRosterFilters } from './hooks/useCustomerRosterFilters';
import { useCustomerRosterData } from './hooks/useCustomerRosterData';
import { useCustomerHistory } from './hooks/useCustomerHistory';
import type { CustomerRosterItem } from './types';

export default function CustomerDirectory() {
  const filters = useCustomerRosterFilters();
  const roster = useCustomerRosterData({
    page: filters.page,
    search: filters.debouncedSearch,
    canLienHe: filters.canLienHe,
    staleDays: filters.staleDays,
  });
  const history = useCustomerHistory();

  const handleViewProfile = (customer: CustomerRosterItem) => history.openCustomer(customer.id, filters.staleDays);

  return (
    <div className="space-y-6">
      {!history.customer ? (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Quản lý khách hàng</h2>
            <p className="text-xs font-semibold text-slate-450 mt-1">
              Xem lịch sử khách hàng đã dùng dịch vụ, theo dõi khách đang điều trị lâu ngày chưa quay lại để chủ động liên hệ.
            </p>
          </div>

          <CustomerRosterFilters
            searchInput={filters.searchInput}
            onSearchChange={filters.setSearchInput}
            canLienHe={filters.canLienHe}
            onToggleCanLienHe={() => filters.setCanLienHe((v) => !v)}
            staleDays={filters.staleDays}
            onStaleDaysChange={filters.setStaleDays}
          />

          <CustomerRosterTable
            data={roster.data}
            loading={roster.loading}
            meta={roster.meta}
            staleDays={filters.staleDays}
            onPageChange={filters.setPage}
            onViewProfile={handleViewProfile}
          />
        </div>
      ) : history.loading ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <div className="py-20 text-center text-slate-400 font-semibold text-xs animate-pulse">Đang tải lịch sử khách hàng...</div>
        </div>
      ) : (
        <CustomerHistoryView
          customer={history.customer}
          staleDays={filters.staleDays}
          onBack={history.closeCustomer}
        />
      )}
    </div>
  );
}

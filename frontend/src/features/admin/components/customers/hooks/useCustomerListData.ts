import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getCustomersOverview, getDashboardSummary } from '../../../api/admin.api';
import { DEFAULT_PAGE_SIZE } from '../constants';
import type { CustomerOverviewItem, EmrStats } from '../types';
import type { CustomerRecordFilter } from './useCustomerFilters';

interface UseCustomerListDataParams {
  showLockedOnly: boolean;
  recordFilter: CustomerRecordFilter;
  search: string;
}

export function useCustomerListData({ showLockedOnly, recordFilter, search }: UseCustomerListDataParams) {
  const [data, setData] = useState<CustomerOverviewItem[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: DEFAULT_PAGE_SIZE, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [totalCustomers, setTotalCustomers] = useState(0);
  const [emrStats, setEmrStats] = useState<EmrStats | null>(null);

  const statusKey = [showLockedOnly ? 'locked' : null, recordFilter !== 'all' ? recordFilter : null].filter(Boolean).join(',');

  // Đổi filter/search thì luôn quay về trang 1.
  useEffect(() => {
    setPage(1);
  }, [statusKey, search]);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const status: string[] = [];
      if (showLockedOnly) status.push('locked');
      if (recordFilter !== 'all') status.push(recordFilter);
      const res = await getCustomersOverview({
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        search: search || undefined,
        status: status.length ? status : undefined
      });
      setData(res.data.data || []);
      setMeta(res.data.meta || { page: 1, pageSize: DEFAULT_PAGE_SIZE, total: 0, totalPages: 1 });
    } catch (error) {
      console.error('Error fetching customers overview:', error);
      toast.error('Không thể tải danh sách khách hàng.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusKey]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // emrStats.lieu_trinh nuôi chip filter khối "Gói liệu trình" (tab Hồ sơ điều trị);
  // emrStats.customers_without_record + totalCustomers nuôi 2 card tĩnh (tab Theo khách hàng).
  useEffect(() => {
    getDashboardSummary()
      .then(res => {
        setTotalCustomers(Number(res.data?.total_customers || 0));
        setEmrStats(res.data?.emr_stats || null);
      })
      .catch(err => console.error('Error fetching customer stat cards:', err));
  }, []);

  return {
    data, meta, page, setPage, loading, refetch: fetchList,
    totalCustomers, emrStats
  };
}

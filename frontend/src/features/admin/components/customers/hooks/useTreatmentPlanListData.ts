import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getTreatmentPlansOverview } from '../../../api/admin.api';
import { DEFAULT_PAGE_SIZE } from '../constants';
import type { TreatmentPlanItem, TreatmentPlanStatus } from '../types';

interface UseTreatmentPlanListDataParams {
  activeStatus: TreatmentPlanStatus | 'all';
  search: string;
}

export function useTreatmentPlanListData({ activeStatus, search }: UseTreatmentPlanListDataParams) {
  const [data, setData] = useState<TreatmentPlanItem[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: DEFAULT_PAGE_SIZE, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Đổi filter/search thì luôn quay về trang 1.
  useEffect(() => {
    setPage(1);
  }, [activeStatus, search]);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTreatmentPlansOverview({
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        search: search || undefined,
        status: activeStatus !== 'all' ? activeStatus : undefined
      });
      setData(res.data.data || []);
      setMeta(res.data.meta || { page: 1, pageSize: DEFAULT_PAGE_SIZE, total: 0, totalPages: 1 });
    } catch (error) {
      console.error('Error fetching treatment plans overview:', error);
      toast.error('Không thể tải danh sách liệu trình.');
    } finally {
      setLoading(false);
    }
  }, [page, search, activeStatus]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return { data, meta, page, setPage, loading, refetch: fetchList };
}

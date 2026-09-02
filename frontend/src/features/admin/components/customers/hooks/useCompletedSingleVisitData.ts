import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getCompletedSingleVisits } from '../../../api/admin.api';
import { SINGLE_VISIT_PAGE_SIZE } from '../constants';
import type { CompletedSingleVisitItem } from '../types';

export function useCompletedSingleVisitData(options?: { loai?: 'KHAM' | 'DICH_VU_LE'; search?: string }) {
  const [data, setData] = useState<CompletedSingleVisitItem[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: SINGLE_VISIT_PAGE_SIZE, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Reset to page 1 when search or loai filter changes
  useEffect(() => {
    setPage(1);
  }, [options?.search, options?.loai]);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCompletedSingleVisits({
        page,
        pageSize: SINGLE_VISIT_PAGE_SIZE,
        search: options?.search,
        loai: options?.loai
      });
      setData(res.data.data || []);
      setMeta(res.data.meta || { page: 1, pageSize: SINGLE_VISIT_PAGE_SIZE, total: 0, totalPages: 1 });
    } catch (error) {
      console.error('Error fetching completed single visits:', error);
      toast.error('Không thể tải danh sách ca hoàn thành.');
    } finally {
      setLoading(false);
    }
  }, [page, options?.search, options?.loai]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return { data, meta, page, setPage, loading, refetch: fetchList };
}

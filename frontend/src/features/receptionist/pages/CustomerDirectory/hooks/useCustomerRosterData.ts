import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getCustomerRoster } from '../../../api/receptionist.api';
import type { CustomerRosterItem, RosterMeta } from '../types';

const DEFAULT_PAGE_SIZE = 20;
const EMPTY_META: RosterMeta = { page: 1, pageSize: DEFAULT_PAGE_SIZE, total: 0, totalPages: 1 };

interface UseCustomerRosterDataParams {
  page: number;
  search: string;
  canLienHe: boolean;
  staleDays: number;
}

export function useCustomerRosterData({ page, search, canLienHe, staleDays }: UseCustomerRosterDataParams) {
  const [data, setData] = useState<CustomerRosterItem[]>([]);
  const [meta, setMeta] = useState<RosterMeta>(EMPTY_META);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCustomerRoster({
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        search: search || undefined,
        canLienHe: canLienHe || undefined,
        staleDays,
      });
      setData(res.data?.data || []);
      setMeta(res.data?.meta || EMPTY_META);
    } catch (error) {
      console.error('Lỗi khi tải danh sách khách hàng:', error);
      toast.error('Không thể tải danh sách khách hàng.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, canLienHe, staleDays]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return { data, meta, loading, refetch: fetchList };
}

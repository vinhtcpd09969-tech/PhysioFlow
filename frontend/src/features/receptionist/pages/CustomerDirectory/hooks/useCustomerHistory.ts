import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getCustomerHistory } from '../../../api/receptionist.api';
import type { CustomerHistoryDetail } from '../types';

// Lazy-load lịch sử đầy đủ (gói + cuộc hẹn) của 1 khách hàng — chỉ gọi khi Lễ tân bấm "Xem hồ sơ".
export function useCustomerHistory() {
  const [customer, setCustomer] = useState<CustomerHistoryDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const openCustomer = useCallback(async (customerId: string, staleDays: number) => {
    try {
      setLoading(true);
      const res = await getCustomerHistory(customerId, staleDays);
      setCustomer(res.data);
    } catch (error) {
      console.error('Lỗi khi tải lịch sử khách hàng:', error);
      toast.error('Không thể tải lịch sử khách hàng.');
    } finally {
      setLoading(false);
    }
  }, []);

  const closeCustomer = () => setCustomer(null);

  return { customer, loading, openCustomer, closeCustomer };
}

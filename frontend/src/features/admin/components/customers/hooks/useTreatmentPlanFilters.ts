import { useEffect, useState } from 'react';
import type { TreatmentPlanStatus } from '../types';

// State thuần cho filter tab "Theo liệu trình" — cùng pattern useCustomerFilters (single-select
// status + debounce search), nhưng trục lọc là trạng thái THẬT của 1 gói, không phải tier khách hàng.
export function useTreatmentPlanFilters() {
  const [activeStatus, setActiveStatus] = useState<TreatmentPlanStatus | 'all'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  return { activeStatus, setActiveStatus, searchInput, setSearchInput, debouncedSearch };
}

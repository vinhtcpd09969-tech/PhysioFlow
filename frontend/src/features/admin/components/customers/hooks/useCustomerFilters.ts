import { useEffect, useState } from 'react';

export type CustomerRecordFilter = 'all' | 'no_record';

// State thuần cho filter — không gọi API, chỉ debounce search để hook fetch dữ liệu dùng.
// "khóa tài khoản" và "chưa có hồ sơ điều trị" là 2 trục độc lập (kết hợp AND ở backend).
export function useCustomerFilters() {
  const [showLockedOnly, setShowLockedOnly] = useState(false);
  const [recordFilter, setRecordFilter] = useState<CustomerRecordFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const toggleLockedOnly = () => setShowLockedOnly(prev => !prev);
  // Card "Chưa có hồ sơ điều trị" bấm lại lần 2 để bỏ lọc; card "Tổng khách hàng" luôn reset về 'all'.
  const toggleRecordFilter = (filter: CustomerRecordFilter) =>
    setRecordFilter(prev => (filter === 'all' ? 'all' : prev === filter ? 'all' : filter));

  return {
    showLockedOnly, toggleLockedOnly,
    recordFilter, toggleRecordFilter,
    searchInput, setSearchInput,
    debouncedSearch
  };
}

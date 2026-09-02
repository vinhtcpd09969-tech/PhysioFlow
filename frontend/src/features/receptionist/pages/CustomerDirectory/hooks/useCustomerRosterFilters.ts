import { useEffect, useState } from 'react';

// Debounce ô tìm kiếm 400ms — tránh gọi API mỗi lần gõ phím, khớp trải nghiệm với các trang lọc
// khác trong hệ thống.
export function useCustomerRosterFilters() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [canLienHe, setCanLienHe] = useState(false);
  const [staleDays, setStaleDays] = useState(5);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Đổi bất kỳ filter nào cũng quay về trang 1 — tránh tình trạng đứng ở trang 5 nhưng kết quả lọc
  // mới chỉ có 2 trang.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, canLienHe, staleDays]);

  return {
    searchInput,
    setSearchInput,
    debouncedSearch,
    canLienHe,
    setCanLienHe,
    staleDays,
    setStaleDays,
    page,
    setPage,
  };
}

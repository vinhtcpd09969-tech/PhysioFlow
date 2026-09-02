import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getCustomerInvoices, CustomerInvoice, CustomerPayment } from '../../../api/customer.api';

export function useCustomerInvoices() {
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<CustomerInvoice | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await getCustomerInvoices();
        setInvoices(res.data.invoices);
        setPayments(res.data.payments);
      } catch (err) {
        console.error('Lỗi khi tải hóa đơn của khách hàng:', err);
        toast.error('Không thể tải danh sách hóa đơn.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { invoices, payments, loading, selectedInvoice, setSelectedInvoice };
}

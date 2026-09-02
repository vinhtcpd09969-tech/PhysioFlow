export const VOUCHER_PAYMENT_METHOD_LABELS: Record<string, string> = {
  tra_thang: 'Trả thẳng 100%',
  tung_buoi: 'Trả từng buổi',
};

/** Tóm tắt mảng yeu_cau_thanh_toan thành 1 chuỗi hiển thị — rỗng/chứa 'tat_ca' nghĩa là không giới hạn. */
export function formatVoucherPaymentMethods(yeuCauThanhToan?: string[] | null): string {
  if (!yeuCauThanhToan || yeuCauThanhToan.length === 0 || yeuCauThanhToan.includes('tat_ca')) {
    return '';
  }
  return yeuCauThanhToan.map((v) => VOUCHER_PAYMENT_METHOD_LABELS[v] || v).join(' + ');
}

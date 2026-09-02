export interface InvoicePrintData {
  ma_hoa_don: string;
  ten_khach_hang: string;
  so_dien_thoai?: string;
  ma_khach_hang?: string;
  email?: string;
  ngay_tao: string | Date;
  hinh_thuc_thanh_toan_goi?: string | null;
  trang_thai: string;
  ten_dich_vu?: string;
  so_buoi_goi?: number;
  tong_tien_goc: number | string;
  so_tien_giam_voucher?: number | string;
  tong_tien_thanh_toan: number | string;
  da_thanh_toan: number | string;
  ghi_chu?: string;
}

export interface TransactionPrintData {
  ma_giao_dich: string;
  hoa_don_id?: string;
  ma_hoa_don?: string;
  ten_khach_hang: string;
  so_dien_thoai?: string;
  thoi_gian_giao_dich: string | Date;
  phuong_thuc?: string;
  loai_giao_dich?: string;
  so_tien: number | string;
  ten_dich_vu?: string;
  ghi_chu?: string;
}

function formatVND(value: number | string | undefined): string {
  const num = Number(value || 0);
  return num.toLocaleString('vi-VN') + 'đ';
}

function formatDate(dateInput: string | Date | undefined): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  
  const pad = (n: number) => (n < 10 ? '0' + n : n);
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  const date = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  return `${time} ${date}`;
}

const INVOICE_STATUS_TEXT: Record<string, { label: string; color: string; bg: string }> = {
  da_thanh_toan: { label: 'ĐÃ THANH TOÁN', color: '#047857', bg: '#ecfdf5' },
  dang_tra_tung_buoi: { label: 'TRẢ THEO BUỔI', color: '#b45309', bg: '#fffbeb' },
  chua_thanh_toan: { label: 'CHƯA THANH TOÁN', color: '#be123c', bg: '#fff1f2' },
  da_hoan_tien: { label: 'ĐÃ HOÀN TIỀN', color: '#6b7280', bg: '#f3f4f6' },
  qua_han: { label: 'QUÁ HẠN SỬ DỤNG', color: '#be123c', bg: '#fff1f2' },
  huy_do_qua_han: { label: 'HỦY DO QUÁ HẠN', color: '#be123c', bg: '#fff1f2' },
};

export function generateInvoiceHtml(inv: InvoicePrintData): string {
  const tongGoc = Number(inv.tong_tien_goc || 0);
  const giamGia = Number(inv.so_tien_giam_voucher || 0);
  const tongPhaiTra = Number(inv.tong_tien_thanh_toan || 0);
  const daTra = Number(inv.da_thanh_toan || 0);
  const conLai = Math.max(0, tongPhaiTra - daTra);
  const isPaidFull = conLai === 0 && tongPhaiTra > 0;
  const isRefunded = inv.trang_thai === 'da_hoan_tien';

  const statusMeta = INVOICE_STATUS_TEXT[inv.trang_thai] || {
    label: (inv.trang_thai || 'MẶC ĐỊNH').replace(/_/g, ' ').toUpperCase(),
    color: '#0f766e',
    bg: '#f0fdfa'
  };

  const paymentPlanLabel = inv.hinh_thuc_thanh_toan_goi 
    ? inv.hinh_thuc_thanh_toan_goi.replace(/_/g, ' ').toUpperCase() 
    : 'MỘT LẦN (100%)';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Hóa Đơn ${inv.ma_hoa_don} - OfficeCare</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 16mm 18mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      background: #f8fafc;
      font-size: 13px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page-wrapper {
      max-width: 780px;
      margin: 20px auto;
      background: #ffffff;
      padding: 32px 36px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    @media print {
      body {
        background: #ffffff !important;
      }
      .page-wrapper {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
      .no-print {
        display: none !important;
      }
    }

    /* Print action bar on screen */
    .print-actions {
      max-width: 780px;
      margin: 16px auto 0;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    .print-btn {
      background: #0d9488;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
    }
    .print-btn:hover {
      background: #0f766e;
    }

    /* Header */
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 20px;
      border-bottom: 2px solid #0d9488;
      margin-bottom: 22px;
    }
    .brand-section {
      max-width: 60%;
    }
    .brand-logo {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .brand-logo span {
      color: #0d9488;
    }
    .brand-tagline {
      font-size: 10.5px;
      font-weight: 700;
      color: #0d9488;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 2px;
    }
    .brand-meta {
      font-size: 11.5px;
      color: #64748b;
      margin-top: 6px;
      line-height: 1.45;
    }

    .doc-section {
      text-align: right;
    }
    .doc-title {
      font-size: 17px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-code {
      display: inline-block;
      margin-top: 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      font-weight: 700;
      color: #0d9488;
      background: #f0fdfa;
      border: 1px solid #ccfbf1;
      padding: 3px 10px;
      border-radius: 6px;
    }
    .doc-date {
      font-size: 11px;
      color: #64748b;
      margin-top: 6px;
    }

    /* Info Grid (2 Cards) */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 22px;
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
    }
    .info-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #475569;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 5px;
      line-height: 1.4;
    }
    .info-row:last-child {
      margin-bottom: 0;
    }
    .info-label {
      color: #64748b;
      font-weight: 500;
    }
    .info-value {
      color: #0f172a;
      font-weight: 600;
      text-align: right;
    }

    /* Status Badge */
    .status-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Table */
    .service-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .service-table th {
      background: #f1f5f9;
      color: #334155;
      font-size: 11.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 14px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 2px solid #cbd5e1;
    }
    .service-table td {
      padding: 12px 14px;
      font-size: 12.5px;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: middle;
    }
    .service-table tbody tr:hover {
      background: #fafafa;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }

    /* Summary & Settlement Section */
    .settlement-section {
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      gap: 20px;
      margin-bottom: 26px;
    }
    .payment-status-box {
      background: #fafafa;
      border: 1px dashed #cbd5e1;
      border-radius: 10px;
      padding: 14px 16px;
      display: flex;
      flex-col;
      flex-direction: column;
      justify-content: space-between;
    }
    .stamp-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.5px;
      width: fit-content;
    }
    .stamp-badge.paid {
      background: #ecfdf5;
      color: #047857;
      border: 1.5px solid #a7f3d0;
    }
    .stamp-badge.partial {
      background: #fffbeb;
      color: #b45309;
      border: 1.5px solid #fde68a;
    }
    .stamp-badge.unpaid {
      background: #fff1f2;
      color: #be123c;
      border: 1.5px solid #fecdd3;
    }

    .summary-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      margin-bottom: 8px;
      color: #475569;
    }
    .summary-row.total {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      padding-top: 8px;
      margin-top: 8px;
      border-top: 1.5px solid #cbd5e1;
      margin-bottom: 10px;
    }
    .summary-row.paid {
      font-size: 13px;
      font-weight: 700;
      color: #059669;
    }
    .summary-row.debt {
      font-size: 13px;
      font-weight: 700;
      color: #d97706;
    }
    .summary-row.refund {
      font-size: 13px;
      font-weight: 700;
      color: #e11d48;
    }

    /* System Confirmation Box */
    .system-confirmation-box {
      background: #f0fdfa;
      border: 1.5px solid #0d9488;
      border-radius: 10px;
      padding: 14px 18px;
      margin-top: 14px;
      margin-bottom: 18px;
      text-align: center;
    }
    .confirmation-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #0f766e;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .confirmation-badge .check-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      background: #0d9488;
      color: #ffffff;
      border-radius: 50%;
      font-size: 13px;
      font-weight: 900;
    }
    .confirm-clinic-name {
      font-size: 11.5px;
      font-weight: 700;
      color: #475569;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .confirm-meta-row {
      display: flex;
      justify-content: center;
      gap: 20px;
      font-size: 11.5px;
      color: #64748b;
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px dashed #ccfbf1;
    }
    .confirm-meta-row span {
      display: inline-flex;
      gap: 4px;
    }

    /* Footer */
    .invoice-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 14px;
      margin-top: 16px;
      text-align: center;
      color: #64748b;
      font-size: 11px;
      line-height: 1.5;
    }
    .invoice-footer strong {
      color: #334155;
    }
  </style>
</head>
<body>
  <div class="no-print print-actions">
    <button class="print-btn" onclick="window.print()">
      🖨️ In Hóa Đơn (A4)
    </button>
  </div>

  <div class="page-wrapper">
    <!-- Header -->
    <div class="invoice-header">
      <div class="brand-section">
        <div class="brand-logo">OFFICE<span>CARE</span></div>
        <div class="brand-tagline">Trung Tâm Phục Hồi Chức Năng</div>
        <div class="brand-meta">
          Địa chỉ: Tòa nhà OfficeCare, TP. Hồ Chí Minh<br/>
          Hotline CSKH: 1900 6868 • Email: support@officecare.vn
        </div>
      </div>
      <div class="doc-section">
        <div class="doc-title">Hóa Đơn Dịch Vụ</div>
        <div class="doc-code">${inv.ma_hoa_don}</div>
        <div class="doc-date">Ngày lập: ${formatDate(inv.ngay_tao)}</div>
      </div>
    </div>

    <!-- Info Grid -->
    <div class="info-grid">
      <!-- Khách hàng -->
      <div class="info-card">
        <div class="info-title">
          <span>Thông Tin Khách Hàng</span>
          <span style="color: #0d9488; font-size: 10px;">${inv.ma_khach_hang || ''}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Họ và tên:</span>
          <span class="info-value">${inv.ten_khach_hang}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Điện thoại:</span>
          <span class="info-value">${inv.so_dien_thoai || 'Chưa cập nhật'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Ngày tạo:</span>
          <span class="info-value">${formatDate(inv.ngay_tao)}</span>
        </div>
      </div>

      <!-- Thanh toán -->
      <div class="info-card">
        <div class="info-title">
          <span>Thông Tin Thanh Toán</span>
          <span class="status-badge" style="background: ${statusMeta.bg}; color: ${statusMeta.color};">
            ${statusMeta.label}
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Mã hóa đơn:</span>
          <span class="info-value" style="font-family: monospace;">${inv.ma_hoa_don}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Hình thức gói:</span>
          <span class="info-value">${paymentPlanLabel}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Trạng thái:</span>
          <span class="info-value" style="color: ${statusMeta.color}; font-weight: 700;">${statusMeta.label}</span>
        </div>
      </div>
    </div>

    <!-- Service Table -->
    <table class="service-table">
      <thead>
        <tr>
          <th class="text-center" style="width: 8%;">STT</th>
          <th class="text-left" style="width: 52%;">Nội Dung Dịch Vụ / Trị Liệu</th>
          <th class="text-center" style="width: 15%;">Số Lượng</th>
          <th class="text-right" style="width: 25%;">Thành Tiền</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="text-center">01</td>
          <td class="text-left font-semibold">
            <strong>${inv.ten_dich_vu || 'Buổi lượng giá chức năng / Dịch vụ lẻ'}</strong>
            ${inv.so_buoi_goi ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">Quy mô liệu trình: ${inv.so_buoi_goi} buổi điều trị chuyên sâu</div>` : ''}
          </td>
          <td class="text-center">${inv.so_buoi_goi ? `${inv.so_buoi_goi} buổi` : '1 lượt'}</td>
          <td class="text-right" style="font-weight: 700;">${formatVND(tongGoc)}</td>
        </tr>
        ${giamGia > 0 ? `
        <tr style="background: #f0fdfa;">
          <td class="text-center" style="color: #0d9488;">—</td>
          <td class="text-left" style="color: #0d9488; font-weight: 600;">
            🎁 Chiết khấu ưu đãi / Voucher khuyến mại
          </td>
          <td class="text-center" style="color: #0d9488;">1</td>
          <td class="text-right" style="color: #0d9488; font-weight: 700;">-${formatVND(giamGia)}</td>
        </tr>` : ''}
      </tbody>
    </table>

    <!-- Settlement Section -->
    <div class="settlement-section" style="margin-bottom: 12px;">
      <!-- Left: Status & Notes -->
      <div class="payment-status-box">
        <div>
          <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 8px;">
            Trạng Thái Quyết Toán
          </div>
          ${isPaidFull ? `
            <div class="stamp-badge paid">✓ ĐÃ HOÀN TẤT 100%</div>
            <p style="font-size: 11.5px; color: #047857; margin-top: 8px; line-height: 1.4;">
              Hóa đơn đã được quyết toán đầy đủ. Quý khách có thể sử dụng các buổi trị liệu theo kế hoạch.
            </p>
          ` : isRefunded ? `
            <div class="stamp-badge" style="background: #f3f4f6; color: #4b5563; border: 1.5px solid #d1d5db;">↩ ĐÃ HOÀN TIỀN</div>
            <p style="font-size: 11.5px; color: #4b5563; margin-top: 8px; line-height: 1.4;">
              Hóa đơn đã được lập thủ tục hoàn trả theo quy định của trung tâm.
            </p>
          ` : conLai > 0 ? `
            <div class="stamp-badge partial">⏳ THANH TOÁN TỪNG BUỔI / ĐỢT</div>
            <p style="font-size: 11.5px; color: #b45309; margin-top: 8px; line-height: 1.4;">
              Hóa đơn đang theo tiến độ thanh toán từng buổi hoặc đợt tiếp theo.
            </p>
          ` : `
            <div class="stamp-badge unpaid">CHƯA THANH TOÁN</div>
          `}
        </div>

        <div style="font-size: 11px; color: #64748b; margin-top: 10px;">
          Ghi chú: ${inv.ghi_chu || 'Không có ghi chú thêm.'}
        </div>
      </div>

      <!-- Right: Summary Card -->
      <div class="summary-card">
        <div class="summary-row">
          <span>Tổng tiền gốc:</span>
          <span>${formatVND(tongGoc)}</span>
        </div>
        ${giamGia > 0 ? `
        <div class="summary-row" style="color: #0d9488;">
          <span>Giảm giá voucher:</span>
          <span>-${formatVND(giamGia)}</span>
        </div>` : ''}
        <div class="summary-row total">
          <span>TỔNG THANH TOÁN:</span>
          <span style="color: #0d9488;">${formatVND(tongPhaiTra)}</span>
        </div>
        <div class="summary-row paid">
          <span>Đã thanh toán:</span>
          <span>${formatVND(daTra)}</span>
        </div>
        ${isRefunded ? `
        <div class="summary-row refund">
          <span>Đã hoàn trả:</span>
          <span>${formatVND(Math.max(0, tongPhaiTra - daTra))}</span>
        </div>
        ` : `
        <div class="summary-row ${conLai > 0 ? 'debt' : ''}">
          <span>Còn lại:</span>
          <span>${formatVND(conLai)}</span>
        </div>
        `}
      </div>
    </div>

    <!-- Center Payment Confirmation Box (Replaces all signature requirements) -->
    <div class="system-confirmation-box">
      <div class="confirmation-badge">
        <span class="check-icon">${isRefunded ? '↩' : '✓'}</span>
        <span class="confirm-text">
          ${isRefunded ? 'GIAO DỊCH HOÀN TIỀN ĐÃ XÁC NHẬN' : (isPaidFull ? 'ĐÃ XÁC NHẬN THANH TOÁN' : 'GHI NHẬN THANH TOÁN THEO TIẾN ĐỘ')}
        </span>
      </div>
      <div class="confirm-clinic-name">OfficeCare – Trung Tâm Phục Hồi Chức Năng</div>
      <div class="confirm-meta-row">
        <span>Hình thức: <strong>${paymentPlanLabel}</strong></span>
        <span>Trạng thái: <strong style="color: ${statusMeta.color};">${statusMeta.label}</strong></span>
        <span>Mã chứng từ: <strong style="font-family: monospace;">${inv.ma_hoa_don}</strong></span>
      </div>
    </div>

    <!-- Footer -->
    <div class="invoice-footer">
      <strong>Cảm ơn quý khách đã tin tưởng và đồng hành cùng OfficeCare trên hành trình phục hồi sức khỏe!</strong><br/>
      OfficeCare • Hotline hỗ trợ khách hàng: 1900 6868 • Bản in hóa đơn điện tử hợp lệ theo quy chuẩn trung tâm.
    </div>
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`;
}

export function generateTransactionReceiptHtml(inv: InvoicePrintData, pay: TransactionPrintData): string {
  const isRefund = pay.loai_giao_dich === 'HOAN_TIEN';
  const soTien = Math.abs(Number(pay.so_tien || 0));

  const methodText = pay.phuong_thuc === 'tien_mat' 
    ? 'Tại quầy (Tiền mặt)' 
    : pay.phuong_thuc === 'chuyen_khoan' 
      ? 'Chuyển khoản (Ngân hàng / QR PayOS)' 
      : pay.phuong_thuc === 'the' 
        ? 'Tại quầy (Thẻ POS)' 
        : (pay.phuong_thuc || 'Thanh toán trực tuyến').toUpperCase();

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Biên Nhận ${pay.ma_giao_dich} - OfficeCare</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 16mm 18mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      background: #f8fafc;
      font-size: 13px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page-wrapper {
      max-width: 740px;
      margin: 20px auto;
      background: #ffffff;
      padding: 32px 36px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    @media print {
      body { background: #ffffff !important; }
      .page-wrapper {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
      .no-print { display: none !important; }
    }
    .print-actions {
      max-width: 740px;
      margin: 16px auto 0;
      display: flex;
      justify-content: flex-end;
    }
    .print-btn {
      background: #0d9488;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 18px;
      border-bottom: 2px solid ${isRefund ? '#e11d48' : '#0d9488'};
      margin-bottom: 20px;
    }
    .brand-logo { font-size: 22px; font-weight: 800; color: #0f172a; }
    .brand-logo span { color: #0d9488; }
    .brand-sub { font-size: 10.5px; font-weight: 700; color: #0d9488; text-transform: uppercase; }
    .doc-title { font-size: 16px; font-weight: 800; color: ${isRefund ? '#e11d48' : '#0f172a'}; text-transform: uppercase; text-align: right; }
    .doc-code { font-family: monospace; font-size: 13px; font-weight: 700; color: #475569; margin-top: 4px; text-align: right; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; }
    .info-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .table th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 11.5px; text-transform: uppercase; }
    .table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
    .total-box {
      background: ${isRefund ? '#fff1f2' : '#f0fdfa'};
      border: 1px solid ${isRefund ? '#fecdd3' : '#ccfbf1'};
      border-radius: 8px;
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 15px;
      font-weight: 800;
      color: ${isRefund ? '#be123c' : '#0f766e'};
      margin-bottom: 18px;
    }
    .system-confirmation-box {
      background: ${isRefund ? '#fff1f2' : '#f0fdfa'};
      border: 1.5px solid ${isRefund ? '#f43f5e' : '#0d9488'};
      border-radius: 10px;
      padding: 14px 18px;
      margin-top: 14px;
      margin-bottom: 18px;
      text-align: center;
    }
    .confirmation-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: ${isRefund ? '#be123c' : '#0f766e'};
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .confirmation-badge .check-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      background: ${isRefund ? '#e11d48' : '#0d9488'};
      color: #ffffff;
      border-radius: 50%;
      font-size: 13px;
      font-weight: 900;
    }
    .confirm-clinic-name {
      font-size: 11.5px;
      font-weight: 700;
      color: #475569;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .confirm-meta-row {
      display: flex;
      justify-content: center;
      gap: 20px;
      font-size: 11.5px;
      color: #64748b;
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px dashed ${isRefund ? '#fecdd3' : '#ccfbf1'};
    }
    .confirm-meta-row span {
      display: inline-flex;
      gap: 4px;
    }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 16px; text-align: center; color: #64748b; font-size: 11px; }
  </style>
</head>
<body>
  <div class="no-print print-actions">
    <button class="print-btn" onclick="window.print()">🖨️ In Biên Nhận</button>
  </div>
  <div class="page-wrapper">
    <div class="header">
      <div>
        <div class="brand-logo">OFFICE<span>CARE</span></div>
        <div class="brand-sub">Trung Tâm Phục Hồi Chức Năng</div>
      </div>
      <div>
        <div class="doc-title">${isRefund ? 'Biên Nhận Hoàn Tiền' : 'Biên Nhận Thu Tiền'}</div>
        <div class="doc-code">${pay.ma_giao_dich}</div>
        <div style="font-size: 11px; color: #64748b; text-align: right; margin-top: 4px;">
          ${formatDate(pay.thoi_gian_giao_dich)}
        </div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <div style="font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;">Thông Tin Khách Hàng</div>
        <div class="info-row"><span>Họ tên:</span><strong>${inv.ten_khach_hang}</strong></div>
        <div class="info-row"><span>Điện thoại:</span><span>${inv.so_dien_thoai || 'Chưa cập nhật'}</span></div>
      </div>
      <div class="info-card">
        <div style="font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;">Thông Tin Giao Dịch</div>
        <div class="info-row"><span>Hóa đơn gốc:</span><span style="font-family: monospace;">${inv.ma_hoa_don}</span></div>
        <div class="info-row"><span>Phương thức:</span><span>${methodText}</span></div>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Nội Dung Giao Dịch</th>
          <th style="text-align: right;">Số Tiền</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${inv.ten_dich_vu || 'Dịch vụ phục hồi chức năng'} — <strong>${isRefund ? 'Hoàn phí dịch vụ' : 'Thanh toán giao dịch'}</strong></td>
          <td style="text-align: right; font-weight: 700; color: ${isRefund ? '#e11d48' : '#0d9488'};">
            ${formatVND(soTien)}
          </td>
        </tr>
      </tbody>
    </table>

    <div class="total-box">
      <span>${isRefund ? 'TỔNG TIỀN HOÀN TRẢ:' : 'SỐ TIỀN ĐÃ THU:'}</span>
      <span>${formatVND(soTien)}</span>
    </div>

    <!-- Center Payment Confirmation Box (No signatures) -->
    <div class="system-confirmation-box">
      <div class="confirmation-badge">
        <span class="check-icon">${isRefund ? '↩' : '✓'}</span>
        <span class="confirm-text">${isRefund ? 'ĐÃ XÁC NHẬN HOÀN TIỀN' : 'ĐÃ XÁC NHẬN THANH TOÁN'}</span>
      </div>
      <div class="confirm-clinic-name">OfficeCare – Trung Tâm Phục Hồi Chức Năng</div>
      <div class="confirm-meta-row">
        <span>Phương thức: <strong>${methodText}</strong></span>
        <span>Trạng thái: <strong>${isRefund ? 'Đã hoàn tiền' : 'Đã thanh toán'}</strong></span>
        <span>Mã GD: <strong style="font-family: monospace;">${pay.ma_giao_dich}</strong></span>
      </div>
    </div>

    <div class="footer">
      Cảm ơn quý khách đã tin tưởng và đồng hành cùng OfficeCare!<br/>
      <em>Bản in biên nhận điện tử hợp lệ của trung tâm OfficeCare.</em>
    </div>
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`;
}

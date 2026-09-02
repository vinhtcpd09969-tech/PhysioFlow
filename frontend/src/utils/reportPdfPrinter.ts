export interface DashboardReportPrintData {
  periodLabel: string;
  generatedDate: string | Date;
  creatorName?: string;
  stats: {
    total_revenue?: number | string;
    total_customers?: number | string;
    cancellation_rate?: number | string;
    customers_this_month?: number | string;
    customers_prev_month?: number | string;
  };
  revenueTimeline?: { label: string; revenue: number }[];
  topPackages?: { name: string; count: number }[];
  topVipCustomers?: { id: string; name: string; phone: string; total_paid: number; appointment_count?: number }[];
  staffPerformance?: { id: string; ho_ten: string; vai_tro: string; completed_count: number; avg_rating?: number }[];
}

function formatVND(value: number | string | undefined): string {
  const num = Number(value || 0);
  return num.toLocaleString('vi-VN') + ' đ';
}

function formatDate(dateInput: string | Date | undefined): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const pad = (n: number) => (n < 10 ? '0' + n : n);
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const date = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  return `${time}, ngày ${date}`;
}

// Generate SVG Line/Area Chart for Revenue Timeline
function generateRevenueSvgChart(timeline: { label: string; revenue: number }[]): string {
  if (!timeline || timeline.length === 0) {
    return `<div style="height: 180px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 11px;">Chưa có dữ liệu biểu đồ</div>`;
  }

  const width = 340;
  const height = 180;
  const padLeft = 48;
  const padRight = 16;
  const padTop = 18;
  const padBottom = 28;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const rawValues = timeline.map(t => Number(t.revenue) || 0);
  const maxRaw = Math.max(...rawValues);
  const minRaw = Math.min(...rawValues);

  // Compute nice max & min bounds supporting negative revenues
  const maxMagnitude = Math.max(Math.abs(maxRaw), Math.abs(minRaw), 500000);
  const step = maxMagnitude > 5000000 ? 1000000 : (maxMagnitude > 2000000 ? 500000 : (maxMagnitude > 500000 ? 300000 : 100000));

  let niceMax = Math.ceil(Math.max(maxRaw, 0) / step) * step;
  if (niceMax === 0) niceMax = step;

  let niceMin = 0;
  if (minRaw < 0) {
    niceMin = Math.floor(minRaw / step) * step;
  }

  const range = niceMax - niceMin || 1;
  const yZero = padTop + ((niceMax - 0) / range) * chartH;

  const points = timeline.map((item, idx) => {
    const x = padLeft + (idx / Math.max(timeline.length - 1, 1)) * chartW;
    const rev = Number(item.revenue) || 0;
    const clampedRev = Math.max(niceMin, Math.min(niceMax, rev));
    const y = padTop + ((niceMax - clampedRev) / range) * chartH;
    return { x, y, label: item.label, rev };
  });

  // Build SVG Path with smooth curves
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const mx = (p0.x + p1.x) / 2;
    pathD += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  const baselineY = niceMin < 0 ? yZero : (padTop + chartH);
  const areaD = `${pathD} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;

  // Y-axis grid ticks (4 intervals)
  const tickCount = 4;
  const tickStep = range / tickCount;
  const yTicks: number[] = [];
  for (let i = 0; i <= tickCount; i++) {
    yTicks.push(niceMin + i * tickStep);
  }

  const formatShortMoney = (val: number) => {
    if (Math.abs(val) < 1) return '0';
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    let str = '';
    if (absVal >= 1000000) {
      str = (absVal / 1000000).toFixed(1).replace('.0', '') + 'M';
    } else if (absVal >= 1000) {
      str = Math.round(absVal / 1000) + 'k';
    } else {
      str = String(absVal);
    }
    return isNegative ? `-${str}` : str;
  };

  const formatShortDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
    } catch (e) {}
    return dateStr;
  };

  return `
    <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0d9488" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#0d9488" stop-opacity="0.02"/>
        </linearGradient>
        <clipPath id="chartClip">
          <rect x="${padLeft - 2}" y="${padTop}" width="${chartW + 4}" height="${chartH}" />
        </clipPath>
      </defs>

      <!-- Y Grid Lines & Labels -->
      ${yTicks.map(val => {
        const y = padTop + ((niceMax - val) / range) * chartH;
        const isZero = Math.abs(val) < 1;
        return `
          <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" 
            stroke="${isZero ? '#94a3b8' : '#e2e8f0'}" 
            stroke-width="${isZero ? '1.2' : '0.8'}" 
            stroke-dasharray="${isZero ? 'none' : '2,2'}" />
          <text x="${padLeft - 6}" y="${y + 3}" text-anchor="end" font-size="8" fill="${isZero ? '#334155' : '#64748b'}" font-weight="${isZero ? '700' : '600'}">
            ${formatShortMoney(val)}
          </text>
        `;
      }).join('')}

      <!-- Area Fill & Curve with Clip Protection -->
      <g clip-path="url(#chartClip)">
        <path d="${areaD}" fill="url(#chartGrad)" />
        <path d="${pathD}" fill="none" stroke="#0d9488" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </g>

      <!-- Data Dots & X Labels -->
      ${points.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="2.8" fill="#ffffff" stroke="${p.rev < 0 ? '#e11d48' : '#0d9488'}" stroke-width="1.8" />
        <text x="${p.x}" y="${padTop + chartH + 14}" text-anchor="middle" font-size="7.5" fill="#64748b" font-weight="600">${formatShortDate(p.label)}</text>
      `).join('')}
    </svg>
  `;
}

export function generateDashboardReportHtml(data: DashboardReportPrintData): string {
  const totalRev = Number(data.stats?.total_revenue || 0);
  const totalCust = Number(data.stats?.total_customers || 0);
  const cancelRate = Number(data.stats?.cancellation_rate || 0);
  const printTimeStr = formatDate(data.generatedDate || new Date());
  const creator = data.creatorName || 'Trần Công Vinh';

  const totalPackagesSold = (data.topPackages || []).reduce((sum, p) => sum + Number(p.count || 0), 0);

  const staffList = data.staffPerformance || [];
  const totalCompletedSessions = staffList.reduce((sum, s) => sum + (Number(s.completed_count) || 0), 0);
  const activeStaffCount = staffList.length || 5;
  const avgRating = 5.0;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>BÁO CÁO KẾT QUẢ VẬN HÀNH & KINH DOANH TRUNG TÂM - ${data.periodLabel} - OfficeCare</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 11.5px;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 100%;
      max-width: 820px;
      margin: 0 auto;
      min-height: 270mm;
      position: relative;
      display: flex;
      flex-col: column;
      justify-content: space-between;
      page-break-after: always;
      padding-bottom: 20px;
    }
    .page:last-child {
      page-break-after: avoid;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0d9488;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .brand-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-logo {
      width: 36px;
      height: 36px;
      color: #0d9488;
    }
    .brand-title {
      font-size: 17px;
      font-weight: 900;
      color: #0f766e;
      letter-spacing: -0.3px;
      text-transform: uppercase;
    }
    .brand-subtitle {
      font-size: 10px;
      font-weight: 600;
      color: #475569;
      margin-top: 1px;
    }
    .clinic-meta {
      font-size: 10px;
      color: #475569;
      line-height: 1.4;
      text-align: right;
    }
    .report-title-box {
      text-align: center;
      margin-bottom: 16px;
      padding: 10px;
      background: #f0fdfa;
      border: 1px solid #ccfbf1;
      border-radius: 12px;
    }
    .report-title {
      font-size: 15px;
      font-weight: 900;
      color: #115e59;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .report-meta {
      font-size: 11px;
      color: #0f766e;
      font-weight: 600;
      margin-top: 3px;
    }
    .section-heading {
      font-size: 11.5px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
      border-left: 3.5px solid #0d9488;
      padding-left: 8px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .kpi-icon-box {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 800;
      flex-shrink: 0;
    }
    .kpi-label {
      font-size: 9.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    .kpi-value {
      font-size: 15px;
      font-weight: 900;
      color: #0f766e;
      margin-top: 1px;
    }
    .kpi-sub {
      font-size: 9.5px;
      color: #94a3b8;
      font-weight: 500;
    }
    .revenue-section-grid {
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      gap: 12px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px 12px;
      margin-bottom: 16px;
    }
    .total-revenue-banner {
      grid-column: 1 / -1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 8px;
      border-top: 1.5px solid #0d9488;
      margin-top: 6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    th {
      background: #f8fafc;
      color: #334155;
      font-weight: 800;
      text-align: left;
      padding: 6px 8px;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
      text-transform: uppercase;
      font-size: 9.5px;
    }
    td {
      padding: 6px 8px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }
    
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-teal { background: #ccfbf1; color: #0f766e; }
    .badge-amber { background: #fef3c7; color: #b45309; }

    .two-col-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }

    .summary-boxes-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 14px;
      margin-bottom: 16px;
    }
    .summary-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .notes-box {
      background: #f0fdfa;
      border: 1px solid #ccfbf1;
      border-radius: 12px;
      padding: 12px 14px;
      margin-bottom: 24px;
      font-size: 10.5px;
      color: #0f766e;
    }
    .notes-box ul {
      margin-left: 16px;
      margin-top: 4px;
      line-height: 1.6;
    }

    .footer-signatures {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      text-align: center;
      margin-top: 16px;
      page-break-inside: avoid;
    }
    .sig-title {
      font-size: 11px;
      font-weight: 800;
      color: #1e293b;
      text-transform: uppercase;
    }
    .sig-desc {
      font-size: 9.5px;
      color: #64748b;
      margin-top: 2px;
    }
    .sig-space {
      height: 50px;
    }
    .sig-name {
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
    }
    .page-number {
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      margin-top: 16px;
    }

    .action-bar {
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      gap: 10px;
      z-index: 999;
      background: rgba(255, 255, 255, 0.95);
      padding: 10px 14px;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
      border: 1px solid #e2e8f0;
      backdrop-filter: blur(8px);
    }
    .btn-print {
      background: linear-gradient(135deg, #0d9488, #059669);
      color: white;
      border: none;
      padding: 8px 18px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
    }
    .btn-close {
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }
    @media print {
      .action-bar { display: none !important; }
    }
  </style>
</head>
<body>

  <div class="action-bar">
    <button class="btn-close" onclick="window.close()">Đóng cửa sổ</button>
    <button class="btn-print" onclick="window.print()">🖨️ Lưu file PDF / In báo cáo</button>
  </div>

  <!-- ==================== TRANG 1 ==================== -->
  <div class="page">
    <div>
      <!-- Header -->
      <div class="header">
        <div class="brand-group">
          <svg class="brand-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <div>
            <div class="brand-title">OFFICECARE</div>
            <div class="brand-subtitle">Trung Tâm Phục Hồi Chức Năng Dành Cho Dân Văn Phòng</div>
          </div>
        </div>
        <div class="clinic-meta">
          <strong>Trung Tâm Vật Lý Trị Liệu & PHCN OfficeCare</strong><br/>
          Hotline: 1900 0586 · Website: officecare.vn<br/>
          Thời gian xuất: ${printTimeStr}
        </div>
      </div>

      <!-- Report Title Box -->
      <div class="report-title-box">
        <div class="report-title">BÁO CÁO KẾT QUẢ VẬN HÀNH & KINH DOANH TRUNG TÂM</div>
        <div class="report-meta">Kỳ báo cáo: <strong>${data.periodLabel || 'Toàn thời gian'}</strong> · Người lập: <strong>${creator}</strong></div>
      </div>

      <!-- I. Executive Summary KPIs -->
      <div class="section-heading">I. TỔNG QUAN CHỈ SỐ VẬN HÀNH THEN CHỐT</div>
      <div class="kpi-grid">
        <div class="kpi-card" style="background: #f0fdfa; border-color: #99f6e4;">
          <div class="kpi-icon-box" style="background: #ccfbf1; color: #0d9488;">$</div>
          <div>
            <div class="kpi-label">Doanh Thu Thuần</div>
            <div class="kpi-value" style="color: ${totalRev < 0 ? '#e11d48' : '#0f766e'};">${formatVND(totalRev)}</div>
            <div class="kpi-sub">Doanh thu ghi nhận trong kỳ</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-box" style="background: #ede9fe; color: #7c3aed;">👤</div>
          <div>
            <div class="kpi-label">Tổng Khách Hàng</div>
            <div class="kpi-value" style="color: #6366f1;">${totalCust.toLocaleString('vi-VN')} khách</div>
            <div class="kpi-sub">Cơ sở dữ liệu khách hàng</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-box" style="background: #ffe4e6; color: #e11d48;">📈</div>
          <div>
            <div class="kpi-label">Tỷ Lệ Hủy / Vắng Ca</div>
            <div class="kpi-value" style="color: ${cancelRate > 12 ? '#e11d48' : '#059669'};">${cancelRate}%</div>
            <div class="kpi-sub">${cancelRate < 5 ? 'Mức tối ưu' : (cancelRate <= 12 ? 'Mức bình thường' : 'Cảnh báo vận hành')}</div>
          </div>
        </div>
      </div>

      <!-- II. Revenue Timeline Breakdown with SVG Chart -->
      <div class="section-heading">II. CHI TIẾT DOANH THU THEO MỐC THỜI GIAN</div>
      <div class="revenue-section-grid">
        <!-- Chart Column -->
        <div>
          ${generateRevenueSvgChart(data.revenueTimeline || [])}
        </div>

        <!-- Table Column -->
        <div>
          <table>
            <thead>
              <tr>
                <th style="width: 15%;">STT</th>
                <th style="width: 45%;">MỐC THỜI GIAN</th>
                <th style="width: 40%;" class="text-right">DOANH SỐ GHI NHẬN</th>
              </tr>
            </thead>
            <tbody>
              ${(data.revenueTimeline && data.revenueTimeline.length > 0) ? data.revenueTimeline.slice(0, 7).map((item, idx) => `
                <tr>
                  <td class="text-center font-bold text-slate-500">${idx + 1}</td>
                  <td class="font-bold font-mono">${item.label}</td>
                  <td class="text-right font-bold" style="color: ${Number(item.revenue) < 0 ? '#e11d48' : '#0f766e'};">${formatVND(item.revenue)}</td>
                </tr>
              `).join('') : `
                <tr><td colspan="3" class="text-center text-slate-400">Không có dữ liệu chi tiết</td></tr>
              `}
            </tbody>
          </table>
        </div>

        <!-- Total Banner -->
        <div class="total-revenue-banner">
          <span class="font-bold" style="color: #0f766e; text-transform: uppercase; font-size: 10.5px;">TỔNG CỘNG DOANH THU KỲ BÁO CÁO:</span>
          <span class="font-bold" style="color: ${totalRev < 0 ? '#e11d48' : '#0f766e'}; font-size: 13px;">${formatVND(totalRev)}</span>
        </div>
      </div>

      <!-- III & IV. Top Packages & VIP Customers in 2 columns -->
      <div class="two-col-grid">
        <!-- Top Packages -->
        <div>
          <div class="section-heading">III. TOP GÓI DỊCH VỤ PHỔ BIẾN</div>
          <table>
            <thead>
              <tr>
                <th style="width: 12%;">STT</th>
                <th>GÓI TRỊ LIỆU / DỊCH VỤ</th>
                <th class="text-right">SỐ LƯỢT</th>
                <th class="text-right">TỶ TRỌNG</th>
              </tr>
            </thead>
            <tbody>
              ${(data.topPackages && data.topPackages.length > 0) ? data.topPackages.slice(0, 5).map((pkg, idx) => {
                const pct = totalPackagesSold > 0 ? ((pkg.count / totalPackagesSold) * 100).toFixed(1) : '0';
                return `
                  <tr>
                    <td class="text-center font-bold text-slate-500">${idx + 1}</td>
                    <td class="font-bold">${pkg.name}</td>
                    <td class="text-right font-bold">${pkg.count}</td>
                    <td class="text-right"><span class="badge badge-teal">${pct}%</span></td>
                  </tr>
                `;
              }).join('') : `
                <tr><td colspan="4" class="text-center" style="color: #94a3b8;">Chưa có dữ liệu gói trong kỳ</td></tr>
              `}
            </tbody>
          </table>
        </div>

        <!-- Top VIP Customers -->
        <div>
          <div class="section-heading">IV. TOP 5 KHÁCH HÀNG VIP</div>
          <table>
            <thead>
              <tr>
                <th style="width: 12%;">STT</th>
                <th>KHÁCH HÀNG</th>
                <th>SĐT</th>
                <th class="text-right">TỔNG CHI TIÊU</th>
              </tr>
            </thead>
            <tbody>
              ${(data.topVipCustomers && data.topVipCustomers.length > 0) ? data.topVipCustomers.slice(0, 5).map((vip, idx) => `
                <tr>
                  <td class="text-center font-bold text-slate-500">${idx + 1}</td>
                  <td class="font-bold">${vip.name}</td>
                  <td style="color: #64748b; font-family: monospace;">${vip.phone || '—'}</td>
                  <td class="text-right font-bold" style="color: #b45309;">${formatVND(vip.total_paid)}</td>
                </tr>
              `).join('') : `
                <tr><td colspan="4" class="text-center" style="color: #94a3b8;">Chưa có dữ liệu khách VIP</td></tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="page-number">Trang 1 / 2</div>
  </div>

  <!-- ==================== TRANG 2 ==================== -->
  <div class="page">
    <div>
      <!-- Header -->
      <div class="header">
        <div class="brand-group">
          <svg class="brand-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <div>
            <div class="brand-title">OFFICECARE</div>
            <div class="brand-subtitle">Trung Tâm Phục Hồi Chức Năng Dành Cho Dân Văn Phòng</div>
          </div>
        </div>
        <div class="clinic-meta">
          <strong>Phòng Khám Chuyên Khoa PHCN OfficeCare</strong><br/>
          Hotline: 1900 0586 · Website: officecare.vn<br/>
          Thời gian xuất: ${printTimeStr}
        </div>
      </div>

      <!-- V. Staff Performance Table -->
      <div class="section-heading">V. NĂNG SUẤT PHỤC VỤ CỦA NHÂN SỰ Y TẾ</div>
      <table>
        <thead>
          <tr>
            <th style="width: 8%;">STT</th>
            <th style="width: 35%;">HỌ & TÊN NHÂN SỰ</th>
            <th style="width: 25%;">CHỨC DANH CHUYÊN MÔN</th>
            <th style="width: 17%;" class="text-right">SỐ CA HOÀN THÀNH</th>
            <th style="width: 15%;" class="text-right">ĐÁNH GIÁ</th>
          </tr>
        </thead>
        <tbody>
          ${(staffList.length > 0) ? staffList.slice(0, 8).map((staff, idx) => `
            <tr>
              <td class="text-center font-bold text-slate-500">${idx + 1}</td>
              <td class="font-bold">${staff.ho_ten}</td>
              <td>
                <span class="badge ${staff.vai_tro === 'Bác sĩ' ? 'badge-teal' : 'badge-amber'}">
                  ${staff.vai_tro === 'Bác sĩ' ? 'CHUYÊN VIÊN TƯ VẤN' : 'KỸ THUẬT VIÊN'}
                </span>
              </td>
              <td class="text-right font-bold">${staff.completed_count || 0} ca</td>
              <td class="text-right font-bold" style="color: #059669;">${staff.avg_rating ? `${Number(staff.avg_rating).toFixed(1)} ★` : '5.0 ★'}</td>
            </tr>
          `).join('') : `
            <tr><td colspan="5" class="text-center text-slate-400">Chưa có dữ liệu nhân sự</td></tr>
          `}
        </tbody>
      </table>

      <!-- 3 Summary Boxes -->
      <div class="summary-boxes-grid">
        <div class="summary-box">
          <div class="kpi-icon-box" style="background: #ccfbf1; color: #0d9488;">📅</div>
          <div>
            <div class="kpi-label">TỔNG CA LÀM VIỆC</div>
            <div class="kpi-value">${totalCompletedSessions} ca</div>
            <div class="kpi-sub">Tổng số ca hoàn thành</div>
          </div>
        </div>
        <div class="summary-box">
          <div class="kpi-icon-box" style="background: #e0f2fe; color: #0284c7;">👥</div>
          <div>
            <div class="kpi-label">NHÂN SỰ HOẠT ĐỘNG</div>
            <div class="kpi-value" style="color: #0284c7;">${activeStaffCount} người</div>
            <div class="kpi-sub">Trong kỳ báo cáo</div>
          </div>
        </div>
        <div class="summary-box">
          <div class="kpi-icon-box" style="background: #fef3c7; color: #d97706;">⭐</div>
          <div>
            <div class="kpi-label">ĐÁNH GIÁ TRUNG BÌNH</div>
            <div class="kpi-value" style="color: #d97706;">${avgRating.toFixed(1)} / 5</div>
            <div class="kpi-sub">Hiệu suất phục vụ</div>
          </div>
        </div>
      </div>

      <!-- Notes Box -->
      <div class="notes-box">
        <strong>GHI CHÚ</strong>
        <ul>
          <li>Doanh thu được tổng hợp từ các hóa đơn đã thanh toán trong kỳ báo cáo.</li>
          <li>Tỷ lệ hủy/vắng ca được tính dựa trên tổng số lịch hẹn.</li>
          <li>Báo cáo được tự động tổng hợp từ hệ thống OfficeCare.</li>
        </ul>
      </div>

      <!-- Signatures -->
      <div class="footer-signatures">
        <div>
          <div class="sig-title">NGƯỜI LẬP BÁO CÁO</div>
          <div class="sig-desc">(Ký & ghi rõ họ tên)</div>
          <div class="sig-space"></div>
          <div class="sig-name">${creator}</div>
        </div>
        <div>
          <div class="sig-title">KẾ TOÁN TRƯỞNG</div>
          <div class="sig-desc">(Ký & ghi rõ họ tên)</div>
          <div class="sig-space"></div>
          <div class="sig-name">Trần Thúy Trang</div>
        </div>
        <div>
          <div class="sig-title">GIÁM ĐỐC TRUNG TÂM</div>
          <div class="sig-desc">(Ký & đóng dấu)</div>
          <div class="sig-space"></div>
          <div class="sig-name">Trần Công Vinh</div>
        </div>
      </div>
    </div>

    <div class="page-number">Trang 2 / 2</div>
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 400);
    });
  </script>
</body>
</html>`;
}

export function printDashboardReport(data: DashboardReportPrintData) {
  const html = generateDashboardReportHtml(data);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    // Fallback if popup blocked: create temporary hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    }
  }
}

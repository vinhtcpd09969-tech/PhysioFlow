import { PatientInfo, PatientProfile, PatientVisit, TreatmentPlan } from '@/features/doctor/api/doctor.api';

function formatDate(dateInput: string | Date | undefined): string {
  if (!dateInput) return '---';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const pad = (n: number) => (n < 10 ? '0' + n : n);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatDateTime(dateInput: string | Date | undefined): string {
  if (!dateInput) return '---';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const pad = (n: number) => (n < 10 ? '0' + n : n);
  return `${pad(d.getHours())}:${pad(d.getMinutes())} - ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function getAge(birthday?: string) {
  if (!birthday) return '---';
  try {
    const birthYear = new Date(birthday).getFullYear();
    const currentYear = new Date().getFullYear();
    return `${currentYear - birthYear} tuổi`;
  } catch {
    return '---';
  }
}

function getVasDescription(score?: number | null): string {
  if (score === null || score === undefined) return 'Chưa đánh giá';
  if (score === 0) return '0/10 — Không đau';
  if (score <= 2) return `${score}/10 — Đau nhẹ`;
  if (score <= 4) return `${score}/10 — Đau vừa`;
  if (score <= 6) return `${score}/10 — Đau nhiều`;
  if (score <= 8) return `${score}/10 — Rất đau`;
  return `${score}/10 — Đau dữ dội`;
}

function getSessionVasText(s: any): string {
  const pre = s.danh_gia_truoc_buoi ?? s.vas_truoc ?? s.muc_do_dau_truoc;
  const post = s.danh_gia_sau_buoi ?? s.vas_sau ?? s.muc_do_dau_sau;
  if (pre !== undefined && pre !== null && post !== undefined && post !== null) {
    return `${pre} → ${post}/10`;
  }
  if (post !== undefined && post !== null) return `${post}/10`;
  if (pre !== undefined && pre !== null) return `${pre}/10`;
  return '---';
}

function getSessionKtvName(s: any): string {
  return s.ten_ky_thuat_vien || s.ten_nhan_su || s.ten_ktv || 'KTV Trung tâm';
}

// Common CSS for Modern Medical Document / Professional Physiotherapy Report
const COMMON_PRINT_CSS = `
  @page {
    size: A4 portrait;
    margin: 12mm 15mm;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #1e293b;
    background: #f1f5f9;
    font-size: 12px;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Document Screen Preview Container (Centered A4) */
  .doc-preview-wrapper {
    min-height: 100vh;
    padding: 24px 0 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .print-screen-toolbar {
    width: 210mm;
    max-width: 95vw;
    margin-bottom: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #0f172a;
    color: #ffffff;
    padding: 8px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  .toolbar-title {
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .toolbar-actions {
    display: flex;
    gap: 8px;
  }
  .toolbar-btn {
    border: none;
    cursor: pointer;
    font-size: 12px;
    font-weight: 700;
    padding: 6px 14px;
    border-radius: 6px;
    transition: all 0.15s ease;
  }
  .btn-print {
    background: #0d9488;
    color: #ffffff;
  }
  .btn-print:hover {
    background: #0f766e;
  }
  .btn-close {
    background: #334155;
    color: #f1f5f9;
  }
  .btn-close:hover {
    background: #475569;
  }

  .doc-sheet {
    width: 210mm;
    min-height: 297mm;
    background: #ffffff;
    padding: 16mm 18mm;
    margin: 0 auto;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    border-radius: 2px;
  }

  /* 1. Header */
  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-bottom: 1.5px solid #0d9488;
    padding-bottom: 8px;
    margin-bottom: 12px;
  }
  .clinic-info {
    max-width: 58%;
  }
  .clinic-name {
    font-size: 13.5px;
    font-weight: 900;
    color: #0f766e;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  .clinic-sub {
    font-size: 10px;
    color: #64748b;
    margin-top: 2px;
    line-height: 1.35;
  }
  .doc-title-block {
    text-align: right;
  }
  .doc-main-title {
    font-size: 15px;
    font-weight: 900;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .doc-meta {
    font-size: 10px;
    color: #64748b;
    margin-top: 2px;
  }

  /* 2. Patient Info Block (Clean 3-col Grid) */
  .patient-info-section {
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 8px;
    margin-bottom: 10px;
  }
  .patient-grid {
    display: grid;
    grid-template-columns: 1.25fr 1fr 1.1fr;
    gap: 4px 14px;
    font-size: 11.5px;
  }
  .p-item {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }
  .p-label {
    color: #64748b;
    font-size: 11px;
    white-space: nowrap;
  }
  .p-val {
    color: #0f172a;
    font-weight: 700;
  }

  /* 3. Section Heading (Medical Document Style) */
  .section-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    margin-bottom: 6px;
  }
  .section-title {
    font-size: 11.5px;
    font-weight: 800;
    color: #0f766e;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    white-space: nowrap;
  }
  .section-line {
    flex: 1;
    height: 1px;
    background: #cbd5e1;
  }

  /* 4. Section Content Areas */
  .field-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-bottom: 4px;
    font-size: 11.5px;
  }
  .field-name {
    color: #64748b;
    font-weight: 600;
    font-size: 11px;
    white-space: nowrap;
  }
  .field-text {
    color: #0f172a;
  }

  /* Compact Medical VAS Bar */
  .vas-result-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 6px 12px;
    margin-bottom: 6px;
  }
  .vas-main-score {
    font-size: 12.5px;
    font-weight: 800;
    color: #0f766e;
  }
  .vas-mini-bar {
    display: flex;
    align-items: center;
    gap: 2px;
    width: 220px;
  }
  .vas-segment {
    flex: 1;
    height: 6px;
    background: #e2e8f0;
    border-radius: 1px;
  }
  .vas-segment.active {
    background: #0d9488;
    height: 8px;
  }
  .vas-scale-labels {
    display: flex;
    justify-content: space-between;
    width: 220px;
    font-size: 8.5px;
    color: #94a3b8;
    margin-top: 1px;
  }

  /* 5. ROM & MMT 2-Column Layout */
  .rom-mmt-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 6px;
  }
  .rom-block, .mmt-block {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 6px 10px;
  }
  .block-label {
    font-size: 10.5px;
    font-weight: 800;
    color: #334155;
    text-transform: uppercase;
    margin-bottom: 3px;
    border-bottom: 1px dashed #cbd5e1;
    padding-bottom: 2px;
  }
  .block-desc {
    font-size: 11px;
    color: #1e293b;
    line-height: 1.4;
  }

  /* Minimal Medical Table for ROM / MMT / Sessions */
  .doc-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 2px;
    font-size: 10.5px;
  }
  .doc-table th, .doc-table td {
    border: 1px solid #cbd5e1;
    padding: 4px 6px;
    text-align: left;
  }
  .doc-table th {
    background: #f1f5f9;
    color: #334155;
    font-weight: 700;
    font-size: 10px;
    text-transform: uppercase;
  }
  .doc-table tr:nth-child(even) {
    background: #ffffff;
  }

  /* 6. Medical Accent Box (Conclusion, Warnings) */
  .conclusion-box {
    background: #f0fdfa;
    border-left: 3.5px solid #0d9488;
    padding: 6px 10px;
    border-radius: 2px;
    font-size: 11.5px;
    color: #0f172a;
    font-weight: 600;
    margin-bottom: 4px;
  }
  .contraindication-box {
    background: #fff1f2;
    border-left: 3.5px solid #f43f5e;
    padding: 6px 10px;
    border-radius: 2px;
    font-size: 11.5px;
    color: #9f1239;
    font-weight: 600;
    margin-bottom: 4px;
  }
  .plan-box {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    padding: 6px 10px;
    border-radius: 2px;
    font-size: 11.5px;
    color: #0f172a;
    font-weight: 600;
    margin-bottom: 4px;
  }

  /* 7. Signatures Area */
  .sig-container {
    display: flex;
    justify-content: space-between;
    margin-top: 18px;
    padding-top: 8px;
    page-break-inside: avoid;
  }
  .sig-column {
    width: 220px;
    text-align: center;
  }
  .sig-date-line {
    font-size: 10.5px;
    font-style: italic;
    color: #475569;
    margin-bottom: 3px;
    min-height: 16px;
  }
  .sig-role {
    font-size: 11.5px;
    font-weight: 800;
    color: #0f172a;
    text-transform: uppercase;
  }
  .sig-hint {
    font-size: 10px;
    color: #64748b;
    font-style: italic;
  }
  .sig-space {
    height: 48px;
  }
  .sig-name {
    font-size: 11.5px;
    font-weight: 800;
    color: #0f172a;
  }

  /* Footer Note */
  .doc-footer-note {
    text-align: center;
    font-size: 9.5px;
    color: #94a3b8;
    margin-top: 14px;
    border-top: 1px dashed #e2e8f0;
    padding-top: 4px;
    font-style: italic;
  }

  /* Print Media Overrides */
  @media print {
    body {
      background: #ffffff !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .doc-preview-wrapper {
      padding: 0 !important;
    }
    .print-screen-toolbar {
      display: none !important;
    }
    .doc-sheet {
      width: 100% !important;
      min-height: auto !important;
      padding: 0 !important;
      margin: 0 !important;
      box-shadow: none !important;
      border-radius: 0 !important;
    }
  }

  .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
  .font-bold { font-weight: 700; }
  .text-teal { color: #0d9488; }
  .text-rose { color: #e11d48; }
`;

/* =========================================================================
   1. IN PHIẾU KẾT QUẢ LƯỢNG GIÁ CHỨC NĂNG (Single Visit Print)
   ========================================================================= */
export function generateSingleVisitHtml(
  patient: PatientInfo,
  visit: PatientVisit
): string {
  const printDate = new Date();
  const maKhachHang = patient.ma_khach_hang || `KH-${patient.id.substring(0, 6).toUpperCase()}`;
  const isAssessment = visit.loai === 'KHAM';
  const doctorName = visit.ten_nhan_su || 'Chuyên viên tư vấn OfficeCare';

  // Trích xuất dữ liệu lượng giá ROM & MMT
  let rawAssessmentData: any = {};
  if (typeof visit.du_lieu_luong_gia === 'string') {
    try { rawAssessmentData = JSON.parse(visit.du_lieu_luong_gia); } catch (_) {}
  } else if (visit.du_lieu_luong_gia) {
    rawAssessmentData = visit.du_lieu_luong_gia;
  }

  const roms: Array<any> = rawAssessmentData.rom_data || rawAssessmentData.romData || rawAssessmentData.romList || rawAssessmentData.rom || [];
  const mmts: Array<any> = rawAssessmentData.mmt_data || rawAssessmentData.mmtData || rawAssessmentData.mmtList || rawAssessmentData.mmt || [];
  const vasScore = visit.vas_truoc ?? 4;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Phiếu Lượng Giá - ${patient.ho_ten} (${maKhachHang}) - OfficeCare</title>
  <style>
    ${COMMON_PRINT_CSS}
  </style>
</head>
<body>
  <div class="doc-preview-wrapper">
    
    <!-- Screen-only Floating Toolbar -->
    <div class="print-screen-toolbar">
      <div class="toolbar-title">
        <span>📄</span>
        <span>Xem trước bản in: PHIẾU KẾT QUẢ LƯỢNG GIÁ</span>
      </div>
      <div class="toolbar-actions">
        <button class="toolbar-btn btn-print" onclick="window.print()">🖨️ In Phiếu (Ctrl+P)</button>
        <button class="toolbar-btn btn-close" onclick="window.close()">✕ Đóng</button>
      </div>
    </div>

    <!-- Official A4 Document Sheet -->
    <div class="doc-sheet">
      
      <!-- 1. Header -->
      <div class="doc-header">
        <div class="clinic-info">
          <div class="clinic-name">OFFICECARE — PHỤC HỒI CHỨC NĂNG VĂN PHÒNG</div>
          <div class="clinic-sub">
            Tòa nhà OfficeCare, TP. Hồ Chí Minh · Hotline: 1900 6868 · Email: support@officecare.vn
          </div>
        </div>
        <div class="doc-title-block">
          <div class="doc-main-title">${isAssessment ? 'PHIẾU KẾT QUẢ LƯỢNG GIÁ' : 'PHIẾU DỊCH VỤ TRỊ LIỆU'}</div>
          <div class="doc-meta">
            Mã lịch: <strong class="font-mono">${visit.ma_lich_dat || '---'}</strong> · Ngày in: ${formatDate(printDate)}
          </div>
        </div>
      </div>

      <!-- 2. Patient Administrative Information -->
      <div class="patient-info-section">
        <div class="patient-grid">
          <div class="p-item">
            <span class="p-label">Họ tên:</span>
            <span class="p-val">${patient.ho_ten}</span>
          </div>
          <div class="p-item">
            <span class="p-label">Mã KH:</span>
            <span class="p-val font-mono">${maKhachHang}</span>
          </div>
          <div class="p-item">
            <span class="p-label">Chuyên viên:</span>
            <span class="p-val">${doctorName}</span>
          </div>
          <div class="p-item">
            <span class="p-label">Điện thoại:</span>
            <span class="p-val font-mono">${patient.so_dien_thoai || '---'}</span>
          </div>
          <div class="p-item">
            <span class="p-label">Tuổi / Giới tính:</span>
            <span class="p-val">${getAge(patient.ngay_sinh)} (${patient.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'})</span>
          </div>
          <div class="p-item">
            <span class="p-label">Thời gian:</span>
            <span class="p-val font-mono">${formatDateTime(visit.thoi_gian)}</span>
          </div>
        </div>
      </div>

      <!-- 3. Section 1: Thông tin Lượng giá & Triệu chứng -->
      <div class="section-head">
        <span class="section-title">1. THÔNG TIN LƯỢNG GIÁ & TRIỆU CHỨNG</span>
        <div class="section-line"></div>
      </div>
      
      <div class="field-row">
        <span class="field-name">Dịch vụ thực hiện:</span>
        <span class="field-text font-bold text-teal">${visit.ten_dich_vu || (isAssessment ? 'Buổi Lượng giá Chức năng PHCN' : 'Dịch vụ trị liệu')}</span>
      </div>

      ${visit.ly_do_kham ? `
        <div class="field-row">
          <span class="field-name">Lý do lượng giá / Triệu chứng ban đầu:</span>
          <span class="field-text" style="font-style: italic;">"${visit.ly_do_kham}"</span>
        </div>
      ` : ''}

      <!-- 4. Section 2: Kết quả đánh giá chức năng -->
      <div class="section-head">
        <span class="section-title">2. KẾT QUẢ ĐÁNH GIÁ CHỨC NĂNG</span>
        <div class="section-line"></div>
      </div>

      <!-- Compact VAS Result Row -->
      <div class="vas-result-row">
        <div>
          <span class="p-label" style="font-size: 11px; margin-right: 6px;">Thang điểm đau VAS (0–10):</span>
          <span class="vas-main-score">${getVasDescription(vasScore)}</span>
        </div>
        <div>
          <div class="vas-mini-bar">
            <div class="vas-segment ${vasScore === 0 ? 'active' : ''}"></div>
            <div class="vas-segment ${vasScore >= 1 && vasScore <= 3 ? 'active' : ''}"></div>
            <div class="vas-segment ${vasScore >= 4 && vasScore <= 6 ? 'active' : ''}"></div>
            <div class="vas-segment ${vasScore >= 7 && vasScore <= 8 ? 'active' : ''}"></div>
            <div class="vas-segment ${vasScore >= 9 ? 'active' : ''}"></div>
          </div>
          <div class="vas-scale-labels">
            <span>0</span>
            <span>1-3</span>
            <span>4-6</span>
            <span>7-8</span>
            <span>9-10</span>
          </div>
        </div>
      </div>

      <!-- ROM & MMT Side-by-Side -->
      <div class="rom-mmt-row">
        
        <!-- ROM Block -->
        <div class="rom-block">
          <div class="block-label">TẦM VẬN ĐỘNG KHỚP (ROM)</div>
          ${roms.length > 0 ? `
            <table class="doc-table">
              <thead>
                <tr>
                  <th>Khớp / Cử động</th>
                  <th style="text-align: right; width: 35%;">Số đo (°)</th>
                </tr>
              </thead>
              <tbody>
                ${roms.map((r: any) => `
                  <tr>
                    <td><strong>${r.joint || r.khop || 'Khớp'}</strong> — ${r.movement || r.cu_dong || 'Vận động'}</td>
                    <td style="text-align: right; font-weight: 700; color: #0f766e;" class="font-mono">${r.degrees || r.so_do || '---'}°</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : `
            <div class="block-desc">
              Khớp cổ, vai, thắt lưng vận động trong tầm sinh lý bình thường.
            </div>
          `}
        </div>

        <!-- MMT Block -->
        <div class="mmt-block">
          <div class="block-label">SỨC MẠNH CƠ (MMT 0–5)</div>
          ${mmts.length > 0 ? `
            <table class="doc-table">
              <thead>
                <tr>
                  <th>Nhóm cơ khảo sát</th>
                  <th style="text-align: right; width: 35%;">Bậc cơ lực</th>
                </tr>
              </thead>
              <tbody>
                ${mmts.map((m: any) => `
                  <tr>
                    <td><strong>${m.muscleGroup || m.nhom_co || 'Nhóm cơ'}</strong></td>
                    <td style="text-align: right; font-weight: 700; color: #4338ca;" class="font-mono">Bậc ${m.grade || m.bac || '---'}/5</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : `
            <div class="block-desc">
              5/5 — Sức cơ các nhóm cơ trục cột sống và tứ chi bình thường.
            </div>
          `}
        </div>

      </div>

      <!-- 5. Section 3: Kết luận lượng giá chức năng -->
      <div class="section-head">
        <span class="section-title">3. KẾT LUẬN LƯỢNG GIÁ CHỨC NĂNG</span>
        <div class="section-line"></div>
      </div>
      <div class="conclusion-box">
        ${visit.chan_doan || 'Chưa ghi nhận hạn chế chức năng bất thường.'}
      </div>

      <!-- 6. Section 4: Chống chỉ định vận động & trị liệu -->
      ${visit.chong_chi_dinh ? `
        <div class="section-head">
          <span class="section-title" style="color: #e11d48;">4. CHỐNG CHỈ ĐỊNH VẬN ĐỘNG & TRỊ LIỆU</span>
          <div class="section-line" style="background: #fecdd3;"></div>
        </div>
        <div class="contraindication-box">
          ⚠️ ${visit.chong_chi_dinh}
        </div>
      ` : ''}

      <!-- 7. Section 5: Kế hoạch & Phác đồ trị liệu khuyến nghị -->
      <div class="section-head">
        <span class="section-title">5. KẾ HOẠCH & PHÁC ĐỒ TRỊ LIỆU KHUYẾN NGHỊ</span>
        <div class="section-line"></div>
      </div>
      <div class="plan-box">
        ${visit.khuyen_nghi_goi || visit.ghi_chu || 'Liệu trình Phục hồi Chức năng Văn phòng (Chuyên sâu)'}
      </div>

      <!-- 8. Signatures -->
      <div class="sig-container">
        <div class="sig-column">
          <div class="sig-date-line"></div>
          <div class="sig-role">KHÁCH HÀNG</div>
          <div class="sig-hint">(Ký và ghi rõ họ tên)</div>
          <div class="sig-space"></div>
          <div class="sig-name">${patient.ho_ten}</div>
        </div>

        <div class="sig-column">
          <div class="sig-date-line">TP. Hồ Chí Minh, ngày ${printDate.getDate()} tháng ${printDate.getMonth() + 1} năm ${printDate.getFullYear()}</div>
          <div class="sig-role">CHUYÊN VIÊN PHỤ TRÁCH</div>
          <div class="sig-hint">(Ký và ghi rõ họ tên)</div>
          <div class="sig-space"></div>
          <div class="sig-name">${doctorName}</div>
        </div>
      </div>

      <!-- 9. Footer Note -->
      <div class="doc-footer-note">
        Phiếu kết quả lượng giá chức năng chính thức của OfficeCare. Quý khách vui lòng mang theo phiếu khi tái lượng giá hoặc chuyển tuyến.
      </div>

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

export function printSingleVisit(patient: PatientInfo, visit: PatientVisit) {
  const html = generateSingleVisitHtml(patient, visit);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

/* =========================================================================
   2. IN PHIẾU CHI TIẾT TỪNG BUỔI CỦA GÓI LIỆU TRÌNH (Single Session Print)
   ========================================================================= */
export function generateSingleSessionHtml(
  patient: PatientInfo,
  plan: TreatmentPlan,
  session: any
): string {
  const printDate = new Date();
  const maKhachHang = patient.ma_khach_hang || `KH-${patient.id.substring(0, 6).toUpperCase()}`;
  const ktvName = getSessionKtvName(session);
  const preVas = session.danh_gia_truoc_buoi ?? session.vas_truoc ?? session.muc_do_dau_truoc;
  const postVas = session.danh_gia_sau_buoi ?? session.vas_sau ?? session.muc_do_dau_sau;
  const delta = (preVas !== undefined && postVas !== undefined) ? Math.max(0, preVas - postVas) : null;

  let rawTreatmentData: any = {};
  if (typeof session.du_lieu_tri_lieu === 'string') {
    try { rawTreatmentData = JSON.parse(session.du_lieu_tri_lieu); } catch (_) {}
  } else if (session.du_lieu_tri_lieu) {
    rawTreatmentData = session.du_lieu_tri_lieu;
  }

  const techniques = rawTreatmentData.nhat_ky || [];

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Phiếu Trị Liệu Buổi #${session.so_thu_tu_buoi} - ${patient.ho_ten} - OfficeCare</title>
  <style>
    ${COMMON_PRINT_CSS}
  </style>
</head>
<body>
  <div class="doc-preview-wrapper">
    
    <!-- Screen-only Floating Toolbar -->
    <div class="print-screen-toolbar">
      <div class="toolbar-title">
        <span>📄</span>
        <span>Xem trước bản in: PHIẾU ĐIỀU TRỊ BUỔI #${session.so_thu_tu_buoi}</span>
      </div>
      <div class="toolbar-actions">
        <button class="toolbar-btn btn-print" onclick="window.print()">🖨️ In Phiếu (Ctrl+P)</button>
        <button class="toolbar-btn btn-close" onclick="window.close()">✕ Đóng</button>
      </div>
    </div>

    <!-- Official A4 Document Sheet -->
    <div class="doc-sheet">
      
      <!-- 1. Header -->
      <div class="doc-header">
        <div class="clinic-info">
          <div class="clinic-name">OFFICECARE — PHỤC HỒI CHỨC NĂNG VĂN PHÒNG</div>
          <div class="clinic-sub">
            Tòa nhà OfficeCare, TP. Hồ Chí Minh · Hotline: 1900 6868 · Email: support@officecare.vn
          </div>
        </div>
        <div class="doc-title-block">
          <div class="doc-main-title">PHIẾU ĐIỀU TRỊ BUỔI #${session.so_thu_tu_buoi}</div>
          <div class="doc-meta">
            Thuộc gói: <strong>${plan.ten_dich_vu || 'Gói Trị Liệu PHCN'}</strong> · Ngày in: ${formatDate(printDate)}
          </div>
        </div>
      </div>

      <!-- 2. Patient Administrative Info -->
      <div class="patient-info-section">
        <div class="patient-grid">
          <div class="p-item">
            <span class="p-label">Họ tên:</span>
            <span class="p-val">${patient.ho_ten}</span>
          </div>
          <div class="p-item">
            <span class="p-label">Mã KH:</span>
            <span class="p-val font-mono">${maKhachHang}</span>
          </div>
          <div class="p-item">
            <span class="p-label">KTV phụ trách:</span>
            <span class="p-val">${ktvName}</span>
          </div>
          <div class="p-item">
            <span class="p-label">Điện thoại:</span>
            <span class="p-val font-mono">${patient.so_dien_thoai || '---'}</span>
          </div>
          <div class="p-item">
            <span class="p-label">Tuổi / Giới tính:</span>
            <span class="p-val">${getAge(patient.ngay_sinh)} (${patient.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'})</span>
          </div>
          <div class="p-item">
            <span class="p-label">Thời gian:</span>
            <span class="p-val font-mono">${formatDateTime(session.thoi_gian_bat_dau || session.ngay_gio_bat_dau)}</span>
          </div>
        </div>
      </div>

      <!-- 3. Section 1: Thang điểm đau VAS Trước & Sau -->
      <div class="section-head">
        <span class="section-title">1. TIẾN TRÌNH THUYÊN GIẢM ĐAU (THANG VAS)</span>
        <div class="section-line"></div>
      </div>

      <div class="rom-mmt-row">
        <div class="rom-block" style="border-left: 3px solid #f43f5e;">
          <div class="block-label" style="color: #be123c;">VAS ĐẦU CA (TRƯỚC TRỊ LIỆU)</div>
          <div class="block-desc" style="font-size: 13px; font-weight: 800; color: #be123c;">
            ${preVas !== undefined && preVas !== null ? getVasDescription(preVas) : '---'}
          </div>
        </div>

        <div class="mmt-block" style="border-left: 3px solid #0d9488;">
          <div class="block-label" style="color: #0f766e;">VAS SAU CA (SAU TRỊ LIỆU)</div>
          <div class="block-desc" style="font-size: 13px; font-weight: 800; color: #0f766e;">
            ${postVas !== undefined && postVas !== null ? getVasDescription(postVas) : '---'}
          </div>
        </div>
      </div>

      ${delta !== null && delta > 0 ? `
        <div class="conclusion-box" style="margin-top: 4px; text-align: center; font-size: 11.5px;">
          ✨ Hiệu quả điều trị Buổi #${session.so_thu_tu_buoi}: Giảm ${delta} điểm thang đo đau (${preVas}/10 → ${postVas}/10)
        </div>
      ` : ''}

      <!-- 4. Section 2: Kỹ thuật KTV đã thực hiện -->
      <div class="section-head">
        <span class="section-title">2. KỸ THUẬT & THAO TÁC TRỊ LIỆU ĐÃ THỰC HIỆN</span>
        <div class="section-line"></div>
      </div>

      <div class="plan-box" style="margin-bottom: 8px;">
        ${techniques.length > 0 ? `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            ${techniques.map((t: any) => `
              <div>• <strong>${t.noi_dung}</strong></div>
            `).join('')}
          </div>
        ` : `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <div>• <strong>Trị liệu thủ công chuyên sâu:</strong> Nắn chỉnh di động khớp.</div>
            <div>• <strong>Điện xung & Siêu âm trị liệu:</strong> Tiêu viêm sâu, giảm đau.</div>
            <div>• <strong>Nhiệt trị liệu thư giãn mô mềm:</strong> Chườm nóng giải tỏa căng cơ.</div>
            <div>• <strong>Bài tập PHCN cá nhân hóa:</strong> Củng cố tư thế chuẩn tại nơi làm việc.</div>
          </div>
        `}
      </div>

      <!-- 5. Section 3: Ghi chú & Dặn dò của KTV -->
      <div class="section-head">
        <span class="section-title">3. GHI CHÚ DIỄN TIẾN & DẶN DÒ CỦA KTV</span>
        <div class="section-line"></div>
      </div>
      <div class="conclusion-box" style="font-style: italic;">
        "${session.tien_trien_dieu_tri || session.ghi_chu || session.ghi_chu_noi_bo || 'Khách hàng đáp ứng tốt với các kỹ thuật trị liệu, không có biểu hiện bất thường.'}"
      </div>

      <!-- 6. Signatures -->
      <div class="sig-container">
        <div class="sig-column">
          <div class="sig-date-line"></div>
          <div class="sig-role">KHÁCH HÀNG</div>
          <div class="sig-hint">(Ký và ghi rõ họ tên)</div>
          <div class="sig-space"></div>
          <div class="sig-name">${patient.ho_ten}</div>
        </div>

        <div class="sig-column">
          <div class="sig-date-line">TP. Hồ Chí Minh, ngày ${printDate.getDate()} tháng ${printDate.getMonth() + 1} năm ${printDate.getFullYear()}</div>
          <div class="sig-role">KỸ THUẬT VIÊN PHỤ TRÁCH</div>
          <div class="sig-hint">(Ký và ghi rõ họ tên)</div>
          <div class="sig-space"></div>
          <div class="sig-name">${ktvName}</div>
        </div>
      </div>

      <!-- 7. Footer Note -->
      <div class="doc-footer-note">
        Phiếu ghi nhận kết quả trị liệu từng buổi của phòng khám OfficeCare.
      </div>

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

export function printSingleSession(
  patient: PatientInfo,
  plan: TreatmentPlan,
  session: any
) {
  const html = generateSingleSessionHtml(patient, plan, session);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

/* =========================================================================
   3. IN SỔ THEO DÕI GÓI LIỆU TRÌNH (Treatment Package Plan Print)
   ========================================================================= */
export function generateTreatmentPlanHtml(
  patient: PatientInfo,
  plan: TreatmentPlan
): string {
  const printDate = new Date();
  const maKhachHang = patient.ma_khach_hang || `KH-${patient.id.substring(0, 6).toUpperCase()}`;
  const sessions = plan.sessions || [];
  const doctorName = plan.bac_si_chi_dinh || 'Chuyên viên tư vấn OfficeCare';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Sổ Liệu Trình - ${plan.ten_dich_vu || 'Gói Điều Trị'} - ${patient.ho_ten} - OfficeCare</title>
  <style>
    ${COMMON_PRINT_CSS}
  </style>
</head>
<body>
  <div class="doc-preview-wrapper">
    
    <!-- Screen-only Floating Toolbar -->
    <div class="print-screen-toolbar">
      <div class="toolbar-title">
        <span>📄</span>
        <span>Xem trước bản in: SỔ THEO DÕI LIỆU TRÌNH TRỊ LIỆU</span>
      </div>
      <div class="toolbar-actions">
        <button class="toolbar-btn btn-print" onclick="window.print()">🖨️ In Sổ (Ctrl+P)</button>
        <button class="toolbar-btn btn-close" onclick="window.close()">✕ Đóng</button>
      </div>
    </div>

    <!-- Official A4 Document Sheet -->
    <div class="doc-sheet">
      
      <!-- 1. Header -->
      <div class="doc-header">
        <div class="clinic-info">
          <div class="clinic-name">OFFICECARE — PHỤC HỒI CHỨC NĂNG VĂN PHÒNG</div>
          <div class="clinic-sub">
            Tòa nhà OfficeCare, TP. Hồ Chí Minh · Hotline: 1900 6868 · Email: support@officecare.vn
          </div>
        </div>
        <div class="doc-title-block">
          <div class="doc-main-title">SỔ THEO DÕI LIỆU TRÌNH TRỊ LIỆU</div>
          <div class="doc-meta">
            Tiến độ: <strong>${plan.so_buoi_da_dung}/${plan.tong_so_buoi} buổi</strong> · Ngày in: ${formatDate(printDate)}
          </div>
        </div>
      </div>

      <!-- 2. Patient Administrative Info -->
      <div class="patient-info-section">
        <div class="patient-grid">
          <div class="p-item">
            <span class="p-label">Họ tên:</span>
            <span class="p-val">${patient.ho_ten}</span>
          </div>
          <div class="p-item">
            <span class="p-label">Mã KH:</span>
            <span class="p-val font-mono">${maKhachHang}</span>
          </div>
          <div class="p-item">
            <span class="p-label">Chuyên viên chỉ định:</span>
            <span class="p-val">${doctorName}</span>
          </div>
          <div class="p-item">
            <span class="p-label">Điện thoại:</span>
            <span class="p-val font-mono">${patient.so_dien_thoai || '---'}</span>
          </div>
          <div class="p-item">
            <span class="p-label">Tuổi / Giới tính:</span>
            <span class="p-val">${getAge(patient.ngay_sinh)} (${patient.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'})</span>
          </div>
          <div class="p-item">
            <span class="p-label">Trạng thái phác đồ:</span>
            <span class="p-val uppercase text-teal">${plan.trang_thai === 'dang_dieu_tri' ? 'Đang điều trị' : plan.trang_thai === 'hoan_thanh' ? 'Đã hoàn thành' : plan.trang_thai}</span>
          </div>
        </div>
      </div>

      <!-- 3. Section 1: Thông tin gói liệu trình -->
      <div class="section-head">
        <span class="section-title">1. THÔNG TIN GÓI LIỆU TRÌNH ĐIỀU TRỊ</span>
        <div class="section-line"></div>
      </div>

      <div class="patient-grid" style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px 10px; border-radius: 4px; margin-bottom: 6px;">
        <div class="p-item">
          <span class="p-label">Tên gói:</span>
          <span class="p-val text-teal">${plan.ten_dich_vu || 'Liệu trình Phục hồi Chức năng Chuyên sâu'}</span>
        </div>
        <div class="p-item">
          <span class="p-label">Tổng số buổi:</span>
          <span class="p-val">${plan.tong_so_buoi} buổi</span>
        </div>
        <div class="p-item">
          <span class="p-label">Đã hoàn tất:</span>
          <span class="p-val text-rose">${plan.so_buoi_da_dung} buổi (${Math.round((plan.so_buoi_da_dung / (plan.tong_so_buoi || 1)) * 100)}%)</span>
        </div>
      </div>

      <!-- 4. Section 2: Nhật ký tiến trình các buổi trị liệu -->
      <div class="section-head">
        <span class="section-title">2. NHẬT KÝ CHI TIẾT CÁC BUỔI TRỊ LIỆU (${sessions.length} Buổi)</span>
        <div class="section-line"></div>
      </div>

      <table class="doc-table">
        <thead>
          <tr>
            <th style="width: 10%; text-align: center;">Buổi</th>
            <th style="width: 18%;">Ngày thực hiện</th>
            <th style="width: 22%;">KTV phụ trách</th>
            <th style="width: 16%; text-align: center;">Thang đau VAS</th>
            <th style="width: 20%;">Trạng thái</th>
            <th style="width: 14%; text-align: center;">KTV Ký</th>
          </tr>
        </thead>
        <tbody>
          ${sessions.length > 0 ? (sessions as any[]).map((s: any) => `
            <tr>
              <td style="text-align: center;" class="font-bold">Buổi ${s.so_thu_tu_buoi}</td>
              <td class="font-mono">${formatDate(s.ngay_gio_bat_dau || s.thoi_gian_bat_dau)}</td>
              <td class="font-bold">${getSessionKtvName(s)}</td>
              <td style="text-align: center;" class="font-mono">
                <span class="text-teal font-bold">${getSessionVasText(s)}</span>
              </td>
              <td>${s.trang_thai === 'hoan_thanh' ? '<span class="text-teal font-bold">✓ Hoàn thành</span>' : s.trang_thai}</td>
              <td style="text-align: center;" class="font-mono" style="font-size: 9.5px; color: #64748b;">Đã xác nhận</td>
            </tr>
            ${s.tien_trien_dieu_tri || s.ghi_chu_noi_bo || s.ghi_chu ? `
              <tr style="background: #f8fafc;">
                <td colspan="6" style="padding: 3px 6px; font-size: 10px; color: #475569;">
                  <em>Diễn tiến:</em> ${s.tien_trien_dieu_tri || s.ghi_chu_noi_bo || s.ghi_chu}
                </td>
              </tr>
            ` : ''}
          `).join('') : `
            <tr>
              <td colspan="6" style="text-align: center; padding: 12px 0; color: #94a3b8; font-style: italic;">Chưa có buổi trị liệu nào được ghi nhận trong phác đồ này.</td>
            </tr>
          `}
        </tbody>
      </table>

      <!-- 5. Signatures -->
      <div class="sig-container">
        <div class="sig-column">
          <div class="sig-date-line"></div>
          <div class="sig-role">KHÁCH HÀNG</div>
          <div class="sig-hint">(Ký và ghi rõ họ tên)</div>
          <div class="sig-space"></div>
          <div class="sig-name">${patient.ho_ten}</div>
        </div>

        <div class="sig-column">
          <div class="sig-date-line">TP. Hồ Chí Minh, ngày ${printDate.getDate()} tháng ${printDate.getMonth() + 1} năm ${printDate.getFullYear()}</div>
          <div class="sig-role">CHUYÊN VIÊN / KTV TRƯỞNG</div>
          <div class="sig-hint">(Ký và ghi rõ họ tên)</div>
          <div class="sig-space"></div>
          <div class="sig-name">${doctorName}</div>
        </div>
      </div>

      <!-- 6. Footer Note -->
      <div class="doc-footer-note">
        Sổ theo dõi liệu trình phục hồi chức năng chính thức của OfficeCare. Quý khách vui lòng duy trì đúng lịch tập để đạt hiệu quả phục hồi tốt nhất.
      </div>

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

export function printTreatmentPlan(patient: PatientInfo, plan: TreatmentPlan) {
  const html = generateTreatmentPlanHtml(patient, plan);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

/* =========================================================================
   4. IN TOÀN BỘ HỒ SƠ TỔNG HỢP (Full Medical Dossier Print)
   ========================================================================= */
export function generateMedicalRecordHtml(
  patient: PatientInfo,
  profile: PatientProfile | null
): string {
  const visits = profile?.visits || [];
  const plans = profile?.treatmentPlans || [];
  const printDate = new Date();

  const latestDoctor = visits[0]?.ten_nhan_su || plans[0]?.bac_si_chi_dinh || 'Chuyên viên tư vấn OfficeCare';
  const maKhachHang = patient.ma_khach_hang || `KH-${patient.id.substring(0, 6).toUpperCase()}`;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Hồ Sơ Điều Trị - ${patient.ho_ten} (${maKhachHang}) - OfficeCare</title>
  <style>
    ${COMMON_PRINT_CSS}
  </style>
</head>
<body>
  <div class="doc-preview-wrapper">
    
    <!-- Screen-only Floating Toolbar -->
    <div class="print-screen-toolbar">
      <div class="toolbar-title">
        <span>📄</span>
        <span>Xem trước bản in: HỒ SƠ ĐIỀU TRỊ & TIẾN TRÌNH PHCN</span>
      </div>
      <div class="toolbar-actions">
        <button class="toolbar-btn btn-print" onclick="window.print()">🖨️ In Hồ Sơ (Ctrl+P)</button>
        <button class="toolbar-btn btn-close" onclick="window.close()">✕ Đóng</button>
      </div>
    </div>

    <!-- Official A4 Document Sheet -->
    <div class="doc-sheet">
      
      <!-- 1. Header -->
      <div class="doc-header">
        <div class="clinic-info">
          <div class="clinic-name">OFFICECARE — PHỤC HỒI CHỨC NĂNG VĂN PHÒNG</div>
          <div class="clinic-sub">
            Tòa nhà OfficeCare, TP. Hồ Chí Minh · Hotline: 1900 6868 · Email: support@officecare.vn
          </div>
        </div>
        <div class="doc-title-block">
          <div class="doc-main-title">HỒ SƠ ĐIỀU TRỊ</div>
          <div class="doc-meta">
            Ngày in: ${formatDateTime(printDate)}
          </div>
        </div>
      </div>

      <!-- 2. Patient Administrative Info -->
      <div class="patient-info-section">
        <div class="patient-grid">
          <div class="p-item">
            <span class="p-label">Họ tên:</span>
            <span class="p-val">${patient.ho_ten}</span>
          </div>
          <div class="p-item">
            <span class="p-label">Mã KH:</span>
            <span class="p-val font-mono">${maKhachHang}</span>
          </div>
          <div class="p-item">
            <span class="p-label">Chuyên viên:</span>
            <span class="p-val">${latestDoctor}</span>
          </div>
          <div class="p-item">
            <span class="p-label">Điện thoại:</span>
            <span class="p-val font-mono">${patient.so_dien_thoai || '---'}</span>
          </div>
          <div class="p-item">
            <span class="p-label">Tuổi / Giới tính:</span>
            <span class="p-val">${getAge(patient.ngay_sinh)} (${patient.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'})</span>
          </div>
          <div class="p-item">
            <span class="p-label">Email:</span>
            <span class="p-val font-mono">${patient.email || '---'}</span>
          </div>
        </div>
      </div>

      <!-- 3. Visits List -->
      <div class="section-head">
        <span class="section-title">1. LỊCH SỬ LƯỢNG GIÁ CHỨC NĂNG & DỊCH VỤ ĐƠN LẺ (${visits.length})</span>
        <div class="section-line"></div>
      </div>

      ${visits.length > 0 ? visits.map((v: PatientVisit) => `
        <div style="border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 10px; margin-bottom: 6px; background: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
            <strong class="text-teal">${v.ten_dich_vu || (v.loai === 'KHAM' ? 'Buổi Lượng giá Chức năng PHCN' : 'Trị liệu phục hồi')}</strong>
            <span class="font-mono" style="font-size: 10.5px; color: #64748b;">${formatDateTime(v.thoi_gian)}</span>
          </div>
          <div class="field-row">
            <span class="field-name">Kết luận:</span>
            <span class="field-text font-bold">${v.chan_doan || 'Chưa ghi nhận'}</span>
          </div>
          ${v.chong_chi_dinh ? `
            <div class="contraindication-box" style="margin-top: 4px;">
              ⚠️ Chống chỉ định: ${v.chong_chi_dinh}
            </div>
          ` : ''}
        </div>
      `).join('') : '<div style="color: #94a3b8; font-style: italic; padding: 6px 0;">Chưa có dữ liệu buổi lượng giá lâm sàng.</div>'}

      <!-- 4. Plans List -->
      <div class="section-head">
        <span class="section-title">2. GÓI LIỆU TRÌNH & TIẾN TRÌNH TRỊ LIỆU (${plans.length})</span>
        <div class="section-line"></div>
      </div>

      ${plans.length > 0 ? plans.map((p: TreatmentPlan) => `
        <div style="border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 10px; margin-bottom: 6px; background: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
            <strong class="text-teal">${p.ten_dich_vu || 'Gói Phục hồi Chức năng Chuyên sâu'}</strong>
            <span style="font-size: 10.5px; color: #64748b;">Tiến độ: <strong>${p.so_buoi_da_dung}/${p.tong_so_buoi} buổi</strong></span>
          </div>
          <div class="field-row">
            <span class="field-name">Chuyên viên chỉ định:</span>
            <span class="field-text font-bold">${p.bac_si_chi_dinh || latestDoctor}</span>
          </div>
        </div>
      `).join('') : '<div style="color: #94a3b8; font-style: italic; padding: 6px 0;">Chưa có dữ liệu gói liệu trình điều trị.</div>'}

      <!-- 5. Signatures -->
      <div class="sig-container">
        <div class="sig-column">
          <div class="sig-date-line"></div>
          <div class="sig-role">KHÁCH HÀNG</div>
          <div class="sig-hint">(Ký và ghi rõ họ tên)</div>
          <div class="sig-space"></div>
          <div class="sig-name">${patient.ho_ten}</div>
        </div>

        <div class="sig-column">
          <div class="sig-date-line">TP. Hồ Chí Minh, ngày ${printDate.getDate()} tháng ${printDate.getMonth() + 1} năm ${printDate.getFullYear()}</div>
          <div class="sig-role">CHUYÊN VIÊN PHỤ TRÁCH</div>
          <div class="sig-hint">(Ký và ghi rõ họ tên)</div>
          <div class="sig-space"></div>
          <div class="sig-name">${latestDoctor}</div>
        </div>
      </div>

      <!-- 6. Footer Note -->
      <div class="doc-footer-note">
        Bản in trích sao toàn bộ hồ sơ điều trị & phục hồi chức năng của hệ thống quản lý y tế OfficeCare.
      </div>

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

export function printMedicalRecord(patient: PatientInfo, profile: PatientProfile | null) {
  const html = generateMedicalRecordHtml(patient, profile);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

# Plan: Phase 6 — Admin Finalization

## Overview
Transform the Admin Dashboard into a comprehensive "War Room" by completing the Finance, Marketing, Feedback, and Analytics modules.

## Project Type
**WEB** (Full-stack: React + Express + PostgreSQL)

## Success Criteria
- [ ] Admin can view and manage all Invoices and Payments.
- [ ] Admin can create, update, and monitor Vouchers.
- [ ] Admin can read customer Feedback from sessions.
- [ ] Admin Dashboard displays interactive charts for Revenue and Performance.

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, Recharts (for analytics).
- **Backend:** Express, TypeScript, pg (Raw SQL).
- **Validation:** Zod (for request bodies).

## File Structure
### Backend
- [MODIFY] `backend/src/routes/admin.routes.ts`: Register new routes.
- [MODIFY] `backend/src/controllers/admin.controller.ts`: Implement logic for Finance, Marketing, and Analytics.
- [NEW] `backend/src/schemas/finance.schema.ts`: Zod schemas for payments.
- [NEW] `backend/src/schemas/marketing.schema.ts`: Zod schemas for vouchers.

### Frontend
- [NEW] `frontend/src/features/admin/pages/ManageFinance.tsx`: Payment/Invoice UI.
- [NEW] `frontend/src/features/admin/pages/ManageVouchers.tsx`: Voucher management UI.
- [NEW] `frontend/src/features/admin/pages/ViewFeedback.tsx`: Feedback viewing UI.
- [MODIFY] `frontend/src/features/admin/pages/AdminDashboard.tsx`: Add charts and summary stats.

## Task Breakdown

### 1. Foundation & Finance (P0)
- **Task 1.1: Backend Finance API**
  - **Agent:** `backend-specialist`
  - **Action:** Create `GET /api/admin/invoices`, `GET /api/admin/payments`, and `POST /api/admin/payments/:id/refund`.
  - **Verify:** API returns valid JSON from `hoa_don` and `thanh_toan` tables.
- **Task 1.2: Frontend Finance UI**
  - **Agent:** `frontend-specialist`
  - **Action:** Create `ManageFinance.tsx` with a searchable table for Invoices and Payment history.
  - **Verify:** Table displays data correctly from the backend.

### 2. Marketing & Vouchers (P1)
- **Task 2.1: Backend Voucher CRUD**
  - **Agent:** `backend-specialist`
  - **Action:** Create full CRUD for `voucher` table in `admin.controller.ts`.
  - **Verify:** Test with Postman/Thunder Client (Create, Read, Update, Delete).
- **Task 2.2: Frontend Voucher UI**
  - **Agent:** `frontend-specialist`
  - **Action:** Create `ManageVouchers.tsx` with a form to create/edit vouchers.
  - **Verify:** Can create a voucher and see it in the list.

### 3. Feedback & Quality (P2)
- **Task 3.1: Backend Feedback API**
  - **Agent:** `backend-specialist`
  - **Action:** Create `GET /api/admin/feedback` to list entries from `danh_gia_dich_vu`.
  - **Verify:** Returns ratings and comments.
- **Task 3.2: Frontend Feedback UI**
  - **Agent:** `frontend-specialist`
  - **Action:** Create `ViewFeedback.tsx` using a card-based layout for reviews.
  - **Verify:** Displays stars and text feedback correctly.

### 4. Analytics & Dashboard (P3)
- **Task 4.1: Backend Analytics Queries**
  - **Agent:** `backend-specialist`
  - **Action:** Implement `GET /api/admin/analytics/revenue` (monthly) and `GET /api/admin/analytics/performance` (staff stats).
  - **Verify:** Returns aggregated data (SUM, COUNT).
- **Task 4.2: Frontend Dashboard Enhancements**
  - **Agent:** `frontend-specialist`
  - **Action:** Integrate `Recharts` into `AdminDashboard.tsx`.
  - **Verify:** Charts render correctly with real data.

## Phase X: Verification
- [ ] Run `python .agent/scripts/checklist.py .`
- [ ] Run `npm run build` in both frontend and backend.
- [ ] Verify all new routes are protected by Admin role.
- [ ] Manual test of the entire payment flow (viewing invoice -> payment).

## Open Questions
> [!IMPORTANT]
> 1. **Refund Logic:** Should a refund simply update the status of `hoa_don` to `da_hoan_tien`, or should we allow partial refunds?
> 2. **Voucher Targeting:** Do we need to limit vouchers to specific customer tiers (e.g., VIP only)?
> 3. **Analytics Period:** What is the preferred default time range for charts?

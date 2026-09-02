# Deployment Handover — OfficeCare

> File này ghi lại **cách đã tiếp cận việc deploy** (nguyên tắc làm việc) và **kế hoạch/kết quả deploy thực tế** đã thực hiện. Mục đích: đưa cho một AI khác (hoặc đọc lại sau này) để tiếp tục công việc mà không cần hỏi lại từ đầu.
>
> Bối cảnh lúc thực hiện: dự án đồ án tốt nghiệp, đang ở khoảng **50% hoàn thành**, cần deploy **ngay** để lấy URL + ảnh chụp màn hình cho báo cáo, sau đó **tiếp tục code ở local** cho tới khi xong 100% mới deploy lại lần 2 (bản cuối). Deadline bảo vệ: xem `project_hoi_dong_danh_gia_nghiep_vu_kham` trong hệ thống memory — không lặp lại chi tiết ở đây vì đó là thông tin nội bộ, không cần cho việc deploy.

## 1. Nguyên tắc làm việc đã áp dụng (áp dụng lại nếu tiếp tục)

Đây là các quy tắc người dùng đặt ra rõ ràng khi giao việc deploy — **giữ nguyên tinh thần này** nếu một AI khác tiếp quản:

1. **Chỉ push code thật lên Git, không push file linh tinh.** Trước khi `git add -A`, luôn `git status --short` soát lại — loại trừ thư mục backup thủ công, file ảnh chụp màn hình, file tạm không thuộc source code (ví dụ đã từng phải `git reset -- "cũ/" screen.png` trước khi commit).
2. **Backup DB trước khi chạy bất kỳ thao tác rủi ro nào**, dù là trên DB local hay production.
3. **Chạy tới đâu báo cáo tới đó** — không tự ý làm hết một mạch rồi mới báo cáo. Với các bước cần thao tác tay trên trình duyệt (Neon/Render/Vercel dashboard), phải nói **chính xác cần bấm gì** vì người dùng không rành các nền tảng này.
4. **Không tự quyết định các thay đổi có thể phá dữ liệu** — luôn xác nhận trước.
5. Người dùng là sinh viên, ưu tiên **giải pháp 0 đồng**, không yêu cầu thẻ tín dụng.

## 2. Ràng buộc kỹ thuật cứng — không được vi phạm

- **TUYỆT ĐỐI KHÔNG chạy `npx prisma migrate dev`** ở bất kỳ đâu (local lẫn production). Dự án này **không có migration nào cả** (`backend/prisma/migrations/` không tồn tại) — khi `migrate dev` phát hiện lệch giữa lịch sử migration và DB thật, nó sẽ **đề nghị reset xóa sạch dữ liệu**. Đã từng xảy ra sự cố thật với dự án này vì lệnh này trước đây.
- Đồng bộ schema (local lẫn production) chỉ dùng **`npx prisma db push`** — so schema.prisma với DB đích và áp mọi thay đổi cần thiết trong 1 lần, không có khái niệm "xung đột" giữa các lần đổi.
- Local DB và Production DB là **hai instance Postgres hoàn toàn tách biệt** (`DATABASE_URL` khác nhau) — không bao giờ trỏ chung, không bao giờ dán nhầm connection string production vào file `.env` local.

## 3. Sự thật kỹ thuật đã xác minh trực tiếp trong repo (không suy đoán)

| Hạng mục | Giá trị thật |
|---|---|
| Backend build | `npm run build` = `prisma generate && tsc` |
| Backend start | `npm start` = `node dist/src/index.js` (**xem mục 5 — đã từng sai**) |
| Backend port | `process.env.PORT \|\| 5000` — PaaS tự tiêm `PORT`, không cần set tay |
| Frontend build | `npm run build` (Vite) → tĩnh trong `frontend/dist/` |
| Frontend gọi API | Qua `VITE_API_URL` tuyệt đối (không proxy dev) — đọc ở `frontend/src/api/axios.ts` |
| Kết nối DB | `DATABASE_URL` đọc qua `backend/prisma.config.ts` (Prisma 7, không còn `url` trong `schema.prisma`) |
| Migration | Không tồn tại — dự án dùng `db push` thuần túy |
| Kiến trúc | **Không phải monorepo** — backend/frontend là 2 project Node độc lập → phải deploy thành **2 dịch vụ riêng** |
| Ảnh upload | Multer `memoryStorage()` → đẩy thẳng lên **Cloudinary** — ảnh mới không phụ thuộc đĩa cục bộ |
| Ảnh cũ trên đĩa | `backend/uploads/` (~3.3MB) phục vụ qua `express.static`, bị `.gitignore` — **sẽ mất khi Render redeploy** (ổ đĩa free tier là tạm thời), chỉ ảnh hưởng vài ảnh demo cũ, không ảnh hưởng ảnh mới |
| CORS | Đọc từ `ALLOWED_ORIGINS` (phân tách bởi dấu phẩy) + luôn cho phép `*.ngrok-free.dev`/`*.ngrok.io` |

### Biến môi trường cần cấu hình trên Render (backend)

```
PORT                  ← PaaS tự set
DATABASE_URL          ← connection string Neon
JWT_SECRET
JWT_REFRESH_SECRET
ALLOWED_ORIGINS        ← PHẢI có URL frontend Vercel, vd: https://officecare.vercel.app
FRONTEND_URL           ← ⚠️ THIẾU trong .env.example nhưng CODE CÓ DÙNG (client.routes.ts —
                          PayOS cancelUrl/returnUrl). Bỏ trống thì fallback về http://localhost:3000,
                          PayOS sẽ redirect khách về localhost sau khi thanh toán → BẮT BUỘC set đúng
EMAIL_HOST/PORT/USER/PASS   ← để trống thì dùng hộp thư giả Ethereal (không gửi mail thật, OK cho demo)
CLOUDINARY_URL
PAYOS_CLIENT_ID / PAYOS_API_KEY / PAYOS_CHECKSUM_KEY
GEMINI_API_KEY
```

### Biến môi trường trên Vercel (frontend)

```
VITE_API_URL          ← https://<tên-service-render>.onrender.com/api
```

## 4. Nền tảng đã chọn — miễn phí, lý do chọn

| Vai trò | Chọn | Vì sao |
|---|---|---|
| Frontend | **Vercel — Hobby (free)** | Build/deploy tự động từ GitHub, đủ băng thông cho quy mô đồ án |
| Backend | **Render — Free Web Service** | Không cần thẻ tín dụng; giới hạn: 512MB RAM, **tự ngủ sau 15 phút không request** (cold start 30–60s lần gọi đầu) |
| Database | **Neon — Free tier** | **Scale-to-zero, KHÔNG bị xóa** — lý do chọn thay vì Postgres free của chính Render (Render tự **xóa DB sau 30 ngày**, quá rủi ro với timeline sát ngày bảo vệ) |

Thay thế nếu Neon có vấn đề: Supabase free (nhưng project **tạm dừng sau 7 ngày không hoạt động**, phải tự vào dashboard bấm "resume" — không mất dữ liệu, chỉ cần nhớ làm trước ngày bảo vệ).

## 5. Bug thật đã phát hiện & sửa trong lúc deploy

**`backend/tsconfig.json` có `rootDir: "./"`** (gốc project, không phải `./src`) → `tsc` giữ nguyên cấu trúc thư mục `src/` khi build, nên output thật nằm ở `dist/src/index.js`, **không phải** `dist/index.js`. Lỗi này **không lộ ra khi chạy local** vì `npm run dev` dùng `ts-node` trực tiếp, không bao giờ chạy qua chu trình build+start thật — chỉ lộ ra khi Render chạy `npm run build && npm start` thật.

**Đã sửa:** `backend/package.json` — `"main"` và script `"start"` đổi thành `dist/src/index.js`. Đã verify bằng `npm run build` + `npm start` local trước khi deploy.

Nếu klone repo mới hoặc cấu trúc `tsconfig.json` đổi sau này, kiểm tra lại điểm này trước — đây là lỗi dễ tái phát nếu ai đó "dọn" lại tsconfig mà không biết `package.json` đang phụ thuộc đúng path.

## 6. Quy trình đã thực hiện (Deploy lần 1 — ĐÃ XONG, đã verify sống)

```
1. Tạo project Neon → copy connection string → DATABASE_URL production
2. Tạo Web Service trên Render, trỏ vào repo GitHub:
     - Root Directory: backend
     - Build Command: npm install && npm run build
     - Start Command: npm start
     - Nhập toàn bộ env var ở mục 3
3. Từ local, đồng bộ schema sang Neon:
     cd backend && DATABASE_URL="<connection string Neon>" npx prisma db push
4. Seed dữ liệu demo lên Neon (npm run seed) — phải SỬA seed.ts trước khi chạy, xem mục 7
5. Tạo project Vercel, trỏ vào repo GitHub:
     - Root Directory: frontend
     - Build Command: npm run build
     - Output Directory: dist
     - VITE_API_URL = https://<service-render>.onrender.com/api
6. Quay lại Render, cập nhật ALLOWED_ORIGINS + FRONTEND_URL bằng URL Vercel vừa có
7. Bấm thử link Vercel 1 lần để "đánh thức" Render khỏi cold start
```

**Kết quả xác nhận sống (đã verify bằng curl thật):**
- Backend: `curl https://officecare.onrender.com/api/health` → `{"status":"ok","message":"OfficeCare API is running (TypeScript)"}`
- CORS preflight từ origin Vercel → `204 No Content` kèm đúng header `access-control-allow-origin`
- Frontend: `https://officecare.vercel.app` build/deploy thành công qua GitHub

> Nếu deploy lại từ đầu (repo mới/service mới), 2 URL thật ở trên sẽ khác — cập nhật lại tài liệu này với URL mới.

## 7. Lỗi đã gặp và cách đã sửa trong lần deploy này

| Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|
| `Error: Cannot find module '.../dist/index.js'` trên Render | tsconfig `rootDir` mismatch (mục 5) | Sửa `package.json` main/start → `dist/src/index.js` |
| `scripts/seed.ts` lỗi `PrismaClientValidationError: Unknown argument` | Seed script viết trước đợt tái cấu trúc nghiệp vụ lớn, tham chiếu field đã đổi tên/xóa (`goi_dich_vu.mo_ta`→`quy_trinh`, `khuyen_mai_voucher.so_luong_da_dung` đã xóa) | Sửa lại seed script khớp schema hiện tại trước khi chạy trên Neon |
| CORS trả `500` khi test từ origin Vercel | Render chưa build lại xong với `ALLOWED_ORIGINS`/`FRONTEND_URL` mới set | Đợi Render deploy xong (xem log "Deploy live"), không phải bug code |
| "Production Branch" setting không tồn tại trong Vercel UI hiện tại (đã kiểm tra cả `Settings→Git` và `Settings→General`) | Giao diện Vercel đã đổi, không còn field này | Merge branch code hoàn chỉnh (`feature/...`) vào `main` bằng git trực tiếp — Vercel tự đọc default branch của GitHub, không cần cấu hình gì thêm phía Vercel |

## 8. Kỷ luật nhánh Git

- Code đang phát triển dở nằm ở **nhánh feature** (không phải `main`).
- **`main` = nhánh "sẵn sàng deploy"** — chỉ merge vào khi thật sự muốn deploy lại. Lý do: Vercel/Render tự động deploy theo default branch của GitHub (đã xác nhận là `main`), nếu code dở nằm trên `main` thì mỗi lần push sẽ tự động đẩy code chưa hoàn chỉnh lên production.
- Trước khi merge, luôn `git merge-tree` (dry-run) kiểm tra xung đột trước khi merge thật.

## 9. Tiếp tục phát triển ở local sau Deploy lần 1 (không đụng production)

```
Sửa backend/prisma/schema.prisma
   ↓
npx prisma db push        ← LOCAL, KHÔNG BAO GIỜ dùng migrate dev
   ↓
npx prisma generate
   ↓
Test tính năng → dùng TablePlus xóa dữ liệu test tay (chưa có nút "xóa cứng" trên web)
   ↓ (lặp lại tự do — production KHÔNG bị ảnh hưởng vì DATABASE_URL khác nhau hoàn toàn)
```

Vì website production **không có người dùng thật, không share cho ai** trong suốt giai đoạn phát triển tiếp, không có rủi ro "xung đột dữ liệu production" — chỉ cần đúng thứ tự thao tác ở mục 10 khi deploy lại lần cuối.

## 10. Quy trình Deploy lần 2 (khi hoàn thành 100% — CHƯA THỰC HIỆN)

```
1. Merge code hoàn chỉnh vào main → git push
   → Render/Vercel tự build lại, hoặc bấm "Manual Deploy" trên Render nếu cần
2. Đồng bộ schema production 1 lần nữa (tự áp MỌI thay đổi cột/bảng tích lũy ở local trong 1 lần):
     cd backend && DATABASE_URL="<connection string Neon>" npx prisma db push
3. Nếu schema đổi làm ảnh hưởng dữ liệu demo cũ → chạy lại seed
4. Kiểm tra lại toàn bộ luồng chính trên URL production trước khi báo hội đồng
```

## 11. Rủi ro cần nhớ trước ngày bảo vệ

- **Cold start Render free** — bấm thử link 5–10 phút trước khi trình bày để "đánh thức" service.
- **Ảnh cũ trong `backend/uploads/`** không tồn tại trên Render (ổ đĩa tạm thời) — nếu demo cũ tham chiếu ảnh local, cần re-upload qua Cloudinary trước hoặc chấp nhận ảnh đó lỗi.
- **PayOS cần đúng `FRONTEND_URL`** — thiếu biến này thì khách thanh toán xong bị redirect về `localhost:3000`, hỏng luồng demo thanh toán.
- **Mật khẩu demo mặc định yếu** (`admin123`-kiểu) + luồng đặt lịch công khai — nên **reset/seed lại Neon về trạng thái sạch** ngay trước ngày bảo vệ thật, vì bất kỳ ai có link đều có thể vào phá dữ liệu demo (rủi ro thấp nhưng có thật, do web không yêu cầu đăng nhập để xem).
- PayOS/Gemini/Cloudinary là dịch vụ bên thứ 3 cần API key thật — không nằm trong phạm vi "miễn phí hosting", cần xử lý riêng nếu đổi tài khoản.

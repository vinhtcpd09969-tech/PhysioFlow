---
description: Đồng bộ lại cấu trúc bảng Prisma và nạp lại dữ liệu mẫu từ database/office_care_backup_new.sql vào DB local. Lệnh này XÓA/GHI ĐÈ dữ liệu hiện có trong DB đang trỏ tới.
allowed-tools: Bash(npx prisma db push:*), Bash(psql:*), Read
---

Đây là lệnh ảnh hưởng dữ liệu local — luôn xác nhận với người dùng trước khi chạy thật, kể cả khi họ gõ `/db-reset`.

Các bước theo đúng quy trình đã mô tả ở `db_setup_and_articles_plan.md` Phần 1:

1. Đọc `backend/.env` để lấy `DATABASE_URL` hiện tại. Hiển thị cho người dùng thấy DB nào sắp bị ghi đè (host/port/tên DB, che password) và hỏi xác nhận trước khi chạy bất kỳ lệnh nào — nếu tên DB/host trông giống môi trường không phải local (không phải `localhost`/`127.0.0.1`), dừng lại và cảnh báo rõ ràng thay vì tự chạy tiếp.
2. Sau khi được xác nhận: chạy `cd backend && npx prisma db push` để đồng bộ schema.
3. Nạp dữ liệu từ `database/office_care_backup_new.sql` bằng `psql` trỏ đúng `DATABASE_URL` vừa đọc (dùng flag kết nối tương ứng, không hardcode user/password khác với `.env`).
4. Báo cáo kết quả từng bước (thành công/lỗi), không tự ý thử lại nhiều lần nếu bước nào lỗi — dừng và báo lỗi cụ thể cho người dùng xử lý.

Không được chạy lệnh này nhắm vào DB không phải local nếu chưa được người dùng xác nhận rõ ràng bằng lời.

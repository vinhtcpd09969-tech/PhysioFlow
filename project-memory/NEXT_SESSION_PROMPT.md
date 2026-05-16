# Next Session Prompt

Chào bạn!

**Lưu ý: Đảm bảo Docker (PostgreSQL) đang chạy trước khi bắt đầu.**

## Mục tiêu phiên tới:

### 1. Phân tích Agent
- **Bắt buộc:** Đọc toàn bộ cấu hình của thư mục `.agent/agents` để nắm bắt rõ ràng vai trò và các tiêu chuẩn thiết kế/lập trình (đặc biệt là `frontend-specialist`).

### 2. Tiếp tục hoàn thiện Module Admin
- **Test Lịch hẹn:** Tiếp tục test kỹ lưỡng phần quản lý Lịch hẹn (đã thêm tính năng tạo mới bằng Slide-over và fix lỗi lệch múi giờ).
- **Hoàn thiện các Module còn lại:** Xây dựng hoàn chỉnh các module còn lại của Admin (Ca làm việc, Dịch vụ, Nhân sự, v.v.) để khớp 100% với cấu trúc database mới (`init_db.ts`).
- Mục tiêu là giúp hệ thống đạt chuẩn chỉnh nhất trước khi chuyển sang các chức năng của Lễ tân/Bác sĩ.

---

**Gợi ý Agent khởi đầu:**
"Hãy bắt đầu phiên làm việc. Bước đầu tiên, vui lòng đọc full cấu hình của folder `.agent/agents`. Sau đó, chúng ta sẽ tiếp tục kiểm tra module quản lý lịch hẹn của Admin và hoàn chỉnh các phần còn lại để khớp với database."

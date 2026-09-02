---
description: Tóm tắt phiên làm việc hiện tại (file đã sửa, nghiệp vụ đã giải quyết, lệnh test đã chạy) và ghi vào walkthrough.md để phiên sau kế thừa ngữ cảnh.
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Read, Edit, Write
---

Đọc `git status`, `git diff` (staged + unstaged) và `git log -15` để nắm phiên làm việc vừa qua.

Sau đó đọc `walkthrough.md` hiện có để giữ đúng văn phong/format (tiêu đề `## N. ...`, mục con `###`, có phần "Vấn đề" / "Giải pháp" / "Kết quả" khi phù hợp, link file dạng `[tên file](file:///đường/dẫn/tuyệt/đối)`).

Viết/nối thêm vào `walkthrough.md` một mục mới tóm tắt:
1. Các nghiệp vụ/tính năng đã giải quyết trong phiên này (không liệt kê lại các mục cũ đã có).
2. File chính đã sửa và bản chất thay đổi (không liệt kê từng dòng diff, chỉ nêu ý nghĩa nghiệp vụ).
3. Nếu có: lệnh test/build đã chạy và kết quả (vd `tsc` biên dịch thành công, script SQL đã chạy).

Nếu `git status` không có gì để tóm tắt (working tree sạch, không có commit mới so với lần handover trước), báo cho người dùng biết thay vì tạo mục trống.

Giữ tóm tắt ngắn gọn, đúng trọng tâm nghiệp vụ — không diễn giải lại toàn bộ code.

# Hướng dẫn thao tác Mục lục / Danh mục Bảng biểu / Danh mục Hình ảnh

> Áp dụng cho file `document/WD20302-nhóm2 (bản cập nhật OfficeCare) - v2 tái cấu trúc.docx`. File này có sẵn **3 mục lục tự động** — mỗi khi thêm nội dung mới (heading, bảng, hình), phải làm đúng bước bên dưới thì mục lục mới nhận ra nội dung đó, KHÔNG tự nhận nếu chỉ gõ chữ thường.

## 1. Ba mục lục trong tài liệu — cơ chế hoạt động

| Mục lục | Field code | Lấy dữ liệu từ đâu |
|---|---|---|
| **Mục lục** (chính) | `TOC \o "1-3" \h \z \u` | Mọi đoạn văn có style **Heading1 / Heading2 / Heading3** (cấp 1–3) |
| **Mục lục Hình ảnh** | `TOC \h \z \c "Hình"` | Mọi **Caption** có chữ bắt đầu `Hình` (do lệnh "Insert Caption" tự sinh) |
| **Mục lục Bảng biểu** | `TOC \h \z \c "Bảng"` | Mọi **Caption** có chữ bắt đầu `Bảng` |

Nguyên tắc cốt lõi: **mục lục KHÔNG đọc chữ bạn gõ, nó đọc STYLE của đoạn văn.** Gõ "1.1.2 Tên mục" bằng chữ thường, tô đậm tay — mục lục không thấy gì cả. Phải gán đúng style thì mới tự động xuất hiện, và số trang/số thứ tự cũng tự tính, không gõ tay.

## 2. Thêm 1 mục mới vào Mục lục chính (ví dụ thêm "1.1.2 Tên mục")

1. Gõ nội dung heading tại đúng vị trí cần trong tài liệu.
2. Bôi đen dòng đó → tab **Home** → khung **Styles** → chọn đúng cấp:
   - Cấp lớn nhất (PHẦN 1, PHẦN 2...) → **Heading 1**
   - Cấp 2 (1.1, 1.2, 4.1...) → **Heading 2**
   - Cấp 3 (1.1.2, 4.1.1...) → **Heading 3**
3. Số thứ tự "1.1.2" tự động hiện ra (nếu style đã gắn sẵn numbering — kiểm tra bằng cách xem các heading cùng cấp khác có tự đánh số không; nếu không, gõ tay số ngay trong dòng heading, đây là cách tài liệu này đang làm — số được gõ thủ công như một phần văn bản, không phải numbered list tự động).
4. Vào tab **References** → **Table of Contents** → **Update Table...** (hoặc đơn giản: `Ctrl+A` chọn toàn bộ văn bản → phím **F9** → xuất hiện hộp thoại → chọn **Update entire table**).
5. Mở lại Mục lục ở đầu tài liệu để xác nhận dòng mới đã xuất hiện đúng vị trí, đúng số trang.

> ⚠️ Nếu Word hỏi *"Do you want to save changes... update fields before printing?"* khi mở file — luôn chọn **Yes**.

## 3. Thêm 1 bảng mới và đưa vào Mục lục Bảng biểu

1. Chèn bảng bình thường (Insert → Table).
2. Bấm chuột phải vào bảng (hoặc bôi đen dòng ngay trên/dưới bảng dùng làm chú thích) → chọn **Insert Caption...**
3. Trong hộp thoại Caption:
   - **Label**: chọn **Bảng** (nếu danh sách chưa có "Bảng", bấm **New Label...** gõ "Bảng" — nhưng file này ĐÃ có sẵn label "Bảng" rồi, không cần tạo lại).
   - **Position**: theo đúng quy ước hiện tại của file — **caption đặt NGAY SAU bảng** (không phải phía trên).
   - Word tự động điền số thứ tự (Bảng 1, Bảng 2... theo đúng vị trí xuất hiện trong tài liệu — không phải theo tay bạn gõ).
4. Gõ thêm mô tả ngắn ngay sau số, ví dụ: `Bảng 25. Đặc tả giao diện Trang chủ`.
5. Cập nhật mục lục: `Ctrl+A` → `F9` → **Update entire table** (bước này cập nhật LẠI CẢ 3 mục lục cùng lúc, không cần làm riêng từng cái).

**Nếu bảng đã tồn tại nhưng thiếu caption** (trường hợp hay gặp khi copy-paste từ tài liệu khác): làm lại bước 2–5 ở trên, chọn đúng vị trí ngay sau bảng.

## 4. Thêm 1 hình ảnh mới và đưa vào Mục lục Hình ảnh

Hoàn toàn giống mục 3, chỉ khác:
- **Label** chọn **Hình** thay vì Bảng.
- **Position** trong file này đặt **NGAY DƯỚI hình** (khác bảng — bảng đặt caption dưới, hình cũng đặt dưới, cả hai đều là "dưới đối tượng" trong file này, không phải "trên").
- Kết quả ví dụ: `Hình 15. Wireframe Trang chủ`.

## 5. Trường hợp đặc biệt: heading chỉ tồn tại để giới thiệu 1 bảng/hình duy nhất

Đây là tình huống đã gặp rất nhiều trong file này (phần "Đặc tả Use Case", phần "Kiểm thử"): 1 heading (ví dụ "6.1.2 Kiểm thử form quên mật khẩu") mà bên dưới **không có gì khác ngoài đúng 1 cái bảng**. Nếu để heading này vừa vào Mục lục chính, vừa có caption vào Mục lục Bảng biểu → 2 mục lục nói cùng một chuyện, Mục lục chính bị rối vì có quá nhiều mục vụn vặt lặp lại.

**Cách xử lý đã áp dụng trong file này:** heading loại này dùng style **`Heading3NoTOC`** (style tùy chỉnh đã tạo sẵn trong file, xem mục Styles) thay vì `Heading3` thường — style này **giữ nguyên hình thức hiển thị y hệt Heading3** (cỡ chữ, màu, khoảng cách) nhưng **bị loại khỏi Mục lục chính**. Bảng/hình bên dưới vẫn có caption bình thường nên vẫn lên đúng Mục lục Bảng biểu/Hình ảnh — không mất thông tin, chỉ đỡ trùng lặp.

**Cách áp dụng:** bôi đen dòng heading → khung Styles → gõ tìm "Heading3NoTOC" → chọn nó (thay vì Heading 3 mặc định).

⚠️ **Lưu ý quan trọng đã xác nhận qua thực tế:** chỉnh riêng thuộc tính "outline level" của một đoạn văn (Paragraph → Outline Level trong hộp thoại Paragraph) **KHÔNG đủ** để loại một heading khỏi mục lục `\o "1-3"` — Word vẫn quét theo **tên style**, không chỉ theo outline level. Phải đổi hẳn sang style `Heading3NoTOC` mới có tác dụng thật (đã thử outline-level-only trước, không ăn, phải tạo style riêng).

**Khi nào NÊN dùng `Heading3NoTOC`, khi nào KHÔNG:**
- ✅ Dùng khi: heading chỉ là "vỏ bọc" cho đúng 1 bảng/hình, không có đoạn văn nào khác, và có nhiều heading tương tự lặp lại liên tiếp (danh sách Use Case, danh sách ca kiểm thử...).
- ❌ KHÔNG dùng khi: heading là mục điều hướng độc lập, có ý nghĩa riêng dù bên dưới có bảng (ví dụ "THUẬT NGỮ VÀ CÁC TỪ VIẾT TẮT", hoặc các trang UI như "4.1.1 Trang chủ" — heading này còn gắn với 1 hình wireframe riêng, là tên trang thật người đọc muốn tìm nhanh) — những heading này **giữ nguyên Heading3 bình thường**, chỉ cần bổ sung caption còn thiếu cho bảng bên trong, không đổi style heading.

## 6. Bảng tổng hợp style đang dùng trong file

| Style | Dùng cho | Có trong Mục lục chính? |
|---|---|---|
| `Heading 1` | PHẦN 1, PHẦN 2... | Có |
| `Heading 2` | Mục 2 chữ số (1.1, 4.1...) | Có |
| `Heading 3` | Mục 3 chữ số (1.1.2, 4.1.1...) | Có |
| `Heading3NoTOC` | Heading chỉ giới thiệu 1 bảng, không có nội dung khác | **Không** (cố ý ẩn) |
| `Caption` | Chú thích "Bảng N. ..." / "Hình N. ..." | Không (nhưng lên Mục lục Bảng biểu/Hình ảnh riêng) |

## 7. Checklist nhanh mỗi khi thêm nội dung mới

- [ ] Heading mới đã gán đúng cấp Heading 1/2/3 (hoặc Heading3NoTOC nếu thuộc trường hợp mục 5)?
- [ ] Bảng mới đã có caption "Bảng N. ..." ngay sau bảng chưa?
- [ ] Hình mới đã có caption "Hình N. ..." ngay dưới hình chưa?
- [ ] Đã `Ctrl+A` → `F9` → **Update entire table** để cả 3 mục lục tính lại số đúng chưa?
- [ ] Mở lại đầu tài liệu, lướt qua cả 3 mục lục xem có dòng nào sai vị trí/trùng lặp không?

## 8. Ghi chú cho AI (nếu sửa trực tiếp file .docx bằng code thay vì thao tác tay trong Word)

Nếu một AI khác cần sửa file này bằng cách bóc tách XML (thay vì hướng dẫn người dùng thao tác tay ở trên):

- File `.docx` thực chất là file `.zip` — giải nén bằng `7z x file.docx`, sửa `word/document.xml`, nén lại bằng `7z a -tzip -mx=6`.
- Mỗi caption "Bảng N." là 1 đoạn văn style `Caption`, chứa field code `SEQ Bảng \* ARABIC` (số N tự tính khi Word Update Field — không cần tính tay số chính xác khi tạo mới, chỉ cần điền tạm 1 số bất kỳ vào phần cached result, Word sẽ tự sửa lại đúng khi người dùng Update Field). Tương tự "Hình N." dùng `SEQ Hình \* ARABIC`.
- **KHÔNG tự thêm `bookmarkStart`/`bookmarkEnd` cho caption mới** — Word tự sinh bookmark `_Toc########` khi Update Field, tự thêm tay dễ trùng ID với bookmark có sẵn trong file, gây lỗi khó phát hiện.
- Trước khi sửa: đếm số lượng thẻ `<w:p>`, `<w:r>`, `<w:tr>`, `<w:tc>`, `<w:tbl>` (mở/đóng) làm baseline. Sau khi sửa: đếm lại, so sánh **đúng phần chênh lệch dự kiến** (ví dụ thêm 1 caption = +7 `<w:r>` theo cấu trúc field code chuẩn 7-run đã dùng trong file này) — không được lệch bất thường, nếu lệch nghĩa là XML bị hỏng cấu trúc.
- Kiểm tra thêm bộ đếm `bookmarkStart`/`bookmarkEnd` toàn file trước/sau — phải bằng nhau tuyệt đối (không phát sinh orphan mới).
- **Luôn kiểm tra file `.docx` không đang mở trong Word** trước khi ghi đè (tìm file `~$<tên file>.docx` cùng thư mục — nếu tồn tại, thử mở file thật ở chế độ ReadWrite exclusive để xác nhận có bị khóa thật hay chỉ là file khóa còn sót lại; xem thêm cách kiểm tra bằng PowerShell `[System.IO.File]::Open(...)`).
- Sau khi ghi đè file, luôn nhắc người dùng mở lại bằng Word và làm bước 4 ở mục 4/mục 7 (Update Field) — các thay đổi cấu trúc XML không tự "render" ra số đếm đúng cho tới khi Word tính lại field.

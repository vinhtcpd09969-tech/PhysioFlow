# Hướng Dẫn Từng Bước Vẽ Sơ Đồ Hoạt Động (Activity Diagram) - OfficeCare

Tài liệu này chi tiết hóa cách vẽ sơ đồ hoạt động bằng các ký hiệu chuẩn UML (như hình tròn, hình thoi, hình hộp chữ nhật bo góc, thanh đồng bộ) cho **Luồng Đặt Lịch Khám** và **Luồng Đặt Lịch Điều Trị**.

---

## I. CÁC HÌNH KHỐI CHUẨN ĐƯỢC SỬ DỤNG
Khi vẽ sơ đồ hoạt động (bằng công cụ như Draw.io, Visio, Lucidchart hoặc vẽ tay), bạn sẽ sử dụng các hình khối chuẩn sau:

| Ký hiệu | Tên gọi | Ý nghĩa y khoa / vận hành |
| :---: | :--- | :--- |
| ⚫ | **Điểm Bắt Đầu (Start Node)** | Hình tròn đen đặc, biểu diễn điểm khởi đầu luồng. |
| 🔲 | **Hoạt Động (Action Node)** | Hình chữ nhật bo góc, chứa hành động thực tế. |
| 🔷 | **Điểm Quyết Định (Decision Node)** | Hình thoi, dùng rẽ nhánh dựa trên điều kiện (Đúng/Sai). |
| ➖ | **Thanh Đồng Bộ (Fork/Merge Bar)** | Thanh ngang/dọc đậm, gom các nhánh rẽ hoặc chạy song song về 1 luồng. |
| 🎯 | **Điểm Kết Thúc (End Node)** | Hình tròn lồng có nhân đen ở giữa, biểu diễn điểm dừng quy trình. |

---

## II. HƯỚNG DẪN TỪNG BƯỚC VẼ SƠ ĐỒ ĐẶT LỊCH KHÁM (INITIAL EXAM)

Mục tiêu sơ đồ này là tiếp nhận thông tin khách hàng, tự động tính toán sức chứa dựa trên tổng số Bác sĩ trực và tổng số giường của tất cả phòng khám hoạt động trong khung giờ đó (bệnh nhân không chọn bác sĩ), đảm bảo giữ chỗ (trừ sức chứa) ngay khi gửi yêu cầu.

### Các bước vẽ chi tiết:

```
Step 1:  ⚫ [Điểm bắt đầu]
          ↓
Step 2:  🔲 [Hành động]: "Bệnh nhân chọn dịch vụ khám lâm sàng trên website"
          ↓
Step 3:  🔷 [Hình thoi]: "Kiểm tra sức chứa khả dụng của từng khung giờ?"
          ├── Sức chứa khả dụng = min(Tổng số Bác sĩ trực ca đó, Tổng sức chứa giường của tất cả các phòng khám sẵn sàng) - Tổng số lịch hẹn trùng ca đang hoạt động
          ├── Sức chứa khả dụng <= 0 ──> 🔲 [Hành động]: "Ẩn khung giờ đó hoặc hiển thị trạng thái Đầy"
          └── Sức chứa khả dụng > 0 ───> 🔲 [Hành động]: "Hiển thị khung giờ còn trống để chọn"
                                            ↓
Step 4:  🔲 [Hành động]: "Bệnh nhân chọn khung giờ khả dụng và nhập thông tin cá nhân"
          ↓
Step 5:  🔲 [Hành động]: "Bệnh nhân gửi yêu cầu đặt lịch khám"
          ↓
Step 6:  🔲 [Hành động]: "OfficeCare tạo lịch hẹn trạng thái Chưa xác nhận và trừ sức chứa của khung giờ khách chọn"
          ↓
Step 7:  🔲 [Hành động]: "Hệ thống gửi Email xác nhận tự động cho bệnh nhân"
          ↓
Step 8:  🔷 [Hình thoi]: "Khách hàng click xác nhận qua Email trong vòng 10 phút?"
          ├── Có ──────> [Tự động cập nhật thành Chờ xác nhận] ──> (Chuyển tiếp đến Step 12 - Quản lý phân bổ & phê duyệt)
          └── Không ──> 🔲 [Hành động]: "Hiển thị lịch hẹn lên màn hình gọi của Lễ tân"
                            ↓
Step 9: 🔲 [Hành động]: "Lễ tân gọi điện trực tiếp cho bệnh nhân để xác nhận thủ công"
                            ↓
Step 10: 🔷 [Hình thoi]: "Kết quả liên hệ sau tối đa 3 cuộc gọi?"
          ├── Không nghe máy >= 3 cuộc ──> 🔲 [Hành động]: "Lễ tân hủy lịch hẹn -> Giải phóng sức chứa của khung giờ đó" ──> 🎯 [Kết thúc: Hủy lịch]
          └── Bắt máy & Xác nhận ────────> 🔲 [Hành động]: "Lễ tân xác nhận bằng tay & chuyển yêu cầu lên Quản lý"
                                              ↓
Step 11: ➖ [Thanh ngang đồng bộ/Merge] (Hội tụ luồng mail và luồng duyệt tay)
          ↓
Step 12: 🔲 [Hành động]: "Quản lý đối chiếu lịch trực Bác sĩ, chỉ định Bác sĩ & Phòng khám cụ thể cho ca khám"
          ↓
Step 13: 🔲 [Hành động]: "Quản lý phê duyệt chính thức lịch hẹn -> Trạng thái Đã xác nhận"
          ↓
Step 14: 🔲 [Hành động]: "Khóa ca khám Bác sĩ & gửi thông báo tin nhắn kèm mã QR check-in"
          ↓
Step 15: 🎯 [Điểm kết thúc]
```

### Mã biểu diễn trực quan (Mermaid):
```mermaid
graph TD
    classDef default fill:#fff,stroke:#d1d5db,stroke-width:1px,color:#1f2937;
    classDef startEnd fill:#f0fdfa,stroke:#14b8a6,stroke-width:2px,color:#0f766e;
    classDef condition fill:#fffbeb,stroke:#f59e0b,stroke-width:1.5px,color:#b45309;

    Start([⚫ Bắt đầu]) :::startEnd --> SelectService[🔲 Bệnh nhân chọn dịch vụ khám lâm sàng]
    SelectService --> CheckCapacity{🔷 Sức chứa khả dụng của khung giờ > 0?<br>Sức chứa = min_Bác_sĩ_trực, Giường_phòng_khám - Lịch_hẹn_trùng_giờ} :::condition
    
    CheckCapacity -->|Không| HideSlot[🔲 Ẩn khung giờ / Hiển thị Đầy]
    CheckCapacity -->|Có| ShowSlot[🔲 Hiển thị khung giờ còn trống để chọn]
    
    HideSlot --> SelectService
    ShowSlot --> SelectTime[🔲 Bệnh nhân chọn khung giờ và nhập thông tin cá nhân]
    
    SelectTime --> SubmitAppt[🔲 Bệnh nhân gửi yêu cầu đặt lịch khám]
    
    SubmitAppt --> CreatePending[🔲 Tạo lịch hẹn trạng thái Chưa xác nhận<br>và trừ sức chứa của khung giờ khách chọn]
    
    CreatePending --> CheckEmail{🔷 Khách xác nhận qua Email trong 10 phút?} :::condition
    
    %% Nhánh 1: Xác nhận qua mail thành công
    CheckEmail -->|Có| AutoConfirm[🔲 Tự động cập nhật thành Chờ xác nhận] --> ManagerAssign[🔲 Quản lý đối chiếu, chỉ định Phòng khám & Bác sĩ cụ thể]
    
    CheckEmail -->|Không| ShowToReception[🔲 Hiển thị lịch hẹn lên màn hình gọi của Lễ tân]
    ShowToReception --> CallClient[🔲 Lễ tân gọi điện xác nhận cho khách]
    
    CallClient --> CheckCall{🔷 Kết quả cuộc gọi?} :::condition
    
    CheckCall -->|Không nghe máy >= 3 cuộc| CancelAppt[🔲 Lễ tân hủy lịch hẹn & Giải phóng sức chứa khung giờ đó]
    CancelAppt --> EndCancel([🎯 Kết thúc: Hủy lịch]) :::startEnd
    
    CheckCall -->|Bắt máy & xác nhận| ManualConfirm[🔲 Lễ tân xác nhận bằng tay & gửi lên Quản lý]
    
    ManualConfirm --> ManagerAssign
    
    ManagerAssign --> ManagerApprove[🔲 Quản lý phê duyệt chính thức -> Trạng thái Đã xác nhận]
    ManagerApprove --> LockResource[🔲 Khóa ca trực Bác sĩ & Phòng khám được chỉ định]
    LockResource --> SendQR[🔲 Gửi SMS/Zalo kèm mã QR check-in]
    SendQR --> EndExam([🎯 Kết thúc: Đặt lịch thành công]) :::startEnd
```

---

## III. HƯỚNG DẪN TỪNG BƯỚC VẼ SƠ ĐỒ ĐẶT LỊCH ĐIỀU TRỊ (THERAPY SESSION)

Mục tiêu sơ đồ này là đặt một buổi tập cụ thể thuộc gói dịch vụ trị liệu đã mua, đảm bảo đủ KTV, Giường điều trị, và Thiết bị chuyên dụng.

### Các bước vẽ chi tiết:

```
Step 1:  ⚫ [Điểm bắt đầu]
          ↓
Step 2:  🔲 [Hành động]: "Nhập mã bệnh nhân hoặc số điện thoại"
          ↓
Step 3:  🔲 [Hành động]: "OfficeCare tra cứu hồ sơ gói liệu trình"
          ↓
Step 4:  🔷 [Hình thoi]: "Gói điều trị còn buổi khả dụng?"
          ├── Không ──> 🔲 [Hành động]: "Báo hết số buổi & Gợi ý mua gói mới" ──> 🎯 [Kết thúc phụ]
          └── Có ──────> 🔲 [Hành động]: "Tải danh mục kỹ thuật & thiết bị trong phác đồ"
                            ↓
Step 5:  🔲 [Hành động]: "Bệnh nhân chọn Ngày & Khung giờ mong muốn"
          ↓
Step 6:  🔷 [Hình thoi]: "Thiết bị y khoa chỉ định còn trống?"
          ├── Không ──> 🔲 [Hành động]: "Đề xuất giờ khác / Máy tương đương" ──> (Quay lại Step 5)
          └── Có ──────> 🔷 [Hình thoi]: "Kỹ thuật viên chuyên trách có ca trực?"
                            ├── Không ──> 🔲 [Hành động]: "Đề xuất KTV dự phòng / đổi giờ" ──> (Quay lại Step 5)
                            └── Có ──────> 🔷 [Hình thoi]: "Còn giường trống tại phòng trị liệu?"
                                              ├── Không ──> 🔲 [Hành động]: "Báo quá tải giường" ──> (Quay lại Step 5)
                                              └── Có ──────> 🔲 [Hành động]: "Xác nhận lịch hẹn điều trị"
                                                                ↓
Step 7:  🔲 [Hành động]: "Khóa tài nguyên (KTV + Thiết bị + Giường) & Trừ 1 buổi của gói"
          ↓
Step 8:  ➖ [Thanh ngang đồng bộ] (Gộp các nhánh xác nhận lại)
          ↓
Step 9:  🔲 [Hành động]: "Gửi nhắc nhở lịch hẹn điều trị cho bệnh nhân & KTV"
          ↓
Step 10: 🎯 [Điểm kết thúc]
```

### Mã biểu diễn trực quan (Mermaid):
```mermaid
graph TD
    classDef default fill:#fff,stroke:#d1d5db,stroke-width:1px,color:#1f2937;
    classDef startEnd fill:#f0fdfa,stroke:#14b8a6,stroke-width:2px,color:#0f766e;
    classDef condition fill:#fffbeb,stroke:#f59e0b,stroke-width:1.5px,color:#b45309;

    Start([⚫ Bắt đầu]) :::startEnd --> InputId[🔲 Nhập mã bệnh nhân / SĐT]
    InputId --> FetchRecord[🔲 OfficeCare tra cứu hồ sơ gói liệu trình]
    
    FetchRecord --> CheckSession{🔷 Gói còn buổi khả dụng?} :::condition
    CheckSession -->|Không| BuyNew[🔲 Báo hết buổi & Gợi ý mua gói mới]
    BuyNew --> EndPurchase([🎯 Kết thúc: Mua gói]) :::startEnd
    
    CheckSession -->|Còn| LoadProtocols[🔲 Tải danh mục kỹ thuật & máy y khoa trong phác đồ]
    LoadProtocols --> ChooseTime[🔲 Chọn Ngày & Khung giờ điều trị]
    
    ChooseTime --> CheckDevice{🔷 Thiết bị y khoa trống?} :::condition
    CheckDevice -->|Không| SuggestDevice[🔲 Đề xuất giờ khác hoặc máy tương đương]
    SuggestDevice --> ChooseTime
    
    CheckDevice -->|Có| CheckKTV{🔷 KTV chuyên trách có ca trực?} :::condition
    CheckKTV -->|Không| SuggestKTV[🔲 Đề xuất KTV dự phòng hoặc đổi giờ]
    SuggestKTV --> ChooseTime
    
    CheckKTV -->|Có| CheckBed{🔷 Còn giường trống tại phòng trị liệu?} :::condition
    CheckBed -->|Không| Overloaded[🔲 Báo quá tải giường điều trị]
    Overloaded --> ChooseTime
    
    CheckBed -->|Có| ConfirmBooking[🔲 Xác nhận đặt lịch & trừ 1 buổi của gói]
    
    ConfirmBooking --> SyncBar[➖ Thanh ngang đồng bộ]
    
    SyncBar --> Finalize[🔲 Khóa KTV + Thiết bị + Giường & Gửi nhắc hẹn]
    Finalize --> EndTherapy([🎯 Kết thúc]) :::startEnd
```

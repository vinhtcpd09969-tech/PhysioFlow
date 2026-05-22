DO $$
DECLARE
    v_khach_hang_1_id uuid;
    v_khach_hang_1_hoten varchar;
    v_khach_hang_1_sdt varchar;
    v_khach_hang_1_gt varchar;
    
    v_khach_hang_2_id uuid;
    v_khach_hang_2_hoten varchar;
    v_khach_hang_2_sdt varchar;
    v_khach_hang_2_gt varchar;
    
    v_ktv_1_id uuid;
    v_ktv_2_id uuid;
    
    v_bs_1_id uuid;
    v_bs_2_id uuid;
    
    v_phong_1_id bigint;
    v_phong_2_id bigint;
    
    v_dich_vu_1_id uuid;
    v_dich_vu_2_id uuid;
    
    v_goi_1_id uuid;
    
    v_ldt_1_id uuid;
    v_ldt_2_id uuid;
    v_ldt_3_id uuid;
BEGIN
    -- Lấy khách hàng 1
    SELECT k.id, n.ho_ten, n.so_dien_thoai, k.gioi_tinh 
    INTO v_khach_hang_1_id, v_khach_hang_1_hoten, v_khach_hang_1_sdt, v_khach_hang_1_gt
    FROM public.khach_hang k
    JOIN public.nguoi_dung n ON k.nguoi_dung_id = n.id
    ORDER BY k.thoi_gian_tao ASC LIMIT 1;

    -- Lấy khách hàng 2
    SELECT k.id, n.ho_ten, n.so_dien_thoai, k.gioi_tinh 
    INTO v_khach_hang_2_id, v_khach_hang_2_hoten, v_khach_hang_2_sdt, v_khach_hang_2_gt
    FROM public.khach_hang k
    JOIN public.nguoi_dung n ON k.nguoi_dung_id = n.id
    ORDER BY k.thoi_gian_tao DESC LIMIT 1;
    
    -- Lấy Kỹ thuật viên (Chuyên gia y tế) - vai_tro_id = 3
    SELECT c.id INTO v_ktv_1_id FROM public.chuyen_gia_y_te c JOIN public.nguoi_dung n ON c.nguoi_dung_id = n.id WHERE n.vai_tro_id = 3 ORDER BY c.id ASC LIMIT 1 OFFSET 0;
    SELECT c.id INTO v_ktv_2_id FROM public.chuyen_gia_y_te c JOIN public.nguoi_dung n ON c.nguoi_dung_id = n.id WHERE n.vai_tro_id = 3 ORDER BY c.id ASC LIMIT 1 OFFSET 1;

    -- Lấy Bác sĩ - vai_tro_id = 4
    SELECT c.id INTO v_bs_1_id FROM public.chuyen_gia_y_te c JOIN public.nguoi_dung n ON c.nguoi_dung_id = n.id WHERE n.vai_tro_id = 4 ORDER BY c.id ASC LIMIT 1 OFFSET 0;
    SELECT c.id INTO v_bs_2_id FROM public.chuyen_gia_y_te c JOIN public.nguoi_dung n ON c.nguoi_dung_id = n.id WHERE n.vai_tro_id = 4 ORDER BY c.id ASC LIMIT 1 OFFSET 1;
    
    -- Lấy phòng
    SELECT id INTO v_phong_1_id FROM public.phong ORDER BY id ASC LIMIT 1 OFFSET 0;
    SELECT id INTO v_phong_2_id FROM public.phong ORDER BY id ASC LIMIT 1 OFFSET 1;
    
    -- Lấy dịch vụ
    SELECT id INTO v_dich_vu_1_id FROM public.dich_vu ORDER BY id ASC LIMIT 1 OFFSET 0;
    SELECT id INTO v_dich_vu_2_id FROM public.dich_vu ORDER BY id ASC LIMIT 1 OFFSET 1;
    
    -- Lấy gói dịch vụ
    SELECT id INTO v_goi_1_id FROM public.goi_dich_vu ORDER BY id ASC LIMIT 1;

    -- Xóa dữ liệu cũ để chạy lại không bị trùng
    DELETE FROM public.hoa_don_chi_tiet WHERE hoa_don_id IN (SELECT id FROM public.hoa_don WHERE lich_dat_id IS NOT NULL);
    DELETE FROM public.thanh_toan WHERE hoa_don_id IN (SELECT id FROM public.hoa_don WHERE lich_dat_id IS NOT NULL);
    DELETE FROM public.hoa_don WHERE lich_dat_id IS NOT NULL;
    DELETE FROM public.danh_gia_dich_vu;
    DELETE FROM public.buoi_tri_lieu;
    DELETE FROM public.lich_dieu_tri;
    DELETE FROM public.lich_dat;

    -----------------------------------------------------
    -- TẠO LỊCH KHÁM MỚI (Dùng ID Bác Sĩ: v_bs_1_id, v_bs_2_id)
    -----------------------------------------------------
    -- 1. Chờ xác nhận
    INSERT INTO public.lich_dat (id, ma_lich_dat, khach_hang_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, dich_vu_id, ky_thuat_vien_id, phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, ly_do_kham, trang_thai, thoi_gian_tao)
    VALUES (gen_random_uuid(), 'BK8801', v_khach_hang_1_id, v_khach_hang_1_hoten, v_khach_hang_1_sdt, v_khach_hang_1_gt, v_dich_vu_1_id, v_bs_1_id, v_phong_1_id, '2026-05-19 14:00:00', '2026-05-19 15:00:00', 'Đau nhức cổ vai gáy do ngồi máy tính nhiều', 'cho_xac_nhan', NOW());
    
    INSERT INTO public.lich_dat (id, ma_lich_dat, khach_hang_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, dich_vu_id, ky_thuat_vien_id, phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, ly_do_kham, trang_thai, thoi_gian_tao)
    VALUES (gen_random_uuid(), 'BK8802', v_khach_hang_2_id, v_khach_hang_2_hoten, v_khach_hang_2_sdt, v_khach_hang_2_gt, v_dich_vu_2_id, v_bs_2_id, v_phong_2_id, '2026-05-19 08:30:00', '2026-05-19 09:30:00', 'Tê bì tay trái', 'cho_xac_nhan', NOW());

    -- 2. Đã xác nhận
    INSERT INTO public.lich_dat (id, ma_lich_dat, khach_hang_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, dich_vu_id, ky_thuat_vien_id, phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, ly_do_kham, trang_thai, thoi_gian_tao)
    VALUES (gen_random_uuid(), 'BK8803', v_khach_hang_1_id, v_khach_hang_1_hoten, v_khach_hang_1_sdt, v_khach_hang_1_gt, v_dich_vu_2_id, v_bs_1_id, v_phong_2_id, '2026-05-19 15:30:00', '2026-05-19 16:30:00', 'Đau cột sống thắt lưng', 'da_xac_nhan', NOW());

    -- 3. Đã check-in (Đang chờ khám/đang khám)
    INSERT INTO public.lich_dat (id, ma_lich_dat, khach_hang_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, dich_vu_id, ky_thuat_vien_id, phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, ly_do_kham, trang_thai, thoi_gian_checkin, thoi_gian_tao)
    VALUES (gen_random_uuid(), 'BK8805', v_khach_hang_1_id, v_khach_hang_1_hoten, v_khach_hang_1_sdt, v_khach_hang_1_gt, v_dich_vu_1_id, v_bs_2_id, v_phong_2_id, '2026-05-19 09:00:00', '2026-05-19 10:00:00', 'Khám chấn thương thể thao', 'da_checkin', '2026-05-19 08:50:00', NOW());

    INSERT INTO public.lich_dat (id, ma_lich_dat, khach_hang_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, dich_vu_id, ky_thuat_vien_id, phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, ly_do_kham, trang_thai, thoi_gian_checkin, thoi_gian_tao)
    VALUES (gen_random_uuid(), 'BK8806', v_khach_hang_2_id, v_khach_hang_2_hoten, v_khach_hang_2_sdt, v_khach_hang_2_gt, v_dich_vu_2_id, v_bs_1_id, v_phong_1_id, '2026-05-19 10:30:00', '2026-05-19 11:30:00', 'Tái khám vai gáy', 'da_checkin', '2026-05-19 10:15:00', NOW());

    -- 4. Đã hoàn thành (Có chẩn đoán và ghi chú lâm sàng)
    INSERT INTO public.lich_dat (id, ma_lich_dat, khach_hang_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, dich_vu_id, ky_thuat_vien_id, phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, ly_do_kham, trang_thai, thoi_gian_checkin, chan_doan, chong_chi_dinh, khuyen_nghi_goi_id, thoi_gian_tao)
    VALUES (gen_random_uuid(), 'BK8807', v_khach_hang_1_id, v_khach_hang_1_hoten, v_khach_hang_1_sdt, v_khach_hang_1_gt, v_dich_vu_1_id, v_bs_1_id, v_phong_1_id, '2026-05-18 14:00:00', '2026-05-18 15:00:00', 'Căng cơ vùng cổ', 'hoan_thanh', '2026-05-18 13:45:00', 'Thoái hóa đốt sống cổ C4-C5 nhẹ', 'Không có', v_goi_1_id, NOW());

    -- 5. Hủy
    INSERT INTO public.lich_dat (id, ma_lich_dat, khach_hang_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, dich_vu_id, ky_thuat_vien_id, phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, ly_do_kham, trang_thai, thoi_gian_huy, ly_do_huy, thoi_gian_tao)
    VALUES (gen_random_uuid(), 'BK8812', v_khach_hang_2_id, v_khach_hang_2_hoten, v_khach_hang_2_sdt, v_khach_hang_2_gt, v_dich_vu_2_id, v_bs_2_id, v_phong_2_id, '2026-05-19 16:30:00', '2026-05-19 17:30:00', 'Kiểm tra cột sống', 'da_huy', '2026-05-19 14:00:00', 'Khách bận', NOW());

    -----------------------------------------------------
    -- TẠO LỊCH TRÌNH & BUỔI ĐIỀU TRỊ CHI TIẾT (Dùng ID KTV: v_ktv_1_id, v_ktv_2_id)
    -----------------------------------------------------
    
    -- Lộ trình 1
    INSERT INTO public.lich_dieu_tri (id, ma_lich_dieu_tri, khach_hang_id, ho_ten_khach, so_dien_thoai, loai_dieu_tri, goi_dich_vu_id, tong_so_buoi, so_buoi_da_dung, trang_thai, thoi_gian_tao)
    VALUES (gen_random_uuid(), 'TRT9901', v_khach_hang_1_id, v_khach_hang_1_hoten, v_khach_hang_1_sdt, 'theo_goi', v_goi_1_id, 10, 3, 'dang_dieu_tri', NOW())
    RETURNING id INTO v_ldt_1_id;

    -- Tạo 2 buổi điều trị cho Lộ trình 1 (Hiển thị lên lưới Lịch Điều Trị hôm nay)
    INSERT INTO public.buoi_tri_lieu (id, lich_dieu_tri_id, khach_hang_id, ky_thuat_vien_id, phong_id, dich_vu_id, thoi_gian_bat_dau, thoi_gian_ket_thuc, trang_thai)
    VALUES (gen_random_uuid(), v_ldt_1_id, v_khach_hang_1_id, COALESCE(v_ktv_1_id, v_bs_1_id), v_phong_1_id, v_dich_vu_2_id, '2026-05-19 08:00:00', '2026-05-19 09:00:00', 'dang_thuc_hien');

    INSERT INTO public.buoi_tri_lieu (id, lich_dieu_tri_id, khach_hang_id, ky_thuat_vien_id, phong_id, dich_vu_id, thoi_gian_bat_dau, thoi_gian_ket_thuc, trang_thai)
    VALUES (gen_random_uuid(), v_ldt_1_id, v_khach_hang_1_id, COALESCE(v_ktv_2_id, v_bs_2_id), v_phong_2_id, v_dich_vu_2_id, '2026-05-19 14:30:00', '2026-05-19 15:30:00', 'cho_thuc_hien');

    -- Lộ trình 2
    INSERT INTO public.lich_dieu_tri (id, ma_lich_dieu_tri, khach_hang_id, ho_ten_khach, so_dien_thoai, loai_dieu_tri, dich_vu_id, tong_so_buoi, so_buoi_da_dung, trang_thai, thoi_gian_tao)
    VALUES (gen_random_uuid(), 'TRT9902', v_khach_hang_2_id, v_khach_hang_2_hoten, v_khach_hang_2_sdt, 'dich_vu_le', v_dich_vu_2_id, 1, 0, 'dang_dieu_tri', NOW())
    RETURNING id INTO v_ldt_2_id;

    -- Tạo 1 buổi điều trị lẻ cho Lộ trình 2
    INSERT INTO public.buoi_tri_lieu (id, lich_dieu_tri_id, khach_hang_id, ky_thuat_vien_id, phong_id, dich_vu_id, thoi_gian_bat_dau, thoi_gian_ket_thuc, trang_thai)
    VALUES (gen_random_uuid(), v_ldt_2_id, v_khach_hang_2_id, COALESCE(v_ktv_1_id, v_bs_1_id), v_phong_1_id, v_dich_vu_2_id, '2026-05-19 16:00:00', '2026-05-19 17:00:00', 'cho_thuc_hien');

END $$;

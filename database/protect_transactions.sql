CREATE OR REPLACE FUNCTION protect_giao_dich_thanh_toan()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'Không thể cập nhật thông tin giao dịch thanh toán đã ghi nhận.';
    ELSIF TG_OP = 'DELETE' THEN
        IF EXISTS (SELECT 1 FROM hoa_don WHERE id = OLD.hoa_don_id) THEN
            RAISE EXCEPTION 'Không thể xóa trực tiếp giao dịch thanh toán khi hóa đơn liên quan vẫn tồn tại.';
        END IF;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_giao_dich_thanh_toan ON giao_dich_thanh_toan;

CREATE TRIGGER trg_protect_giao_dich_thanh_toan
BEFORE UPDATE OR DELETE ON giao_dich_thanh_toan
FOR EACH ROW
EXECUTE FUNCTION protect_giao_dich_thanh_toan();

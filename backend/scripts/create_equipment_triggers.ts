import { pool } from '../src/config/db';

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('1. Tạo hàm tự động điều phối thiết bị (auto_allocate_equipment_on_session_change)...');
    await client.query(`
      CREATE OR REPLACE FUNCTION auto_allocate_equipment_on_session_change()
      RETURNS TRIGGER AS $$
      DECLARE
        v_thiet_bi_yeu_cau VARCHAR(255);
        v_device_item VARCHAR(100);
        v_device_array TEXT[];
        v_eq_id UUID;
        v_so_lan_su_dung INTEGER;
        v_next_status VARCHAR(20);
      BEGIN
        -- 1. Nếu là buổi trị liệu (buoi_tri_lieu) thay đổi trạng thái
        IF (TG_TABLE_NAME = 'buoi_tri_lieu') THEN
          -- Khi bắt đầu điều trị
          IF (NEW.trang_thai = 'dang_thuc_hien' AND (OLD.trang_thai IS NULL OR OLD.trang_thai != 'dang_thuc_hien')) THEN
            FOR v_thiet_bi_yeu_cau IN (
              SELECT thiet_bi_yeu_cau FROM dich_vu WHERE id = NEW.dich_vu_id AND thiet_bi_yeu_cau IS NOT NULL
              UNION
              SELECT dv.thiet_bi_yeu_cau 
              FROM buoi_tri_lieu_dich_vu btdv
              JOIN dich_vu dv ON btdv.dich_vu_id = dv.id
              WHERE btdv.buoi_tri_lieu_id = NEW.id AND dv.thiet_bi_yeu_cau IS NOT NULL
            ) LOOP
              v_device_array := string_to_array(v_thiet_bi_yeu_cau, ',');
              FOREACH v_device_item IN ARRAY v_device_array LOOP
                v_device_item := trim(v_device_item);
                IF (v_device_item != '' AND v_device_item != 'không có' AND v_device_item != 'Không cần thiết bị') THEN
                  -- Tìm thiết bị sẵn sàng trong bể chung
                  SELECT id INTO v_eq_id
                  FROM thiet_bi_y_te
                  WHERE trang_thai = 'san_sang' 
                    AND (ten_thiet_bi ILIKE '%' || v_device_item || '%' OR loai_thiet_bi ILIKE '%' || v_device_item || '%')
                  LIMIT 1;
 
                  IF (v_eq_id IS NOT NULL) THEN
                    UPDATE thiet_bi_y_te 
                    SET trang_thai = 'dang_su_dung', 
                        phong_id_hien_tai = NEW.phong_id
                    WHERE id = v_eq_id;
                  END IF;
                END IF;
              END LOOP;
            END LOOP;
 
          -- Khi hoàn thành hoặc hủy buổi trị liệu
          ELSIF (NEW.trang_thai IN ('hoan_thanh', 'da_huy') AND OLD.trang_thai = 'dang_thuc_hien') THEN
            FOR v_thiet_bi_yeu_cau IN (
              SELECT thiet_bi_yeu_cau FROM dich_vu WHERE id = NEW.dich_vu_id AND thiet_bi_yeu_cau IS NOT NULL
              UNION
              SELECT dv.thiet_bi_yeu_cau 
              FROM buoi_tri_lieu_dich_vu btdv
              JOIN dich_vu dv ON btdv.dich_vu_id = dv.id
              WHERE btdv.buoi_tri_lieu_id = NEW.id AND dv.thiet_bi_yeu_cau IS NOT NULL
            ) LOOP
              v_device_array := string_to_array(v_thiet_bi_yeu_cau, ',');
              FOREACH v_device_item IN ARRAY v_device_array LOOP
                v_device_item := trim(v_device_item);
                IF (v_device_item != '' AND v_device_item != 'không có' AND v_device_item != 'Không cần thiết bị') THEN
                  SELECT id, so_lan_su_dung INTO v_eq_id, v_so_lan_su_dung
                  FROM thiet_bi_y_te
                  WHERE trang_thai = 'dang_su_dung' 
                    AND phong_id_hien_tai = OLD.phong_id 
                     AND (ten_thiet_bi ILIKE '%' || v_device_item || '%' OR loai_thiet_bi ILIKE '%' || v_device_item || '%')
                  LIMIT 1;
 
                  IF (v_eq_id IS NOT NULL) THEN
                    IF (NEW.trang_thai = 'hoan_thanh') THEN
                      v_so_lan_su_dung := COALESCE(v_so_lan_su_dung, 0) + 1;
                    END IF;
 
                    v_next_status := 'san_sang';
 
                    UPDATE thiet_bi_y_te 
                    SET trang_thai = v_next_status, 
                        phong_id_hien_tai = NULL, 
                        so_lan_su_dung = v_so_lan_su_dung
                    WHERE id = v_eq_id;
                  END IF;
                END IF;
              END LOOP;
            END LOOP;
          END IF;
        END IF;
 
        -- 2. Nếu là lịch đặt khám (lich_dat) thay đổi trạng thái
        IF (TG_TABLE_NAME = 'lich_dat') THEN
          -- Khi check-in lịch khám
          IF (NEW.trang_thai = 'da_checkin' AND (OLD.trang_thai IS NULL OR OLD.trang_thai != 'da_checkin')) THEN
            SELECT thiet_bi_yeu_cau INTO v_thiet_bi_yeu_cau 
            FROM dich_vu 
            WHERE id = NEW.dich_vu_id;
 
            IF (v_thiet_bi_yeu_cau IS NOT NULL) THEN
              v_device_array := string_to_array(v_thiet_bi_yeu_cau, ',');
              FOREACH v_device_item IN ARRAY v_device_array LOOP
                v_device_item := trim(v_device_item);
                IF (v_device_item != '' AND v_device_item != 'không có' AND v_device_item != 'Không cần thiết bị') THEN
                  SELECT id INTO v_eq_id
                  FROM thiet_bi_y_te
                  WHERE trang_thai = 'san_sang' 
                    AND (ten_thiet_bi ILIKE '%' || v_device_item || '%' OR loai_thiet_bi ILIKE '%' || v_device_item || '%')
                  LIMIT 1;
 
                  IF (v_eq_id IS NOT NULL) THEN
                    UPDATE thiet_bi_y_te 
                    SET trang_thai = 'dang_su_dung', 
                        phong_id_hien_tai = NEW.phong_id
                    WHERE id = v_eq_id;
                  END IF;
                END IF;
              END LOOP;
            END IF;
 
          -- Khi kết thúc lịch khám
          ELSIF (NEW.trang_thai IN ('hoan_thanh', 'da_huy', 'khong_den') AND OLD.trang_thai = 'da_checkin') THEN
            SELECT thiet_bi_yeu_cau INTO v_thiet_bi_yeu_cau 
            FROM dich_vu 
            WHERE id = NEW.dich_vu_id;
 
            IF (v_thiet_bi_yeu_cau IS NOT NULL) THEN
              v_device_array := string_to_array(v_thiet_bi_yeu_cau, ',');
              FOREACH v_device_item IN ARRAY v_device_array LOOP
                v_device_item := trim(v_device_item);
                IF (v_device_item != '' AND v_device_item != 'không có' AND v_device_item != 'Không cần thiết bị') THEN
                  SELECT id, so_lan_su_dung INTO v_eq_id, v_so_lan_su_dung
                  FROM thiet_bi_y_te
                  WHERE trang_thai = 'dang_su_dung' 
                    AND phong_id_hien_tai = OLD.phong_id 
                    AND (ten_thiet_bi ILIKE '%' || v_device_item || '%' OR loai_thiet_bi ILIKE '%' || v_device_item || '%')
                  LIMIT 1;
 
                  IF (v_eq_id IS NOT NULL) THEN
                    IF (NEW.trang_thai = 'hoan_thanh') THEN
                      v_so_lan_su_dung := COALESCE(v_so_lan_su_dung, 0) + 1;
                    END IF;
 
                    v_next_status := 'san_sang';
 
                    UPDATE thiet_bi_y_te 
                    SET trang_thai = v_next_status, 
                        phong_id_hien_tai = NULL, 
                        so_lan_su_dung = v_so_lan_su_dung
                    WHERE id = v_eq_id;
                  END IF;
                END IF;
              END LOOP;
            END IF;
          END IF;
        END IF;
 
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Đã tạo/cập nhật hàm trigger auto_allocate_equipment_on_session_change');

    console.log('2. Tạo trigger trg_auto_allocate_equipment_btl trên bảng buoi_tri_lieu...');
    await client.query(`
      DROP TRIGGER IF EXISTS trg_auto_allocate_equipment_btl ON buoi_tri_lieu;
      CREATE TRIGGER trg_auto_allocate_equipment_btl
        AFTER UPDATE ON buoi_tri_lieu
        FOR EACH ROW
        EXECUTE FUNCTION auto_allocate_equipment_on_session_change();
    `);

    console.log('3. Tạo trigger trg_auto_allocate_equipment_ld trên bảng lich_dat...');
    await client.query(`
      DROP TRIGGER IF EXISTS trg_auto_allocate_equipment_ld ON lich_dat;
      CREATE TRIGGER trg_auto_allocate_equipment_ld
        AFTER UPDATE ON lich_dat
        FOR EACH ROW
        EXECUTE FUNCTION auto_allocate_equipment_on_session_change();
    `);

    await client.query('COMMIT');
    console.log('🎉 Đã kích hoạt triggers đồng bộ thiết bị thành công!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Lỗi khi thiết lập triggers:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

main();

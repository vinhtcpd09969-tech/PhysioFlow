import { pool } from '../../config/db';

export class AdminStaffRepository {
  // --- QUẢN LÝ NHÂN SỰ ---
  async getStaff() {
    const { rows } = await pool.query(`
      SELECT nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.trang_thai, nd.anh_dai_dien, nd.vai_tro_id, vt.ten_vai_tro as vai_tro,
             ktv.id as chuyen_gia_id, ktv.so_nam_kinh_nghiem, ktv.bang_cap_chung_chi, ktv.mo_ta, ktv.the_manh
      FROM nguoi_dung nd
      JOIN vai_tro vt ON nd.vai_tro_id = vt.id
      LEFT JOIN ho_so_chuyen_gia ktv ON nd.id = ktv.nguoi_dung_id
      WHERE nd.vai_tro_id IN (2, 3, 4, 5, 6)
      ORDER BY nd.vai_tro_id, nd.ho_ten
    `);
    return rows;
  }

  async findUserByEmail(email: string, excludeId?: string | number) {
    const query = excludeId
      ? 'SELECT id FROM nguoi_dung WHERE LOWER(email) = LOWER($1) AND id != $2'
      : 'SELECT id FROM nguoi_dung WHERE LOWER(email) = LOWER($1)';
    const params = excludeId ? [email, Number(excludeId)] : [email];
    const { rows } = await pool.query(query, params);
    return rows[0];
  }

  async findUserByPhone(phone: string, excludeId?: string | number) {
    const query = excludeId
      ? 'SELECT id FROM nguoi_dung WHERE so_dien_thoai = $1 AND id != $2'
      : 'SELECT id FROM nguoi_dung WHERE so_dien_thoai = $1';
    const params = excludeId ? [phone, Number(excludeId)] : [phone];
    const { rows } = await pool.query(query, params);
    return rows[0];
  }

  async createStaff(data: any, hash: string) {
    if (Number(data.vai_tro_id) === 5) {
      throw new Error('Hệ thống chỉ cho phép duy nhất 1 tài khoản Quản trị viên (Admin). Không thể tạo thêm!');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO nguoi_dung (ho_ten, email, mat_khau_hash, vai_tro_id, so_dien_thoai, trang_thai) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, ho_ten, email`,
        [data.ho_ten, data.email, hash, data.vai_tro_id, data.so_dien_thoai || null, data.trang_thai]
      );

      if (data.vai_tro_id === 3 || data.vai_tro_id === 4) {
        await client.query(
          `INSERT INTO ho_so_chuyen_gia (nguoi_dung_id, so_nam_kinh_nghiem, bang_cap_chung_chi) 
           VALUES ($1, 1, $2)`,
          [rows[0].id, data.vai_tro_id === 4 ? 'Bác sĩ Vật lý trị liệu' : 'Kỹ thuật viên Vật lý trị liệu']
        );
      }

      await client.query('COMMIT');
      return rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async updateStaffStatus(id: string, status: string) {
    const checkAdmin = await pool.query('SELECT vai_tro_id FROM nguoi_dung WHERE id = $1', [Number(id)]);
    if (checkAdmin.rows.length > 0 && checkAdmin.rows[0].vai_tro_id === 5) {
      throw new Error('Không thể khóa hoặc vô hiệu hóa tài khoản Quản trị viên duy nhất của hệ thống.');
    }

    const { rows } = await pool.query(
      'UPDATE nguoi_dung SET trang_thai = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return rows[0];
  }

  async updateStaffDetails(id: string, data: any) {
    const checkTarget = await pool.query('SELECT vai_tro_id FROM nguoi_dung WHERE id = $1', [Number(id)]);
    if (checkTarget.rows.length === 0) {
      throw new Error('Không tìm thấy nhân sự');
    }
    const currentTargetRole = checkTarget.rows[0].vai_tro_id;

    if (currentTargetRole !== 5 && Number(data.vai_tro_id) === 5) {
      throw new Error('Không thể nâng quyền nhân viên thành Quản trị viên (Admin).');
    }
    if (currentTargetRole === 5 && Number(data.vai_tro_id) !== 5) {
      throw new Error('Không thể thay đổi vai trò của tài khoản Quản trị viên duy nhất.');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      let queryStr = `UPDATE nguoi_dung SET ho_ten = $1, so_dien_thoai = $2, vai_tro_id = $3, email = $4`;
      const queryParams: any[] = [data.ho_ten, data.so_dien_thoai || null, Number(data.vai_tro_id), data.email];

      if (data.anh_dai_dien !== undefined) {
        queryParams.push(data.anh_dai_dien);
        queryStr += `, anh_dai_dien = $${queryParams.length}`;
      }

      queryParams.push(Number(id));
      queryStr += ` WHERE id = $${queryParams.length} RETURNING id, ho_ten, email, anh_dai_dien`;

      const { rows: userRows } = await client.query(queryStr, queryParams);

      const isExpertRole = [3, 4].includes(Number(data.vai_tro_id));
      if (isExpertRole) {
        await client.query(
          `INSERT INTO ho_so_chuyen_gia (nguoi_dung_id, so_nam_kinh_nghiem, bang_cap_chung_chi, mo_ta, the_manh)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (nguoi_dung_id) DO UPDATE 
           SET so_nam_kinh_nghiem = EXCLUDED.so_nam_kinh_nghiem,
               bang_cap_chung_chi = EXCLUDED.bang_cap_chung_chi,
               mo_ta = EXCLUDED.mo_ta,
               the_manh = EXCLUDED.the_manh`,
          [
            Number(id),
            Number(data.so_nam_kinh_nghiem) || 0,
            data.bang_cap_chung_chi || '',
            data.mo_ta || '',
            data.the_manh || []
          ]
        );
      } else {
        await client.query('DELETE FROM ho_so_chuyen_gia WHERE nguoi_dung_id = $1', [Number(id)]);
      }

      await client.query('COMMIT');
      return userRows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async deleteStaffAvatar(id: string) {
    const { rows } = await pool.query(
      'UPDATE nguoi_dung SET anh_dai_dien = NULL WHERE id = $1 RETURNING id, anh_dai_dien',
      [Number(id)]
    );
    return rows[0];
  }

  async updateStaffPassword(id: string, hash: string) {
    const { rows } = await pool.query(
      'UPDATE nguoi_dung SET mat_khau_hash = $1 WHERE id = $2 RETURNING id, ho_ten, email',
      [hash, Number(id)]
    );
    return rows[0];
  }

  // --- QUẢN LÝ LỊCH LÀM VIỆC (MAPPED TO LICH TRUC NHAN SU) ---
  async getSchedules() {
    const { rows } = await pool.query(`
      SELECT lt.id, lt.nhan_su_id as nguoi_dung_id, to_char(lt.ngay_truc, 'YYYY-MM-DD') as ngay, 
             to_char(lt.gio_bat_dau, 'HH24:MI') as gio_bat_dau, to_char(lt.gio_ket_thuc, 'HH24:MI') as gio_ket_thuc, lt.trang_thai,
             nd.ho_ten as ten_nhan_vien, vt.ten_vai_tro as vai_tro,
             lt.phong_id, p.ma_phong, p.ten_phong
      FROM lich_truc_nhan_su lt
      JOIN nguoi_dung nd ON lt.nhan_su_id = nd.id
      JOIN vai_tro vt ON nd.vai_tro_id = vt.id
      LEFT JOIN phong_lam_viec p ON lt.phong_id = p.id
      ORDER BY vt.id, nd.ho_ten, lt.ngay_truc
    `);
    return rows;
  }

  async createSchedule(data: any) {
    const getLocalVietnamDate = () => {
      const now = new Date();
      const localTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
      return localTime.toISOString().split('T')[0];
    };
    const todayDateStr = getLocalVietnamDate();
    if (data.ngay < todayDateStr) {
      throw new Error('Không thể thêm ca trực cho ngày trong quá khứ!');
    }

    const userRes = await pool.query('SELECT vai_tro_id FROM nguoi_dung WHERE id = $1', [Number(data.nguoi_dung_id)]);
    const isDoc = userRes.rows[0]?.vai_tro_id === 4;
    const isKtv = userRes.rows[0]?.vai_tro_id === 3;

    if ((isDoc || isKtv) && data.trang_thai === 'hoat_dong' && !data.phong_id) {
      throw new Error('Vui lòng phân phòng làm việc cho ca trực của nhân sự.');
    }

    if (isDoc && data.trang_thai !== 'tam_nghi') {
      const hour = parseInt(data.gio_bat_dau.split(':')[0]);
      const isMorning = hour < 11;

      const checkQuery = `
        SELECT lt.*, nd.ho_ten 
        FROM lich_truc_nhan_su lt
        JOIN nguoi_dung nd ON lt.nhan_su_id = nd.id
        WHERE nd.vai_tro_id = 4
          AND lt.ngay_truc = $1::date
          AND lt.trang_thai = 'hoat_dong'
          AND lt.nhan_su_id = $2::integer
          AND ${isMorning ? "lt.gio_bat_dau < '11:00'" : "lt.gio_bat_dau >= '11:00'"}
      `;
      const conflictRes = await pool.query(checkQuery, [data.ngay, Number(data.nguoi_dung_id)]);
      if (conflictRes.rows.length > 0) {
        throw new Error(`Chuyên viên ${conflictRes.rows[0].ho_ten} đã có lịch trực ca này vào ngày ${data.ngay} rồi!`);
      }
    }

    if (data.phong_id && data.trang_thai === 'hoat_dong') {
      const roomRes = await pool.query('SELECT ten_phong, ma_phong, suc_chua FROM phong_lam_viec WHERE id = $1', [Number(data.phong_id)]);
      if (roomRes.rows.length > 0) {
        const room = roomRes.rows[0];
        const capacity = room.suc_chua || 1;

        const startHour = parseInt(data.gio_bat_dau.split(':')[0]);
        const isMorning = startHour < 11;

        const countRes = await pool.query(`
          SELECT COUNT(*) as count 
          FROM lich_truc_nhan_su 
          WHERE phong_id = $1 
            AND ngay_truc = $2::date 
            AND trang_thai = 'hoat_dong'
            AND (
              ($3::boolean = true AND gio_bat_dau < '11:00') OR 
              ($3::boolean = false AND gio_bat_dau >= '11:00')
            )
        `, [Number(data.phong_id), data.ngay, isMorning]);

        const count = parseInt(countRes.rows[0].count) || 0;
        if (count >= capacity) {
          throw new Error(`Phòng ${room.ten_phong} (${room.ma_phong}) đã đạt sức chứa tối đa (${capacity} người) trong ca trực này.`);
        }
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO lich_truc_nhan_su (nhan_su_id, ngay_truc, gio_bat_dau, gio_ket_thuc, trang_thai, phong_id)
       VALUES ($1, $2, $3::time, $4::time, $5, $6)
       RETURNING id, nhan_su_id as nguoi_dung_id, to_char(ngay_truc, 'YYYY-MM-DD') as ngay, to_char(gio_bat_dau, 'HH24:MI') as gio_bat_dau, to_char(gio_ket_thuc, 'HH24:MI') as gio_ket_thuc, trang_thai, phong_id`,
      [Number(data.nguoi_dung_id), data.ngay, data.gio_bat_dau, data.gio_ket_thuc, data.trang_thai, data.phong_id ? Number(data.phong_id) : null]
    );
    if (rows.length > 0) {
      await this.syncShiftAppointments(rows[0].id);
    }
    return rows[0];
  }

  async updateSchedule(id: string, data: any) {
    const getLocalVietnamDate = () => {
      const now = new Date();
      const localTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
      return localTime.toISOString().split('T')[0];
    };
    const todayDateStr = getLocalVietnamDate();

    const { rows: currentRows } = await pool.query(
      `SELECT id, nhan_su_id, to_char(ngay_truc, 'YYYY-MM-DD') as ngay, 
              to_char(gio_bat_dau, 'HH24:MI') as gio_bat_dau, 
              to_char(gio_ket_thuc, 'HH24:MI') as gio_ket_thuc, 
              trang_thai, phong_id 
       FROM lich_truc_nhan_su WHERE id = $1`, 
      [id]
    );

    if (currentRows.length === 0) {
      throw new Error('Không tìm thấy ca trực cần chỉnh sửa.');
    }

    const currentSchedule = currentRows[0];
    const oldStaffId = Number(currentSchedule.nhan_su_id);
    const oldDateStr = currentSchedule.ngay;
    const oldStartHour = parseInt(currentSchedule.gio_bat_dau.split(':')[0]) || 0;
    const oldBuoi = oldStartHour < 11 ? 'sang' : 'chieu';

    const formatDateVN = (dStr: string) => {
      if (!dStr) return '';
      const parts = dStr.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return dStr;
    };

    const now = new Date();
    const localVietnamNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const currentHour = localVietnamNow.getUTCHours();
    const currentMinute = localVietnamNow.getUTCMinutes();
    const currentMinutes = currentHour * 60 + currentMinute;

    if (oldDateStr < todayDateStr) {
      throw new Error('Không thể chỉnh sửa ca trực của ngày trong quá khứ!');
    }

    if (data.ngay < todayDateStr) {
      throw new Error('Không thể chuyển ca trực sang ngày trong quá khứ!');
    }

    const newStartHour = parseInt(String(data.gio_bat_dau || '07:00').split(':')[0]) || 0;
    const newBuoi = newStartHour < 11 ? 'sang' : 'chieu';

    // Khóa thời gian đã trôi qua cho ngày hôm nay
    if (data.ngay === todayDateStr) {
      if (currentMinutes >= 20 * 60) {
        throw new Error('Không thể chỉnh sửa ca trực của ngày hôm nay vì trung tâm đã kết thúc giờ hoạt động (20:00)!');
      }
      if (newBuoi === 'sang' && currentMinutes >= 12 * 60) {
        throw new Error('Không thể chuyển sang Ca Sáng cho ngày hôm nay vì thời gian ca sáng đã kết thúc trong quá khứ!');
      }
    }

    const isShiftChanged = data.ngay !== oldDateStr || newBuoi !== oldBuoi || data.trang_thai === 'tam_nghi' || Number(data.nguoi_dung_id) !== oldStaffId;

    if (isShiftChanged) {
      const staffRes = await pool.query('SELECT ho_ten FROM nguoi_dung WHERE id = $1', [oldStaffId]);
      const staffName = staffRes.rows[0]?.ho_ten || 'nhân sự';

      // 1. Kiểm tra nếu ca cũ đã có ca khám hoàn thành hoặc đang khám
      const historyCheck = await pool.query(`
        SELECT COUNT(*) as cnt
        FROM cuoc_hen
        WHERE nhan_su_id = $1
          AND (
            DATE(ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = $2::date
            OR DATE(ngay_gio_bat_dau) = $2::date
          )
          AND buoi = $3
          AND trang_thai IN ('hoan_thanh', 'dang_kham')
      `, [oldStaffId, oldDateStr, oldBuoi]);

      const finishedCount = parseInt(historyCheck.rows[0]?.cnt || '0');
      if (finishedCount > 0) {
        throw new Error(
          `Không thể đổi/hủy ca trực này vì nhân sự ${staffName} đã phát sinh ${finishedCount} lịch hẹn (${oldBuoi === 'sang' ? 'Ca Sáng' : 'Ca Chiều'} ngày ${formatDateVN(oldDateStr)})!`
        );
      }

      // 2. Kiểm tra nếu ca cũ đang có khách đặt hẹn chưa hoàn thành
      const activeCheck = await pool.query(`
        SELECT COUNT(*) as cnt
        FROM cuoc_hen
        WHERE nhan_su_id = $1
          AND (
            DATE(ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = $2::date
            OR DATE(ngay_gio_bat_dau) = $2::date
          )
          AND buoi = $3
          AND trang_thai IN ('da_xac_nhan', 'da_checkin', 'cho_tai_luong_gia')
      `, [oldStaffId, oldDateStr, oldBuoi]);

      const activeCount = parseInt(activeCheck.rows[0]?.cnt || '0');
      if (activeCount > 0) {
        throw new Error(
          `Nhân sự ${staffName} đang có ${activeCount} ca đặt trước trong ${oldBuoi === 'sang' ? 'Buổi Sáng' : 'Buổi Chiều'} ngày ${formatDateVN(oldDateStr)}. Vui lòng đưa các lịch hẹn của nhân sự về Hàng chờ chung (hoặc chuyển giao cho nhân sự khác) trước khi thao tác đổi ca!`
        );
      }
    }

    const userRes = await pool.query('SELECT vai_tro_id FROM nguoi_dung WHERE id = $1', [Number(data.nguoi_dung_id)]);
    const isDoc = userRes.rows[0]?.vai_tro_id === 4;
    const isKtv = userRes.rows[0]?.vai_tro_id === 3;

    if ((isDoc || isKtv) && data.trang_thai === 'hoat_dong' && !data.phong_id) {
      throw new Error('Vui lòng phân phòng làm việc cho ca trực của nhân sự.');
    }

    if (isDoc && data.trang_thai !== 'tam_nghi') {
      const hour = parseInt(data.gio_bat_dau.split(':')[0]);
      const isMorning = hour < 11;

      const checkQuery = `
        SELECT lt.*, nd.ho_ten 
        FROM lich_truc_nhan_su lt
        JOIN nguoi_dung nd ON lt.nhan_su_id = nd.id
        WHERE nd.vai_tro_id = 4
          AND lt.ngay_truc = $1::date
          AND lt.trang_thai = 'hoat_dong'
          AND lt.nhan_su_id = $2::integer
          AND lt.id != $3::uuid
          AND ${isMorning ? "lt.gio_bat_dau < '11:00'" : "lt.gio_bat_dau >= '11:00'"}
      `;
      const conflictRes = await pool.query(checkQuery, [data.ngay, Number(data.nguoi_dung_id), id]);
      if (conflictRes.rows.length > 0) {
        throw new Error(`Chuyên viên ${conflictRes.rows[0].ho_ten} đã có lịch trực ca này vào ngày ${data.ngay} rồi!`);
      }
    }

    if (data.phong_id && data.trang_thai === 'hoat_dong') {
      const roomRes = await pool.query('SELECT ten_phong, ma_phong, suc_chua FROM phong_lam_viec WHERE id = $1', [Number(data.phong_id)]);
      if (roomRes.rows.length > 0) {
        const room = roomRes.rows[0];
        const capacity = room.suc_chua || 1;

        const startHour = parseInt(data.gio_bat_dau.split(':')[0]);
        const isMorning = startHour < 11;

        const countRes = await pool.query(`
          SELECT COUNT(*) as count 
          FROM lich_truc_nhan_su 
          WHERE phong_id = $1 
            AND ngay_truc = $2::date 
            AND trang_thai = 'hoat_dong'
            AND id != $4::uuid
            AND (
              ($3::boolean = true AND gio_bat_dau < '11:00') OR 
              ($3::boolean = false AND gio_bat_dau >= '11:00')
            )
        `, [Number(data.phong_id), data.ngay, isMorning, id]);

        const count = parseInt(countRes.rows[0].count) || 0;
        if (count >= capacity) {
          throw new Error(`Phòng ${room.ten_phong} (${room.ma_phong}) đã đạt sức chứa tối đa (${capacity} người) trong ca trực này.`);
        }
      }
    }

    const { rows } = await pool.query(
      `UPDATE lich_truc_nhan_su
       SET gio_bat_dau = $1::time, gio_ket_thuc = $2::time, trang_thai = $3, phong_id = $4, ngay_truc = $5::date
       WHERE id = $6::uuid RETURNING id, nhan_su_id as nguoi_dung_id, to_char(ngay_truc, 'YYYY-MM-DD') as ngay, to_char(gio_bat_dau, 'HH24:MI') as gio_bat_dau, to_char(gio_ket_thuc, 'HH24:MI') as gio_ket_thuc, trang_thai, phong_id`,
      [data.gio_bat_dau, data.gio_ket_thuc, data.trang_thai, data.phong_id ? Number(data.phong_id) : null, data.ngay, id]
    );
    if (rows.length > 0) {
      await this.syncShiftAppointments(rows[0].id);
    }
    return rows[0];
  }

  async deleteSchedule(id: string) {
    const getLocalVietnamDate = () => {
      const now = new Date();
      const localTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
      return localTime.toISOString().split('T')[0];
    };
    const todayDateStr = getLocalVietnamDate();

    const { rows: currentRows } = await pool.query(
      `SELECT id, nhan_su_id, to_char(ngay_truc, 'YYYY-MM-DD') as ngay, 
              to_char(gio_bat_dau, 'HH24:MI') as gio_bat_dau, 
              to_char(gio_ket_thuc, 'HH24:MI') as gio_ket_thuc, 
              trang_thai, phong_id 
       FROM lich_truc_nhan_su WHERE id = $1`, 
      [id]
    );

    if (currentRows.length === 0) {
      throw new Error('Không tìm thấy ca trực cần xóa.');
    }

    const currentSchedule = currentRows[0];
    const staffId = Number(currentSchedule.nhan_su_id);
    const dateStr = currentSchedule.ngay;
    const startHour = parseInt(currentSchedule.gio_bat_dau.split(':')[0]) || 0;
    const buoi = startHour < 11 ? 'sang' : 'chieu';

    const formatDateVN = (dStr: string) => {
      if (!dStr) return '';
      const parts = dStr.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return dStr;
    };

    const now = new Date();
    const localVietnamNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const currentHour = localVietnamNow.getUTCHours();
    const currentMinute = localVietnamNow.getUTCMinutes();
    const currentMinutes = currentHour * 60 + currentMinute;

    if (dateStr < todayDateStr) {
      throw new Error('Không thể xóa ca trực của ngày trong quá khứ!');
    }

    if (dateStr === todayDateStr) {
      if (currentMinutes >= 20 * 60) {
        throw new Error('Không thể xóa ca trực của ngày hôm nay vì trung tâm đã kết thúc giờ hoạt động (20:00)!');
      }
      if (buoi === 'sang' && currentMinutes >= 12 * 60) {
        throw new Error('Không thể xóa ca trực sáng của ngày hôm nay vì thời gian ca sáng đã kết thúc trong quá khứ!');
      }
    }

    const staffRes = await pool.query('SELECT ho_ten FROM nguoi_dung WHERE id = $1', [staffId]);
    const staffName = staffRes.rows[0]?.ho_ten || 'nhân sự';

    // Kiểm tra lịch hẹn hoàn thành
    const historyCheck = await pool.query(`
      SELECT COUNT(*) as cnt
      FROM cuoc_hen
      WHERE nhan_su_id = $1
        AND (
          DATE(ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = $2::date
          OR DATE(ngay_gio_bat_dau) = $2::date
        )
        AND buoi = $3
        AND trang_thai IN ('hoan_thanh', 'dang_kham')
    `, [staffId, dateStr, buoi]);

    const finishedCount = parseInt(historyCheck.rows[0]?.cnt || '0');
    if (finishedCount > 0) {
      throw new Error(
        `Không thể xóa ca trực này vì nhân sự ${staffName} đã phát sinh ${finishedCount} lịch hẹn (${buoi === 'sang' ? 'Ca Sáng' : 'Ca Chiều'} ngày ${formatDateVN(dateStr)})!`
      );
    }

    // Kiểm tra lịch hẹn đang hoạt động
    const activeCheck = await pool.query(`
      SELECT COUNT(*) as cnt
      FROM cuoc_hen
      WHERE nhan_su_id = $1
        AND (
          DATE(ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = $2::date
          OR DATE(ngay_gio_bat_dau) = $2::date
        )
        AND buoi = $3
        AND trang_thai IN ('da_xac_nhan', 'da_checkin', 'cho_tai_luong_gia')
    `, [staffId, dateStr, buoi]);

    const activeCount = parseInt(activeCheck.rows[0]?.cnt || '0');
    if (activeCount > 0) {
      throw new Error(
        `Nhân sự ${staffName} đang có ${activeCount} ca đặt trước trong ${buoi === 'sang' ? 'Buổi Sáng' : 'Buổi Chiều'} ngày ${formatDateVN(dateStr)}. Vui lòng đưa các lịch hẹn của nhân sự về Hàng chờ chung (hoặc chuyển giao cho nhân sự khác) trước khi xóa ca!`
      );
    }

    const { rows } = await pool.query(
      'DELETE FROM lich_truc_nhan_su WHERE id = $1 RETURNING *',
      [id]
    );
    if (rows.length > 0) {
      const shift = rows[0];
      const dateObj = new Date(shift.ngay_truc);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const startTimeStr = String(shift.gio_bat_dau).trim();
      const endTimeStr = String(shift.gio_ket_thuc).trim();

      const startTimestamp = `${dateStr}T${startTimeStr}+07:00`;
      const endTimestamp = `${dateStr}T${endTimeStr}+07:00`;

      await pool.query(`
        UPDATE cuoc_hen
        SET phong_id = NULL
        WHERE nhan_su_id = $1
          AND ngay_gio_bat_dau >= $2::timestamptz
          AND ngay_gio_ket_thuc <= $3::timestamptz
      `, [shift.nhan_su_id, startTimestamp, endTimestamp]);
    }
    return rows[0];
  }

  async syncShiftAppointments(shiftId: string) {
    const { rows: shiftRows } = await pool.query(
      'SELECT nhan_su_id, ngay_truc, gio_bat_dau, gio_ket_thuc, phong_id, trang_thai FROM lich_truc_nhan_su WHERE id = $1',
      [shiftId]
    );
    if (shiftRows.length === 0) return;
    const shift = shiftRows[0];

    const targetRoomId = (shift.trang_thai === 'hoat_dong') ? shift.phong_id : null;

    const dateObj = new Date(shift.ngay_truc);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const startTimeStr = String(shift.gio_bat_dau).trim();
    const endTimeStr = String(shift.gio_ket_thuc).trim();

    const startTimestamp = `${dateStr}T${startTimeStr}+07:00`;
    const endTimestamp = `${dateStr}T${endTimeStr}+07:00`;

    await pool.query(`
      UPDATE cuoc_hen
      SET phong_id = $1
      WHERE nhan_su_id = $2
        AND ngay_gio_bat_dau >= $3::timestamptz
        AND ngay_gio_ket_thuc <= $4::timestamptz
    `, [targetRoomId, shift.nhan_su_id, startTimestamp, endTimestamp]);
  }

  async getAvailableStaff(goi_dich_vu_id: string | null, dang_ky_goi_id: string | null, ngay: string, gio_bat_dau: string) {
    let thoi_luong = 60;
    const finalGoiId = goi_dich_vu_id || dang_ky_goi_id;

    if (finalGoiId) {
      const { rows } = await pool.query('SELECT thoi_luong_phut FROM goi_dich_vu WHERE id = $1', [finalGoiId]);
      if (rows.length > 0) {
        thoi_luong = rows[0].thoi_luong_phut;
      }
    }

    const query = `
      SELECT 
        ktv.id as chuyen_gia_id, 
        nd.id as nguoi_dung_id, 
        nd.ho_ten, 
        nd.email, 
        nd.so_dien_thoai, 
        vt.ten_vai_tro as vai_tro,
        (
          SELECT COALESCE(COUNT(*), 0)::integer
          FROM cuoc_hen ch
          WHERE ch.nhan_su_id = nd.id
            AND ch.ngay_gio_bat_dau::date = $1::date
            AND ch.trang_thai NOT IN ('da_huy', 'huy', 'khong_den')
        ) as so_ca_trong_ngay
      FROM ho_so_chuyen_gia ktv
      JOIN nguoi_dung nd ON ktv.nguoi_dung_id = nd.id
      JOIN vai_tro vt ON nd.vai_tro_id = vt.id
      WHERE vt.ma_vai_tro = 'ky_thuat_vien'
        AND nd.trang_thai = 'hoat_dong'
        AND EXISTS (
          SELECT 1 FROM lich_truc_nhan_su lt
          WHERE lt.nhan_su_id = nd.id
            AND lt.ngay_truc = $1::date
            AND lt.trang_thai = 'hoat_dong'
            AND lt.gio_bat_dau::time <= $2::time
            AND lt.gio_ket_thuc::time >= ($2::time + ($3 || ' minutes')::interval)::time
        )
        AND NOT EXISTS (
          SELECT 1 FROM cuoc_hen ch
          WHERE ch.nhan_su_id = nd.id
            AND ch.trang_thai NOT IN ('da_huy', 'huy', 'khong_den')
            AND ch.ngay_gio_bat_dau < ($1::date + $2::time + ($3 || ' minutes')::interval)::timestamp
            AND ch.ngay_gio_ket_thuc > ($1::date + $2::time)::timestamp
        )
      ORDER BY so_ca_trong_ngay ASC, nd.ho_ten ASC
    `;

    const { rows } = await pool.query(query, [ngay, gio_bat_dau, thoi_luong]);
    return rows;
  }
}

export default new AdminStaffRepository();

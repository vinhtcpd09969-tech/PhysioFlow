import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { 
  getAppointments as getAppointmentsAdmin,
  getStaff,
  getPackages,
  getRooms,
  getSchedules
} from '../../../api/admin.api';
import { getAppointments as getAppointmentsRec } from '../../../../receptionist/api/receptionist.api';
import { Appointment, Staff, Room } from '../types';

export function useAppointmentsData(isReceptionist: boolean) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [roomsList, setRoomsList] = useState<Room[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [schedulesList, setSchedulesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const seenCheckedInIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);
  const seenUnconfirmedIds = useRef<Set<string>>(new Set());

  // Sound chime notifier for doctor/receptionist
  const playNotificationSound = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1046.50, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1567.98, now + 0.12);
      gain2.gain.setValueAtTime(0.12, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.65);
    } catch (err) {
      console.error('Không thể phát âm thanh thông báo:', err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const getApts = isReceptionist ? getAppointmentsRec : getAppointmentsAdmin;
      const [aptRes, staffRes, serviceRes, packageRes, roomsRes, schedulesRes] = await Promise.all([
        getApts(),
        getStaff(),
        getPackages().catch(() => ({ data: [] })),
        getPackages().catch(() => ({ data: [] })),
        getRooms().catch(() => ({ data: [] })),
        getSchedules().catch(() => ({ data: [] }))
      ]);

      setAppointments(aptRes.data);
      setStaffList(staffRes.data);
      setServices(serviceRes.data);
      setPackages(packageRes.data || []);
      setRoomsList(roomsRes.data || []);
      setSchedulesList(schedulesRes.data || []);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      toast.error('Không thể tải dữ liệu lịch hẹn');
    } finally {
      setLoading(false);
    }
  }, [isReceptionist]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling for live updates (receptionist counter registration check)
  useEffect(() => {
    const interval = setInterval(() => {
      const getApts = isReceptionist ? getAppointmentsRec : getAppointmentsAdmin;
      getApts()
        .then((res: any) => setAppointments(res.data))
        .catch((err: any) => console.error('Silent refresh failed:', err));
    }, 8000);

    return () => clearInterval(interval);
  }, [isReceptionist]);

  // Monitor changes in check-ins and trigger chime sound for new entries
  useEffect(() => {
    if (appointments.length === 0) return;

    const currentCheckedInIds = appointments
      .filter(apt => apt.trang_thai === 'da_checkin')
      .map(apt => String(apt.id));

    if (isFirstLoad.current) {
      currentCheckedInIds.forEach(id => seenCheckedInIds.current.add(id));
      isFirstLoad.current = false;
    } else {
      let hasNewCheckIn = false;
      currentCheckedInIds.forEach(id => {
        if (!seenCheckedInIds.current.has(id)) {
          seenCheckedInIds.current.add(id);
          hasNewCheckIn = true;
        }
      });

      if (hasNewCheckIn) {
        playNotificationSound();
        toast('🎉 Bệnh nhân mới vừa check-in phòng khám!', {
          icon: '👏',
          style: {
            borderRadius: '16px',
            background: '#0d9488',
            color: '#fff',
            fontWeight: 'bold',
          },
        });
      }
    }
  }, [appointments, playNotificationSound]);

  // Monitor changes in unconfirmed appointments (>10 min grace period)
  useEffect(() => {
    if (appointments.length === 0) return;

    const checkNewUnconfirmed = () => {
      const graceTimeMs = 10 * 60 * 1000;
      const currentUnconfirmed = appointments.filter(apt => {
        const createdAt = apt.thoi_gian_tao ? new Date(apt.thoi_gian_tao).getTime() : 0;
        const isGracePassed = createdAt > 0 && (createdAt + graceTimeMs <= Date.now());
        return apt.trang_thai === 'chua_xac_nhan' && isGracePassed;
      });

      let hasNewUnconfirmed = false;
      let newAptNames: string[] = [];

      currentUnconfirmed.forEach(apt => {
        const id = String(apt.id);
        if (!seenUnconfirmedIds.current.has(id)) {
          seenUnconfirmedIds.current.add(id);
          hasNewUnconfirmed = true;
          const name = apt.ten_khach_hang || apt.ho_ten_khach || 'Khách hàng';
          newAptNames.push(name);
        }
      });

      if (hasNewUnconfirmed && isReceptionist) {
        const nameList = newAptNames.slice(0, 2).join(', ') + (newAptNames.length > 2 ? ` và ${newAptNames.length - 2} khác` : '');
        toast(`📞 ${newAptNames.length} ca khám chờ liên hệ: ${nameList}`, {
          icon: '☎️',
          duration: 8000,
          style: {
            borderRadius: '16px',
            background: '#f59e0b',
            color: '#fff',
            fontWeight: 'bold',
          },
        });
      }

      // Play sound continuously every 10 seconds if any unconfirmed appointment is overdue
      if (currentUnconfirmed.length > 0 && isReceptionist) {
        playNotificationSound();
      }
    };

    checkNewUnconfirmed();
    const interval = setInterval(checkNewUnconfirmed, 10000);
    return () => clearInterval(interval);
  }, [appointments, isReceptionist, playNotificationSound]);

  return {
    appointments,
    setAppointments,
    staffList,
    roomsList,
    services,
    packages,
    schedulesList,
    loading,
    refetch: fetchData,
    playNotificationSound
  };
}

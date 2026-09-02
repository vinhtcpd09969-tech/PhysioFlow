/**
 * Chuông báo khi Chuyên viên/KTV bấm "GỌI VÀO" hoặc khi Lễ tân phát hiện một lượt gọi mới.
 * Chỉ còn hiệu ứng âm thanh (Web Audio API) — KHÔNG còn lưu/broadcast tín hiệu qua localStorage
 * hay BroadcastChannel (cơ chế đó chỉ hoạt động khi 2 vai trò mở CÙNG một trình duyệt, không đồng
 * bộ được giữa 2 máy thật). Nguồn sự thật cho "đang gọi vào" giờ nằm ở server
 * (`cuoc_hen` → `phien_lam_viec.thoi_gian_goi_vao`), đọc qua polling danh sách lịch hẹn có sẵn.
 */
export function playCallInAudioChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.4);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.65);
  } catch (err) {
    console.warn('Cannot play audio chime:', err);
  }
}

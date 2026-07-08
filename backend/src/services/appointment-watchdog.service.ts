class AppointmentWatchdogService {
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    if (this.intervalId) return;

    // Run immediately on start
    this.runWatchdog().catch(err => {
      console.error('Lỗi khi chạy Watchdog lần đầu:', err);
    });

    // Run every 2 minutes (120000 ms)
    this.intervalId = setInterval(() => {
      this.runWatchdog().catch(err => {
        console.error('Lỗi khi chạy định kỳ Watchdog:', err);
      });
    }, 2 * 60 * 1000);

    console.log('Watchdog service đã được khởi chạy (chu kỳ 2 phút).');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Watchdog service đã dừng.');
    }
  }

  async runWatchdog() {
    // Tự động hủy lịch đã bị vô hiệu hóa theo yêu cầu.
    // Lịch hẹn chưa xác nhận sẽ được giữ lại để lễ tân chủ động xử lý.
    return;
  }
}

export default new AppointmentWatchdogService();

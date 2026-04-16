export class BusinessTimeUtil {
  static CUTOFF_HOUR = 7;
  static CUTOFF_HOUR_MANAGER = 7;
  // Độ lệch tính bằng ms: (Thời gian Server) - (Thời gian Client)
  static SERVER_TIME_OFFSET_MS = 0;

  /**
   * Lấy thời gian hiện tại đã được đồng bộ với Server
   */
  static getNow() {
    return new Date(Date.now() + this.SERVER_TIME_OFFSET_MS);
  }

  /**
   * Tính toán Ngày Nghiệp Vụ dựa trên mốc Cut-off
   */
  static getEffectiveBusinessDate(systemTime = this.getNow(), isManager = false) {
    const time = new Date(systemTime);
    
    const isDateOnlyString = typeof systemTime === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(systemTime);

    const appliedCutoff = isManager ? this.CUTOFF_HOUR_MANAGER : this.CUTOFF_HOUR;

    if (!isDateOnlyString && time.getHours() < appliedCutoff) {
      time.setDate(time.getDate() - 1);
    }
    time.setHours(0, 0, 0, 0);
    // Return an object that has a toDate() method to be compatible with previous usage, 
    // or just return the Date object and we can use it directly
    return {
      toDate: () => time,
      day: () => time.getDay(),
      format: (fmt) => {
        const y = time.getFullYear();
        const m = String(time.getMonth() + 1).padStart(2, '0');
        const d = String(time.getDate()).padStart(2, '0');
        if (fmt === 'YYYY-MM-DD') return `${y}-${m}-${d}`;
        return time.toISOString();
      }
    };
  }

  /**
   * Kiểm tra xem Ngày Nghiệp Vụ có rơi vào Cuối tuần (Thứ 7, Chủ Nhật) hay không
   */
  static isWeekendLocked(systemTime = this.getNow(), isManager = false) {
    const businessDate = this.getEffectiveBusinessDate(systemTime, isManager);
    const dayOfWeek = businessDate.day(); 
    // 0: Chủ Nhật, 6: Thứ Bảy
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  /**
   * Kiểm tra xem có phải là Thứ Hai - Ngày được phép cộng dồn dữ liệu cuối tuần không
   */
  static isAccumulationDay(systemTime = this.getNow(), isManager = false) {
    const businessDate = this.getEffectiveBusinessDate(systemTime, isManager);
    return businessDate.day() === 1; // 1: Thứ Hai
  }
}

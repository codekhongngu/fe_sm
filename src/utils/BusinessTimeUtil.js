export class BusinessTimeUtil {
  static CUTOFF_HOUR = 7;
  static CUTOFF_HOUR_MANAGER = 7;
  // Độ lệch tính bằng ms: (Thời gian Server) - (Thời gian Client)
  static SERVER_TIME_OFFSET_MS = 0;
  static TIME_ZONE = 'Asia/Ho_Chi_Minh';

  static #tzFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  static getTzParts(systemTime = this.getNow()) {
    const sourceDate = systemTime instanceof Date ? systemTime : new Date(systemTime);
    const parts = this.#tzFormatter.formatToParts(sourceDate);
    const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return {
      year: Number(map.year),
      month: Number(map.month),
      day: Number(map.day),
      hour: Number(map.hour),
      minute: Number(map.minute),
      second: Number(map.second),
    };
  }

  static formatYmd(parts) {
    const y = String(parts.year).padStart(4, '0');
    const m = String(parts.month).padStart(2, '0');
    const d = String(parts.day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  static shiftYmd(ymd, deltaDays) {
    const [y, m, d] = String(ymd).split('-').map(Number);
    const utcDate = new Date(Date.UTC(y, m - 1, d));
    utcDate.setUTCDate(utcDate.getUTCDate() + deltaDays);
    return `${utcDate.getUTCFullYear()}-${String(utcDate.getUTCMonth() + 1).padStart(2, '0')}-${String(
      utcDate.getUTCDate(),
    ).padStart(2, '0')}`;
  }

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
    const isDateOnlyString = typeof systemTime === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(systemTime);
    const appliedCutoff = isManager ? this.CUTOFF_HOUR_MANAGER : this.CUTOFF_HOUR;

    let businessYmd;

    if (isDateOnlyString) {
      businessYmd = String(systemTime);
    } else {
      const tzParts = this.getTzParts(systemTime);
      businessYmd = this.formatYmd(tzParts);
      if (tzParts.hour < appliedCutoff) {
        businessYmd = this.shiftYmd(businessYmd, -1);
      }
    }

    const [yy, mm, dd] = businessYmd.split('-').map(Number);
    const localMidnightDate = new Date(yy, mm - 1, dd);
    const utcForDay = new Date(Date.UTC(yy, mm - 1, dd));

    return {
      toDate: () => localMidnightDate,
      day: () => utcForDay.getUTCDay(),
      format: (fmt) => {
        if (fmt === 'YYYY-MM-DD') return businessYmd;
        return `${businessYmd}T00:00:00+07:00`;
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

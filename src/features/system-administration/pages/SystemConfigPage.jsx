import { useState, useEffect } from 'react';
import axiosInstance from '../../../utils/http/axiosInstance';
import { BusinessTimeUtil } from '../../../utils/BusinessTimeUtil';

const SystemConfigPage = () => {
  const [cutoffHour, setCutoffHour] = useState('');
  const [cutoffHourManager, setCutoffHourManager] = useState('');
  const [disableCrossTimeManager, setDisableCrossTimeManager] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [statusText, setStatusText] = useState('');

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/system-configs');
      if (res.data) {
        if (res.data.cutoffHour !== undefined) {
          setCutoffHour(res.data.cutoffHour);
        }
        if (res.data.cutoffHourManager !== undefined) {
          setCutoffHourManager(res.data.cutoffHourManager);
        }
        if (res.data.disableCrossTimeManager !== undefined) {
          setDisableCrossTimeManager(res.data.disableCrossTimeManager);
        }
      }
    } catch (error) {
      setErrorText('Không tải được cấu hình hệ thống');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async () => {
    setErrorText('');
    setStatusText('');
    
    const hour = parseInt(cutoffHour, 10);
    if (isNaN(hour) || hour < 0 || hour > 23) {
      setErrorText('Giờ cắt ngày cho nhân viên phải là số từ 0 đến 23');
      return;
    }

    const hourManager = parseInt(cutoffHourManager, 10);
    if (isNaN(hourManager) || hourManager < 0 || hourManager > 23) {
      setErrorText('Giờ cắt ngày cho quản lý phải là số từ 0 đến 23');
      return;
    }

    setSaving(true);
    try {
      await axiosInstance.patch('/api/admin/system-configs', { 
        cutoffHour: hour,
        cutoffHourManager: hourManager,
        disableCrossTimeManager
      });
      setStatusText('Lưu cấu hình thành công');
      BusinessTimeUtil.CUTOFF_HOUR = hour; // Cập nhật ngay trên bộ nhớ Frontend
      BusinessTimeUtil.CUTOFF_HOUR_MANAGER = hourManager; 
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Lưu cấu hình thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <h2 className="page-title">Cấu hình Hệ thống</h2>
      <p style={{ color: '#666', marginBottom: 20 }}>
        Cài đặt các thông số chung của toàn hệ thống
      </p>

      {errorText && <div className="status-err" style={{ marginBottom: 15 }}>{errorText}</div>}
      {statusText && <div className="status-ok" style={{ marginBottom: 15 }}>{statusText}</div>}

      {loading ? (
        <div>Đang tải cấu hình...</div>
      ) : (
        <div style={{ maxWidth: 600 }}>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
              Giờ cắt ngày cho Nhân viên (Cut-off Time)
            </label>
            <div style={{ color: '#666', fontSize: '0.9em', marginBottom: 8 }}>
              Xác định mốc giờ chuyển ngày mới đối với nhân viên Sales. Ví dụ: Nếu cấu hình là 7, thì trước 7h sáng hệ thống vẫn tính dữ liệu cho ngày hôm qua.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                className="field"
                type="number"
                min="0"
                max="23"
                value={cutoffHour}
                onChange={(e) => setCutoffHour(e.target.value)}
                style={{ width: 100 }}
              />
              <span>Giờ (0 - 23)</span>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
              Giờ cắt ngày cho Quản lý (Manager Cut-off Time)
            </label>
            <div style={{ color: '#666', fontSize: '0.9em', marginBottom: 8 }}>
              Xác định mốc giờ chuyển ngày mới riêng cho cấp Quản lý (Manager/Admin). Ví dụ: Quản lý có thể được cấu hình 9h để có thêm thời gian duyệt bài ngày hôm trước.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                className="field"
                type="number"
                min="0"
                max="23"
                value={cutoffHourManager}
                onChange={(e) => setCutoffHourManager(e.target.value)}
                style={{ width: 100 }}
              />
              <span>Giờ (0 - 23)</span>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 30 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={disableCrossTimeManager}
                onChange={(e) => setDisableCrossTimeManager(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              Bỏ qua kiểm tra thời gian cho Quản lý (Cross time)
            </label>
            <div style={{ color: '#666', fontSize: '0.9em', marginTop: 8, marginLeft: 28 }}>
              Khi bật tùy chọn này, các tài khoản Quản lý (Manager/Admin) có thể chấm điểm, duyệt form và nhận xét cho bất kỳ ngày nào mà không bị chặn bởi giới hạn thời gian (cross time / cuối tuần).
            </div>
          </div>

          <button className="btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SystemConfigPage;

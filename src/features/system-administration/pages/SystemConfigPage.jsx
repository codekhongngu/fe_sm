import { useState, useEffect } from 'react';
import axiosInstance from '../../../utils/http/axiosInstance';
import { BusinessTimeUtil } from '../../../utils/BusinessTimeUtil';

const SystemConfigPage = () => {
  const [cutoffHour, setCutoffHour] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [statusText, setStatusText] = useState('');

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/system-configs/cutoff-time');
      if (res.data && res.data.hour !== undefined) {
        setCutoffHour(res.data.hour);
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
      setErrorText('Giờ cắt ngày phải là số từ 0 đến 23');
      return;
    }

    setSaving(true);
    try {
      await axiosInstance.patch('/api/admin/system-configs/cutoff-time', { hour });
      setStatusText('Lưu cấu hình thành công');
      BusinessTimeUtil.CUTOFF_HOUR = hour; // Cập nhật ngay trên bộ nhớ Frontend
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
        <div style={{ maxWidth: 400 }}>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
              Giờ cắt ngày (Cut-off Time)
            </label>
            <div style={{ color: '#666', fontSize: '0.9em', marginBottom: 8 }}>
              Xác định mốc giờ chuyển ngày mới. Ví dụ: Nếu cấu hình là 7, thì trước 7h sáng hệ thống vẫn tính dữ liệu cho ngày hôm qua.
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

          <button className="btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SystemConfigPage;

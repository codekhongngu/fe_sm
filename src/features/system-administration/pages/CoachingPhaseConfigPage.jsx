import { useEffect, useState } from 'react';
import behaviorAdminService from '../../../services/api/behaviorAdminService';

const ALL_COACHING_FORMS = [
  { id: 'coaching_form_1', label: 'Mẫu coaching 1' },
  { id: 'coaching_form_2', label: 'Mẫu coaching 2' },
];

const CoachingPhaseConfigPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ message: '', type: 'ok' });

  const [editingId, setEditingId] = useState(null);
  const [phaseCode, setPhaseCode] = useState('');
  const [phaseName, setPhaseName] = useState('');
  const [startDay, setStartDay] = useState('');
  const [endDay, setEndDay] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [allowedCoachingForms, setAllowedCoachingForms] = useState(['coaching_form_1']);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await behaviorAdminService.getCoachingPhaseConfigs();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setStatus({
        message: error?.response?.data?.message || 'Không tải được cấu hình giai đoạn coaching',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setPhaseCode('');
    setPhaseName('');
    setStartDay('');
    setEndDay('');
    setSortOrder(1);
    setIsActive(true);
    setAllowedCoachingForms(['coaching_form_1']);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setPhaseCode(item.phaseCode);
    setPhaseName(item.phaseName);
    setStartDay(item.startDate || '');
    setEndDay(item.endDate || '');
    setSortOrder(item.sortOrder);
    setIsActive(item.isActive);
    setAllowedCoachingForms(
      Array.isArray(item.allowedCoachingForms) && item.allowedCoachingForms.length > 0
        ? item.allowedCoachingForms
        : ['coaching_form_1'],
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    setStatus({ message: '', type: 'ok' });
    try {
      const payload = {
        phaseCode,
        phaseName,
        startDate: startDay || null,
        endDate: endDay || null,
        sortOrder: Number(sortOrder),
        isActive,
        allowedCoachingForms,
      };

      if (editingId) {
        await behaviorAdminService.updateCoachingPhaseConfig(editingId, payload);
        setStatus({ message: 'Cập nhật cấu hình coaching thành công', type: 'ok' });
      } else {
        await behaviorAdminService.createCoachingPhaseConfig(payload);
        setStatus({ message: 'Thêm cấu hình coaching thành công', type: 'ok' });
      }

      resetForm();
      loadData();
    } catch (error) {
      setStatus({
        message: error?.response?.data?.message || 'Lưu cấu hình coaching thất bại',
        type: 'error',
      });
    }
  };

  return (
    <div>
      <h2>Cấu hình giai đoạn coaching</h2>
      <p>Quản lý cấu hình giai đoạn riêng cho form coaching nhân viên.</p>

      <div className="card" style={{ marginBottom: 24, maxWidth: 620 }}>
        <h3>{editingId ? 'Sửa cấu hình coaching' : 'Thêm cấu hình coaching mới'}</h3>
        <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Mã giai đoạn</label>
            <input
              className="field"
              placeholder="VD: PHASE_1"
              value={phaseCode}
              onChange={(e) => setPhaseCode(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Tên giai đoạn</label>
            <input
              className="field"
              placeholder="VD: Giai đoạn coaching 1"
              value={phaseName}
              onChange={(e) => setPhaseName(e.target.value)}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Ngày bắt đầu</label>
              <input
                className="field"
                type="date"
                value={startDay}
                onChange={(e) => setStartDay(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Ngày kết thúc</label>
              <input
                className="field"
                type="date"
                value={endDay}
                onChange={(e) => setEndDay(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Thứ tự sắp xếp</label>
              <input
                className="field"
                type="number"
                min="1"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 24 }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <strong>Kích hoạt</strong>
              </label>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
              Mẫu coaching áp dụng
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {ALL_COACHING_FORMS.map((formOption) => (
                <label key={formOption.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={allowedCoachingForms.includes(formOption.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAllowedCoachingForms(Array.from(new Set([...allowedCoachingForms, formOption.id])));
                      } else {
                        setAllowedCoachingForms(allowedCoachingForms.filter((id) => id !== formOption.id));
                      }
                    }}
                  />
                  <span>{formOption.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn primary" onClick={handleSave}>
              {editingId ? 'Cập nhật' : 'Thêm mới'}
            </button>
            {editingId && (
              <button className="btn" onClick={resetForm}>
                Hủy
              </button>
            )}
          </div>
        </div>
      </div>

      {status.message && (
        <div
          className={status.type === 'ok' ? 'status-ok' : 'status-err'}
          style={{
            marginBottom: 16,
            padding: 12,
            backgroundColor: status.type === 'ok' ? '#e6f7e6' : '#fff1f0',
            borderLeft: `4px solid ${status.type === 'ok' ? '#52c41a' : '#f5222d'}`,
          }}
        >
          {status.message}
        </div>
      )}

      <h3>Danh sách cấu hình giai đoạn coaching</h3>
      {loading ? (
        <div>Đang tải dữ liệu...</div>
      ) : items.length === 0 ? (
        <div>Chưa có cấu hình nào.</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#1890ff' }}>
                  {item.phaseName} ({item.phaseCode})
                </h4>
                <div style={{ display: 'flex', gap: 16, fontSize: '0.9em', color: '#555' }}>
                  <span>Ngày: <strong>{item.startDate || '--'} đến {item.endDate || '--'}</strong></span>
                  <span>Thứ tự: <strong>{item.sortOrder}</strong></span>
                  <span style={{ color: item.isActive ? '#52c41a' : '#f5222d', fontWeight: 'bold' }}>
                    {item.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                  </span>
                </div>
                <div style={{ marginTop: 4, fontSize: '0.85em', color: '#888' }}>
                  Mẫu coaching áp dụng: {Array.isArray(item.allowedCoachingForms) && item.allowedCoachingForms.length > 0
                    ? item.allowedCoachingForms.map((f) => ALL_COACHING_FORMS.find((a) => a.id === f)?.label || f).join(', ')
                    : 'Mặc định hệ thống'}
                </div>
              </div>
              <div>
                <button className="btn" onClick={() => handleEdit(item)}>
                  Sửa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoachingPhaseConfigPage;

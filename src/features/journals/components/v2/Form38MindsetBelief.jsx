import React, { useState } from 'react';
import './EformV2.css';

const Form38MindsetBelief = ({
  title = "Mẫu 3: Thay đổi Tư duy",
  initialData = {},
  userRole = 'EMPLOYEE',
  onSubmit,
  isSubmitting = false,
}) => {
  const [oldMindset, setOldMindset] = useState(initialData.oldMindset || '');
  const [newMindset, setNewMindset] = useState(initialData.newMindset || '');
  const [actionChange, setActionChange] = useState(initialData.actionChange || '');

  const status = initialData.status || 'PENDING';
  const isReadOnly = status === 'APPROVED' || userRole === 'MANAGER';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (userRole === 'EMPLOYEE') {
      if (!oldMindset || !newMindset || !actionChange) return alert('Vui lòng điền đầy đủ các thông tin');
      onSubmit({ oldMindset, newMindset, actionChange });
    }
  };

  return (
    <div className="eform-v2-container">
      <div className="eform-v2-column" style={{ width: '100%' }}>
        <div className="eform-v2-title">
          <span>{title}</span>
          {status === 'PENDING' && <span className="eform-v2-badge badge-pending">Chờ duyệt</span>}
          {status === 'APPROVED' && <span className="eform-v2-badge badge-approved">Đạt</span>}
        </div>

        <div className="eform-v2-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div className="eform-v2-input-group" style={{ marginBottom: 0 }}>
            <label className="eform-v2-label" style={{ color: '#ef4444', fontSize: '1rem' }}>❌ Suy nghĩ tiêu cực xuất hiện</label>
            <textarea
              className="eform-v2-input"
              rows={5}
              placeholder="Nhập suy nghĩ tiêu cực..."
              value={oldMindset}
              onChange={(e) => setOldMindset(e.target.value)}
              disabled={isReadOnly}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div className="eform-v2-input-group" style={{ marginBottom: 0 }}>
            <label className="eform-v2-label" style={{ color: '#10b981', fontSize: '1rem' }}>✅ Tôi viết lại thành tư duy mới</label>
            <textarea
              className="eform-v2-input"
              rows={5}
              placeholder="Nhập tư duy mới..."
              value={newMindset}
              onChange={(e) => setNewMindset(e.target.value)}
              disabled={isReadOnly}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div className="eform-v2-input-group" style={{ marginBottom: 0 }}>
            <label className="eform-v2-label" style={{ color: '#3b82f6', fontSize: '1rem' }}>🚀 Hành vi thay đổi</label>
            <textarea
              className="eform-v2-input"
              rows={5}
              placeholder="Nhập hành vi thay đổi tương ứng..."
              value={actionChange}
              onChange={(e) => setActionChange(e.target.value)}
              disabled={isReadOnly}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        {!isReadOnly && (
          <div className="eform-v2-actions">
            <button
              className="eform-v2-btn primary"
              onClick={handleSubmit}
              disabled={isSubmitting || !oldMindset || !newMindset || !actionChange}
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu Nhận Diện'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Form38MindsetBelief;

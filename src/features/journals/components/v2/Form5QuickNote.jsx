import React, { useState } from 'react';
import './EformV2.css';

const Form5QuickNote = ({
  initialData = {},
  userRole = 'EMPLOYEE',
  onSubmit,
  isSubmitting = false,
}) => {
  const [lessonLearned, setLessonLearned] = useState(initialData.lessonLearned || '');
  const [actionPlan, setActionPlan] = useState(initialData.actionPlan || '');

  const status = initialData.status || 'PENDING';
  const isReadOnly = status === 'APPROVED' || userRole === 'MANAGER';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (userRole === 'EMPLOYEE') {
      if (!lessonLearned || !actionPlan) return alert('Vui lòng điền đầy đủ ghi chép cuối ngày');
      onSubmit({ lessonLearned, actionPlan });
    }
  };

  return (
    <div className="eform-v2-container">
      <div className="eform-v2-column" style={{ width: '100%' }}>
        <div className="eform-v2-title">
          <span>Mẫu 5: Ghi chép cuối ngày (Quick Note)</span>
          {status === 'PENDING' && <span className="eform-v2-badge badge-pending">Chờ duyệt</span>}
          {status === 'APPROVED' && <span className="eform-v2-badge badge-approved">Đạt</span>}
        </div>

        <div className="eform-v2-grid" style={{ gridTemplateColumns: '1fr', gap: '16px' }}>
          <div className="eform-v2-input-group" style={{ marginBottom: 0 }}>
            <label className="eform-v2-label">Bài học đắt giá rút ra hôm nay</label>
            <textarea
              className="eform-v2-input"
              rows={3}
              placeholder="Ghi chú nhanh bài học..."
              value={lessonLearned}
              onChange={(e) => setLessonLearned(e.target.value)}
              disabled={isReadOnly}
            />
          </div>
          <div className="eform-v2-input-group" style={{ marginBottom: 0 }}>
            <label className="eform-v2-label">Hành động khác biệt cho ngày mai</label>
            <textarea
              className="eform-v2-input"
              rows={3}
              placeholder="Tôi sẽ làm gì khác đi vào ngày mai..."
              value={actionPlan}
              onChange={(e) => setActionPlan(e.target.value)}
              disabled={isReadOnly}
            />
          </div>
        </div>

        {!isReadOnly && (
          <div className="eform-v2-actions">
            <button
              className="eform-v2-btn primary"
              onClick={handleSubmit}
              disabled={isSubmitting || !lessonLearned || !actionPlan}
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu Ghi Chép'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Form5QuickNote;

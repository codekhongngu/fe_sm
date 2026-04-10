import React, { useState, useEffect } from 'react';
import './EformV2.css';

// Reusable Large Toggle Component
const LargeToggle = ({ checked, onChange, disabled, variant = 'default' }) => {
  let activeClass = 'active';
  if (variant === 'pass') activeClass += ' eval-pass';
  if (variant === 'fail') activeClass += ' eval-fail';

  return (
    <div
      className={`eform-v2-toggle ${checked ? activeClass : ''} ${disabled ? 'disabled' : ''}`}
      onClick={() => {
        if (!disabled && onChange) onChange(!checked);
      }}
    >
      <div className="eform-v2-toggle-thumb" />
    </div>
  );
};

const Form2BehaviorChecklist = ({
  initialData = {},
  userRole = 'EMPLOYEE', // 'EMPLOYEE' | 'MANAGER'
  onSubmit,
  isSubmitting = false,
  journalId
}) => {
  // State for Employee
  const [customersMet, setCustomersMet] = useState(initialData.customersMet || '');
  const [deepInquiry, setDeepInquiry] = useState(initialData.deepInquiry || false);
  const [fullConsult, setFullConsult] = useState(initialData.fullConsult || false);
  const [persistence, setPersistence] = useState(initialData.persistence || false);

  // State for Manager Evaluation
  const [mgrDeepInquiry, setMgrDeepInquiry] = useState(initialData.mgrDeepInquiry || false);
  const [mgrFullConsult, setMgrFullConsult] = useState(initialData.mgrFullConsult || false);
  const [mgrPersistence, setMgrPersistence] = useState(initialData.mgrPersistence || false);

  // Overall Status
  const status = initialData.status || 'PENDING'; // 'PENDING' | 'APPROVED' | 'REJECTED'

  // Logic Validations
  const isZeroCustomers = Number(customersMet) === 0 && customersMet !== '';
  const isReadOnly = status === 'APPROVED' || (userRole === 'MANAGER' && status !== 'PENDING');
  const isManagerMode = userRole === 'MANAGER' || userRole === 'ADMIN';

  // Force toggles to false if 0 customers met
  useEffect(() => {
    if (isZeroCustomers && !isReadOnly && userRole === 'EMPLOYEE') {
      setDeepInquiry(false);
      setFullConsult(false);
      setPersistence(false);
    }
  }, [isZeroCustomers, isReadOnly, userRole]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (userRole === 'EMPLOYEE') {
      if (customersMet === '') return alert('Vui lòng nhập số khách gặp');
      onSubmit({
        customersMet: Number(customersMet),
        deepInquiry,
        fullConsult,
        persistence
      });
    } else {
      // Manager submit logic (Evaluate)
      onSubmit({
        mgrEvalDeepQ: mgrDeepInquiry,
        mgrEvalFullCons: mgrFullConsult,
        mgrEvalFollow: mgrPersistence
      });
    }
  };

  const handleCopyUrl = async () => {
    const url = `${window.location.origin}/discipline/manager-review/${journalId}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('Đã sao chép link đánh giá thành công!');
    } catch (err) {
      alert('Không thể sao chép link.');
    }
  };

  return (
    <div className="eform-v2-container">
      <div className={`eform-v2-grid ${isManagerMode ? 'manager-mode' : ''}`}>
        
        {/* CỘT NHÂN VIÊN */}
        <div className="eform-v2-column">
          <div className="eform-v2-title">
            <span>Khai báo Nhân viên</span>
            {status === 'PENDING' && <span className="eform-v2-badge badge-pending">Chờ duyệt</span>}
            {status === 'APPROVED' && <span className="eform-v2-badge badge-approved">Đạt</span>}
            {status === 'REJECTED' && <span className="eform-v2-badge badge-rejected">Chưa đạt</span>}
          </div>

          <div className="eform-v2-input-group">
            <label className="eform-v2-label">Số khách gặp trong ngày</label>
            <input
              type="number"
              min="0"
              className="eform-v2-input"
              placeholder="Nhập số lượng..."
              value={customersMet}
              onChange={(e) => setCustomersMet(e.target.value)}
              disabled={isReadOnly || isManagerMode}
            />
          </div>

          <div className="eform-v2-toggle-group">
            <div className="eform-v2-toggle-row">
              <span className={`eform-v2-toggle-label ${isZeroCustomers ? 'disabled' : ''}`}>1. Hỏi sâu</span>
              <LargeToggle
                checked={deepInquiry}
                onChange={setDeepInquiry}
                disabled={isReadOnly || isManagerMode || isZeroCustomers}
              />
            </div>
            <div className="eform-v2-toggle-row">
              <span className={`eform-v2-toggle-label ${isZeroCustomers ? 'disabled' : ''}`}>2. Tư vấn đủ</span>
              <LargeToggle
                checked={fullConsult}
                onChange={setFullConsult}
                disabled={isReadOnly || isManagerMode || isZeroCustomers}
              />
            </div>
            <div className="eform-v2-toggle-row">
              <span className={`eform-v2-toggle-label ${isZeroCustomers ? 'disabled' : ''}`}>3. Theo đến cùng</span>
              <LargeToggle
                checked={persistence}
                onChange={setPersistence}
                disabled={isReadOnly || isManagerMode || isZeroCustomers}
              />
            </div>
          </div>
        </div>

        {/* CỘT QUẢN LÝ THẨM ĐỊNH (Chỉ hiển thị nếu là Manager) */}
        {isManagerMode && (
          <div className="eform-v2-column" style={{ backgroundColor: '#f8fafc' }}>
            <div className="eform-v2-title">
              <span>Quản lý Thẩm định</span>
            </div>
            
            <div className="eform-v2-input-group" style={{ visibility: 'hidden' }}>
              <label className="eform-v2-label">Spacer</label>
              <input type="text" className="eform-v2-input" disabled />
            </div>

            <div className="eform-v2-toggle-group">
              <div className="eform-v2-toggle-row">
                <span className="eform-v2-toggle-label">Đánh giá Hỏi sâu</span>
                <LargeToggle
                  checked={mgrDeepInquiry}
                  onChange={setMgrDeepInquiry}
                  disabled={isReadOnly}
                  variant={mgrDeepInquiry ? 'pass' : 'fail'}
                />
              </div>
              <div className="eform-v2-toggle-row">
                <span className="eform-v2-toggle-label">Đánh giá Tư vấn đủ</span>
                <LargeToggle
                  checked={mgrFullConsult}
                  onChange={setMgrFullConsult}
                  disabled={isReadOnly}
                  variant={mgrFullConsult ? 'pass' : 'fail'}
                />
              </div>
              <div className="eform-v2-toggle-row">
                <span className="eform-v2-toggle-label">Đánh giá Theo đến cùng</span>
                <LargeToggle
                  checked={mgrPersistence}
                  onChange={setMgrPersistence}
                  disabled={isReadOnly}
                  variant={mgrPersistence ? 'pass' : 'fail'}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="eform-v2-actions">
        {!isReadOnly && (
          <button
            className="eform-v2-btn primary"
            onClick={handleSubmit}
            disabled={isSubmitting || (userRole === 'EMPLOYEE' && customersMet === '')}
          >
            {isSubmitting ? 'Đang lưu...' : (isManagerMode ? 'Lưu Thẩm Định' : 'Nộp Nhật Ký')}
          </button>
        )}
        
        {journalId && (
          <button className="eform-v2-btn outline" onClick={handleCopyUrl}>
            🔗 Sao chép URL Đánh giá
          </button>
        )}
      </div>
    </div>
  );
};

export default Form2BehaviorChecklist;

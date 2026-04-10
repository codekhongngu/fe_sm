import React, { useEffect, useState } from 'react';
import './EformV2.css';

const createEmptyRow = () => ({
  situation: '',
  oldBelief: '',
  newChosenBelief: '',
  newBehavior: '',
  result: '',
});

const Form8BeliefTransformations = ({
  initialData = {},
  userRole = 'EMPLOYEE',
  onSubmit,
  isSubmitting = false,
}) => {
  const [rows, setRows] = useState(() =>
    Array.isArray(initialData.beliefTransformations) && initialData.beliefTransformations.length > 0
      ? initialData.beliefTransformations
      : [
          {
            situation: initialData.situation || '',
            oldBelief: initialData.oldBelief || '',
            newChosenBelief: initialData.newChosenBelief || '',
            newBehavior: initialData.newBehavior || '',
            result: initialData.result || '',
          },
        ],
  );

  const status = initialData.status || 'PENDING';
  const isReadOnly = status === 'APPROVED' || userRole === 'MANAGER';

  useEffect(() => {
    if (
      Array.isArray(initialData.beliefTransformations) &&
      initialData.beliefTransformations.length > 0
    ) {
      setRows(initialData.beliefTransformations);
      return;
    }
    setRows([
      {
        situation: initialData.situation || '',
        oldBelief: initialData.oldBelief || '',
        newChosenBelief: initialData.newChosenBelief || '',
        newBehavior: initialData.newBehavior || '',
        result: initialData.result || '',
      },
    ]);
  }, [initialData]);

  const updateRow = (index, key, value) => {
    setRows((prev) => prev.map((row, idx) => (idx === index ? { ...row, [key]: value } : row)));
  };

  const addRow = () => {
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const removeRow = (index) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting || userRole !== 'EMPLOYEE') return;

    const normalized = rows.map((row) => ({
      situation: (row.situation || '').trim(),
      oldBelief: (row.oldBelief || '').trim(),
      newChosenBelief: (row.newChosenBelief || '').trim(),
      newBehavior: (row.newBehavior || '').trim(),
      result: (row.result || '').trim(),
    }));
    const validRows = normalized.filter(
      (row) =>
        row.situation || row.oldBelief || row.newChosenBelief || row.newBehavior || row.result,
    );
    if (validRows.length === 0) {
      return alert('Vui lòng nhập ít nhất 1 tình huống cho Mẫu 8');
    }
    const hasInvalid = validRows.some(
      (row) =>
        !row.situation ||
        !row.oldBelief ||
        !row.newChosenBelief ||
        !row.newBehavior ||
        !row.result,
    );
    if (hasInvalid) {
      return alert('Vui lòng nhập đầy đủ thông tin cho từng tình huống');
    }
    onSubmit({ beliefTransformations: validRows });
  };

  return (
    <div className="eform-v2-container">
      <div className="eform-v2-column" style={{ width: '100%' }}>
        <div className="eform-v2-title">
          <span>Mẫu 8: Củng cố Niềm tin</span>
          {status === 'PENDING' && <span className="eform-v2-badge badge-pending">Chờ duyệt</span>}
          {status === 'APPROVED' && <span className="eform-v2-badge badge-approved">Đạt</span>}
        </div>
        <div style={{ marginBottom: 10, color: '#0f172a', fontWeight: 600 }}>
          Mục tiêu: Viết lại chương trình của não. Chuyển từ tư duy thu nhập thấp sang tư duy thu nhập cao.
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 920 }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #dbe5f1', padding: 8, textAlign: 'left' }}>Tình huống</th>
                <th style={{ border: '1px solid #dbe5f1', padding: 8, textAlign: 'left' }}>Niềm tin cũ xuất hiện</th>
                <th style={{ border: '1px solid #dbe5f1', padding: 8, textAlign: 'left' }}>Niềm tin mới tôi chọn</th>
                <th style={{ border: '1px solid #dbe5f1', padding: 8, textAlign: 'left' }}>Hành vi mới</th>
                <th style={{ border: '1px solid #dbe5f1', padding: 8, textAlign: 'left' }}>Kết quả</th>
                {!isReadOnly && <th style={{ border: '1px solid #dbe5f1', padding: 8, textAlign: 'center' }}>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`form8-row-${index}`}>
                  <td style={{ border: '1px solid #dbe5f1', padding: 6 }}>
                    <textarea className="eform-v2-input" rows={2} value={row.situation} onChange={(e) => updateRow(index, 'situation', e.target.value)} disabled={isReadOnly} />
                  </td>
                  <td style={{ border: '1px solid #dbe5f1', padding: 6 }}>
                    <textarea className="eform-v2-input" rows={2} value={row.oldBelief} onChange={(e) => updateRow(index, 'oldBelief', e.target.value)} disabled={isReadOnly} />
                  </td>
                  <td style={{ border: '1px solid #dbe5f1', padding: 6 }}>
                    <textarea className="eform-v2-input" rows={2} value={row.newChosenBelief} onChange={(e) => updateRow(index, 'newChosenBelief', e.target.value)} disabled={isReadOnly} />
                  </td>
                  <td style={{ border: '1px solid #dbe5f1', padding: 6 }}>
                    <textarea className="eform-v2-input" rows={2} value={row.newBehavior} onChange={(e) => updateRow(index, 'newBehavior', e.target.value)} disabled={isReadOnly} />
                  </td>
                  <td style={{ border: '1px solid #dbe5f1', padding: 6 }}>
                    <textarea className="eform-v2-input" rows={2} value={row.result} onChange={(e) => updateRow(index, 'result', e.target.value)} disabled={isReadOnly} />
                  </td>
                  {!isReadOnly && (
                    <td style={{ border: '1px solid #dbe5f1', padding: 6, textAlign: 'center' }}>
                      <button type="button" className="eform-v2-btn outline" onClick={() => removeRow(index)}>
                        Xóa
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isReadOnly && (
          <div className="eform-v2-actions">
            <button className="eform-v2-btn outline" type="button" onClick={addRow}>
              + Thêm tình huống
            </button>
            <button className="eform-v2-btn primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu Mẫu 8'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Form8BeliefTransformations;

import React, { useEffect, useState } from 'react';
import './EformV2.css';

const createEmptyRow = () => ({
  customerName: '',
  customerIssue: '',
  consequence: '',
  solutionOffered: '',
  valueBasedPricing: '',
  result: '',
});

const Form4SalesReport = ({
  initialData = {},
  userRole = 'EMPLOYEE',
  onSubmit,
  isSubmitting = false,
}) => {
  const [rows, setRows] = useState(() =>
    Array.isArray(initialData.salesActivities) && initialData.salesActivities.length > 0
      ? initialData.salesActivities
      : [
          {
            customerName: initialData.customerName || '',
            customerIssue: initialData.problem || initialData.customerIssue || '',
            consequence: initialData.consequence || '',
            solutionOffered: initialData.solution || initialData.solutionOffered || '',
            valueBasedPricing: initialData.value || initialData.valueBasedPricing || '',
            result: initialData.result || '',
          },
        ],
  );

  const status = initialData.status || 'PENDING';
  const isReadOnly = status === 'APPROVED' || userRole === 'MANAGER';

  useEffect(() => {
    if (Array.isArray(initialData.salesActivities) && initialData.salesActivities.length > 0) {
      setRows(initialData.salesActivities);
      return;
    }
    setRows([
      {
        customerName: initialData.customerName || '',
        customerIssue: initialData.problem || initialData.customerIssue || '',
        consequence: initialData.consequence || '',
        solutionOffered: initialData.solution || initialData.solutionOffered || '',
        valueBasedPricing: initialData.value || initialData.valueBasedPricing || '',
        result: initialData.result || '',
      },
    ]);
  }, [initialData]);

  const updateRow = (index, key, value) => {
    setRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [key]: value } : row)),
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const removeRow = (index) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (userRole === 'EMPLOYEE') {
      const normalized = rows.map((row) => ({
        customerName: (row.customerName || '').trim(),
        customerIssue: (row.customerIssue || '').trim(),
        consequence: (row.consequence || '').trim(),
        solutionOffered: (row.solutionOffered || '').trim(),
        valueBasedPricing: (row.valueBasedPricing || '').trim(),
        result: (row.result || '').trim(),
      }));
      const validRows = normalized.filter(
        (row) =>
          row.customerName ||
          row.customerIssue ||
          row.consequence ||
          row.solutionOffered ||
          row.valueBasedPricing ||
          row.result,
      );
      if (validRows.length === 0) {
        return alert('Vui lòng nhập ít nhất 1 dòng báo cáo bán hàng');
      }
      const hasInvalid = validRows.some(
        (row) =>
          !row.customerName ||
          !row.customerIssue ||
          !row.consequence ||
          !row.solutionOffered ||
          !row.valueBasedPricing ||
          !row.result,
      );
      if (hasInvalid) {
        return alert('Vui lòng điền đầy đủ thông tin cho từng dòng đã nhập');
      }
      onSubmit({ salesActivities: validRows });
    }
  };

  return (
    <div className="eform-v2-container">
      <div className="eform-v2-column" style={{ width: '100%' }}>
        <div className="eform-v2-title">
          <span>Mẫu 4: Báo cáo Bán hàng</span>
          {status === 'PENDING' && <span className="eform-v2-badge badge-pending">Chờ duyệt</span>}
          {status === 'APPROVED' && <span className="eform-v2-badge badge-approved">Đạt</span>}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #dbe5f1', padding: 8, textAlign: 'left' }}>Tên khách hàng</th>
                <th style={{ border: '1px solid #dbe5f1', padding: 8, textAlign: 'left' }}>Vấn đề của khách hàng</th>
                <th style={{ border: '1px solid #dbe5f1', padding: 8, textAlign: 'left' }}>Hệ quả nếu không xử lý</th>
                <th style={{ border: '1px solid #dbe5f1', padding: 8, textAlign: 'left' }}>Giải pháp đã tư vấn</th>
                <th style={{ border: '1px solid #dbe5f1', padding: 8, textAlign: 'left' }}>Cách nói giá theo giá trị</th>
                <th style={{ border: '1px solid #dbe5f1', padding: 8, textAlign: 'left' }}>Kết quả</th>
                {!isReadOnly && <th style={{ border: '1px solid #dbe5f1', padding: 8, textAlign: 'center' }}>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`form4-row-${index}`}>
                  <td style={{ border: '1px solid #dbe5f1', padding: 6 }}>
                    <textarea className="eform-v2-input" rows={2} value={row.customerName} onChange={(e) => updateRow(index, 'customerName', e.target.value)} disabled={isReadOnly} />
                  </td>
                  <td style={{ border: '1px solid #dbe5f1', padding: 6 }}>
                    <textarea className="eform-v2-input" rows={2} value={row.customerIssue} onChange={(e) => updateRow(index, 'customerIssue', e.target.value)} disabled={isReadOnly} />
                  </td>
                  <td style={{ border: '1px solid #dbe5f1', padding: 6 }}>
                    <textarea className="eform-v2-input" rows={2} value={row.consequence} onChange={(e) => updateRow(index, 'consequence', e.target.value)} disabled={isReadOnly} />
                  </td>
                  <td style={{ border: '1px solid #dbe5f1', padding: 6 }}>
                    <textarea className="eform-v2-input" rows={2} value={row.solutionOffered} onChange={(e) => updateRow(index, 'solutionOffered', e.target.value)} disabled={isReadOnly} />
                  </td>
                  <td style={{ border: '1px solid #dbe5f1', padding: 6 }}>
                    <textarea className="eform-v2-input" rows={2} value={row.valueBasedPricing} onChange={(e) => updateRow(index, 'valueBasedPricing', e.target.value)} disabled={isReadOnly} />
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
              + Thêm dòng
            </button>
            <button
              className="eform-v2-btn primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu Báo Cáo'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Form4SalesReport;

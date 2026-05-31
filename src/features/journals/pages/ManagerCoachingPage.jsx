import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '../../../store/auth/AuthSlice';
import managerCoachingService from '../../../services/api/managerCoachingService';

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const getCurrentMonthStart = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return start.toISOString().slice(0, 10);
};

const getCurrentDateTimeLocal = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const toDateTimeLocalValue = (value) => {
  if (!value) return getCurrentDateTimeLocal();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 16);
  }
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const createInitialForm = () => ({
  coachedUserId: '',
  coachingTime: getCurrentDateTimeLocal(),
  coachingContent: '',
  contentToImprove: '',
  keepTnc: 1,
  evaluationResult: 1,
});

const createInitialCoachingTemplate = () => ({
  salesPlan: '',
  customerName: '',
  customerAddress: '',
  oldReferral: '',
  customerFollowUp: '',
  noEarlyQuote: '',
  consultStandard: '',
  closedService: '',
  personalRevenue: '',
  nextFollowStep: '',
  nextFollowSchedule: '',
});

const ManagerCoachingPage = () => {
  const { user } = useSelector(selectAuth);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [employees, setEmployees] = useState([]);
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isCoachingTemplateVisible, setIsCoachingTemplateVisible] = useState(false);
  const [formData, setFormData] = useState(createInitialForm());
  const [coachingTemplate, setCoachingTemplate] = useState(createInitialCoachingTemplate());
  const [filters, setFilters] = useState({
    fromDate: getCurrentMonthStart(),
    toDate: getTodayKey(),
    coachedUserId: '',
    keyword: '',
  });

  const selectedEmployee = useMemo(
    () => employees.find((item) => item.id === formData.coachedUserId) || null,
    [employees, formData.coachedUserId],
  );

  const loadEmployees = async () => {
    try {
      const data = await managerCoachingService.getEmployees();
      const employeeList = (Array.isArray(data) ? data : [])
        .sort((a, b) => String(a.fullName || '').localeCompare(String(b.fullName || '')));
      setEmployees(employeeList);
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Không tải được danh sách nhân viên');
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    setErrorText('');
    try {
      const data = await managerCoachingService.getList({
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
        coachedUserId: filters.coachedUserId || undefined,
        keyword: filters.keyword || undefined,
      });
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Không tải được danh sách coaching');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    if (!isFormVisible) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isFormVisible]);

  const resetForm = () => {
    setEditingId('');
    setFormData(createInitialForm());
    setCoachingTemplate(createInitialCoachingTemplate());
    setIsCoachingTemplateVisible(false);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCoachingTemplateChange = (field, value) => {
    setCoachingTemplate((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const applyCoachingTemplateToForm = () => {
    const coachingContent = [
      `Ke hoach ban hang: ${coachingTemplate.salesPlan || '-'}`,
      `Ten KH tiep xuc/tu van: ${coachingTemplate.customerName || '-'}`,
      `Dia chi KH tiep xuc/tu van: ${coachingTemplate.customerAddress || '-'}`,
      `Khach cu gioi thieu: ${coachingTemplate.oldReferral || '-'}`,
      `Khach follow up: ${coachingTemplate.customerFollowUp || '-'}`,
      `Khong bao gia som: ${coachingTemplate.noEarlyQuote || '-'}`,
      `Cuoc tu van du chuan: ${coachingTemplate.consultStandard || '-'}`,
    ].join('\n');

    const contentToImprove = [
      `Chot dich vu: ${coachingTemplate.closedService || '-'}`,
      `Doanh thu ca nhan (ngan dong): ${coachingTemplate.personalRevenue || '-'}`,
      `Khach follow up tiep theo/Buoc tiep theo: ${coachingTemplate.nextFollowStep || '-'}`,
      `Lich hen follow tiep theo: ${coachingTemplate.nextFollowSchedule || '-'}`,
    ].join('\n');

    setFormData((prev) => ({
      ...prev,
      coachingContent,
      contentToImprove,
    }));
    setSuccessText('Da ap dung mau coaching rieng vao noi dung phieu');
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setIsFormVisible(true);
    setFormData({
      coachedUserId: item.coachedUserId || '',
      coachingTime: toDateTimeLocalValue(item.coachingTime),
      coachingContent: item.coachingContent || '',
      contentToImprove: item.contentToImprove || '',
      keepTnc: Number(item.keepTnc) || 0,
      evaluationResult: Number(item.evaluationResult) || 0,
    });
    setErrorText('');
    setSuccessText('');
  };

  const handleSubmit = async () => {
    if (!formData.coachedUserId) {
      setErrorText('Vui lòng chọn người được coaching');
      return;
    }

    setSaving(true);
    setErrorText('');
    setSuccessText('');
    try {
      const payload = {
        coachedUserId: formData.coachedUserId,
        coachingTime: new Date(formData.coachingTime).toISOString(),
        coachingContent: formData.coachingContent,
        contentToImprove: formData.contentToImprove,
        keepTnc: Number(formData.keepTnc),
        evaluationResult: Number(formData.evaluationResult),
      };

      if (editingId) {
        await managerCoachingService.update(editingId, payload);
        setSuccessText('Đã cập nhật phiếu coaching');
      } else {
        await managerCoachingService.create(payload);
        setSuccessText('Đã lưu phiếu coaching');
      }

      resetForm();
      await loadLogs();
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Lưu phiếu coaching thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Xóa phiếu coaching của ${item.coachedUserName}?`)) {
      return;
    }
    setErrorText('');
    setSuccessText('');
    try {
      await managerCoachingService.remove(item.id);
      if (editingId === item.id) {
        resetForm();
      }
      setSuccessText('Đã xóa phiếu coaching');
      await loadLogs();
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Xóa phiếu coaching thất bại');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setErrorText('');
    setSuccessText('');
    try {
      const result = await managerCoachingService.exportExcel({
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
        coachedUserId: filters.coachedUserId || undefined,
        keyword: filters.keyword || undefined,
      });
      const url = window.URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccessText('Đã xuất Excel phiếu coaching');
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Xuất Excel thất bại');
    } finally {
      setExporting(false);
    }
  };

  const closeFormPopup = () => {
    setIsFormVisible(false);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2 style={{ margin: 0, color: '#0074ba' }}>Phiếu coaching nhân viên</h2>
          <div className="page-subtitle">
            Quản lý nhập nội dung coaching, đánh giá giữ chuẩn TNC và kết quả đạt/chưa đạt
          </div>
        </div>
      </div>

      {errorText ? <div className="status-err" style={{ marginBottom: 10 }}>{errorText}</div> : null}
      {successText ? <div className="status-ok" style={{ marginBottom: 10 }}>{successText}</div> : null}

      <div style={{ marginBottom: 12 }}>
        <button
          className="btn outline"
          type="button"
          onClick={() => setIsFormVisible(true)}
        >
          {editingId ? 'Mở form cập nhật' : 'Mở form nhập'}
        </button>
      </div>

      <div className="review-layout" style={{ gridTemplateColumns: '1fr' }}>
        <section className="journey-detail">
          <div className="card" style={{ marginBottom: 12 }}>
            <h3 style={{ marginTop: 0 }}>Bộ lọc danh sách</h3>
            <div className="filters">
              <input
                type="date"
                className="field"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
              />
              <input
                type="date"
                className="field"
                value={filters.toDate}
                onChange={(e) => handleFilterChange('toDate', e.target.value)}
              />
              <select
                className="field"
                value={filters.coachedUserId}
                onChange={(e) => handleFilterChange('coachedUserId', e.target.value)}
              >
                <option value="">-- Tất cả nhân viên --</option>
                {employees.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.fullName}
                  </option>
                ))}
              </select>
              <input
                className="field"
                placeholder="Tìm nội dung hoặc nhân viên"
                value={filters.keyword}
                onChange={(e) => handleFilterChange('keyword', e.target.value)}
              />
              <button className="btn outline" type="button" onClick={loadLogs}>
                Lọc
              </button>
              <button className="btn" type="button" onClick={handleExport} disabled={exporting}>
                {exporting ? 'Đang xuất...' : 'Xuất Excel'}
              </button>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Danh sách phiếu coaching</h3>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Người được coaching</th>
                    <th>Mã NV</th>
                    <th>Nội dung coach</th>
                    <th>Sửa nội dung gì</th>
                    <th>Giữ chuẩn TNC</th>
                    <th>Đánh giá</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} style={editingId === item.id ? { background: '#eff6ff' } : undefined}>
                      <td>{String(item.coachingTime || '').replace('T', ' ').slice(0, 16)}</td>
                      <td>
                        <div>{item.coachedUserName || '-'}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          {item.coachedUsername || '-'}
                          {item.coachedUnitName ? ` - ${item.coachedUnitName}` : ''}
                        </div>
                      </td>
                      <td>{item.coachedEmployeeCode || '-'}</td>
                      <td>{item.coachingContent || '-'}</td>
                      <td>{item.contentToImprove || '-'}</td>
                      <td>{item.keepTncLabel}</td>
                      <td>{item.evaluationResultLabel}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button className="btn outline" type="button" onClick={() => handleEdit(item)}>
                            Sửa
                          </button>
                          <button className="btn outline" type="button" onClick={() => handleDelete(item)}>
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && items.length === 0 ? (
                    <tr>
                      <td colSpan={8}>Không có dữ liệu coaching</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            {loading ? <div style={{ marginTop: 10 }}>Đang tải dữ liệu...</div> : null}
          </div>
        </section>
      </div>

      {isFormVisible ? (
        <div className="coaching-modal-backdrop" onClick={closeFormPopup}>
          <div
            className="coaching-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Form nhập phiếu coaching"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="coaching-modal-head">
              <h3 style={{ margin: 0 }}>{editingId ? 'Cập nhật phiếu coaching' : 'Tạo phiếu coaching'}</h3>
              <button className="btn outline" type="button" onClick={closeFormPopup}>Đóng</button>
            </div>

            <div className="coaching-form-grid">
              <input className="field" value={user?.fullName || ''} disabled />
              <select
                className="field"
                value={formData.coachedUserId}
                onChange={(e) => handleInputChange('coachedUserId', e.target.value)}
              >
                <option value="">-- Chọn người được coaching --</option>
                {employees.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.fullName} ({item.username}) {item.employeeCode ? `- ${item.employeeCode}` : ''}
                    {item.unitName ? ` - ${item.unitName}` : ''}
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                className="field"
                value={formData.coachingTime}
                onChange={(e) => handleInputChange('coachingTime', e.target.value)}
              />
              <div className="coaching-template-toggle">
                <button
                  className="btn outline"
                  type="button"
                  onClick={() => setIsCoachingTemplateVisible((prev) => !prev)}
                >
                  {isCoachingTemplateVisible ? 'An mau coaching rieng' : 'Mo mau coaching rieng'}
                </button>
                {isCoachingTemplateVisible ? (
                  <button className="btn" type="button" onClick={applyCoachingTemplateToForm}>
                    Ap dung vao phieu
                  </button>
                ) : null}
              </div>

              {isCoachingTemplateVisible ? (
                <div className="coaching-template-box">
                  <div className="coaching-template-grid">
                    <textarea className="field" rows={2} placeholder="Ke hoach ban hang" value={coachingTemplate.salesPlan} onChange={(e) => handleCoachingTemplateChange('salesPlan', e.target.value)} />
                    <textarea className="field" rows={2} placeholder="Ten khach hang tiep xuc/tu van" value={coachingTemplate.customerName} onChange={(e) => handleCoachingTemplateChange('customerName', e.target.value)} />
                    <textarea className="field" rows={2} placeholder="Dia chi khach hang tiep xuc/tu van" value={coachingTemplate.customerAddress} onChange={(e) => handleCoachingTemplateChange('customerAddress', e.target.value)} />
                    <textarea className="field" rows={2} placeholder="Khach cu gioi thieu" value={coachingTemplate.oldReferral} onChange={(e) => handleCoachingTemplateChange('oldReferral', e.target.value)} />
                    <textarea className="field" rows={2} placeholder="Khach follow up" value={coachingTemplate.customerFollowUp} onChange={(e) => handleCoachingTemplateChange('customerFollowUp', e.target.value)} />
                    <textarea className="field" rows={2} placeholder="Khong bao gia som" value={coachingTemplate.noEarlyQuote} onChange={(e) => handleCoachingTemplateChange('noEarlyQuote', e.target.value)} />
                    <textarea className="field" rows={2} placeholder="Cuoc tu van du chuan" value={coachingTemplate.consultStandard} onChange={(e) => handleCoachingTemplateChange('consultStandard', e.target.value)} />
                    <textarea className="field" rows={2} placeholder="Chot dich vu" value={coachingTemplate.closedService} onChange={(e) => handleCoachingTemplateChange('closedService', e.target.value)} />
                    <textarea className="field" rows={2} placeholder="Doanh thu ca nhan (ngan dong)" value={coachingTemplate.personalRevenue} onChange={(e) => handleCoachingTemplateChange('personalRevenue', e.target.value)} />
                    <textarea className="field" rows={2} placeholder="Khach follow up tiep theo/Buoc tiep theo" value={coachingTemplate.nextFollowStep} onChange={(e) => handleCoachingTemplateChange('nextFollowStep', e.target.value)} />
                    <textarea className="field" rows={2} placeholder="Lich hen follow tiep theo" value={coachingTemplate.nextFollowSchedule} onChange={(e) => handleCoachingTemplateChange('nextFollowSchedule', e.target.value)} />
                  </div>
                </div>
              ) : null}
              <textarea
                className="field coaching-field-span-2"
                rows={4}
                placeholder="Nội dung coach"
                value={formData.coachingContent}
                onChange={(e) => handleInputChange('coachingContent', e.target.value)}
              />
              <textarea
                className="field coaching-field-span-2"
                rows={4}
                placeholder="Sửa nội dung gì"
                value={formData.contentToImprove}
                onChange={(e) => handleInputChange('contentToImprove', e.target.value)}
              />

              <div className="card coaching-option-card" style={{ padding: 12, margin: 0 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Giữ chuẩn TNC</div>
                <label style={{ display: 'block', marginBottom: 6 }}>
                  <input
                    type="radio"
                    name="keepTnc"
                    checked={Number(formData.keepTnc) === 1}
                    onChange={() => handleInputChange('keepTnc', 1)}
                  />{' '}
                  Có giữ chuẩn
                </label>
                <label style={{ display: 'block' }}>
                  <input
                    type="radio"
                    name="keepTnc"
                    checked={Number(formData.keepTnc) === 0}
                    onChange={() => handleInputChange('keepTnc', 0)}
                  />{' '}
                  Chưa giữ chuẩn
                </label>
              </div>

              <div className="card coaching-option-card" style={{ padding: 12, margin: 0 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Đánh giá người được coaching</div>
                <label style={{ display: 'block', marginBottom: 6 }}>
                  <input
                    type="radio"
                    name="evaluationResult"
                    checked={Number(formData.evaluationResult) === 1}
                    onChange={() => handleInputChange('evaluationResult', 1)}
                  />{' '}
                  Đạt
                </label>
                <label style={{ display: 'block' }}>
                  <input
                    type="radio"
                    name="evaluationResult"
                    checked={Number(formData.evaluationResult) === 0}
                    onChange={() => handleInputChange('evaluationResult', 0)}
                  />{' '}
                  Chưa đạt
                </label>
              </div>

              <div className="coaching-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn" type="button" onClick={handleSubmit} disabled={saving}>
                  {saving ? 'Đang lưu...' : editingId ? 'Cập nhật phiếu' : 'Lưu phiếu'}
                </button>
                <button className="btn outline" type="button" onClick={resetForm}>
                  {editingId ? 'Hủy sửa' : 'Làm mới'}
                </button>
                <button className="btn outline" type="button" onClick={closeFormPopup}>Đóng</button>
              </div>
              {selectedEmployee ? (
                <div style={{ color: '#64748b', fontSize: 13 }}>
                  Đang coaching: <strong>{selectedEmployee.fullName}</strong>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ManagerCoachingPage;

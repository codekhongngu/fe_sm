import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuth } from '../../../store/auth/AuthSlice';
import axiosInstance from '../../../utils/http/axiosInstance';
import journalService from '../../../services/api/journalService';
import userService from '../../../services/api/userService';

const ManagerWeeklyReviewPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector(selectAuth);
  const isViewerOnly = user?.role === 'PROVINCIAL_VIEWER';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingStatus, setExportingStatus] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [statusText, setStatusText] = useState('');
  const [weeklyConfigs, setWeeklyConfigs] = useState([]);
  const [selectedWeekId, setSelectedWeekId] = useState('');
  const [pendingLogs, setPendingLogs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [units, setUnits] = useState([]);
  const [unitId, setUnitId] = useState('');

  const loadWeeks = async () => {
    try {
      const data = await journalService.getWeeklyConfigs();
      const list = Array.isArray(data) ? data : [];
      setWeeklyConfigs(list);
      if (list.length > 0) {
        setSelectedWeekId(list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadUnits = async () => {
    if (isViewerOnly || user?.role === 'ADMIN') {
      try {
        const data = await userService.getUnits();
        setUnits(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    loadWeeks();
    loadUnits();
  }, []);

  const loadData = async (keepSelectedId = null) => {
    if (!selectedWeekId) return;
    setLoading(true);
    setErrorText('');
    try {
      const { data } = await axiosInstance.get('/api/manager/weekly-journals', {
        params: { 
          weekId: selectedWeekId, 
          status: filterStatus === 'ALL' ? undefined : filterStatus,
          unitId: unitId || undefined
        }
      });
      const list = Array.isArray(data) ? data : [];
      setPendingLogs(list);
      if (keepSelectedId) {
        const found = list.find((item) => item.id === keepSelectedId);
        setSelected(found || null);
      } else {
        setSelected(null);
      }
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Lỗi tải danh sách');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWeekId, filterStatus, unitId]);

  const patchReview = async (status, managerComment) => {
    if (!selected) return;
    setSaving(true);
    setErrorText('');
    setStatusText('');
    try {
      await axiosInstance.patch('/api/manager/weekly-journals/review', {
        userId: selected.user.id,
        weekId: selected.week.id,
        status,
        managerComment,
      });
      setStatusText('Đã cập nhật trạng thái nhật ký tuần');
      await loadData(selected.id);
    } catch (e) {
      setErrorText(e?.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  };

  const normalizeText = (value) =>
    (value || '')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

  const formatDisplayText = (value, fallback = '-') => normalizeText(value) || fallback;

  const exportWeeklyReview = async () => {
    if (!selectedWeekId) {
      setErrorText('Vui lòng chọn tuần để xuất báo cáo');
      return;
    }
    setExporting(true);
    setErrorText('');
    setStatusText('');
    try {
      const result = await journalService.exportManagerWeeklyJournals({
        weekId: selectedWeekId,
        status: filterStatus === 'ALL' ? undefined : filterStatus,
        unitId: unitId || undefined,
      });
      const url = window.URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setStatusText('Đã xuất báo cáo Excel nhật ký tuần');
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Xuất Excel thất bại');
    } finally {
      setExporting(false);
    }
  };

  const exportWeeklyStatus1011 = async () => {
    if (!selectedWeekId) {
      setErrorText('Vui lòng chọn tuần để xuất báo cáo');
      return;
    }
    setExportingStatus(true);
    setErrorText('');
    setStatusText('');
    try {
      const result = await journalService.exportManagerWeeklyJournalsStatus({
        weekId: selectedWeekId,
        unitId: unitId || undefined,
      });
      const url = window.URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setStatusText('Đã xuất Excel trạng thái Mẫu 10/11');
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Xuất Excel trạng thái thất bại');
    } finally {
      setExportingStatus(false);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2 style={{ margin: 0, color: '#0074ba' }}>{isViewerOnly ? 'Thống kê Mẫu 10, Mẫu 11' : 'Duyệt nhật ký tuần'}</h2>
          <div className="page-subtitle">{isViewerOnly ? 'Xem chi tiết nhật ký tuần của nhân viên toàn tỉnh' : 'Đánh giá chi tiết nhật ký tuần của nhân viên'}</div>
        </div>
      </div>

      <div className="review-layout">
        <aside>
          <div className="card" style={{ marginBottom: 12 }}>
            <h3 style={{ marginTop: 0 }}>Bộ lọc</h3>
            <div className="filters">
              {(isViewerOnly || user?.role === 'ADMIN') && (
                <select
                  className="field"
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                >
                  <option value="">-- Tất cả đơn vị --</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              )}
              <select
                className="field"
                value={selectedWeekId}
                onChange={(e) => setSelectedWeekId(e.target.value)}
              >
                <option value="">-- Chọn tuần --</option>
                {weeklyConfigs.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.weekName} ({w.startDate} - {w.endDate})
                  </option>
                ))}
              </select>
              <select
                className="field"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="PENDING">Chờ duyệt</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="REJECTED">Bị trả lại</option>
                <option value="ALL">Tất cả</option>
              </select>
              <button className="btn" type="button" onClick={exportWeeklyReview} disabled={exporting}>
                {exporting ? 'Đang xuất...' : 'Xuất Excel'}
              </button>
              {(isViewerOnly || user?.role === 'ADMIN') ? (
                <button className="btn outline" type="button" onClick={exportWeeklyStatus1011} disabled={exportingStatus}>
                  {exportingStatus ? 'Đang xuất...' : 'Xuất trạng thái Mẫu 10/11'}
                </button>
              ) : null}
            </div>
          </div>

          <div className="review-side-list">
            {pendingLogs.map((log) => (
              <button
                key={log.id}
                type="button"
                className={`journey-card ${selected?.id === log.id ? 'active' : ''}`}
                onClick={() => setSelected(log)}
                style={{ textAlign: 'left', display: 'block', width: '100%' }}
              >
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{log.user.fullName}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  {log.user.username} {isViewerOnly && log.user.unit?.name ? ` - ${log.user.unit.name}` : ''}
                </div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  <span className={`review-chip ${log.status === 'APPROVED' ? 'ok' : log.status === 'REJECTED' ? 'err' : ''}`}>
                    {log.status === 'APPROVED' ? 'Đã duyệt' : log.status === 'REJECTED' ? 'Bị trả lại' : 'Chờ duyệt'}
                  </span>
                </div>
              </button>
            ))}
            {!loading && pendingLogs.length === 0 ? (
              <div className="coach-bubble">Không có nhật ký phù hợp bộ lọc.</div>
            ) : null}
          </div>
        </aside>

        <section className="journey-detail">
          {statusText ? <div className="status-ok" style={{ marginBottom: 8 }}>{statusText}</div> : null}
          {errorText ? <div className="status-err" style={{ marginBottom: 8 }}>{errorText}</div> : null}
          
          {selected ? (
            <>
              <div className="review-info-card">
                <div className="review-info-head">
                  <h3 style={{ margin: 0 }}>Thông tin nhân viên</h3>
                  <span className="review-chip">{selected.status === 'APPROVED' ? 'Đã duyệt' : selected.status === 'REJECTED' ? 'Bị trả lại' : 'Đang xử lý'}</span>
                </div>
                <div className="review-info-grid">
                  <div>
                    <div className="review-label">Tên nhân viên</div>
                    <div className="review-value">{selected.user.fullName || '-'}</div>
                  </div>
                  <div>
                    <div className="review-label">Tuần đánh giá</div>
                    <div className="review-value">{selected.week.weekName || '-'}</div>
                  </div>
                  <div>
                    <div className="review-label">Tài khoản</div>
                    <div className="review-value">{selected.user.username || '-'}</div>
                  </div>
                  {isViewerOnly && (
                    <div>
                      <div className="review-label">Đơn vị</div>
                      <div className="review-value">{selected.user.unit?.name || '-'}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="journey-compare">
                <div className="journey-column">
                  {selected.forms.map(form => {
                    if (form.formType === 'FORM_10') {
                      const entry = form.entries[0] || {};
                      return (
                        <div key={form.id} style={{ marginBottom: 20 }}>
                          <h4>Mẫu 10: Đánh giá hành động hiệu quả cao</h4>
                          <ul style={{ paddingLeft: 18, marginTop: 8, fontSize: 13, color: '#1e293b' }}>
                            <li>Hành động thu nhập cao: {formatDisplayText(entry.highIncomeAction)}</li>
                            <li>Kết quả: {formatDisplayText(entry.result)}</li>
                            <li>Cảm xúc: {formatDisplayText(entry.feeling)}</li>
                          </ul>
                        </div>
                      );
                    }
                    if (form.formType === 'FORM_11') {
                      const entry = form.entries[0] || {};
                      return (
                        <div key={form.id} style={{ marginBottom: 20 }}>
                          <h4>Mẫu 11: Nhật ký tuần</h4>
                          <ul style={{ paddingLeft: 18, marginTop: 8, fontSize: 13, color: '#1e293b' }}>
                            <li>Lĩnh vực tạo giá trị tốt nhất: {formatDisplayText(entry.bestValueArea)}</li>
                            <li>Hành vi gia tăng thu nhập cần làm: {formatDisplayText(entry.incomeIncreaseBehavior)}</li>
                            <li>Dấu hiệu tụt chuẩn cần bỏ: {formatDisplayText(entry.backslideSign)}</li>
                            <li>Kế hoạch tuần tới: {formatDisplayText(entry.nextWeekPlan)}</li>
                          </ul>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>

                <div className="journey-column">
                  <h4>Quản lý đánh giá</h4>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Nhận xét của quản lý</label>
                    <textarea
                      className="field"
                      rows={4}
                      placeholder={isViewerOnly ? "Không có nhận xét" : "Nhập nhận xét..."}
                      defaultValue={selected.managerComment || ''}
                      id="managerComment"
                      disabled={isViewerOnly}
                    />
                  </div>
                  
                  {!isViewerOnly && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                      <button
                        className="btn"
                        disabled={saving}
                        onClick={() => patchReview('APPROVED', document.getElementById('managerComment').value)}
                        style={{ background: '#16a34a', borderColor: '#16a34a' }}
                      >
                        {saving ? 'Đang xử lý...' : 'Duyệt'}
                      </button>
                      <button
                        className="btn outline"
                        disabled={saving}
                        onClick={() => patchReview(selected.status, document.getElementById('managerComment').value)}
                      >
                        Lưu
                      </button>
                      <button
                        className="btn"
                        disabled={saving}
                        onClick={() => patchReview('REJECTED', document.getElementById('managerComment').value)}
                        style={{ background: '#dc2626', borderColor: '#dc2626' }}
                      >
                        Trả lại
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="card">
              <div className="coach-bubble">Chọn một nhân viên bên trái để xem chi tiết nhật ký tuần.</div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ManagerWeeklyReviewPage;

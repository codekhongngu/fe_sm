import { useState, useEffect } from 'react';
import journalService from '../../../services/api/journalService';
import userService from '../../../services/api/userService';

const today = new Date().toISOString().slice(0, 10);

const CoachingProvincialReportPage = () => {
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [unitId, setUnitId] = useState('');
  const [units, setUnits] = useState([]);
  const [rows, setRows] = useState([]);
  const [cutoffHour, setCutoffHour] = useState(7);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    userService.getUnits().then((data) => setUnits(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const loadData = async () => {
    setLoading(true);
    setErrorText('');
    setStatusText('');
    try {
      const result = await journalService.getCoachingProvincialData({
        fromDate,
        toDate: toDate || fromDate,
        unitId: unitId || undefined,
      });
      setRows(Array.isArray(result?.rows) ? result.rows : []);
      setCutoffHour(Number(result?.cutoffHour ?? 7));
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    setExporting(true);
    setErrorText('');
    setStatusText('');
    try {
      const result = await journalService.exportCoachingProvincial({
        fromDate,
        toDate: toDate || fromDate,
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
      setStatusText('Đã xuất báo cáo coaching toàn tỉnh');
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Xuất báo cáo thất bại');
    } finally {
      setExporting(false);
    }
  };

  // Group rows by employee + date for subtotals
  const groupedRows = (() => {
    const result = [];
    let lastKey = '';
    let group = [];
    rows.forEach((row) => {
      const key = `${row.employeeCode}_${row.logDate}`;
      if (key !== lastKey && group.length > 0) {
        result.push({ type: 'data', items: group });
        result.push({ type: 'subtotal', items: group });
        group = [];
      }
      lastKey = key;
      group.push(row);
    });
    if (group.length > 0) {
      result.push({ type: 'data', items: group });
      result.push({ type: 'subtotal', items: group });
    }
    return result;
  })();

  const sumField = (items, field) => items.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);
  const toDateOnly = (value) => {
    if (!value) return '';

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      const y = value.getFullYear();
      const m = String(value.getMonth() + 1).padStart(2, '0');
      const d = String(value.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    const raw = String(value).trim();
    const isoMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) return isoMatch[1];

    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    return raw;
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2 style={{ margin: 0 }}>Báo cáo Coaching toàn tỉnh</h2>
          <div className="page-subtitle">
            Thống kê hoạt động coaching theo nhân viên • Mốc cắt ngày: {String(Number(cutoffHour || 7)).padStart(2, '0')}:00
          </div>
        </div>
      </div>

      {errorText && <div className="status-err" style={{ marginBottom: 10 }}>{errorText}</div>}
      {statusText && <div className="status-ok" style={{ marginBottom: 10 }}>{statusText}</div>}

      <section className="card" style={{ marginBottom: 12 }}>
        <h3 style={{ marginTop: 0 }}>Bộ lọc</h3>
        <div className="filters">
          <label>
            Từ ngày
            <input type="date" className="field" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </label>
          <label>
            Đến ngày
            <input type="date" className="field" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </label>
          <label>
            Đơn vị
            <select className="field" value={unitId} onChange={(e) => setUnitId(e.target.value)}>
              <option value="">Tất cả đơn vị</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </label>
          <button className="btn outline" onClick={loadData} disabled={loading}>
            {loading ? 'Đang tải...' : 'Xem báo cáo'}
          </button>
          <button className="btn" onClick={exportExcel} disabled={exporting}>
            {exporting ? 'Đang xuất...' : 'Xuất Excel'}
          </button>
        </div>
      </section>

      <section className="card">
        <div className="table-wrap">
          <table className="table" style={{ fontSize: 13 }}>
            <thead>
              <tr>
                <th>TT</th>
                <th>Ngày báo cáo</th>
                <th>Đơn vị</th>
                <th>Mã NV</th>
                <th>Họ và tên NV</th>
                <th title="Có danh sách KH, phân loại KH, chuẩn bị câu hỏi... (Có=1, không=0)">Kế hoạch bán hàng</th>
                <th>Tên KH tiếp xúc/tư vấn</th>
                <th>Địa chỉ KH</th>
                <th title="Được KH cũ giới thiệu=1, không=0">Khách cũ giới thiệu</th>
                <th title="Tư vấn lại KH tiềm năng đã tư vấn chưa thành công (Đúng=1, sai=0)">Khách follow up</th>
                <th title="Đúng=1, sai=0">Không báo giá sớm</th>
                <th title="Cuộc tư vấn đủ chuẩn (Đúng=1, sai=0)">Tư vấn đủ chuẩn</th>
                <th title="Lắp đặt/hòa mạng=1, chưa=0">Chốt dịch vụ</th>
                <th>Doanh thu (Ngàn đồng)</th>
                <th title="Có follow=1, không=0">Follow tiếp theo</th>
                <th>Lịch hẹn follow</th>
              </tr>
              <tr>
                {[(1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15),(16)].map((n) => (
                  <th key={n} style={{ textAlign: 'center', color: '#64748b', fontSize: 12, padding: '4px 6px' }}>{n}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupedRows.length === 0 && !loading && (
                <tr><td colSpan={16} style={{ textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu. Nhấn "Xem báo cáo" để tải.</td></tr>
              )}
              {groupedRows.map((group, gi) => {
                if (group.type === 'data') {
                  return group.items.map((row, ri) => (
                    <tr key={`d-${gi}-${ri}`}>
                      <td>{row.stt}</td>
                      <td>{toDateOnly(row.logDate)}</td>
                      <td>{row.unitName}</td>
                      <td>{row.employeeCode}</td>
                      <td>{row.fullName}</td>
                      <td style={{ textAlign: 'center' }}>{row.salesPlan}</td>
                      <td>{row.customerName}</td>
                      <td>{row.customerAddress}</td>
                      <td style={{ textAlign: 'center' }}>{row.oldReferral}</td>
                      <td style={{ textAlign: 'center' }}>{row.customerFollowUp}</td>
                      <td style={{ textAlign: 'center' }}>{row.noEarlyQuote}</td>
                      <td style={{ textAlign: 'center' }}>{row.consultStandard}</td>
                      <td style={{ textAlign: 'center' }}>{row.closedService}</td>
                      <td style={{ textAlign: 'right' }}>{row.personalRevenue || 0}</td>
                      <td style={{ textAlign: 'center' }}>{row.nextFollowRequired}</td>
                      <td>{toDateOnly(row.nextFollowSchedule)}</td>
                    </tr>
                  ));
                }
                // subtotal row
                const items = group.items;
                return (
                  <tr key={`s-${gi}`} style={{ background: '#f1f5f9', fontWeight: 600 }}>
                    <td colSpan={5}>Tổng của {items[0]?.fullName} ngày {toDateOnly(items[0]?.logDate)}</td>
                    <td style={{ textAlign: 'center' }}>{sumField(items, 'salesPlan')}</td>
                    <td style={{ textAlign: 'center' }}>{items.filter((item) => String(item.customerName || '').trim() !== '').length}</td>
                    <td></td>
                    <td style={{ textAlign: 'center' }}>{sumField(items, 'oldReferral')}</td>
                    <td style={{ textAlign: 'center' }}>{sumField(items, 'customerFollowUp')}</td>
                    <td style={{ textAlign: 'center' }}>{sumField(items, 'noEarlyQuote')}</td>
                    <td style={{ textAlign: 'center' }}>{sumField(items, 'consultStandard')}</td>
                    <td style={{ textAlign: 'center' }}>{sumField(items, 'closedService')}</td>
                    <td style={{ textAlign: 'right' }}>{sumField(items, 'personalRevenue')}</td>
                    <td style={{ textAlign: 'center' }}>{sumField(items, 'nextFollowRequired')}</td>
                    <td></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default CoachingProvincialReportPage;

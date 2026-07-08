import { useEffect, useState } from 'react';
import journalService from '../../../services/api/journalService';
import userService from '../../../services/api/userService';

const today = new Date().toISOString().slice(0, 10);

const CoachingProvincialReportGd2Page = () => {
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
      const result = await journalService.getCoachingProvincialGd2Data({
        fromDate,
        toDate: toDate || fromDate,
        unitId: unitId || undefined,
      });
      setRows(Array.isArray(result?.rows) ? result.rows : []);
      setCutoffHour(Number(result?.cutoffHour ?? 7));
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Không tải được dữ liệu báo cáo GD2');
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    setExporting(true);
    setErrorText('');
    setStatusText('');
    try {
      const result = await journalService.exportCoachingProvincialGd2({
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
      setStatusText('Đã xuất báo cáo coaching GD2');
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Xuất báo cáo GD2 thất bại');
    } finally {
      setExporting(false);
    }
  };

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

  return (
    <div>
      <div className="page-head">
        <div>
          <h2 style={{ margin: 0 }}>Báo cáo Coaching GD2</h2>
          <div className="page-subtitle">
            Báo cáo chi tiết theo mẫu giai đoạn 2 • Mốc cắt ngày: {String(Number(cutoffHour || 7)).padStart(2, '0')}:00
          </div>
        </div>
      </div>

      {errorText ? <div className="status-err" style={{ marginBottom: 10 }}>{errorText}</div> : null}
      {statusText ? <div className="status-ok" style={{ marginBottom: 10 }}>{statusText}</div> : null}

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
          <table className="table" style={{ minWidth: 1900, fontSize: 13 }}>
            <thead>
              <tr>
                <th>TT</th>
                <th>Ngày báo cáo</th>
                <th>Mã nhân viên</th>
                <th>Họ và tên NV</th>
                <th>Kế hoạch bán hàng</th>
                <th>Tên khách hàng tiếp xúc/tư vấn</th>
                <th>Địa chỉ khách hàng tiếp xúc/tư vấn</th>
                <th>Khách cũ giới thiệu</th>
                <th>Khách follow up</th>
                <th>Không báo giá sớm</th>
                <th>Số cuộc tư vấn có đủ 3 lớp</th>
                <th>Số cuộc tư vấn có gắn giải pháp với nhu cầu</th>
                <th>Số cuộc tư vấn có nói rõ lợi ích</th>
                <th>Số cuộc tư vấn có nhắc thiệt hại tránh được</th>
                <th>Chốt dịch vụ</th>
                <th>Doanh thu cá nhân (Ngàn đồng)</th>
                <th>Khách follow tiếp theo/ Bước tiếp theo</th>
                <th>Lịch hẹn follow tiếp theo</th>
              </tr>
              <tr style={{ color: '#334155' }}>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th>có danh sách KH, phân loại KH, chuẩn bị câu hỏi... (Có=1, không=0)</th>
                <th></th>
                <th>Tên đường, phường (xã), số nhà/tel...</th>
                <th>(Được KH cũ giới thiệu=1, không được giới thiệu=0)</th>
                <th>Tư vấn lại KH tiềm năng đã được tư vấn chưa thành công (Đúng=1, sai=0)</th>
                <th>(Đúng=1, sai=0)</th>
                <th>(Đúng=1, sai=0)</th>
                <th>(Đúng=1, sai=0)</th>
                <th>(Đúng=1, sai=0)</th>
                <th>(Đúng=1, sai=0)</th>
                <th>(lắp đặt/hòa mạng=1, chưa lắp đặt/HM=0)</th>
                <th></th>
                <th>(có follow=1, không cần follow=0)</th>
                <th>Lần follow ...(2): dd/mm/yyyy: Gọi lại/Tư vấn trực tiếp/nhờ giới thiệu/...</th>
              </tr>
              <tr>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((n) => (
                  <th key={n} style={{ textAlign: 'center', color: '#64748b', fontSize: 12, padding: '6px 8px' }}>
                    {n}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupedRows.length === 0 && !loading ? (
                <tr><td colSpan={18} style={{ textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu. Nhấn "Xem báo cáo" để tải.</td></tr>
              ) : null}
              {groupedRows.map((group, gi) => {
                if (group.type === 'data') {
                  return group.items.map((row, ri) => (
                    <tr key={`gd2-d-${gi}-${ri}`}>
                      <td>{row.stt}</td>
                      <td>{row.logDate}</td>
                      <td>{row.employeeCode}</td>
                      <td>{row.fullName}</td>
                      <td style={{ textAlign: 'center' }}>{row.salesPlan}</td>
                      <td>{row.customerName}</td>
                      <td>{row.customerAddress}</td>
                      <td style={{ textAlign: 'center' }}>{row.oldReferral}</td>
                      <td style={{ textAlign: 'center' }}>{row.customerFollowUp}</td>
                      <td style={{ textAlign: 'center' }}>{row.noEarlyQuote}</td>
                      <td style={{ textAlign: 'center' }}>{row.consultEnoughLayers}</td>
                      <td style={{ textAlign: 'center' }}>{row.consultSolutionMatchingNeed}</td>
                      <td style={{ textAlign: 'center' }}>{row.consultClearBenefit}</td>
                      <td style={{ textAlign: 'center' }}>{row.consultMentionLossAvoidance}</td>
                      <td style={{ textAlign: 'center' }}>{row.closedService}</td>
                      <td style={{ textAlign: 'right' }}>{row.personalRevenue || 0}</td>
                      <td style={{ textAlign: 'center' }}>{row.nextFollowRequired}</td>
                      <td>{row.nextFollowSchedule}</td>
                    </tr>
                  ));
                }

                const items = group.items;
                return (
                  <tr key={`gd2-s-${gi}`} style={{ background: '#f1f5f9', fontWeight: 600 }}>
                    <td colSpan={4}>Tổng của {items[0]?.fullName} ngày {items[0]?.logDate}</td>
                    <td style={{ textAlign: 'center' }}>{sumField(items, 'salesPlan')}</td>
                    <td style={{ textAlign: 'center' }}>{items.filter((item) => String(item.customerName || '').trim() !== '').length}</td>
                    <td></td>
                    <td style={{ textAlign: 'center' }}>{sumField(items, 'oldReferral')}</td>
                    <td style={{ textAlign: 'center' }}>{sumField(items, 'customerFollowUp')}</td>
                    <td style={{ textAlign: 'center' }}>{sumField(items, 'noEarlyQuote')}</td>
                    <td style={{ textAlign: 'center' }}>{sumField(items, 'consultEnoughLayers')}</td>
                    <td style={{ textAlign: 'center' }}>{sumField(items, 'consultSolutionMatchingNeed')}</td>
                    <td style={{ textAlign: 'center' }}>{sumField(items, 'consultClearBenefit')}</td>
                    <td style={{ textAlign: 'center' }}>{sumField(items, 'consultMentionLossAvoidance')}</td>
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

export default CoachingProvincialReportGd2Page;

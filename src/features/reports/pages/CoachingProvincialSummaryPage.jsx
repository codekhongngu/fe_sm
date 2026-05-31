import { useEffect, useState } from 'react';
import journalService from '../../../services/api/journalService';
import userService from '../../../services/api/userService';

const today = new Date().toISOString().slice(0, 10);

const CoachingProvincialSummaryPage = () => {
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [unitId, setUnitId] = useState('');
  const [units, setUnits] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [statusText, setStatusText] = useState('');
  const cutoffHour = Number(data?.filters?.cutoffHour ?? 7);

  useEffect(() => {
    userService.getUnits().then((u) => setUnits(Array.isArray(u) ? u : [])).catch(() => {});
  }, []);

  const loadData = async () => {
    setLoading(true);
    setErrorText('');
    setStatusText('');
    try {
      const result = await journalService.getCoachingProvincialSummary({
        fromDate,
        toDate: toDate || fromDate,
        unitId: unitId || undefined,
      });
      setData(result || null);
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Không tải được báo cáo tổng hợp');
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    setExporting(true);
    setErrorText('');
    setStatusText('');
    try {
      const result = await journalService.exportCoachingProvincialSummary({
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
      setStatusText('Đã xuất báo cáo tổng hợp coaching');
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Xuất báo cáo tổng hợp thất bại');
    } finally {
      setExporting(false);
    }
  };

  const percent = (v) => `${(Number(v || 0) * 100).toFixed(2)}%`;

  return (
    <div>
      <div className="page-head">
        <div>
          <h2 style={{ margin: 0 }}>Báo cáo tổng hợp Coaching</h2>
          <div className="page-subtitle">
            Tổng hợp chỉ số theo cấu trúc (17) - (28) • Mốc cắt ngày: {String(cutoffHour).padStart(2, '0')}:00
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
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>{unit.name}</option>
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
          <table className="table" style={{ minWidth: 1300 }}>
            <thead>
              <tr>
                <th>STT</th>
                <th>Ngày thực hiện</th>
                <th>Đơn vị</th>
                <th>Mã nhân viên</th>
                <th>Tên nhân viên</th>
                <th>Tổng số khách hàng ngày đó</th>
                <th>Tỷ lệ chốt dịch vụ</th>
                <th>Tỷ lệ khách cũ giới thiệu</th>
                <th>Tỷ lệ cuộc không báo giá sớm</th>
                <th>Tỷ lệ nhân viên trả lời chuyển hướng đúng</th>
                <th>Số lần tư vấn có hỏi nhu cầu trước khi nói giá</th>
                <th>Tỷ lệ cuộc tư vấn đủ chuẩn</th>
                <th>Số khách hàng tiềm năng có lịch follow-up</th>
                <th>Số khách hàng được theo đuổi mỗi ngày</th>
                <th>Số khách hàng bị treo không có bước tiếp theo</th>
                <th>Tỷ lệ khách hàng đồng ý dịch vụ sau follow-up</th>
                <th>Tỷ lệ khách hàng tiềm năng có lịch follow-up</th>
                <th>Tỷ lệ theo đuổi đúng hẹn</th>
              </tr>
            </thead>
            <tbody>
              {!data && !loading ? (
                <tr>
                  <td colSpan={18} style={{ textAlign: 'center', color: '#94a3b8' }}>
                    Chưa có dữ liệu. Nhấn "Xem báo cáo" để tải.
                  </td>
                </tr>
              ) : null}
              {Array.isArray(data?.rows) && data.rows.length > 0 ? (
                <tr style={{ color: '#334155' }}>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td>(17) = tổng(13) / tổng(7)</td>
                  <td>(18) = tổng(9) / tổng(7)</td>
                  <td>(19) = tổng(11) / tổng(7)</td>
                  <td>(20) = tổng(11)</td>
                  <td>(21) = tổng(12)</td>
                  <td>(22) = tổng(12) / tổng(7)</td>
                  <td>(23) = (tổng(15)=1) + (tổng(13)=0)</td>
                  <td>(24) = tổng(10)</td>
                  <td>(25) = ((tổng(7)=1) + (tổng(13)=0)) - (23)</td>
                  <td>(26) = ((tổng(10)=1) + (tổng(13)=1)) / tổng(10)</td>
                  <td>(27) = tổng(23) / số dòng (13)=0</td>
                  <td>(28) = tổng(10) hiện tại / tổng(15)=1 các ngày trước có lịch follow = ngày hiện tại</td>
                </tr>
              ) : null}
              {Array.isArray(data?.rows) && data.rows.length > 0 ? data.rows.map((row, idx) => (
                <tr key={`${row?.executionDate || ''}-${row?.employeeCode || idx}`}>
                  <td>{Number(row?.stt || idx + 1)}</td>
                  <td>{row?.executionDate || ''}</td>
                  <td>{row?.unitName || ''}</td>
                  <td>{row?.employeeCode || ''}</td>
                  <td>{row?.employeeName || ''}</td>
                  <td>{Number(row?.totalCustomersOfDay || 0)}</td>
                  <td>{percent(row?.metrics?.m16)}</td>
                  <td>{percent(row?.metrics?.m17)}</td>
                  <td>{percent(row?.metrics?.m18)}</td>
                  <td>{Number(row?.metrics?.m19 || 0)}</td>
                  <td>{Number(row?.metrics?.m20 || 0)}</td>
                  <td>{percent(row?.metrics?.m21)}</td>
                  <td>{Number(row?.metrics?.m22 || 0)}</td>
                  <td>{Number(row?.metrics?.m23 || 0)}</td>
                  <td>{Number(row?.metrics?.m24 || 0)}</td>
                  <td>{percent(row?.metrics?.m25)}</td>
                  <td>{percent(row?.metrics?.m26)}</td>
                  <td>{percent(row?.metrics?.m27)}</td>
                </tr>
              )) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default CoachingProvincialSummaryPage;

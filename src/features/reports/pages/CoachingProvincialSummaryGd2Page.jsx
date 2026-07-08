import { useEffect, useState } from 'react';
import journalService from '../../../services/api/journalService';
import userService from '../../../services/api/userService';

const today = new Date().toISOString().slice(0, 10);

const CoachingProvincialSummaryGd2Page = () => {
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
      const result = await journalService.getCoachingProvincialGd2Summary({
        fromDate,
        toDate: toDate || fromDate,
        unitId: unitId || undefined,
      });
      setData(result || null);
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Không tải được báo cáo tổng hợp GD2');
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    setExporting(true);
    setErrorText('');
    setStatusText('');
    try {
      const result = await journalService.exportCoachingProvincialGd2Summary({
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
      setStatusText('Đã xuất báo cáo tổng hợp coaching GD2');
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Xuất báo cáo tổng hợp GD2 thất bại');
    } finally {
      setExporting(false);
    }
  };

  const percent = (v) => `${(Number(v || 0) * 100).toFixed(2)}%`;

  return (
    <div>
      <div className="page-head">
        <div>
          <h2 style={{ margin: 0 }}>Báo cáo tổng hợp Coaching GD2</h2>
          <div className="page-subtitle">
            Tổng hợp chỉ số coaching giai đoạn 2 • Mốc cắt ngày: {String(cutoffHour).padStart(2, '0')}:00
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
          <table className="table" style={{ minWidth: 1700 }}>
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
                <th>Tỷ lệ tư vấn đủ 3 lớp</th>
                <th>Tỷ lệ theo đuổi có nội dung mới</th>
                <th>Số KH tiềm năng có lịch follow-up</th>
                <th>Số KH được theo đuổi trong ngày</th>
                <th>Số KH bị treo không có bước tiếp theo</th>
                <th>Tỷ lệ KH đồng ý sau follow-up</th>
                <th>Tỷ lệ KH tiềm năng có lịch follow-up</th>
                <th>Tỷ lệ theo đuổi đúng hẹn</th>
                <th>Tỷ lệ Doanh thu cá nhân mới tăng thêm</th>
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
                  <td>(A)=tổng(15)/tổng(KH)</td>
                  <td>(B)=tổng(8)/tổng(KH)</td>
                  <td>(C)=tổng(10)/tổng(KH)</td>
                  <td>(22)=tổng(11)</td>
                  <td>(23)=tổng(17)</td>
                  <td>(24)=tổng((17) với điều kiện (15)=0)</td>
                  <td>(25)=tổng(9)</td>
                  <td>(26)=tổng(6) với điều kiện (17)=0 - tổng(24)</td>
                  <td>(27)=tổng(9) với điều kiện (15)=1 / tổng(9)</td>
                  <td>(28)=tổng(24) / tổng(15)=0</td>
                  <td>(29)=tổng(9) / tổng(17) các ngày trước = ngày hiện tại</td>
                  <td>(Doanh thu)= (tổng(16)-tổng(16) ngày trước) / tổng(16) ngày trước</td>
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
                  <td>{percent(row?.metrics?.m19)}</td>
                  <td>{percent(row?.metrics?.m20)}</td>
                  <td>{percent(row?.metrics?.m21)}</td>
                  <td>{Number(row?.metrics?.m22 || 0)}</td>
                  <td>{Number(row?.metrics?.m23 || 0)}</td>
                  <td>{Number(row?.metrics?.m24 || 0)}</td>
                  <td>{Number(row?.metrics?.m25 || 0)}</td>
                  <td>{Number(row?.metrics?.m26 || 0)}</td>
                  <td>{percent(row?.metrics?.m27)}</td>
                  <td>{percent(row?.metrics?.m28)}</td>
                  <td>{percent(row?.metrics?.m29)}</td>
                  <td>{percent(row?.metrics?.m30)}</td>
                </tr>
              )) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default CoachingProvincialSummaryGd2Page;

import { useEffect, useState, useMemo } from 'react';
import managerDailyScoreService from '../../../services/api/managerDailyScoreService';
import userService from '../../../services/api/userService';

const today = new Date().toISOString().slice(0, 10);

const ProvincialStatisticsPage = () => {
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [unitId, setUnitId] = useState('');
  const [units, setUnits] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [statusText, setStatusText] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setLoading(true);
    setErrorText('');
    setStatusText('');
    try {
      const [statsData, unitData] = await Promise.all([
        managerDailyScoreService.getStatistics({ fromDate, toDate, unitId: unitId || undefined }),
        userService.getUnits().catch(() => []),
      ]);
      setStats(statsData || null);
      setUnits(Array.isArray(unitData) ? unitData : []);
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Không tải được dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const criteria = (stats?.template?.sections || []).flatMap((section) => section.items || []);

  const sortedRows = useMemo(() => {
    if (!stats?.rows) return [];
    return [...stats.rows].sort((a, b) => Number(b.totalScore || 0) - Number(a.totalScore || 0));
  }, [stats?.rows]);

  const sortedUnitRows = useMemo(() => {
    if (!stats?.unitRows) return [];
    return [...stats.unitRows].sort((a, b) => Number(b.averageScore || 0) - Number(a.averageScore || 0));
  }, [stats?.unitRows]);

  const topUnits = sortedUnitRows.slice(0, 5);

  const topEmployees = useMemo(() => {
    if (!stats?.rows) return [];
    const empMap = new Map();
    stats.rows.forEach((row) => {
      const id = row.employee?.id;
      if (!id) return;
      if (!empMap.has(id)) {
        empMap.set(id, {
          id,
          fullName: row.employee.fullName,
          unitName: row.unitName,
          totalScore: 0,
          days: 0,
        });
      }
      const emp = empMap.get(id);
      emp.totalScore += Number(row.totalScore || 0);
      emp.days += 1;
    });

    return Array.from(empMap.values())
      .map((emp) => ({
        ...emp,
        avgScore: Number((emp.totalScore / emp.days).toFixed(2)),
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 10);
  }, [stats?.rows]);

  const exportProvincialReport = async () => {
    setErrorText('');
    setStatusText('');
    if (!fromDate) {
      setErrorText('Vui lòng chọn ngày để xuất báo cáo');
      return;
    }
    if (fromDate !== toDate) {
      setErrorText('Báo cáo xuất theo mẫu hiện tại chỉ hỗ trợ 1 ngày, vui lòng chọn Từ ngày = Đến ngày');
      return;
    }
    setExporting(true);
    try {
      const result = await managerDailyScoreService.exportProvincialStatistics({
        scoreDate: fromDate,
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
      setStatusText('Đã xuất báo cáo Excel toàn tỉnh');
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Xuất báo cáo Excel thất bại');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2 style={{ margin: 0 }}>Thống kê báo cáo toàn tỉnh</h2>
          <div className="page-subtitle">Thống kê theo cá nhân và theo đơn vị</div>
        </div>
      </div>
      {errorText ? <div className="status-err" style={{ marginBottom: 10 }}>{errorText}</div> : null}
      {statusText ? <div className="status-ok" style={{ marginBottom: 10 }}>{statusText}</div> : null}
      {loading ? <div>Đang tải dữ liệu...</div> : null}

      <section className="card" style={{ marginBottom: 12 }}>
        <h3 style={{ marginTop: 0 }}>Vinh danh (Top 5)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#0f766e' }}>🏆 Đơn vị có điểm trung bình cao nhất</h4>
            {topUnits.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {topUnits.map((u, i) => (
                  <li key={u.unitName} style={{ marginBottom: 6 }}>
                    <strong>{u.unitName}</strong>: {u.averageScore} điểm
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ color: '#94a3b8' }}>Chưa có dữ liệu</div>
            )}
          </div>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#b45309' }}>🌟 Nhân viên có điểm trung bình cao nhất</h4>
            {topEmployees.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {topEmployees.slice(0, 5).map((emp, i) => (
                  <li key={emp.id} style={{ marginBottom: 6 }}>
                    <strong>{emp.fullName}</strong> ({emp.unitName}): {emp.avgScore} điểm
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ color: '#94a3b8' }}>Chưa có dữ liệu</div>
            )}
          </div>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 12 }}>
        <h3 style={{ marginTop: 0 }}>Bộ lọc</h3>
        <div className="filters">
          <input type="date" className="field" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <input type="date" className="field" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          <select className="field" value={unitId} onChange={(e) => setUnitId(e.target.value)}>
            <option value="">Tất cả đơn vị</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>{unit.name}</option>
            ))}
          </select>
          <button className="btn outline" onClick={load}>Lọc thống kê</button>
          <button className="btn" onClick={exportProvincialReport} disabled={exporting}>
            {exporting ? 'Đang xuất...' : 'Xuất báo cáo Excel'}
          </button>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button className={`btn ${activeTab === 'personal' ? '' : 'outline'}`} onClick={() => setActiveTab('personal')}>
            Thống kê cá nhân
          </button>
          <button className={`btn ${activeTab === 'unit' ? '' : 'outline'}`} onClick={() => setActiveTab('unit')}>
            Thống kê đơn vị
          </button>
        </div>

        {activeTab === 'personal' ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Đơn vị</th>
                  <th>Họ và tên</th>
                  <th>Ngày</th>
                  {criteria.map((item) => <th key={item.id}>{item.contentName}</th>)}
                  <th>Tổng cộng</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.unitName}</td>
                    <td>{row.employee?.fullName}</td>
                    <td>{row.scoreDate}</td>
                    {criteria.map((item) => (
                      <td key={`${row.id}-${item.id}`}>{Number(row.scoresByItemCode?.[item.itemCode] || 0)}</td>
                    ))}
                    <td><strong>{Number(row.totalScore || 0)}</strong></td>
                  </tr>
                ))}
                {!loading && sortedRows.length === 0 ? (
                  <tr><td colSpan={criteria.length + 4}>Không có dữ liệu thống kê cá nhân</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Đơn vị</th>
                  <th>Số nhân viên</th>
                  <th>Tổng điểm đơn vị</th>
                  <th>Điểm trung bình (Tổng điểm / Số nhân viên)</th>
                </tr>
              </thead>
              <tbody>
                {sortedUnitRows.map((row) => (
                  <tr key={row.unitName}>
                    <td>{row.unitName}</td>
                    <td>{row.employeeCount}</td>
                    <td>{row.totalScore}</td>
                    <td><strong>{row.averageScore}</strong></td>
                  </tr>
                ))}
                {!loading && sortedUnitRows.length === 0 ? (
                  <tr><td colSpan={4}>Không có dữ liệu thống kê đơn vị</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default ProvincialStatisticsPage;

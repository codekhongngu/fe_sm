import { useEffect, useState, useMemo } from 'react';
import managerDailyScoreService from '../../../services/api/managerDailyScoreService';
import managerCoachingService from '../../../services/api/managerCoachingService';
import journalService from '../../../services/api/journalService';
import userService from '../../../services/api/userService';

const today = new Date().toISOString().slice(0, 10);

const toPercent = (numerator, denominator) => {
  if (!denominator) return '0%';
  return `${((Number(numerator || 0) / Number(denominator || 0)) * 100).toFixed(2)}%`;
};

const ProvincialStatisticsPage = ({ defaultTab = 'personal' }) => {
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [unitId, setUnitId] = useState('');
  const [units, setUnits] = useState([]);
  const [stats, setStats] = useState(null);
  const [coachingRows, setCoachingRows] = useState([]);
  const [coachingEmployees, setCoachingEmployees] = useState([]);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [statusText, setStatusText] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportingCoaching, setExportingCoaching] = useState(false);
  const [exportingManagerCoaching, setExportingManagerCoaching] = useState(false);

  const load = async () => {
    setLoading(true);
    setErrorText('');
    setStatusText('');
    try {
      const [statsData, coachingData, coachingEmployeesData, unitData] = await Promise.all([
        managerDailyScoreService.getStatistics({ fromDate, toDate, unitId: unitId || undefined }),
        managerCoachingService.getList({ fromDate, toDate }),
        managerCoachingService.getEmployees().catch(() => []),
        userService.getUnits().catch(() => []),
      ]);
      setStats(statsData || null);
      setCoachingRows(Array.isArray(coachingData) ? coachingData : []);
      setCoachingEmployees(Array.isArray(coachingEmployeesData) ? coachingEmployeesData : []);
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

  const sortedCoachingRows = useMemo(() => {
    const filteredRows = Array.isArray(coachingRows)
      ? coachingRows.filter((row) => (!unitId ? true : row.coachedUnitId === unitId))
      : [];

    return [...filteredRows]
      .sort((a, b) => {
        const unitCmp = String(a.coachedUnitName || '').localeCompare(String(b.coachedUnitName || ''));
        if (unitCmp !== 0) return unitCmp;
        return String(b.coachingTime || '').localeCompare(String(a.coachingTime || ''));
      });
  }, [coachingRows, unitId]);

  const coachingRowsWithSubtotals = useMemo(() => {
    const rows = sortedCoachingRows;
    if (!rows.length) return [];

    const result = [];
    let group = [];
    let lastUnit = '';

    const pushGroup = () => {
      if (!group.length) return;
      const keepTncTotal = group.reduce((sum, item) => sum + (Number(item.keepTnc) === 1 ? 1 : 0), 0);
      const evaluationTotal = group.reduce((sum, item) => sum + (Number(item.evaluationResult) === 1 ? 1 : 0), 0);
      result.push(...group.map((item) => ({ type: 'data', item })));
      result.push({
        type: 'subtotal',
        unitName: group[0]?.coachedUnitName || '',
        keepTncTotal,
        evaluationTotal,
      });
      group = [];
    };

    rows.forEach((item) => {
      const unitName = String(item.coachedUnitName || '');
      if (lastUnit && unitName !== lastUnit) {
        pushGroup();
      }
      lastUnit = unitName;
      group.push(item);
    });
    pushGroup();

    return result;
  }, [sortedCoachingRows]);

  const coachingSummaryRows = useMemo(() => {
    const unitEmployeeCountMap = new Map();
    (Array.isArray(coachingEmployees) ? coachingEmployees : []).forEach((employee) => {
      const id = String(employee.unitId || '');
      if (!id) return;
      unitEmployeeCountMap.set(id, Number(unitEmployeeCountMap.get(id) || 0) + 1);
    });

    const groupMap = new Map();
    sortedCoachingRows.forEach((row) => {
      const date = String(row.coachingTime || '').slice(0, 10);
      const unitKey = String(row.coachedUnitId || '');
      const key = `${unitKey}__${date}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          key,
          unitId: unitKey,
          unitName: row.coachedUnitName || '',
          date,
          coachedSet: new Set(),
          keepSet: new Set(),
          passSet: new Set(),
        });
      }
      const entry = groupMap.get(key);
      const coachedUserId = String(row.coachedUserId || '');
      if (!coachedUserId) return;
      entry.coachedSet.add(coachedUserId);
      if (Number(row.keepTnc) === 1) {
        entry.keepSet.add(coachedUserId);
      }
      if (Number(row.evaluationResult) === 1) {
        entry.passSet.add(coachedUserId);
      }
    });

    return Array.from(groupMap.values())
      .map((item) => {
        const totalUnitEmployees = Number(unitEmployeeCountMap.get(item.unitId) || 0);
        const coachedCount = item.coachedSet.size; // (4)
        const keepCount = item.keepSet.size; // (7)
        const passCount = item.passSet.size; // (8)

        return {
          key: item.key,
          unitId: item.unitId,
          unitName: item.unitName,
          date: item.date,
          totalUnitEmployees,
          coachedCount,
          keepCount,
          passCount,
          coachedRate: toPercent(coachedCount, totalUnitEmployees), // tong (4) / tong NV don vi
          keepRate: toPercent(keepCount, coachedCount), // (7) / (4)
          passRate: toPercent(passCount, coachedCount), // (8) / (4)
        };
      })
      .sort((a, b) => {
        const dateCmp = String(b.date || '').localeCompare(String(a.date || ''));
        if (dateCmp !== 0) return dateCmp;
        return String(a.unitName || '').localeCompare(String(b.unitName || ''));
      });
  }, [sortedCoachingRows, coachingEmployees]);

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

  const exportCoachingProvincial = async () => {
    setErrorText('');
    setStatusText('');
    if (!fromDate) {
      setErrorText('Vui lòng chọn ngày để xuất báo cáo coaching');
      return;
    }
    setExportingCoaching(true);
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
      setErrorText(error?.response?.data?.message || 'Xuất báo cáo coaching thất bại');
    } finally {
      setExportingCoaching(false);
    }
  };

  const exportManagerCoachingProvincial = async () => {
    setErrorText('');
    setStatusText('');
    if (!fromDate) {
      setErrorText('Vui lòng chọn ngày để xuất thống kê coaching quản lý');
      return;
    }
    setExportingManagerCoaching(true);
    try {
      const result = await managerCoachingService.exportExcel({ fromDate, toDate: toDate || fromDate });
      const url = window.URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setStatusText('Đã xuất thống kê coaching quản lý');
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Xuất thống kê coaching quản lý thất bại');
    } finally {
      setExportingManagerCoaching(false);
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
          <button className="btn" style={{ background: '#0f766e' }} onClick={exportCoachingProvincial} disabled={exportingCoaching}>
            {exportingCoaching ? 'Đang xuất...' : 'Xuất báo cáo Coaching'}
          </button>
          <button className="btn" style={{ background: '#7c3aed' }} onClick={exportManagerCoachingProvincial} disabled={exportingManagerCoaching}>
            {exportingManagerCoaching ? 'Đang xuất...' : 'Xuất thống kê Coaching quản lý'}
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
          <button className={`btn ${activeTab === 'managerCoaching' ? '' : 'outline'}`} onClick={() => setActiveTab('managerCoaching')}>
            Thống kê Coaching quản lý
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
        ) : activeTab === 'unit' ? (
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
        ) : (
          <div>
            <div className="table-wrap" style={{ marginBottom: 14 }}>
              <table className="table" style={{ minWidth: 1250 }}>
                <thead>
                  <tr>
                    <th>Đơn vị</th>
                    <th>Ngày</th>
                    <th>Tổng NV đơn vị</th>
                    <th>NV được coaching (4)</th>
                    <th>NV được coaching giữ chuẩn (7)</th>
                    <th>NV được coaching đạt (8)</th>
                    <th>TL % NV được coach/ngày</th>
                    <th>TL % NV giữ chuẩn/ngày</th>
                    <th>TL % NV được coaching đạt/ngày</th>
                  </tr>
                </thead>
                <tbody>
                  {coachingSummaryRows.map((row) => (
                    <tr key={row.key}>
                      <td>{row.unitName}</td>
                      <td>{row.date}</td>
                      <td>{row.totalUnitEmployees}</td>
                      <td>{row.coachedCount}</td>
                      <td>{row.keepCount}</td>
                      <td>{row.passCount}</td>
                      <td>{row.coachedRate}</td>
                      <td>{row.keepRate}</td>
                      <td>{row.passRate}</td>
                    </tr>
                  ))}
                  {!loading && coachingSummaryRows.length === 0 ? (
                    <tr><td colSpan={9}>Không có dữ liệu báo cáo tổng hợp coaching quản lý</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="table-wrap">
              <table className="table" style={{ minWidth: 1280 }}>
                <thead>
                  <tr>
                    <th>Đơn vị</th>
                    <th>Thời gian coaching</th>
                    <th>Người coach</th>
                    <th>Người được coaching</th>
                    <th>Nội dung coach</th>
                    <th>Sửa nội dung gì</th>
                    <th>Giữ chuẩn TNC</th>
                    <th>Đánh giá người được coaching</th>
                  </tr>
                </thead>
                <tbody>
                  {coachingRowsWithSubtotals.map((row, idx) =>
                    row.type === 'data' ? (
                      <tr key={`coaching-${row.item.id || idx}`}>
                        <td>{row.item.coachedUnitName || ''}</td>
                        <td>{String(row.item.coachingTime || '').replace('T', ' ').slice(0, 16)}</td>
                        <td>{row.item.coachName || ''}</td>
                        <td>{row.item.coachedUserName || ''}</td>
                        <td>{row.item.coachingContent || ''}</td>
                        <td>{row.item.contentToImprove || ''}</td>
                        <td>{Number(row.item.keepTnc) === 1 ? 1 : 0}</td>
                        <td>{Number(row.item.evaluationResult) === 1 ? 1 : 0}</td>
                      </tr>
                    ) : (
                      <tr key={`coaching-subtotal-${row.unitName}-${idx}`} style={{ background: '#f8fafc', fontWeight: 700 }}>
                        <td>{row.unitName}</td>
                        <td></td>
                        <td></td>
                        <td>tổng của đơn vị</td>
                        <td></td>
                        <td></td>
                        <td>tổng của đơn vị: {row.keepTncTotal}</td>
                        <td>tổng của đơn vị: {row.evaluationTotal}</td>
                      </tr>
                    ),
                  )}
                  {!loading && coachingRowsWithSubtotals.length === 0 ? (
                    <tr><td colSpan={8}>Không có dữ liệu thống kê coaching quản lý</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ProvincialStatisticsPage;

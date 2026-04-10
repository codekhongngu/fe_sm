import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useSelector } from 'react-redux';
import dashboardService from '../../../services/api/dashboardService';
import evaluationService from '../../../services/api/evaluationService';
import journalService from '../../../services/api/journalService';
import managerDailyScoreService from '../../../services/api/managerDailyScoreService';
import { selectAuth } from '../../../store/auth/AuthSlice';

const toDateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const daysAgoKey = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toDateKey(date);
};

const DashboardPage = () => {
  const { user } = useSelector(selectAuth);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [period, setPeriod] = useState('month');
  const [unitId, setUnitId] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [adminTab, setAdminTab] = useState('overview');
  const [pendingCount, setPendingCount] = useState(0);
  const [weeklyEval, setWeeklyEval] = useState(null);
  const [todayScoreStats, setTodayScoreStats] = useState(null);
  const [employeeDashboard, setEmployeeDashboard] = useState(null);

  const isManagerOrAdmin = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  const loadManagerDashboard = async () => {
    setLoading(true);
    setErrorText('');
    try {
      const todayKey = toDateKey(new Date());
      const [analyticsData, pending, weekly, dailyScore] = await Promise.all([
        dashboardService.getBehaviorAnalytics({
          period,
          unitId: unitId || undefined,
        }),
        evaluationService.getPendingList(),
        evaluationService.getWeeklyAnalytics(),
        managerDailyScoreService.getStatistics({
          fromDate: todayKey,
          toDate: todayKey,
        }),
      ]);
      setAnalytics(analyticsData);
      setPendingCount(Array.isArray(pending) ? pending.length : 0);
      setWeeklyEval(weekly || null);
      setTodayScoreStats(dailyScore?.totals || null);
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Không tải được dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeDashboard = async () => {
    setLoading(true);
    setErrorText('');
    try {
      const todayKey = toDateKey(new Date());
      const fromDate = daysAgoKey(29);
      const [journals, logsToday] = await Promise.all([
        journalService.getList({ fromDate, toDate: todayKey }),
        journalService.getLogsHistory(null, todayKey).catch(() => ({})),
      ]);
      const list = Array.isArray(journals) ? journals : [];
      const byDay = new Map(list.map((item) => [item.reportDate, item]));
      const submittedDays = list.filter(
        (item) => item.awarenessSubmittedAt || item.standardsSubmittedAt,
      ).length;
      const evaluatedDays = list.filter((item) => !!item.evaluation).length;
      const todayJournal = byDay.get(todayKey);
      const formStatusRows = [
        { form: 'Mẫu 1: Nhận diện', submitted: !!todayJournal?.awarenessSubmittedAt },
        // { form: 'Mẫu 1: Giữ chuẩn', submitted: !!todayJournal?.standardsSubmittedAt },
        { form: 'Mẫu 2: Hành vi', submitted: !!logsToday?.form2 },
        { form: 'Mẫu 3: Thay đổi tư duy', submitted: !!logsToday?.form3 },
        { form: 'Mẫu 4: Báo cáo bán hàng', submitted: Array.isArray(logsToday?.form4) && logsToday.form4.length > 0 },
        { form: 'Mẫu 5: Ghi chép cuối ngày', submitted: !!logsToday?.form5 },
        { form: 'Mẫu 8: Củng cố niềm tin', submitted: Array.isArray(logsToday?.form8) && logsToday.form8.length > 0 },
      ];
      const submittedTodayCount = formStatusRows.filter((item) => item.submitted).length;
      const last7Days = Array.from({ length: 7 })
        .map((_, index) => {
          const day = daysAgoKey(6 - index);
          const journal = byDay.get(day);
          return {
            day: day.slice(5),
            daNop: journal?.awarenessSubmittedAt || journal?.standardsSubmittedAt ? 1 : 0,
          };
        });
      setEmployeeDashboard({
        submittedDays,
        evaluatedDays,
        submittedTodayCount,
        formStatusRows,
        last7Days,
        form2ReviewStatus: logsToday?.form2?.status || 'CHƯA_NỘP',
      });
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Không tải được dữ liệu dashboard nhân viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isManagerOrAdmin) {
      loadManagerDashboard();
      return;
    }
    loadEmployeeDashboard();
  }, [isManagerOrAdmin, period, unitId]);

  const exportExcel = () => {
    if (!analytics || !isManagerOrAdmin) return;
    const rows = [
      ['Tổng nhân sự', analytics?.kpis?.totalEmployees ?? 0],
      ['% Tuân thủ kỷ luật', analytics?.kpis?.complianceRate ?? 0],
      ['% Đạt chuẩn trung bình', analytics?.kpis?.averagePassRate ?? 0],
      [],
      ['Top 5 lý do đổ lỗi', 'Số lần'],
      ...(analytics?.topReasons || []).map((item) => [item.text, item.count]),
    ];
    const csv = rows.map((row) => row.map((col) => `"${String(col || '')}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bao-cao-hanh-vi.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    window.print();
  };

  const unitOptions = analytics?.unitOptions || [];
  const topReasons = useMemo(() => analytics?.topReasons || [], [analytics]);

  if (!isManagerOrAdmin) {
    return (
      <div>
        <div className="page-head">
          <div>
            <h2 style={{ margin: 0, color: '#0074ba' }}>Dashboard Nhân viên</h2>
            <div className="page-subtitle">Theo dõi tiến độ nộp biểu mẫu hằng ngày</div>
          </div>
        </div>
        {errorText ? <div className="status-err" style={{ marginBottom: 10 }}>{errorText}</div> : null}
        {loading ? <div>Đang tải dữ liệu...</div> : null}
        <div className="cards-grid" style={{ marginBottom: 12 }}>
          <div className="card">
            <div style={{ color: '#64748b' }}>Số ngày đã ghi nhận</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{employeeDashboard?.submittedDays || 0}</div>
          </div>
          <div className="card">
            <div style={{ color: '#64748b' }}>Số ngày đã được đánh giá</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{employeeDashboard?.evaluatedDays || 0}</div>
          </div>
          <div className="card">
            <div style={{ color: '#64748b' }}>Mẫu đã nộp hôm nay</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>
              {employeeDashboard?.submittedTodayCount || 0}/7
            </div>
          </div>
          <div className="card">
            <div style={{ color: '#64748b' }}>Trạng thái thẩm định Mẫu 2</div>
            <div style={{ fontSize: 12, fontWeight: 800 }}>
              {employeeDashboard?.form2ReviewStatus === 'APPROVED'
                ? 'Đạt'
                : employeeDashboard?.form2ReviewStatus === 'PENDING'
                  ? 'Chờ duyệt'
                  : employeeDashboard?.form2ReviewStatus === 'REJECTED'
                    ? 'Chưa đạt'
                    : 'Chưa nhập Mẫu 02'}
            </div>
          </div>
        </div>
        <div className="cards-grid" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Mức độ nộp nhật ký 7 ngày gần nhất</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={employeeDashboard?.last7Days || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 1]} ticks={[0, 1]} />
                <Tooltip />
                <Bar dataKey="daNop" name="Đã nộp nhật ký" fill="#0074ba" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Trạng thái biểu mẫu hôm nay</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {(employeeDashboard?.formStatusRows || []).map((row) => (
                <div
                  key={row.form}
                  style={{
                    border: '1px solid #dbeafe',
                    background: '#f8fbff',
                    borderRadius: 10,
                    padding: '8px 10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <span>{row.form}</span>
                  <strong style={{ color: row.submitted ? '#0f766e' : '#b45309' }}>
                    {row.submitted ? 'Đã nộp' : 'Chưa nộp'}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h2 style={{ margin: 0, color: '#0074ba' }}>Dashboard Quản trị Hành vi</h2>
          <div className="page-subtitle">Theo dõi kỷ luật 90 ngày - VNPT Gia Lai</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="filters">
          <select className="field" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="week">Tuần</option>
            <option value="month">Tháng</option>
            <option value="quarter">Quý</option>
          </select>
          <select
            className="field"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            disabled={user?.role === 'MANAGER'}
          >
            <option value="">{user?.role === 'ADMIN' ? 'Toàn tỉnh' : 'Đơn vị của tôi'}</option>
            {unitOptions.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.code} - {unit.name}
              </option>
            ))}
          </select>
          <button className="btn outline" onClick={exportPdf}>
            Xuất PDF
          </button>
          <button className="btn outline" onClick={exportExcel}>
            Xuất Excel
          </button>
        </div>
        {user?.role === 'ADMIN' ? (
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <button
              className={`btn ${adminTab === 'overview' ? '' : 'outline'}`}
              onClick={() => setAdminTab('overview')}
            >
              Tổng quan
            </button>
            <button
              className={`btn ${adminTab === 'province' ? '' : 'outline'}`}
              onClick={() => setAdminTab('province')}
            >
              Toàn tỉnh
            </button>
          </div>
        ) : null}
      </div>

      {errorText ? <div className="status-err" style={{ marginBottom: 10 }}>{errorText}</div> : null}
      {loading ? <div>Đang tải dữ liệu...</div> : null}

      <div className="cards-grid" style={{ marginBottom: 12 }}>
        <div className="card">
          <div style={{ color: '#64748b' }}>Hồ sơ chờ thẩm định</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{pendingCount}</div>
        </div>
        <div className="card">
          <div style={{ color: '#64748b' }}>Tổng nhân sự</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{analytics?.kpis?.totalEmployees || 0}</div>
        </div>
        <div className="card">
          <div style={{ color: '#64748b' }}>Tỷ lệ Hỏi sâu tuần này</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>
            {weeklyEval?.deepInquiryRate || 0}%
          </div>
        </div>
        <div className="card">
          <div style={{ color: '#64748b' }}>Điểm TB chấm ngày hôm nay</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>
            {todayScoreStats?.averageScore || 0}
          </div>
        </div>
      </div>

      {adminTab === 'province' && user?.role === 'ADMIN' ? (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>So sánh giữa các đơn vị (Toàn tỉnh)</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Đơn vị</th>
                  <th>Hỏi sâu (%)</th>
                  <th>Đề xuất đủ (%)</th>
                  <th>Theo đến quyết (%)</th>
                </tr>
              </thead>
              <tbody>
                {(analytics?.unitComparison || []).map((item) => (
                  <tr key={item.unitId}>
                    <td>{item.unitName}</td>
                    <td>{item.deepInquiryRate}</td>
                    <td>{item.fullProposalRate}</td>
                    <td>{item.persistenceRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div className="card" style={{ minHeight: 340 }}>
            <h3 style={{ marginTop: 0 }}>So sánh chỉ số hành vi</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analytics?.charts?.barData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="skill" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="daThucHien" name="Đã thực hiện" fill="#0074ba" />
                <Bar dataKey="chuaThucHien" name="Chưa thực hiện" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{ minHeight: 340 }}>
            <h3 style={{ marginTop: 0 }}>Radar kỹ năng cốt lõi</h3>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={analytics?.charts?.radarData || []}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <Radar
                  name="Điểm cân bằng"
                  dataKey="value"
                  stroke="#0074ba"
                  fill="#0074ba"
                  fillOpacity={0.35}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{ minHeight: 340 }}>
            <h3 style={{ marginTop: 0 }}>Xu hướng 12 tuần</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={analytics?.charts?.lineData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="% Giữ chuẩn"
                  stroke="#0074ba"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{ minHeight: 340 }}>
            <h3 style={{ marginTop: 0 }}>Top 5 lý do đổ lỗi phổ biến</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {topReasons.map((item, idx) => (
                <div
                  key={`${item.text}-${idx}`}
                  style={{
                    border: '1px solid #dbeafe',
                    background: '#f8fbff',
                    borderRadius: 10,
                    padding: '8px 10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <span style={{ color: '#1e293b' }}>{item.text}</span>
                  <strong style={{ color: '#0074ba' }}>{item.count}</strong>
                </div>
              ))}
              {topReasons.length === 0 ? <div>Chưa có dữ liệu</div> : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

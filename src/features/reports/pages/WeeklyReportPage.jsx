import { useEffect, useState } from 'react';
import behaviorAdminService from '../../../services/api/behaviorAdminService';

const WeeklyReportPage = () => {
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [weeklyConfigs, setWeeklyConfigs] = useState([]);
  const [selectedWeekId, setSelectedWeekId] = useState('');
  const [weeklySummary, setWeeklySummary] = useState(null);

  const loadWeeks = async () => {
    setErrorText('');
    try {
      const data = await behaviorAdminService.getWeeklyConfigs();
      const list = Array.isArray(data) ? data : [];
      setWeeklyConfigs(list);
      if (!selectedWeekId && list.length > 0) {
        setSelectedWeekId(list[0].id);
      }
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Không tải được danh sách tuần');
    }
  };

  useEffect(() => {
    loadWeeks();
  }, []);

  useEffect(() => {
    if (!selectedWeekId) {
      setWeeklySummary(null);
      return;
    }
    const run = async () => {
      setLoading(true);
      setErrorText('');
      try {
        const data = await behaviorAdminService.getWeeklySummary(selectedWeekId);
        setWeeklySummary(data || null);
      } catch (error) {
        setErrorText(error?.response?.data?.message || 'Không tải được báo cáo tuần');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [selectedWeekId]);

  return (
    <div className="review-v3-shell">
      <div className="review-v3-main">
        <section className="review-title-block">
          <h1 style={{ margin: 0 }}>Mẫu 6: Báo cáo tuần</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b' }}>
            Tổng hợp dữ liệu biểu mẫu theo tuần cấu hình để quản lý theo dõi và báo cáo.
          </p>
        </section>

        {errorText ? <div className="status-err" style={{ marginBottom: 8 }}>{errorText}</div> : null}
        {loading ? <div>Đang tải dữ liệu...</div> : null}

        <section className="card" style={{ marginBottom: 12 }}>
          <h3 style={{ marginTop: 0 }}>Bộ lọc tuần báo cáo</h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="field"
              value={selectedWeekId}
              onChange={(e) => setSelectedWeekId(e.target.value)}
              style={{ maxWidth: 420 }}
            >
              <option value="">Chọn tuần báo cáo</option>
              {weeklyConfigs.map((week) => (
                <option key={week.id} value={week.id}>
                  {week.weekName} ({week.startDate} → {week.endDate})
                </option>
              ))}
            </select>
            <div style={{ color: '#475569', fontSize: 14 }}>
              {weeklySummary?.week
                ? `Khoảng tuần: ${weeklySummary.week.startDate} → ${weeklySummary.week.endDate}`
                : ''}
            </div>
          </div>
        </section>

        <section className="card">
          <h3 style={{ marginTop: 0 }}>GD VNPT khu vực tổng hợp</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tên nhân viên</th>
                  <th>Số KH gặp trong tuần</th>
                  <th>Tỷ lệ có hỏi sâu</th>
                  <th>Tỷ lệ tư vấn đủ giải pháp</th>
                  <th>Tỷ lệ có theo đuổi đến cùng</th>
                  <th>Nhận xét</th>
                </tr>
              </thead>
              <tbody>
                {(weeklySummary?.items || []).map((item) => (
                  <tr key={item.userId}>
                    <td>{item.fullName || '-'}</td>
                    <td>{Number(item.totalCustomerMet || 0)}</td>
                    <td>{Number(item.deepInquiryRate || 0)}%</td>
                    <td>{Number(item.fullConsultationRate || 0)}%</td>
                    <td>{Number(item.followedThroughRate || 0)}%</td>
                    <td>{item.managerFeedback || '-'}</td>
                  </tr>
                ))}
                {!loading && (!weeklySummary?.items || weeklySummary.items.length === 0) ? (
                  <tr>
                    <td colSpan={6}>Chưa có dữ liệu báo cáo tuần cho cấu hình này.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default WeeklyReportPage;

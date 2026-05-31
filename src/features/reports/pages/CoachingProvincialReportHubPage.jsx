import { NavLink, useLocation } from 'react-router-dom';
import CoachingProvincialReportPage from './CoachingProvincialReportPage';
import CoachingProvincialSummaryPage from './CoachingProvincialSummaryPage';

const CoachingProvincialReportHubPage = () => {
  const location = useLocation();
  const isSummary = location.pathname.endsWith('/summary');

  return (
    <div>
      <section className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <NavLink
            to="/discipline/coaching-provincial-report"
            end
            className={({ isActive }) => `btn ${isActive ? '' : 'outline'}`}
          >
            Báo cáo Coaching GD1
          </NavLink>
          <NavLink
            to="/discipline/coaching-provincial-report/summary"
            className={({ isActive }) => `btn ${isActive ? '' : 'outline'}`}
          >
            Báo cáo Coaching Tổng hợp
          </NavLink>
        </div>
      </section>

      {isSummary ? <CoachingProvincialSummaryPage /> : <CoachingProvincialReportPage />}
    </div>
  );
};

export default CoachingProvincialReportHubPage;

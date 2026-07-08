import { NavLink, useLocation } from 'react-router-dom';
import CoachingProvincialReportGd2Page from './CoachingProvincialReportGd2Page';
import CoachingProvincialSummaryGd2Page from './CoachingProvincialSummaryGd2Page';

const CoachingProvincialReportGd2HubPage = () => {
  const location = useLocation();
  const isSummary = location.pathname.endsWith('/summary');

  return (
    <div>
      <section className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <NavLink
            to="/discipline/coaching-provincial-report-gd2"
            end
            className={({ isActive }) => `btn ${isActive ? '' : 'outline'}`}
          >
            Báo cáo Coaching GD2
          </NavLink>
          <NavLink
            to="/discipline/coaching-provincial-report-gd2/summary"
            className={({ isActive }) => `btn ${isActive ? '' : 'outline'}`}
          >
            Báo cáo Coaching Tổng hợp
          </NavLink>
        </div>
      </section>

      {isSummary ? <CoachingProvincialSummaryGd2Page /> : <CoachingProvincialReportGd2Page />}
    </div>
  );
};

export default CoachingProvincialReportGd2HubPage;
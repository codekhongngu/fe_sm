import { Navigate, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AuthGuard from '../components/auth/guards/AuthGuard';
import RoleGuard from '../components/auth/guards/RoleGuard';
import BlankLayout from '../layouts/blank/BlankLayout';
import FullLayout from '../layouts/full/FullLayout';
import LoginPage from '../features/auth/pages/LoginPage';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import CatalogPage from '../features/catalogs/pages/CatalogPage';
import Journey90Page from '../features/journals/pages/Journey90Page';
import WeeklyJournalPage from '../features/journals/pages/WeeklyJournalPage';
import ManagerReviewPage from '../features/journals/pages/ManagerReviewPage';
import ManagerDailyScorePage from '../features/manager-daily-scores/pages/ManagerDailyScorePage';
import WeeklyReportPage from '../features/reports/pages/WeeklyReportPage';
import ProvincialApprovedJournalsPage from '../features/reports/pages/ProvincialApprovedJournalsPage';
import ProvincialStatisticsPage from '../features/reports/pages/ProvincialStatisticsPage';
import UserManagementPage from '../features/system-administration/pages/UserManagement/UserManagementPage';
import RolePermissionPage from '../features/system-administration/pages/RolePermissionManagement/RolePermissionPage';
import JourneyPhaseConfigPage from '../features/system-administration/pages/JourneyPhaseConfigPage';
import LoginHistoryPage from '../features/system-administration/pages/LoginHistoryPage';
import { selectAuth } from '../store/auth/AuthSlice';

const Router = () => {
  const { isAuthenticated, user } = useSelector(selectAuth);

  return (
    <Routes>
      <Route path="/auth" element={<BlankLayout />}>
        <Route path="login" element={<LoginPage />} />
      </Route>

      <Route
        path="/"
        element={
          <AuthGuard isAuthenticated={isAuthenticated}>
            <FullLayout />
          </AuthGuard>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="discipline/journey-90" element={<Journey90Page />} />
        <Route path="discipline/weekly-journal" element={<WeeklyJournalPage />} />
        <Route
          path="discipline/manager-review"
          element={
            <RoleGuard user={user} roles={['MANAGER', 'ADMIN']}>
              <ManagerReviewPage />
            </RoleGuard>
          }
        />
        <Route
          path="discipline/manager-review/:journalId"
          element={
            <RoleGuard user={user} roles={['MANAGER', 'ADMIN']}>
              <ManagerReviewPage />
            </RoleGuard>
          }
        />
        <Route
          path="discipline/manager-daily-score"
          element={
            <RoleGuard user={user} roles={['MANAGER', 'ADMIN', 'PROVINCIAL_VIEWER']}>
              <ManagerDailyScorePage />
            </RoleGuard>
          }
        />
        <Route
          path="discipline/weekly-report"
          element={
            <RoleGuard user={user} roles={['MANAGER', 'ADMIN', 'PROVINCIAL_VIEWER']}>
              <WeeklyReportPage />
            </RoleGuard>
          }
        />
        <Route
          path="discipline/provincial-approved-journals"
          element={
            <RoleGuard user={user} roles={['PROVINCIAL_VIEWER', 'ADMIN']}>
              <ProvincialApprovedJournalsPage />
            </RoleGuard>
          }
        />
        <Route
          path="discipline/provincial-statistics"
          element={
            <RoleGuard user={user} roles={['PROVINCIAL_VIEWER', 'ADMIN']}>
              <ProvincialStatisticsPage />
            </RoleGuard>
          }
        />
        <Route
          path="management/catalogs"
          element={
            <RoleGuard user={user} roles={['MANAGER', 'ADMIN']}>
              <CatalogPage />
            </RoleGuard>
          }
        />
        <Route
          path="system-administration/users"
          element={
            <RoleGuard user={user} roles={['ADMIN']}>
              <UserManagementPage />
            </RoleGuard>
          }
        />
        <Route
          path="system-administration/roles-permissions"
          element={
            <RoleGuard user={user} roles={['ADMIN']}>
              <RolePermissionPage />
            </RoleGuard>
          }
        />
        <Route
          path="system-administration/journey-phase-configs"
          element={
            <RoleGuard user={user} roles={['ADMIN']}>
              <JourneyPhaseConfigPage />
            </RoleGuard>
          }
        />
        <Route
          path="system-administration/login-history"
          element={
            <RoleGuard user={user} roles={['ADMIN']}>
              <LoginHistoryPage />
            </RoleGuard>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/auth/login'} replace />} />
    </Routes>
  );
};

export default Router;

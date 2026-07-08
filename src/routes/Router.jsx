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
import ManagerWeeklyReviewPage from '../features/journals/pages/ManagerWeeklyReviewPage';
import ManagerCoachingPage from '../features/journals/pages/ManagerCoachingPage';
import ManagerDailyScorePage from '../features/manager-daily-scores/pages/ManagerDailyScorePage';
import CoachingCompetitionPage from '../features/manager-daily-scores/pages/CoachingCompetitionPage';
import WeeklyReportPage from '../features/reports/pages/WeeklyReportPage';
import ProvincialApprovedJournalsPage from '../features/reports/pages/ProvincialApprovedJournalsPage';
import ProvincialStatisticsPage from '../features/reports/pages/ProvincialStatisticsPage';
import JournalSubmissionsPage from '../features/reports/pages/JournalSubmissionsPage';
import CoachingProvincialReportHubPage from '../features/reports/pages/CoachingProvincialReportHubPage';
import CoachingProvincialReportGd2HubPage from '../features/reports/pages/CoachingProvincialReportGd2HubPage';
import UserManagementPage from '../features/system-administration/pages/UserManagement/UserManagementPage';
import RolePermissionPage from '../features/system-administration/pages/RolePermissionManagement/RolePermissionPage';
import JourneyPhaseConfigPage from '../features/system-administration/pages/JourneyPhaseConfigPage';
import CoachingPhaseConfigPage from '../features/system-administration/pages/CoachingPhaseConfigPage';
import LoginHistoryPage from '../features/system-administration/pages/LoginHistoryPage';
import SystemConfigPage from '../features/system-administration/pages/SystemConfigPage';
import WardCatalogAdminPage from '../features/system-administration/pages/WardCatalogAdminPage';
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
          path="discipline/manager-coaching"
          element={
            <RoleGuard
              user={user}
              roles={['MANAGER', 'ADMIN']}
              allow={!!user?.canManageCoaching}
            >
              <ManagerCoachingPage />
            </RoleGuard>
          }
        />
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
          path="discipline/manager-weekly-review"
          element={
            <RoleGuard user={user} roles={['MANAGER', 'ADMIN', 'PROVINCIAL_VIEWER']}>
              <ManagerWeeklyReviewPage />
            </RoleGuard>
          }
        />
        <Route
          path="discipline/manager-daily-score"
          element={
            <RoleGuard user={user} roles={['EMPLOYEE', 'MANAGER', 'ADMIN', 'PROVINCIAL_VIEWER']}>
              <ManagerDailyScorePage />
            </RoleGuard>
          }
        />
        <Route
          path="discipline/coaching-competition"
          element={
            <RoleGuard user={user} roles={['MANAGER', 'ADMIN', 'PROVINCIAL_VIEWER']}>
              <CoachingCompetitionPage />
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
          path="discipline/provincial-statistics-manager-coaching"
          element={
            <RoleGuard user={user} roles={['PROVINCIAL_VIEWER', 'ADMIN']}>
              <ProvincialStatisticsPage defaultTab="managerCoaching" />
            </RoleGuard>
          }
        />
        <Route
          path="discipline/journal-submissions"
          element={
            <RoleGuard user={user} roles={['PROVINCIAL_VIEWER', 'ADMIN']}>
              <JournalSubmissionsPage />
            </RoleGuard>
          }
        />
        <Route
          path="discipline/coaching-provincial-report/*"
          element={
            <RoleGuard user={user} roles={['PROVINCIAL_VIEWER', 'ADMIN']}>
              <CoachingProvincialReportHubPage />
            </RoleGuard>
          }
        />
        <Route
          path="discipline/coaching-provincial-summary"
          element={
            <RoleGuard user={user} roles={['PROVINCIAL_VIEWER', 'ADMIN']}>
              <Navigate to="/discipline/coaching-provincial-report/summary" replace />
            </RoleGuard>
          }
        />
        <Route
          path="discipline/coaching-provincial-report-gd2/*"
          element={
            <RoleGuard user={user} roles={['PROVINCIAL_VIEWER', 'ADMIN']}>
              <CoachingProvincialReportGd2HubPage />
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
          path="system-administration/coaching-phase-configs"
          element={
            <RoleGuard user={user} roles={['ADMIN']}>
              <CoachingPhaseConfigPage />
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
        <Route
          path="system-administration/system-configs"
          element={
            <RoleGuard user={user} roles={['ADMIN']}>
              <SystemConfigPage />
            </RoleGuard>
          }
        />
        <Route
          path="system-administration/ward-catalogs"
          element={
            <RoleGuard user={user} roles={['ADMIN']}>
              <WardCatalogAdminPage />
            </RoleGuard>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/auth/login'} replace />} />
    </Routes>
  );
};

export default Router;

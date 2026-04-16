import axiosInstance from '../../utils/http/axiosInstance';

const behaviorAdminService = {
  getWeeklyConfigs: () => axiosInstance.get('/api/admin/weekly-configs').then((res) => res.data),
  getWeeklySummary: (weekId) =>
    axiosInstance.get(`/api/reports/summary/weekly/${weekId}`).then((res) => res.data),
  saveWeeklySummary: (data) =>
    axiosInstance.post('/api/reports/summary/weekly', data).then((res) => res.data),
  createWeeklyConfig: (payload) =>
    axiosInstance.post('/api/admin/weekly-configs', payload).then((res) => res.data),
  updateWeeklyConfig: (id, payload) =>
    axiosInstance.patch(`/api/admin/weekly-configs/${id}`, payload).then((res) => res.data),
  deleteWeeklyConfig: (id) =>
    axiosInstance.delete(`/api/admin/weekly-configs/${id}`).then((res) => res.data),

  getJourneyPhaseConfigs: () =>
    axiosInstance.get('/api/admin/journey-phase-configs').then((res) => res.data),
  createJourneyPhaseConfig: (payload) =>
    axiosInstance.post('/api/admin/journey-phase-configs', payload).then((res) => res.data),
  updateJourneyPhaseConfig: (id, payload) =>
    axiosInstance.patch(`/api/admin/journey-phase-configs/${id}`, payload).then((res) => res.data),
};

export default behaviorAdminService;

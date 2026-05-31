import axiosInstance from '../../utils/http/axiosInstance';

const behaviorAdminService = {
  getWeeklyConfigs: () => axiosInstance.get('/api/admin/weekly-configs').then((res) => res.data),
  getWeeklySummary: (weekId, unitId) => {
    let url = `/api/reports/summary/weekly/${weekId}`;
    if (unitId) {
      url += `?unitId=${unitId}`;
    }
    return axiosInstance.get(url).then((res) => res.data);
  },
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
  getCoachingPhaseConfigs: () =>
    axiosInstance.get('/api/admin/coaching-phase-configs').then((res) => res.data),
  createCoachingPhaseConfig: (payload) =>
    axiosInstance.post('/api/admin/coaching-phase-configs', payload).then((res) => res.data),
  updateCoachingPhaseConfig: (id, payload) =>
    axiosInstance.patch(`/api/admin/coaching-phase-configs/${id}`, payload).then((res) => res.data),
};

export default behaviorAdminService;

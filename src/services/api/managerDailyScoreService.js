import axiosInstance from '../../utils/http/axiosInstance';

const managerDailyScoreService = {
  getCriteria: () => axiosInstance.get('/manager-daily-scores/criteria').then((res) => res.data),
  getEmployees: (keyword) =>
    axiosInstance
      .get('/manager-daily-scores/employees', { params: { keyword } })
      .then((res) => res.data),
  getEntry: (employeeId, scoreDate) =>
    axiosInstance
      .get('/manager-daily-scores/entry', { params: { employeeId, scoreDate } })
      .then((res) => res.data),
  submitEntry: (payload) =>
    axiosInstance.post('/manager-daily-scores/entry', payload).then((res) => res.data),
  getStatistics: (filters) =>
    axiosInstance.get('/manager-daily-scores/statistics', { params: filters }).then((res) => res.data),
  getAdminCriteria: () =>
    axiosInstance.get('/manager-daily-scores/admin/criteria').then((res) => res.data),
  createCriterion: (payload) =>
    axiosInstance.post('/manager-daily-scores/admin/criteria', payload).then((res) => res.data),
  updateCriterion: (id, payload) =>
    axiosInstance.patch(`/manager-daily-scores/admin/criteria/${id}`, payload).then((res) => res.data),
  deleteCriterion: (id) =>
    axiosInstance.delete(`/manager-daily-scores/admin/criteria/${id}`).then((res) => res.data),
};

export default managerDailyScoreService;

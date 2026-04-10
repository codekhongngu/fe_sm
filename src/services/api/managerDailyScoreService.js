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
};

export default managerDailyScoreService;

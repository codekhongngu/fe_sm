import axiosInstance from '../../utils/http/axiosInstance';

const REPORT_REQUEST_TIMEOUT = 30000;

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
  importPerformanceData: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance
      .post('/manager-daily-scores/import-performance-data', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  },
  downloadImportPerformanceTemplate: () =>
    axiosInstance
      .get('/manager-daily-scores/import-performance-template', {
        responseType: 'blob',
        timeout: REPORT_REQUEST_TIMEOUT,
      })
      .then((res) => ({
        blob: res.data,
        fileName:
          res.headers?.['content-disposition']
            ?.match(/filename="?([^"]+)"?/)?.[1] || 'mau-import-so-lieu-cham-diem.xlsx',
      })),
  getStatistics: (filters) =>
    axiosInstance
      .get('/manager-daily-scores/statistics', {
        params: filters,
        timeout: REPORT_REQUEST_TIMEOUT,
      })
      .then((res) => res.data),
  getTncCompetition: (filters) =>
    axiosInstance
      .get('/manager-daily-scores/tnc-competition', {
        params: filters,
        timeout: REPORT_REQUEST_TIMEOUT,
      })
      .then((res) => res.data),
  exportTncCompetition: (filters) =>
    axiosInstance
      .get('/manager-daily-scores/tnc-competition-export', {
        params: filters,
        responseType: 'blob',
        timeout: REPORT_REQUEST_TIMEOUT,
      })
      .then((res) => ({
        blob: res.data,
        fileName:
          res.headers?.['content-disposition']
            ?.match(/filename="?([^"]+)"?/)?.[1] || 'thi-dua-tnc.xlsx',
      })),
  exportStatistics: (filters) =>
    axiosInstance
      .get('/manager-daily-scores/statistics-export', {
        params: filters,
        responseType: 'blob',
        timeout: REPORT_REQUEST_TIMEOUT,
      })
      .then((res) => ({
        blob: res.data,
        fileName:
          res.headers?.['content-disposition']
            ?.match(/filename="?([^"]+)"?/)?.[1] || 'thong-ke-cham-diem.xlsx',
      })),
  exportProvincialStatistics: (filters) =>
    axiosInstance
      .get('/manager-daily-scores/provincial-statistics-export', {
        params: filters,
        responseType: 'blob',
        timeout: REPORT_REQUEST_TIMEOUT,
      })
      .then((res) => ({
        blob: res.data,
        fileName:
          res.headers?.['content-disposition']
            ?.match(/filename="?([^"]+)"?/)?.[1] || 'bao-cao-thong-ke-toan-tinh.xlsx',
      })),
  exportUnitStatistics: (filters) =>
    axiosInstance
      .get('/manager-daily-scores/unit-statistics-export', {
        params: filters,
        responseType: 'blob',
        timeout: REPORT_REQUEST_TIMEOUT,
      })
      .then((res) => ({
        blob: res.data,
        fileName:
          res.headers?.['content-disposition']
            ?.match(/filename="?([^"]+)"?/)?.[1] || 'bao-cao-thong-ke-don-vi.xlsx',
      })),
  getAdminCriteria: () =>
    axiosInstance.get('/manager-daily-scores/admin/criteria').then((res) => res.data),
  createCriterion: (payload) =>
    axiosInstance.post('/manager-daily-scores/admin/criteria', payload).then((res) => res.data),
  updateCriterion: (id, payload) =>
    axiosInstance.patch(`/manager-daily-scores/admin/criteria/${id}`, payload).then((res) => res.data),
  deleteCriterion: (id) =>
    axiosInstance.delete(`/manager-daily-scores/admin/criteria/${id}`).then((res) => res.data),

  // Coaching Competition APIs
  getCoachingCompetitionReport: ({ user, fromDate, toDate, unitId = '' }) =>
    axiosInstance
      .get('/manager-daily-scores/coaching-competition-report', {
        params: { fromDate, toDate, unitId },
      })
      .then((res) => res.data),

  downloadCoachingCompetitionTemplate: () =>
    axiosInstance
      .get('/manager-daily-scores/coaching-competition-template', {
        responseType: 'blob',
        timeout: REPORT_REQUEST_TIMEOUT,
      })
      .then((res) => ({
        blob: res.data,
        fileName:
          res.headers?.['content-disposition']
            ?.match(/filename="?([^"]+)"?/)?.[1] || 'coaching-competition-template.xlsx',
      })),

  importCoachingCompetitionData: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance
      .post('/manager-daily-scores/coaching-competition-import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((res) => res.data);
  },
};

export default managerDailyScoreService;

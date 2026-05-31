import axiosInstance from '../../utils/http/axiosInstance';

const journalService = {
  create: (payload) => axiosInstance.post('/journals', payload).then((res) => res.data),
  submitAwareness: (payload) =>
    axiosInstance.post('/journals/eform-awareness', payload).then((res) => res.data),
  submitStandards: (payload) =>
    axiosInstance.post('/journals/eform-standards', payload).then((res) => res.data),
  submitBehavior: (payload) =>
    axiosInstance.post('/api/logs/submit', { formType: 'FORM_2', data: payload }).then((res) => res.data),
  submitLog: (formType, payload) =>
    axiosInstance.post('/api/logs/submit', { formType, ...payload }).then((res) => res.data),
  getLogsHistory: (userId, logDate) =>
    axiosInstance.get('/api/logs/history', { params: { userId, logDate } }).then((res) => res.data),
  getJourneyTimelineFormStatuses: (params) =>
    axiosInstance.get('/api/journey/timeline-form-statuses', { params }).then((res) => res.data),
  getDailyCoachingCustomers: (logDate, coachingForm) =>
    axiosInstance
      .get('/api/coaching-customers', { params: { logDate, coachingForm } })
      .then((res) => res.data),
  saveDailyCoachingCustomer: (payload) =>
    axiosInstance.post('/api/coaching-customers', payload).then((res) => res.data),
  importDailyCoachingCustomers: (file, logDate, coachingForm) => {
    const formData = new FormData();
    formData.append('file', file);
    if (logDate) {
      formData.append('logDate', logDate);
    }
    if (coachingForm) {
      formData.append('coachingForm', coachingForm);
    }
    return axiosInstance
      .post('/api/coaching-customers/import-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  },
  downloadDailyCoachingCustomersTemplate: (coachingForm) =>
    axiosInstance
      .get('/api/coaching-customers/import-template', {
        params: { coachingForm },
        responseType: 'blob',
      })
      .then((res) => res.data),
  shareTelegram: (payload) =>
    axiosInstance.post('/telegram/share', payload).then((res) => res.data),
  getList: (params) => axiosInstance.get('/journals', { params }).then((res) => res.data),
  getById: (id) => axiosInstance.get(`/journals/${id}`).then((res) => res.data),
  getWeeklyConfigs: () => axiosInstance.get('/api/weekly-configs').then((res) => res.data),
  getJourneyPhaseConfigs: () => axiosInstance.get('/api/journey-phase-configs').then((res) => res.data),
  getCoachingPhaseConfigs: () => axiosInstance.get('/api/coaching-phase-configs').then((res) => res.data),
  getWeeklyJournals: (weekId) =>
    axiosInstance.get('/api/weekly-journals', { params: { weekId } }).then((res) => res.data),
  exportManagerWeeklyJournals: (params) =>
    axiosInstance
      .get('/api/manager/weekly-journals/export', { params, responseType: 'blob' })
      .then((res) => ({
        blob: res.data,
        fileName:
          res.headers?.['content-disposition']?.match(/filename="?([^"]+)"?/)?.[1] ||
          'bao-cao-duyet-nhat-ky-tuan.xlsx',
      })),
  exportManagerWeeklyJournalsStatus: (params) =>
    axiosInstance
      .get('/api/manager/weekly-journals/export-status', { params, responseType: 'blob' })
      .then((res) => ({
        blob: res.data,
        fileName:
          res.headers?.['content-disposition']?.match(/filename="?([^"]+)"?/)?.[1] ||
          'bao-cao-trang-thai-mau-10-11.xlsx',
      })),
  exportManagerWeeklyJournalsStatusByUnit: (params) =>
    axiosInstance
      .get('/api/manager/weekly-journals/export-status-by-unit', {
        params,
        responseType: 'blob',
      })
      .then((res) => ({
        blob: res.data,
        fileName:
          res.headers?.['content-disposition']?.match(/filename="?([^"]+)"?/)?.[1] ||
          'bao-cao-mau-10-11-theo-don-vi.xlsx',
      })),
  submitWeeklyJournal: (payload) =>
    axiosInstance.post('/api/weekly-journals/submit', payload).then((res) => res.data),
  getApprovedJournals: (params) =>
    axiosInstance.get('/api/manager/journals/approved', { params }).then((res) => res.data),
  exportApprovedJournalsStatus: (params) =>
    axiosInstance
      .get('/api/manager/journals/approved/export-status', { params, responseType: 'blob' })
      .then((res) => ({
        blob: res.data,
        fileName:
          res.headers?.['content-disposition']?.match(/filename="?([^"]+)"?/)?.[1] ||
          'bao-cao-mau-da-duyet.xlsx',
      })),
  exportApprovedJournalsStatusForms2345: (params) =>
    axiosInstance
      .get('/api/manager/journals/approved/export-status-forms-2-3-4-5', {
        params,
        responseType: 'blob',
      })
      .then((res) => ({
        blob: res.data,
        fileName:
          res.headers?.['content-disposition']?.match(/filename="?([^"]+)"?/)?.[1] ||
          'bao-cao-trang-thai-mau-2-3-4-5.xlsx',
      })),
  exportApprovedJournalsForms2345: (params) =>
    axiosInstance
      .get('/api/manager/journals/approved/export-forms-2-3-4-5', { params, responseType: 'blob' })
      .then((res) => ({
        blob: res.data,
        fileName:
          res.headers?.['content-disposition']?.match(/filename="?([^"]+)"?/)?.[1] ||
          'bao-cao-mau-2-3-4-5.xlsx',
      })),
  getJournalSubmissionsStats: (date) =>
    axiosInstance.get('/api/reports/journal-submissions', { params: { date } }).then((res) => res.data),
  getCoachingProvincialData: (params) =>
    axiosInstance.get('/api/reports/coaching-provincial-data', { params }).then((res) => res.data),
  exportCoachingProvincial: (params) =>
    axiosInstance
      .get('/api/reports/coaching-provincial-export', { params, responseType: 'blob' })
      .then((res) => ({
        blob: res.data,
        fileName:
          res.headers?.['content-disposition']?.match(/filename="?([^"]+)"?/)?.[1] ||
          'bao-cao-coaching-toan-tinh.xlsx',
      })),
  getCoachingProvincialSummary: (params) =>
    axiosInstance.get('/api/reports/coaching-provincial-summary', { params }).then((res) => res.data),
  exportCoachingProvincialSummary: (params) =>
    axiosInstance
      .get('/api/reports/coaching-provincial-summary-export', { params, responseType: 'blob' })
      .then((res) => ({
        blob: res.data,
        fileName:
          res.headers?.['content-disposition']?.match(/filename="?([^"]+)"?/)?.[1] ||
          'bao-cao-coaching-tong-hop.xlsx',
      })),
  getCoachingProvincialGd2Data: (params) =>
    axiosInstance.get('/api/reports/coaching-provincial-gd2-data', { params }).then((res) => res.data),
  exportCoachingProvincialGd2: (params) =>
    axiosInstance
      .get('/api/reports/coaching-provincial-gd2-export', { params, responseType: 'blob' })
      .then((res) => ({
        blob: res.data,
        fileName:
          res.headers?.['content-disposition']?.match(/filename="?([^"]+)"?/)?.[1] ||
          'bao-cao-coaching-gd2.xlsx',
      })),
};

export default journalService;

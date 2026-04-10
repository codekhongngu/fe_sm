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
  shareTelegram: (payload) =>
    axiosInstance.post('/telegram/share', payload).then((res) => res.data),
  getList: (params) => axiosInstance.get('/journals', { params }).then((res) => res.data),
  getById: (id) => axiosInstance.get(`/journals/${id}`).then((res) => res.data),
};

export default journalService;

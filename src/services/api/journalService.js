import axiosInstance from '../../utils/http/axiosInstance';

const journalService = {
  create: (payload) => axiosInstance.post('/journals', payload).then((res) => res.data),
  submitAwareness: (payload) =>
    axiosInstance.post('/journals/eform-awareness', payload).then((res) => res.data),
  submitStandards: (payload) =>
    axiosInstance.post('/journals/eform-standards', payload).then((res) => res.data),
  getList: (params) => axiosInstance.get('/journals', { params }).then((res) => res.data),
  getById: (id) => axiosInstance.get(`/journals/${id}`).then((res) => res.data),
};

export default journalService;

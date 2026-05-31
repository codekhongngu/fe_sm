import axiosInstance from '../../utils/http/axiosInstance';

const managerCoachingService = {
  getEmployees: () =>
    axiosInstance.get('/api/manager/coaching-logs/employees').then((res) => res.data),
  getList: (params) =>
    axiosInstance.get('/api/manager/coaching-logs', { params }).then((res) => res.data),
  create: (payload) =>
    axiosInstance.post('/api/manager/coaching-logs', payload).then((res) => res.data),
  update: (id, payload) =>
    axiosInstance.patch(`/api/manager/coaching-logs/${id}`, payload).then((res) => res.data),
  remove: (id) =>
    axiosInstance.delete(`/api/manager/coaching-logs/${id}`).then((res) => res.data),
  exportExcel: (params) =>
    axiosInstance
      .get('/api/manager/coaching-logs/export', { params, responseType: 'blob' })
      .then((res) => ({
        blob: res.data,
        fileName:
          res.headers?.['content-disposition']?.match(/filename="?([^"]+)"?/)?.[1] ||
          'phieu-coaching-quan-ly.xlsx',
      })),
};

export default managerCoachingService;

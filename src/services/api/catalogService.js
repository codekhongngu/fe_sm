import axiosInstance from '../../utils/http/axiosInstance';

const catalogService = {
  list: (category) =>
    axiosInstance
      .get('/api/catalogs', { params: category ? { category } : {} })
      .then((res) => res.data),
  create: (payload) => axiosInstance.post('/api/catalogs', payload).then((res) => res.data),
  deactivate: (id) =>
    axiosInstance.patch(`/api/catalogs/${id}/deactivate`).then((res) => res.data),
  listWards: () => axiosInstance.get('/api/catalogs', { params: { category: 'WARD' } }).then((res) => res.data),
  createWard: (payload) =>
    axiosInstance.post('/api/catalogs', { ...payload, category: 'WARD', price: 0 }).then((res) => res.data),
  importWardsExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance
      .post('/api/catalogs/wards/import-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  },
  downloadWardTemplate: () =>
    axiosInstance
      .get('/api/catalogs/wards/import-template', { responseType: 'blob' })
      .then((res) => res.data),
};

export default catalogService;

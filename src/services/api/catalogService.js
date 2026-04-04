import axiosInstance from '../../utils/http/axiosInstance';

const catalogService = {
  list: () => axiosInstance.get('/catalogs').then((res) => res.data),
  create: (payload) => axiosInstance.post('/catalogs', payload).then((res) => res.data),
  deactivate: (id) =>
    axiosInstance.patch(`/catalogs/${id}/deactivate`).then((res) => res.data),
};

export default catalogService;

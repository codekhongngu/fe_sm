import axiosInstance from '../../utils/http/axiosInstance';

const userService = {
  getList: () => axiosInstance.get('/users').then((res) => res.data),
  createUser: (payload) => axiosInstance.post('/users', payload).then((res) => res.data),
  updateUser: (id, payload) => axiosInstance.patch(`/users/${id}`, payload).then((res) => res.data),
  resetPassword: (id, newPassword) =>
    axiosInstance.patch(`/users/${id}/reset-password`, { newPassword }).then((res) => res.data),
  changeMyPassword: (payload) =>
    axiosInstance.patch('/users/me/change-password', payload).then((res) => res.data),
  getUnits: () => axiosInstance.get('/users/units').then((res) => res.data),
  createUnit: (payload) => axiosInstance.post('/users/units', payload).then((res) => res.data),
  updateUnit: (id, payload) =>
    axiosInstance.patch(`/users/units/${id}`, payload).then((res) => res.data),
  deleteUnit: (id) => axiosInstance.delete(`/users/units/${id}`).then((res) => res.data),
  updateRole: (id, role) =>
    axiosInstance.patch(`/users/${id}/role`, { role }).then((res) => res.data),
  updateUserUnit: (id, unitId) =>
    axiosInstance.patch(`/users/${id}/unit`, { unitId }).then((res) => res.data),
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance
      .post('/users/import-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  },
};

export default userService;

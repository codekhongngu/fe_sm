import axiosInstance from '../../utils/http/axiosInstance';

const authService = {
  login: (payload) => axiosInstance.post('/auth/login', payload).then((res) => res.data),
};

export default authService;

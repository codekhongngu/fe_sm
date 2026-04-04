import axiosInstance from '../../utils/http/axiosInstance';

const dashboardService = {
  getBehaviorAnalytics: (params) =>
    axiosInstance.get('/dashboard/behavior-analytics', { params }).then((res) => res.data),
};

export default dashboardService;

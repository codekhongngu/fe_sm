import axiosInstance from '../../utils/http/axiosInstance';

const evaluationService = {
  create: (payload) => axiosInstance.post('/evaluations', payload).then((res) => res.data),
  updateByJournalId: (journalId, payload) =>
    axiosInstance.patch(`/evaluations/${journalId}`, payload).then((res) => res.data),
  updateAwarenessByJournalId: (journalId, payload) =>
    axiosInstance
      .patch(`/evaluations/${journalId}/awareness`, payload)
      .then((res) => res.data),
  updateStandardsByJournalId: (journalId, payload) =>
    axiosInstance
      .patch(`/evaluations/${journalId}/standards`, payload)
      .then((res) => res.data),
  getPendingList: () => axiosInstance.get('/evaluations/pending/list').then((res) => res.data),
  getWeeklyAnalytics: () =>
    axiosInstance.get('/evaluations/analytics/weekly').then((res) => res.data),
};

export default evaluationService;

const JournalCard = ({ journal, onSelect }) => {
  const self = journal?.standardsKept || {};
  const manager = journal?.evaluation || {};
  const hasMismatch =
    (self.deepInquiry && manager.deepInquiryStatus === false) ||
    (self.fullConsult && manager.fullProposalStatus === false) ||
    (self.persistence && manager.persistenceStatus === false);

  const awarenessDone = !journal?.awarenessSubmittedAt || manager.awarenessReviewed;
  const standardsDone = !journal?.standardsSubmittedAt || manager.standardsReviewed;
  const statusText =
    awarenessDone && standardsDone
      ? 'Hoàn thành'
      : journal?.awarenessSubmittedAt || journal?.standardsSubmittedAt
        ? 'Chờ sếp chấm'
        : 'Cần nộp ngay';

  return (
    <button
      type="button"
      className={`review-card ${hasMismatch ? 'mismatch' : ''}`}
      onClick={() => onSelect(journal)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <strong>{journal?.user?.fullName || journal?.user?.username}</strong>
        <span className="review-status">{statusText}</span>
      </div>
      <div style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>
        Ngày: {journal?.reportDate || '-'} | Đơn vị: {journal?.user?.unit?.name || '-'}
      </div>
      <div style={{ marginTop: 6, color: hasMismatch ? '#dc2626' : '#0f766e', fontSize: 13 }}>
        {hasMismatch ? 'Có sai lệch tự tích/chấm điểm' : 'Không có sai lệch đáng chú ý'}
      </div>
      <div style={{ marginTop: 4, color: '#64748b', fontSize: 12 }}>
        Nhận diện: {awarenessDone ? 'Đã chấm' : 'Chưa chấm'} | Giữ chuẩn:{' '}
        {standardsDone ? 'Đã chấm' : 'Chưa chấm'}
      </div>
    </button>
  );
};

export default JournalCard;

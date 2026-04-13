const JournalCard = ({ journal, onSelect }) => {
  const self = journal?.standardsKept || {};
  const manager = journal?.evaluation || {};
  const hasMismatch =
    (self.deepInquiry && manager.deepInquiryStatus === false) ||
    (self.fullConsult && manager.fullProposalStatus === false) ||
    (self.persistence && manager.persistenceStatus === false);

  const awarenessDone = !journal?.awarenessSubmittedAt || manager.awarenessReviewed;
  const standardsDone = !journal?.standardsSubmittedAt || manager.standardsReviewed;

  const isPending = !awarenessDone || !standardsDone || journal?.hasPendingOtherForms || journal?.hasPendingForm2;
  const statusText = isPending ? 'Chờ sếp chấm' : 'Đã duyệt';

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
        {hasMismatch ? 'Có sai lệch tự tích/chấm điểm' : isPending ? 'Đang có mẫu chờ duyệt' : 'Tất cả các mẫu đã được duyệt'}
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: '#2563eb' }}>
        Bấm để mở trang đánh giá chi tiết
      </div>
    </button>
  );
};

export default JournalCard;

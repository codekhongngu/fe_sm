import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../utils/http/axiosInstance';
import evaluationService from '../../../services/api/evaluationService';
import journalService from '../../../services/api/journalService';
import JournalCard from '../components/JournalCard';
import Form2BehaviorChecklist from '../components/v2/Form2BehaviorChecklist';

const ManagerReviewPage = () => {
  const navigate = useNavigate();
  const { journalId } = useParams();
  const isDetailMode = Boolean(journalId);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [statusText, setStatusText] = useState('');
  const [pendingJournals, setPendingJournals] = useState([]);
  const [selected, setSelected] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [dailyStatuses, setDailyStatuses] = useState({
    form1Awareness: 'PENDING',
    form1Standards: 'PENDING',
    form3: 'PENDING',
    form4: 'PENDING',
    form5: 'PENDING',
    form7: 'PENDING',
    form8: 'PENDING',
    form9: 'PENDING',
    form12: 'PENDING',
  });
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [employeeKeyword, setEmployeeKeyword] = useState('');

  const loadData = async () => {
    setLoading(true);
    setErrorText('');
    try {
      const [pending, weekly] = await Promise.all([
        evaluationService.getPendingList(),
        evaluationService.getWeeklyAnalytics(),
      ]);
      setPendingJournals(Array.isArray(pending) ? pending : []);
      setAnalytics(weekly || null);
      if (journalId) {
        const detail = await journalService.getById(journalId);
        const targetUserId = detail.userId || detail.user?.id;
        const logDate = detail.reportDate;
        let extraLogsData = {};
        if (targetUserId && logDate) {
          extraLogsData = await journalService.getLogsHistory(targetUserId, logDate).catch(() => ({}));
        }

        detail.behaviorLogId = extraLogsData?.form2?.id || '';
        detail.customersMet = extraLogsData?.form2?.customerMetCount ?? detail.customersMet;
        detail.deepInquiry = extraLogsData?.form2?.askedDeepQuestion ?? detail.deepInquiry;
        detail.fullConsult = extraLogsData?.form2?.fullConsultation ?? detail.fullConsult;
        detail.persistence = extraLogsData?.form2?.followedThrough ?? detail.persistence;

        if (extraLogsData?.form2) {
          detail.form2Status = extraLogsData.form2.status || 'PENDING';
          detail.form2MgrEvalDeepQ = !!extraLogsData.form2.mgrEvalDeepQ;
          detail.form2MgrEvalFullCons = !!extraLogsData.form2.mgrEvalFullCons;
          detail.form2MgrEvalFollow = !!extraLogsData.form2.mgrEvalFollow;
        }

        detail.form3OldMindset = extraLogsData?.form3?.negativeThought || '';
        detail.form3NewMindset = extraLogsData?.form3?.newMindset || '';
        detail.form3ActionChange = extraLogsData?.form3?.behaviorChange || '';
        
        detail.form4Rows = Array.isArray(extraLogsData?.form4)
          ? extraLogsData.form4.map((item) => ({
              customerName: item.customerName || '',
              customerIssue: item.customerIssue || '',
              consequence: item.consequence || '',
              solutionOffered: item.solutionOffered || '',
              valueBasedPricing: item.valueBasedPricing || '',
              result: item.result || '',
            }))
          : [];
        
        detail.form5Lesson = extraLogsData?.form5?.tomorrowLesson || '';
        detail.form5Action = extraLogsData?.form5?.differentAction || '';
        
        detail.form8Rows = Array.isArray(extraLogsData?.form8)
          ? extraLogsData.form8.map((item) => ({
              situation: item.situation || '',
              oldBelief: item.oldBelief || '',
              newChosenBelief: item.newChosenBelief || '',
              newBehavior: item.newBehavior || '',
              result: item.result || '',
            }))
          : [];
        detail.form7KeptStandard = extraLogsData?.form7?.keptStandard || '';
        detail.form7BackslideSign = extraLogsData?.form7?.backslideSign || '';
        detail.form7Solution = extraLogsData?.form7?.solution || '';
        detail.form9SelfLimitArea = extraLogsData?.form9?.selfLimitArea || '';
        detail.form9ProofBehavior = extraLogsData?.form9?.proofBehavior || '';
        detail.form9RaiseStandard = extraLogsData?.form9?.raiseStandard || '';
        detail.form9ActionPlan = extraLogsData?.form9?.actionPlan || '';
        detail.form12DeclarationText = extraLogsData?.form12?.declarationText || '';
        detail.form12CommitmentSignature = extraLogsData?.form12?.commitmentSignature || '';
        const reviews = extraLogsData?.reviews || {};
        setDailyStatuses({
          form1Awareness: reviews?.FORM_1_AWARENESS?.status || 'PENDING',
          form1Standards: reviews?.FORM_1_STANDARDS?.status || 'PENDING',
          form3: reviews?.FORM_3?.status || 'PENDING',
          form4: reviews?.FORM_4?.status || 'PENDING',
          form5: reviews?.FORM_5?.status || 'PENDING',
          form7: reviews?.FORM_7?.status || 'PENDING',
          form8: reviews?.FORM_8?.status || 'PENDING',
          form9: reviews?.FORM_9?.status || 'PENDING',
          form12: reviews?.FORM_12?.status || 'PENDING',
        });

        setSelected(detail);
      } else {
        setSelected(null);
      }
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Không tải được danh sách chờ đánh giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [journalId]);

  const filteredPendingJournals = useMemo(() => {
    return pendingJournals.filter((journal) => {
      const reportDate = String(journal?.reportDate || '');
      const fullName = String(journal?.user?.fullName || '').toLowerCase();
      const username = String(journal?.user?.username || '').toLowerCase();
      const keyword = employeeKeyword.trim().toLowerCase();
      const matchDateFrom = !fromDate || reportDate >= fromDate;
      const matchDateTo = !toDate || reportDate <= toDate;
      const matchEmployee =
        !keyword || fullName.includes(keyword) || username.includes(keyword);
      return matchDateFrom && matchDateTo && matchEmployee;
    });
  }, [pendingJournals, fromDate, toDate, employeeKeyword]);

  useEffect(() => {
    if (journalId) {
      return;
    }
    if (!selected?.id) {
      return;
    }
    const stillVisible = filteredPendingJournals.some((item) => item.id === selected.id);
    if (!stillVisible) {
      setSelected(null);
    }
  }, [filteredPendingJournals, selected?.id]);

  const chooseJournal = async (journal) => {
    setErrorText('');
    navigate(`/discipline/manager-review/${journal.id}`);
  };

  const reviewUrl = useMemo(() => {
    if (!selected?.id) {
      return '';
    }
    return `${window.location.origin}/discipline/manager-review/${selected.id}`;
  }, [selected?.id]);

  const copyReviewUrl = async () => {
    if (!reviewUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(reviewUrl);
      setStatusText('Đã sao chép URL đánh giá riêng');
    } catch (error) {
      setErrorText('Không thể sao chép URL');
    }
  };

  const hasForm2 = !!selected?.behaviorLogId;
  const hasForm3 = !!(selected?.form3OldMindset || selected?.form3NewMindset || selected?.form3ActionChange);
  const hasForm4 = Array.isArray(selected?.form4Rows) && selected.form4Rows.length > 0;
  const hasForm5 = !!(selected?.form5Lesson || selected?.form5Action);
  const hasForm7 = !!(selected?.form7KeptStandard || selected?.form7BackslideSign || selected?.form7Solution);
  const hasForm8 = Array.isArray(selected?.form8Rows) && selected.form8Rows.length > 0;
  const hasForm9 = !!(
    selected?.form9SelfLimitArea ||
    selected?.form9ProofBehavior ||
    selected?.form9RaiseStandard ||
    selected?.form9ActionPlan
  );
  const hasForm12 = !!(selected?.form12DeclarationText || selected?.form12CommitmentSignature);

  const patchReview = async (payload, okText) => {
    if (!selected?.id) return;
    setSaving(true);
    setErrorText('');
    setStatusText('');
    try {
      await axiosInstance.patch('/api/manager/journals/review-daily', {
        journalId: selected.id,
        ...payload,
      });
      setStatusText(okText);
      await loadData();
    } catch (e) {
      setErrorText(e?.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleFormAction = async (formKey, action) => {
    const statuses = {};
    if (action === 'approve') statuses[formKey] = 'APPROVED';
    if (action === 'return') statuses[formKey] = 'REJECTED';
    const statusTextByAction =
      action === 'approve' ? 'Đã duyệt mẫu' : action === 'return' ? 'Đã trả lại mẫu cho nhân viên' : 'Đã lưu mẫu';

    if (formKey === 'form1Awareness') {
      return patchReview(
        {
          avoidance: selected?.avoidance || '',
          selfLimit: selected?.selfLimit || '',
          earlyStop: selected?.earlyStop || '',
          blaming: selected?.blaming || '',
          statuses,
        },
        statusTextByAction,
      );
    }
    if (formKey === 'form1Standards') {
      return patchReview(
        {
          standardsKeptText: selected?.standardsKeptText || '',
          backslideSigns: selected?.backslideSigns || '',
          solution: selected?.solution || '',
          statuses,
        },
        statusTextByAction,
      );
    }
    if (formKey === 'form3') {
      return patchReview(
        {
          form3NegativeThought: selected?.form3OldMindset || '',
          form3NewMindset: selected?.form3NewMindset || '',
          form3BehaviorChange: selected?.form3ActionChange || '',
          statuses,
        },
        statusTextByAction,
      );
    }
    if (formKey === 'form4') {
      return patchReview({ form4Rows: selected?.form4Rows || [], statuses }, statusTextByAction);
    }
    if (formKey === 'form5') {
      return patchReview(
        {
          form5TomorrowLesson: selected?.form5Lesson || '',
          form5DifferentAction: selected?.form5Action || '',
          statuses,
        },
        statusTextByAction,
      );
    }
    if (formKey === 'form7') {
      return patchReview(
        {
          form7KeptStandard: selected?.form7KeptStandard || '',
          form7BackslideSign: selected?.form7BackslideSign || '',
          form7Solution: selected?.form7Solution || '',
          statuses,
        },
        statusTextByAction,
      );
    }
    if (formKey === 'form8') {
      return patchReview({ form8Rows: selected?.form8Rows || [], statuses }, statusTextByAction);
    }
    if (formKey === 'form9') {
      return patchReview(
        {
          form9SelfLimitArea: selected?.form9SelfLimitArea || '',
          form9ProofBehavior: selected?.form9ProofBehavior || '',
          form9RaiseStandard: selected?.form9RaiseStandard || '',
          form9ActionPlan: selected?.form9ActionPlan || '',
          statuses,
        },
        statusTextByAction,
      );
    }
    if (formKey === 'form12') {
      return patchReview(
        {
          form12DeclarationText: selected?.form12DeclarationText || '',
          form12CommitmentSignature: selected?.form12CommitmentSignature || '',
          statuses,
        },
        statusTextByAction,
      );
    }
  };

  const approveAllForms = async () => {
    const statuses = {};
    if (selected?.awarenessSubmittedAt || selected?.avoidance || selected?.selfLimit || selected?.earlyStop || selected?.blaming) statuses.form1Awareness = 'APPROVED';
    if (selected?.standardsSubmittedAt || selected?.standardsKeptText || selected?.backslideSigns || selected?.solution) statuses.form1Standards = 'APPROVED';
    if (hasForm3) statuses.form3 = 'APPROVED';
    if (hasForm4) statuses.form4 = 'APPROVED';
    if (hasForm5) statuses.form5 = 'APPROVED';
    if (hasForm7) statuses.form7 = 'APPROVED';
    if (hasForm8) statuses.form8 = 'APPROVED';
    if (hasForm9) statuses.form9 = 'APPROVED';
    if (hasForm12) statuses.form12 = 'APPROVED';
    return patchReview({ statuses }, 'Đã duyệt tất cả các mẫu hiện có trong ngày');
  };

  const saveDailyReview = async () => {
    if (!selected?.id) {
      return;
    }
    setSaving(true);
    setErrorText('');
    setStatusText('');
    try {
      await axiosInstance.patch('/api/manager/journals/review-daily', {
        journalId: selected.id,
        avoidance: selected.avoidance || '',
        selfLimit: selected.selfLimit || '',
        earlyStop: selected.earlyStop || '',
        blaming: selected.blaming || '',
        standardsKeptText: selected.standardsKeptText || '',
        backslideSigns: selected.backslideSigns || '',
        solution: selected.solution || '',
        form3NegativeThought: selected.form3OldMindset || '',
        form3NewMindset: selected.form3NewMindset || '',
        form3BehaviorChange: selected.form3ActionChange || '',
        form4Rows: selected.form4Rows || [],
        form5TomorrowLesson: selected.form5Lesson || '',
        form5DifferentAction: selected.form5Action || '',
        form7KeptStandard: selected.form7KeptStandard || '',
        form7BackslideSign: selected.form7BackslideSign || '',
        form7Solution: selected.form7Solution || '',
        form8Rows: selected.form8Rows || [],
        form9SelfLimitArea: selected.form9SelfLimitArea || '',
        form9ProofBehavior: selected.form9ProofBehavior || '',
        form9RaiseStandard: selected.form9RaiseStandard || '',
        form9ActionPlan: selected.form9ActionPlan || '',
        form12DeclarationText: selected.form12DeclarationText || '',
        form12CommitmentSignature: selected.form12CommitmentSignature || '',
        statuses: dailyStatuses,
      });
      setStatusText('Đã lưu chỉnh sửa và duyệt nội dung các mẫu');
      await loadData();
    } catch (e) {
      setErrorText(e?.response?.data?.message || 'Lưu duyệt nội dung thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="review-v3-shell">
      <div className="review-v3-main">
        <section className="review-title-block">
          <h1 style={{ margin: 0 }}>
            {isDetailMode ? 'Đánh giá chi tiết nhật ký nhân viên' : 'Tra cứu nhật ký nhân viên'}
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b' }}>
            {isDetailMode
              ? 'Thực hiện đánh giá chi tiết theo từng hồ sơ nhân viên.'
              : 'Tra cứu hồ sơ và mở trang đánh giá chi tiết theo từng nhân viên.'}
          </p>
        </section>

        {analytics ? (
          <div className="cards-grid" style={{ marginBottom: 12 }}>
            <div className="card">Hỏi sâu: {analytics.deepInquiryRate}%</div>
            <div className="card">Đề xuất đủ: {analytics.fullProposalRate}%</div>
            <div className="card">Theo đến quyết: {analytics.persistenceRate}%</div>
          </div>
        ) : null}

        {statusText ? <div className="status-ok" style={{ marginBottom: 8 }}>{statusText}</div> : null}
        {errorText ? <div className="status-err" style={{ marginBottom: 8 }}>{errorText}</div> : null}
        {loading ? <div>Đang tải dữ liệu...</div> : null}
        <div className="card" style={{ marginBottom: 12 }}>
          <h3 style={{ marginTop: 0 }}>Bộ lọc</h3>
          <div className="filters">
            <input
              type="date"
              className="field"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <input
              type="date"
              className="field"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
            <input
              className="field"
              placeholder="Tìm nhân viên theo tên hoặc username"
              value={employeeKeyword}
              onChange={(e) => setEmployeeKeyword(e.target.value)}
            />
          </div>
        </div>

        <section className="card" style={{ marginBottom: 12 }}>
          <h3 style={{ marginTop: 0 }}>Danh sách hồ sơ chờ đánh giá</h3>
          <div className="review-pending-row">
            {filteredPendingJournals.map((journal) => (
              <JournalCard key={journal.id} journal={journal} onSelect={chooseJournal} />
            ))}
            {!loading && filteredPendingJournals.length === 0 ? (
              <div className="card">Không có nhật ký phù hợp bộ lọc.</div>
            ) : null}
          </div>
        </section>

        {isDetailMode && selected ? (
          <>
            <section className="review-info-card">
              <div className="review-info-head">
                <h3 style={{ margin: 0 }}>Thông tin nhân viên</h3>
                <span className="review-chip">Đang xử lý</span>
              </div>
              <div className="review-info-grid">
                <div>
                  <div className="review-label">Tên nhân viên</div>
                  <div className="review-value">{selected?.user?.fullName || '-'}</div>
                </div>
                <div>
                  <div className="review-label">Ngày đánh giá</div>
                  <div className="review-value">{selected?.reportDate || '-'}</div>
                </div>
                <div>
                  <div className="review-label">Tài khoản</div>
                  <div className="review-value">{selected?.user?.username || '-'}</div>
                </div>
              </div>
            </section>

            {(hasForm2 || hasForm3 || hasForm4 || hasForm5 || hasForm7 || hasForm8 || hasForm9 || hasForm12 || !!(selected?.avoidance || selected?.selfLimit || selected?.earlyStop || selected?.blaming || selected?.awarenessSubmittedAt) || !!(selected?.standardsKeptText || selected?.backslideSigns || selected?.solution || selected?.standardsSubmittedAt)) && (
              <section className="card" style={{ marginBottom: '20px' }}>
                <h3 style={{ marginTop: 0 }}>Chỉnh sửa & duyệt nội dung nhật ký ngày</h3>
                <div style={{ display: 'grid', gap: 10 }}>
                {!!(selected?.avoidance || selected?.selfLimit || selected?.earlyStop || selected?.blaming || selected?.awarenessSubmittedAt) && (
                  <div style={{ border: '1px solid #e5eaef', borderRadius: 8, padding: 10 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Mẫu 1: Nhận diện</div>
                    <div className="filters" style={{ marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Hôm nay tôi đã né điều gì?</div>
                        <textarea className="field" rows={2} value={selected?.avoidance || ''} onChange={(e) => setSelected((prev) => ({ ...prev, avoidance: e.target.value }))} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Tôi có tự loại gói nào không?</div>
                        <textarea className="field" rows={2} value={selected?.selfLimit || ''} onChange={(e) => setSelected((prev) => ({ ...prev, selfLimit: e.target.value }))} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Tôi đã dừng tư vấn sớm ở điểm nào?</div>
                        <textarea className="field" rows={2} value={selected?.earlyStop || ''} onChange={(e) => setSelected((prev) => ({ ...prev, earlyStop: e.target.value }))} />
                      </div>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Khi không bán được dịch vụ thường đổ lỗi gì?</div>
                      <textarea className="field" rows={2} value={selected?.blaming || ''} onChange={(e) => setSelected((prev) => ({ ...prev, blaming: e.target.value }))} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}> 
                      <button className="btn outline" onClick={() => handleFormAction('form1Awareness', 'save')} disabled={saving}>Lưu</button>
                      <button className="btn danger" onClick={() => handleFormAction('form1Awareness', 'return')} disabled={saving}>Trả lại</button>
                      <button className="btn" onClick={() => handleFormAction('form1Awareness', 'approve')} disabled={saving}>Duyệt</button>
                    </div>
                  </div>
                )}

                {!!(selected?.standardsKeptText || selected?.backslideSigns || selected?.solution || selected?.standardsSubmittedAt) && (
                  <div style={{ border: '1px solid #e5eaef', borderRadius: 8, padding: 10 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Mẫu 1: Giữ chuẩn</div>
                    <div className="filters" style={{ marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Hôm nay tôi giữ được chuẩn nào?</div>
                        <textarea className="field" rows={2} value={selected?.standardsKeptText || ''} onChange={(e) => setSelected((prev) => ({ ...prev, standardsKeptText: e.target.value }))} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Dấu hiệu tụt chuẩn?</div>
                        <textarea className="field" rows={2} value={selected?.backslideSigns || ''} onChange={(e) => setSelected((prev) => ({ ...prev, backslideSigns: e.target.value }))} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Tôi đã xử lý ra sao?</div>
                        <textarea className="field" rows={2} value={selected?.solution || ''} onChange={(e) => setSelected((prev) => ({ ...prev, solution: e.target.value }))} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button className="btn outline" onClick={() => handleFormAction('form1Standards', 'save')} disabled={saving}>Lưu</button>
                      <button className="btn danger" onClick={() => handleFormAction('form1Standards', 'return')} disabled={saving}>Trả lại</button>
                      <button className="btn" onClick={() => handleFormAction('form1Standards', 'approve')} disabled={saving}>Duyệt</button>
                    </div>
                  </div>
                )}

                {(hasForm3 || hasForm5 || hasForm7 || hasForm9 || hasForm12) && (
                  <div style={{ border: '1px solid #e5eaef', borderRadius: 8, padding: 10 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Các mẫu eForm văn bản</div>
                    <div className="filters" style={{ marginBottom: 8 }}>
                      {hasForm3 && (
                        <>
                          <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Mẫu 3 - Suy nghĩ tiêu cực</div><textarea className="field" rows={2} value={selected?.form3OldMindset || ''} onChange={(e) => setSelected((prev) => ({ ...prev, form3OldMindset: e.target.value }))} /></div>
                          <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Mẫu 3 - Tư duy mới</div><textarea className="field" rows={2} value={selected?.form3NewMindset || ''} onChange={(e) => setSelected((prev) => ({ ...prev, form3NewMindset: e.target.value }))} /></div>
                          <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Mẫu 3 - Hành vi thay đổi</div><textarea className="field" rows={2} value={selected?.form3ActionChange || ''} onChange={(e) => setSelected((prev) => ({ ...prev, form3ActionChange: e.target.value }))} /></div>
                        </>
                      )}
                      {hasForm5 && (
                        <>
                          <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Mẫu 5 - Bài học ngày mai</div><textarea className="field" rows={2} value={selected?.form5Lesson || ''} onChange={(e) => setSelected((prev) => ({ ...prev, form5Lesson: e.target.value }))} /></div>
                          <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Mẫu 5 - Việc sẽ làm khác đi</div><textarea className="field" rows={2} value={selected?.form5Action || ''} onChange={(e) => setSelected((prev) => ({ ...prev, form5Action: e.target.value }))} /></div>
                        </>
                      )}
                      {hasForm7 && (
                        <>
                          <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Mẫu 7 - Chuẩn đã giữ</div><textarea className="field" rows={2} value={selected?.form7KeptStandard || ''} onChange={(e) => setSelected((prev) => ({ ...prev, form7KeptStandard: e.target.value }))} /></div>
                          <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Mẫu 7 - Dấu hiệu tụt chuẩn</div><textarea className="field" rows={2} value={selected?.form7BackslideSign || ''} onChange={(e) => setSelected((prev) => ({ ...prev, form7BackslideSign: e.target.value }))} /></div>
                          <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Mẫu 7 - Cách xử lý</div><textarea className="field" rows={2} value={selected?.form7Solution || ''} onChange={(e) => setSelected((prev) => ({ ...prev, form7Solution: e.target.value }))} /></div>
                        </>
                      )}
                      {hasForm9 && (
                        <>
                          <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Mẫu 9 - Tự giới hạn thu nhập</div><textarea className="field" rows={2} value={selected?.form9SelfLimitArea || ''} onChange={(e) => setSelected((prev) => ({ ...prev, form9SelfLimitArea: e.target.value }))} /></div>
                          <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Mẫu 9 - Hành vi chứng minh</div><textarea className="field" rows={2} value={selected?.form9ProofBehavior || ''} onChange={(e) => setSelected((prev) => ({ ...prev, form9ProofBehavior: e.target.value }))} /></div>
                          <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Mẫu 9 - Nâng chuẩn thu nhập</div><textarea className="field" rows={2} value={selected?.form9RaiseStandard || ''} onChange={(e) => setSelected((prev) => ({ ...prev, form9RaiseStandard: e.target.value }))} /></div>
                          <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Mẫu 9 - Hành động cụ thể</div><textarea className="field" rows={2} value={selected?.form9ActionPlan || ''} onChange={(e) => setSelected((prev) => ({ ...prev, form9ActionPlan: e.target.value }))} /></div>
                        </>
                      )}
                      {hasForm12 && (
                        <>
                          <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Mẫu 12 - Tuyên ngôn nghề nghiệp</div><textarea className="field" rows={3} value={selected?.form12DeclarationText || ''} onChange={(e) => setSelected((prev) => ({ ...prev, form12DeclarationText: e.target.value }))} /></div>
                          <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Mẫu 12 - Ký tên, ngày cam kết</div><input className="field" value={selected?.form12CommitmentSignature || ''} onChange={(e) => setSelected((prev) => ({ ...prev, form12CommitmentSignature: e.target.value }))} /></div>
                        </>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      {hasForm3 && <><button className="btn outline" onClick={() => handleFormAction('form3', 'save')} disabled={saving}>Lưu Mẫu 3</button><button className="btn danger" onClick={() => handleFormAction('form3', 'return')} disabled={saving}>Trả lại Mẫu 3</button><button className="btn" onClick={() => handleFormAction('form3', 'approve')} disabled={saving}>Duyệt Mẫu 3</button></>}
                      {hasForm5 && <><button className="btn outline" onClick={() => handleFormAction('form5', 'save')} disabled={saving}>Lưu Mẫu 5</button><button className="btn danger" onClick={() => handleFormAction('form5', 'return')} disabled={saving}>Trả lại Mẫu 5</button><button className="btn" onClick={() => handleFormAction('form5', 'approve')} disabled={saving}>Duyệt Mẫu 5</button></>}
                      {hasForm7 && <><button className="btn outline" onClick={() => handleFormAction('form7', 'save')} disabled={saving}>Lưu Mẫu 7</button><button className="btn danger" onClick={() => handleFormAction('form7', 'return')} disabled={saving}>Trả lại Mẫu 7</button><button className="btn" onClick={() => handleFormAction('form7', 'approve')} disabled={saving}>Duyệt Mẫu 7</button></>}
                      {hasForm9 && <><button className="btn outline" onClick={() => handleFormAction('form9', 'save')} disabled={saving}>Lưu Mẫu 9</button><button className="btn danger" onClick={() => handleFormAction('form9', 'return')} disabled={saving}>Trả lại Mẫu 9</button><button className="btn" onClick={() => handleFormAction('form9', 'approve')} disabled={saving}>Duyệt Mẫu 9</button></>}
                      {hasForm12 && <><button className="btn outline" onClick={() => handleFormAction('form12', 'save')} disabled={saving}>Lưu Mẫu 12</button><button className="btn danger" onClick={() => handleFormAction('form12', 'return')} disabled={saving}>Trả lại Mẫu 12</button><button className="btn" onClick={() => handleFormAction('form12', 'approve')} disabled={saving}>Duyệt Mẫu 12</button></>}
                    </div>
                  </div>
                )}

                {(hasForm4 || hasForm8) && (
                  <div style={{ border: '1px solid #e5eaef', borderRadius: 8, padding: 10 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Các mẫu eForm bảng dữ liệu</div>
                    {hasForm4 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: '#1e293b' }}>Mẫu 4: Nhật ký bán hàng</div>
                        <div style={{ display: 'grid', gap: 12 }}>
                          {(selected?.form4Rows || []).map((row, idx) => (
                            <div key={idx} style={{ border: '1px solid #e5eaef', padding: 12, borderRadius: 8 }}>
                              <div style={{ fontWeight: 600, marginBottom: 8, color: '#3b82f6' }}>Dòng {idx + 1}</div>
                              <div className="filters" style={{ marginBottom: 8 }}>
                                <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Tên KH / DN</div><input className="field" value={row.customerName || ''} onChange={(e) => { const newRows = [...selected.form4Rows]; newRows[idx].customerName = e.target.value; setSelected(prev => ({ ...prev, form4Rows: newRows })); }} /></div>
                                <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Khó khăn/Lý do từ chối</div><textarea className="field" rows={2} value={row.difficulty || ''} onChange={(e) => { const newRows = [...selected.form4Rows]; newRows[idx].difficulty = e.target.value; setSelected(prev => ({ ...prev, form4Rows: newRows })); }} /></div>
                                <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Nguyên nhân sâu xa</div><textarea className="field" rows={2} value={row.rootCause || ''} onChange={(e) => { const newRows = [...selected.form4Rows]; newRows[idx].rootCause = e.target.value; setSelected(prev => ({ ...prev, form4Rows: newRows })); }} /></div>
                              </div>
                              <div className="filters">
                                <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Giải pháp</div><textarea className="field" rows={2} value={row.solution || ''} onChange={(e) => { const newRows = [...selected.form4Rows]; newRows[idx].solution = e.target.value; setSelected(prev => ({ ...prev, form4Rows: newRows })); }} /></div>
                                <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Đề xuất hỗ trợ</div><textarea className="field" rows={2} value={row.supportNeeded || ''} onChange={(e) => { const newRows = [...selected.form4Rows]; newRows[idx].supportNeeded = e.target.value; setSelected(prev => ({ ...prev, form4Rows: newRows })); }} /></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {hasForm8 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: '#1e293b' }}>Mẫu 8: Củng cố niềm tin</div>
                        <div style={{ display: 'grid', gap: 12 }}>
                          {(selected?.form8Rows || []).map((row, idx) => (
                            <div key={idx} style={{ border: '1px solid #e5eaef', padding: 12, borderRadius: 8 }}>
                              <div style={{ fontWeight: 600, marginBottom: 8, color: '#3b82f6' }}>Dòng {idx + 1}</div>
                              <div className="filters" style={{ marginBottom: 8 }}>
                                <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Tình huống</div><textarea className="field" rows={2} value={row.situation || ''} onChange={(e) => { const newRows = [...selected.form8Rows]; newRows[idx].situation = e.target.value; setSelected(prev => ({ ...prev, form8Rows: newRows })); }} /></div>
                                <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Niềm tin cũ</div><textarea className="field" rows={2} value={row.oldBelief || ''} onChange={(e) => { const newRows = [...selected.form8Rows]; newRows[idx].oldBelief = e.target.value; setSelected(prev => ({ ...prev, form8Rows: newRows })); }} /></div>
                                <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Niềm tin mới chọn</div><textarea className="field" rows={2} value={row.newChosenBelief || ''} onChange={(e) => { const newRows = [...selected.form8Rows]; newRows[idx].newChosenBelief = e.target.value; setSelected(prev => ({ ...prev, form8Rows: newRows })); }} /></div>
                              </div>
                              <div className="filters">
                                <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Hành vi mới</div><textarea className="field" rows={2} value={row.newBehavior || ''} onChange={(e) => { const newRows = [...selected.form8Rows]; newRows[idx].newBehavior = e.target.value; setSelected(prev => ({ ...prev, form8Rows: newRows })); }} /></div>
                                <div><div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Kết quả</div><textarea className="field" rows={2} value={row.result || ''} onChange={(e) => { const newRows = [...selected.form8Rows]; newRows[idx].result = e.target.value; setSelected(prev => ({ ...prev, form8Rows: newRows })); }} /></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      {hasForm4 && <><button className="btn outline" onClick={() => handleFormAction('form4', 'save')} disabled={saving}>Lưu Mẫu 4</button><button className="btn danger" onClick={() => handleFormAction('form4', 'return')} disabled={saving}>Trả lại Mẫu 4</button><button className="btn" onClick={() => handleFormAction('form4', 'approve')} disabled={saving}>Duyệt Mẫu 4</button></>}
                      {hasForm8 && <><button className="btn outline" onClick={() => handleFormAction('form8', 'save')} disabled={saving}>Lưu Mẫu 8</button><button className="btn danger" onClick={() => handleFormAction('form8', 'return')} disabled={saving}>Trả lại Mẫu 8</button><button className="btn" onClick={() => handleFormAction('form8', 'approve')} disabled={saving}>Duyệt Mẫu 8</button></>}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
                <button className="btn" onClick={approveAllForms} disabled={saving}>
                  Duyệt tất cả
                </button>
                <button className="btn" onClick={saveDailyReview} disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu chỉnh sửa & Duyệt nội dung'}
                </button>
              </div>
            </section>
            )}

            {hasForm2 && (
              <div className="card" style={{ marginBottom: '20px' }}>
                <h3 style={{ marginTop: 0 }}>Thẩm định Mẫu 2: Hành vi</h3>
                <Form2BehaviorChecklist
                  userRole="MANAGER"
                  journalId={selected.id}
                  initialData={{
                    customersMet: selected?.customersMet || 0,
                    deepInquiry: !!selected?.deepInquiry,
                    fullConsult: !!selected?.fullConsult,
                    persistence: !!selected?.persistence,
                    mgrDeepInquiry: !!selected?.form2MgrEvalDeepQ,
                    mgrFullConsult: !!selected?.form2MgrEvalFullCons,
                    mgrPersistence: !!selected?.form2MgrEvalFollow,
                    status: selected?.form2Status || 'PENDING'
                  }}
                  onSubmit={async (payload) => {
                    try {
                      setSaving(true);
                      await axiosInstance.patch(`/api/manager/logs/evaluate/${selected.behaviorLogId}`, payload);
                      setStatusText('Đã lưu phần thẩm định Mẫu 2: Hành vi');
                      await loadData();
                    } catch (e) {
                      setErrorText(e?.response?.data?.message || 'Lưu thẩm định Mẫu 2 thất bại');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  isSubmitting={saving}
                />
              </div>
            )}

            {!hasForm2 && !hasForm3 && !hasForm4 && !hasForm5 && !hasForm7 && !hasForm8 && !hasForm9 && !hasForm12 && !(selected?.avoidance || selected?.selfLimit || selected?.earlyStop || selected?.blaming || selected?.awarenessSubmittedAt) && !(selected?.standardsKeptText || selected?.backslideSigns || selected?.solution || selected?.standardsSubmittedAt) && (
              <div className="card" style={{ marginBottom: '20px' }}>
                <div className="coach-bubble">Nhân viên chưa khai báo mẫu nhật ký nào cho ngày này.</div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ManagerReviewPage;

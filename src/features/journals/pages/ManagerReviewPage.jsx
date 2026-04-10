import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../utils/http/axiosInstance';
import evaluationService from '../../../services/api/evaluationService';
import journalService from '../../../services/api/journalService';
import JournalCard from '../components/JournalCard';
import Form2BehaviorChecklist from '../components/v2/Form2BehaviorChecklist';
import Form38MindsetBelief from '../components/v2/Form38MindsetBelief';
import Form4SalesReport from '../components/v2/Form4SalesReport';
import Form5QuickNote from '../components/v2/Form5QuickNote';
import Form8BeliefTransformations from '../components/v2/Form8BeliefTransformations';

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
  const hasForm8 = Array.isArray(selected?.form8Rows) && selected.form8Rows.length > 0;

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
              {/* <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <input className="field" readOnly value={reviewUrl} />
                <button className="field" type="button" onClick={copyReviewUrl}>
                  Sao chép URL
                </button>
                <button
                  className="field"
                  type="button"
                  onClick={() => navigate('/discipline/manager-review')}
                >
                  Quay lại tra cứu
                </button>
              </div> */}
            </section>

            <section className="review-bento">
              <div className="review-bento-card">
                <div className="review-bento-title">Nhật ký nhận diện</div>
                <div className="review-bento-content">
                  Câu 1: Hôm nay tôi đã né điều gì? {selected?.avoidance || '-'}<br />
                  Câu 2: Tôi có tự loại gói nào không? {selected?.selfLimit || '-'}<br />
                  Câu 3: Tôi đã dừng tư vấn sớm ở điểm nào? {selected?.earlyStop || '-'}<br />
                  Câu 4: Khi không bán được dịch vụ anh chị thường đỗ lỗi cho vấn đề gì? {selected?.blaming || '-'}
                </div>
              </div>
              <div className="review-bento-card">
                <div className="review-bento-title">Nhật ký giữ chuẩn</div>
                <div className="review-bento-content">
                  Câu 1: Hôm nay tôi giữ được chuẩn nào? {selected?.standardsKeptText || '-'}<br />
                  Câu 2: Dấu hiệu tụt chuẩn nào xuất hiện? {selected?.backslideSigns || '-'}<br />
                  Câu 3: Tôi đã xử lý nó ra sao? {selected?.solution || '-'}
                </div>
              </div>
            </section>

            <section className="card" style={{ marginBottom: '20px' }}>
              <h3 style={{ marginTop: 0 }}>Tổng hợp biểu mẫu đã nhập trong ngày</h3>
              <div className="review-bento">
                <div className="review-bento-card">
                  <div className="review-bento-title">Mẫu 2: Hành vi</div>
                  <div className="review-bento-content">
                    Trạng thái: {hasForm2 ? 'Đã nhập' : 'Chưa nhập'}<br />
                    Số khách gặp: {hasForm2 ? selected?.customersMet ?? 0 : '-'}<br />
                    Hỏi sâu: {hasForm2 ? (selected?.deepInquiry ? 'Có' : 'Không') : '-'}<br />
                    Tư vấn đủ: {hasForm2 ? (selected?.fullConsult ? 'Có' : 'Không') : '-'}<br />
                    Theo đến cùng: {hasForm2 ? (selected?.persistence ? 'Có' : 'Không') : '-'}
                  </div>
                </div>
                <div className="review-bento-card">
                  <div className="review-bento-title">Mẫu 3: Thay đổi Tư duy</div>
                  <div className="review-bento-content">
                    Trạng thái: {hasForm3 ? 'Đã nhập' : 'Chưa nhập'}<br />
                    Suy nghĩ cũ: {hasForm3 ? selected?.form3OldMindset || '-' : '-'}<br />
                    Tư duy mới: {hasForm3 ? selected?.form3NewMindset || '-' : '-'}<br />
                    Hành vi thay đổi: {hasForm3 ? selected?.form3ActionChange || '-' : '-'}
                  </div>
                </div>
                <div className="review-bento-card">
                  <div className="review-bento-title">Mẫu 4: Báo cáo Bán hàng</div>
                  <div className="review-bento-content">
                    Trạng thái: {hasForm4 ? 'Đã nhập' : 'Chưa nhập'}<br />
                    Số dòng khai báo: {hasForm4 ? selected.form4Rows.length : 0}
                  </div>
                </div>
                <div className="review-bento-card">
                  <div className="review-bento-title">Mẫu 5: Ghi chép cuối ngày</div>
                  <div className="review-bento-content">
                    Trạng thái: {hasForm5 ? 'Đã nhập' : 'Chưa nhập'}<br />
                    Việc sẽ làm khác đi: {hasForm5 ? selected?.form5Action || '-' : '-'}<br />
                    Bài học ngày mai: {hasForm5 ? selected?.form5Lesson || '-' : '-'}
                  </div>
                </div>
                <div className="review-bento-card">
                  <div className="review-bento-title">Mẫu 8: Củng cố Niềm tin</div>
                  <div className="review-bento-content">
                    Trạng thái: {hasForm8 ? 'Đã nhập' : 'Chưa nhập'}<br />
                    Số dòng khai báo: {hasForm8 ? selected.form8Rows.length : 0}
                  </div>
                </div>
              </div>
            </section>

            <div className="card" style={{ marginBottom: '20px' }}>
              <h3 style={{ marginTop: 0 }}>Thẩm định Mẫu 2: Hành vi</h3>
              {selected?.behaviorLogId ? (
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
              ) : (
                <div className="coach-bubble">Nhân viên chưa khai báo Mẫu 2: Hành vi cho ngày này.</div>
              )}
            </div>

            {/* Các Mẫu 3, 4, 5, 8 hiển thị dạng Read-only nếu có dữ liệu */}
            {(selected?.form3OldMindset || selected?.form3NewMindset || selected?.form3ActionChange) && (
              <div className="card" style={{ marginBottom: '20px' }}>
                <h3 style={{ marginTop: 0 }}>Mẫu 3: Thay đổi Tư duy</h3>
                <Form38MindsetBelief
                  userRole="MANAGER"
                  initialData={{
                    oldMindset: selected.form3OldMindset,
                    newMindset: selected.form3NewMindset,
                    actionChange: selected.form3ActionChange,
                    status: selected?.evaluation ? 'APPROVED' : 'PENDING'
                  }}
                />
              </div>
            )}

            {Array.isArray(selected?.form4Rows) && selected.form4Rows.length > 0 && (
              <div className="card" style={{ marginBottom: '20px' }}>
                <h3 style={{ marginTop: 0 }}>Mẫu 4: Báo cáo Bán hàng</h3>
                <Form4SalesReport
                  userRole="MANAGER"
                  initialData={{
                    salesActivities: selected.form4Rows,
                    status: selected?.evaluation ? 'APPROVED' : 'PENDING'
                  }}
                />
              </div>
            )}

            {(selected?.form5Lesson || selected?.form5Action) && (
              <div className="card" style={{ marginBottom: '20px' }}>
                <h3 style={{ marginTop: 0 }}>Mẫu 5: Ghi chép cuối ngày</h3>
                <Form5QuickNote
                  userRole="MANAGER"
                  initialData={{
                    lessonLearned: selected.form5Lesson,
                    actionPlan: selected.form5Action,
                    status: selected?.evaluation ? 'APPROVED' : 'PENDING'
                  }}
                />
              </div>
            )}

            {Array.isArray(selected?.form8Rows) && selected.form8Rows.length > 0 && (
              <div className="card" style={{ marginBottom: '20px' }}>
                <h3 style={{ marginTop: 0 }}>Mẫu 8: Củng cố Niềm tin</h3>
                <Form8BeliefTransformations
                  userRole="MANAGER"
                  initialData={{
                    beliefTransformations: selected.form8Rows,
                    status: selected?.evaluation ? 'APPROVED' : 'PENDING'
                  }}
                />
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ManagerReviewPage;

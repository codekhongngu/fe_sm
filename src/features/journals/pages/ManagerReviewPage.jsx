import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../utils/http/axiosInstance';
import evaluationService from '../../../services/api/evaluationService';
import journalService from '../../../services/api/journalService';
import AwarenessReviewForm from '../components/AwarenessReviewForm';
import EvaluationForm from '../components/EvaluationForm';
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

  const saveEvaluation = async (payload, successText) => {
    if (!selected?.id) return;
    setSaving(true);
    setErrorText('');
    setStatusText('');
    try {
      if (payload.awarenessReviewed !== undefined || payload.awarenessManagerNote !== undefined) {
        await evaluationService.updateAwarenessByJournalId(selected.id, payload);
      } else {
        await evaluationService.updateStandardsByJournalId(selected.id, payload);
      }
      setStatusText(successText);
      await loadData();
      const detail = await journalService.getById(selected.id);
      setSelected(detail);
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Lưu đánh giá thất bại');
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

            <AwarenessReviewForm
              journal={selected}
              onSubmit={(payload) =>
                saveEvaluation(payload, 'Đã lưu phần chấm nhật ký nhận diện hằng ngày')
              }
              saving={saving}
            />
            <div style={{ height: 1, background: '#e5eaef', margin: '10px 0' }} />
            <EvaluationForm
              journal={selected}
              onSubmit={(payload) =>
                saveEvaluation(payload, 'Đã lưu phần chấm nhật ký giữ chuẩn thu nhập cao')
              }
              saving={saving}
            />
            <div style={{ height: 1, background: '#e5eaef', margin: '20px 0' }} />
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
                  mgrDeepInquiry: !!selected?.evaluation?.mgr_eval_deep_q,
                  mgrFullConsult: !!selected?.evaluation?.mgr_eval_full_cons,
                  mgrPersistence: !!selected?.evaluation?.mgr_eval_follow,
                  status: selected?.evaluation ? 'APPROVED' : 'PENDING'
                }}
                onSubmit={async (payload) => {
                  try {
                    await axiosInstance.patch(`/api/manager/logs/evaluate/${selected.id}`, payload);
                    setStatusText('Đã lưu phần thẩm định Mẫu 2: Hành vi');
                    await loadData();
                  } catch (e) {
                    setErrorText('Lưu thẩm định Mẫu 2 thất bại');
                  }
                }}
                isSubmitting={saving}
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ManagerReviewPage;

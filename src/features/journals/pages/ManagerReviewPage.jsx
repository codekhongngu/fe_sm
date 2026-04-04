import { useEffect, useMemo, useState } from 'react';
import evaluationService from '../../../services/api/evaluationService';
import journalService from '../../../services/api/journalService';
import AwarenessReviewForm from '../components/AwarenessReviewForm';
import EvaluationForm from '../components/EvaluationForm';
import JournalCard from '../components/JournalCard';

const ManagerReviewPage = () => {
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
      if (pending?.length > 0 && !selected) {
        const detail = await journalService.getById(pending[0].id);
        setSelected(detail);
      }
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Không tải được danh sách chờ đánh giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
    try {
      const detail = await journalService.getById(journal.id);
      setSelected(detail);
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Không tải được chi tiết nhật ký');
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
      <div className="review-v3-topnav">
        <div className="review-v3-brand">JournalEval</div>
        <div className="review-v3-tabs">
          <button className="active">Đánh giá</button>
          <button>Lịch sử</button>
          <button>Báo cáo</button>
        </div>
      </div>
      <div className="review-v3-progress">
        <div className="bar" />
      </div>
      <div className="review-v3-main">
        <section className="review-title-block">
          <h1 style={{ margin: 0 }}>Đánh giá Nhật Ký Nhân Viên</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b' }}>
            Không gian làm việc tĩnh lặng để phản hồi và phát triển năng lực đội ngũ.
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
          <h3 style={{ marginTop: 0 }}>Hồ sơ chờ duyệt</h3>
          <div className="review-pending-row">
            {filteredPendingJournals.map((journal) => (
              <JournalCard key={journal.id} journal={journal} onSelect={chooseJournal} />
            ))}
            {!loading && filteredPendingJournals.length === 0 ? (
              <div className="card">Không có nhật ký phù hợp bộ lọc.</div>
            ) : null}
          </div>
        </section>

        {selected ? (
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

            <section className="review-bento">
              <div className="review-bento-card">
                <div className="review-bento-title">Nhật ký nhận diện</div>
                <div className="review-bento-content">
                  Câu 1: {selected?.avoidance || '-'}<br />
                  Câu 2: {selected?.selfLimit || '-'}<br />
                  Câu 3: {selected?.earlyStop || '-'}<br />
                  Câu 4: {selected?.blaming || '-'}
                </div>
              </div>
              <div className="review-bento-card">
                <div className="review-bento-title">Nhật ký giữ chuẩn</div>
                <div className="review-bento-content">
                  Câu 1: {selected?.standardsKeptText || '-'}<br />
                  Câu 2: {selected?.backslideSigns || '-'}<br />
                  Câu 3: {selected?.solution || '-'}
                </div>
              </div>
            </section>

            <AwarenessReviewForm
              journal={selected}
              onSubmit={(payload) =>
                saveEvaluation(payload, 'Đã lưu phần chấm E-form Nhận diện')
              }
              saving={saving}
            />
            <div style={{ height: 1, background: '#e5eaef', margin: '10px 0' }} />
            <EvaluationForm
              journal={selected}
              onSubmit={(payload) =>
                saveEvaluation(payload, 'Đã lưu phần chấm E-form Giữ chuẩn')
              }
              saving={saving}
            />
          </>
        ) : (
          <div className="card">Chọn một nhật ký từ danh sách chờ để chấm điểm.</div>
        )}
      </div>
    </div>
  );
};

export default ManagerReviewPage;

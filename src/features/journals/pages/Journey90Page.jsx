import { useEffect, useMemo, useState } from 'react';
import journalService from '../../../services/api/journalService';
import JourneyTimelineStepper from '../components/v2/JourneyTimelineStepper';
import Form2BehaviorChecklist from '../components/v2/Form2BehaviorChecklist';

const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const fromDateKey = (dateKey) => {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatDate = (dateKey) =>
  fromDateKey(dateKey).toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const getStatusLabel = (status) => {
  if (status === 'future') return 'Chưa đến';
  if (status === 'graded') return 'Đã nộp và đã chấm';
  if (status === 'pending') return 'Đã nộp - chờ chấm';
  return 'Vi phạm kỷ luật';
};

const normalizeText = (value) =>
  (value || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const formatDisplayText = (value, fallback = '-') => normalizeText(value) || fallback;

const getStartOfWeek = (date) => {
  const day = date.getDay() || 7;
  const start = new Date(date);
  start.setDate(date.getDate() - day + 1);
  start.setHours(0, 0, 0, 0);
  return start;
};

const Journey90Page = () => {
  const todayDefault = toDateKey(new Date());
  const fromDefault = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 89);
    return toDateKey(d);
  })();
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [journalsByDate, setJournalsByDate] = useState({});
  const [selectedDateKey, setSelectedDateKey] = useState('');
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [timeFilter, setTimeFilter] = useState('last_90');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [activeEform, setActiveEform] = useState('awareness');
  const [fromDate, setFromDate] = useState(fromDefault);
  const [toDate, setToDate] = useState(todayDefault);
  const [form, setForm] = useState({
    avoidance: '',
    selfLimit: '',
    earlyStop: '',
    blaming: '',
    standardsKeptText: '',
    backslideSigns: '',
    solution: '',
    customersMet: '',
    deepInquiry: false,
    fullConsult: false,
    persistence: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [infoText, setInfoText] = useState('');

  const loadJournals = async () => {
    setLoading(true);
    setErrorText('');
    try {
      const params = {
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        status:
          statusFilter === 'graded' || statusFilter === 'pending'
            ? statusFilter
            : undefined,
      };
      const journals = await journalService.getList(params);
      const map = {};
      journals.forEach((journal) => {
        const key = journal.reportDate || toDateKey(new Date(journal.createdAt));
        if (!map[key] || new Date(journal.createdAt) > new Date(map[key].createdAt)) {
          map[key] = journal;
        }
      });
      setJournalsByDate(map);
      setSelectedDateKey(toDateKey(new Date()));
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Không tải được lịch sử nhật ký');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJournals();
  }, [fromDate, toDate, statusFilter]);

  useEffect(() => {
    const run = async () => {
      const selected = journalsByDate[selectedDateKey];
      if (!selected?.id) {
        setSelectedJournal(null);
        return;
      }
      try {
        const detail = await journalService.getById(selected.id);
        setSelectedJournal(detail);
      } catch (error) {
        setErrorText(error?.response?.data?.message || 'Không tải được chi tiết ngày');
      }
    };
    if (selectedDateKey) {
      run();
    }
  }, [selectedDateKey, journalsByDate]);

  const cycleStartDateKey = useMemo(() => {
    const keys = Object.keys(journalsByDate);
    if (keys.length === 0) {
      return toDateKey(new Date());
    }
    return [...keys].sort()[0];
  }, [journalsByDate]);

  const timelineEntries = useMemo(() => {
    const startDate = fromDateKey(cycleStartDateKey);
    const today = new Date();
    return Array.from({ length: 90 }).map((_, idx) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + idx);
      const dateKey = toDateKey(date);
      const journal = journalsByDate[dateKey];
      const isFuture = date > today;
      let status = 'missed';
      if (isFuture) {
        status = 'future';
      } else if (journal?.evaluation) {
        status = 'graded';
      } else if (journal?.awarenessSubmittedAt || journal?.standardsSubmittedAt) {
        status = 'pending';
      }
      return {
        dateKey,
        journalId: journal?.id,
        status,
        behaviorKept: [
          !!journal?.standardsKept?.deepInquiry,
          !!journal?.standardsKept?.fullConsult,
          !!journal?.standardsKept?.persistence,
        ],
      };
    });
  }, [journalsByDate, cycleStartDateKey]);

  const filteredEntries = useMemo(() => {
    const now = new Date();
    const startOfWeek = getStartOfWeek(now);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return timelineEntries.filter((entry) => {
      const date = fromDateKey(entry.dateKey);
      let matchTime = true;
      if (timeFilter === 'this_week') {
        matchTime = date >= startOfWeek;
      } else if (timeFilter === 'this_month') {
        matchTime = date >= startOfMonth;
      }
      const matchRange =
        (!fromDate || entry.dateKey >= fromDate) && (!toDate || entry.dateKey <= toDate);
      const matchStatus = statusFilter === 'all' || entry.status === statusFilter;
      return matchTime && matchRange && matchStatus;
    });
  }, [timelineEntries, timeFilter, statusFilter, fromDate, toDate]);

  const progress = useMemo(() => {
    const submittedCount = timelineEntries.filter((entry) => entry.journalId).length;
    let streak = 0;
    const todayKey = toDateKey(new Date());
    let cursor = fromDateKey(todayKey);
    while (true) {
      const key = toDateKey(cursor);
      if (journalsByDate[key]) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    const cycleStart = fromDateKey(cycleStartDateKey);
    const now = new Date();
    const currentDay = Math.max(
      1,
      Math.min(90, Math.floor((now.getTime() - cycleStart.getTime()) / 86400000) + 1),
    );
    return { submittedCount, streak, currentDay };
  }, [timelineEntries, journalsByDate, cycleStartDateKey]);

  const todayKey = toDateKey(new Date());
  const todayJournal = journalsByDate[todayKey];

  const selectedStatus = selectedDateKey
    ? (() => {
        const selectedDate = fromDateKey(selectedDateKey);
        const today = new Date();
        if (selectedDate > today) return 'future';
        if (selectedJournal?.evaluation) return 'graded';
        if (
          journalsByDate[selectedDateKey]?.awarenessSubmittedAt ||
          journalsByDate[selectedDateKey]?.standardsSubmittedAt
        ) {
          return 'pending';
        }
        return 'missed';
      })()
    : 'missed';

  const submitStandardsForm = async () => {
    setErrorText('');
    setInfoText('');
    if (!form.standardsKeptText) {
      setErrorText('Vui lòng nhập nội dung chuẩn đã giữ trong ngày');
      return;
    }
    if (!form.backslideSigns || !form.solution) {
      setErrorText('Vui lòng nhập phần tụt chuẩn và giải pháp xử lý');
      return;
    }
    setSubmitting(true);
    try {
      await journalService.submitStandards({
        reportDate: todayKey,
        standardsKeptText: normalizeText(form.standardsKeptText),
        backslideSigns: normalizeText(form.backslideSigns),
        solution: normalizeText(form.solution),
      });
      setInfoText('Đã lưu nhật ký giữ chuẩn thu nhập cao thành công. Tiếp tục sang Mẫu 2: Checklist hành vi');
      setActiveEform('behavior');
      await loadJournals();
      setSelectedDateKey(todayKey);
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Nộp nhật ký thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const submitBehaviorForm = async (payload) => {
    setErrorText('');
    setInfoText('');
    setSubmitting(true);
    try {
      await journalService.submitBehavior({
        reportDate: todayKey,
        ...payload
      });
      setShowForm(false);
      setActiveEform('awareness');
      setForm(prev => ({
        ...prev,
        avoidance: '',
        selfLimit: '',
        earlyStop: '',
        blaming: '',
        standardsKeptText: '',
        backslideSigns: '',
        solution: '',
        customersMet: '',
        deepInquiry: false,
        fullConsult: false,
        persistence: false,
      }));
      await loadJournals();
      setSelectedDateKey(todayKey);
      setInfoText('Đã lưu Mẫu 2: Checklist Hành vi thành công');

      // Tạo Telegram Share link
      const employeeName = JSON.parse(localStorage.getItem('user'))?.fullName || 'Nhân viên';
      const detailUrl = `${window.location.origin}/discipline/manager-review/${journalsByDate[todayKey]?.id || ''}`;
      const msg = `[NHẬT KÝ 90 NGÀY]\nNhân viên: ${employeeName}\nNgày nộp: ${todayKey}\n\nĐã nộp đầy đủ Nhật ký Mẫu 1 và Mẫu 2.\nQuản lý vui lòng xem và đánh giá tại:\n${detailUrl}`;
      const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(detailUrl)}&text=${encodeURIComponent(msg)}`;
      
      setInfoText(
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <span>Đã lưu Mẫu 2: Checklist Hành vi thành công</span>
          <a href={telegramShareUrl} target="_blank" rel="noreferrer" className="btn" style={{ padding: '6px 12px', fontSize: '13px' }}>
            Nhắn Telegram
          </a>
        </div>
      );

    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Nộp Checklist Hành vi thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const openTodayForm = async () => {
    setShowForm(true);
    setActiveEform('awareness');
    setInfoText('');
    setErrorText('');
    const todayJournal = journalsByDate[todayKey];
    if (!todayJournal?.id) {
      return;
    }
    try {
      const detail = await journalService.getById(todayJournal.id);
      setForm({
        avoidance: normalizeText(detail?.avoidance),
        selfLimit: normalizeText(detail?.selfLimit),
        earlyStop: normalizeText(detail?.earlyStop),
        blaming: normalizeText(detail?.blaming),
        standardsKeptText: normalizeText(detail?.standardsKeptText),
        backslideSigns: normalizeText(detail?.backslideSigns),
        solution: normalizeText(detail?.solution),
        customersMet: detail?.customersMet || '',
        deepInquiry: !!detail?.deepInquiry,
        fullConsult: !!detail?.fullConsult,
        persistence: !!detail?.persistence,
      });
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Không tải được dữ liệu hôm nay');
    }
  };

  const saveAwarenessStep = () => {
    const run = async () => {
      setErrorText('');
      setInfoText('');
      if (!form.avoidance || !form.selfLimit || !form.earlyStop || !form.blaming) {
        setErrorText('Vui lòng hoàn thành 4 câu hỏi của nhật ký nhận diện hằng ngày');
        return;
      }
      try {
        await journalService.submitAwareness({
          reportDate: todayKey,
          avoidance: normalizeText(form.avoidance),
          selfLimit: normalizeText(form.selfLimit),
          earlyStop: normalizeText(form.earlyStop),
          blaming: normalizeText(form.blaming),
        });
        setInfoText('Đã lưu nhật ký nhận diện hàng ngày. Tiếp tục sang nhật ký giữ chuẩn hàng ngày');
        setActiveEform('standards');
        await loadJournals();
      } catch (error) {
        setErrorText(error?.response?.data?.message || 'Lưu nhật ký nhận diện hàng ngày thất bại');
      }
    };
    run();
  };

  return (
    <div className="journey-page">
      {showForm ? (
        <div className="journey-modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="journey-modal" onClick={(e) => e.stopPropagation()}>
            <div className="journey-eform-topline">
              <div
                className="journey-eform-topline-fill"
                style={{
                  width:
                    activeEform === 'awareness'
                      ? `${Math.min(50, (progress.currentDay / 90) * 100)}%`
                      : `${Math.min(100, (progress.currentDay / 90) * 100)}%`,
                }}
              />
            </div>
            <div className="journey-form journey-form-modern">
              <div className="journey-eform-header">
                <div>
                  <div className="journey-eform-chip">{activeEform === 'awareness' ? 'Nhật ký nhận diện hàng ngày' : 'Nhật ký giữ chuẩn hàng ngày'}</div>
                  <h3 className="journey-eform-title">
                    {activeEform === 'awareness'
                      ? 'Nhật ký nhận diện hàng ngày'
                      : 'Nhật ký giữ chuẩn hàng ngày'}
                  </h3>
                  <div className="journey-eform-subtitle">
                    {activeEform === 'awareness'
                      ? 'Dành vài phút để trung thực với bản thân và nhận diện điểm nghẽn.'
                      : 'Ghi lại chuẩn đã giữ và cách xử lý tụt chuẩn để duy trì kỷ luật.'}
                  </div>
                </div>
                <button className="btn outline" onClick={() => setShowForm(false)}>
                  Đóng
                </button>
              </div>

              <div className="journey-eform-tabs">
                <button
                  className={`journey-eform-tab ${activeEform === 'awareness' ? 'active' : ''}`}
                  onClick={() => setActiveEform('awareness')}
                >
                  Mẫu 1: Nhận diện
                </button>
                <button
                  className={`journey-eform-tab ${activeEform === 'standards' ? 'active' : ''}`}
                  onClick={() => setActiveEform('standards')}
                >
                  Mẫu 1: Giữ chuẩn
                </button>
                <button
                  className={`journey-eform-tab ${activeEform === 'behavior' ? 'active' : ''}`}
                  onClick={() => setActiveEform('behavior')}
                >
                  Mẫu 2: Hành vi
                </button>
              </div>

              {activeEform === 'awareness' ? (
                <div className="journey-eform-grid">
                  <div className="journey-eform-card">
                    <div className="journey-eform-card-head">
                      <span className="journey-eform-no">01</span>
                      <span>Hôm nay tôi đã né điều gì?</span>
                    </div>
                    <div className="journey-eform-hint">
                      {/* Gợi ý: Nêu tình huống cụ thể bạn đã né tránh trong quá trình làm việc. */}
                    </div>
                    <textarea
                      className="field journey-eform-textarea"
                      placeholder="Vui lòng nhập điều gì tôi đã né trong ngày hôm nay."
                      rows={4}
                      value={form.avoidance}
                      onChange={(e) => setForm((prev) => ({ ...prev, avoidance: e.target.value }))}
                    />
                  </div>

                  <div className="journey-eform-card">
                    <div className="journey-eform-card-head">
                      <span className="journey-eform-no">02</span>
                      <span>Tôi có tự loại gói nào không?</span>
                    </div>
                    <div className="journey-eform-hint">
                      {/* Gợi ý: Gói cước nào bạn cảm thấy không tự tin hoặc không dám tư vấn. */}
                    </div>
                    <textarea
                      className="field journey-eform-textarea"
                      placeholder="Vui lòng nhập gói nào tôi không tự tin hoặc không."
                      rows={4}
                      value={form.selfLimit}
                      onChange={(e) => setForm((prev) => ({ ...prev, selfLimit: e.target.value }))}
                    />
                  </div>

                  <div className="journey-eform-card">
                    <div className="journey-eform-card-head">
                      <span className="journey-eform-no">03</span>
                      <span>Tôi đã dừng tư vấn sớm ở điểm nào?</span>
                    </div>
                    <div className="journey-eform-hint">
                      {/* Gợi ý: Khoảnh khắc nào bạn quyết định ngắt cuộc trao đổi một cách vội vàng. */}
                    </div>
                    <textarea
                      className="field journey-eform-textarea"
                      placeholder="Vui lòng nhập điểm nào tôi đã dừng tư vấn sớm."
                      rows={4}
                      value={form.earlyStop}
                      onChange={(e) => setForm((prev) => ({ ...prev, earlyStop: e.target.value }))}
                    />
                  </div>

                  <div className="journey-eform-card">
                    <div className="journey-eform-card-head">
                      <span className="journey-eform-no">04</span>
                      <span>Tại sao tôi không bán được dịch vụ?</span>
                    </div>
                    <div className="journey-eform-hint">
                      {/* Gợi ý: Trung thực để nhận diện nguyên nhân gốc, thay vì đổ lỗi. */}
                    </div>
                    <textarea
                      className="field journey-eform-textarea"
                      placeholder="Vui lòng nhập lý do tôi không bán được dịch vụ."
                      rows={4}
                      value={form.blaming}
                      onChange={(e) => setForm((prev) => ({ ...prev, blaming: e.target.value }))}
                    />
                  </div>
                </div>
              ) : activeEform === 'standards' ? (
                <div className="journey-eform-grid standards">
                  <div className="journey-eform-card wide">
                    <div className="journey-eform-card-head">
                      <span className="journey-eform-no">01</span>
                      <span>Hôm nay tôi giữ được chuẩn nào?</span>
                    </div>
                    <div className="journey-eform-hint">
                      Trả lời của nhân viên: Hôm nay tôi giữ được chuẩn
                    </div>
                    <textarea
                      className="field journey-eform-textarea"
                      rows={4}
                      value={form.standardsKeptText}
                      onChange={(e) => setForm((prev) => ({ ...prev, standardsKeptText: e.target.value }))}
                    />
                  </div>

                  <div className="journey-eform-card">
                    <div className="journey-eform-card-head">
                      <span className="journey-eform-no">02</span>
                      <span>Dấu hiệu tụt chuẩn nào xuất hiện?</span>
                    </div>
                    <div className="journey-eform-hint">
                      Giúp nhân viên phát hiện sớm khi mình bắt đầu quay lại thói quen cũ, kịp thời điều chỉnh hành vi bán hàng, duy trì chuẩn làm việc cao. Tạo thói quen tự giám sát bản thân.
                      Trả lời của nhân viên: Dấu hiệu tụt chuẩn của tôi hôm nay là: 
                    </div>
                    <textarea
                      className="field journey-eform-textarea"
                      rows={4}
                      value={form.backslideSigns}
                      onChange={(e) => setForm((prev) => ({ ...prev, backslideSigns: e.target.value }))}
                    />
                  </div>

                  <div className="journey-eform-card">
                    <div className="journey-eform-card-head">
                      <span className="journey-eform-no">03</span>
                      <span>Tôi đã xử lý nó ra sao?</span>
                    </div>
                    <div className="journey-eform-hint">
                      Giúp nhân viên không chỉ nhận ra vấn đề mà còn suy nghĩ về cách giải quyết, học cách điều chỉnh hành vi ngay trong công việc, hình thành thói quen giải quyết vấn đề chủ động.
                      Trả lời của nhân viên: Tôi đã xử lý các dấu hiệu tụt chuẩn đó như sau:
                    </div>
                    <textarea
                      className="field journey-eform-textarea"
                      rows={4}
                      value={form.solution}
                      onChange={(e) => setForm((prev) => ({ ...prev, solution: e.target.value }))}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: '20px' }}>
                  <Form2BehaviorChecklist
                    userRole="EMPLOYEE"
                    initialData={{
                      customersMet: form.customersMet,
                      deepInquiry: form.deepInquiry,
                      fullConsult: form.fullConsult,
                      persistence: form.persistence,
                      status: todayJournal?.evaluation ? 'APPROVED' : 'PENDING'
                    }}
                    onSubmit={submitBehaviorForm}
                    isSubmitting={submitting}
                  />
                </div>
              )}

              {activeEform !== 'behavior' && (
                <div className="journey-eform-actions">
                  <button className="btn outline" onClick={() => setShowForm(false)}>
                    Đóng
                  </button>
                  {activeEform === 'awareness' ? (
                    <button className="btn" onClick={saveAwarenessStep}>
                      Lưu E-form Nhận diện
                    </button>
                  ) : (
                    <button className="btn" disabled={submitting} onClick={submitStandardsForm}>
                      Lưu E-form Giữ chuẩn & Cam kết kỷ luật
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="journey-layout">
        <aside className="journey-timeline">
          <div className="journey-progress">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🔥</span>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>
                Chuỗi {progress.streak} ngày liên tiếp
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
                <span>Lộ trình 90 ngày</span>
                <span style={{ color: '#64748b' }}>Ngày {progress.currentDay}/90</span>
              </div>
              <div className="journey-mini-progress">
                <div
                  className="journey-mini-progress-fill"
                  style={{ width: `${Math.min(100, (progress.currentDay / 90) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="journey-filters">
            <select className="field" value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
              <option value="this_week">Tuần này</option>
              <option value="this_month">Tháng này</option>
              <option value="last_90">90 ngày</option>
            </select>
            <div className="journey-date-range">
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
            </div>
            <select
              className="field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="future">Chưa đến</option>
              <option value="graded">Đã chấm</option>
              <option value="pending">Chờ chấm</option>
              <option value="missed">Bị lỡ</option>
            </select>
          </div>

          <div className="journey-timeline-list">
            {filteredEntries.length === 0 ? (
              <div className="coach-bubble">Không có dữ liệu theo bộ lọc đã chọn.</div>
            ) : (
              filteredEntries.map((entry) => (
                <button
                  key={entry.dateKey}
                  type="button"
                  className={`journey-card ${entry.status} ${selectedDateKey === entry.dateKey ? 'active' : ''}`}
                  onClick={() => setSelectedDateKey(entry.dateKey)}
                >
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{formatDate(entry.dateKey)}</div>
                  <div style={{ fontSize: 11, marginTop: 4, color: '#64748b' }}>{getStatusLabel(entry.status)}</div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
                    {entry.behaviorKept.map((ok, idx) => (
                      <span
                        key={`${entry.dateKey}-${idx}`}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          display: 'inline-block',
                          background: ok ? '#0ea5e9' : '#cbd5e1',
                        }}
                      />
                    ))}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="journey-detail">
          <div className="journey-subheader">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn"
                onClick={openTodayForm}
              >
                Mở nhật ký hôm nay
              </button>
              <span className={`journey-mini-badge ${todayJournal?.awarenessSubmittedAt ? 'ok' : ''}`}>
                Nhật ký nhận diện hằng ngày: {todayJournal?.awarenessSubmittedAt ? 'Đã nộp' : 'Chưa nộp'}
              </span>
              <span className={`journey-mini-badge ${todayJournal?.standardsSubmittedAt ? 'ok' : ''}`}>
                Nhật ký giữ chuẩn thu nhập cao: {todayJournal?.standardsSubmittedAt ? 'Đã nộp' : 'Chưa nộp'}
              </span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Đã nộp: {progress.submittedCount}/90</div>
          </div>

          {infoText ? <div className="status-ok" style={{ marginBottom: 10 }}>{infoText}</div> : null}
          {errorText ? <div className="status-err" style={{ marginBottom: 10 }}>{errorText}</div> : null}
          {loading ? <div>Đang tải dữ liệu...</div> : null}

          <div style={{ marginBottom: '24px' }}>
            <JourneyTimelineStepper
              currentDay={progress.currentDay}
              totalDays={90}
              logs={timelineEntries.map(entry => ({
                dayNumber: Math.max(1, Math.floor((fromDateKey(entry.dateKey).getTime() - fromDateKey(cycleStartDateKey).getTime()) / 86400000) + 1),
                status: entry.status
              }))}
              onSelectDay={(dayNum) => {
                const cycleStart = fromDateKey(cycleStartDateKey);
                const targetDate = new Date(cycleStart);
                targetDate.setDate(cycleStart.getDate() + (dayNum - 1));
                setSelectedDateKey(toDateKey(targetDate));
              }}
            />
          </div>

          <div className="journey-detail-header">
            <h3 style={{ margin: 0, color: '#0f172a' }}>Chi tiết đối chiếu ngày {selectedDateKey || '--'}</h3>
            <span className={`journey-status-badge ${selectedStatus}`}>
              {selectedStatus === 'future'
                ? 'Chưa đến'
                : selectedStatus === 'graded'
                  ? 'Đã chấm'
                  : selectedStatus === 'pending'
                    ? 'Chờ chấm'
                    : 'Bị lỡ'}
            </span>
          </div>

          {selectedJournal ? (
            <div className="journey-compare">
              <div className="journey-column">
                <h4>Nhật ký nhận diện hằng ngày</h4>
                <ul style={{ paddingLeft: 18, marginTop: 8, fontSize: 13, color: '#1e293b' }}>
                  <li>Hôm nay tôi đã né điều gì: {formatDisplayText(selectedJournal.avoidance)}</li>
                  <li>Tôi có tự loại gói nào không: {formatDisplayText(selectedJournal.selfLimit)}</li>
                  <li>Tôi đã dừng tư vấn sớm ở điểm nào: {formatDisplayText(selectedJournal.earlyStop)}</li>
                  <li>Khi không bán được dịch vụ anh chị thường đỗ lỗi cho vấn đề gì: {formatDisplayText(selectedJournal.blaming)}</li>
                </ul>
                <div style={{ marginTop: 14 }}>
                  <strong>Nhật ký giữ chuẩn thu nhập cao</strong>
                  <strong>Hôm nay tôi giữ được chuẩn nào</strong>
                  <div style={{ marginTop: 6, fontSize: 13 }}>
                    {formatDisplayText(selectedJournal.standardsKeptText, 'Chưa ghi nhận')}
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <strong>Dấu hiệu tụt chuẩn nào xuất hiện</strong>
                  <div style={{ marginTop: 6, fontSize: 13 }}>
                    {formatDisplayText(selectedJournal.backslideSigns, 'Chưa ghi nhận')}
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <strong>Tôi đã xử lý nó ra sao</strong>
                  <div style={{ marginTop: 6, fontSize: 13 }}>
                    {formatDisplayText(selectedJournal.solution, 'Chưa ghi nhận')}
                  </div>
                </div>
              </div>

              <div className="journey-column">
                <h4>Quản lý đánh giá</h4>
                {selectedJournal.evaluation ? (
                  <>
                    <div style={{ fontWeight: 700, marginBottom: 6, color: '#0f172a', fontSize: 12 }}>E-form Nhận diện</div>
                    <div className="rating-row">
                      <span>Hỏi sâu hơn</span>
                      <span>
                        {selectedJournal.evaluation?.awarenessDeepInquiryStatus
                          ? 'Đã thực hiện'
                          : 'Chưa thực hiện'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                      Ghi chú: {selectedJournal.evaluation?.awarenessDeepInquiryNote || 'Không có'}
                    </div>
                    <div className="rating-row">
                      <span>Đề xuất đầy đủ</span>
                      <span>
                        {selectedJournal.evaluation?.awarenessFullProposalStatus
                          ? 'Đã thực hiện'
                          : 'Chưa thực hiện'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                      Ghi chú: {selectedJournal.evaluation?.awarenessFullProposalNote || 'Không có'}
                    </div>
                    <div className="rating-row">
                      <span>Theo đến quyết</span>
                      <span>
                        {selectedJournal.evaluation?.awarenessPersistenceStatus
                          ? 'Đã thực hiện'
                          : 'Chưa thực hiện'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                      Ghi chú: {selectedJournal.evaluation?.awarenessPersistenceNote || 'Không có'}
                    </div>

                    <div style={{ height: 1, background: '#e2e8f0', margin: '10px 0' }} />
                    <div style={{ fontWeight: 700, marginBottom: 6, color: '#0f172a', fontSize: 12 }}>E-form Giữ chuẩn</div>
                    <div className="rating-row">
                      <span>Hỏi sâu</span>
                      <span>
                        {selectedJournal.evaluation?.deepInquiryStatus
                          ? 'Đã thực hiện'
                          : 'Chưa thực hiện'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                      Ghi chú: {selectedJournal.evaluation?.deepInquiryNote || 'Không có'}
                    </div>
                    <div className="rating-row">
                      <span>Tư vấn đủ</span>
                      <span>
                        {selectedJournal.evaluation?.fullProposalStatus
                          ? 'Đã thực hiện'
                          : 'Chưa thực hiện'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                      Ghi chú: {selectedJournal.evaluation?.fullProposalNote || 'Không có'}
                    </div>
                    <div className="rating-row">
                      <span>Theo đến cùng</span>
                      <span>
                        {selectedJournal.evaluation?.persistenceStatus
                          ? 'Đã thực hiện'
                          : 'Chưa thực hiện'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                      Ghi chú: {selectedJournal.evaluation?.persistenceNote || 'Không có'}
                    </div>
                    <div className="coach-bubble">
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>
                        {selectedJournal.evaluation?.manager?.fullName || 'Quản lý'}
                      </div>
                      <div>
                        Nhận diện (tổng kết):{' '}
                        {selectedJournal.evaluation?.awarenessManagerNote || 'Không có'}
                      </div>
                      <div style={{ marginTop: 6 }}>
                        Giữ chuẩn (tổng kết):{' '}
                        {selectedJournal.evaluation?.standardsManagerNote || 'Không có'}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="coach-bubble">Quản lý chưa chấm điểm cho ngày này.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="coach-bubble">
              Ngày này chưa có dữ liệu nhật ký. Hãy duy trì kỷ luật để hoàn thành lộ trình.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Journey90Page;

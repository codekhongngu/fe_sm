import { useEffect, useMemo, useState } from 'react';
import journalService from '../../../services/api/journalService';

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
      setShowForm(false);
      setActiveEform('awareness');
      setForm({
        avoidance: '',
        selfLimit: '',
        earlyStop: '',
        blaming: '',
        standardsKeptText: '',
        backslideSigns: '',
        solution: '',
      });
      await loadJournals();
      setSelectedDateKey(todayKey);
      setInfoText('Đã lưu E-form Giữ chuẩn thành công');
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Nộp nhật ký thất bại');
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
        setErrorText('Vui lòng hoàn thành 4 câu hỏi của E-form Nhận diện');
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
        setInfoText('Đã lưu E-form Nhận diện. Tiếp tục sang E-form Giữ chuẩn.');
        setActiveEform('standards');
        await loadJournals();
      } catch (error) {
        setErrorText(error?.response?.data?.message || 'Lưu E-form Nhận diện thất bại');
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
                  <div className="journey-eform-chip">Thực hành nhận diện</div>
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
                  E-form 1 (Nhận diện)
                </button>
                <button
                  className={`journey-eform-tab ${activeEform === 'standards' ? 'active' : ''}`}
                  onClick={() => setActiveEform('standards')}
                >
                  E-form 2 (Giữ chuẩn)
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
                      Gợi ý: Nêu tình huống cụ thể bạn đã né tránh trong quá trình làm việc.
                    </div>
                    <textarea
                      className="field journey-eform-textarea"
                      placeholder="Tôi đã lờ đi khi khách hàng hỏi về..."
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
                      Gợi ý: Gói cước nào bạn cảm thấy không tự tin hoặc không dám tư vấn.
                    </div>
                    <textarea
                      className="field journey-eform-textarea"
                      placeholder="Tôi nghĩ khách hàng không đủ khả năng dùng gói..."
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
                      Gợi ý: Khoảnh khắc nào bạn quyết định ngắt cuộc trao đổi một cách vội vàng.
                    </div>
                    <textarea
                      className="field journey-eform-textarea"
                      placeholder="Lúc khách hàng vừa có vẻ hơi phân vân, tôi đã..."
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
                      Gợi ý: Trung thực để nhận diện nguyên nhân gốc, thay vì đổ lỗi.
                    </div>
                    <textarea
                      className="field journey-eform-textarea"
                      placeholder="Có lẽ là do tôi chưa nắm vững kiến thức về..."
                      rows={4}
                      value={form.blaming}
                      onChange={(e) => setForm((prev) => ({ ...prev, blaming: e.target.value }))}
                    />
                  </div>
                </div>
              ) : (
                <div className="journey-eform-grid standards">
                  <div className="journey-eform-card wide">
                    <div className="journey-eform-card-head">
                      <span className="journey-eform-no">01</span>
                      <span>Hôm nay tôi giữ được chuẩn nào?</span>
                    </div>
                    <div className="journey-eform-hint">
                      Nhập bằng văn bản: ví dụ "Hỏi sâu, tư vấn đủ, theo đến cùng".
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
                      Gợi ý: Chọn 1-2 dấu hiệu rõ nhất thay vì ghi quá dài.
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
                      Gợi ý: Mô tả hành động cụ thể để ngày mai tiếp tục.
                    </div>
                    <textarea
                      className="field journey-eform-textarea"
                      rows={4}
                      value={form.solution}
                      onChange={(e) => setForm((prev) => ({ ...prev, solution: e.target.value }))}
                    />
                  </div>
                </div>
              )}

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
                Mở E-form hôm nay
              </button>
              <span className={`journey-mini-badge ${todayJournal?.awarenessSubmittedAt ? 'ok' : ''}`}>
                E-form Nhận diện: {todayJournal?.awarenessSubmittedAt ? 'Đã nộp' : 'Chưa nộp'}
              </span>
              <span className={`journey-mini-badge ${todayJournal?.standardsSubmittedAt ? 'ok' : ''}`}>
                E-form Giữ chuẩn: {todayJournal?.standardsSubmittedAt ? 'Đã nộp' : 'Chưa nộp'}
              </span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Đã nộp: {progress.submittedCount}/90</div>
          </div>

          {infoText ? <div className="status-ok" style={{ marginBottom: 10 }}>{infoText}</div> : null}
          {errorText ? <div className="status-err" style={{ marginBottom: 10 }}>{errorText}</div> : null}
          {loading ? <div>Đang tải dữ liệu...</div> : null}

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
                <h4>Tôi tự nhận diện</h4>
                <ul style={{ paddingLeft: 18, marginTop: 8, fontSize: 13, color: '#1e293b' }}>
                  <li>Né tránh khách hàng: {formatDisplayText(selectedJournal.avoidance)}</li>
                  <li>Tự loại gói cước: {formatDisplayText(selectedJournal.selfLimit)}</li>
                  <li>Dừng tư vấn sớm: {formatDisplayText(selectedJournal.earlyStop)}</li>
                  <li>Lý do đổ lỗi: {formatDisplayText(selectedJournal.blaming)}</li>
                </ul>
                <div style={{ marginTop: 14 }}>
                  <strong>Chuẩn đã giữ</strong>
                  <div style={{ marginTop: 6, fontSize: 13 }}>
                    {selectedJournal?.standardsKept?.deepInquiry ? 'Hỏi sâu; ' : ''}
                    {selectedJournal?.standardsKept?.fullConsult ? 'Tư vấn đủ; ' : ''}
                    {selectedJournal?.standardsKept?.persistence ? 'Theo đến cùng' : ''}
                    {selectedJournal?.standardsKeptText
                      ? ` (${formatDisplayText(selectedJournal.standardsKeptText, '')})`
                      : ''}
                    {!selectedJournal?.standardsKept?.deepInquiry &&
                    !selectedJournal?.standardsKept?.fullConsult &&
                    !selectedJournal?.standardsKept?.persistence
                      ? 'Chưa ghi nhận'
                      : ''}
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <strong>Dấu hiệu tụt chuẩn</strong>
                  <div style={{ marginTop: 6, fontSize: 13 }}>
                    {formatDisplayText(selectedJournal.backslideSigns, 'Chưa ghi nhận')}
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <strong>Kế hoạch xử lý</strong>
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
                  <div className="coach-bubble">Quản lý chưa chấm điểm/coaching cho ngày này.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="coach-bubble">
              Ngày này chưa có dữ liệu nhật ký. Hãy duy trì kỷ luật để hoàn thành lộ trình 90 ngày.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Journey90Page;

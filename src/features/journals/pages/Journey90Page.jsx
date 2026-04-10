import { useEffect, useMemo, useState } from 'react';
import journalService from '../../../services/api/journalService';
import JourneyTimelineStepper from '../components/v2/JourneyTimelineStepper';
import Form2BehaviorChecklist from '../components/v2/Form2BehaviorChecklist';
import Form38MindsetBelief from '../components/v2/Form38MindsetBelief';
import Form4SalesReport from '../components/v2/Form4SalesReport';
import Form5QuickNote from '../components/v2/Form5QuickNote';
import Form8BeliefTransformations from '../components/v2/Form8BeliefTransformations';

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
    // Mẫu 3, 8
    form3OldMindset: '', form3NewMindset: '', form3ActionChange: '',
    form8Rows: [{ situation: '', oldBelief: '', newChosenBelief: '', newBehavior: '', result: '' }],
    // Mẫu 4
    form4Rows: [{ customerName: '', customerIssue: '', consequence: '', solutionOffered: '', valueBasedPricing: '', result: '' }],
    // Mẫu 5
    form5Lesson: '', form5Action: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [sharedForms, setSharedForms] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sharedForms') || '{}');
    } catch {
      return {};
    }
  });

  const markFormShared = (formType) => {
    const newShared = { ...sharedForms, [`${todayKey}_${formType}`]: true };
    setSharedForms(newShared);
    localStorage.setItem('sharedForms', JSON.stringify(newShared));
  };

  const isFormShared = (formType) => {
    return !!sharedForms[`${todayKey}_${formType}`];
  };

  const getFormStatus = (formType, defaultStatus) => {
    if (isFormShared(formType)) return 'APPROVED'; // Coi như khóa (read-only) nếu đã share
    return defaultStatus;
  };

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

  const [extraLogs, setExtraLogs] = useState({});

  useEffect(() => {
    if (selectedDateKey) {
      journalService.getLogsHistory(null, selectedDateKey).then(res => {
        setExtraLogs(res || {});
      }).catch(e => console.error(e));
    }
  }, [selectedDateKey]);

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

  const availableForms = useMemo(() => {
    return ['awareness', 'form3', 'form8'];
  }, []);

  const [infoText, setInfoText] = useState('');

  const submitGenericForm = async (formType, mappedPayload, successMsg, nextForm) => {
    setErrorText('');
    setInfoText('');
    setSubmitting(true);
    try {
      await journalService.submitLog(formType, {
        logDate: todayKey,
        ...mappedPayload
      });
      await loadJournals();
      setSelectedDateKey(todayKey);
      
      if (nextForm) {
        setInfoText(`${successMsg}. Tiếp tục sang mẫu tiếp theo.`);
        setActiveEform(nextForm);
      } else {
        setShowForm(false);
        setInfoText(successMsg);
        
        setInfoText(
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <span>{successMsg}</span>
            <button
              className="btn outline"
              style={{ padding: '6px 12px', fontSize: '13px' }}
              onClick={() =>
                handleShareTelegram(
                  formType === 'FORM_2'
                    ? 'behavior'
                    : formType === 'FORM_3'
                      ? 'form3'
                      : formType === 'FORM_4'
                        ? 'form4'
                        : formType === 'FORM_5'
                          ? 'form5'
                          : 'form8',
                  formType,
                  formType,
                )
              }
            >
              Nhắn Telegram
            </button>
          </div>
        );
      }
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Nộp biểu mẫu thất bại');
    } finally {
      setSubmitting(false);
    }
  };

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
      await loadJournals();
      setSelectedDateKey(todayKey);
      
      const nextIndex = availableForms.indexOf('standards') + 1;
      const nextForm = availableForms[nextIndex];
      
      if (nextForm) {
        setInfoText('Đã lưu nhật ký giữ chuẩn thu nhập cao thành công. Tiếp tục biểu mẫu tiếp theo.');
        setActiveEform(nextForm);
      } else {
        setShowForm(false);
        setInfoText('Đã lưu nhật ký giữ chuẩn thu nhập cao thành công');
      }
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Nộp nhật ký thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const submitBehaviorForm = async (payload) => {
    const nextIndex = availableForms.indexOf('behavior') + 1;
    const nextForm = availableForms[nextIndex];
    const mapped = {
      customerMetCount: Number(payload.customersMet),
      askedDeepQuestion: payload.deepInquiry,
      fullConsultation: payload.fullConsult,
      followedThrough: payload.persistence
    };
    await submitGenericForm('FORM_2', mapped, 'Đã lưu Mẫu 2: Hành vi', nextForm);
    setForm(prev => ({
      ...prev,
      customersMet: payload.customersMet,
      deepInquiry: payload.deepInquiry,
      fullConsult: payload.fullConsult,
      persistence: payload.persistence
    }));
  };

  const submitForm3 = async (payload) => {
    const nextIndex = availableForms.indexOf('form3') + 1;
    const nextForm = availableForms[nextIndex];
    const mapped = {
      negativeThought: payload.oldMindset,
      newMindset: payload.newMindset,
      behaviorChange: payload.actionChange
    };
    await submitGenericForm('FORM_3', mapped, 'Đã lưu Mẫu 3: Thay đổi Tư duy', nextForm);
    setForm(prev => ({
      ...prev,
      form3OldMindset: payload.oldMindset,
      form3NewMindset: payload.newMindset,
      form3ActionChange: payload.actionChange
    }));
  };

  const submitForm4 = async (payload) => {
    const nextIndex = availableForms.indexOf('form4') + 1;
    const nextForm = availableForms[nextIndex];
    const mapped = {
      salesActivities: payload.salesActivities || []
    };
    await submitGenericForm('FORM_4', mapped, 'Đã lưu Mẫu 4: Báo cáo bán hàng', nextForm);
    setForm(prev => ({
      ...prev,
      form4Rows: payload.salesActivities || []
    }));
  };

  const submitForm5 = async (payload) => {
    const nextIndex = availableForms.indexOf('form5') + 1;
    const nextForm = availableForms[nextIndex];
    const mapped = {
      tomorrowLesson: payload.lessonLearned,
      differentAction: payload.actionPlan
    };
    await submitGenericForm('FORM_5', mapped, 'Đã lưu Mẫu 5: Ghi chép cuối ngày', nextForm);
    setForm(prev => ({
      ...prev,
      form5Lesson: payload.lessonLearned,
      form5Action: payload.actionPlan
    }));
  };

  const submitForm8 = async (payload) => {
    const nextIndex = availableForms.indexOf('form8') + 1;
    const nextForm = availableForms[nextIndex];
    const mapped = {
      beliefTransformations: payload.beliefTransformations || []
    };
    await submitGenericForm('FORM_8', mapped, 'Đã lưu Mẫu 8: Củng cố niềm tin', nextForm);
    setForm(prev => ({
      ...prev,
      form8Rows: payload.beliefTransformations || []
    }));
  };

  const handleShareTelegram = async (shareKey, formType, formName, formPart) => {
    try {
      const detailUrl = `${window.location.origin}/discipline/manager-review/${journalsByDate[todayKey]?.id || ''}`;
      await journalService.shareTelegram({
        formType,
        formPart,
        logDate: todayKey,
        detailUrl
      });
      markFormShared(shareKey);
      setInfoText(`Đã gửi thông báo Telegram cho ${formName} thành công và khóa form.`);
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Gửi thông báo Telegram thất bại. Vui lòng kiểm tra cấu hình Bot của đơn vị.');
    }
  };

  const openTodayForm = async () => {
    setShowForm(true);
    setActiveEform('awareness');
    setInfoText('');
    setErrorText('');
    const todayJournal = journalsByDate[todayKey];
    
    try {
      let detail = {};
      if (todayJournal?.id) {
        detail = await journalService.getById(todayJournal.id).catch(() => ({}));
      }
      const extraLogsData = await journalService.getLogsHistory(null, todayKey).catch(() => ({}));
      
      setForm({
        avoidance: normalizeText(detail?.avoidance),
        selfLimit: normalizeText(detail?.selfLimit),
        earlyStop: normalizeText(detail?.earlyStop),
        blaming: normalizeText(detail?.blaming),
        standardsKeptText: normalizeText(detail?.standardsKeptText),
        backslideSigns: normalizeText(detail?.backslideSigns),
        solution: normalizeText(detail?.solution),
        customersMet: extraLogsData?.form2?.customerMetCount ?? detail?.customersMet ?? '',
        deepInquiry: extraLogsData?.form2?.askedDeepQuestion ?? !!detail?.deepInquiry,
        fullConsult: extraLogsData?.form2?.fullConsultation ?? !!detail?.fullConsult,
        persistence: extraLogsData?.form2?.followedThrough ?? !!detail?.persistence,
        form3OldMindset: extraLogsData?.form3?.negativeThought || '',
        form3NewMindset: extraLogsData?.form3?.newMindset || '',
        form3ActionChange: extraLogsData?.form3?.behaviorChange || '',
        form4Rows: Array.isArray(extraLogsData?.form4) && extraLogsData.form4.length > 0
          ? extraLogsData.form4.map((item) => ({
              customerName: item.customerName || '',
              customerIssue: item.customerIssue || '',
              consequence: item.consequence || '',
              solutionOffered: item.solutionOffered || '',
              valueBasedPricing: item.valueBasedPricing || '',
              result: item.result || '',
            }))
          : [{ customerName: '', customerIssue: '', consequence: '', solutionOffered: '', valueBasedPricing: '', result: '' }],
        form5Lesson: extraLogsData?.form5?.tomorrowLesson || '',
        form5Action: extraLogsData?.form5?.differentAction || '',
        form8Rows: Array.isArray(extraLogsData?.form8) && extraLogsData.form8.length > 0
          ? extraLogsData.form8.map((item) => ({
              situation: item.situation || '',
              oldBelief: item.oldBelief || '',
              newChosenBelief: item.newChosenBelief || '',
              newBehavior: item.newBehavior || '',
              result: item.result || '',
            }))
          : [{ situation: '', oldBelief: '', newChosenBelief: '', newBehavior: '', result: '' }],
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
        const nextIndex = availableForms.indexOf('awareness') + 1;
        const nextForm = availableForms[nextIndex];
        if (nextForm) {
          setInfoText('Đã lưu nhật ký nhận diện hàng ngày. Tiếp tục sang biểu mẫu tiếp theo');
          setActiveEform(nextForm);
        } else {
          setInfoText('Đã lưu nhật ký nhận diện hàng ngày thành công');
          setShowForm(false);
        }
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
                  <div className="journey-eform-chip">
                    {activeEform === 'awareness'
                      ? 'Nhật ký nhận diện hàng ngày'
                      : activeEform === 'form3'
                        ? 'Mẫu 3: Thay đổi Tư duy'
                        : activeEform === 'form8'
                          ? 'Mẫu 8: Củng cố niềm tin'
                          : 'Nhật ký hằng ngày'}
                  </div>
                  <h3 className="journey-eform-title">
                    {activeEform === 'awareness'
                      ? 'Nhật ký nhận diện hàng ngày'
                      : activeEform === 'form3'
                        ? 'Mẫu 3: Thay đổi Tư duy'
                        : activeEform === 'form8'
                          ? 'Mẫu 8: Củng cố niềm tin'
                          : 'Nhật ký hằng ngày'}
                  </h3>
                  <div className="journey-eform-subtitle">
                    {activeEform === 'awareness'
                      ? 'Dành vài phút để trung thực với bản thân và nhận diện điểm nghẽn.'
                      : activeEform === 'form3'
                        ? 'Ghi lại sự thay đổi tư duy và hành vi để nâng hiệu quả làm việc.'
                        : activeEform === 'form8'
                          ? 'Củng cố niềm tin mới bằng tình huống thực tế và kết quả đạt được.'
                          : 'Theo dõi nhật ký làm việc hằng ngày.'}
                  </div>
                </div>
                <button className="btn outline" onClick={() => setShowForm(false)}>
                  Đóng
                </button>
              </div>

              <div className="journey-eform-tabs" style={{ flexWrap: 'wrap', gap: '8px', paddingBottom: '8px' }}>
                {availableForms.includes('awareness') && (
                  <button
                    className={`journey-eform-tab ${activeEform === 'awareness' ? 'active' : ''}`}
                    onClick={() => setActiveEform('awareness')}
                  >
                    Mẫu 1: Nhận diện
                  </button>
                )}
                {/* {availableForms.includes('standards') && (
                  <button
                    className={`journey-eform-tab ${activeEform === 'standards' ? 'active' : ''}`}
                    onClick={() => setActiveEform('standards')}
                  >
                    Mẫu 1: Giữ chuẩn
                  </button>
                )} */}
                {availableForms.includes('behavior') && (
                  <button
                    className={`journey-eform-tab ${activeEform === 'behavior' ? 'active' : ''}`}
                    onClick={() => setActiveEform('behavior')}
                  >
                    Mẫu 2: Hành vi
                  </button>
                )}
                {availableForms.includes('form3') && (
                  <button
                    className={`journey-eform-tab ${activeEform === 'form3' ? 'active' : ''}`}
                    onClick={() => setActiveEform('form3')}
                  >
                    Mẫu 3: Thay đổi Tư duy
                  </button>
                )}
                {availableForms.includes('form4') && (
                  <button
                    className={`journey-eform-tab ${activeEform === 'form4' ? 'active' : ''}`}
                    onClick={() => setActiveEform('form4')}
                  >
                    Mẫu 4: Báo cáo Bán hàng
                  </button>
                )}
                {availableForms.includes('form5') && (
                  <button
                    className={`journey-eform-tab ${activeEform === 'form5' ? 'active' : ''}`}
                    onClick={() => setActiveEform('form5')}
                  >
                    Mẫu 5: Ghi chép cuối ngày
                  </button>
                )}
                {availableForms.includes('form8') && (
                  <button
                    className={`journey-eform-tab ${activeEform === 'form8' ? 'active' : ''}`}
                    onClick={() => setActiveEform('form8')}
                  >
                    Mẫu 8: Củng cố niềm tin
                  </button>
                )}
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
              ) : activeEform === 'behavior' ? (
                <div style={{ marginTop: '20px' }}>
                  <Form2BehaviorChecklist
                    userRole="EMPLOYEE"
                    initialData={{
                      customersMet: form.customersMet,
                      deepInquiry: form.deepInquiry,
                      fullConsult: form.fullConsult,
                      persistence: form.persistence,
                      status: getFormStatus('behavior', todayJournal?.evaluation ? 'APPROVED' : 'PENDING')
                    }}
                    onSubmit={submitBehaviorForm}
                    isSubmitting={submitting}
                  />
                  <div className="journey-eform-actions" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
                    <button
                      className="btn outline"
                      onClick={() => handleShareTelegram('behavior', 'FORM_2', 'Mẫu 2: Hành vi')}
                    >
                      Nhắn Telegram
                    </button>
                  </div>
                </div>
              ) : activeEform === 'form3' ? (
                <div style={{ marginTop: '20px' }}>
                  <Form38MindsetBelief
                    title="Mẫu 3: Thay đổi Tư duy"
                    userRole="EMPLOYEE"
                    initialData={{
                      oldMindset: form.form3OldMindset,
                      newMindset: form.form3NewMindset,
                      actionChange: form.form3ActionChange,
                      status: getFormStatus('form3', todayJournal?.evaluation ? 'APPROVED' : 'PENDING')
                    }}
                    onSubmit={submitForm3}
                    isSubmitting={submitting}
                  />
                  <div className="journey-eform-actions" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
                    <button
                      className="btn outline"
                      onClick={() => handleShareTelegram('form3', 'FORM_3', 'Mẫu 3: Thay đổi Tư duy')}
                    >
                      Nhắn Telegram
                    </button>
                  </div>
                </div>
              ) : activeEform === 'form4' ? (
                <div style={{ marginTop: '20px' }}>
                  <Form4SalesReport
                    userRole="EMPLOYEE"
                    initialData={{
                      salesActivities: form.form4Rows,
                      status: getFormStatus('form4', todayJournal?.evaluation ? 'APPROVED' : 'PENDING')
                    }}
                    onSubmit={submitForm4}
                    isSubmitting={submitting}
                  />
                  <div className="journey-eform-actions" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
                    <button
                      className="btn outline"
                      onClick={() => handleShareTelegram('form4', 'FORM_4', 'Mẫu 4: Báo cáo Bán hàng')}
                    >
                      Nhắn Telegram
                    </button>
                  </div>
                </div>
              ) : activeEform === 'form5' ? (
                <div style={{ marginTop: '20px' }}>
                  <Form5QuickNote
                    userRole="EMPLOYEE"
                    initialData={{
                      lessonLearned: form.form5Lesson,
                      actionPlan: form.form5Action,
                      status: getFormStatus('form5', todayJournal?.evaluation ? 'APPROVED' : 'PENDING')
                    }}
                    onSubmit={submitForm5}
                    isSubmitting={submitting}
                  />
                  <div className="journey-eform-actions" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
                    <button
                      className="btn outline"
                      onClick={() => handleShareTelegram('form5', 'FORM_5', 'Mẫu 5: Ghi chép cuối ngày')}
                    >
                      Nhắn Telegram
                    </button>
                  </div>
                </div>
              ) : activeEform === 'form8' ? (
                <div style={{ marginTop: '20px' }}>
                  <Form8BeliefTransformations
                    userRole="EMPLOYEE"
                    initialData={{
                      beliefTransformations: form.form8Rows,
                      status: getFormStatus('form8', todayJournal?.evaluation ? 'APPROVED' : 'PENDING')
                    }}
                    onSubmit={submitForm8}
                    isSubmitting={submitting}
                  />
                  <div className="journey-eform-actions" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
                    <button
                      className="btn outline"
                      onClick={() => handleShareTelegram('form8', 'FORM_8', 'Mẫu 8: Củng cố Niềm tin')}
                    >
                      Nhắn Telegram
                    </button>
                  </div>
                </div>
              ) : null}

              {['awareness', 'standards'].includes(activeEform) && (
                <div className="journey-eform-actions" style={{ flexWrap: 'wrap' }}>
                  <button className="btn outline" onClick={() => setShowForm(false)}>
                    Đóng
                  </button>
                  
                  {activeEform === 'awareness' ? (
                    <>
                      <button 
                        className="btn" 
                        onClick={saveAwarenessStep}
                        disabled={getFormStatus('awareness', 'PENDING') === 'APPROVED'}
                      >
                        Lưu E-form Nhận diện
                      </button>
                      <button
                        className="btn outline"
                        onClick={() =>
                          handleShareTelegram(
                            'awareness',
                            'FORM_1',
                            'Mẫu 1: Nhận diện',
                            'awareness',
                          )
                        }
                      >
                        Nhắn Telegram
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        className="btn" 
                        disabled={submitting || getFormStatus('standards', 'PENDING') === 'APPROVED'} 
                        onClick={submitStandardsForm}
                      >
                        Lưu E-form Giữ chuẩn
                      </button>
                      <button
                        className="btn outline"
                        disabled={submitting || getFormStatus('standards', 'PENDING') === 'APPROVED'}
                        onClick={() =>
                          handleShareTelegram(
                            'standards',
                            'FORM_1',
                            'Mẫu 1: Giữ chuẩn',
                            'standards',
                          )
                        }
                      >
                        Nhắn Telegram
                      </button>
                    </>
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

          {selectedJournal || extraLogs?.form2 || extraLogs?.form3 || extraLogs?.form4 || extraLogs?.form5 || extraLogs?.form8 ? (
            <div className="journey-compare">
              <div className="journey-column">
                <h4>Nhật ký nhận diện hằng ngày</h4>
                <ul style={{ paddingLeft: 18, marginTop: 8, fontSize: 13, color: '#1e293b' }}>
                  <li>Hôm nay tôi đã né điều gì: {formatDisplayText(selectedJournal?.avoidance)}</li>
                  <li>Tôi có tự loại gói nào không: {formatDisplayText(selectedJournal?.selfLimit)}</li>
                  <li>Tôi đã dừng tư vấn sớm ở điểm nào: {formatDisplayText(selectedJournal?.earlyStop)}</li>
                  <li>Khi không bán được dịch vụ anh chị thường đỗ lỗi cho vấn đề gì: {formatDisplayText(selectedJournal?.blaming)}</li>
                </ul>
                {/* <div style={{ marginTop: 14 }}>
                  <strong>Nhật ký giữ chuẩn thu nhập cao</strong>
                  <strong>Hôm nay tôi giữ được chuẩn nào</strong>
                  <div style={{ marginTop: 6, fontSize: 13 }}>
                    {formatDisplayText(selectedJournal?.standardsKeptText, 'Chưa ghi nhận')}
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <strong>Dấu hiệu tụt chuẩn nào xuất hiện</strong>
                  <div style={{ marginTop: 6, fontSize: 13 }}>
                    {formatDisplayText(selectedJournal?.backslideSigns, 'Chưa ghi nhận')}
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <strong>Tôi đã xử lý nó ra sao</strong>
                  <div style={{ marginTop: 6, fontSize: 13 }}>
                    {formatDisplayText(selectedJournal?.solution, 'Chưa ghi nhận')}
                  </div>
                </div> */}

                {extraLogs?.form3 && (
                  <div style={{ marginTop: 14 }}>
                    <strong>Mẫu 3: Thay đổi Tư duy</strong>
                    <ul style={{ paddingLeft: 18, marginTop: 8, fontSize: 13, color: '#1e293b' }}>
                      <li>Suy nghĩ tiêu cực: {formatDisplayText(extraLogs.form3.negativeThought)}</li>
                      <li>Tư duy mới: {formatDisplayText(extraLogs.form3.newMindset)}</li>
                      <li>Hành vi thay đổi: {formatDisplayText(extraLogs.form3.behaviorChange)}</li>
                    </ul>
                  </div>
                )}

                {Array.isArray(extraLogs?.form4) && extraLogs.form4.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <strong>Mẫu 4: Báo cáo Bán hàng</strong>
                    {extraLogs.form4.map((item, idx) => (
                      <ul key={`f4-${idx}`} style={{ paddingLeft: 18, marginTop: 8, fontSize: 13, color: '#1e293b' }}>
                        <li>Dòng {idx + 1} - Tên KH: {formatDisplayText(item.customerName)}</li>
                        <li>Vấn đề: {formatDisplayText(item.customerIssue)}</li>
                        <li>Hệ quả: {formatDisplayText(item.consequence)}</li>
                        <li>Giải pháp: {formatDisplayText(item.solutionOffered)}</li>
                        <li>Giá trị: {formatDisplayText(item.valueBasedPricing)}</li>
                        <li>Kết quả: {formatDisplayText(item.result)}</li>
                      </ul>
                    ))}
                  </div>
                )}

                {extraLogs?.form5 && (
                  <div style={{ marginTop: 14 }}>
                    <strong>Mẫu 5: Ghi chép cuối ngày</strong>
                    <ul style={{ paddingLeft: 18, marginTop: 8, fontSize: 13, color: '#1e293b' }}>
                      <li>Bài học: {formatDisplayText(extraLogs.form5.tomorrowLesson)}</li>
                      <li>Hành động mới: {formatDisplayText(extraLogs.form5.differentAction)}</li>
                    </ul>
                  </div>
                )}

                {Array.isArray(extraLogs?.form8) && extraLogs.form8.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <strong>Mẫu 8: Củng cố niềm tin</strong>
                    {extraLogs.form8.map((item, idx) => (
                      <ul key={`f8-${idx}`} style={{ paddingLeft: 18, marginTop: 8, fontSize: 13, color: '#1e293b' }}>
                        <li>Dòng {idx + 1} - Tình huống: {formatDisplayText(item.situation)}</li>
                        <li>Niềm tin cũ: {formatDisplayText(item.oldBelief)}</li>
                        <li>Niềm tin mới: {formatDisplayText(item.newChosenBelief)}</li>
                        <li>Hành vi mới: {formatDisplayText(item.newBehavior)}</li>
                        <li>Kết quả: {formatDisplayText(item.result)}</li>
                      </ul>
                    ))}
                  </div>
                )}
              </div>

              <div className="journey-column">
                <h4>Quản lý đánh giá</h4>
                {selectedJournal?.evaluation ? (
                  <>
                    <div style={{ fontWeight: 700, marginBottom: 6, color: '#0f172a', fontSize: 12 }}>E-form Nhận diện</div>
                    <div className="rating-row">
                      <span>Hỏi sâu hơn</span>
                      <span>
                        {selectedJournal?.evaluation?.awarenessDeepInquiryStatus
                          ? 'Đã thực hiện'
                          : 'Chưa thực hiện'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                      Ghi chú: {selectedJournal?.evaluation?.awarenessDeepInquiryNote || 'Không có'}
                    </div>
                    <div className="rating-row">
                      <span>Đề xuất đầy đủ</span>
                      <span>
                        {selectedJournal?.evaluation?.awarenessFullProposalStatus
                          ? 'Đã thực hiện'
                          : 'Chưa thực hiện'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                      Ghi chú: {selectedJournal?.evaluation?.awarenessFullProposalNote || 'Không có'}
                    </div>
                    <div className="rating-row">
                      <span>Theo đến quyết</span>
                      <span>
                        {selectedJournal?.evaluation?.awarenessPersistenceStatus
                          ? 'Đã thực hiện'
                          : 'Chưa thực hiện'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                      Ghi chú: {selectedJournal?.evaluation?.awarenessPersistenceNote || 'Không có'}
                    </div>

                    <div style={{ height: 1, background: '#e2e8f0', margin: '10px 0' }} />
                    <div style={{ fontWeight: 700, marginBottom: 6, color: '#0f172a', fontSize: 12 }}>E-form Giữ chuẩn</div>
                    <div className="rating-row">
                      <span>Hỏi sâu</span>
                      <span>
                        {selectedJournal?.evaluation?.deepInquiryStatus
                          ? 'Đã thực hiện'
                          : 'Chưa thực hiện'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                      Ghi chú: {selectedJournal?.evaluation?.deepInquiryNote || 'Không có'}
                    </div>
                    <div className="rating-row">
                      <span>Tư vấn đủ</span>
                      <span>
                        {selectedJournal?.evaluation?.fullProposalStatus
                          ? 'Đã thực hiện'
                          : 'Chưa thực hiện'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                      Ghi chú: {selectedJournal?.evaluation?.fullProposalNote || 'Không có'}
                    </div>
                    <div className="rating-row">
                      <span>Theo đến cùng</span>
                      <span>
                        {selectedJournal?.evaluation?.persistenceStatus
                          ? 'Đã thực hiện'
                          : 'Chưa thực hiện'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                      Ghi chú: {selectedJournal?.evaluation?.persistenceNote || 'Không có'}
                    </div>
                    <div className="coach-bubble">
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>
                        {selectedJournal?.evaluation?.manager?.fullName || 'Quản lý'}
                      </div>
                      <div>
                        Nhận diện (tổng kết):{' '}
                        {selectedJournal?.evaluation?.awarenessManagerNote || 'Không có'}
                      </div>
                      <div style={{ marginTop: 6 }}>
                        Giữ chuẩn (tổng kết):{' '}
                        {selectedJournal?.evaluation?.standardsManagerNote || 'Không có'}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="coach-bubble">Quản lý chưa chấm điểm (Mẫu 1) cho ngày này.</div>
                )}

                {extraLogs?.form2 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ height: 1, background: '#e2e8f0', margin: '10px 0' }} />
                    <div style={{ fontWeight: 700, marginBottom: 6, color: '#0f172a', fontSize: 12 }}>Mẫu 2: Hành vi</div>
                    <div className="rating-row">
                      <span>Số khách gặp</span>
                      <span>{extraLogs.form2.customerMetCount || 0}</span>
                    </div>
                    <div className="rating-row">
                      <span>Hỏi sâu</span>
                      <span>
                        {extraLogs.form2.mgrEvalDeepQ === true
                          ? 'Đạt'
                          : extraLogs.form2.mgrEvalDeepQ === false
                            ? 'Chưa đạt'
                            : 'Chưa chấm'}
                      </span>
                    </div>
                    <div className="rating-row">
                      <span>Tư vấn đủ</span>
                      <span>
                        {extraLogs.form2.mgrEvalFullCons === true
                          ? 'Đạt'
                          : extraLogs.form2.mgrEvalFullCons === false
                            ? 'Chưa đạt'
                            : 'Chưa chấm'}
                      </span>
                    </div>
                    <div className="rating-row">
                      <span>Theo đến cùng</span>
                      <span>
                        {extraLogs.form2.mgrEvalFollow === true
                          ? 'Đạt'
                          : extraLogs.form2.mgrEvalFollow === false
                            ? 'Chưa đạt'
                            : 'Chưa chấm'}
                      </span>
                    </div>
                  </div>
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

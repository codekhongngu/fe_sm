import { useEffect, useMemo, useState } from 'react';
import journalService from '../../../services/api/journalService';
import catalogService from '../../../services/api/catalogService';
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

import { BusinessTimeUtil } from '../../../utils/BusinessTimeUtil';
import { useSelector } from 'react-redux';
import { selectAuth } from '../../../store/auth/AuthSlice';

const formatDisplayText = (value, fallback = '-') => normalizeText(value) || fallback;

const getEffectiveToday = (isManager = false) => {
  return BusinessTimeUtil.getEffectiveBusinessDate(undefined, isManager).toDate();
};

const getStartOfWeek = (date) => {
  const day = date.getDay() || 7;
  const start = new Date(date);
  start.setDate(date.getDate() - day + 1);
  start.setHours(0, 0, 0, 0);
  return start;
};

const isWeekendDateKey = (dateKey) => {
  const day = fromDateKey(dateKey).getDay();
  return day === 0 || day === 6;
};

const PHASE_FORM_MAP = {
  PHASE_1: ['awareness', 'form3', 'form8'],
  PHASE_2: ['behavior', 'form3', 'form4', 'form5'],
  PHASE_3: ['form3', 'form4', 'form5', 'form7', 'form9', 'form12'],
};

const resolveAllowedFormsByDate = (dateKey, phaseConfigs) => {
  const activePhaseConfigs = (Array.isArray(phaseConfigs) ? phaseConfigs : [])
    .filter((item) => item?.isActive !== false)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));

  const matched =
    activePhaseConfigs.find(
      (item) =>
        item.startDate &&
        item.endDate &&
        dateKey >= item.startDate &&
        dateKey <= item.endDate
    ) || null;

  if (matched && Array.isArray(matched.allowedForms) && matched.allowedForms.length > 0) {
    return matched.allowedForms;
  }

  const phaseCode = String(matched?.phaseCode || '').toUpperCase();
  return PHASE_FORM_MAP[phaseCode] || PHASE_FORM_MAP.PHASE_1;
};

const COACHING_PHASE_FORM_MAP = {
  PHASE_1: ['coaching_form_1'],
  PHASE_2: ['coaching_form_2'],
  PHASE_3: ['coaching_form_2'],
};

const COACHING_FORM_LABELS = {
  coaching_form_1: 'Mẫu coaching 1',
  coaching_form_2: 'Mẫu coaching 2',
};

const resolveAllowedCoachingFormsByDate = (dateKey, coachingPhaseConfigs) => {
  const activePhaseConfigs = (Array.isArray(coachingPhaseConfigs) ? coachingPhaseConfigs : [])
    .filter((item) => item?.isActive !== false)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));

  const matched =
    activePhaseConfigs.find(
      (item) =>
        item.startDate &&
        item.endDate &&
        dateKey >= item.startDate &&
        dateKey <= item.endDate,
    ) || null;

  if (
    matched &&
    Array.isArray(matched.allowedCoachingForms) &&
    matched.allowedCoachingForms.length > 0
  ) {
    return matched.allowedCoachingForms;
  }

  const phaseCode = String(matched?.phaseCode || '').toUpperCase();
  return COACHING_PHASE_FORM_MAP[phaseCode] || COACHING_PHASE_FORM_MAP.PHASE_1;
};

const createInitialCoachingDraft = () => ({
  salesPlan: '0',
  customerName: '',
  ward: '',
  customerAddress: '',
  oldReferral: '0',
  customerFollowUp: '0',
  noEarlyQuote: '0',
  consultStandard: '0',
  consultEnoughLayers: '0',
  consultSolutionMatchingNeed: '0',
  consultClearBenefit: '0',
  consultMentionLossAvoidance: '0',
  closedService: '0',
  personalRevenue: '',
  nextFollowRequired: '0',
  nextFollowStep: '',
  nextFollowSchedule: '',
});

const Journey90Page = () => {
  const { user } = useSelector(selectAuth);
  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const isEmployee = user?.role === 'EMPLOYEE';

  const todayDefault = toDateKey(getEffectiveToday(isManager));
  const fromDefault = (() => {
    const d = getEffectiveToday(isManager);
    d.setDate(d.getDate() - 89);
    return toDateKey(d);
  })();
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [journalsByDate, setJournalsByDate] = useState({});
  const [timelineFormStatuses, setTimelineFormStatuses] = useState({});
  const [selectedDateKey, setSelectedDateKey] = useState('');
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [timeFilter, setTimeFilter] = useState('last_90');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [showCoachingForm, setShowCoachingForm] = useState(false);
  const [coachingSaving, setCoachingSaving] = useState(false);
  const [coachingImporting, setCoachingImporting] = useState(false);
  const [coachingCustomers, setCoachingCustomers] = useState([]);
  const [wardOptions, setWardOptions] = useState([]);
  const [activeEform, setActiveEform] = useState('awareness');
  const [fromDate, setFromDate] = useState(fromDefault);
  const [toDate, setToDate] = useState(todayDefault);
  const [phaseConfigs, setPhaseConfigs] = useState([]);
  const [coachingPhaseConfigs, setCoachingPhaseConfigs] = useState([]);
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
    // Mẫu 7
    form7KeptStandard: '', form7BackslideSign: '', form7Solution: '',
    // Mẫu 9
    form9SelfLimitArea: '', form9ProofBehavior: '', form9RaiseStandard: '', form9ActionPlan: '',
    // Mẫu 12
    form12DeclarationText:
      'Tôi là nhân viên bán hàng VNPT.\nTôi mang đến giải pháp giúp khách hàng kết nối, học tập, làm việc và an tâm.\nTôi tư vấn bằng trách nhiệm, bán bằng giá trị và thu nhập của tôi tăng tương xứng.',
    form12CommitmentSignature: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [coachingDraft, setCoachingDraft] = useState(createInitialCoachingDraft());
  const todayKey = toDateKey(getEffectiveToday(isManager));
  const coachingDateKey = selectedDateKey || todayKey;
  const availableCoachingForms = useMemo(() => {
    return resolveAllowedCoachingFormsByDate(coachingDateKey, coachingPhaseConfigs);
  }, [coachingDateKey, coachingPhaseConfigs]);
  const activeCoachingForm = availableCoachingForms[0] || 'coaching_form_1';
  const activeCoachingFormLabel = COACHING_FORM_LABELS[activeCoachingForm] || 'Mẫu coaching 1';
  const isCoachingForm1 = activeCoachingForm === 'coaching_form_1';

  const handleCoachingDraftChange = (field, value) => {
    setCoachingDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetCoachingDraft = () => {
    setCoachingDraft(createInitialCoachingDraft());
  };

  const loadCoachingCustomers = async (logDate, coachingForm) => {
    try {
      const data = await journalService.getDailyCoachingCustomers(logDate, coachingForm);
      setCoachingCustomers(Array.isArray(data) ? data : []);
    } catch {
      setCoachingCustomers([]);
    }
  };

  const loadWardOptions = async () => {
    try {
      const rows = await catalogService.listWards();
      const activeRows = (Array.isArray(rows) ? rows : []).filter((item) => item?.isActive !== false);
      setWardOptions(activeRows);
    } catch {
      setWardOptions([]);
    }
  };

  const handleSaveCoachingDraft = async () => {
    if (!String(coachingDraft.customerName || '').trim()) {
      setErrorText('Vui lòng nhập tên khách hàng trước khi lưu coaching.');
      return;
    }

    setCoachingSaving(true);
    setErrorText('');
    try {
      const payload = {
        coachingForm: activeCoachingForm,
        logDate: coachingDateKey,
        salesPlan: Number(coachingDraft.salesPlan || 0),
        customerName: String(coachingDraft.customerName || '').trim(),
        ward: String(coachingDraft.ward || '').trim(),
        customerAddress: String(coachingDraft.customerAddress || '').trim(),
        oldReferral: Number(coachingDraft.oldReferral || 0),
        customerFollowUp: Number(coachingDraft.customerFollowUp || 0),
        noEarlyQuote: Number(coachingDraft.noEarlyQuote || 0),
        consultStandard:
          isCoachingForm1
            ? Number(coachingDraft.consultStandard || 0)
            : Number(coachingDraft.consultEnoughLayers || 0) &&
              Number(coachingDraft.consultSolutionMatchingNeed || 0) &&
              Number(coachingDraft.consultClearBenefit || 0) &&
              Number(coachingDraft.consultMentionLossAvoidance || 0)
              ? 1
              : 0,
        consultEnoughLayers: isCoachingForm1 ? 0 : Number(coachingDraft.consultEnoughLayers || 0),
        consultSolutionMatchingNeed: isCoachingForm1 ? 0 : Number(coachingDraft.consultSolutionMatchingNeed || 0),
        consultClearBenefit: isCoachingForm1 ? 0 : Number(coachingDraft.consultClearBenefit || 0),
        consultMentionLossAvoidance: isCoachingForm1 ? 0 : Number(coachingDraft.consultMentionLossAvoidance || 0),
        closedService: Number(coachingDraft.closedService || 0),
        personalRevenue: String(coachingDraft.personalRevenue || '0').trim() || '0',
        nextFollowRequired: Number(coachingDraft.nextFollowRequired || 0),
        nextFollowStep: String(coachingDraft.nextFollowStep || '').trim(),
        nextFollowSchedule: coachingDraft.nextFollowSchedule || undefined,
      };

      await journalService.saveDailyCoachingCustomer(payload);
      await loadCoachingCustomers(coachingDateKey, activeCoachingForm);
      setInfoText(`Đã lưu form coaching cho ngày ${coachingDateKey}.`);
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Lưu form coaching thất bại.');
    } finally {
      setCoachingSaving(false);
    }
  };

  const handleImportCoachingExcel = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (selectedStatus === 'future') {
      setErrorText('Chưa đến ngày này, chưa thể import coaching.');
      return;
    }

    setCoachingImporting(true);
    setErrorText('');
    try {
      const result = await journalService.importDailyCoachingCustomers(
        file,
        coachingDateKey,
        activeCoachingForm,
      );
      await loadCoachingCustomers(coachingDateKey, activeCoachingForm);
      setInfoText(
        `Import coaching thành công (${result.imported}/${result.total}) cho ngày ${coachingDateKey}.`,
      );
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Import coaching thất bại.');
    } finally {
      setCoachingImporting(false);
    }
  };

  const handleDownloadCoachingTemplate = async () => {
    setErrorText('');
    try {
      const blob = await journalService.downloadDailyCoachingCustomersTemplate(activeCoachingForm);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'mau-import-coaching-khach-hang.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Không tải được file mẫu import coaching.');
    }
  };

  const isFormShared = (formType) => {
    if (!todayJournal) return false;
    
    // Check shared status from DB response
    if (formType === 'awareness' && todayJournal.awarenessShared) return true;
    if (formType === 'standards' && todayJournal.standardsShared) return true;
    if (formType === 'behavior' && extraLogs?.form2?.isShared) return true;
    if (formType === 'form3' && extraLogs?.form3?.isShared) return true;
    if (formType === 'form4' && Array.isArray(extraLogs?.form4) && extraLogs.form4[0]?.isShared) return true;
    if (formType === 'form5' && extraLogs?.form5?.isShared) return true;
    if (formType === 'form7' && extraLogs?.form7?.isShared) return true;
    if (formType === 'form8' && Array.isArray(extraLogs?.form8) && extraLogs.form8[0]?.isShared) return true;
    if (formType === 'form9' && extraLogs?.form9?.isShared) return true;
    if (formType === 'form12' && extraLogs?.form12?.isShared) return true;
    
    return false;
  };

  const getFormStatus = (formType, defaultStatus) => {
    // Kiểm tra xem form đã được nhập chưa dựa trên dữ liệu hiện có
    let isFilled = false;
    if (formType === 'awareness') isFilled = !!todayJournal?.awarenessSubmittedAt;
    if (formType === 'standards') isFilled = !!todayJournal?.standardsSubmittedAt;
    if (formType === 'behavior') isFilled = !!extraLogs?.form2;
    if (formType === 'form3') isFilled = !!extraLogs?.form3;
    if (formType === 'form4') isFilled = Array.isArray(extraLogs?.form4) && extraLogs.form4.length > 0;
    if (formType === 'form5') isFilled = !!extraLogs?.form5;
    if (formType === 'form7') isFilled = !!extraLogs?.form7;
    if (formType === 'form8') isFilled = Array.isArray(extraLogs?.form8) && extraLogs.form8.length > 0;
    if (formType === 'form9') isFilled = !!extraLogs?.form9;
    if (formType === 'form12') isFilled = !!extraLogs?.form12;

    // Chưa có dữ liệu thật thì phải là chưa nộp, không được hiển thị "Chờ duyệt"
    if (!isFilled) return 'NOT_SUBMITTED';

    // Nếu quản lý đã duyệt (status = APPROVED) -> khóa
    let reviewStatus = 'PENDING';
    if (formType === 'awareness') reviewStatus = extraLogs?.reviews?.FORM_1_AWARENESS?.status;
    if (formType === 'standards') reviewStatus = extraLogs?.reviews?.FORM_1_STANDARDS?.status;
    if (formType === 'behavior') reviewStatus = extraLogs?.reviews?.FORM_2?.status;
    if (formType === 'form3') reviewStatus = extraLogs?.reviews?.FORM_3?.status;
    if (formType === 'form4') reviewStatus = extraLogs?.reviews?.FORM_4?.status;
    if (formType === 'form5') reviewStatus = extraLogs?.reviews?.FORM_5?.status;
    if (formType === 'form7') reviewStatus = extraLogs?.reviews?.FORM_7?.status;
    if (formType === 'form8') reviewStatus = extraLogs?.reviews?.FORM_8?.status;
    if (formType === 'form9') reviewStatus = extraLogs?.reviews?.FORM_9?.status;
    if (formType === 'form12') reviewStatus = extraLogs?.reviews?.FORM_12?.status;

    if (reviewStatus === 'APPROVED') return 'APPROVED';
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
      let timelineStatuses = {};
      if (isEmployee) {
        try {
          timelineStatuses =
            (await journalService.getJourneyTimelineFormStatuses({
              fromDate: fromDate || undefined,
              toDate: toDate || undefined,
            })) || {};
        } catch {
          timelineStatuses = {};
        }
      }
      const map = {};
      journals.forEach((journal) => {
        const key = journal.reportDate || toDateKey(new Date(journal.createdAt));
        if (!map[key] || new Date(journal.createdAt) > new Date(map[key].createdAt)) {
          map[key] = journal;
        }
      });
      setJournalsByDate(map);
      setTimelineFormStatuses(timelineStatuses || {});
      setSelectedDateKey(toDateKey(getEffectiveToday(isManager)));
    } catch (error) {
      const msg = error?.response?.data?.message;
      if (msg !== 'Forbidden resource') {
        setErrorText(msg || 'Không tải được lịch sử nhật ký');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJournals();
  }, [fromDate, toDate, statusFilter]);

  useEffect(() => {
    journalService
      .getJourneyPhaseConfigs()
      .then((rows) => setPhaseConfigs(Array.isArray(rows) ? rows : []))
      .catch(() => setPhaseConfigs([]));
  }, []);

  useEffect(() => {
    journalService
      .getCoachingPhaseConfigs()
      .then((rows) => setCoachingPhaseConfigs(Array.isArray(rows) ? rows : []))
      .catch(() => setCoachingPhaseConfigs([]));
  }, []);

  const [extraLogs, setExtraLogs] = useState({});

  useEffect(() => {
    if (selectedDateKey) {
      journalService.getLogsHistory(null, selectedDateKey).then(res => {
        setExtraLogs(res || {});
      }).catch(e => console.error(e));
    }
  }, [selectedDateKey]);

  useEffect(() => {
    if (!isEmployee) {
      setCoachingCustomers([]);
      return;
    }
    loadCoachingCustomers(coachingDateKey, activeCoachingForm);
  }, [coachingDateKey, activeCoachingForm, isEmployee]);

  useEffect(() => {
    if (!isEmployee) {
      setWardOptions([]);
      return;
    }
    loadWardOptions();
  }, [isEmployee]);

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
        const msg = error?.response?.data?.message;
        if (msg !== 'Forbidden resource') {
          setErrorText(msg || 'Không tải được chi tiết ngày');
        }
      }
    };
    if (selectedDateKey) {
      run();
    }
  }, [selectedDateKey, journalsByDate]);

  const cycleStartDateKey = useMemo(() => {
    const phaseStartDate = (Array.isArray(phaseConfigs) ? phaseConfigs : [])
      .filter((item) => item?.isActive !== false && item?.startDate)
      .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)))[0]?.startDate;
    if (phaseStartDate) {
      return phaseStartDate;
    }
    if (fromDate) {
      return fromDate;
    }
    const keys = Object.keys(journalsByDate);
    if (keys.length === 0) {
      return toDateKey(getEffectiveToday(isManager));
    }
    return [...keys].sort()[0];
  }, [phaseConfigs, fromDate, journalsByDate, isManager]);

  const timelineEntries = useMemo(() => {
    const startDate = fromDateKey(cycleStartDateKey);
    const today = getEffectiveToday(isManager);
    return Array.from({ length: 90 }).map((_, idx) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + idx);
      const dateKey = toDateKey(date);
      const journal = journalsByDate[dateKey];
      const isFuture = date > today;
      const formStatuses = timelineFormStatuses[dateKey] || {};
      const approvedStatuses = formStatuses.approved || {};
      const allowedForms = resolveAllowedFormsByDate(dateKey, phaseConfigs);
      const submittedForms = allowedForms.filter((formKey) => !!formStatuses[formKey]);
      let status = 'missed';
      if (isFuture) {
        status = 'future';
      } else if (submittedForms.length === 0) {
        status = 'missed';
      } else if (submittedForms.every((formKey) => !!approvedStatuses[formKey])) {
        status = 'graded';
      } else {
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
  }, [journalsByDate, cycleStartDateKey, isManager, phaseConfigs, timelineFormStatuses]);

  const filteredEntries = useMemo(() => {
    const now = getEffectiveToday(isManager);
    const startOfWeek = getStartOfWeek(now);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return timelineEntries.filter((entry) => {
      if (isWeekendDateKey(entry.dateKey)) {
        return false;
      }
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

  useEffect(() => {
    if (filteredEntries.length === 0) {
      return;
    }
    const isSelectedVisible = filteredEntries.some((entry) => entry.dateKey === selectedDateKey);
    if (isSelectedVisible) {
      return;
    }
    const fallbackEntry =
      [...filteredEntries]
        .reverse()
        .find((entry) => entry.dateKey <= todayKey && entry.status !== 'future') ||
      filteredEntries[filteredEntries.length - 1] ||
      filteredEntries[0];
    if (fallbackEntry?.dateKey && fallbackEntry.dateKey !== selectedDateKey) {
      setSelectedDateKey(fallbackEntry.dateKey);
    }
  }, [filteredEntries, selectedDateKey, todayKey]);

  const progress = useMemo(() => {
    const submittedCount = timelineEntries.filter(
      (entry) => entry.status === 'pending' || entry.status === 'graded'
    ).length;
    let streak = 0;
    const todayKey = toDateKey(getEffectiveToday(isManager));
    let cursor = fromDateKey(todayKey);
    while (true) {
      const key = toDateKey(cursor);
      const entry = timelineEntries.find((item) => item.dateKey === key);
      if (entry && (entry.status === 'pending' || entry.status === 'graded')) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    const cycleStart = fromDateKey(cycleStartDateKey);
    const now = getEffectiveToday(isManager);
    const currentDay = Math.max(
      1,
      Math.min(90, Math.floor((now.getTime() - cycleStart.getTime()) / 86400000) + 1),
    );
    return { submittedCount, streak, currentDay };
  }, [timelineEntries, cycleStartDateKey, isManager]);

  const todayJournal = journalsByDate[todayKey];

  const selectedStatus = selectedDateKey
    ? (() => {
        const selectedDate = fromDateKey(selectedDateKey);
        const today = getEffectiveToday(isManager);
        if (selectedDate > today) return 'future';
        return timelineEntries.find((entry) => entry.dateKey === selectedDateKey)?.status || 'missed';
      })()
    : 'missed';

  const availableForms = useMemo(() => {
    const today = toDateKey(getEffectiveToday(isManager));
    return resolveAllowedFormsByDate(today, phaseConfigs);
  }, [phaseConfigs, isManager]);

  useEffect(() => {
    if (!availableForms.includes(activeEform)) {
      setActiveEform(availableForms[0] || 'awareness');
    }
  }, [availableForms, activeEform]);

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
      }
    } catch (error) {
      const msg = error?.response?.data?.message;
      if (msg !== 'Forbidden resource') {
        setErrorText(msg || 'Nộp biểu mẫu thất bại');
      }
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
      const msg = error?.response?.data?.message;
      if (msg !== 'Forbidden resource') {
        setErrorText(msg || 'Nộp nhật ký thất bại');
      }
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

  const submitForm7 = async () => {
    const nextIndex = availableForms.indexOf('form7') + 1;
    const nextForm = availableForms[nextIndex];
    const mapped = {
      keptStandard: form.form7KeptStandard,
      backslideSign: form.form7BackslideSign,
      phase3Solution: form.form7Solution,
    };
    await submitGenericForm('FORM_7', mapped, 'Đã lưu Mẫu 7: Nhật ký giữ chuẩn thu nhập', nextForm);
  };

  const submitForm9 = async () => {
    const nextIndex = availableForms.indexOf('form9') + 1;
    const nextForm = availableForms[nextIndex];
    const mapped = {
      selfLimitArea: form.form9SelfLimitArea,
      proofBehavior: form.form9ProofBehavior,
      raiseStandard: form.form9RaiseStandard,
      actionPlan: form.form9ActionPlan,
    };
    await submitGenericForm('FORM_9', mapped, 'Đã lưu Mẫu 9: Nhật ký phá giới hạn thu nhập', nextForm);
  };

  const submitForm12 = async () => {
    const nextIndex = availableForms.indexOf('form12') + 1;
    const nextForm = availableForms[nextIndex];
    const mapped = {
      declarationText: form.form12DeclarationText,
      commitmentSignature: form.form12CommitmentSignature,
    };
    await submitGenericForm('FORM_12', mapped, 'Đã lưu Mẫu 12: Tuyên ngôn nghề nghiệp cá nhân', nextForm);
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
      // Tải lại để lấy cờ shared mới nhất từ server
      await loadJournals();
      if (selectedDateKey) {
        journalService.getLogsHistory(null, selectedDateKey).then(res => {
          setExtraLogs(res || {});
        }).catch(e => console.error(e));
      }
      setInfoText(`Đã gửi thông báo Telegram cho ${formName} thành công và khóa form.`);
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Gửi thông báo Telegram thất bại. Vui lòng kiểm tra cấu hình Bot của đơn vị.');
    }
  };

  const openTodayForm = async () => {
    setShowForm(true);
    setActiveEform(availableForms[0] || 'awareness');
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
        form7KeptStandard: extraLogsData?.form7?.keptStandard || '',
        form7BackslideSign: extraLogsData?.form7?.backslideSign || '',
        form7Solution: extraLogsData?.form7?.solution || '',
        form9SelfLimitArea: extraLogsData?.form9?.selfLimitArea || '',
        form9ProofBehavior: extraLogsData?.form9?.proofBehavior || '',
        form9RaiseStandard: extraLogsData?.form9?.raiseStandard || '',
        form9ActionPlan: extraLogsData?.form9?.actionPlan || '',
        form12DeclarationText:
          extraLogsData?.form12?.declarationText ||
          'Tôi là nhân viên bán hàng VNPT.\nTôi mang đến giải pháp giúp khách hàng kết nối, học tập, làm việc và an tâm.\nTôi tư vấn bằng trách nhiệm, bán bằng giá trị và thu nhập của tôi tăng tương xứng.',
        form12CommitmentSignature: extraLogsData?.form12?.commitmentSignature || '',
      });
    } catch (error) {
      const msg = error?.response?.data?.message;
      if (msg !== 'Forbidden resource') {
        setErrorText(msg || 'Không tải được dữ liệu hôm nay');
      }
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
        const msg = error?.response?.data?.message;
        if (msg !== 'Forbidden resource') {
          setErrorText(msg || 'Lưu nhật ký nhận diện hàng ngày thất bại');
        }
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
                        : activeEform === 'form7'
                          ? 'Mẫu 7: Nhật ký giữ chuẩn thu nhập'
                          : activeEform === 'form9'
                            ? 'Mẫu 9: Nhật ký phá giới hạn thu nhập'
                            : activeEform === 'form12'
                              ? 'Mẫu 12: Tuyên ngôn nghề nghiệp cá nhân'
                        : activeEform === 'form8'
                          ? 'Mẫu 8: Củng cố niềm tin'
                          : 'Nhật ký hằng ngày'}
                  </div>
                  <h3 className="journey-eform-title">
                    {activeEform === 'awareness'
                      ? 'Nhật ký nhận diện hàng ngày'
                      : activeEform === 'form3'
                        ? 'Mẫu 3: Thay đổi Tư duy'
                        : activeEform === 'form7'
                          ? 'Mẫu 7: Nhật ký giữ chuẩn thu nhập'
                          : activeEform === 'form9'
                            ? 'Mẫu 9: Nhật ký phá giới hạn thu nhập'
                            : activeEform === 'form12'
                              ? 'Mẫu 12: Tuyên ngôn nghề nghiệp cá nhân'
                        : activeEform === 'form8'
                          ? 'Mẫu 8: Củng cố niềm tin'
                          : 'Nhật ký hằng ngày'}
                  </h3>
                  <div className="journey-eform-subtitle">
                    {activeEform === 'awareness'
                      ? 'Dành vài phút để trung thực với bản thân và nhận diện điểm nghẽn.'
                      : activeEform === 'form3'
                        ? 'Ghi lại sự thay đổi tư duy và hành vi để nâng hiệu quả làm việc.'
                        : activeEform === 'form7'
                          ? 'Giữ chuẩn thu nhập mới và ngăn ngừa tụt chuẩn trong giai đoạn 3.'
                          : activeEform === 'form9'
                            ? 'Phá trần thu nhập bằng hành động cụ thể và nâng chuẩn nội tâm.'
                            : activeEform === 'form12'
                              ? 'Tuyên ngôn nghề nghiệp cá nhân và cam kết hành động.'
                        : activeEform === 'form8'
                          ? 'Củng cố niềm tin mới bằng tình huống thực tế và kết quả đạt được.'
                          : 'Theo dõi nhật ký làm việc hằng ngày.'}
                  </div>
                </div>
                <button className="btn outline" onClick={() => setShowForm(false)}>
                  Đóng
                </button>
              </div>

              {BusinessTimeUtil.isWeekendLocked(undefined, isManager) ? (
                <div style={{ padding: '20px', background: '#fff3cd', color: '#92400e', borderRadius: '12px', border: '1px solid #fde68a', marginBottom: '20px' }}>
                  <h3 style={{ marginTop: 0 }}>Cuối tuần nghỉ ngơi!</h3>
                  <p>Hệ thống hiện đang khóa chức năng nộp nhật ký. Dữ liệu bán hàng/tương tác phát sinh trong Thứ 7, Chủ Nhật vui lòng cộng dồn và khai báo vào Thứ Hai tuần sau nhé.</p>
                </div>
              ) : (
                <>
                  {BusinessTimeUtil.isAccumulationDay(undefined, isManager) && (
                    <div style={{ padding: '12px 16px', background: '#e0f2fe', color: '#0369a1', borderRadius: '8px', border: '1px solid #bae6fd', marginBottom: '16px', fontSize: '14px' }}>
                      💡 <strong>Ghi chú Thứ Hai:</strong> Bạn có thể cộng dồn các số liệu phát sinh của Thứ 7 và Chủ Nhật vào tờ khai ngày hôm nay.
                    </div>
                  )}
                  {infoText && <div className="status-ok" style={{ marginBottom: 14 }}>{infoText}</div>}
                  {errorText && <div className="status-err" style={{ marginBottom: 14 }}>{errorText}</div>}

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
                {availableForms.includes('form7') && (
                  <button
                    className={`journey-eform-tab ${activeEform === 'form7' ? 'active' : ''}`}
                    onClick={() => setActiveEform('form7')}
                  >
                    Mẫu 7: Giữ chuẩn thu nhập
                  </button>
                )}
                {availableForms.includes('form9') && (
                  <button
                    className={`journey-eform-tab ${activeEform === 'form9' ? 'active' : ''}`}
                    onClick={() => setActiveEform('form9')}
                  >
                    Mẫu 9: Phá giới hạn thu nhập
                  </button>
                )}
                {availableForms.includes('form12') && (
                  <button
                    className={`journey-eform-tab ${activeEform === 'form12' ? 'active' : ''}`}
                    onClick={() => setActiveEform('form12')}
                  >
                    Mẫu 12: Tuyên ngôn nghề nghiệp
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
                      <span>Khi không bán được dịch vụ anh chị thường đỗ lỗi cho vấn đề gì?</span>
                    </div>
                    <div className="journey-eform-hint">
                      {/* Gợi ý: Trung thực để nhận diện nguyên nhân gốc, thay vì đổ lỗi. */}
                    </div>
                    <textarea
                      className="field journey-eform-textarea"
                      placeholder="Vui lòng nhập lý do khi không bán được dịch vụ anh chị thường đỗ lỗi cho vấn đề gì."
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
              ) : activeEform === 'form7' ? (
                <div className="journey-eform-grid standards">
                  <div className="journey-eform-card wide">
                    <div className="journey-eform-card-head">
                      <span className="journey-eform-no">01</span>
                      <span>Tôi đã giữ được chuẩn nào?</span>
                    </div>
                    <textarea
                      className="field journey-eform-textarea"
                      rows={4}
                      value={form.form7KeptStandard}
                      onChange={(e) => setForm((prev) => ({ ...prev, form7KeptStandard: e.target.value }))}
                    />
                  </div>
                  <div className="journey-eform-card">
                    <div className="journey-eform-card-head">
                      <span className="journey-eform-no">02</span>
                      <span>Dấu hiệu tụt chuẩn nào xuất hiện?</span>
                    </div>
                    <textarea
                      className="field journey-eform-textarea"
                      rows={4}
                      value={form.form7BackslideSign}
                      onChange={(e) => setForm((prev) => ({ ...prev, form7BackslideSign: e.target.value }))}
                    />
                  </div>
                  <div className="journey-eform-card">
                    <div className="journey-eform-card-head">
                      <span className="journey-eform-no">03</span>
                      <span>Tôi đã xử lý nó ra sao?</span>
                    </div>
                    <textarea
                      className="field journey-eform-textarea"
                      rows={4}
                      value={form.form7Solution}
                      onChange={(e) => setForm((prev) => ({ ...prev, form7Solution: e.target.value }))}
                    />
                  </div>
                  <div className="journey-eform-actions" style={{ justifyContent: 'flex-end', width: '100%' }}>
                    <button className="btn" onClick={submitForm7} disabled={submitting}>
                      {submitting ? 'Đang lưu...' : 'Lưu Mẫu 7'}
                    </button>
                  </div>
                </div>
              ) : activeEform === 'form9' ? (
                <div className="journey-eform-grid standards">
                  <div className="journey-eform-card">
                    <div className="journey-eform-card-head">
                      <span className="journey-eform-no">01</span>
                      <span>Tôi đang tự giới hạn thu nhập ở đâu?</span>
                    </div>
                    <textarea
                      className="field journey-eform-textarea"
                      rows={4}
                      value={form.form9SelfLimitArea}
                      onChange={(e) => setForm((prev) => ({ ...prev, form9SelfLimitArea: e.target.value }))}
                    />
                  </div>
                  <div className="journey-eform-card">
                    <div className="journey-eform-card-head">
                      <span className="journey-eform-no">02</span>
                      <span>Hành vi chứng minh điều đó</span>
                    </div>
                    <textarea
                      className="field journey-eform-textarea"
                      rows={4}
                      value={form.form9ProofBehavior}
                      onChange={(e) => setForm((prev) => ({ ...prev, form9ProofBehavior: e.target.value }))}
                    />
                  </div>
                  <div className="journey-eform-card">
                    <div className="journey-eform-card-head">
                      <span className="journey-eform-no">03</span>
                      <span>Tôi nâng chuẩn thu nhập lên thế nào</span>
                    </div>
                    <textarea
                      className="field journey-eform-textarea"
                      rows={4}
                      value={form.form9RaiseStandard}
                      onChange={(e) => setForm((prev) => ({ ...prev, form9RaiseStandard: e.target.value }))}
                    />
                  </div>
                  <div className="journey-eform-card">
                    <div className="journey-eform-card-head">
                      <span className="journey-eform-no">04</span>
                      <span>Hành động cụ thể</span>
                    </div>
                    <textarea
                      className="field journey-eform-textarea"
                      rows={4}
                      value={form.form9ActionPlan}
                      onChange={(e) => setForm((prev) => ({ ...prev, form9ActionPlan: e.target.value }))}
                    />
                  </div>
                  <div className="journey-eform-actions" style={{ justifyContent: 'flex-end', width: '100%' }}>
                    <button className="btn" onClick={submitForm9} disabled={submitting}>
                      {submitting ? 'Đang lưu...' : 'Lưu Mẫu 9'}
                    </button>
                  </div>
                </div>
              ) : activeEform === 'form12' ? (
                <div className="journey-eform-grid standards">
                  <div className="journey-eform-card wide">
                    <div className="journey-eform-card-head">
                      <span className="journey-eform-no">01</span>
                      <span>Tuyên ngôn nghề nghiệp cá nhân</span>
                    </div>
                    <textarea
                      className="field journey-eform-textarea"
                      rows={5}
                      value={form.form12DeclarationText}
                      onChange={(e) => setForm((prev) => ({ ...prev, form12DeclarationText: e.target.value }))}
                    />
                  </div>
                  <div className="journey-eform-card">
                    <div className="journey-eform-card-head">
                      <span className="journey-eform-no">02</span>
                      <span>Ký tên – Ngày cam kết</span>
                    </div>
                    <input
                      className="field"
                      value={form.form12CommitmentSignature}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, form12CommitmentSignature: e.target.value }))
                      }
                      placeholder="Ví dụ: Nguyễn Văn A - 15/04/2026"
                    />
                  </div>
                  <div className="journey-eform-actions" style={{ justifyContent: 'flex-end', width: '100%' }}>
                    <button className="btn" onClick={submitForm12} disabled={submitting}>
                      {submitting ? 'Đang lưu...' : 'Lưu Mẫu 12'}
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
                </>
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
              {isEmployee ? (
                <button
                  type="button"
                  className="btn outline"
                  onClick={() => {
                    if (selectedStatus === 'future') {
                      setErrorText('Chưa đến ngày này, chưa thể điền form coaching.');
                      return;
                    }
                    setErrorText('');
                    setShowCoachingForm(true);
                  }}
                >
                  Điền form coaching
                </button>
              ) : null}
              {availableForms.includes('awareness') && (
                <span className={`journey-mini-badge ${todayJournal?.awarenessSubmittedAt ? 'ok' : ''}`}>
                  Mẫu 1 nhận diện: {todayJournal?.awarenessSubmittedAt ? 'Đã nộp' : 'Chưa nộp'}
                </span>
              )}
              {availableForms.includes('form3') && (
                <span className={`journey-mini-badge ${extraLogs?.form3 ? 'ok' : ''}`}>
                  Mẫu 3: {extraLogs?.form3 ? 'Đã nộp' : 'Chưa nộp'}
                </span>
              )}
              {availableForms.includes('form8') && (
                <span className={`journey-mini-badge ${Array.isArray(extraLogs?.form8) && extraLogs.form8.length > 0 ? 'ok' : ''}`}>
                  Mẫu 8: {Array.isArray(extraLogs?.form8) && extraLogs.form8.length > 0 ? 'Đã nộp' : 'Chưa nộp'}
                </span>
              )}
              {availableForms.includes('form4') && (
                <span className={`journey-mini-badge ${Array.isArray(extraLogs?.form4) && extraLogs.form4.length > 0 ? 'ok' : ''}`}>
                  Mẫu 4: {Array.isArray(extraLogs?.form4) && extraLogs.form4.length > 0 ? 'Đã nộp' : 'Chưa nộp'}
                </span>
              )}
              {availableForms.includes('form5') && (
                <span className={`journey-mini-badge ${extraLogs?.form5 ? 'ok' : ''}`}>
                  Mẫu 5: {extraLogs?.form5 ? 'Đã nộp' : 'Chưa nộp'}
                </span>
              )}
              {availableForms.includes('behavior') && (
                <span className={`journey-mini-badge ${extraLogs?.form2 ? 'ok' : ''}`}>
                  Mẫu 2: {extraLogs?.form2 ? 'Đã nộp' : 'Chưa nộp'}
                </span>
              )}
              {availableForms.includes('form7') && (
                <span className={`journey-mini-badge ${extraLogs?.form7 ? 'ok' : ''}`}>
                  Mẫu 7: {extraLogs?.form7 ? 'Đã nộp' : 'Chưa nộp'}
                </span>
              )}
              {availableForms.includes('form9') && (
                <span className={`journey-mini-badge ${extraLogs?.form9 ? 'ok' : ''}`}>
                  Mẫu 9: {extraLogs?.form9 ? 'Đã nộp' : 'Chưa nộp'}
                </span>
              )}
              {availableForms.includes('form12') && (
                <span className={`journey-mini-badge ${extraLogs?.form12 ? 'ok' : ''}`}>
                  Mẫu 12: {extraLogs?.form12 ? 'Đã nộp' : 'Chưa nộp'}
                </span>
              )}
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
                phaseConfigs={phaseConfigs}
                logs={timelineEntries.map(entry => ({
                  dateKey: entry.dateKey,
                  status: entry.status
                }))}
                onSelectDay={(dateKey) => {
                  const targetDate = fromDateKey(dateKey);
                setSelectedDateKey(toDateKey(targetDate));
              }}
            />
          </div>

          {isEmployee ? (
            <div className="coaching-section" style={{ marginBottom: 14 }}>
            <div className="coaching-section-title">DANH SÁCH KHÁCH HÀNG ĐÃ NHẬP ({coachingDateKey})</div>
            {coachingCustomers.length === 0 ? (
              <div className="coaching-empty">Chưa có khách hàng nào được nhập.</div>
            ) : (
              <div className="coaching-list-wrap">
                <table className="coaching-list-table">
                  <thead>
                    <tr>
                      <th>Kế hoạch bán hàng</th>
                      <th>Tên khách hàng tiếp xúc/tư vấn</th>
                      <th>Địa chỉ khách hàng tiếp xúc/tư vấn</th>
                      <th>Khách cũ giới thiệu</th>
                      <th>Khách follow up</th>
                      <th>Không báo giá sớm</th>
                      {isCoachingForm1 ? <th>Cuộc tư vấn đủ chuẩn</th> : <th>Số cuộc tư vấn có đủ 3 lớp</th>}
                      {!isCoachingForm1 ? <th>Số cuộc tư vấn có gắn giải pháp với nhu cầu</th> : null}
                      {!isCoachingForm1 ? <th>Số cuộc tư vấn có nói rõ lợi ích</th> : null}
                      {!isCoachingForm1 ? <th>Số cuộc tư vấn có nhắc thiệt hại tránh được</th> : null}
                      <th>Chốt dịch vụ</th>
                      <th>Doanh thu cá nhân (Ngàn đồng)</th>
                      <th>Khách follow up tiếp theo/ Bước tiếp theo</th>
                      <th>Lịch hẹn follow tiếp theo</th>
                    </tr>
                    <tr className="coaching-guide-row">
                      <th>Có danh sách KH, phân loại KH, chuẩn bị câu hỏi... (Có=1, không=0)</th>
                      <th>&nbsp;</th>
                      <th>Tên đường, phường (xã), số nhà/tel...</th>
                      <th>(Được KH cũ giới thiệu=1, không được giới thiệu=0)</th>
                      <th>Tư vấn lại KH tiềm năng đã được tư vấn chưa thành công (Đúng=1, sai=0)</th>
                      <th>(Đúng=1, sai=0)</th>
                      <th>{isCoachingForm1 ? 'Ko giới thiệu gói, báo giá sớm, hỏi khách có mua không... (Đúng=1, sai=0)' : '(Đúng=1, sai=0)'}</th>
                      {!isCoachingForm1 ? <th>(Đúng=1, sai=0)</th> : null}
                      {!isCoachingForm1 ? <th>(Đúng=1, sai=0)</th> : null}
                      {!isCoachingForm1 ? <th>(Đúng=1, sai=0)</th> : null}
                      {!isCoachingForm1 ? <th>(Đúng=1, sai=0)</th> : null}
                      <th>(Lắp đặt/hòa mạng=1, chưa lắp đặt HM=0)</th>
                      <th>&nbsp;</th>
                      <th>(Có follow=1, không cần follow=0) / Bước tiếp theo</th>
                      <th>Lần follow (1): dd/mm/yyyy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coachingCustomers.map((row) => (
                      <tr key={row.id}>
                        <td>{row.salesPlan ?? 0}</td>
                        <td style={{ fontWeight: 700 }}>{row.customerName || '-'}</td>
                        <td>{[row.customerAddress, row.ward].filter(Boolean).join(', ') || '-'}</td>
                        <td>{row.oldReferral ?? 0}</td>
                        <td>{row.customerFollowUp ?? 0}</td>
                        <td>{row.noEarlyQuote ?? 0}</td>
                        <td>{isCoachingForm1 ? (row.consultStandard ?? 0) : (row.consultEnoughLayers ?? 0)}</td>
                        {!isCoachingForm1 ? <td>{row.consultSolutionMatchingNeed ?? 0}</td> : null}
                        {!isCoachingForm1 ? <td>{row.consultClearBenefit ?? 0}</td> : null}
                        {!isCoachingForm1 ? <td>{row.consultMentionLossAvoidance ?? 0}</td> : null}
                        <td>{row.closedService ?? 0}</td>
                        <td>{row.personalRevenue || '0'}</td>
                        <td>
                          <div>{row.nextFollowRequired ?? 0}</div>
                          <div>{row.nextFollowStep || '-'}</div>
                        </td>
                        <td>{row.nextFollowSchedule || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            </div>
          ) : null}

          {showCoachingForm ? (
            <div className="journey-modal-backdrop" onClick={() => setShowCoachingForm(false)}>
              <div className="journey-modal coaching-sheet" onClick={(e) => e.stopPropagation()}>
                <div className="coaching-sheet-head">
                  <div className="coaching-sheet-head-main">
                    <h3 className="coaching-sheet-title">Thêm Mới Khách Hàng</h3>
                    <div className="coaching-sheet-subtitle">{activeCoachingFormLabel} - Ngày nhập: {coachingDateKey}</div>
                  </div>
                  <div className="coaching-sheet-head-actions">
                    <label className="btn outline" style={{ marginBottom: 0, cursor: coachingImporting ? 'not-allowed' : 'pointer' }}>
                      {coachingImporting ? 'Đang import...' : 'Import Excel'}
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        disabled={coachingImporting}
                        onChange={handleImportCoachingExcel}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <button
                      type="button"
                      className="btn outline"
                      onClick={handleDownloadCoachingTemplate}
                    >
                      Tải file mẫu
                    </button>
                    <button className="btn outline" onClick={() => setShowCoachingForm(false)}>Đóng</button>
                  </div>
                </div>

                <div className="coaching-section">
                  <div className="coaching-section-title">THÔNG TIN CƠ BẢN</div>
                  <div className="coaching-basic-grid">
                    <div>
                      <label className="coaching-label">Tên khách hàng</label>
                      <input className="field" placeholder="Nhập họ và tên..." value={coachingDraft.customerName} onChange={(e) => handleCoachingDraftChange('customerName', e.target.value)} />
                    </div>
                    <div>
                      <label className="coaching-label">Phường/Xã</label>
                      <select
                        className="field"
                        value={coachingDraft.ward}
                        onChange={(e) => handleCoachingDraftChange('ward', e.target.value)}
                      >
                        <option value="">Chọn Phường/Xã...</option>
                        {wardOptions.map((item) => (
                          <option key={item.id} value={item.name || ''}>
                            {item.name || ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="coaching-label">Số nhà, tên đường</label>
                      <input className="field" placeholder="Ví dụ: 123 Đường ABC..." value={coachingDraft.customerAddress} onChange={(e) => handleCoachingDraftChange('customerAddress', e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="coaching-split-grid">
                  <div className="coaching-section">
                    <div className="coaching-section-title">KẾ HOẠCH</div>
                    <label className="coaching-label">Kế hoạch bán hàng</label>
                    <select className="field" value={coachingDraft.salesPlan} onChange={(e) => handleCoachingDraftChange('salesPlan', e.target.value)}>
                      <option value="0">Không có kế hoạch (0)</option>
                      <option value="1">Có kế hoạch (1)</option>
                    </select>

                    <div className="coaching-label" style={{ marginTop: 10 }}>Khách cũ giới thiệu</div>
                    <div className="coaching-choice-row">
                      <label><input type="radio" name="oldReferral" checked={coachingDraft.oldReferral === '1'} onChange={() => handleCoachingDraftChange('oldReferral', '1')} /> Có (1)</label>
                      <label><input type="radio" name="oldReferral" checked={coachingDraft.oldReferral === '0'} onChange={() => handleCoachingDraftChange('oldReferral', '0')} /> Không (0)</label>
                    </div>

                    <div className="coaching-label" style={{ marginTop: 10 }}>Khách follow up</div>
                    <div className="coaching-choice-row">
                      <label><input type="radio" name="customerFollowUp" checked={coachingDraft.customerFollowUp === '1'} onChange={() => handleCoachingDraftChange('customerFollowUp', '1')} /> Đúng (1)</label>
                      <label><input type="radio" name="customerFollowUp" checked={coachingDraft.customerFollowUp === '0'} onChange={() => handleCoachingDraftChange('customerFollowUp', '0')} /> Sai (0)</label>
                    </div>
                  </div>

                  <div className="coaching-section">
                    <div className="coaching-section-title">KẾT QUẢ TƯ VẤN</div>
                    {isCoachingForm1 ? (
                      <div className="coaching-toggle-row">
                        <span>Cuộc tư vấn đủ chuẩn</span>
                        <label className="coaching-switch"><input type="checkbox" checked={coachingDraft.consultStandard === '1'} onChange={(e) => handleCoachingDraftChange('consultStandard', e.target.checked ? '1' : '0')} /><span className="coaching-switch-slider" /></label>
                      </div>
                    ) : null}
                    {!isCoachingForm1 ? (
                      <div className="coaching-toggle-row">
                        <span>Số cuộc tư vấn có đủ 3 lớp</span>
                        <label className="coaching-switch"><input type="checkbox" checked={coachingDraft.consultEnoughLayers === '1'} onChange={(e) => handleCoachingDraftChange('consultEnoughLayers', e.target.checked ? '1' : '0')} /><span className="coaching-switch-slider" /></label>
                      </div>
                    ) : null}
                    {!isCoachingForm1 ? (
                      <div className="coaching-toggle-row">
                        <span>Số cuộc tư vấn có gắn giải pháp với nhu cầu</span>
                        <label className="coaching-switch"><input type="checkbox" checked={coachingDraft.consultSolutionMatchingNeed === '1'} onChange={(e) => handleCoachingDraftChange('consultSolutionMatchingNeed', e.target.checked ? '1' : '0')} /><span className="coaching-switch-slider" /></label>
                      </div>
                    ) : null}
                    {!isCoachingForm1 ? (
                      <div className="coaching-toggle-row">
                        <span>Số cuộc tư vấn có nói rõ lợi ích</span>
                        <label className="coaching-switch"><input type="checkbox" checked={coachingDraft.consultClearBenefit === '1'} onChange={(e) => handleCoachingDraftChange('consultClearBenefit', e.target.checked ? '1' : '0')} /><span className="coaching-switch-slider" /></label>
                      </div>
                    ) : null}
                    {!isCoachingForm1 ? (
                      <div className="coaching-toggle-row">
                        <span>Số cuộc tư vấn có nhắc thiệt hại tránh được</span>
                        <label className="coaching-switch"><input type="checkbox" checked={coachingDraft.consultMentionLossAvoidance === '1'} onChange={(e) => handleCoachingDraftChange('consultMentionLossAvoidance', e.target.checked ? '1' : '0')} /><span className="coaching-switch-slider" /></label>
                      </div>
                    ) : null}
                    <div className="coaching-toggle-row">
                      <span>Không báo giá sớm</span>
                      <label className="coaching-switch"><input type="checkbox" checked={coachingDraft.noEarlyQuote === '1'} onChange={(e) => handleCoachingDraftChange('noEarlyQuote', e.target.checked ? '1' : '0')} /><span className="coaching-switch-slider" /></label>
                    </div>
                    <div className="coaching-toggle-row">
                      <span>Chốt dịch vụ thành công</span>
                      <label className="coaching-switch"><input type="checkbox" checked={coachingDraft.closedService === '1'} onChange={(e) => handleCoachingDraftChange('closedService', e.target.checked ? '1' : '0')} /><span className="coaching-switch-slider" /></label>
                    </div>
                  </div>
                </div>

                <div className="coaching-section">
                  <div className="coaching-section-title coaching-red">HIỆU QUẢ & THEO DÕI</div>
                  <div className="coaching-basic-grid">
                    <div>
                      <label className="coaching-label">Doanh thu cá nhân (VND)</label>
                      <input className="field" type="number" min="0" placeholder="0" value={coachingDraft.personalRevenue} onChange={(e) => handleCoachingDraftChange('personalRevenue', e.target.value)} />
                    </div>
                    <div>
                      <div className="coaching-label">Trạng thái Follow up</div>
                      <div className="coaching-choice-row">
                        <label><input type="radio" name="nextFollowRequired" checked={coachingDraft.nextFollowRequired === '1'} onChange={() => handleCoachingDraftChange('nextFollowRequired', '1')} /> Cần Follow (1)</label>
                        <label><input type="radio" name="nextFollowRequired" checked={coachingDraft.nextFollowRequired === '0'} onChange={() => handleCoachingDraftChange('nextFollowRequired', '0')} /> Không (0)</label>
                      </div>
                    </div>
                    <div>
                      <label className="coaching-label">Lịch hẹn tiếp theo</label>
                      <input className="field" type="date" value={coachingDraft.nextFollowSchedule} onChange={(e) => handleCoachingDraftChange('nextFollowSchedule', e.target.value)} />
                    </div>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <label className="coaching-label">Ghi chú chi tiết bước tiếp theo</label>
                    <textarea className="field" rows={4} placeholder="Ghi chú cụ thể..." value={coachingDraft.nextFollowStep} onChange={(e) => handleCoachingDraftChange('nextFollowStep', e.target.value)} />
                  </div>
                </div>

                <div className="coaching-footer-actions">
                  <button className="btn outline" onClick={() => setShowCoachingForm(false)}>Hủy bỏ</button>
                  <button className="btn outline" onClick={resetCoachingDraft}>Xóa trắng dữ liệu</button>
                  <button className="btn" onClick={handleSaveCoachingDraft} disabled={coachingSaving}>{coachingSaving ? 'Đang lưu...' : 'Lưu thông tin'}</button>
                </div>
              </div>
            </div>
          ) : null}

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

          {selectedJournal || extraLogs?.form2 || extraLogs?.form3 || extraLogs?.form4 || extraLogs?.form5 || extraLogs?.form7 || extraLogs?.form8 || extraLogs?.form9 || extraLogs?.form12 ? (
            <div className="journey-compare">
              <div className="journey-column">
                {(selectedJournal?.avoidance || availableForms.includes('awareness')) && (
                  <>
                    <h4>Mẫu 1: Nhật ký nhận diện hằng ngày</h4>
                    <ul style={{ paddingLeft: 18, marginTop: 8, fontSize: 13, color: '#1e293b' }}>
                      <li>Hôm nay tôi đã né điều gì: {formatDisplayText(selectedJournal?.avoidance)}</li>
                      <li>Tôi có tự loại gói nào không: {formatDisplayText(selectedJournal?.selfLimit)}</li>
                      <li>Tôi đã dừng tư vấn sớm ở điểm nào: {formatDisplayText(selectedJournal?.earlyStop)}</li>
                      <li>Khi không bán được dịch vụ anh chị thường đỗ lỗi cho vấn đề gì: {formatDisplayText(selectedJournal?.blaming)}</li>
                    </ul>
                  </>
                )}

                {(extraLogs?.form2 || availableForms.includes('behavior')) && (
                  <div style={{ marginTop: 14 }}>
                    <strong>Mẫu 2: Hành vi</strong>
                    <ul style={{ paddingLeft: 18, marginTop: 8, fontSize: 13, color: '#1e293b' }}>
                      <li>Số KH đã gặp: {extraLogs?.form2?.customersMet || 0}</li>
                      <li>Hỏi sâu hơn: {extraLogs?.form2?.deepInquiry ? 'Đã thực hiện' : 'Chưa thực hiện'}</li>
                      <li>Đề xuất đầy đủ: {extraLogs?.form2?.fullConsult ? 'Đã thực hiện' : 'Chưa thực hiện'}</li>
                      <li>Theo đến quyết: {extraLogs?.form2?.persistence ? 'Đã thực hiện' : 'Chưa thực hiện'}</li>
                    </ul>
                  </div>
                )}
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

                {(extraLogs?.form3 || availableForms.includes('form3')) && (
                  <div style={{ marginTop: 14 }}>
                    <strong>Mẫu 3: Thay đổi Tư duy</strong>
                    <ul style={{ paddingLeft: 18, marginTop: 8, fontSize: 13, color: '#1e293b' }}>
                      <li>Suy nghĩ tiêu cực: {formatDisplayText(extraLogs?.form3?.negativeThought)}</li>
                      <li>Tư duy mới: {formatDisplayText(extraLogs?.form3?.newMindset)}</li>
                      <li>Hành vi thay đổi: {formatDisplayText(extraLogs?.form3?.behaviorChange)}</li>
                    </ul>
                  </div>
                )}

                {((Array.isArray(extraLogs?.form4) && extraLogs.form4.length > 0) || availableForms.includes('form4')) && (
                  <div style={{ marginTop: 14 }}>
                    <strong>Mẫu 4: Báo cáo Bán hàng</strong>
                    {Array.isArray(extraLogs?.form4) && extraLogs.form4.length > 0 ? (
                      extraLogs.form4.map((item, idx) => (
                        <ul key={`f4-${idx}`} style={{ paddingLeft: 18, marginTop: 8, fontSize: 13, color: '#1e293b' }}>
                          <li>Dòng {idx + 1} - Tên KH: {formatDisplayText(item.customerName)}</li>
                          <li>Vấn đề: {formatDisplayText(item.customerIssue)}</li>
                          <li>Hệ quả: {formatDisplayText(item.consequence)}</li>
                          <li>Giải pháp: {formatDisplayText(item.solutionOffered)}</li>
                          <li>Giá trị: {formatDisplayText(item.valueBasedPricing)}</li>
                          <li>Kết quả: {formatDisplayText(item.result)}</li>
                        </ul>
                      ))
                    ) : (
                      <div style={{ fontSize: 13, marginTop: 4, color: '#64748b' }}>Chưa nhập</div>
                    )}
                  </div>
                )}

                {(extraLogs?.form5 || availableForms.includes('form5')) && (
                  <div style={{ marginTop: 14 }}>
                    <strong>Mẫu 5: Ghi chép cuối ngày</strong>
                    <ul style={{ paddingLeft: 18, marginTop: 8, fontSize: 13, color: '#1e293b' }}>
                      <li>Bài học: {formatDisplayText(extraLogs?.form5?.tomorrowLesson)}</li>
                      <li>Hành động mới: {formatDisplayText(extraLogs?.form5?.differentAction)}</li>
                    </ul>
                  </div>
                )}

                {((Array.isArray(extraLogs?.form8) && extraLogs.form8.length > 0) || availableForms.includes('form8')) && (
                  <div style={{ marginTop: 14 }}>
                    <strong>Mẫu 8: Củng cố niềm tin</strong>
                    {Array.isArray(extraLogs?.form8) && extraLogs.form8.length > 0 ? (
                      extraLogs.form8.map((item, idx) => (
                        <ul key={`f8-${idx}`} style={{ paddingLeft: 18, marginTop: 8, fontSize: 13, color: '#1e293b' }}>
                          <li>Dòng {idx + 1} - Tình huống: {formatDisplayText(item.situation)}</li>
                          <li>Niềm tin cũ: {formatDisplayText(item.oldBelief)}</li>
                          <li>Niềm tin mới: {formatDisplayText(item.newChosenBelief)}</li>
                          <li>Hành vi mới: {formatDisplayText(item.newBehavior)}</li>
                          <li>Kết quả: {formatDisplayText(item.result)}</li>
                        </ul>
                      ))
                    ) : (
                      <div style={{ fontSize: 13, marginTop: 4, color: '#64748b' }}>Chưa nhập</div>
                    )}
                  </div>
                )}

                {(extraLogs?.form7 || availableForms.includes('form7')) && (
                  <div style={{ marginTop: 14 }}>
                    <strong>Mẫu 7: Nhật ký giữ chuẩn thu nhập</strong>
                    <ul style={{ paddingLeft: 18, marginTop: 8, fontSize: 13, color: '#1e293b' }}>
                      <li>Tôi đã giữ được chuẩn nào: {formatDisplayText(extraLogs?.form7?.keptStandard)}</li>
                      <li>Dấu hiệu tụt chuẩn: {formatDisplayText(extraLogs?.form7?.backslideSign)}</li>
                      <li>Tôi đã xử lý nó ra sao: {formatDisplayText(extraLogs?.form7?.solution)}</li>
                    </ul>
                  </div>
                )}

                {(extraLogs?.form9 || availableForms.includes('form9')) && (
                  <div style={{ marginTop: 14 }}>
                    <strong>Mẫu 9: Nhật ký phá giới hạn thu nhập</strong>
                    <ul style={{ paddingLeft: 18, marginTop: 8, fontSize: 13, color: '#1e293b' }}>
                      <li>Tôi đang tự giới hạn ở đâu: {formatDisplayText(extraLogs?.form9?.selfLimitArea)}</li>
                      <li>Hành vi chứng minh: {formatDisplayText(extraLogs?.form9?.proofBehavior)}</li>
                      <li>Tôi nâng chuẩn thế nào: {formatDisplayText(extraLogs?.form9?.raiseStandard)}</li>
                      <li>Hành động cụ thể: {formatDisplayText(extraLogs?.form9?.actionPlan)}</li>
                    </ul>
                  </div>
                )}

                {(extraLogs?.form12 || availableForms.includes('form12')) && (
                  <div style={{ marginTop: 14 }}>
                    <strong>Mẫu 12: Tuyên ngôn nghề nghiệp cá nhân</strong>
                    <div style={{ marginTop: 6, fontSize: 13 }}>
                      {formatDisplayText(extraLogs?.form12?.declarationText)}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13 }}>
                      Ký tên – Ngày cam kết: {formatDisplayText(extraLogs?.form12?.commitmentSignature)}
                    </div>
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

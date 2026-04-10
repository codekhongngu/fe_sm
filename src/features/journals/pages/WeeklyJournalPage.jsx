import { useEffect, useState } from 'react';
import journalService from '../../../services/api/journalService';

const emptyForm10 = { highIncomeAction: '', result: '', feeling: '' };
const emptyForm11 = {
  bestValueArea: '',
  incomeIncreaseBehavior: '',
  backslideSign: '',
  nextWeekPlan: '',
};

const WeeklyJournalPage = () => {
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [statusText, setStatusText] = useState('');
  const [weeklyConfigs, setWeeklyConfigs] = useState([]);
  const [selectedWeekId, setSelectedWeekId] = useState('');
  const [form10, setForm10] = useState(emptyForm10);
  const [form11, setForm11] = useState(emptyForm11);
  const [reviewModal, setReviewModal] = useState({
    open: false,
    formType: '',
    title: '',
    rows: [],
    loading: false,
  });

  const loadWeeks = async () => {
    const data = await journalService.getWeeklyConfigs();
    const list = Array.isArray(data) ? data : [];
    setWeeklyConfigs(list);
    if (!selectedWeekId && list.length > 0) {
      setSelectedWeekId(list[0].id);
    }
  };

  const loadWeekData = async (weekId) => {
    if (!weekId) {
      setForm10(emptyForm10);
      setForm11(emptyForm11);
      return;
    }
    const data = await journalService.getWeeklyJournals(weekId);
    const form10Entry =
      Array.isArray(data?.form10?.entries) && data.form10.entries.length > 0
        ? data.form10.entries[0]
        : emptyForm10;
    const form11Entry =
      Array.isArray(data?.form11?.entries) && data.form11.entries.length > 0
        ? data.form11.entries[0]
        : emptyForm11;
    setForm10({
      highIncomeAction: form10Entry?.highIncomeAction || '',
      result: form10Entry?.result || '',
      feeling: form10Entry?.feeling || '',
    });
    setForm11({
      bestValueArea: form11Entry?.bestValueArea || '',
      incomeIncreaseBehavior: form11Entry?.incomeIncreaseBehavior || '',
      backslideSign: form11Entry?.backslideSign || '',
      nextWeekPlan: form11Entry?.nextWeekPlan || '',
    });
  };

  const bootstrap = async () => {
    setLoading(true);
    setErrorText('');
    try {
      await loadWeeks();
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Không tải được dữ liệu tuần');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bootstrap();
  }, []);

  useEffect(() => {
    const run = async () => {
      setErrorText('');
      try {
        await loadWeekData(selectedWeekId);
      } catch (error) {
        setErrorText(error?.response?.data?.message || 'Không tải được nhật ký tuần');
      }
    };
    run();
  }, [selectedWeekId]);

  const submitForm10 = async () => {
    setStatusText('');
    setErrorText('');
    if (!selectedWeekId) {
      setErrorText('Vui lòng chọn tuần');
      return;
    }
    try {
      await journalService.submitWeeklyJournal({
        weekId: selectedWeekId,
        formType: 'FORM_10',
        entries: [form10],
      });
      setStatusText('Đã lưu Mẫu 10 thành công');
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Lưu Mẫu 10 thất bại');
    }
  };

  const submitForm11 = async () => {
    setStatusText('');
    setErrorText('');
    if (!selectedWeekId) {
      setErrorText('Vui lòng chọn tuần');
      return;
    }
    try {
      await journalService.submitWeeklyJournal({
        weekId: selectedWeekId,
        formType: 'FORM_11',
        entries: [form11],
      });
      setStatusText('Đã lưu Mẫu 11 thành công');
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Lưu Mẫu 11 thất bại');
    }
  };

  const openReview = async (formType) => {
    const title =
      formType === 'FORM_10'
        ? 'Review Mẫu 10: Nhật ký hành vi thu nhập cao'
        : 'Review Mẫu 11: Nhật ký tự đánh giá tuần';
    setReviewModal({
      open: true,
      formType,
      title,
      rows: [],
      loading: true,
    });
    try {
      const weeks = Array.isArray(weeklyConfigs) ? weeklyConfigs : [];
      const responses = await Promise.all(
        weeks.map(async (week) => {
          const data = await journalService.getWeeklyJournals(week.id).catch(() => null);
          return { week, data };
        }),
      );
      const rows = responses
        .map(({ week, data }) => {
          const entry =
            formType === 'FORM_10'
              ? data?.form10?.entries?.[0] || null
              : data?.form11?.entries?.[0] || null;
          return {
            weekName: week.weekName,
            startDate: week.startDate,
            endDate: week.endDate,
            entry,
          };
        })
        .filter((item) => !!item.entry);
      setReviewModal((prev) => ({
        ...prev,
        rows,
        loading: false,
      }));
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Không tải được dữ liệu review');
      setReviewModal((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2 style={{ margin: 0 }}>Nhật ký hằng tuần</h2>
          <div className="page-subtitle">Mẫu 10 và Mẫu 11 theo cấu hình tuần</div>
        </div>
      </div>
      {statusText ? <div className="status-ok" style={{ marginBottom: 10 }}>{statusText}</div> : null}
      {errorText ? <div className="status-err" style={{ marginBottom: 10 }}>{errorText}</div> : null}
      {loading ? <div>Đang tải dữ liệu...</div> : null}

      <section className="card" style={{ marginBottom: 12 }}>
        <h3 style={{ marginTop: 0 }}>Tuần báo cáo</h3>
        <select className="field" value={selectedWeekId} onChange={(e) => setSelectedWeekId(e.target.value)}>
          <option value="">Chọn tuần</option>
          {weeklyConfigs.map((week) => (
            <option key={week.id} value={week.id}>
              {week.weekName} ({week.startDate} → {week.endDate})
            </option>
          ))}
        </select>
      </section>

      <section className="card" style={{ marginBottom: 12 }}>
        <h3 style={{ marginTop: 0 }}>Mẫu 10: Nhật ký hành vi thu nhập cao</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Hành vi thu nhập cao đã làm</th>
                <th>Kết quả</th>
                <th>Cảm nhận</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <textarea
                    className="field"
                    value={form10.highIncomeAction || ''}
                    onChange={(e) => setForm10((prev) => ({ ...prev, highIncomeAction: e.target.value }))}
                  />
                </td>
                <td>
                  <textarea
                    className="field"
                    value={form10.result || ''}
                    onChange={(e) => setForm10((prev) => ({ ...prev, result: e.target.value }))}
                  />
                </td>
                <td>
                  <textarea
                    className="field"
                    value={form10.feeling || ''}
                    onChange={(e) => setForm10((prev) => ({ ...prev, feeling: e.target.value }))}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button className="btn" onClick={submitForm10}>
            Lưu Mẫu 10
          </button>
          <button className="btn outline" onClick={() => openReview('FORM_10')}>
            Review Mẫu 10
          </button>
        </div>
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Mẫu 11: Nhật ký tự đánh giá tuần</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Tôi tạo giá trị tốt nhất ở đâu?</th>
                <th>Hành vi nào giúp tôi tăng thu nhập?</th>
                <th>Dấu hiệu tụt chuẩn?</th>
                <th>Kế hoạch tuần sau</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <textarea
                    className="field"
                    value={form11.bestValueArea || ''}
                    onChange={(e) => setForm11((prev) => ({ ...prev, bestValueArea: e.target.value }))}
                  />
                </td>
                <td>
                  <textarea
                    className="field"
                    value={form11.incomeIncreaseBehavior || ''}
                    onChange={(e) =>
                      setForm11((prev) => ({ ...prev, incomeIncreaseBehavior: e.target.value }))
                    }
                  />
                </td>
                <td>
                  <textarea
                    className="field"
                    value={form11.backslideSign || ''}
                    onChange={(e) => setForm11((prev) => ({ ...prev, backslideSign: e.target.value }))}
                  />
                </td>
                <td>
                  <textarea
                    className="field"
                    value={form11.nextWeekPlan || ''}
                    onChange={(e) => setForm11((prev) => ({ ...prev, nextWeekPlan: e.target.value }))}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button className="btn" onClick={submitForm11}>
            Lưu Mẫu 11
          </button>
          <button className="btn outline" onClick={() => openReview('FORM_11')}>
            Review Mẫu 11
          </button>
        </div>
      </section>
      {reviewModal.open ? (
        <div className="simple-modal-backdrop" onClick={() => setReviewModal((prev) => ({ ...prev, open: false }))}>
          <div className="simple-modal" style={{ maxWidth: 980, width: '92vw' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{reviewModal.title}</h3>
            {reviewModal.loading ? <div>Đang tải dữ liệu review...</div> : null}
            {!reviewModal.loading ? (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    {reviewModal.formType === 'FORM_10' ? (
                      <tr>
                        <th>Tuần</th>
                        <th>Hành vi thu nhập cao đã làm</th>
                        <th>Kết quả</th>
                        <th>Cảm nhận</th>
                      </tr>
                    ) : (
                      <tr>
                        <th>Tuần</th>
                        <th>Tôi tạo giá trị tốt nhất ở đâu?</th>
                        <th>Hành vi nào giúp tôi tăng thu nhập?</th>
                        <th>Dấu hiệu tụt chuẩn?</th>
                        <th>Kế hoạch tuần sau</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {reviewModal.rows.map((row) =>
                      reviewModal.formType === 'FORM_10' ? (
                        <tr key={`${row.weekName}-${row.startDate}`}>
                          <td>
                            {row.weekName} ({row.startDate} → {row.endDate})
                          </td>
                          <td>{row.entry?.highIncomeAction || '-'}</td>
                          <td>{row.entry?.result || '-'}</td>
                          <td>{row.entry?.feeling || '-'}</td>
                        </tr>
                      ) : (
                        <tr key={`${row.weekName}-${row.startDate}`}>
                          <td>
                            {row.weekName} ({row.startDate} → {row.endDate})
                          </td>
                          <td>{row.entry?.bestValueArea || '-'}</td>
                          <td>{row.entry?.incomeIncreaseBehavior || '-'}</td>
                          <td>{row.entry?.backslideSign || '-'}</td>
                          <td>{row.entry?.nextWeekPlan || '-'}</td>
                        </tr>
                      ),
                    )}
                    {!reviewModal.loading && reviewModal.rows.length === 0 ? (
                      <tr>
                        <td colSpan={reviewModal.formType === 'FORM_10' ? 4 : 5}>
                          Chưa có dữ liệu review ở các tuần cấu hình.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            ) : null}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button className="btn outline" onClick={() => setReviewModal((prev) => ({ ...prev, open: false }))}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default WeeklyJournalPage;

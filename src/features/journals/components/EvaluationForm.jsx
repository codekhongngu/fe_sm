import { useEffect, useMemo, useState } from 'react';

const getBoolLabel = (value) => (value ? 'Đã thực hiện' : 'Chưa thực hiện');

const EvaluationForm = ({ journal, onSubmit, saving }) => {
  const initial = useMemo(
    () => ({
      deepInquiryStatus: journal?.evaluation?.deepInquiryStatus ?? false,
      fullProposalStatus: journal?.evaluation?.fullProposalStatus ?? false,
      persistenceStatus: journal?.evaluation?.persistenceStatus ?? false,
      deepInquiryNote: journal?.evaluation?.deepInquiryNote || '',
      fullProposalNote: journal?.evaluation?.fullProposalNote || '',
      persistenceNote: journal?.evaluation?.persistenceNote || '',
      standardsManagerNote: journal?.evaluation?.standardsManagerNote || '',
    }),
    [journal],
  );
  const [form, setForm] = useState(initial);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    setForm(initial);
    setErrorText('');
  }, [initial]);

  const mismatch = {
    deepInquiry: journal?.standardsKept?.deepInquiry && form.deepInquiryStatus === false,
    fullConsult: journal?.standardsKept?.fullConsult && form.fullProposalStatus === false,
    persistence: journal?.standardsKept?.persistence && form.persistenceStatus === false,
  };

  const save = () => {
    setErrorText('');
    const anyFalse =
      !form.deepInquiryStatus || !form.fullProposalStatus || !form.persistenceStatus;
    if (!form.deepInquiryStatus && !form.deepInquiryNote.trim()) {
      setErrorText('Vui lòng nhập ghi chú cho tiêu chí Hỏi sâu hơn');
      return;
    }
    if (!form.fullProposalStatus && !form.fullProposalNote.trim()) {
      setErrorText('Vui lòng nhập ghi chú cho tiêu chí Đề xuất đầy đủ');
      return;
    }
    if (!form.persistenceStatus && !form.persistenceNote.trim()) {
      setErrorText('Vui lòng nhập ghi chú cho tiêu chí Theo đến quyết');
      return;
    }
    if (anyFalse && !form.standardsManagerNote.trim()) {
      setErrorText('Bắt buộc nhập ghi chú khi có tiêu chí "Chưa thực hiện"');
      return;
    }
    onSubmit({
      ...form,
      standardsReviewed: true,
    });
  };

  return (
    <section className="review-section">
      <div className="review-section-head">
        <h3 style={{ margin: 0 }}>Đánh giá E-form Giữ chuẩn</h3>
      </div>
      <div className={`criterion-card tonal-card ${mismatch.deepInquiry ? 'mismatch' : ''}`}>
        <div className="eval-row">
          <span>Hỏi sâu hơn</span>
          <select
            className="custom-select"
            value={String(form.deepInquiryStatus)}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, deepInquiryStatus: e.target.value === 'true' }))
            }
          >
            <option value="true">Đã thực hiện</option>
            <option value="false">Chưa thực hiện</option>
          </select>
        </div>
        <textarea
          className="field"
          rows={2}
          placeholder="Ghi chú riêng cho tiêu chí Hỏi sâu hơn"
          value={form.deepInquiryNote}
          onChange={(e) => setForm((prev) => ({ ...prev, deepInquiryNote: e.target.value }))}
        />
      </div>
      <div className={`criterion-card tonal-card ${mismatch.fullConsult ? 'mismatch' : ''}`}>
        <div className="eval-row">
          <span>Đề xuất đầy đủ</span>
          <select
            className="custom-select"
            value={String(form.fullProposalStatus)}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, fullProposalStatus: e.target.value === 'true' }))
            }
          >
            <option value="true">Đã thực hiện</option>
            <option value="false">Chưa thực hiện</option>
          </select>
        </div>
        <textarea
          className="field"
          rows={2}
          placeholder="Ghi chú riêng cho tiêu chí Đề xuất đầy đủ"
          value={form.fullProposalNote}
          onChange={(e) => setForm((prev) => ({ ...prev, fullProposalNote: e.target.value }))}
        />
      </div>
      <div className={`criterion-card tonal-card ${mismatch.persistence ? 'mismatch' : ''}`}>
        <div className="eval-row">
          <span>Theo đến quyết</span>
          <select
            className="custom-select"
            value={String(form.persistenceStatus)}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, persistenceStatus: e.target.value === 'true' }))
            }
          >
            <option value="true">Đã thực hiện</option>
            <option value="false">Chưa thực hiện</option>
          </select>
        </div>
        <textarea
          className="field"
          rows={2}
          placeholder="Ghi chú riêng cho tiêu chí Theo đến quyết"
          value={form.persistenceNote}
          onChange={(e) => setForm((prev) => ({ ...prev, persistenceNote: e.target.value }))}
        />
      </div>
      <div style={{ marginTop: 8, color: '#64748b', fontSize: 13 }}>
        Kết quả: {getBoolLabel(form.deepInquiryStatus)} / {getBoolLabel(form.fullProposalStatus)} /{' '}
        {getBoolLabel(form.persistenceStatus)}
      </div>
      <textarea
        className="field"
        rows={4}
        placeholder="Tổng kết coaching chung cho phần Giữ chuẩn"
        value={form.standardsManagerNote}
        onChange={(e) =>
          setForm((prev) => ({ ...prev, standardsManagerNote: e.target.value }))
        }
        style={{ marginTop: 10 }}
      />
      {errorText ? <div className="status-err" style={{ marginTop: 8 }}>{errorText}</div> : null}
      <button className="btn" style={{ marginTop: 10 }} onClick={save} disabled={saving}>
        Lưu đánh giá
      </button>
    </section>
  );
};

export default EvaluationForm;

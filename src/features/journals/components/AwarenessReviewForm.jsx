import { useEffect, useMemo, useState } from 'react';

const AwarenessReviewForm = ({ journal, onSubmit, saving }) => {
  const initial = useMemo(
    () => ({
      awarenessDeepInquiryStatus:
        journal?.evaluation?.awarenessDeepInquiryStatus ?? false,
      awarenessFullProposalStatus:
        journal?.evaluation?.awarenessFullProposalStatus ?? false,
      awarenessPersistenceStatus:
        journal?.evaluation?.awarenessPersistenceStatus ?? false,
      awarenessDeepInquiryNote: journal?.evaluation?.awarenessDeepInquiryNote || '',
      awarenessFullProposalNote: journal?.evaluation?.awarenessFullProposalNote || '',
      awarenessPersistenceNote: journal?.evaluation?.awarenessPersistenceNote || '',
      awarenessManagerNote: journal?.evaluation?.awarenessManagerNote || '',
    }),
    [journal],
  );
  const [form, setForm] = useState(initial);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    setForm(initial);
    setErrorText('');
  }, [initial]);

  const save = () => {
    setErrorText('');
    const anyFalse =
      !form.awarenessDeepInquiryStatus ||
      !form.awarenessFullProposalStatus ||
      !form.awarenessPersistenceStatus;
    if (!form.awarenessDeepInquiryStatus && !form.awarenessDeepInquiryNote.trim()) {
      setErrorText('Vui lòng nhập ghi chú cho tiêu chí Hỏi sâu hơn (Nhận diện)');
      return;
    }
    if (!form.awarenessFullProposalStatus && !form.awarenessFullProposalNote.trim()) {
      setErrorText('Vui lòng nhập ghi chú cho tiêu chí Đề xuất đầy đủ (Nhận diện)');
      return;
    }
    if (!form.awarenessPersistenceStatus && !form.awarenessPersistenceNote.trim()) {
      setErrorText('Vui lòng nhập ghi chú cho tiêu chí Theo đến quyết (Nhận diện)');
      return;
    }
    if (anyFalse && !form.awarenessManagerNote.trim()) {
      setErrorText('Vui lòng nhập tổng kết coaching cho phần Nhận diện');
      return;
    }
    onSubmit({
      ...form,
      awarenessReviewed: true,
    });
  };

  return (
    <section className="review-section">
      <div className="review-section-head">
        <h3 style={{ margin: 0 }}>Đánh giá E-form Nhận diện</h3>
      </div>
      <div className="criterion-card tonal-card">
        <div className="eval-row">
          <span>Hỏi sâu hơn (Nhận diện)</span>
          <select
            className="custom-select"
            value={String(form.awarenessDeepInquiryStatus)}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                awarenessDeepInquiryStatus: e.target.value === 'true',
              }))
            }
          >
            <option value="true">Đã thực hiện</option>
            <option value="false">Chưa thực hiện</option>
          </select>
        </div>
        <textarea
          className="field"
          rows={2}
          placeholder="Ghi chú riêng cho tiêu chí Hỏi sâu hơn (Nhận diện)"
          value={form.awarenessDeepInquiryNote}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, awarenessDeepInquiryNote: e.target.value }))
          }
        />
      </div>
      <div className="criterion-card tonal-card">
        <div className="eval-row">
          <span>Đề xuất đầy đủ (Nhận diện)</span>
          <select
            className="custom-select"
            value={String(form.awarenessFullProposalStatus)}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                awarenessFullProposalStatus: e.target.value === 'true',
              }))
            }
          >
            <option value="true">Đã thực hiện</option>
            <option value="false">Chưa thực hiện</option>
          </select>
        </div>
        <textarea
          className="field"
          rows={2}
          placeholder="Ghi chú riêng cho tiêu chí Đề xuất đầy đủ (Nhận diện)"
          value={form.awarenessFullProposalNote}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, awarenessFullProposalNote: e.target.value }))
          }
        />
      </div>
      <div className="criterion-card tonal-card">
        <div className="eval-row">
          <span>Theo đến quyết (Nhận diện)</span>
          <select
            className="custom-select"
            value={String(form.awarenessPersistenceStatus)}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                awarenessPersistenceStatus: e.target.value === 'true',
              }))
            }
          >
            <option value="true">Đã thực hiện</option>
            <option value="false">Chưa thực hiện</option>
          </select>
        </div>
        <textarea
          className="field"
          rows={2}
          placeholder="Ghi chú riêng cho tiêu chí Theo đến quyết (Nhận diện)"
          value={form.awarenessPersistenceNote}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, awarenessPersistenceNote: e.target.value }))
          }
        />
      </div>
      <textarea
        className="field"
        rows={4}
        placeholder="Tổng kết coaching cho phần nhận diện"
        value={form.awarenessManagerNote}
        onChange={(e) =>
          setForm((prev) => ({ ...prev, awarenessManagerNote: e.target.value }))
        }
      />
      {errorText ? <div className="status-err" style={{ marginTop: 8 }}>{errorText}</div> : null}
      <button className="btn" style={{ marginTop: 10 }} onClick={save} disabled={saving}>
        Lưu đánh giá Nhận diện
      </button>
    </section>
  );
};

export default AwarenessReviewForm;

import { useEffect, useMemo, useState } from 'react';
import journalService from '../../../services/api/journalService';
import userService from '../../../services/api/userService';

const FORM_LABELS = {
  FORM_1_AWARENESS: 'Mẫu 1: Nhận diện',
  FORM_1_STANDARDS: 'Mẫu 1: Giữ chuẩn',
  FORM_3: 'Mẫu 3',
  FORM_4: 'Mẫu 4',
  FORM_5: 'Mẫu 5',
  FORM_7: 'Mẫu 7',
  FORM_8: 'Mẫu 8',
  FORM_9: 'Mẫu 9',
  FORM_12: 'Mẫu 12',
};

const today = new Date().toISOString().slice(0, 10);

const ProvincialApprovedJournalsPage = () => {
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [keyword, setKeyword] = useState('');
  const [unitId, setUnitId] = useState('');
  const [units, setUnits] = useState([]);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedApprovedForms, setSelectedApprovedForms] = useState([]);
  const [extraLogs, setExtraLogs] = useState(null);

  const load = async () => {
    setLoading(true);
    setErrorText('');
    try {
      const [list, unitList] = await Promise.all([
        journalService.getApprovedJournals({ fromDate, toDate, unitId: unitId || undefined, keyword: keyword || undefined }),
        userService.getUnits().catch(() => []),
      ]);
      setItems(Array.isArray(list) ? list : []);
      setUnits(Array.isArray(unitList) ? unitList : []);
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Không tải được danh sách mẫu đã duyệt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openDetail = async (item) => {
    setLoading(true);
    setErrorText('');
    try {
      const detail = await journalService.getById(item.id);
      const targetUserId = detail.userId || detail.user?.id;
      const logDate = detail.reportDate;
      const logs = await journalService.getLogsHistory(targetUserId, logDate).catch(() => ({}));
      setSelected(detail);
      setSelectedApprovedForms(item.approvedForms || []);
      setExtraLogs(logs || {});
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Không tải được chi tiết nhật ký');
    } finally {
      setLoading(false);
    }
  };

  const approvedFormText = useMemo(
    () =>
      (selectedApprovedForms || [])
        .map((code) => FORM_LABELS[code] || code)
        .join(', '),
    [selectedApprovedForms],
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <h2 style={{ margin: 0 }}>Mẫu nhật ký đã được quản lý duyệt</h2>
          <div className="page-subtitle">Xem các biểu mẫu nhân viên đã được duyệt theo ngày và đơn vị</div>
        </div>
      </div>
      {errorText ? <div className="status-err" style={{ marginBottom: 10 }}>{errorText}</div> : null}
      {loading ? <div>Đang tải dữ liệu...</div> : null}

      <section className="card" style={{ marginBottom: 12 }}>
        <h3 style={{ marginTop: 0 }}>Bộ lọc</h3>
        <div className="filters">
          <input type="date" className="field" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <input type="date" className="field" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          <select className="field" value={unitId} onChange={(e) => setUnitId(e.target.value)}>
            <option value="">Tất cả đơn vị</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>{unit.name}</option>
            ))}
          </select>
          <input className="field" placeholder="Tìm theo tên hoặc tài khoản" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <button className="btn outline" type="button" onClick={load}>Lọc</button>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 12 }}>
        <h3 style={{ marginTop: 0 }}>Danh sách nhật ký đã duyệt</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Nhân viên</th>
                <th>Tài khoản</th>
                <th>Mẫu đã duyệt</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.reportDate}</td>
                  <td>{item.user?.fullName || '-'}</td>
                  <td>{item.user?.username || '-'}</td>
                  <td>{(item.approvedForms || []).map((code) => FORM_LABELS[code] || code).join(', ')}</td>
                  <td>
                    <button className="btn outline" onClick={() => openDetail(item)}>Xem chi tiết</button>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 ? (
                <tr><td colSpan={5}>Không có dữ liệu</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {selected ? (
        <section className="card">
          <h3 style={{ marginTop: 0 }}>Chi tiết mẫu đã duyệt</h3>
          <div style={{ marginBottom: 8 }}>
            Nhân viên: <strong>{selected?.user?.fullName || '-'}</strong> | Ngày: <strong>{selected?.reportDate}</strong>
          </div>
          <div style={{ marginBottom: 10 }}>
            Mẫu đã duyệt: <strong>{approvedFormText || '-'}</strong>
          </div>
          <div className="review-bento">
            <div className="review-bento-card">
              <div className="review-bento-title">Mẫu 1: Nhận diện</div>
              <div className="review-bento-content">
                Né điều gì: {selected?.avoidance || '-'}<br />
                Tự loại gói: {selected?.selfLimit || '-'}<br />
                Dừng tư vấn sớm: {selected?.earlyStop || '-'}<br />
                Đổ lỗi: {selected?.blaming || '-'}
              </div>
            </div>
            <div className="review-bento-card">
              <div className="review-bento-title">Mẫu 1: Giữ chuẩn</div>
              <div className="review-bento-content">
                Chuẩn đã giữ: {selected?.standardsKeptText || '-'}<br />
                Dấu hiệu tụt chuẩn: {selected?.backslideSigns || '-'}<br />
                Cách xử lý: {selected?.solution || '-'}
              </div>
            </div>
            <div className="review-bento-card">
              <div className="review-bento-title">Mẫu 3</div>
              <div className="review-bento-content">
                Suy nghĩ tiêu cực: {extraLogs?.form3?.negativeThought || '-'}<br />
                Tư duy mới: {extraLogs?.form3?.newMindset || '-'}<br />
                Hành vi thay đổi: {extraLogs?.form3?.behaviorChange || '-'}
              </div>
            </div>
            <div className="review-bento-card">
              <div className="review-bento-title">Mẫu 5</div>
              <div className="review-bento-content">
                Bài học ngày mai: {extraLogs?.form5?.tomorrowLesson || '-'}<br />
                Việc làm khác đi: {extraLogs?.form5?.differentAction || '-'}
              </div>
            </div>
            <div className="review-bento-card">
              <div className="review-bento-title">Mẫu 7</div>
              <div className="review-bento-content">
                Chuẩn đã giữ: {extraLogs?.form7?.keptStandard || '-'}<br />
                Dấu hiệu tụt chuẩn: {extraLogs?.form7?.backslideSign || '-'}<br />
                Cách xử lý: {extraLogs?.form7?.solution || '-'}
              </div>
            </div>
            <div className="review-bento-card">
              <div className="review-bento-title">Mẫu 9</div>
              <div className="review-bento-content">
                Tự giới hạn: {extraLogs?.form9?.selfLimitArea || '-'}<br />
                Hành vi chứng minh: {extraLogs?.form9?.proofBehavior || '-'}<br />
                Nâng chuẩn: {extraLogs?.form9?.raiseStandard || '-'}<br />
                Hành động: {extraLogs?.form9?.actionPlan || '-'}
              </div>
            </div>
            <div className="review-bento-card">
              <div className="review-bento-title">Mẫu 12</div>
              <div className="review-bento-content">
                Tuyên ngôn: {extraLogs?.form12?.declarationText || '-'}<br />
                Ký tên: {extraLogs?.form12?.commitmentSignature || '-'}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default ProvincialApprovedJournalsPage;

import { useEffect, useState } from 'react';
import journalService from '../../../services/api/journalService';

const today = new Date().toISOString().slice(0, 10);

const JournalSubmissionsPage = () => {
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [date, setDate] = useState(today);
  const [stats, setStats] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState(null); // { title: string, users: array }

  const load = async () => {
    setLoading(true);
    setErrorText('');
    try {
      const data = await journalService.getJournalSubmissionsStats(date);
      setStats(data);
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Không tải được dữ liệu tỷ lệ nhập');
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    if (!stats || !stats.units) return;

    const rows = [
      ['Tên đơn vị', 'Tên nhân viên', 'Ngày thực hiện', 'Trạng thái'],
    ];

    stats.units.forEach(unit => {
      unit.submittedUsers?.forEach(user => {
        rows.push([unit.name, user.fullName || user.username, date, 'Đã nhập']);
      });
      unit.notSubmittedUsers?.forEach(user => {
        rows.push([unit.name, user.fullName || user.username, date, 'Chưa nhập']);
      });
    });

    const csv = rows.map((row) => row.map((col) => `"${String(col || '')}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `thong-ke-nhat-ky-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2 style={{ margin: 0 }}>Tỷ lệ nhập nhật ký</h2>
          <div className="page-subtitle">Thống kê số lượng nhân viên đã và chưa nhập nhật ký theo ngày</div>
        </div>
      </div>
      {errorText ? <div className="status-err" style={{ marginBottom: 10 }}>{errorText}</div> : null}

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Bộ lọc</h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>
              Ngày báo cáo
            </label>
            <input
              type="date"
              className="field"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: '8px' }}>
            <button className="btn" onClick={load} disabled={loading}>
              {loading ? 'Đang tải...' : 'Lọc'}
            </button>
            <button className="btn outline" onClick={exportExcel} disabled={loading || !stats}>
              Xuất Excel
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ marginBottom: 12, padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: 8, fontSize: 14, color: '#64748b' }}>
            *Lưu ý: Tỷ lệ nhập nhật ký tính cho ngày <strong>{date}</strong>.
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>Tổng NV toàn tỉnh: <strong>{stats?.province?.total || 0}</strong></div>
            <div>Đã nhập: <strong style={{ color: '#0f766e' }}>{stats?.province?.submitted || 0}</strong> ({stats?.province?.submittedRate || 0}%)</div>
            <div>Chưa nhập: <strong style={{ color: '#b45309' }}>{stats?.province?.notSubmitted || 0}</strong> ({stats?.province?.notSubmittedRate || 0}%)</div>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Đơn vị</th>
                <th>Tổng NV</th>
                <th>Đã nhập</th>
                <th>Tỷ lệ đã nhập</th>
                <th>Chưa nhập</th>
                <th>Tỷ lệ chưa nhập</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.units || []).map((row) => (
                <tr key={row.unitId}>
                  <td>{row.unitName}</td>
                  <td>{row.total}</td>
                  <td>
                    {row.submitted > 0 ? (
                      <span
                        style={{ color: '#0f766e', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => setSelectedUsers({ title: `Đã nhập - ${row.unitName}`, users: row.submittedUsers })}
                      >
                        {row.submitted}
                      </span>
                    ) : (
                      row.submitted
                    )}
                  </td>
                  <td><strong style={{ color: '#0f766e' }}>{row.submittedRate}%</strong></td>
                  <td>
                    {row.notSubmitted > 0 ? (
                      <span
                        style={{ color: '#b45309', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => setSelectedUsers({ title: `Chưa nhập - ${row.unitName}`, users: row.notSubmittedUsers })}
                      >
                        {row.notSubmitted}
                      </span>
                    ) : (
                      row.notSubmitted
                    )}
                  </td>
                  <td><strong style={{ color: '#b45309' }}>{row.notSubmittedRate}%</strong></td>
                </tr>
              ))}
              {!loading && (!stats?.units || stats.units.length === 0) ? (
                <tr><td colSpan={6}>Không có dữ liệu</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUsers && (
        <div className="simple-modal-backdrop" onClick={() => setSelectedUsers(null)}>
          <div className="simple-modal" onClick={(e) => e.stopPropagation()} style={{ minWidth: 400 }}>
            <h3 style={{ marginTop: 0 }}>Danh sách nhân viên ({selectedUsers.title})</h3>
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Họ và tên</th>
                    <th>Tên tài khoản (Username)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedUsers.users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.fullName}</td>
                      <td>{u.username}</td>
                    </tr>
                  ))}
                  {selectedUsers.users.length === 0 && (
                    <tr><td colSpan={2}>Không có nhân viên</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn outline" onClick={() => setSelectedUsers(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalSubmissionsPage;
import { useEffect, useState } from 'react';
import userService from '../../../services/api/userService';

const LoginHistoryPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const loadData = async () => {
    setLoading(true);
    setErrorText('');
    try {
      const data = await userService.getLoginLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Không tải được lịch sử đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2 style={{ margin: 0 }}>Lịch sử đăng nhập</h2>
          <div className="page-subtitle">Theo dõi lịch sử truy cập hệ thống của người dùng</div>
        </div>
      </div>
      
      {errorText ? <div className="status-err" style={{ marginBottom: 10 }}>{errorText}</div> : null}
      
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Nhật ký truy cập gần đây (500 lượt)</h3>
          <button className="btn outline" onClick={loadData} disabled={loading}>
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên đăng nhập</th>
                <th>Thời gian</th>
                <th>IP Address</th>
                <th>Thiết bị / Trình duyệt (User Agent)</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={log.id}>
                  <td>{index + 1}</td>
                  <td><strong>{log.username}</strong></td>
                  <td>{formatDate(log.createdAt)}</td>
                  <td>{log.ipAddress || '--'}</td>
                  <td>
                    <div style={{ 
                      maxWidth: '400px', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis' 
                    }} title={log.userAgent}>
                      {log.userAgent || '--'}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center' }}>Không có dữ liệu</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LoginHistoryPage;
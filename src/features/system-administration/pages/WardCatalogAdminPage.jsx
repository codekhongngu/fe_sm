import { useEffect, useMemo, useState } from 'react';
import catalogService from '../../../services/api/catalogService';

const WardCatalogAdminPage = () => {
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorText, setErrorText] = useState('');
  const [importing, setImporting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    note: '',
  });

  const sortedWards = useMemo(
    () => [...wards].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))),
    [wards],
  );

  const loadWards = async () => {
    setLoading(true);
    setErrorText('');
    try {
      const data = await catalogService.listWards();
      setWards(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Không tải được danh mục phường/xã');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWards();
  }, []);

  const handleCreateWard = async () => {
    setStatusText('');
    setErrorText('');
    if (!String(form.name || '').trim()) {
      setErrorText('Vui lòng nhập tên phường/xã');
      return;
    }

    setCreating(true);
    try {
      await catalogService.createWard({
        code: String(form.code || '').trim(),
        name: String(form.name || '').trim(),
        description: String(form.note || '').trim(),
      });
      setForm({ code: '', name: '', note: '' });
      setStatusText('Đã thêm mới phường/xã');
      await loadWards();
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Thêm phường/xã thất bại');
    } finally {
      setCreating(false);
    }
  };

  const handleImportExcel = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setImporting(true);
    setErrorText('');
    setStatusText('');
    try {
      const result = await catalogService.importWardsExcel(file);
      setStatusText(
        `Import thành công. Tổng: ${result.total}, thêm mới: ${result.created}, cập nhật: ${result.updated}, bỏ qua: ${result.skipped}`,
      );
      await loadWards();
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Import Excel thất bại');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setErrorText('');
    try {
      const blob = await catalogService.downloadWardTemplate();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'mau-import-danh-muc-phuong-xa.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Không tải được file mẫu');
    }
  };

  return (
    <div>
      <h2>Quản lý danh mục Phường/Xã</h2>
      <p>Cấu hình dữ liệu phường/xã dùng chung cho toàn hệ thống.</p>

      <div className="card" style={{ marginBottom: 12 }}>
        <h3 style={{ marginTop: 0 }}>Import danh sách bằng Excel</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn outline" onClick={handleDownloadTemplate}>
            Tải file mẫu
          </button>
          <label className="btn" style={{ marginBottom: 0, cursor: importing ? 'not-allowed' : 'pointer' }}>
            {importing ? 'Đang import...' : 'Chọn file Excel để import'}
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              disabled={importing}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12, maxWidth: 760 }}>
        <h3 style={{ marginTop: 0 }}>Thêm phường/xã thủ công</h3>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
          <input
            className="field"
            placeholder="Mã phường/xã (tùy chọn)"
            value={form.code}
            onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
          />
          <input
            className="field"
            placeholder="Tên phường/xã *"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <input
            className="field"
            placeholder="Ghi chú"
            value={form.note}
            onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
            style={{ gridColumn: '1 / -1' }}
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <button className="btn" onClick={handleCreateWard} disabled={creating}>
            {creating ? 'Đang lưu...' : 'Thêm phường/xã'}
          </button>
        </div>
      </div>

      {statusText ? <div className="status-ok" style={{ marginBottom: 12 }}>{statusText}</div> : null}
      {errorText ? <div className="status-err" style={{ marginBottom: 12 }}>{errorText}</div> : null}

      <div className="card" style={{ marginBottom: 12 }}>
        <h3 style={{ marginTop: 0 }}>Danh sách phường/xã ({sortedWards.length})</h3>
        {loading ? (
          <div>Đang tải dữ liệu...</div>
        ) : sortedWards.length === 0 ? (
          <div>Chưa có dữ liệu phường/xã.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="coaching-list-table" style={{ minWidth: 860 }}>
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên phường/xã</th>
                  <th>Ghi chú</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {sortedWards.map((item) => {
                  return (
                    <tr key={item.id}>
                      <td>{item.code || '-'}</td>
                      <td style={{ fontWeight: 700 }}>{item.name || '-'}</td>
                      <td>{item.description || '-'}</td>
                      <td>{item.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WardCatalogAdminPage;

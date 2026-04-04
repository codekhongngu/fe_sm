import { useEffect, useState } from 'react';
import catalogService from '../../../services/api/catalogService';

const CatalogPage = () => {
  const [items, setItems] = useState([]);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await catalogService.list();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Không tải được danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createItem = async () => {
    setStatus('');
    try {
      await catalogService.create({
        code,
        name,
        description,
        price: Number(price || 0),
      });
      setCode('');
      setName('');
      setDescription('');
      setPrice(0);
      setStatus('Tạo danh mục thành công');
      loadData();
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Tạo danh mục thất bại');
    }
  };

  const deactivateItem = async (id) => {
    setStatus('');
    try {
      await catalogService.deactivate(id);
      setStatus('Đã ngừng kích hoạt danh mục');
      loadData();
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Cập nhật trạng thái thất bại');
    }
  };

  return (
    <div>
      <h2>Cấu hình catalog</h2>
      <p>Quản lý các danh mục dùng chung trong hệ thống.</p>
      <div className="card" style={{ marginBottom: 12, maxWidth: 620 }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <input
            className="field"
            placeholder="Mã"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <input
            className="field"
            placeholder="Tên"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="field"
            placeholder="Mô tả"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            className="field"
            placeholder="Giá"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <button className="btn" onClick={createItem}>
            Thêm
          </button>
        </div>
      </div>
      {status ? <div className="status-ok" style={{ marginBottom: 12 }}>{status}</div> : null}
      {loading ? (
        <div>Đang tải dữ liệu...</div>
      ) : (
        items.map((item) => (
          <div key={item.id} className="card" style={{ marginBottom: 8 }}>
            <div>
              <strong>
                {item.code} - {item.name}
              </strong>
            </div>
            <div>Mô tả: {item.description || '-'}</div>
            <div>Giá: {item.price}</div>
            <div>Trạng thái: {item.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}</div>
            <div style={{ marginTop: 6 }}>
              <button
                className="btn danger"
                onClick={() => deactivateItem(item.id)}
                disabled={!item.isActive}
              >
                Ngừng kích hoạt
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default CatalogPage;

import { useEffect, useState } from 'react';
import userService from '../../../../services/api/userService';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [units, setUnits] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [errorText, setErrorText] = useState('');
  const [unitCode, setUnitCode] = useState('');
  const [unitName, setUnitName] = useState('');
  const [unitTelegramGroupChatId, setUnitTelegramGroupChatId] = useState('');
  const [parentUnitId, setParentUnitId] = useState('');
  const [editingUnitId, setEditingUnitId] = useState('');
  const [search, setSearch] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [viewMode, setViewMode] = useState('users');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newUserRole, setNewUserRole] = useState('EMPLOYEE');
  const [newUserUnitId, setNewUserUnitId] = useState('');
  const [newTelegramChatId, setNewTelegramChatId] = useState('');
  const [editingUserId, setEditingUserId] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editUserRole, setEditUserRole] = useState('EMPLOYEE');
  const [editUserUnitId, setEditUserUnitId] = useState('');
  const [editTelegramChatId, setEditTelegramChatId] = useState('');

  const loadUnits = async () => {
    const data = await userService.getUnits();
    setUnits(Array.isArray(data) ? data : []);
  };

  const loadData = async () => {
    setLoading(true);
    setErrorText('');
    try {
      const data = await userService.getList();
      setUsers(Array.isArray(data) ? data : []);
      await loadUnits();
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Không tải được cấu hình người dùng/đơn vị');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const importExcel = async () => {
    setStatus('');
    setErrorText('');
    if (!file) {
      setErrorText('Vui lòng chọn file Excel');
      return;
    }
    try {
      const result = await userService.importExcel(file);
      setFile(null);
      setStatus(
        `Import thành công: tạo ${result?.createdCount || 0}, bỏ qua ${result?.skippedCount || 0}`,
      );
      loadData();
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Import thất bại');
    }
  };

  const changeRole = async (id, role) => {
    setStatus('');
    setErrorText('');
    try {
      await userService.updateRole(id, role);
      setStatus('Cập nhật quyền thành công');
      loadData();
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Cập nhật quyền thất bại');
    }
  };

  const changeUnit = async (id, nextUnitId) => {
    setStatus('');
    setErrorText('');
    try {
      await userService.updateUserUnit(id, nextUnitId);
      setStatus('Cập nhật đơn vị thành công');
      loadData();
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Cập nhật đơn vị thất bại');
    }
  };

  const createUnit = async () => {
    setStatus('');
    setErrorText('');
    if (!unitCode || !unitName) {
      setErrorText('Vui lòng nhập mã đơn vị và tên đơn vị');
      return;
    }
    try {
      await userService.createUnit({
        code: unitCode,
        name: unitName,
        telegramGroupChatId: unitTelegramGroupChatId || undefined,
        parentUnitId: parentUnitId || undefined,
      });
      setUnitCode('');
      setUnitName('');
      setUnitTelegramGroupChatId('');
      setParentUnitId('');
      setStatus('Tạo đơn vị thành công');
      loadData();
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Tạo đơn vị thất bại');
    }
  };

  const startEditUnit = (unit) => {
    setEditingUnitId(unit.id);
    setUnitCode(unit.code || '');
    setUnitName(unit.name || '');
    setUnitTelegramGroupChatId(unit.telegramGroupChatId || '');
    setParentUnitId(unit.parentUnitId || '');
  };

  const saveEditUnit = async () => {
    setStatus('');
    setErrorText('');
    if (!editingUnitId) return;
    if (!unitCode || !unitName) {
      setErrorText('Vui lòng nhập mã đơn vị và tên đơn vị');
      return;
    }
    try {
      await userService.updateUnit(editingUnitId, {
        code: unitCode,
        name: unitName,
        telegramGroupChatId: unitTelegramGroupChatId || undefined,
        parentUnitId: parentUnitId || undefined,
      });
      setStatus('Cập nhật đơn vị thành công');
      setEditingUnitId('');
      setUnitCode('');
      setUnitName('');
      setUnitTelegramGroupChatId('');
      setParentUnitId('');
      loadData();
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Cập nhật đơn vị thất bại');
    }
  };

  const createUser = async () => {
    setStatus('');
    setErrorText('');
    if (!newUsername || !newPassword || !newFullName || !newUserUnitId) {
      setErrorText('Vui lòng nhập đủ thông tin người dùng mới');
      return;
    }
    try {
      await userService.createUser({
        username: newUsername,
        password: newPassword,
        fullName: newFullName,
        role: newUserRole,
        unitId: newUserUnitId,
        telegramChatId: newTelegramChatId || undefined,
      });
      setNewUsername('');
      setNewPassword('');
      setNewFullName('');
      setNewUserRole('EMPLOYEE');
      setNewUserUnitId('');
      setNewTelegramChatId('');
      setStatus('Tạo người dùng thành công');
      loadData();
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Tạo người dùng thất bại');
    }
  };

  const startEditUser = (user) => {
    setEditingUserId(user.id);
    setEditUsername(user.username || '');
    setEditFullName(user.fullName || '');
    setEditUserRole(user.role || 'EMPLOYEE');
    setEditUserUnitId(user.unitId || '');
    setEditTelegramChatId(user.telegramChatId || '');
  };

  const saveEditUser = async () => {
    setStatus('');
    setErrorText('');
    if (!editingUserId) return;
    if (!editUsername || !editFullName || !editUserUnitId) {
      setErrorText('Vui lòng nhập đủ thông tin cập nhật người dùng');
      return;
    }
    try {
      await userService.updateUser(editingUserId, {
        username: editUsername,
        fullName: editFullName,
        role: editUserRole,
        unitId: editUserUnitId,
        telegramChatId: editTelegramChatId || undefined,
      });
      setStatus('Cập nhật thông tin người dùng thành công');
      setEditingUserId('');
      setEditUsername('');
      setEditFullName('');
      setEditUserRole('EMPLOYEE');
      setEditUserUnitId('');
      setEditTelegramChatId('');
      loadData();
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Cập nhật người dùng thất bại');
    }
  };

  const quickResetPassword = async (user) => {
    setStatus('');
    setErrorText('');
    const newPassword = window.prompt(`Nhập mật khẩu mới cho ${user.username}`);
    if (!newPassword) return;
    try {
      await userService.resetPassword(user.id, newPassword);
      setStatus('Reset mật khẩu thành công');
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Reset mật khẩu thất bại');
    }
  };

  const deleteUnit = async (id) => {
    setStatus('');
    setErrorText('');
    try {
      await userService.deleteUnit(id);
      setStatus('Xóa đơn vị thành công');
      loadData();
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Xóa đơn vị thất bại');
    }
  };

  const filteredUsers = users.filter((user) => {
    const text = `${user.fullName} ${user.username}`.toLowerCase();
    const matchSearch = !search || text.includes(search.toLowerCase());
    const matchUnit = !unitFilter || user.unitId === unitFilter;
    return matchSearch && matchUnit;
  });

  return (
    <div>
      <div className="page-head">
        <div>
          <h2 style={{ margin: 0 }}>Quản lý người dùng</h2>
          <div className="page-subtitle">Quản lý thông tin tài khoản, vai trò và trạng thái đăng nhập</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn ${viewMode === 'users' ? '' : 'outline'}`}
            onClick={() => setViewMode('users')}
          >
            Người dùng
          </button>
          <button
            className={`btn ${viewMode === 'units' ? '' : 'outline'}`}
            onClick={() => setViewMode('units')}
          >
            Đơn vị
          </button>
        </div>
      </div>

      {viewMode === 'users' ? (
        <>
          <div className="card" style={{ marginBottom: 12 }}>
            <h3 style={{ marginTop: 0 }}>Thêm người dùng</h3>
            <div className="filters" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <input
                className="field"
                placeholder="Họ tên"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
              />
              <input
                className="field"
                placeholder="Username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
              <input
                className="field"
                placeholder="Mật khẩu"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <select
                className="field"
                value={newUserUnitId}
                onChange={(e) => setNewUserUnitId(e.target.value)}
              >
                <option value="">Chọn đơn vị</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.code} - {unit.name}
                  </option>
                ))}
              </select>
              <select
                className="field"
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
              >
                <option value="EMPLOYEE">EMPLOYEE</option>
                <option value="MANAGER">MANAGER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <input
                className="field"
                placeholder="Telegram Chat ID (không bắt buộc)"
                value={newTelegramChatId}
                onChange={(e) => setNewTelegramChatId(e.target.value)}
              />
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <button className="btn" onClick={createUser}>
                Thêm người dùng
              </button>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <button className="btn outline" onClick={importExcel}>
                Import Excel
              </button>
            </div>
          </div>

          {editingUserId ? (
            <div className="card" style={{ marginBottom: 12 }}>
              <h3 style={{ marginTop: 0 }}>Cập nhật người dùng</h3>
              <div className="filters" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <input
                  className="field"
                  placeholder="Họ tên"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                />
                <input
                  className="field"
                  placeholder="Username"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                />
                <select
                  className="field"
                  value={editUserUnitId}
                  onChange={(e) => setEditUserUnitId(e.target.value)}
                >
                  <option value="">Chọn đơn vị</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.code} - {unit.name}
                    </option>
                  ))}
                </select>
                <select
                  className="field"
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value)}
                >
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                <input
                  className="field"
                  placeholder="Telegram Chat ID (không bắt buộc)"
                  value={editTelegramChatId}
                  onChange={(e) => setEditTelegramChatId(e.target.value)}
                />
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <button className="btn" onClick={saveEditUser}>
                  Lưu cập nhật
                </button>
                <button
                  className="btn outline"
                  onClick={() => {
                    setEditingUserId('');
                    setEditUsername('');
                    setEditFullName('');
                    setEditUserRole('EMPLOYEE');
                    setEditUserUnitId('');
                    setEditTelegramChatId('');
                  }}
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : null}

          <div className="card" style={{ marginBottom: 12 }}>
            <h3 style={{ marginTop: 0 }}>Bộ lọc</h3>
            <div className="filters">
              <input
                className="field"
                placeholder="Tìm tên, mã NV, username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select className="field" value={unitFilter} onChange={(e) => setUnitFilter(e.target.value)}>
                <option value="">Tất cả đơn vị</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.code} - {unit.name}
                  </option>
                ))}
              </select>
              <button className="btn outline" onClick={loadData}>
                Tải lại
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Họ tên & Mã NV</th>
                  <th>Đơn vị</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Đơn vị chuyển</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{user.fullName}</div>
                      <div style={{ color: '#64748b', fontSize: 12 }}>{user.username}</div>
                    </td>
                    <td>{user?.unit?.name || '-'}</td>
                    <td>
                      <select value={user.role} onChange={(e) => changeRole(user.id, e.target.value)}>
                        <option value="EMPLOYEE">EMPLOYEE</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td>
                      <span className="chip-ok">Đang hoạt động</span>
                    </td>
                    <td>
                      <select
                        value={user.unitId || ''}
                        onChange={(e) => changeUnit(user.id, e.target.value)}
                      >
                        {units.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.code} - {unit.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        className="btn outline"
                        style={{ marginRight: 8 }}
                        onClick={() => startEditUser(user)}
                      >
                        Sửa
                      </button>
                      <button className="btn danger" onClick={() => quickResetPassword(user)}>
                        Reset pass
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 12 }}>
            <h3 style={{ marginTop: 0 }}>Cấu hình đơn vị</h3>
            <div style={{ display: 'grid', gap: 8, maxWidth: 520 }}>
              <input
                className="field"
                placeholder="Mã đơn vị (VD: SALE-HCM)"
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)}
              />
              <input
                className="field"
                placeholder="Tên đơn vị"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
              />
              <input
                className="field"
                placeholder="Telegram Group Chat ID (không bắt buộc)"
                value={unitTelegramGroupChatId}
                onChange={(e) => setUnitTelegramGroupChatId(e.target.value)}
              />
              <select
                className="field"
                value={parentUnitId}
                onChange={(e) => setParentUnitId(e.target.value)}
              >
                <option value="">Không có đơn vị cha</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.code} - {unit.name}
                  </option>
                ))}
              </select>
              <button className="btn" onClick={editingUnitId ? saveEditUnit : createUnit}>
                {editingUnitId ? 'Cập nhật đơn vị' : 'Tạo đơn vị'}
              </button>
              {editingUnitId ? (
                <button
                  className="btn outline"
                  onClick={() => {
                    setEditingUnitId('');
                    setUnitCode('');
                    setUnitName('');
                    setUnitTelegramGroupChatId('');
                    setParentUnitId('');
                  }}
                >
                  Hủy sửa
                </button>
              ) : null}
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã đơn vị</th>
                  <th>Tên đơn vị</th>
                  <th>Đơn vị cha</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => (
                  <tr key={unit.id}>
                    <td>{unit.code}</td>
                    <td>{unit.name}</td>
                    <td>{unit?.parentUnit?.name || 'Không có'}</td>
                    <td>{unit.isActive ? 'Hoạt động' : 'Ngừng'}</td>
                    <td>
                      <button
                        className="btn outline"
                        style={{ marginRight: 8 }}
                        onClick={() => startEditUnit(unit)}
                      >
                        Sửa
                      </button>
                      <button className="btn danger" onClick={() => deleteUnit(unit.id)}>
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {status ? <div className="status-ok" style={{ marginBottom: 12 }}>{status}</div> : null}
      {errorText ? <div className="status-err" style={{ marginBottom: 12 }}>{errorText}</div> : null}
      {loading ? <div>Đang tải dữ liệu...</div> : null}
    </div>
  );
};

export default UserManagementPage;

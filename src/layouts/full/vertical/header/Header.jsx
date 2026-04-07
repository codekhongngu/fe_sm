import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import userService from '../../../../services/api/userService';
import { logout, selectAuth } from '../../../../store/auth/AuthSlice';
import logo from '../../../../assets/images/logos/logo.png';

const Header = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(selectAuth);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorText, setErrorText] = useState('');
  const [statusText, setStatusText] = useState('');
  const [saving, setSaving] = useState(false);
  const displayName = user?.fullName || user?.username || '';
  const avatarText = (displayName || 'U').trim().charAt(0).toUpperCase();
  const roleLabel = user?.role === 'ADMIN' ? 'Quản trị viên' : user?.role === 'MANAGER' ? 'Quản lý' : 'Nhân viên';

  const changePassword = async () => {
    setErrorText('');
    setStatusText('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorText('Vui lòng nhập đủ thông tin đổi mật khẩu');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorText('Mật khẩu xác nhận không khớp');
      return;
    }
    setSaving(true);
    try {
      await userService.changeMyPassword({ currentPassword, newPassword });
      setStatusText('Đổi mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);
    } catch (error) {
      setErrorText(error?.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-brand-wrap">
        <span className="topbar-logo" src={logo} alt="logo" />
        <strong className="topbar-brand">Hệ thống quản trị hành vi bán hàng</strong>
      </div>

      <nav className="topbar-menu">
        <NavLink to="/" end className={({ isActive }) => `topbar-item ${isActive ? 'active' : ''}`}>
          Dashboard
        </NavLink>
        {/* <NavLink
          to="/management/catalogs"
          className={({ isActive }) => `topbar-item ${isActive ? 'active' : ''}`}
        >
          Cấu hình catalog
        </NavLink> */}
        <NavLink
          to="/discipline/journey-90"
          className={({ isActive }) => `topbar-item ${isActive ? 'active' : ''}`}
        >
          Nhật ký hằng ngày
        </NavLink>
        {(user?.role === 'MANAGER' || user?.role === 'ADMIN') ? (
          <NavLink
            to="/discipline/manager-review"
            className={({ isActive }) => `topbar-item ${isActive ? 'active' : ''}`}
          >
            Tra cứu nhật ký
          </NavLink>
        ) : null}
        {user?.role === 'ADMIN' ? (
          <NavLink
            to="/system-administration/users"
            className={({ isActive }) => `topbar-item ${isActive ? 'active' : ''}`}
          >
            Cấu hình người dùng
          </NavLink>
        ) : null}
        {user?.role === 'ADMIN' ? (
          <NavLink
            to="/system-administration/roles-permissions"
            className={({ isActive }) => `topbar-item ${isActive ? 'active' : ''}`}
          >
            Cấu hình quyền
          </NavLink>
        ) : null}
      </nav>

      <div className="topbar-actions">
        <div className="topbar-user-wrap">
          <div className="topbar-user-text">
            <span className="topbar-user-name">{displayName}</span>
            <span className="topbar-user-role">{roleLabel}</span>
          </div>
          <span className="topbar-avatar">{avatarText}</span>
        </div>
        <button className="topbar-action-btn" onClick={() => setShowChangePassword(true)}>
          Đổi mật khẩu
        </button>
        <button className="topbar-action-btn danger" onClick={() => dispatch(logout())}>
          Đăng xuất
        </button>
      </div>
      {statusText ? (
        <div style={{ position: 'absolute', right: 16, top: 62 }} className="status-ok">
          {statusText}
        </div>
      ) : null}
      {showChangePassword ? (
        <div className="simple-modal-backdrop" onClick={() => setShowChangePassword(false)}>
          <div className="simple-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Đổi mật khẩu</h3>
            <input
              className="field"
              type="password"
              placeholder="Mật khẩu hiện tại"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <input
              className="field"
              type="password"
              placeholder="Mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ marginTop: 8 }}
            />
            <input
              className="field"
              type="password"
              placeholder="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ marginTop: 8 }}
            />
            {errorText ? <div className="status-err" style={{ marginTop: 8 }}>{errorText}</div> : null}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn" onClick={changePassword} disabled={saving}>
                Lưu
              </button>
              <button className="btn outline" onClick={() => setShowChangePassword(false)}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
};

export default Header;

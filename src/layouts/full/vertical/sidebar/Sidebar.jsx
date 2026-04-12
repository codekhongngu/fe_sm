import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuth } from '../../../../store/auth/AuthSlice';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useSelector(selectAuth);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="brand">Hệ thống quản trị hành vi bán hàng</div>
      <nav className="menu" onClick={onClose}>
        <NavLink to="/" end className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
          Trung tâm cấu hình
        </NavLink>
        <NavLink
          to="/management/catalogs"
          className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
        >
          Cấu hình catalog
        </NavLink>
        <NavLink
          to="/discipline/journey-90"
          className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
        >
          Nhật ký hằng ngày
        </NavLink>
        {(user?.role === 'MANAGER' || user?.role === 'ADMIN') ? (
          <NavLink
            to="/discipline/manager-review"
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
          >
            Tra cứu nhật ký
          </NavLink>
        ) : null}
        {user?.role === 'ADMIN' ? (
          <NavLink
            to="/system-administration/journey-phase-configs"
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
          >
            Cấu hình giai đoạn
          </NavLink>
        ) : null}
        {user?.role === 'ADMIN' ? (
          <NavLink
            to="/system-administration/users"
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
          >
            Cấu hình người dùng
          </NavLink>
        ) : null}
        {user?.role === 'ADMIN' ? (
          <NavLink
            to="/system-administration/roles-permissions"
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
          >
            Cấu hình quyền
          </NavLink>
        ) : null}
        {user?.role === 'ADMIN' ? (
          <NavLink
            to="/system-administration/login-history"
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
          >
            Lịch sử đăng nhập
          </NavLink>
        ) : null}
      </nav>
    </aside>
  );
};

export default Sidebar;

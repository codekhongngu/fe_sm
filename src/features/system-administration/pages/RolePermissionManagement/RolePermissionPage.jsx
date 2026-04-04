const matrix = [
  {
    role: 'ADMIN',
    permissions: ['Toàn quyền hệ thống', 'Quản lý catalog', 'Quản lý người dùng', 'Import Excel'],
  },
  {
    role: 'MANAGER',
    permissions: ['Quản lý catalog', 'Quản lý người dùng cùng đơn vị', 'Import Excel cùng đơn vị'],
  },
  {
    role: 'EMPLOYEE',
    permissions: ['Không có quyền cấu hình', 'Chỉ sử dụng các nghiệp vụ tác nghiệp'],
  },
];

const RolePermissionPage = () => {
  return (
    <div>
      <h2>Cấu hình quyền vai trò</h2>
      <p>Ma trận quyền đang áp dụng theo logic backend hiện tại.</p>
      <div className="cards-grid" style={{ marginTop: 12 }}>
        {matrix.map((item) => (
          <div key={item.role} className="card">
            <h3 style={{ marginTop: 0 }}>{item.role}</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {item.permissions.map((permission) => (
                <li key={permission}>{permission}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RolePermissionPage;

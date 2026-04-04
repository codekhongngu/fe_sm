import { Navigate } from 'react-router-dom';

const RoleGuard = ({ user, roles, children }) => {
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }
  if (!roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default RoleGuard;

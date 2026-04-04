import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import authService from '../../../services/api/authService';
import { setCredentials } from '../../../store/auth/AuthSlice';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await authService.login({ username, password });
      dispatch(setCredentials({ token: res.accessToken, user: res.user }));
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="login-screen">
      <form onSubmit={submit} className="login-card">
        <div style={{ color: '#0074ba', fontWeight: 700, marginBottom: 6 }}>SM PLATFORM</div>
        <h2>Đăng nhập</h2>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="field"
          style={{ marginBottom: 8 }}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field"
          style={{ marginBottom: 8 }}
        />
        {error ? <div className="status-err" style={{ marginBottom: 8 }}>{error}</div> : null}
        <button className="btn" type="submit">Đăng nhập</button>
      </form>
    </div>
  );
};

export default LoginPage;

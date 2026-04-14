import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import Router from './routes/Router';
import { restoreAuth } from './store/auth/AuthSlice';
import { BusinessTimeUtil } from './utils/BusinessTimeUtil';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(restoreAuth());
    
    // Tải cấu hình giờ cắt ngày từ hệ thống (Dùng axios gốc để không bị interceptor chặn lỗi 401)
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://be-sm.codekhongngu.workers.dev';
    axios.get(`${baseURL}/api/system-configs/cutoff-time`)
      .then(res => {
        if (res.data && res.data.hour !== undefined) {
          BusinessTimeUtil.CUTOFF_HOUR = Number(res.data.hour);
        }
      })
      .catch(e => console.error('Lỗi tải cấu hình time-shifting:', e));
  }, [dispatch]);

  return <Router />;
}

export default App;

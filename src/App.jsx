import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import Router from './routes/Router';
import { restoreAuth } from './store/auth/AuthSlice';
import axiosInstance from './utils/http/axiosInstance';
import { BusinessTimeUtil } from './utils/BusinessTimeUtil';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(restoreAuth());
    
    // Tải cấu hình giờ cắt ngày từ hệ thống
    axiosInstance.get('/api/system-configs/cutoff-time')
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

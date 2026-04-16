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
    
    // Tải cấu hình giờ cắt ngày và đồng bộ giờ server từ hệ thống
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://be-sm.codekhongngu.workers.dev';
    
    // 1. Đồng bộ giờ cắt ngày (Cutoff time)
    axios.get(`${baseURL}/api/system-configs/cutoff-time`)
      .then(res => {
        if (res.data && res.data.hour !== undefined) {
          BusinessTimeUtil.CUTOFF_HOUR = Number(res.data.hour);
        }
        if (res.data && res.data.hourManager !== undefined) {
          BusinessTimeUtil.CUTOFF_HOUR_MANAGER = Number(res.data.hourManager);
        }
      })
      .catch(e => console.error('Lỗi tải cấu hình time-shifting:', e));
      
    // 2. Đồng bộ thời gian thực tế với Server để tránh lỗi sai lệch ngày giờ
    const clientStartTime = Date.now();
    axios.get(`${baseURL}/health/db`)
      .then(res => {
        if (res.data && res.data.timestamp) {
          const clientEndTime = Date.now();
          const latency = (clientEndTime - clientStartTime) / 2; // Ước tính độ trễ mạng 1 chiều
          
          const serverTimeMs = new Date(res.data.timestamp).getTime();
          const clientCurrentTimeMs = Date.now();
          
          // Tính offset: (Giờ server + độ trễ mạng) - Giờ client hiện tại
          const offsetMs = (serverTimeMs + latency) - clientCurrentTimeMs;
          
          // Chỉ áp dụng offset nếu lệch quá 30 giây để tránh nhảy số không cần thiết
          if (Math.abs(offsetMs) > 30000) {
            BusinessTimeUtil.SERVER_TIME_OFFSET_MS = offsetMs;
            console.log(`Đã đồng bộ giờ Server. Độ lệch: ${Math.round(offsetMs / 1000)} giây.`);
          }
        }
      })
      .catch(e => console.error('Lỗi đồng bộ giờ Server:', e));
  }, [dispatch]);

  return <Router />;
}

export default App;

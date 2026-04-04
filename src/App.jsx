import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import Router from './routes/Router';
import { restoreAuth } from './store/auth/AuthSlice';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(restoreAuth());
  }, [dispatch]);

  return <Router />;
}

export default App;

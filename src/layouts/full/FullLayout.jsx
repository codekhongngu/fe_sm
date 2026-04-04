import { Outlet } from 'react-router-dom';
import Header from './vertical/header/Header';

const FullLayout = () => {
  return (
    <div className="shell">
      <div className="main-area">
        <Header />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default FullLayout;

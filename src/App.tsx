import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthView from '@/views/AuthView';
import DashboardView from '@/views/DashboardView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AuthView />} />
        <Route path="/dashboard/*" element={<DashboardView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

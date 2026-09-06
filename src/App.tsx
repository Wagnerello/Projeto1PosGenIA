import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthView from '@/views/AuthView';
import RegisterView from '@/views/RegisterView';
import DashboardView from '@/views/DashboardView';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) return <div>Carregando...</div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<AuthView />} />
          <Route path="/registro" element={<RegisterView />} />
          <Route 
            path="/dashboard/*" 
            element={
              <PrivateRoute>
                <DashboardView />
              </PrivateRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

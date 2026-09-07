import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const AuthView = lazy(() => import('@/views/AuthView'));
const RegisterView = lazy(() => import('@/views/RegisterView'));
const DashboardView = lazy(() => import('@/views/DashboardView'));

const RouteLoading = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-600 gap-3">
    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    <p className="text-sm font-medium">Carregando...</p>
  </div>
);

const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) return <RouteLoading />;
  if (!currentUser) return <Navigate to="/login" replace />;
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteLoading />}>
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
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

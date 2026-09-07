/* eslint-disable import-x/no-restricted-paths, complexity */ // FIXME: Dúvida técnica (Quarentena)
import { lazy, Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { isSuperAdminEmail } from '@/lib/auth-helpers';

const SuperAdminView = lazy(() => import('@/views/dashboards/SuperAdminView'));
const SindicaView = lazy(() => import('@/views/dashboards/SindicaView'));
const MoradorView = lazy(() => import('@/views/dashboards/MoradorView'));

const ViewLoader = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-600 gap-3">
    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    <p className="text-sm font-medium">Carregando painel...</p>
  </div>
);

export default function DashboardView() {
  const { appUser, currentUser, loading } = useAuth();

  const handleLogout = () => {
    signOut(auth);
  };

  // 1. Estado de carregamento do perfil
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-600 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium">Carregando perfil...</p>
      </div>
    );
  }

  // Validação de segurança prioritária e redundante para o Super Admin
  const isSuperAdmin =
    appUser?.role === 'superadmin' ||
    isSuperAdminEmail(currentUser?.email, import.meta.env.VITE_SUPERADMIN_EMAIL) ||
    isSuperAdminEmail(appUser?.email, import.meta.env.VITE_SUPERADMIN_EMAIL);

  // 2. Visão 1: SUPER ADMIN (SaaS Global)
  if (isSuperAdmin) {
    return (
      <Suspense fallback={<ViewLoader />}>
        <SuperAdminView />
      </Suspense>
    );
  }

  // 3. Visão 2: SÍNDICA (Gestão do Condomínio)
  if (appUser?.role === 'sindica') {
    return (
      <Suspense fallback={<ViewLoader />}>
        <SindicaView />
      </Suspense>
    );
  }

  // 4. Usuário com cadastro aguardando aprovação
  if (appUser?.role === 'pending' || appUser?.status === 'pendente') {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
        <Card className="max-w-md w-full text-center p-8 space-y-4 shadow-md bg-white border-slate-200">
          <div className="mx-auto w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-200 shadow-sm">
            <Clock className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Aguardando Validação</h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            Seu cadastro foi recebido com sucesso! A síndica do seu condomínio foi notificada e irá conferir sua unidade para liberar seu acesso.
          </p>
          <div className="pt-2">
            <Button variant="outline" className="w-full border-slate-300" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Sair da Conta
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 5. Usuário inativo ou rejeitado
  if (appUser?.role === 'rejected' || appUser?.status === 'inativo') {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
        <Card className="max-w-md w-full text-center p-8 space-y-4 shadow-md bg-white border-slate-200">
          <div className="mx-auto w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 border border-rose-200 shadow-sm">
            <Clock className="h-7 w-7 text-rose-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Acesso Suspenso</h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            Seu cadastro neste condomínio está inativo ou foi suspenso pela administração. Caso acredite que isto seja um engano, procure a síndica ou zeladoria do seu condomínio.
          </p>
          <div className="pt-2">
            <Button variant="outline" className="w-full border-slate-300" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Sair da Conta
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 6. Visão 3: MORADOR (Área do Morador Ativo)
  return (
    <Suspense fallback={<ViewLoader />}>
      <MoradorView />
    </Suspense>
  );
}

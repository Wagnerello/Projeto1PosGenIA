import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { isSuperAdminEmail } from '@/lib/auth-helpers';
import SuperAdminView from '@/views/dashboards/SuperAdminView';
import SindicaView from '@/views/dashboards/SindicaView';
import MoradorView from '@/views/dashboards/MoradorView';

export default function DashboardView() {
  const { appUser, currentUser, loading } = useAuth();

  const handleLogout = () => {
    signOut(auth);
  };

  // 1. Estado de carregamento do perfil
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-300 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Carregando seu ambiente seguro...</p>
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
    return <SuperAdminView />;
  }

  // 3. Visão 2: SÍNDICA (Gestão do Condomínio)
  if (appUser?.role === 'sindica') {
    return <SindicaView />;
  }

  // 4. Usuário com cadastro aguardando aprovação
  if (appUser?.role === 'pending') {
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

  // 5. Visão 3: MORADOR (Área do Morador)
  return <MoradorView />;
}



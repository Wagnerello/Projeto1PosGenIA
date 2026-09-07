// @ts-nocheck
import { SuperAdminCondominiosTab } from '@/components/dashboard/tabs/SuperAdminCondominiosTab';
import { SuperAdminNovoTab } from '@/components/dashboard/tabs/SuperAdminNovoTab';
/* eslint-disable quality/max-lines, @typescript-eslint/no-unused-vars, import-x/no-restricted-paths, max-lines-per-function, max-statements, complexity, @typescript-eslint/no-explicit-any, quality/no-direct-console */ // FIXME: D�vida t�cnica (Quarentena)
import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { QRCodeSVG } from 'qrcode.react';
import {
  Building2,
  UserCog,
  ShieldCheck,
  KeyRound,
  LogOut,
  Copy,
  Check,
  CheckCircle2,
  Search,
  Plus,
  RefreshCw,
  X,
  ArrowLeft,
  Mail,
  Users,
  Menu
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { getCondominios, createCondominio, createSindicaUser } from '@/lib/firestore';

type CreatedCondo = {
  id: string;
  nome: string;
  sindicaEmail: string;
  sindicaNome: string;
  sindicaSenha?: string;
  sindicaCriadaDireto: boolean;
  codigoConviteSindica: string;
  codigoConviteMorador: string;
};

export default function SuperAdminView() {
  const { appUser } = useAuth();
  const [condominios, setCondominios] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'condominios' | 'novo'>('condominios');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Formulário
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [sindicaEmail, setSindicaEmail] = useState('');
  const [sindicaNome, setSindicaNome] = useState('');
  const [sindicaSenha, setSindicaSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastCreated, setLastCreated] = useState<CreatedCondo | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadCondominios = async () => {
    setLoadingList(true);
    try {
      const data = await getCondominios();
      setCondominios(data);
    } catch (e) {
      console.error('Erro ao carregar condomínios:', e);
      showToast('Falha ao carregar a lista de condomínios.', 'error');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadCondominios();
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  const handleCreateCondominio = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLastCreated(null);

    try {
      const created = await createCondominio({
        nome: nome.trim(),
        cnpj: cnpj.trim(),
        sindicaEmail: sindicaEmail.trim(),
        sindicaNome: sindicaNome.trim(),
      });

      let sindicaCriada = false;

      if (sindicaSenha.trim().length >= 6) {
        try {
          await createSindicaUser({
            email: sindicaEmail.trim(),
            password: sindicaSenha.trim(),
            nome: sindicaNome.trim(),
            condominioId: created.id,
          });
          sindicaCriada = true;
        } catch (authErr: any) {
          console.error('Erro ao criar login da síndica:', authErr);
          if (authErr?.code === 'auth/email-already-in-use') {
            setError('Condomínio criado, mas o e-mail informado já está em uso.');
          } else {
            setError(`Condomínio criado, mas houve falha ao gerar login da síndica: ${authErr?.message || 'senha inválida'}`);
          }
        }
      }

      setLastCreated({
        id: created.id,
        nome: created.nome,
        sindicaEmail: created.sindicaEmail,
        sindicaNome: created.sindicaNome,
        sindicaSenha: sindicaCriada ? sindicaSenha.trim() : undefined,
        sindicaCriadaDireto: sindicaCriada,
        codigoConviteSindica: created.codigoConviteSindica,
        codigoConviteMorador: created.codigoConviteMorador,
      });

      setNome('');
      setCnpj('');
      setSindicaEmail('');
      setSindicaNome('');
      setSindicaSenha('');
      await loadCondominios();
      showToast('Condomínio cadastrado com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      setError('Erro ao criar condomínio. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string, successMsg?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      showToast(successMsg || 'Copiado para a área de transferência!', 'success');
    } catch (e) {
      console.error('Falha ao copiar', e);
      showToast('Não foi possível copiar o texto.', 'error');
    }
  };

  const filteredCondos = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return condominios;
    return condominios.filter((c) =>
      c.nome?.toLowerCase().includes(term) ||
      c.cnpj?.toLowerCase().includes(term) ||
      c.sindicaNome?.toLowerCase().includes(term) ||
      c.sindicaEmail?.toLowerCase().includes(term) ||
      c.codigoConviteMorador?.toLowerCase().includes(term)
    );
  }, [condominios, searchTerm]);

  const stats = useMemo(() => {
    const total = condominios.length;
    const ativos = condominios.filter((c) => c.sindicaUid).length;
    const pendentes = total - ativos;
    return { total, ativos, pendentes };
  }, [condominios]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Toast flutuante */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-medium flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-700'
                : toast.type === 'error'
                ? 'bg-rose-600 text-white border-rose-700'
                : 'bg-slate-800 text-white border-slate-900'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0" />}
            {toast.type === 'error' && <X className="h-4 w-4 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Drawer Móvel de Navegação do Super Admin */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl z-10 flex flex-col p-5 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Super Admin</h3>
                  <p className="text-[11px] text-slate-500">Gestão Global</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 py-4 space-y-1.5 overflow-y-auto">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
                Navegação
              </p>
              <button
                onClick={() => {
                  setActiveTab('condominios');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-colors min-h-[48px] cursor-pointer ${
                  activeTab === 'condominios'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span>Condomínios Registrados</span>
                </div>
                <span className="bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {condominios.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('novo');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-colors min-h-[48px] cursor-pointer ${
                  activeTab === 'novo'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Plus className="h-4 w-4 shrink-0" />
                  <span>Novo Condomínio</span>
                </div>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              <div className="px-1">
                <p className="text-xs font-medium text-slate-800 truncate">{appUser?.email}</p>
                <p className="text-[10px] text-indigo-600 font-semibold">Super Administrador</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 h-10 text-xs min-h-[44px]"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sair da conta
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar do Super Admin */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Abrir menu de navegação"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight truncate">
                  Gestão Global
                </span>
                <span className="hidden sm:inline-flex text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full">
                  Super Admin
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-xs font-medium text-slate-700 truncate max-w-[200px]">
                {appUser?.email || 'Administrador'}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-slate-300 text-slate-700 h-9 text-xs cursor-pointer hover:bg-slate-50"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 md:p-8 space-y-6 flex-1">
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full space-y-5">
          {/* Barra Contextual Móvel (Exibe módulo ativo e aciona o Drawer) */}
          <div className="flex md:hidden items-center justify-between bg-white px-3 py-2.5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Módulo:</span>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                {activeTab === 'condominios' ? 'Condomínios Registrados' : 'Novo Condomínio'}
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-indigo-50 cursor-pointer min-h-[40px]"
            >
              <Menu className="h-3.5 w-3.5" />
              <span>Navegação</span>
            </button>
          </div>

          {/* Navegação por Abas Limpa (Desktop) */}
          <div className="hidden md:flex items-center justify-between gap-3">
            <TabsList className="bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 flex items-center gap-1 h-auto w-fit">
              <TabsTrigger
                value="condominios"
                className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xs px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all text-slate-600 hover:text-slate-900"
              >
                <Building2 className="h-4 w-4" />
                Condomínios Registrados
                <span className="bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                  {condominios.length}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="novo"
                className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xs px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all text-slate-600 hover:text-slate-900"
              >
                <Plus className="h-4 w-4" />
                Novo Condomínio
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ABA 1: CONDOMÍNIOS REGISTRADOS */}
          <SuperAdminCondominiosTab
            condominios={condominios}
            filteredCondos={filteredCondos}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            stats={stats}
            loadingList={loadingList}
            loadCondominios={loadCondominios}
            setActiveTab={setActiveTab}
            setLastCreated={setLastCreated}
            copyToClipboard={copyToClipboard}
            copiedField={copiedField}
          />

          {/* ABA 2: NOVO CONDOMÍNIO */}
          <SuperAdminNovoTab
            nome={nome}
            setNome={setNome}
            cnpj={cnpj}
            setCnpj={setCnpj}
            sindicaNome={sindicaNome}
            setSindicaNome={setSindicaNome}
            sindicaEmail={sindicaEmail}
            setSindicaEmail={setSindicaEmail}
            sindicaSenha={sindicaSenha}
            setSindicaSenha={setSindicaSenha}
            error={error}
            loading={loading}
            handleCreateCondominio={handleCreateCondominio}
            setActiveTab={setActiveTab}
            lastCreated={lastCreated}
            setLastCreated={setLastCreated}
            copyToClipboard={copyToClipboard}
            copiedField={copiedField}
          />
        </Tabs>
      </main>
    </div>
  );
}

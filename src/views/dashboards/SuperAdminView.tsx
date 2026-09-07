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
  Users
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

      {/* Top Navbar do Super Admin */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
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
          {/* Navegação por Abas Limpa */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

            {activeTab === 'condominios' && (
              <Button
                size="sm"
                onClick={() => {
                  setLastCreated(null);
                  setActiveTab('novo');
                }}
                className="h-9 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Cadastrar Condomínio
              </Button>
            )}
          </div>

          {/* ABA 1: CONDOMÍNIOS REGISTRADOS */}
          <TabsContent value="condominios" className="mt-0 space-y-5">
            {/* 3 Indicadores Macro */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Total de Condomínios</span>
                  <Building2 className="h-4 w-4 text-indigo-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.total}</p>
                <p className="text-[11px] text-slate-500">Bases ativas na plataforma</p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Síndicos(as) Ativos</span>
                  <UserCog className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.ativos}</p>
                <p className="text-[11px] text-slate-500">Contas com acesso configurado</p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Acessos Pendentes</span>
                  <KeyRound className="h-4 w-4 text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.pendentes}</p>
                <p className="text-[11px] text-slate-500">Aguardando ativação por convite</p>
              </div>
            </div>

            {/* Card Principal com Tabela e Filtro */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-white rounded-t-xl border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                      Bases de Condomínios
                    </CardTitle>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {filteredCondos.length} de {condominios.length} condomínio(s)
                    </span>
                  </div>
                  <CardDescription className="text-xs text-slate-500 mt-1">
                    Visualize o status de ativação, síndicos responsáveis e códigos de convite.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadCondominios}
                    className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer h-9"
                    title="Atualizar lista"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loadingList ? 'animate-spin text-indigo-600' : ''}`} />
                    Atualizar
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 bg-white rounded-b-xl space-y-4">
                {/* Barra de Busca */}
                <div className="relative max-w-md w-full">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Buscar por condomínio, síndico, e-mail ou código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-8 text-sm h-10 border-slate-200 rounded-xl"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                      title="Limpar busca"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Tabela de Condomínios */}
                {loadingList ? (
                  <div className="py-16 text-center text-slate-400 space-y-2">
                    <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 mx-auto" />
                    <p className="text-xs font-medium text-slate-600">Carregando condomínios...</p>
                  </div>
                ) : filteredCondos.length === 0 ? (
                  <div className="py-14 text-center text-slate-400 space-y-3">
                    <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700 text-sm">
                        {condominios.length === 0
                          ? 'Nenhum condomínio cadastrado ainda'
                          : 'Nenhum resultado para a busca'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {condominios.length === 0
                          ? 'Cadastre a primeira base de condomínio para liberar acessos.'
                          : 'Tente buscar com outros termos ou limpe o campo de busca.'}
                      </p>
                    </div>
                    {condominios.length === 0 ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          setLastCreated(null);
                          setActiveTab('novo');
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 px-3 rounded-lg cursor-pointer mt-1"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Cadastrar Primeiro Condomínio
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSearchTerm('')}
                        className="text-xs h-8 px-3 rounded-lg cursor-pointer"
                      >
                        Limpar Busca
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow className="border-slate-100">
                          <TableHead className="font-semibold text-slate-700 text-xs">Condomínio</TableHead>
                          <TableHead className="font-semibold text-slate-700 text-xs">Síndico(a) Responsável</TableHead>
                          <TableHead className="font-semibold text-slate-700 text-xs">Status Síndica</TableHead>
                          <TableHead className="font-semibold text-slate-700 text-xs">Código Moradores</TableHead>
                          <TableHead className="font-semibold text-slate-700 text-xs text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCondos.map((c) => {
                          const moradorLink = `${window.location.origin}/registro?condoId=${c.id}&invite=${c.codigoConviteMorador}&role=morador`;
                          const hasSindicaUid = Boolean(c.sindicaUid);

                          return (
                            <TableRow key={c.id} className="hover:bg-slate-50/70 border-slate-100">
                              {/* Nome e CNPJ */}
                              <TableCell>
                                <div>
                                  <p className="font-semibold text-slate-900 text-sm">{c.nome}</p>
                                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                                    {c.cnpj ? `CNPJ: ${c.cnpj}` : 'Sem CNPJ'}
                                  </p>
                                </div>
                              </TableCell>

                              {/* Síndica */}
                              <TableCell>
                                <div className="text-sm font-medium text-slate-800">
                                  {c.sindicaNome || 'Não informado'}
                                </div>
                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Mail className="h-3 w-3 text-slate-400" />
                                  <span>{c.sindicaEmail || '—'}</span>
                                </div>
                              </TableCell>

                              {/* Status Síndica */}
                              <TableCell>
                                {hasSindicaUid ? (
                                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs font-medium">
                                    <Check className="h-3 w-3 mr-1" /> Ativa
                                  </Badge>
                                ) : (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-xs font-medium">
                                      Convite: {c.codigoConviteSindica}
                                    </Badge>
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(c.codigoConviteSindica, `sind-code-${c.id}`, 'Código de convite copiado!')}
                                      className="text-slate-400 hover:text-indigo-600 p-1 rounded cursor-pointer"
                                      title="Copiar código de convite da síndica"
                                      aria-label="Copiar código de convite da síndica"
                                    >
                                      {copiedField === `sind-code-${c.id}` ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                )}
                              </TableCell>

                              {/* Código Moradores */}
                              <TableCell>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800">
                                  <span>{c.codigoConviteMorador || '—'}</span>
                                  {c.codigoConviteMorador && (
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(c.codigoConviteMorador, `morador-code-${c.id}`, 'Código de moradores copiado!')}
                                      className="text-slate-400 hover:text-indigo-600 p-0.5 rounded cursor-pointer ml-1"
                                      title="Copiar código do mural"
                                      aria-label="Copiar código do mural"
                                    >
                                      {copiedField === `morador-code-${c.id}` ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </TableCell>

                              {/* Ações */}
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(moradorLink, `morador-link-${c.id}`, 'Link de cadastro de moradores copiado!')}
                                  className="h-8 px-2.5 text-xs text-slate-600 hover:text-indigo-600 cursor-pointer"
                                  title="Copiar link de convite dos moradores"
                                >
                                  {copiedField === `morador-link-${c.id}` ? (
                                    <><Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Copiado</>
                                  ) : (
                                    <><Copy className="h-3.5 w-3.5 mr-1" /> Link Morador</>
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 2: NOVO CONDOMÍNIO */}
          <TabsContent value="novo" className="mt-0">
            {lastCreated ? (
              /* Tela de Conclusão / Credenciais Geradas */
              <Card className="border-0 shadow-sm">
                <CardHeader className="bg-emerald-50/70 border-b border-emerald-100 rounded-t-xl p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg font-bold text-emerald-950">
                          Condomínio "{lastCreated.nome}" cadastrado com sucesso!
                        </CardTitle>
                        <CardDescription className="text-xs text-emerald-800 mt-0.5">
                          As credenciais de acesso da administração e os links de convite foram gerados.
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLastCreated(null)}
                        className="text-xs border-emerald-300 text-emerald-900 hover:bg-emerald-100/60 h-8 rounded-lg cursor-pointer"
                      >
                        Cadastrar Outro
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setLastCreated(null);
                          setActiveTab('condominios');
                        }}
                        className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold h-8 rounded-lg cursor-pointer"
                      >
                        Ver Lista
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 bg-white rounded-b-xl">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Bloco Síndica */}
                    <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                      <div className="flex items-center gap-2">
                        <UserCog className="h-5 w-5 text-indigo-600" />
                        <h4 className="font-bold text-slate-900 text-sm">Credenciais da Síndica</h4>
                      </div>

                      {lastCreated.sindicaCriadaDireto ? (
                        <div className="space-y-2 text-xs bg-white p-4 rounded-xl border border-slate-200">
                          <div>
                            <span className="text-slate-400">Nome:</span>{' '}
                            <strong className="text-slate-800">{lastCreated.sindicaNome}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">E-mail:</span>{' '}
                            <strong className="text-slate-800 font-mono">{lastCreated.sindicaEmail}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Senha Inicial:</span>{' '}
                            <strong className="text-indigo-700 font-mono text-sm">{lastCreated.sindicaSenha}</strong>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-600 bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                          <p className="font-semibold text-slate-800">Código de Convite da Síndica:</p>
                          <p className="font-mono text-sm font-bold text-indigo-700">{lastCreated.codigoConviteSindica}</p>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-9 rounded-xl border-slate-300 text-slate-700 hover:bg-white cursor-pointer"
                        onClick={() =>
                          copyToClipboard(
                            `Acesso da Administração - ${lastCreated.nome}\nLogin: ${lastCreated.sindicaEmail}\nSenha: ${lastCreated.sindicaSenha || 'Defina pelo convite'}\nLink: ${window.location.origin}/login`,
                            'cred',
                            'Dados de login copiados!'
                          )
                        }
                      >
                        {copiedField === 'cred' ? (
                          <><Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> Credenciais Copiadas!</>
                        ) : (
                          <><Copy className="mr-1.5 h-3.5 w-3.5 text-slate-500" /> Copiar Dados de Acesso da Síndica</>
                        )}
                      </Button>
                    </div>

                    {/* Bloco Moradores */}
                    <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col items-center text-center space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-indigo-600" />
                        <h4 className="font-bold text-slate-900 text-sm">QR Code dos Moradores</h4>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                        <QRCodeSVG
                          value={`${window.location.origin}/registro?condoId=${lastCreated.id}&invite=${lastCreated.codigoConviteMorador}&role=morador`}
                          size={140}
                        />
                      </div>

                      <div className="font-mono text-xs bg-white px-3 py-1.5 rounded-lg text-slate-800 border border-slate-200">
                        Código do Mural: <strong>{lastCreated.codigoConviteMorador}</strong>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-9 rounded-xl border-slate-300 text-slate-700 hover:bg-white cursor-pointer"
                        onClick={() =>
                          copyToClipboard(
                            `${window.location.origin}/registro?condoId=${lastCreated.id}&invite=${lastCreated.codigoConviteMorador}&role=morador`,
                            'morador-new',
                            'Link de cadastro copiado!'
                          )
                        }
                      >
                        {copiedField === 'morador-new' ? (
                          <><Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> Link Copiado!</>
                        ) : (
                          <><Copy className="mr-1.5 h-3.5 w-3.5 text-slate-500" /> Copiar Link de Cadastro de Moradores</>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Formulário de Cadastro Limpo */
              <Card className="border-0 shadow-sm max-w-3xl mx-auto">
                <CardHeader className="bg-white rounded-t-xl border-b border-slate-100 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-indigo-600" /> Cadastrar Novo Condomínio
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-1">
                        Cadastre os dados do condomínio e defina as credenciais para acesso da síndica.
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('condominios')}
                      className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer h-8"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Voltar à lista
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-6 bg-white rounded-b-xl">
                  <form onSubmit={handleCreateCondominio} className="space-y-6">
                    {error && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                        {error}
                      </div>
                    )}

                    {/* Seção 1: Dados do Condomínio */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        1. Dados do Condomínio
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label htmlFor="nome" className="text-xs font-medium text-slate-700">
                            Nome do Condomínio *
                          </Label>
                          <Input
                            id="nome"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                            placeholder="Ex: Residencial Mirante da Serra"
                            className="text-sm h-10 border-slate-200 rounded-xl"
                          />
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                          <Label htmlFor="cnpj" className="text-xs font-medium text-slate-700">
                            CNPJ (Opcional)
                          </Label>
                          <Input
                            id="cnpj"
                            value={cnpj}
                            onChange={(e) => setCnpj(e.target.value)}
                            placeholder="00.000.000/0001-00"
                            className="text-sm h-10 border-slate-200 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Seção 2: Acesso da Síndica */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        2. Acesso do(a) Síndico(a) Responsável
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="sindicaNome" className="text-xs font-medium text-slate-700">
                            Nome Completo *
                          </Label>
                          <Input
                            id="sindicaNome"
                            value={sindicaNome}
                            onChange={(e) => setSindicaNome(e.target.value)}
                            required
                            placeholder="Ex: Dra. Mariana Costa"
                            className="text-sm h-10 border-slate-200 rounded-xl"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="sindicaEmail" className="text-xs font-medium text-slate-700">
                            E-mail de Acesso *
                          </Label>
                          <Input
                            id="sindicaEmail"
                            type="email"
                            value={sindicaEmail}
                            onChange={(e) => setSindicaEmail(e.target.value)}
                            required
                            placeholder="sindica@condominio.com"
                            className="text-sm h-10 border-slate-200 rounded-xl"
                          />
                        </div>

                        {/* Senha Inicial */}
                        <div className="space-y-2 sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="sindicaSenha" className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                              <KeyRound className="h-3.5 w-3.5 text-indigo-600" /> Senha Inicial de Acesso
                            </Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 h-7 px-2 cursor-pointer font-medium"
                              onClick={() => setSindicaSenha('Sindica@' + Math.floor(1000 + Math.random() * 9000))}
                            >
                              Gerar Senha Automática
                            </Button>
                          </div>
                          <Input
                            id="sindicaSenha"
                            type="text"
                            value={sindicaSenha}
                            onChange={(e) => setSindicaSenha(e.target.value)}
                            placeholder="Mínimo 6 caracteres (ex: Sindica@1234)"
                            className="bg-white border-slate-200 text-sm h-10 rounded-xl font-mono"
                          />
                          <p className="text-[11px] text-slate-500">
                            Ao definir a senha, a conta de síndica é criada e ativada imediatamente.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setActiveTab('condominios')}
                        className="text-xs text-slate-600 hover:text-slate-900 cursor-pointer h-10 px-4"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-10 px-6 rounded-xl shadow-xs cursor-pointer"
                      >
                        {loading ? 'Cadastrando...' : 'Cadastrar Condomínio'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

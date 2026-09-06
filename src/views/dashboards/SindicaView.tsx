import { useState, useEffect } from 'react';
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
  Users,
  UserCheck,
  UserX,
  Clock,
  Layers,
  Megaphone,
  FileText,
  AlertTriangle,
  CheckCircle2,
  LogOut,
  RefreshCw,
  Copy,
  Check,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import {
  getUnidades,
  createUnidadesEmLote,
  getCondominio,
  getPendingUsers,
  getActiveUsers,
  approveUser,
  rejectUser,
  getOcorrencias,
  updateOcorrenciaStatus,
  rotateInviteCode
} from '@/lib/firestore';

export default function SindicaView() {
  const { appUser } = useAuth();
  const [condo, setCondo] = useState<any>(null);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Wizard de infraestrutura
  const [torres, setTorres] = useState('1');
  const [andares, setAndares] = useState('10');
  const [aptosPorAndar, setAptosPorAndar] = useState('4');
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    if (appUser?.condominioId) {
      loadAllData();
    } else {
      setLoading(false);
    }
  }, [appUser]);

  const loadAllData = async () => {
    if (!appUser?.condominioId) return;
    setLoading(true);
    try {
      const [c, u, p, a, oc] = await Promise.all([
        getCondominio(appUser.condominioId),
        getUnidades(appUser.condominioId),
        getPendingUsers(appUser.condominioId),
        getActiveUsers(appUser.condominioId),
        getOcorrencias(appUser.condominioId, 'sindica'),
      ]);
      setCondo(c);
      setUnidades(u);
      setPendingUsers(p);
      setActiveUsers(a);
      setOcorrencias(oc);
    } catch (e) {
      console.error('Erro ao carregar dados da síndica:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const handleApprove = async (uid: string) => {
    setActionLoading(uid);
    try {
      await approveUser(uid);
      await loadAllData();
    } catch (e) {
      console.error(e);
      alert('Erro ao aprovar morador.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (uid: string) => {
    if (!confirm('Deseja realmente recusar o acesso deste morador?')) return;
    setActionLoading(uid);
    try {
      await rejectUser(uid);
      await loadAllData();
    } catch (e) {
      console.error(e);
      alert('Erro ao recusar morador.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (ocorrenciaId: string, newStatus: string) => {
    try {
      await updateOcorrenciaStatus(ocorrenciaId, newStatus);
      await loadAllData();
    } catch (e) {
      console.error(e);
      alert('Erro ao alterar status da ocorrência.');
    }
  };

  const handleGerarMapa = async (e: React.FormEvent) => {
    e.preventDefault();
    setGerando(true);
    try {
      const numTorres = parseInt(torres);
      const numAndares = parseInt(andares);
      const numAptos = parseInt(aptosPorAndar);

      const novasUnidades = [];
      for (let t = 1; t <= numTorres; t++) {
        const letraTorre = String.fromCharCode(64 + t);
        for (let a = 1; a <= numAndares; a++) {
          for (let ap = 1; ap <= numAptos; ap++) {
            const numero = `${a}${ap < 10 ? '0' + ap : ap}`;
            novasUnidades.push({
              torre: numTorres > 1 ? `Bloco ${letraTorre}` : 'Única',
              andar: a,
              numero: numero,
            });
          }
        }
      }

      await createUnidadesEmLote(appUser!.condominioId!, novasUnidades);
      await loadAllData();
    } catch (err) {
      console.error(err);
      alert('Falha ao gerar mapa predial.');
    } finally {
      setGerando(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      console.error('Falha ao copiar', e);
    }
  };

  const handleRotateCode = async () => {
    if (!confirm('Tem certeza? O QR Code antigo deixará de funcionar imediatamente.')) return;
    try {
      await rotateInviteCode(appUser!.condominioId!, 'morador');
      await loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const moradorLink = condo
    ? `${window.location.origin}/registro?condoId=${condo.id}&invite=${condo.codigoConviteMorador}&role=morador`
    : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-500">
        <RefreshCw className="h-6 w-6 animate-spin mr-2 text-indigo-600" />
        Carregando gestão do condomínio...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header exclusivo da Síndica */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">
                  {condo?.nome || 'Gestão do Condomínio'}
                </span>
                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200 text-xs">
                  SÍNDICA
                </Badge>
              </div>
              <p className="text-xs text-slate-500">Painel administrativo operacional do condomínio</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400">Responsável</p>
              <p className="text-sm font-semibold text-slate-700">{appUser?.nome || 'Síndica'}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="border-slate-300">
              <LogOut className="h-4 w-4 mr-1.5" /> Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto w-full p-6 md:p-8 space-y-6 flex-1">
        {/* Cards de Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Unidades Mapeadas</p>
                <p className="text-2xl font-bold text-slate-800 mt-0.5">{unidades.length}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Layers className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Moradores Ativos</p>
                <p className="text-2xl font-bold text-slate-800 mt-0.5">{activeUsers.length}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Aguardando Aprovação</p>
                <p className="text-2xl font-bold text-rose-600 mt-0.5">{pendingUsers.length}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Ocorrências Totais</p>
                <p className="text-2xl font-bold text-amber-600 mt-0.5">{ocorrencias.length}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wizard para primeiro mapeamento se não houver unidades */}
        {unidades.length === 0 ? (
          <Card className="border-indigo-100 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl text-indigo-950 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-600" /> Configuração Inicial da Estrutura Predial
              </CardTitle>
              <CardDescription>
                Seu condomínio ainda não possui apartamentos gerados. Preencha os dados abaixo para criar automaticamente as unidades.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGerarMapa} className="space-y-4 max-w-lg">
                <div className="space-y-1.5">
                  <Label>Quantidade de Torres / Blocos</Label>
                  <Input type="number" min="1" value={torres} onChange={(e) => setTorres(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Andares por Torre</Label>
                  <Input type="number" min="1" value={andares} onChange={(e) => setAndares(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Apartamentos por Andar</Label>
                  <Input type="number" min="1" value={aptosPorAndar} onChange={(e) => setAptosPorAndar(e.target.value)} required />
                </div>
                <Button type="submit" disabled={gerando} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {gerando ? 'Gerando mapa predial...' : 'Gerar Estrutura Predial'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* Abas de Operação da Síndica */
          <Tabs defaultValue={pendingUsers.length > 0 ? 'aprovacoes' : 'ocorrencias'} className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl bg-slate-200/80 p-1 rounded-xl">
              <TabsTrigger value="aprovacoes" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 relative">
                <UserCheck className="mr-1.5 h-4 w-4" />
                Aprovações
                {pendingUsers.length > 0 && (
                  <span className="ml-1.5 bg-rose-500 text-white rounded-full text-xs px-1.5 py-0.2 font-semibold">
                    {pendingUsers.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="ocorrencias" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700">
                <FileText className="mr-1.5 h-4 w-4" />
                Ocorrências
              </TabsTrigger>
              <TabsTrigger value="qrcode" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700">
                <Megaphone className="mr-1.5 h-4 w-4" />
                QR Code Convite
              </TabsTrigger>
              <TabsTrigger value="moradores" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700">
                <Users className="mr-1.5 h-4 w-4" />
                Moradores ({activeUsers.length})
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Fila de Aprovações */}
            <TabsContent value="aprovacoes" className="mt-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="bg-white rounded-t-xl border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">Fila de Liberação de Acesso</CardTitle>
                    <CardDescription>
                      Moradores que solicitaram acesso e aguardam confirmação de unidade pela administração.
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={loadAllData}>
                    <RefreshCw className="h-4 w-4 text-slate-500" />
                  </Button>
                </CardHeader>
                <CardContent className="p-0 bg-white rounded-b-xl">
                  {pendingUsers.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 space-y-2">
                      <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                      <p className="font-semibold text-slate-700">Tudo liberado!</p>
                      <p className="text-sm">Não há nenhum morador pendente de aprovação.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Apartamento Requisitado</TableHead>
                          <TableHead className="text-right">Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingUsers.map((u) => (
                          <TableRow key={u.id} className="hover:bg-slate-50/60">
                            <TableCell className="font-semibold text-slate-800">{u.nome || 'Não informado'}</TableCell>
                            <TableCell className="text-slate-600 text-sm">{u.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-indigo-50 border-indigo-200 text-indigo-700 font-medium">
                                {u.unidadeNome || `Unidade ${u.unidadeId || 'N/A'}`}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={actionLoading === u.id}
                                onClick={() => handleApprove(u.id)}
                              >
                                <UserCheck className="h-3.5 w-3.5 mr-1" />
                                {actionLoading === u.id ? 'Aprovando...' : 'Aprovar'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-rose-600 border-rose-200 hover:bg-rose-50"
                                disabled={actionLoading === u.id}
                                onClick={() => handleReject(u.id)}
                              >
                                <UserX className="h-3.5 w-3.5 mr-1" />
                                Recusar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: Ocorrências do Condomínio */}
            <TabsContent value="ocorrencias" className="mt-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="bg-white rounded-t-xl border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">Livro de Ocorrências do Condomínio</CardTitle>
                    <CardDescription>
                      Visão geral de todos os chamados registrados por moradores de todas as unidades.
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={loadAllData}>
                    <RefreshCw className="h-4 w-4 text-slate-500" />
                  </Button>
                </CardHeader>
                <CardContent className="p-0 bg-white rounded-b-xl">
                  {ocorrencias.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 space-y-2">
                      <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                      <p className="font-semibold text-slate-700">Nenhuma ocorrência em aberto</p>
                      <p className="text-sm">O condomínio está com todas as pendências resolvidas.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead>Título / Descrição</TableHead>
                          <TableHead>Unidade / Morador</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Gravidade</TableHead>
                          <TableHead className="text-right">Alterar Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ocorrencias.map((oc) => (
                          <TableRow key={oc.id} className="hover:bg-slate-50/60">
                            <TableCell className="font-medium text-slate-800 max-w-xs">
                              <div className="font-semibold text-slate-900">{oc.titulo}</div>
                              {oc.descricao && (
                                <div className="text-xs text-slate-500 font-normal mt-0.5 line-clamp-2">{oc.descricao}</div>
                              )}
                              {oc.iaJustificativa && (
                                <div className="text-[11px] text-indigo-700 bg-indigo-50/90 px-2 py-0.5 rounded mt-1.5 inline-flex items-center gap-1 border border-indigo-200">
                                  <Sparkles className="h-3 w-3 text-indigo-500 shrink-0" />
                                  <span className="font-medium">IA: {oc.iaJustificativa}</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                              <span className="font-semibold text-slate-700">{oc.unidadeNome || 'Geral'}</span>
                              {oc.autorNome && <span className="block text-xs text-slate-400">{oc.autorNome}</span>}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-xs font-medium">
                                {oc.categoria || 'Geral'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {oc.urgencia === 'Alta' && (
                                <Badge variant="destructive" className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200 text-xs font-semibold">
                                  <AlertTriangle className="mr-1 h-3 w-3" /> Alta
                                </Badge>
                              )}
                              {oc.urgencia === 'Média' && (
                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 text-xs font-medium">
                                  Média
                                </Badge>
                              )}
                              {oc.urgencia === 'Baixa' && (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 text-xs font-medium">
                                  Baixa
                                </Badge>
                              )}
                              {!oc.urgencia && (
                                <Badge variant="outline" className="text-slate-400 text-xs">
                                  Não avaliado
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <select
                                className="text-xs border rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-700 shadow-sm cursor-pointer"
                                value={oc.status || 'Pendente'}
                                onChange={(e) => handleStatusChange(oc.id, e.target.value)}
                              >
                                <option value="Pendente">Pendente</option>
                                <option value="Em Análise">Em Análise</option>
                                <option value="Resolvido">Resolvido</option>
                              </select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 3: QR Code de Convite */}
            <TabsContent value="qrcode" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Acesso dos Moradores via QR Code</CardTitle>
                    <CardDescription>
                      Para afixar nos murais, portaria, elevadores ou compartilhar no grupo oficial do condomínio.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-slate-600">
                    <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                      <p className="font-semibold text-indigo-900">Privacidade & Conformidade LGPD:</p>
                      <p className="text-xs text-indigo-700 leading-relaxed">
                        Os moradores não precisam fornecer CPF nem dados sensíveis. Ao escanear o QR Code, eles apenas informam Nome, E-mail, Senha e selecionam o Apartamento. A liberação só ocorre após o seu clique na aba <strong>Aprovações</strong>.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Bloco QR */}
                <Card className="flex flex-col items-center text-center p-4 shadow-sm">
                  <CardHeader className="p-2 pb-3">
                    <CardTitle className="text-base flex items-center gap-1.5">
                      <Megaphone className="h-4 w-4 text-indigo-600" /> QR Code Moradores
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center space-y-3 w-full p-0">
                    <div className="bg-white p-3 rounded-xl border shadow-sm">
                      <QRCodeSVG value={moradorLink} size={150} />
                    </div>
                    <div className="font-mono text-xs bg-slate-100 px-3 py-1 rounded text-slate-700">
                      Código Mural: <strong>{condo?.codigoConviteMorador}</strong>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => copyToClipboard(moradorLink, 'morador')}
                    >
                      {copiedField === 'morador' ? (
                        <><Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> Link Copiado!</>
                      ) : (
                        <><Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar Link de Convite</>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-slate-500 hover:text-rose-600"
                      onClick={handleRotateCode}
                    >
                      <RefreshCw className="mr-1.5 h-3 w-3" /> Gerar novo código
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab 4: Moradores Ativos */}
            <TabsContent value="moradores" className="mt-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="bg-white rounded-t-xl border-b border-slate-100">
                  <CardTitle className="text-lg font-bold text-slate-800">Moradores com Acesso Liberado</CardTitle>
                </CardHeader>
                <CardContent className="p-0 bg-white rounded-b-xl">
                  {activeUsers.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">Nenhum morador ativo cadastrado ainda.</div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Apartamento</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeUsers.map((u) => (
                          <TableRow key={u.id} className="hover:bg-slate-50/60">
                            <TableCell className="font-semibold text-slate-800">{u.nome || 'Não informado'}</TableCell>
                            <TableCell className="text-slate-600 text-sm">{u.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700">
                                {u.unidadeNome || `Unidade ${u.unidadeId || 'N/A'}`}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                                Ativo
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

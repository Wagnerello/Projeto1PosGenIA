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
  getUnidades,
  createUnidadesEmLote,
  getCondominio,
  rotateInviteCode,
  getPendingUsers,
  getActiveUsers,
  approveUser,
  rejectUser
} from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import {
  Copy,
  Check,
  RefreshCw,
  Building2,
  Megaphone,
  UserCheck,
  UserX,
  Users,
  Clock,
  CheckCircle2,
  Layers
} from 'lucide-react';

type CondoInfo = {
  id: string;
  nome: string;
  codigoConviteMorador: string;
  codigoConviteSindica: string;
};

export default function SindicaPanel() {
  const { appUser } = useAuth();
  const [unidades, setUnidades] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [condo, setCondo] = useState<CondoInfo | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // States para o Wizard de Infraestrutura
  const [torres, setTorres] = useState('1');
  const [andares, setAndares] = useState('10');
  const [aptosPorAndar, setAptosPorAndar] = useState('4');
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    if (appUser?.condominioId) {
      loadAll();
    }
  }, [appUser]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [u, c, p, a] = await Promise.all([
        getUnidades(appUser!.condominioId!),
        getCondominio(appUser!.condominioId!),
        getPendingUsers(appUser!.condominioId!),
        getActiveUsers(appUser!.condominioId!),
      ]);
      setUnidades(u);
      setPendingUsers(p);
      setActiveUsers(a);
      if (c) {
        setCondo({
          id: c.id,
          nome: (c as any).nome,
          codigoConviteMorador: (c as any).codigoConviteMorador,
          codigoConviteSindica: (c as any).codigoConviteSindica,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadMoradores = async () => {
    if (!appUser?.condominioId) return;
    try {
      const [p, a] = await Promise.all([
        getPendingUsers(appUser.condominioId),
        getActiveUsers(appUser.condominioId),
      ]);
      setPendingUsers(p);
      setActiveUsers(a);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprove = async (uid: string) => {
    setActionLoading(uid);
    try {
      await approveUser(uid);
      await loadMoradores();
    } catch (e) {
      console.error('Erro ao aprovar morador:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (uid: string) => {
    setActionLoading(uid);
    try {
      await rejectUser(uid);
      await loadMoradores();
    } catch (e) {
      console.error('Erro ao recusar morador:', e);
    } finally {
      setActionLoading(null);
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
        const letraTorre = String.fromCharCode(64 + t); // A, B, C...
        for (let a = 1; a <= numAndares; a++) {
          for (let ap = 1; ap <= numAptos; ap++) {
            const numero = `${a}${ap < 10 ? '0' + ap : ap}`;
            novasUnidades.push({
              torre: numTorres > 1 ? `Bloco ${letraTorre}` : 'Única',
              andar: a,
              numero: numero
            });
          }
        }
      }

      await createUnidadesEmLote(appUser!.condominioId!, novasUnidades);
      const u = await getUnidades(appUser!.condominioId!);
      setUnidades(u);
    } catch (err) {
      console.error('Erro ao gerar infraestrutura:', err);
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

  const handleRotateCode = async (kind: 'sindica' | 'morador') => {
    try {
      await rotateInviteCode(appUser!.condominioId!, kind);
      await loadAll();
    } catch (e) {
      console.error('Erro ao rotacionar código:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-slate-500">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Carregando gestão do condomínio...
      </div>
    );
  }

  // ==========================================================================
  // Estado 1: sem unidades -> mostra o Wizard
  // ==========================================================================
  if (unidades.length === 0) {
    return (
      <Card className="max-w-xl mx-auto mt-8 border-indigo-100 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl text-indigo-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600" /> Bem-vinda, Síndica!
          </CardTitle>
          <CardDescription>
            Para começarmos, precisamos mapear a estrutura do seu condomínio.
            Preencha os campos abaixo e o sistema gerará todos os apartamentos automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGerarMapa} className="space-y-4">
            <div className="space-y-2">
              <Label>Quantidade de Torres/Blocos</Label>
              <Input type="number" min="1" value={torres} onChange={(e) => setTorres(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Andares por Torre</Label>
              <Input type="number" min="1" value={andares} onChange={(e) => setAndares(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Apartamentos por Andar</Label>
              <Input type="number" min="1" value={aptosPorAndar} onChange={(e) => setAptosPorAndar(e.target.value)} required />
            </div>
            <Button type="submit" disabled={gerando} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {gerando ? 'Gerando mapa...' : 'Gerar Estrutura Predial'}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // ==========================================================================
  // Estado 2: com unidades -> painel completo com Abas de Gestão
  // ==========================================================================
  const moradorLink = condo
    ? `${window.location.origin}/registro?condoId=${condo.id}&invite=${condo.codigoConviteMorador}&role=morador`
    : '';

  return (
    <div className="space-y-6">
      {/* Header com resumo */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-indigo-600" />
            {condo?.nome || 'Painel da Síndica'}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Gestão integrada de moradores, acessos e infraestrutura do condomínio.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-indigo-700 border-indigo-200 bg-indigo-50/50 py-1.5 px-3">
            <Layers className="h-3.5 w-3.5 mr-1.5" />
            {unidades.length} Unidades Mapeadas
          </Badge>
          <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50/50 py-1.5 px-3">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            {activeUsers.length} Moradores Ativos
          </Badge>
          {pendingUsers.length > 0 && (
            <Badge className="bg-rose-500 text-white hover:bg-rose-600 py-1.5 px-3 animate-pulse">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              {pendingUsers.length} Aguardando Aprovação
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs de Controle da Síndica */}
      <Tabs defaultValue={pendingUsers.length > 0 ? "aprovacoes" : "qrcode"} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-xl bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="aprovacoes" className="relative data-[state=active]:bg-white data-[state=active]:text-indigo-700">
            <UserCheck className="mr-2 h-4 w-4" />
            Aprovações
            {pendingUsers.length > 0 && (
              <span className="ml-2 bg-rose-500 text-white rounded-full text-xs px-1.5 py-0.2 font-semibold">
                {pendingUsers.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="qrcode" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700">
            <Megaphone className="mr-2 h-4 w-4" />
            QR Code Convite
          </TabsTrigger>
          <TabsTrigger value="moradores" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700">
            <Users className="mr-2 h-4 w-4" />
            Moradores Ativos
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Fila de Aprovações Pendentes */}
        <TabsContent value="aprovacoes" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-white rounded-t-xl border-b border-slate-100">
              <CardTitle className="text-lg font-semibold text-slate-800 flex items-center justify-between">
                <span>Fila de Liberação de Acesso</span>
                <span className="text-xs font-normal text-slate-500">
                  {pendingUsers.length === 0 ? 'Nenhuma solicitação pendente' : `${pendingUsers.length} solicitação(ões)`}
                </span>
              </CardTitle>
              <CardDescription>
                Moradores que se cadastraram via QR Code aguardando validação de apartamento pela síndica.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 bg-white rounded-b-xl">
              {pendingUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                  <p className="font-medium text-slate-600">Tudo em dia!</p>
                  <p className="text-sm">Não há novos moradores aguardando aprovação no momento.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Apartamento / Bloco</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-slate-50/60">
                        <TableCell className="font-medium text-slate-800">{user.nome || 'Não informado'}</TableCell>
                        <TableCell className="text-slate-600">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700">
                            {user.unidadeNome || `Unidade ${user.unidadeId || 'não especificada'}`}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={actionLoading === user.id}
                            onClick={() => handleApprove(user.id)}
                          >
                            <UserCheck className="h-3.5 w-3.5 mr-1" />
                            {actionLoading === user.id ? 'Aprovando...' : 'Aprovar'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-rose-600 border-rose-200 hover:bg-rose-50"
                            disabled={actionLoading === user.id}
                            onClick={() => handleReject(user.id)}
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

        {/* Tab 2: QR Code e Convite de Moradores */}
        <TabsContent value="qrcode" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Como funciona o Convite de Moradores</CardTitle>
                <CardDescription>
                  Para respeitar a LGPD e garantir a segurança do condomínio, os moradores não precisam fornecer CPF no cadastro inicial.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-600">
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">1</div>
                  <p>Você imprime ou compartilha o QR Code com os moradores (no elevador, mural ou WhatsApp do condomínio).</p>
                </div>
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">2</div>
                  <p>O morador escaneia, preenche seu Nome, Email, Senha e seleciona a Torre e o Apartamento dele.</p>
                </div>
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">3</div>
                  <p>O morador entra na sua <strong>Fila de Aprovação</strong> e só tem acesso liberado após seu clique de aprovação.</p>
                </div>
              </CardContent>
            </Card>

            {/* Caixa do QR Code */}
            <Card className="flex flex-col items-center text-center p-4">
              <CardHeader className="p-2 pb-4">
                <CardTitle className="text-base flex items-center justify-center gap-2">
                  <Megaphone className="h-4 w-4 text-indigo-600" /> QR Code de Acesso
                </CardTitle>
                <CardDescription className="text-xs">
                  Aponte a câmera do celular para testar
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-3 w-full p-0">
                <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
                  <QRCodeSVG value={moradorLink} size={160} />
                </div>
                <div className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">
                  Código: <strong>{condo?.codigoConviteMorador}</strong>
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
                  onClick={() => handleRotateCode('morador')}
                >
                  <RefreshCw className="mr-1.5 h-3 w-3" /> Gerar novo código
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Moradores Ativos Cadastrados */}
        <TabsContent value="moradores" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-white rounded-t-xl border-b border-slate-100">
              <CardTitle className="text-lg font-semibold text-slate-800">Moradores Autorizados</CardTitle>
              <CardDescription>
                Moradores com acesso liberado ao aplicativo e autorizados a registrar ocorrências.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 bg-white rounded-b-xl">
              {activeUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  Nenhum morador ativo cadastrado ainda.
                </div>
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
                    {activeUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-slate-50/60">
                        <TableCell className="font-medium text-slate-800">{user.nome || 'Não informado'}</TableCell>
                        <TableCell className="text-slate-600">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700">
                            {user.unidadeNome || `Unidade ${user.unidadeId || 'não especificada'}`}
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
    </div>
  );
}


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
  Plus,
  Pencil,
  Trash2,
  Search,
  QrCode,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import {
  getUnidades,
  createUnidadesEmLote,
  createUnidade,
  updateUnidade,
  deleteUnidade,
  resetUnidades,
  getCondominio,
  getPendingUsers,
  getActiveUsers,
  approveUser,
  rejectUser,
  getOcorrencias,
  despacharOcorrencia,
  rotateInviteCode,
  getAvisos,
  createAviso,
  deleteAviso,
  type AvisoData
} from '@/lib/firestore';
import {
  filterUnits,
  isUnitDuplicate
} from '@/lib/unit-helpers';
import {
  filterOcorrencias,
  getStatusConfig,
  getResponsavelConfig,
  type ResponsavelOcorrencia,
  type StatusOcorrencia
} from '@/lib/ocorrencia-helpers';
import {
  getCategoriaAvisoConfig
} from '@/lib/aviso-helpers';
import { OcorrenciaTimelineModal } from '@/components/common/OcorrenciaTimelineModal';

export default function SindicaView() {
  const { appUser } = useAuth();
  const [condo, setCondo] = useState<any>(null);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [avisos, setAvisos] = useState<AvisoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Wizard de infraestrutura inicial
  const [torres, setTorres] = useState('1');
  const [andares, setAndares] = useState('10');
  const [aptosPorAndar, setAptosPorAndar] = useState('4');
  const [gerando, setGerando] = useState(false);

  // Gestão de unidades
  const [searchUnit, setSearchUnit] = useState('');
  const [filterTorre, setFilterTorre] = useState('all');

  // Modal Criar/Editar Unidade
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any | null>(null);
  const [unitTorre, setUnitTorre] = useState('');
  const [unitAndar, setUnitAndar] = useState('');
  const [unitNumero, setUnitNumero] = useState('');
  const [unitFormError, setUnitFormError] = useState('');
  const [savingUnit, setSavingUnit] = useState(false);

  // Modal Regerar Estrutura Predial
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTorres, setResetTorres] = useState('1');
  const [resetAndares, setResetAndares] = useState('10');
  const [resetAptos, setResetAptos] = useState('4');
  const [resetConfirmChecked, setResetConfirmChecked] = useState(false);
  const [resettingUnits, setResettingUnits] = useState(false);

  // Exclusão de Unidade
  const [deletingUnit, setDeletingUnit] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Gestão de ocorrências e despacho da equipe
  const [selectedOcorrencia, setSelectedOcorrencia] = useState<any | null>(null);
  const [ocorrenciaSearch, setOcorrenciaSearch] = useState('');
  const [ocorrenciaStatusFilter, setOcorrenciaStatusFilter] = useState('all');
  const [ocorrenciaRespFilter, setOcorrenciaRespFilter] = useState('all');

  // Gestão do Mural de Avisos
  const [avisoModalOpen, setAvisoModalOpen] = useState(false);
  const [avisoTitulo, setAvisoTitulo] = useState('');
  const [avisoMensagem, setAvisoMensagem] = useState('');
  const [avisoCategoria, setAvisoCategoria] = useState<'Geral' | 'Manutenção' | 'Assembleia' | 'Segurança' | 'Convivência'>('Geral');
  const [avisoDestinatario, setAvisoDestinatario] = useState<'todos' | 'bloco'>('todos');
  const [avisoBlocoDestino, setAvisoBlocoDestino] = useState('');
  const [avisoFormError, setAvisoFormError] = useState('');
  const [salvandoAviso, setSalvandoAviso] = useState(false);
  const [deletingAvisoId, setDeletingAvisoId] = useState<string | null>(null);

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
      const [c, u, p, a, oc, av] = await Promise.all([
        getCondominio(appUser.condominioId),
        getUnidades(appUser.condominioId),
        getPendingUsers(appUser.condominioId),
        getActiveUsers(appUser.condominioId),
        getOcorrencias(appUser.condominioId, 'sindica'),
        getAvisos(appUser.condominioId),
      ]);
      setCondo(c);
      setUnidades(u);
      setPendingUsers(p);
      setActiveUsers(a);
      setOcorrencias(oc);
      setAvisos(av);
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

  // Torres disponíveis para filtragem e seleção
  const availableTorres = useMemo(() => {
    const set = new Set<string>();
    unidades.forEach((u) => {
      if (u.torre) set.add(u.torre.trim());
    });
    return Array.from(set).sort();
  }, [unidades]);

  // Lista de unidades filtradas
  const filteredUnitsList = useMemo(() => {
    return filterUnits(unidades, searchUnit, filterTorre);
  }, [unidades, searchUnit, filterTorre]);

  // Métricas de unidades
  const unitStats = useMemo(() => {
    const total = unidades.length;
    const occupiedUnitIds = new Set(activeUsers.map((u) => u.unidadeId).filter(Boolean));
    const ocupadas = unidades.filter((u) => occupiedUnitIds.has(u.id)).length;
    const vagas = Math.max(0, total - ocupadas);
    const totalTorres = availableTorres.length || (unidades.length > 0 ? 1 : 0);
    return { total, ocupadas, vagas, totalTorres };
  }, [unidades, activeUsers, availableTorres]);

  // Lista de ocorrências filtradas
  const filteredOcorrenciasList = useMemo(() => {
    return filterOcorrencias(
      ocorrencias,
      ocorrenciaSearch,
      ocorrenciaStatusFilter,
      ocorrenciaRespFilter
    );
  }, [ocorrencias, ocorrenciaSearch, ocorrenciaStatusFilter, ocorrenciaRespFilter]);

  // Métricas de ocorrências
  const ocorrenciasStats = useMemo(() => {
    const total = ocorrencias.length;
    const pendentes = ocorrencias.filter((o) => (o.status || 'Pendente') === 'Pendente').length;
    const emAtendimento = ocorrencias.filter((o) => o.status === 'Em Atendimento' || o.status === 'Em Análise').length;
    const aguardandoValidacao = ocorrencias.filter((o) => o.status === 'Aguardando Validação da Síndica').length;
    const resolvidas = ocorrencias.filter((o) => o.status === 'Resolvido').length;
    return { total, pendentes, emAtendimento, aguardandoValidacao, resolvidas };
  }, [ocorrencias]);

  const handleDespacharOcorrencia = async (params: {
    relato: string;
    responsavelNovo: ResponsavelOcorrencia;
    statusNovo: StatusOcorrencia;
    tipo?: 'despacho' | 'conclusao_equipe' | 'encerramento' | 'reabertura';
  }) => {
    if (!selectedOcorrencia?.id) return;
    try {
      await despacharOcorrencia(selectedOcorrencia.id, {
        relato: params.relato,
        responsavelNovo: params.responsavelNovo,
        statusNovo: params.statusNovo,
        autorNome: appUser?.nome || 'Síndica',
        autorPapel: 'Síndica',
        tipo: params.tipo,
      });
      await loadAllData();
      setSelectedOcorrencia(null);
    } catch (err) {
      console.error('Erro ao despachar ocorrência:', err);
      throw err;
    }
  };

  const getMoradoresDaUnidade = (unidadeId?: string) => {
    if (!unidadeId) return { ativos: [], pendentes: [] };
    const ativos = activeUsers.filter((u) => u.unidadeId === unidadeId);
    const pendentes = pendingUsers.filter((u) => u.unidadeId === unidadeId);
    return { ativos, pendentes };
  };

  const openCreateUnitModal = () => {
    setEditingUnit(null);
    setUnitTorre(availableTorres[0] || 'Bloco A');
    setUnitAndar('');
    setUnitNumero('');
    setUnitFormError('');
    setUnitModalOpen(true);
  };

  const openEditUnitModal = (unit: any) => {
    setEditingUnit(unit);
    setUnitTorre(unit.torre || '');
    setUnitAndar(unit.andar !== undefined && unit.andar !== null ? String(unit.andar) : '');
    setUnitNumero(unit.numero || '');
    setUnitFormError('');
    setUnitModalOpen(true);
  };

  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitNumero.trim()) {
      setUnitFormError('Informe o número da unidade.');
      return;
    }

    const isDuplicate = isUnitDuplicate(
      unidades,
      { torre: unitTorre.trim(), numero: unitNumero.trim() },
      editingUnit?.id
    );

    if (isDuplicate) {
      setUnitFormError('Já existe uma unidade cadastrada com este número e torre/bloco.');
      return;
    }

    setSavingUnit(true);
    setUnitFormError('');
    try {
      const andarNum = unitAndar.trim() ? parseInt(unitAndar.trim(), 10) : undefined;
      const payload = {
        torre: unitTorre.trim() || 'Única',
        andar: andarNum !== undefined && !isNaN(andarNum) ? andarNum : undefined,
        numero: unitNumero.trim(),
      };

      if (editingUnit?.id) {
        await updateUnidade(appUser!.condominioId!, editingUnit.id, payload);
      } else {
        await createUnidade(appUser!.condominioId!, payload);
      }
      setUnitModalOpen(false);
      await loadAllData();
    } catch (err) {
      console.error('Erro ao salvar unidade:', err);
      setUnitFormError('Falha ao salvar unidade. Tente novamente.');
    } finally {
      setSavingUnit(false);
    }
  };

  const handleDeleteUnit = async () => {
    if (!deletingUnit?.id) return;
    setIsDeleting(true);
    try {
      await deleteUnidade(appUser!.condominioId!, deletingUnit.id);
      setDeletingUnit(null);
      await loadAllData();
    } catch (err) {
      console.error('Erro ao excluir unidade:', err);
      alert('Falha ao excluir a unidade.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetEstrutura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetConfirmChecked) {
      alert('Marque a confirmação de que deseja substituir a grade atual.');
      return;
    }
    setResettingUnits(true);
    try {
      const numTorres = parseInt(resetTorres, 10) || 1;
      const numAndares = parseInt(resetAndares, 10) || 1;
      const numAptos = parseInt(resetAptos, 10) || 1;

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

      await resetUnidades(appUser!.condominioId!, novasUnidades);
      setResetModalOpen(false);
      setResetConfirmChecked(false);
      await loadAllData();
    } catch (err) {
      console.error('Erro ao regerar estrutura:', err);
      alert('Falha ao regerar estrutura predial.');
    } finally {
      setResettingUnits(false);
    }
  };

  const openNovoAvisoModal = () => {
    setAvisoTitulo('');
    setAvisoMensagem('');
    setAvisoCategoria('Geral');
    setAvisoDestinatario('todos');
    setAvisoBlocoDestino(availableTorres[0] || '');
    setAvisoFormError('');
    setAvisoModalOpen(true);
  };

  const handleSaveAviso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avisoTitulo.trim()) {
      setAvisoFormError('Informe o título do comunicado.');
      return;
    }
    if (!avisoMensagem.trim()) {
      setAvisoFormError('Informe a mensagem do comunicado.');
      return;
    }
    if (avisoDestinatario === 'bloco' && !avisoBlocoDestino.trim()) {
      setAvisoFormError('Selecione o bloco de destino para o comunicado.');
      return;
    }

    setSalvandoAviso(true);
    setAvisoFormError('');
    try {
      await createAviso({
        condominioId: appUser!.condominioId!,
        titulo: avisoTitulo.trim(),
        mensagem: avisoMensagem.trim(),
        categoria: avisoCategoria,
        destinatarioTipo: avisoDestinatario,
        blocoDestino: avisoDestinatario === 'bloco' ? avisoBlocoDestino.trim() : undefined,
        criadoPorNome: appUser?.nome || 'Síndica',
        criadoPorUid: appUser!.uid,
      });
      setAvisoModalOpen(false);
      await loadAllData();
    } catch (err) {
      console.error('Erro ao publicar comunicado:', err);
      setAvisoFormError('Falha ao publicar comunicado. Tente novamente.');
    } finally {
      setSalvandoAviso(false);
    }
  };

  const handleDeleteAviso = async (avisoId: string) => {
    if (!confirm('Deseja realmente remover este comunicado do Mural?')) return;
    setDeletingAvisoId(avisoId);
    try {
      await deleteAviso(avisoId);
      await loadAllData();
    } catch (err) {
      console.error('Erro ao excluir comunicado:', err);
      alert('Falha ao excluir comunicado.');
    } finally {
      setDeletingAvisoId(null);
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
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 max-w-4xl bg-slate-200/80 p-1 rounded-xl">
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
              <TabsTrigger value="mural" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700">
                <Megaphone className="mr-1.5 h-4 w-4" />
                Mural ({avisos.length})
              </TabsTrigger>
              <TabsTrigger value="unidades" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700">
                <Building2 className="mr-1.5 h-4 w-4" />
                Unidades ({unidades.length})
              </TabsTrigger>
              <TabsTrigger value="moradores" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700">
                <Users className="mr-1.5 h-4 w-4" />
                Moradores ({activeUsers.length})
              </TabsTrigger>
              <TabsTrigger value="qrcode" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700">
                <QrCode className="mr-1.5 h-4 w-4" />
                QR Code
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

            {/* Tab: Gestão de Unidades */}
            <TabsContent value="unidades" className="mt-4 space-y-4">
              {/* Mini cards de métricas de unidades */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <p className="text-xs text-slate-500 font-medium">Total de Unidades</p>
                  <p className="text-2xl font-bold text-slate-800 mt-0.5">{unitStats.total}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <p className="text-xs text-slate-500 font-medium">Torres / Blocos</p>
                  <p className="text-2xl font-bold text-indigo-700 mt-0.5">{unitStats.totalTorres}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <p className="text-xs text-slate-500 font-medium">Unidades Ocupadas</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-0.5">{unitStats.ocupadas}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <p className="text-xs text-slate-500 font-medium">Unidades Vagas</p>
                  <p className="text-2xl font-bold text-slate-600 mt-0.5">{unitStats.vagas}</p>
                </div>
              </div>

              {/* Card principal com barra de ações e tabela */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="bg-white rounded-t-xl border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">
                      Mapa e Gestão de Unidades
                    </CardTitle>
                    <CardDescription>
                      Adicione unidades avulsas, edite dados de apartamentos ou reconfigure a estrutura predial.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={openCreateUnitModal}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                    >
                      <Plus className="h-4 w-4 mr-1.5" /> Nova Unidade
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setResetTorres(String(unitStats.totalTorres || 1));
                        setResetModalOpen(true);
                      }}
                      className="text-slate-700 border-slate-300 hover:bg-slate-50 font-medium"
                    >
                      <RefreshCw className="h-4 w-4 mr-1.5 text-indigo-600" /> Regerar Grade
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 bg-white rounded-b-xl space-y-4">
                  {/* Barra de Filtro e Busca */}
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:w-80">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder="Buscar por número, torre ou andar..."
                        value={searchUnit}
                        onChange={(e) => setSearchUnit(e.target.value)}
                        className="pl-9 text-sm"
                      />
                    </div>
                    {availableTorres.length > 1 && (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Label className="text-xs text-slate-500 whitespace-nowrap">Filtrar Bloco:</Label>
                        <select
                          value={filterTorre}
                          onChange={(e) => setFilterTorre(e.target.value)}
                          className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-700 shadow-xs cursor-pointer"
                        >
                          <option value="all">Todos os Blocos ({unidades.length})</option>
                          {availableTorres.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Tabela de Unidades */}
                  {filteredUnitsList.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 space-y-2">
                      <Building2 className="h-10 w-10 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-700">Nenhuma unidade encontrada</p>
                      <p className="text-sm">Tente ajustar o termo de busca ou adicione uma nova unidade.</p>
                    </div>
                  ) : (
                    <div className="border border-slate-100 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead>Unidade / Apartamento</TableHead>
                            <TableHead>Torre / Bloco</TableHead>
                            <TableHead>Andar</TableHead>
                            <TableHead>Morador(es) Vinculado(s)</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUnitsList.map((unit) => {
                            const { ativos, pendentes } = getMoradoresDaUnidade(unit.id);
                            return (
                              <TableRow key={unit.id} className="hover:bg-slate-50/60">
                                <TableCell className="font-semibold text-slate-800">
                                  Apto {unit.numero}
                                </TableCell>
                                <TableCell className="text-slate-600 text-sm">
                                  <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700">
                                    {unit.torre || 'Única'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-slate-600 text-sm">
                                  {unit.andar !== undefined && unit.andar !== null ? `${unit.andar}º andar` : '—'}
                                </TableCell>
                                <TableCell>
                                  {ativos.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {ativos.map((m) => (
                                        <Badge
                                          key={m.id}
                                          className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-normal text-xs"
                                        >
                                          {m.nome || m.email}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : pendentes.length > 0 ? (
                                    <Badge
                                      variant="secondary"
                                      className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 text-xs"
                                    >
                                      {pendentes.length} pendente(s) de aprovação
                                    </Badge>
                                  ) : (
                                    <span className="text-xs text-slate-400 font-medium">Vago</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right space-x-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openEditUnitModal(unit)}
                                    className="h-8 px-2 text-slate-600 hover:text-indigo-600"
                                    title="Editar Unidade"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setDeletingUnit(unit)}
                                    className="h-8 px-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                    title="Excluir Unidade"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
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

            {/* Tab 2: Ocorrências do Condomínio (Redesenhado: Limpo, sem poluição visual e com despacho) */}
            <TabsContent value="ocorrencias" className="mt-4 space-y-4">
              {/* Mini cards de métricas de atendimento */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <p className="text-xs text-slate-500 font-medium">Pendentes</p>
                  <p className="text-2xl font-bold text-amber-600 mt-0.5">{ocorrenciasStats.pendentes}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <p className="text-xs text-slate-500 font-medium">Em Atendimento</p>
                  <p className="text-2xl font-bold text-blue-600 mt-0.5">{ocorrenciasStats.emAtendimento}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <p className="text-xs text-slate-500 font-medium">Aguardando Validação</p>
                  <p className="text-2xl font-bold text-purple-600 mt-0.5">{ocorrenciasStats.aguardandoValidacao}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <p className="text-xs text-slate-500 font-medium">Resolvidos</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-0.5">{ocorrenciasStats.resolvidas}</p>
                </div>
              </div>

              {/* Card principal com lista limpa e filtros */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="bg-white rounded-t-xl border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">Livro de Ocorrências e Atendimentos</CardTitle>
                    <CardDescription>
                      Acompanhe, despache para portaria ou zeladoria e homologue o encerramento dos chamados.
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={loadAllData} className="self-end md:self-auto">
                    <RefreshCw className="h-4 w-4 text-slate-500" />
                  </Button>
                </CardHeader>

                <CardContent className="p-4 bg-white rounded-b-xl space-y-4">
                  {/* Barra de Filtro e Busca Rápida */}
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:w-80">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder="Buscar por chamado, morador ou unidade..."
                        value={ocorrenciaSearch}
                        onChange={(e) => setOcorrenciaSearch(e.target.value)}
                        className="pl-9 text-sm"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                      {/* Filtro de Status */}
                      <select
                        value={ocorrenciaStatusFilter}
                        onChange={(e) => setOcorrenciaStatusFilter(e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-700 shadow-2xs cursor-pointer"
                      >
                        <option value="all">Todos os Status ({ocorrencias.length})</option>
                        <option value="Pendente">Pendentes</option>
                        <option value="Em Atendimento">Em Atendimento</option>
                        <option value="Aguardando Validação da Síndica">Aguardando Validação</option>
                        <option value="Resolvido">Resolvidos</option>
                      </select>

                      {/* Filtro de Responsável */}
                      <select
                        value={ocorrenciaRespFilter}
                        onChange={(e) => setOcorrenciaRespFilter(e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-700 shadow-2xs cursor-pointer"
                      >
                        <option value="all">Todos os Responsáveis</option>
                        <option value="Síndica">Síndica / Adm</option>
                        <option value="Zeladoria">Zeladoria</option>
                        <option value="Portaria">Portaria</option>
                        <option value="Prestador Externo">Prestador Externo</option>
                      </select>
                    </div>
                  </div>

                  {/* Tabela Limpa */}
                  {filteredOcorrenciasList.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 space-y-2">
                      <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                      <p className="font-semibold text-slate-700">Nenhum chamado encontrado</p>
                      <p className="text-sm">Não há ocorrências com os critérios de filtro selecionados.</p>
                    </div>
                  ) : (
                    <div className="border border-slate-100 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead>Chamado & Local</TableHead>
                            <TableHead>Prioridade</TableHead>
                            <TableHead>Responsável Atual</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredOcorrenciasList.map((oc) => {
                            const stCfg = getStatusConfig(oc.status);
                            const rsCfg = getResponsavelConfig(oc.responsavelAtual);
                            const precisaValidacao = oc.status === 'Aguardando Validação da Síndica';

                            return (
                              <TableRow key={oc.id} className={`hover:bg-slate-50/60 ${precisaValidacao ? 'bg-purple-50/30' : ''}`}>
                                <TableCell className="font-medium text-slate-800">
                                  <div className="font-semibold text-slate-900">{oc.titulo}</div>
                                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                                    <span className="font-medium text-slate-700">{oc.unidadeNome || 'Geral'}</span>
                                    <span>•</span>
                                    <span>{oc.autorNome || 'Morador'}</span>
                                  </div>
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
                                    <span className="text-xs text-slate-400">Normal</span>
                                  )}
                                </TableCell>

                                <TableCell>
                                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border inline-flex items-center gap-1 ${rsCfg.bgClass} ${rsCfg.textClass} ${rsCfg.borderClass}`}>
                                    {rsCfg.label}
                                  </span>
                                </TableCell>

                                <TableCell>
                                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border inline-flex items-center gap-1 ${stCfg.bgClass} ${stCfg.textClass} ${stCfg.borderClass}`}>
                                    {stCfg.label}
                                  </span>
                                </TableCell>

                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    onClick={() => setSelectedOcorrencia(oc)}
                                    className={`font-medium ${
                                      precisaValidacao
                                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                    }`}
                                  >
                                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                                    {precisaValidacao ? 'Validar & Fechar' : 'Ver Trilha & Despachar'}
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

            {/* Tab: Mural de Avisos da Síndica */}
            <TabsContent value="mural" className="mt-4 space-y-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="bg-white rounded-t-xl border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Megaphone className="h-5 w-5 text-indigo-600" /> Mural de Avisos e Comunicados
                    </CardTitle>
                    <CardDescription>
                      Publique comunicados oficiais para todos os moradores ou segmentados por bloco específico.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={openNovoAvisoModal}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium self-start sm:self-auto cursor-pointer"
                  >
                    <Plus className="h-4 w-4 mr-1.5" /> Novo Comunicado
                  </Button>
                </CardHeader>
                <CardContent className="p-4 bg-white rounded-b-xl">
                  {avisos.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 space-y-3">
                      <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
                        <Megaphone className="h-6 w-6" />
                      </div>
                      <p className="font-semibold text-slate-700">Nenhum comunicado publicado ainda</p>
                      <p className="text-sm max-w-md mx-auto">
                        Utilize o mural para avisar sobre manutenções preventivas, assembleias, regras de convivência ou recados gerais.
                      </p>
                      <Button
                        size="sm"
                        onClick={openNovoAvisoModal}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white mt-2 cursor-pointer"
                      >
                        <Plus className="h-4 w-4 mr-1.5" /> Criar Primeiro Comunicado
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {avisos.map((av) => {
                        const catConfig = getCategoriaAvisoConfig(av.categoria);
                        const isBloco = av.destinatarioTipo === 'bloco' && av.blocoDestino;
                        const dataFormatada = av.createdAt?.toDate
                          ? av.createdAt.toDate().toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : av.createdAt ? new Date(av.createdAt).toLocaleDateString('pt-BR') : 'Recente';

                        return (
                          <div
                            key={av.id}
                            className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-xs space-y-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className={`text-xs font-semibold ${catConfig.badgeClass}`}>
                                  {catConfig.label}
                                </Badge>
                                {isBloco ? (
                                  <Badge className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50 text-xs font-medium">
                                    <Building2 className="h-3 w-3 mr-1" />
                                    Exclusivo: {av.blocoDestino}
                                  </Badge>
                                ) : (
                                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50 text-xs font-medium">
                                    <Users className="h-3 w-3 mr-1" />
                                    Todos os Moradores
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-400">{dataFormatada}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => av.id && handleDeleteAviso(av.id)}
                                  disabled={deletingAvisoId === av.id}
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                  title="Excluir comunicado"
                                  aria-label="Excluir comunicado"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-base font-bold text-slate-900">{av.titulo}</h4>
                              <p className="text-sm text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                                {av.mensagem}
                              </p>
                            </div>

                            <div className="text-xs text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                              <span>Publicado por: <strong>{av.criadoPorNome || 'Síndica'}</strong></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: QR Code de Convite */}
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

        {/* Modal: Criar ou Editar Unidade */}
        {unitModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingUnit ? 'Editar Unidade' : 'Adicionar Nova Unidade'}
                  </h3>
                </div>
                <button
                  onClick={() => setUnitModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {unitFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{unitFormError}</span>
                </div>
              )}

              <form onSubmit={handleSaveUnit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Torre / Bloco</Label>
                  <Input
                    placeholder="Ex: Bloco A, Torre 1 ou Única"
                    value={unitTorre}
                    onChange={(e) => setUnitTorre(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Andar (opcional)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 3"
                      value={unitAndar}
                      onChange={(e) => setUnitAndar(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Número do Apartamento</Label>
                    <Input
                      placeholder="Ex: 302 ou Cobertura 01"
                      value={unitNumero}
                      onChange={(e) => setUnitNumero(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setUnitModalOpen(false)}
                    disabled={savingUnit}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingUnit}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {savingUnit ? 'Salvando...' : editingUnit ? 'Atualizar Unidade' : 'Criar Unidade'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Confirmar Exclusão de Unidade */}
        {deletingUnit && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Excluir Unidade</h3>
                  <p className="text-xs text-slate-500">
                    Apto {deletingUnit.numero} - {deletingUnit.torre || 'Torre Única'}
                  </p>
                </div>
              </div>

              {(() => {
                const { ativos, pendentes } = getMoradoresDaUnidade(deletingUnit.id);
                const totalVinculados = ativos.length + pendentes.length;
                if (totalVinculados > 0) {
                  return (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs space-y-1">
                      <p className="font-semibold">Atenção aos moradores vinculados:</p>
                      <p>
                        Esta unidade possui {totalVinculados} morador(es) associado(s). Ao excluí-la, os cadastros ficarão sem unidade definida.
                      </p>
                    </div>
                  );
                }
                return (
                  <p className="text-sm text-slate-600">
                    Tem certeza de que deseja remover esta unidade? Esta ação é imediata.
                  </p>
                );
              })()}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeletingUnit(null)}
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleDeleteUnit}
                  disabled={isDeleting}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Regerar Estrutura Predial */}
        {resetModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <RefreshCw className="h-4 w-4" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Regerar Estrutura Predial</h3>
                </div>
                <button
                  onClick={() => setResetModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  Substituição da grade atual
                </p>
                <p>
                  Esta operação substituirá todas as {unidades.length} unidades atuais pelas novas que forem configuradas abaixo.
                </p>
              </div>

              <form onSubmit={handleResetEstrutura} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Quantidade de Torres / Blocos</Label>
                  <Input
                    type="number"
                    min="1"
                    value={resetTorres}
                    onChange={(e) => setResetTorres(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Andares por Torre</Label>
                  <Input
                    type="number"
                    min="1"
                    value={resetAndares}
                    onChange={(e) => setResetAndares(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Apartamentos por Andar</Label>
                  <Input
                    type="number"
                    min="1"
                    value={resetAptos}
                    onChange={(e) => setResetAptos(e.target.value)}
                    required
                  />
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-600 flex items-center justify-between">
                  <span>Total a ser criado:</span>
                  <span className="font-bold text-indigo-700">
                    {(parseInt(resetTorres, 10) || 0) * (parseInt(resetAndares, 10) || 0) * (parseInt(resetAptos, 10) || 0)} unidades
                  </span>
                </div>

                <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={resetConfirmChecked}
                    onChange={(e) => setResetConfirmChecked(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Estou ciente de que a lista de unidades atual será substituída pela nova configuração.</span>
                </label>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setResetModalOpen(false)}
                    disabled={resettingUnits}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={resettingUnits || !resetConfirmChecked}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {resettingUnits ? 'Regerando unidades...' : 'Substituir e Regerar'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Linha do Tempo e Despacho de Ocorrência */}
        {selectedOcorrencia && (
          <OcorrenciaTimelineModal
            isOpen={Boolean(selectedOcorrencia)}
            ocorrencia={selectedOcorrencia}
            userRole="sindica"
            userName={appUser?.nome || 'Síndica'}
            onClose={() => setSelectedOcorrencia(null)}
            onDespachar={handleDespacharOcorrencia}
          />
        )}

        {/* Modal: Novo Comunicado no Mural */}
        {avisoModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Novo Comunicado no Mural</h3>
                </div>
                <button
                  onClick={() => setAvisoModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                  aria-label="Fechar modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {avisoFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{avisoFormError}</span>
                </div>
              )}

              <form onSubmit={handleSaveAviso} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Título do Comunicado</Label>
                  <Input
                    placeholder="Ex: Manutenção preventiva de elevadores ou Assembleia Geral"
                    value={avisoTitulo}
                    onChange={(e) => setAvisoTitulo(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Categoria</Label>
                  <select
                    value={avisoCategoria}
                    onChange={(e) => setAvisoCategoria(e.target.value as any)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white font-medium text-slate-700 shadow-xs cursor-pointer"
                  >
                    <option value="Geral">Geral</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Assembleia">Assembleia</option>
                    <option value="Segurança">Segurança</option>
                    <option value="Convivência">Convivência</option>
                  </select>
                </div>

                {/* Seletor de Direcionamento: Todos ou por Bloco */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700">Direcionamento do Comunicado</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAvisoDestinatario('todos')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                        avisoDestinatario === 'todos'
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-1 ring-indigo-600'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-xs">
                        <Users className="h-4 w-4 text-indigo-600" /> Todos os Moradores
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Visível para todas as unidades e blocos
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAvisoDestinatario('bloco');
                        if (!avisoBlocoDestino && availableTorres.length > 0) {
                          setAvisoBlocoDestino(availableTorres[0]);
                        }
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                        avisoDestinatario === 'bloco'
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-1 ring-indigo-600'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-xs">
                        <Building2 className="h-4 w-4 text-indigo-600" /> Por Bloco Específico
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Apenas para o bloco/torre selecionado
                      </span>
                    </button>
                  </div>

                  {/* Seletor de Bloco quando direcionamento for 'bloco' */}
                  {avisoDestinatario === 'bloco' && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 animate-in fade-in-50 duration-150">
                      <Label className="text-xs font-semibold text-slate-700">Selecione o Bloco de Destino:</Label>
                      {availableTorres.length > 0 ? (
                        <select
                          value={avisoBlocoDestino}
                          onChange={(e) => setAvisoBlocoDestino(e.target.value)}
                          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white font-medium text-slate-700 shadow-xs cursor-pointer"
                          required
                        >
                          {availableTorres.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-xs text-amber-700">
                          Nenhum bloco cadastrado ainda no condomínio.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Mensagem do Comunicado</Label>
                  <textarea
                    rows={4}
                    placeholder="Descreva o comunicado, datas, orientações e prazos importantes..."
                    value={avisoMensagem}
                    onChange={(e) => setAvisoMensagem(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg p-3 bg-white text-slate-800 shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAvisoModalOpen(false)}
                    disabled={salvandoAviso}
                    className="cursor-pointer"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={salvandoAviso}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                  >
                    {salvandoAviso ? 'Publicando...' : 'Publicar no Mural'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

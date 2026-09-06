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
  Home,
  X,
  LayoutDashboard,
  ArrowRight,
  Sparkles,
  Layers
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
  getMoradores,
  updateMorador,
  updateMoradorStatus,
  deleteMorador,
  approveUser,
  rejectUser,
  getOcorrencias,
  despacharOcorrencia,
  rotateInviteCode,
  getAvisos,
  createAviso,
  updateAviso,
  deleteAviso,
  renameBlocoEmCascata,
  type AvisoData
} from '@/lib/firestore';
import {
  filterUnits,
  isUnitDuplicate,
  generateBlockName,
  countUnitsByTower,
  type BlocoEstilo
} from '@/lib/unit-helpers';
import {
  filterOcorrencias,
  getStatusConfig,
  getResponsavelConfig,
  type ResponsavelOcorrencia,
  type StatusOcorrencia
} from '@/lib/ocorrencia-helpers';
import {
  getCategoriaAvisoConfig,
  filterAvisosParaSindica,
  calcAvisosStats,
} from '@/lib/aviso-helpers';
import {
  resolveMoradorStatus,
  getMoradorStatusConfig,
  filterMoradores,
  calcMoradoresStats,
  type MoradorItem,
  type MoradorStatus,
} from '@/lib/morador-helpers';
import { NovaPublicacaoJanela } from '@/components/dashboard/NovaPublicacaoJanela';
import { UnidadeEditorJanela } from '@/components/dashboard/UnidadeEditorJanela';
import { RegerarEstruturaJanela } from '@/components/dashboard/RegerarEstruturaJanela';
import { RenomearBlocoJanela } from '@/components/dashboard/RenomearBlocoJanela';
import { OcorrenciaTimelineJanela } from '@/components/common/OcorrenciaTimelineJanela';
import { MoradorEditorJanela } from '@/components/dashboard/MoradorEditorJanela';
import { formatarDataHora, getTimestampMillis } from '@/lib/date-utils';

export default function SindicaView() {
  const { appUser } = useAuth();
  const [condo, setCondo] = useState<any>(null);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [moradores, setMoradores] = useState<MoradorItem[]>([]);
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [avisos, setAvisos] = useState<AvisoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('geral');

  // Wizard de infraestrutura inicial
  const [torres, setTorres] = useState('1');
  const [andares, setAndares] = useState('10');
  const [aptosPorAndar, setAptosPorAndar] = useState('4');
  const [gerando, setGerando] = useState(false);

  // Gestão de unidades
  const [searchUnit, setSearchUnit] = useState('');
  const [filterTorre, setFilterTorre] = useState('all');

  // Janela Criar/Editar Unidade
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any | null>(null);
  const [unitFormError, setUnitFormError] = useState('');
  const [savingUnit, setSavingUnit] = useState(false);

  // Janela Regerar Estrutura Predial
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resettingUnits, setResettingUnits] = useState(false);

  // Janela Renomear Bloco em Cascata
  const [renomearBlocoModalOpen, setRenomearBlocoModalOpen] = useState(false);
  const [blocoAlvoRenomear, setBlocoAlvoRenomear] = useState<string | null>(null);
  const [isRenamingBloco, setIsRenamingBloco] = useState(false);

  // Exclusão de Unidade
  const [deletingUnit, setDeletingUnit] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Gestão de ocorrências e despacho da equipe
  const [selectedOcorrencia, setSelectedOcorrencia] = useState<any | null>(null);
  const [ocorrenciaSearch, setOcorrenciaSearch] = useState('');
  const [ocorrenciaStatusFilter, setOcorrenciaStatusFilter] = useState('all');
  const [ocorrenciaRespFilter, setOcorrenciaRespFilter] = useState('all');

  // Gestão do Mural de Avisos (CRUD)
  const [isCriandoAviso, setIsCriandoAviso] = useState(false);
  const [editingAviso, setEditingAviso] = useState<AvisoData | null>(null);
  const [deletingAviso, setDeletingAviso] = useState<AvisoData | null>(null);
  const [isDeletingAviso, setIsDeletingAviso] = useState(false);
  const [searchAviso, setSearchAviso] = useState('');
  const [filterAvisoCategoria, setFilterAvisoCategoria] = useState('all');
  const [filterAvisoDestinatario, setFilterAvisoDestinatario] = useState('all');

  // Gestão de Moradores (CRUD & Status)
  const [editingMorador, setEditingMorador] = useState<MoradorItem | null>(null);
  const [savingMorador, setSavingMorador] = useState(false);
  const [deletingMorador, setDeletingMorador] = useState<MoradorItem | null>(null);
  const [isDeletingMorador, setIsDeletingMorador] = useState(false);
  const [searchMorador, setSearchMorador] = useState('');
  const [filterMoradorStatus, setFilterMoradorStatus] = useState('all');
  const [filterMoradorTorre, setFilterMoradorTorre] = useState('all');

  // Modais de confirmação na interface (substitui popups nativos de navegador)
  const [rotateQrModalOpen, setRotateQrModalOpen] = useState(false);
  const [rotatingQr, setRotatingQr] = useState(false);
  const [rejectingMorador, setRejectingMorador] = useState<any | null>(null);
  const [isRejectingMorador, setIsRejectingMorador] = useState(false);

  // Toast de feedback visual integrado
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setFeedbackToast({ text, type });
  };

  useEffect(() => {
    if (!feedbackToast) return;
    const timer = setTimeout(() => {
      setFeedbackToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [feedbackToast]);

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
      const [c, u, p, a, oc, av, mor] = await Promise.all([
        getCondominio(appUser.condominioId),
        getUnidades(appUser.condominioId),
        getPendingUsers(appUser.condominioId),
        getActiveUsers(appUser.condominioId),
        getOcorrencias(appUser.condominioId, 'sindica'),
        getAvisos(appUser.condominioId),
        getMoradores(appUser.condominioId),
      ]);
      setCondo(c);
      setUnidades(u);
      setPendingUsers(p);
      setActiveUsers(a);
      setOcorrencias(oc);
      setAvisos(av);
      setMoradores(mor);
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
      showToast('Morador aprovado e liberado com sucesso!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Erro ao aprovar morador.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmRejectMorador = async () => {
    if (!rejectingMorador) return;
    const uid = rejectingMorador.uid || rejectingMorador.id;
    if (!uid) return;

    setIsRejectingMorador(true);
    try {
      await rejectUser(uid);
      await loadAllData();
      const nomeMorador = rejectingMorador.nome || 'Morador';
      setRejectingMorador(null);
      showToast(`Solicitação de acesso de ${nomeMorador} foi recusada.`, 'info');
    } catch (e) {
      console.error(e);
      showToast('Erro ao recusar solicitação do morador.', 'error');
    } finally {
      setIsRejectingMorador(false);
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
      showToast('Mapa predial e unidades criadas com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Falha ao gerar mapa predial.', 'error');
    } finally {
      setGerando(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      showToast('Link de convite copiado com sucesso!', 'success');
    } catch (e) {
      console.error('Falha ao copiar', e);
      showToast('Falha ao copiar para a área de transferência.', 'error');
    }
  };

  const handleConfirmRotateCode = async () => {
    if (!appUser?.condominioId) return;
    setRotatingQr(true);
    try {
      await rotateInviteCode(appUser.condominioId, 'morador');
      await loadAllData();
      setRotateQrModalOpen(false);
      showToast('Novo código de convite e QR Code gerados com sucesso!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Falha ao rotacionar código de convite.', 'error');
    } finally {
      setRotatingQr(false);
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

  // Contagem de unidades por torre/bloco
  const unitsCountByTorre = useMemo(() => {
    return countUnitsByTower(unidades);
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
    setUnitFormError('');
    setUnitModalOpen(true);
  };

  const openEditUnitModal = (unit: any) => {
    setEditingUnit(unit);
    setUnitFormError('');
    setUnitModalOpen(true);
  };

  const handleSaveUnit = async (data: { numero: string; torre: string; andar?: number }) => {
    if (!data.numero.trim()) {
      setUnitFormError('Informe o número da unidade.');
      return;
    }

    const isDuplicate = isUnitDuplicate(
      unidades,
      { torre: data.torre.trim(), numero: data.numero.trim() },
      editingUnit?.id
    );

    if (isDuplicate) {
      setUnitFormError('Já existe uma unidade cadastrada com este número e torre/bloco.');
      return;
    }

    setSavingUnit(true);
    setUnitFormError('');
    try {
      const payload = {
        torre: data.torre.trim() || 'Única',
        andar: data.andar !== undefined && !isNaN(data.andar) ? data.andar : undefined,
        numero: data.numero.trim(),
      };

      if (editingUnit?.id) {
        await updateUnidade(appUser!.condominioId!, editingUnit.id, payload);
      } else {
        await createUnidade(appUser!.condominioId!, payload);
      }
      setUnitModalOpen(false);
      setEditingUnit(null);
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
      showToast('Unidade excluída com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao excluir unidade:', err);
      showToast('Falha ao excluir a unidade.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetEstrutura = async ({
    torres: numTorres,
    andares: numAndares,
    aptosPorAndar: numAptos,
    estiloBloco,
  }: {
    torres: number;
    andares: number;
    aptosPorAndar: number;
    estiloBloco?: BlocoEstilo;
  }) => {
    setResettingUnits(true);
    try {
      const novasUnidades = [];
      for (let t = 1; t <= numTorres; t++) {
        const nomeTorre = generateBlockName(t, numTorres, estiloBloco || 'bloco_letras');
        for (let a = 1; a <= numAndares; a++) {
          for (let ap = 1; ap <= numAptos; ap++) {
            const numero = `${a}${ap < 10 ? '0' + ap : ap}`;
            novasUnidades.push({
              torre: nomeTorre,
              andar: a,
              numero: numero,
            });
          }
        }
      }

      await resetUnidades(appUser!.condominioId!, novasUnidades);
      setResetModalOpen(false);
      await loadAllData();
      showToast('Estrutura predial regerada com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao regerar estrutura:', err);
      showToast('Falha ao regerar estrutura predial.', 'error');
    } finally {
      setResettingUnits(false);
    }
  };

  const handleConfirmarRenameBloco = async (blocoAntigo: string, blocoNovo: string) => {
    if (!appUser?.condominioId) return;
    setIsRenamingBloco(true);
    try {
      const res = await renameBlocoEmCascata(appUser.condominioId, blocoAntigo, blocoNovo);
      await loadAllData();
      setRenomearBlocoModalOpen(false);
      setBlocoAlvoRenomear(null);
      showToast(
        `Bloco renomeado de "${blocoAntigo}" para "${blocoNovo}" com sucesso! (${res.unidadesAfetadas} unidades, ${res.moradoresAfetados} moradores e ${res.avisosAfetados} comunicados atualizados)`,
        'success'
      );
    } catch (err) {
      console.error('Erro ao renomear bloco em cascata:', err);
      showToast('Falha ao renomear o bloco em cascata.', 'error');
    } finally {
      setIsRenamingBloco(false);
    }
  };

  const openNovoAviso = () => {
    setEditingAviso(null);
    setIsCriandoAviso(true);
  };

  const openEditAviso = (av: AvisoData) => {
    setEditingAviso(av);
    setIsCriandoAviso(true);
  };

  const handleSaveAviso = async (dados: Omit<AvisoData, 'id'>, avisoId?: string) => {
    try {
      if (avisoId) {
        await updateAviso(avisoId, dados);
        showToast('Comunicado atualizado com sucesso!', 'success');
      } else {
        await createAviso(dados);
        showToast('Comunicado publicado no mural com sucesso!', 'success');
      }
      await loadAllData();
      setIsCriandoAviso(false);
      setEditingAviso(null);
    } catch (err) {
      console.error('Erro ao salvar comunicado:', err);
      showToast('Falha ao salvar comunicado.', 'error');
    }
  };

  const handleConfirmDeleteAviso = async () => {
    if (!deletingAviso?.id) return;
    setIsDeletingAviso(true);
    try {
      await deleteAviso(deletingAviso.id);
      await loadAllData();
      setDeletingAviso(null);
      showToast('Comunicado removido com sucesso!', 'info');
    } catch (err) {
      console.error('Erro ao excluir comunicado:', err);
      showToast('Falha ao excluir comunicado.', 'error');
    } finally {
      setIsDeletingAviso(false);
    }
  };

  const openEditMorador = (m: MoradorItem) => {
    setEditingMorador(m);
  };

  const handleSaveMorador = async (dados: {
    uid: string;
    nome: string;
    unidadeId: string;
    unidadeNome: string;
    telefone?: string;
    status: MoradorStatus;
  }) => {
    setSavingMorador(true);
    try {
      const role = dados.status === 'ativo' ? 'morador' : dados.status === 'pendente' ? 'pending' : 'rejected';
      await updateMorador(dados.uid, {
        nome: dados.nome,
        unidadeId: dados.unidadeId,
        unidadeNome: dados.unidadeNome,
        telefone: dados.telefone,
        status: dados.status,
        role,
      });
      await loadAllData();
      setEditingMorador(null);
      showToast('Dados do morador atualizados com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao salvar morador:', err);
      showToast('Falha ao atualizar dados do morador.', 'error');
    } finally {
      setSavingMorador(false);
    }
  };

  const handleQuickStatusChange = async (uid: string, novoStatus: MoradorStatus) => {
    setActionLoading(uid);
    try {
      await updateMoradorStatus(uid, novoStatus);
      await loadAllData();
      showToast(`Status do morador alterado para ${novoStatus}!`, 'success');
    } catch (err) {
      console.error('Erro ao alterar status do morador:', err);
      showToast('Falha ao alterar status do morador.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmDeleteMorador = async () => {
    if (!deletingMorador) return;
    const uid = deletingMorador.uid || deletingMorador.id;
    if (!uid) return;

    setIsDeletingMorador(true);
    try {
      await deleteMorador(uid);
      await loadAllData();
      setDeletingMorador(null);
      showToast('Morador desvinculado com sucesso!', 'info');
    } catch (err) {
      console.error('Erro ao remover morador:', err);
      showToast('Falha ao desvincular morador.', 'error');
    } finally {
      setIsDeletingMorador(false);
    }
  };

  const filteredAvisos = useMemo(() => {
    return filterAvisosParaSindica(avisos, searchAviso, filterAvisoCategoria, filterAvisoDestinatario);
  }, [avisos, searchAviso, filterAvisoCategoria, filterAvisoDestinatario]);

  const avisosStats = useMemo(() => {
    return calcAvisosStats(avisos);
  }, [avisos]);

  const filteredMoradores = useMemo(() => {
    return filterMoradores(moradores, searchMorador, filterMoradorStatus, filterMoradorTorre);
  }, [moradores, searchMorador, filterMoradorStatus, filterMoradorTorre]);

  const moradoresStats = useMemo(() => {
    return calcMoradoresStats(moradores);
  }, [moradores]);

  const unidadesOcupadas = useMemo(() => {
    const idsComMorador = new Set(activeUsers.map((u) => u.unidadeId).filter(Boolean));
    return unidades.filter((u) => idsComMorador.has(u.id)).length;
  }, [unidades, activeUsers]);

  const chamadosAtencao = useMemo(() => {
    return ocorrencias
      .filter((o) => o.status !== 'Resolvido')
      .sort((a, b) => {
        if (a.urgencia === 'Alta' && b.urgencia !== 'Alta') return -1;
        if (b.urgencia === 'Alta' && a.urgencia !== 'Alta') return 1;
        if (a.status === 'Aguardando Validação da Síndica' && b.status !== 'Aguardando Validação da Síndica') return -1;
        if (b.status === 'Aguardando Validação da Síndica' && a.status !== 'Aguardando Validação da Síndica') return 1;
        return getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt);
      })
      .slice(0, 4);
  }, [ocorrencias]);

  const abrirOcorrenciaDireta = (oc: any) => {
    setSelectedOcorrencia(oc);
    setActiveTab('ocorrencias');
  };

  const ultimoAviso = useMemo(() => {
    return avisos.length > 0 ? avisos[0] : null;
  }, [avisos]);

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
                <Button type="submit" disabled={gerando} className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer">
                  {gerando ? 'Gerando mapa predial...' : 'Gerar Estrutura Predial'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* Abas de Operação da Síndica com Visão Geral (Home) */
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
            {/* Barra de Navegação por Abas Horizontal Elegante */}
            <TabsList className="bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300/60 shadow-2xs flex items-center gap-1.5 overflow-x-auto scrollbar-none h-auto w-full justify-start">
              <TabsTrigger
                value="geral"
                className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-xs px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shrink-0"
              >
                <LayoutDashboard className="h-4 w-4" />
                Visão Geral
              </TabsTrigger>

              <TabsTrigger
                value="ocorrencias"
                className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-xs px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shrink-0"
              >
                <FileText className="h-4 w-4" />
                Ocorrências
                {ocorrencias.length > 0 && (
                  <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                    {ocorrencias.length}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="mural"
                className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-xs px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shrink-0"
              >
                <Megaphone className="h-4 w-4" />
                Mural
                {avisos.length > 0 && (
                  <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                    {avisos.length}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="moradores"
                className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-xs px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shrink-0"
              >
                <Users className="h-4 w-4" />
                Moradores
                {moradores.length > 0 && (
                  <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                    {moradores.length}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="unidades"
                className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-xs px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shrink-0"
              >
                <Building2 className="h-4 w-4" />
                Unidades
                {unidades.length > 0 && (
                  <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                    {unidades.length}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="aprovacoes"
                className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-xs px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shrink-0 relative"
              >
                <UserCheck className="h-4 w-4" />
                Aprovações
                {pendingUsers.length > 0 && (
                  <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
                    {pendingUsers.length}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="qrcode"
                className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-xs px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shrink-0"
              >
                <QrCode className="h-4 w-4" />
                Convites & QR Code
              </TabsTrigger>
            </TabsList>

            {/* Tab: Visão Geral (HOME DA APLICAÇÃO) */}
            <TabsContent value="geral" className="space-y-6 mt-0">
              {/* Hero Banner Executivo */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white border border-slate-800 shadow-sm relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-mono uppercase tracking-wider text-indigo-300 font-semibold">
                        Gestão Ativa
                      </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                      {condo?.nome || 'Condomínio'}
                    </h2>
                    <p className="text-xs text-slate-300 max-w-xl">
                      Painel centralizado com indicadores executivos, atalhos operacionais e resumo em tempo real do condomínio.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadAllData}
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-medium cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Atualizar Indicadores
                    </Button>
                  </div>
                </div>

                {/* Callouts de Alertas Prioritários na Home */}
                {(pendingUsers.length > 0 || ocorrenciasStats.aguardandoValidacao > 0) && (
                  <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pendingUsers.length > 0 && (
                      <div className="p-3 bg-amber-500/15 border border-amber-400/30 rounded-xl flex items-center justify-between text-xs text-amber-200">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-amber-400 shrink-0" />
                          <span><strong>{pendingUsers.length}</strong> morador(es) aguardando aprovação</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setActiveTab('aprovacoes')}
                          className="h-7 px-2.5 text-[11px] bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold cursor-pointer"
                        >
                          Revisar
                        </Button>
                      </div>
                    )}

                    {ocorrenciasStats.aguardandoValidacao > 0 && (
                      <div className="p-3 bg-purple-500/15 border border-purple-400/30 rounded-xl flex items-center justify-between text-xs text-purple-200">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-purple-300 shrink-0" />
                          <span><strong>{ocorrenciasStats.aguardandoValidacao}</strong> chamado(s) aguardando sua validação</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setActiveTab('ocorrencias')}
                          className="h-7 px-2.5 text-[11px] bg-purple-400 hover:bg-purple-300 text-purple-950 font-bold cursor-pointer"
                        >
                          Validar
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Grid dos 4 KPIs Executivos da Home (Interativos e Clicáveis) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1: Unidades */}
                <div
                  onClick={() => setActiveTab('unidades')}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer group space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unidades Mapeadas</span>
                    <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Building2 className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">{unidades.length}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      <span className="font-semibold text-indigo-600">{unidadesOcupadas}</span> ocupadas ({unidades.length > 0 ? Math.round((unidadesOcupadas / unidades.length) * 100) : 0}%)
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-indigo-600 group-hover:text-indigo-700">
                    <span>Ver mapa predial</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                {/* KPI 2: Moradores Ativos */}
                <div
                  onClick={() => setActiveTab('moradores')}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-emerald-300 hover:shadow-md transition-all duration-200 cursor-pointer group space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Moradores Ativos</span>
                    <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">{activeUsers.length}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {moradoresStats.inativos > 0 ? (
                        <span className="text-slate-500 font-medium">{moradoresStats.inativos} inativo(s) / suspenso(s)</span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Todos com acesso regular</span>
                      )}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-emerald-600 group-hover:text-emerald-700">
                    <span>Gerenciar cadastros</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                {/* KPI 3: Aprovações Pendentes */}
                <div
                  onClick={() => setActiveTab('aprovacoes')}
                  className={`bg-white rounded-2xl p-5 border shadow-2xs transition-all duration-200 cursor-pointer group space-y-3 ${
                    pendingUsers.length > 0
                      ? 'border-rose-200 hover:border-rose-400 hover:shadow-md bg-rose-50/10'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aguardando Aprovação</span>
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${
                      pendingUsers.length > 0
                        ? 'bg-rose-100 text-rose-700 group-hover:bg-rose-600 group-hover:text-white'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-800 group-hover:text-white'
                    }`}>
                      <UserCheck className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <p className={`text-3xl font-bold tracking-tight ${pendingUsers.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                      {pendingUsers.length}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {pendingUsers.length > 0 ? 'Requer validação de moradia' : 'Nenhuma solicitação pendente'}
                    </p>
                  </div>
                  <div className={`pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-medium ${
                    pendingUsers.length > 0 ? 'text-rose-600 group-hover:text-rose-700' : 'text-slate-600 group-hover:text-slate-800'
                  }`}>
                    <span>Abrir fila de liberação</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                {/* KPI 4: Chamados em Aberto */}
                <div
                  onClick={() => setActiveTab('ocorrencias')}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-amber-300 hover:shadow-md transition-all duration-200 cursor-pointer group space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chamados em Aberto</span>
                    <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                      <FileText className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">
                      {ocorrenciasStats.pendentes + ocorrenciasStats.emAtendimento + ocorrenciasStats.aguardandoValidacao}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      <span className="font-semibold text-emerald-600">{ocorrenciasStats.resolvidas}</span> resolvidos de {ocorrencias.length}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-amber-600 group-hover:text-amber-700">
                    <span>Ver atendimentos</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Barra de Ações Rápidas (Quick Actions) */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-600" /> Ações Rápidas:
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={openNovoAviso}
                    className="h-8 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Publicar no Mural
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('aprovacoes')}
                    className="h-8 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <UserCheck className="h-3.5 w-3.5 mr-1 text-slate-500" /> Fila de Aprovações ({pendingUsers.length})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(moradorLink, 'home')}
                    className="h-8 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    {copiedField === 'home' ? (
                      <><Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Link Copiado!</>
                    ) : (
                      <><Copy className="h-3.5 w-3.5 mr-1 text-slate-500" /> Copiar Link Convite</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Grid Operacional em 2 Colunas: Chamados Ativos e Mural/Convite */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Coluna Esquerda (7 colunas): Chamados Críticos & Pendentes */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">Atendimentos Prioritários</h3>
                      <p className="text-xs text-slate-500">Chamados em aberto que exigem despacho ou homologação.</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('ocorrencias')}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 cursor-pointer"
                    >
                      Ver todos ({ocorrencias.length}) <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>

                  {chamadosAtencao.length === 0 ? (
                    <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                      <p className="text-sm font-semibold text-slate-700">Tudo resolvido!</p>
                      <p className="text-xs text-slate-400">Não há ocorrências pendentes no condomínio neste momento.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chamadosAtencao.map((oc) => {
                        const stCfg = getStatusConfig(oc.status);
                        const precisaValidacao = oc.status === 'Aguardando Validação da Síndica';

                        return (
                          <div
                            key={oc.id}
                            className={`p-4 bg-white rounded-2xl border transition-all duration-150 shadow-2xs hover:shadow-xs space-y-2.5 ${
                              precisaValidacao ? 'border-purple-200 bg-purple-50/10' : 'border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm text-slate-900">{oc.titulo}</span>
                                {oc.urgencia === 'Alta' && (
                                  <Badge variant="destructive" className="bg-rose-100 text-rose-700 border-rose-200 text-[10px] font-bold py-0">
                                    Alta Prioridade
                                  </Badge>
                                )}
                              </div>
                              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${stCfg.bgClass} ${stCfg.textClass} ${stCfg.borderClass}`}>
                                {stCfg.label}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                              <div className="text-slate-500 flex items-center gap-1.5">
                                <span className="font-medium text-slate-700">{oc.unidadeNome || 'Geral'}</span>
                                <span>•</span>
                                <span>{oc.autorNome || 'Morador'}</span>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => abrirOcorrenciaDireta(oc)}
                                className={`h-7 px-2.5 text-xs font-semibold cursor-pointer ${
                                  precisaValidacao
                                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                              >
                                {precisaValidacao ? 'Validar & Fechar' : 'Ver Trilha & Despachar'}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Coluna Direita (5 colunas): Mural Recente & Mini QR Code */}
                <div className="lg:col-span-5 space-y-5">
                  {/* Card Mural */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Megaphone className="h-4 w-4 text-indigo-600" />
                        <h4 className="font-bold text-slate-900 text-sm">Último Comunicado</h4>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab('mural')}
                        className="text-xs font-semibold text-indigo-600 hover:bg-indigo-50 h-7 px-2 cursor-pointer"
                      >
                        Abrir Mural ({avisos.length}) <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>

                    {ultimoAviso ? (
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <Badge variant="outline" className="text-[10px] font-semibold bg-white">
                            {ultimoAviso.categoria || 'Geral'}
                          </Badge>
                          <span className="text-[11px] text-slate-400">
                            {formatarDataHora(ultimoAviso.createdAt)}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 text-xs">{ultimoAviso.titulo}</p>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {ultimoAviso.mensagem}
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400 text-xs space-y-2">
                        <p>Nenhum aviso publicado ainda no mural.</p>
                        <Button
                          size="sm"
                          onClick={openNovoAviso}
                          className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                        >
                          Criar Primeiro Comunicado
                        </Button>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </TabsContent>

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
                                className="text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                                disabled={actionLoading === u.id}
                                onClick={() => setRejectingMorador(u)}
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
              {unitModalOpen || editingUnit ? (
                <UnidadeEditorJanela
                  initialData={editingUnit}
                  saving={savingUnit}
                  errorMessage={unitFormError}
                  onSalvar={handleSaveUnit}
                  onVoltar={() => {
                    setUnitModalOpen(false);
                    setEditingUnit(null);
                    setUnitFormError('');
                  }}
                />
              ) : resetModalOpen ? (
                <RegerarEstruturaJanela
                  unidadesAtuaisCount={unidades.length}
                  resetting={resettingUnits}
                  onConfirmar={handleResetEstrutura}
                  onVoltar={() => setResetModalOpen(false)}
                />
              ) : renomearBlocoModalOpen ? (
                <RenomearBlocoJanela
                  availableTorres={availableTorres}
                  initialBloco={blocoAlvoRenomear || (availableTorres[0] ?? '')}
                  unitsCountByTorre={unitsCountByTorre}
                  renaming={isRenamingBloco}
                  onConfirmar={handleConfirmarRenameBloco}
                  onVoltar={() => {
                    setRenomearBlocoModalOpen(false);
                    setBlocoAlvoRenomear(null);
                  }}
                />
              ) : (
                <>
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
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium cursor-pointer"
                    >
                      <Plus className="h-4 w-4 mr-1.5" /> Nova Unidade
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setBlocoAlvoRenomear(filterTorre !== 'all' ? filterTorre : (availableTorres[0] ?? null));
                        setRenomearBlocoModalOpen(true);
                      }}
                      disabled={availableTorres.length === 0}
                      className="text-amber-700 border-amber-300 hover:bg-amber-50 font-medium cursor-pointer"
                      title={availableTorres.length === 0 ? 'Nenhum bloco cadastrado' : 'Renomear Bloco e atualizar todas as unidades em cascata'}
                    >
                      <Layers className="h-4 w-4 mr-1.5 text-amber-600" /> Renomear Bloco
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setResetModalOpen(true);
                      }}
                      className="text-slate-700 border-slate-300 hover:bg-slate-50 font-medium cursor-pointer"
                    >
                      <RefreshCw className="h-4 w-4 mr-1.5 text-indigo-600" /> Regerar Grade
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 bg-white rounded-b-xl space-y-4">
                  {/* Chips de Gestão Rápida dos Blocos Cadastrados */}
                  {availableTorres.length > 0 && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mr-1">
                        <Layers className="h-3.5 w-3.5 text-indigo-600" /> Blocos:
                      </span>
                      {availableTorres.map((t) => {
                        const count = unitsCountByTorre[t] ?? 0;
                        const isSelectedInFilter = filterTorre === t;
                        return (
                          <div
                            key={t}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                              isSelectedInFilter
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                                : 'bg-white border-slate-200 text-slate-700 shadow-2xs hover:border-slate-300'
                            }`}
                          >
                            <span className="font-semibold">{t}</span>
                            <span className="text-[11px] text-slate-400">({count} un)</span>
                            <button
                              type="button"
                              title={`Renomear ${t} em cascata`}
                              onClick={() => {
                                setBlocoAlvoRenomear(t);
                                setRenomearBlocoModalOpen(true);
                              }}
                              className="text-slate-400 hover:text-amber-600 p-0.5 rounded hover:bg-amber-50 cursor-pointer ml-0.5 transition-colors"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

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
            </>
          )}
        </TabsContent>

        {/* Tab 2: Ocorrências do Condomínio (Redesenhado: Limpo, sem poluição visual e com despacho) */}
        <TabsContent value="ocorrencias" className="mt-4 space-y-4">
          {selectedOcorrencia ? (
            <OcorrenciaTimelineJanela
              ocorrencia={selectedOcorrencia}
              userRole="sindica"
              userName={appUser?.nome || 'Síndica'}
              onVoltar={() => setSelectedOcorrencia(null)}
              onDespachar={handleDespacharOcorrencia}
            />
          ) : (
            <>
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
            </>
          )}
        </TabsContent>

            {/* Tab: Mural de Avisos da Síndica */}
            <TabsContent value="mural" className="mt-4 space-y-4">
              {isCriandoAviso ? (
                <NovaPublicacaoJanela
                  key={editingAviso?.id || 'janela-nova-publicacao'}
                  initialData={editingAviso}
                  onVoltar={() => {
                    setIsCriandoAviso(false);
                    setEditingAviso(null);
                  }}
                  onSave={handleSaveAviso}
                  availableTorres={availableTorres}
                  condominioId={appUser?.condominioId || ''}
                  criadoPorNome={appUser?.nome || 'Síndica'}
                  criadoPorUid={appUser?.uid || ''}
                />
              ) : (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="bg-white rounded-t-xl border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-indigo-600" /> Mural de Avisos e Comunicados
                      </CardTitle>
                      <CardDescription>
                        Gerencie comunicados oficiais do condomínio com segmentação por bloco e assistência inteligente de tom.
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={openNovoAviso}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium self-start sm:self-auto cursor-pointer"
                    >
                      <Plus className="h-4 w-4 mr-1.5" /> Novo Comunicado
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4 bg-white rounded-b-xl space-y-4">
                    {/* Barra de Filtros e Métricas do Mural */}
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="relative flex-1 max-w-md">
                        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                        <Input
                          placeholder="Buscar no mural por título, mensagem ou bloco..."
                          value={searchAviso}
                          onChange={(e) => setSearchAviso(e.target.value)}
                          className="pl-9 text-xs h-9 bg-slate-50/70 border-slate-200"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={filterAvisoCategoria}
                          onChange={(e) => setFilterAvisoCategoria(e.target.value)}
                          className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="all">Todas as Categorias</option>
                          <option value="Geral">Geral</option>
                          <option value="Manutenção">Manutenção</option>
                          <option value="Assembleia">Assembleia</option>
                          <option value="Segurança">Segurança</option>
                          <option value="Convivência">Convivência</option>
                        </select>

                        <select
                          value={filterAvisoDestinatario}
                          onChange={(e) => setFilterAvisoDestinatario(e.target.value)}
                          className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="all">Todos os Públicos</option>
                          <option value="todos">Geral (Todos)</option>
                          <option value="bloco">Segmentado por Bloco</option>
                        </select>

                        <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200 text-xs text-slate-500">
                          <span className="font-medium text-slate-700">{avisosStats.total}</span> total
                          <span className="text-slate-300">•</span>
                          <span className="font-medium text-indigo-600">{avisosStats.gerais}</span> gerais
                          <span className="text-slate-300">•</span>
                          <span className="font-medium text-purple-600">{avisosStats.blocos}</span> por bloco
                        </div>
                      </div>
                    </div>

                    {filteredAvisos.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 space-y-3">
                        <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
                          <Megaphone className="h-6 w-6" />
                        </div>
                        <p className="font-semibold text-slate-700">
                          {avisos.length === 0
                            ? 'Nenhum comunicado publicado ainda'
                            : 'Nenhum comunicado corresponde aos filtros selecionados'}
                        </p>
                        <p className="text-sm max-w-md mx-auto">
                          {avisos.length === 0
                            ? 'Utilize o mural para avisar sobre manutenções preventivas, assembleias, regras de convivência ou recados gerais.'
                            : 'Tente ajustar os termos de busca ou filtros de categoria e público-alvo.'}
                        </p>
                        {avisos.length === 0 && (
                          <Button
                            size="sm"
                            onClick={openNovoAviso}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white mt-2 cursor-pointer"
                          >
                            <Plus className="h-4 w-4 mr-1.5" /> Criar Primeiro Comunicado
                          </Button>
                        )}
                      </div>
                    ) : (
                    <div className="space-y-4">
                      {filteredAvisos.map((av) => {
                        const catConfig = getCategoriaAvisoConfig(av.categoria);
                        const isBloco = av.destinatarioTipo === 'bloco' && av.blocoDestino;
                        const dataFormatada = formatarDataHora(av.createdAt);

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
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 mr-1">{dataFormatada}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditAviso(av)}
                                  className="h-7 px-2.5 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 cursor-pointer"
                                  title="Editar comunicado"
                                  aria-label="Editar comunicado"
                                >
                                  <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setDeletingAviso(av)}
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
                              {av.updatedAt && (
                                <span className="text-[11px] text-slate-400 italic">
                                  Editado recentemente
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
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
                      className="w-full text-xs text-slate-500 hover:text-indigo-600 cursor-pointer"
                      onClick={() => setRotateQrModalOpen(true)}
                    >
                      <RefreshCw className="mr-1.5 h-3 w-3" /> Gerar novo código
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab: Gestão Completa de Moradores */}
            <TabsContent value="moradores" className="mt-4 space-y-4">
              {editingMorador ? (
                <MoradorEditorJanela
                  morador={editingMorador}
                  unidades={unidades}
                  saving={savingMorador}
                  onVoltar={() => setEditingMorador(null)}
                  onSalvar={handleSaveMorador}
                />
              ) : (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="bg-white rounded-t-xl border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Users className="h-5 w-5 text-indigo-600" /> Gestão Completa de Moradores
                      </CardTitle>
                      <CardDescription>
                        Controle de acesso, histórico, vinculação de apartamentos e status de cada residente do condomínio.
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 bg-white rounded-b-xl space-y-4">
                    {/* Cards de Métricas dos Moradores */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Cadastrado</p>
                          <p className="text-xl font-bold text-slate-900 mt-0.5">{moradoresStats.total}</p>
                        </div>
                        <div className="h-9 w-9 rounded-lg bg-slate-200/80 text-slate-700 flex items-center justify-center">
                          <Users className="h-4 w-4" />
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">Acesso Ativo</p>
                          <p className="text-xl font-bold text-emerald-800 mt-0.5">{moradoresStats.ativos}</p>
                        </div>
                        <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <UserCheck className="h-4 w-4" />
                        </div>
                      </div>

                      <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-medium text-amber-700 uppercase tracking-wider">Aguardando Validação</p>
                          <p className="text-xl font-bold text-amber-800 mt-0.5">{moradoresStats.pendentes}</p>
                        </div>
                        <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                          <Clock className="h-4 w-4" />
                        </div>
                      </div>

                      <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-medium text-rose-700 uppercase tracking-wider">Inativo / Suspenso</p>
                          <p className="text-xl font-bold text-rose-800 mt-0.5">{moradoresStats.inativos}</p>
                        </div>
                        <div className="h-9 w-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                          <UserX className="h-4 w-4" />
                        </div>
                      </div>
                    </div>

                    {/* Barra de Filtros e Busca */}
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
                      <div className="relative flex-1 max-w-md">
                        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                        <Input
                          placeholder="Buscar por nome, e-mail, telefone ou apartamento..."
                          value={searchMorador}
                          onChange={(e) => setSearchMorador(e.target.value)}
                          className="pl-9 text-xs h-9 bg-slate-50/70 border-slate-200"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={filterMoradorStatus}
                          onChange={(e) => setFilterMoradorStatus(e.target.value)}
                          className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="all">Todos os Status</option>
                          <option value="ativo">Apenas Ativos</option>
                          <option value="pendente">Apenas Pendentes</option>
                          <option value="inativo">Apenas Inativos</option>
                        </select>

                        {availableTorres.length > 0 && (
                          <select
                            value={filterMoradorTorre}
                            onChange={(e) => setFilterMoradorTorre(e.target.value)}
                            className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                          >
                            <option value="all">Todas as Torres/Blocos</option>
                            {availableTorres.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Tabela de Moradores */}
                    {filteredMoradores.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 space-y-2">
                        <Users className="h-10 w-10 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-700">
                          {moradores.length === 0 ? 'Nenhum morador cadastrado ainda.' : 'Nenhum morador encontrado com os filtros aplicados.'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {moradores.length === 0
                            ? 'Compartilhe o QR Code na portaria ou no grupo oficial para que os moradores se registrem.'
                            : 'Tente limpar a busca ou selecionar outro status/bloco.'}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-200 overflow-hidden">
                        <Table>
                          <TableHeader className="bg-slate-50">
                            <TableRow>
                              <TableHead>Morador</TableHead>
                              <TableHead>Apartamento</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredMoradores.map((u) => {
                              const st = resolveMoradorStatus(u);
                              const stConfig = getMoradorStatusConfig(st);
                              const uid = u.uid || u.id || '';
                              const isLoadingItem = actionLoading === uid;

                              return (
                                <TableRow key={uid} className="hover:bg-slate-50/60 transition-colors">
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold border border-indigo-100">
                                        {(u.nome || 'M').charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <p className="font-semibold text-slate-900 text-sm">{u.nome || 'Nome não informado'}</p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                          <span>{u.email}</span>
                                          {u.telefone && (
                                            <>
                                              <span className="text-slate-300">•</span>
                                              <span className="text-slate-600 font-medium">{u.telefone}</span>
                                            </>
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 text-xs font-medium">
                                      <Home className="h-3 w-3 mr-1 text-slate-400" />
                                      {u.unidadeNome || 'Não vinculado'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={`text-xs font-semibold ${stConfig.badgeClass} flex items-center gap-1.5 w-fit`}>
                                      <span className={`h-1.5 w-1.5 rounded-full ${stConfig.dotClass}`} />
                                      {stConfig.label}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {st === 'pendente' && (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleQuickStatusChange(uid, 'ativo')}
                                            disabled={isLoadingItem}
                                            className="h-7 px-2 text-xs font-semibold text-emerald-700 border-emerald-200 bg-emerald-50/40 hover:bg-emerald-100 cursor-pointer"
                                            title="Aprovar e Liberar Acesso"
                                          >
                                            <Check className="h-3.5 w-3.5 mr-1" /> Aprovar
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setRejectingMorador(u)}
                                            disabled={isLoadingItem}
                                            className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50 cursor-pointer"
                                            title="Recusar Acesso"
                                          >
                                            <X className="h-3.5 w-3.5 mr-1" /> Recusar
                                          </Button>
                                        </>
                                      )}

                                      {st === 'ativo' && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleQuickStatusChange(uid, 'inativo')}
                                          disabled={isLoadingItem}
                                          className="h-7 px-2 text-xs text-slate-500 hover:text-amber-700 hover:bg-amber-50 cursor-pointer"
                                          title="Suspender Acesso Temporariamente"
                                        >
                                          <UserX className="h-3.5 w-3.5 mr-1 text-amber-600" /> Suspender
                                        </Button>
                                      )}

                                      {st === 'inativo' && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleQuickStatusChange(uid, 'ativo')}
                                          disabled={isLoadingItem}
                                          className="h-7 px-2 text-xs text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                                          title="Reativar Acesso do Morador"
                                        >
                                          <UserCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Reativar
                                        </Button>
                                      )}

                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openEditMorador(u)}
                                        disabled={isLoadingItem}
                                        className="h-7 px-2.5 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 cursor-pointer"
                                        title="Editar Dados Cadastrais e Unidade"
                                      >
                                        <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                                      </Button>

                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setDeletingMorador(u)}
                                        disabled={isLoadingItem}
                                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                        title="Excluir Morador do Condomínio"
                                        aria-label="Excluir Morador"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
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
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Modal: Confirmar Exclusão de Unidade (Mantido conforme regra de exceção de ação destrutiva) */}
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

        {/* Modal: Confirmar Exclusão de Comunicado do Mural */}
        {deletingAviso && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Remover Comunicado</h3>
                  <p className="text-xs text-slate-500">Mural de Avisos</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <p className="text-xs font-bold text-slate-800">{deletingAviso.titulo}</p>
                <p className="text-xs text-slate-600 line-clamp-2">{deletingAviso.mensagem}</p>
              </div>

              <p className="text-xs text-slate-600">
                Tem certeza de que deseja excluir este aviso? Ele deixará de aparecer para todos os moradores imediatamente.
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeletingAviso(null)}
                  disabled={isDeletingAviso}
                  className="cursor-pointer text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmDeleteAviso}
                  disabled={isDeletingAviso}
                  className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer text-xs"
                >
                  {isDeletingAviso ? 'Excluindo...' : 'Sim, Excluir Comunicado'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Confirmar Exclusão de Morador */}
        {deletingMorador && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center">
                  <UserX className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Desvincular Morador</h3>
                  <p className="text-xs text-slate-500">Gestão Cadastral</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <p className="text-xs font-bold text-slate-800">{deletingMorador.nome || 'Morador'}</p>
                <p className="text-xs text-slate-600">{deletingMorador.email}</p>
                <p className="text-xs text-indigo-700 font-medium">{deletingMorador.unidadeNome || 'Sem unidade vinculada'}</p>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Tem certeza de que deseja remover o cadastro deste morador? O usuário perderá o acesso a chamados e avisos do condomínio.
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeletingMorador(null)}
                  disabled={isDeletingMorador}
                  className="cursor-pointer text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmDeleteMorador}
                  disabled={isDeletingMorador}
                  className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer text-xs"
                >
                  {isDeletingMorador ? 'Removendo...' : 'Sim, Remover Morador'}
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* Modal: Confirmar Geração de Novo QR Code (Substitui confirm do browser) */}
        {rotateQrModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 text-amber-600">
                <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Gerar Novo QR Code</h3>
                  <p className="text-xs text-slate-500">Acesso e Convite de Moradores</p>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
                <p className="text-xs font-semibold text-amber-900">
                  Atenção à invalidação do código anterior:
                </p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Ao gerar um novo código, o QR Code e o link anteriores deixarão de funcionar imediatamente. Certifique-se de substituir materiais impressos ou links compartilhados nos grupos oficiais.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRotateQrModalOpen(false)}
                  disabled={rotatingQr}
                  className="cursor-pointer text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmRotateCode}
                  disabled={rotatingQr}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer text-xs flex items-center gap-1.5"
                >
                  {rotatingQr ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Gerando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3.5 w-3.5" /> Sim, Gerar Novo QR Code
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Confirmar Recusa de Morador (Substitui confirm do browser) */}
        {rejectingMorador && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center">
                  <UserX className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Recusar Acesso</h3>
                  <p className="text-xs text-slate-500">Solicitação de Cadastro</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <p className="text-xs font-bold text-slate-800">{rejectingMorador.nome || 'Morador'}</p>
                <p className="text-xs text-slate-600">{rejectingMorador.email}</p>
                <p className="text-xs text-indigo-700 font-medium">{rejectingMorador.unidadeNome || 'Sem unidade vinculada'}</p>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Tem certeza de que deseja recusar a solicitação deste morador? O usuário não terá permissão para visualizar ocorrências ou avisos do condomínio.
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRejectingMorador(null)}
                  disabled={isRejectingMorador}
                  className="cursor-pointer text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmRejectMorador}
                  disabled={isRejectingMorador}
                  className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer text-xs"
                >
                  {isRejectingMorador ? 'Recusando...' : 'Confirmar Recusa'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Notificação Toast Flutuante Integrada (Substitui alert do browser) */}
        {feedbackToast && (
          <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
                feedbackToast.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : feedbackToast.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-800'
              }`}
            >
              {feedbackToast.type === 'error' ? (
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              )}
              <span>{feedbackToast.text}</span>
              <button
                type="button"
                onClick={() => setFeedbackToast(null)}
                className="ml-2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                aria-label="Fechar notificação"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

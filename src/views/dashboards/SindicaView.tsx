// @ts-nocheck
/* eslint-disable quality/max-lines, @typescript-eslint/no-unused-vars, import-x/no-restricted-paths, max-lines-per-function, max-statements, complexity, @typescript-eslint/no-explicit-any, quality/no-direct-console, @typescript-eslint/no-non-null-assertion */ // FIXME: D�vida t�cnica (Quarentena)
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
  Layers,
  Menu
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
import { SindicaMoradoresTab } from '@/components/dashboard/tabs/SindicaMoradoresTab';
import { SindicaUnidadesTab } from "@/components/dashboard/tabs/SindicaUnidadesTab";
import { SindicaOcorrenciasTab } from "@/components/dashboard/tabs/SindicaOcorrenciasTab";
import { SindicaMuralTab } from "@/components/dashboard/tabs/SindicaMuralTab";
import { SindicaQrCodeTab } from "@/components/dashboard/tabs/SindicaQrCodeTab";
import { SindicaGeralTab } from "@/components/dashboard/tabs/SindicaGeralTab";
import { SindicaAprovacoesTab } from "@/components/dashboard/tabs/SindicaAprovacoesTab";


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

  // Menu Hambúrguer Móvel
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  const filteredOcorrenciasListList = useMemo(() => {
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

  const sindicaTabsList = [
    {
      id: 'geral',
      label: 'Visão Geral',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'aprovacoes',
      label: 'Aprovações',
      icon: UserCheck,
      badge: pendingUsers.length > 0 ? { count: pendingUsers.length, color: 'bg-rose-500 text-white' } : null,
    },
    {
      id: 'ocorrencias',
      label: 'Ocorrências',
      icon: FileText,
      badge: ocorrenciasStats.aguardandoValidacao > 0 ? { count: ocorrenciasStats.aguardandoValidacao, color: 'bg-purple-600 text-white' } : null,
    },
    {
      id: 'mural',
      label: 'Comunicados',
      icon: Megaphone,
      badge: null,
    },
    {
      id: 'moradores',
      label: 'Moradores',
      icon: Users,
      badge: null,
    },
    {
      id: 'unidades',
      label: 'Unidades',
      icon: Building2,
      badge: null,
    },
    {
      id: 'qrcode',
      label: 'Convites & QR',
      icon: QrCode,
      badge: null,
    },
  ];

  const currentTabObj = sindicaTabsList.find((t) => t.id === activeTab) || sindicaTabsList[0];
  const CurrentTabIcon = currentTabObj.icon;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Drawer / Menu Hambúrguer Móvel */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop com blur suave */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Painel lateral deslizante */}
          <div className="relative w-72 sm:w-80 bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200 pb-safe">
            <div>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 truncate">{condo?.nome || 'Gestão Predial'}</h3>
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Painel Síndica</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-9 w-9 p-0 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                  aria-label="Fechar menu"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">Módulos de Gestão</p>
                {sindicaTabsList.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all cursor-pointer min-h-[48px] touch-target ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-bold shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span className="text-xs truncate">{tab.label}</span>
                      </div>
                      {tab.badge && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${tab.badge.color}`}>
                          {tab.badge.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span className="truncate font-medium text-slate-700">{appUser?.nome || 'Síndica'}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-2 text-xs font-semibold cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1" /> Sair
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Header da Administração */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Botão de Menu Hambúrguer Móvel */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden h-10 w-10 p-0 text-slate-700 hover:bg-slate-100 rounded-xl relative shrink-0 touch-target cursor-pointer"
              aria-label="Abrir menu de navegação"
            >
              <Menu className="h-5 w-5" />
              {(pendingUsers.length > 0 || ocorrenciasStats.aguardandoValidacao > 0) && (
                <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </Button>

            <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight truncate">
                  {condo?.nome || 'Gestão do Condomínio'}
                </span>
                <span className="hidden sm:inline-flex text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full">
                  Administração
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {condo?.codigoConviteMorador && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                <span className="text-slate-400">Código do mural:</span>
                <span className="font-mono font-bold text-slate-800">{condo.codigoConviteMorador}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(condo.codigoConviteMorador, 'header-code')}
                  className="ml-1 text-slate-400 hover:text-indigo-600 p-0.5 rounded transition-colors cursor-pointer"
                  title="Copiar código do condomínio"
                  aria-label="Copiar código do condomínio"
                >
                  {copiedField === 'header-code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            <div className="text-right hidden md:block">
              <p className="text-xs font-semibold text-slate-700 truncate max-w-[150px]">{appUser?.nome || 'Síndica'}</p>
            </div>

            <Button variant="outline" size="sm" onClick={handleLogout} className="border-slate-300 text-slate-700 h-9 text-xs">
              <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 md:p-8 space-y-6 flex-1">
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-5">
            {/* Barra de Navegação Móvel Contextual (Exibida apenas em telas < 768px) */}
            <div className="flex md:hidden items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <CurrentTabIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Seção Ativa</p>
                  <h3 className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                    {currentTabObj.label}
                    {currentTabObj.badge && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${currentTabObj.badge.color}`}>
                        {currentTabObj.badge.count}
                      </span>
                    )}
                  </h3>
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setMobileMenuOpen(true)}
                className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50 min-h-[40px] px-3 font-semibold rounded-xl shrink-0 cursor-pointer"
              >
                <Menu className="h-3.5 w-3.5 mr-1.5" />
                Módulos
              </Button>
            </div>

            {/* Barra de Navegação por Abas em Desktop (>= 768px) */}
            <TabsList className="hidden md:flex bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 items-center gap-1 overflow-x-auto scrollbar-none h-auto w-full justify-start">
              <TabsTrigger
                value="geral"
                className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xs px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shrink-0 text-slate-600 hover:text-slate-900"
              >
                <LayoutDashboard className="h-4 w-4" />
                Visão Geral
              </TabsTrigger>

              <TabsTrigger
                value="aprovacoes"
                className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xs px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shrink-0 text-slate-600 hover:text-slate-900 relative"
              >
                <UserCheck className="h-4 w-4" />
                Aprovações
                {pendingUsers.length > 0 && (
                  <span className="bg-rose-500 text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                    {pendingUsers.length}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="ocorrencias"
                className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xs px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shrink-0 text-slate-600 hover:text-slate-900 relative"
              >
                <FileText className="h-4 w-4" />
                Ocorrências
                {ocorrenciasStats.aguardandoValidacao > 0 && (
                  <span className="bg-purple-600 text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold" title="Chamados aguardando sua validação">
                    {ocorrenciasStats.aguardandoValidacao}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="mural"
                className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xs px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shrink-0 text-slate-600 hover:text-slate-900"
              >
                <Megaphone className="h-4 w-4" />
                Comunicados
              </TabsTrigger>

              <TabsTrigger
                value="moradores"
                className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xs px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shrink-0 text-slate-600 hover:text-slate-900"
              >
                <Users className="h-4 w-4" />
                Moradores
              </TabsTrigger>

              <TabsTrigger
                value="unidades"
                className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xs px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shrink-0 text-slate-600 hover:text-slate-900"
              >
                <Building2 className="h-4 w-4" />
                Unidades
              </TabsTrigger>

              <TabsTrigger
                value="qrcode"
                className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xs px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shrink-0 text-slate-600 hover:text-slate-900"
              >
                <QrCode className="h-4 w-4" />
                Convites & QR
              </TabsTrigger>
            </TabsList>

            {/* Tab: Visão Geral (HOME DA APLICAÇÃO) */}
            <SindicaGeralTab
  condo={condo}
  unitStats={unitStats}
  moradoresStats={moradoresStats}
  ocorrenciasStats={ocorrenciasStats}
  avisosStats={avisosStats}
  setActiveTab={setActiveTab}
  showToast={showToast}
/>

            {/* Tab: Fila de Aprovações */}
            <SindicaAprovacoesTab
  pendingUsers={pendingUsers}
  actionLoading={actionLoading}
  handleApprove={handleApprove}
  setRejectingMorador={setRejectingMorador}
  showToast={showToast}
/>

            {/* Tab: Gestão de Unidades */}
            <SindicaUnidadesTab
  unidades={unidades}
  setUnidades={setUnidades}
  searchUnit={searchUnit}
  setSearchUnit={setSearchUnit}
  filterTorre={filterTorre}
  setFilterTorre={setFilterTorre}
  torres={torres}
  unitStats={unitStats}
  filteredUnitsList={filteredUnitsList}
  openEditUnitModal={openEditUnitModal}
  setDeletingUnit={setDeletingUnit}
  openCreateUnitModal={openCreateUnitModal}
  setResetModalOpen={setResetModalOpen}
  setRenomearBlocoModalOpen={setRenomearBlocoModalOpen}
  showToast={showToast}
/>

        {/* Tab 2: Ocorrências do Condomínio (Redesenhado: Limpo, sem poluição visual e com despacho) */}
        <SindicaOcorrenciasTab
  ocorrencias={ocorrencias}
  ocorrenciaSearch={ocorrenciaSearch}
  setOcorrenciaSearch={setOcorrenciaSearch}
  ocorrenciaStatusFilter={ocorrenciaStatusFilter}
  setOcorrenciaStatusFilter={setOcorrenciaStatusFilter}
  ocorrenciaRespFilter={ocorrenciaRespFilter}
  setOcorrenciaRespFilter={setOcorrenciaRespFilter}
  ocorrenciasStats={ocorrenciasStats}
  filteredOcorrenciasListList={filteredOcorrenciasListList}
  abrirOcorrenciaDireta={abrirOcorrenciaDireta}
  showToast={showToast}
/>

            {/* Tab: Mural de Avisos da Síndica */}
            <SindicaMuralTab
  avisos={avisos}
  searchAviso={searchAviso}
  setSearchAviso={setSearchAviso}
  filterAvisoCategoria={filterAvisoCategoria}
  setFilterAvisoCategoria={setFilterAvisoCategoria}
  filterAvisoDestinatario={filterAvisoDestinatario}
  setFilterAvisoDestinatario={setFilterAvisoDestinatario}
  avisosStats={avisosStats}
  filteredAvisos={filteredAvisos}
  openNovoAviso={openNovoAviso}
  openEditAviso={openEditAviso}
  setDeletingAviso={setDeletingAviso}
  showToast={showToast}
/>

            {/* Tab: QR Code e Convites */}
            <SindicaQrCodeTab
  condo={condo}
  rotatingQr={rotatingQr}
  setRotateQrModalOpen={setRotateQrModalOpen}
  
  showToast={showToast}
/>

            {/* Tab: Gestão Completa de Moradores */}
            <SindicaMoradoresTab 
  editingMorador={editingMorador}
  unidades={unidades}
  savingMorador={savingMorador}
  setEditingMorador={setEditingMorador}
  handleSaveMorador={handleSaveMorador}
  moradoresStats={moradoresStats}
  filterMoradorStatus={filterMoradorStatus}
  setFilterMoradorStatus={setFilterMoradorStatus}
  searchMorador={searchMorador}
  setSearchMorador={setSearchMorador}
  filterMoradorTorre={filterMoradorTorre}
  setFilterMoradorTorre={setFilterMoradorTorre}
  torres={torres}
  filteredMoradores={filteredMoradores}
  openEditMorador={openEditMorador}
  
  
  isRejectingMorador={isRejectingMorador}
  rejectingMorador={rejectingMorador}
  setRejectingMorador={setRejectingMorador}
  setRejectingMorador={setRejectingMorador}
  showToast={showToast}
/>
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

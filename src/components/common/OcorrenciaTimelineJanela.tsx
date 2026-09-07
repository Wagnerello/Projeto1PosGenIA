import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  Building2,
  FileText,
  User,
  Sparkles,
} from 'lucide-react';
import {
  getStatusConfig,
  getResponsavelConfig,
  canCloseOcorrencia,
  canReopenOcorrencia,
  isOcorrenciaFechada,
  type ResponsavelOcorrencia,
  type StatusOcorrencia,
} from '@/lib/ocorrencia-helpers';
import { formatarDataHora } from '@/lib/date-utils';
import { OcorrenciaTimelineForm } from './OcorrenciaTimelineForm';
import { OcorrenciaTimelineHistory } from './OcorrenciaTimelineHistory';

export interface OcorrenciaTimelineJanelaProps {
  ocorrencia: any;
  userRole: string;
  userName?: string;
  onVoltar: () => void;
  onDespachar?: (params: {
    relato: string;
    responsavelNovo: ResponsavelOcorrencia;
    statusNovo: StatusOcorrencia;
    tipo?: 'despacho' | 'conclusao_equipe' | 'encerramento' | 'reabertura';
  }) => Promise<void>;
}

export function OcorrenciaTimelineJanela({
  ocorrencia,
  userRole,
  onVoltar,
  onDespachar,
}: OcorrenciaTimelineJanelaProps) {
  const isSindica = canCloseOcorrencia(userRole);
  const canReopen = canReopenOcorrencia(userRole);
  const isFechada = isOcorrenciaFechada(ocorrencia?.status);
  const statusCfg = getStatusConfig(ocorrencia?.status);
  const respCfg = getResponsavelConfig(ocorrencia?.responsavelAtual);

  const [relato, setRelato] = useState('');
  const [novoResponsavel, setNovoResponsavel] = useState<ResponsavelOcorrencia>(
    (ocorrencia?.responsavelAtual as ResponsavelOcorrencia) || 'Síndica'
  );
  const [novoStatus, setNovoStatus] = useState<StatusOcorrencia>(
    (ocorrencia?.status as StatusOcorrencia) || 'Pendente'
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmarEncerramentoModal, setConfirmarEncerramentoModal] = useState(false);

  // Estados para reabertura exclusiva da síndica
  const [reabrirFormOpen, setReabrirFormOpen] = useState(false);
  const [motivoReabertura, setMotivoReabertura] = useState('');
  const [responsavelReabertura, setResponsavelReabertura] = useState<ResponsavelOcorrencia>('Síndica');

  if (!ocorrencia) return null;

  const historico = Array.isArray(ocorrencia.historico) ? ocorrencia.historico : [];
  const autorNome = ocorrencia.autorNome || ocorrencia.moradorNome || 'Não informado';
  const unidadeNome = ocorrencia.unidadeNome || ocorrencia.unidade || 'N/A';
  const dataCriacao = ocorrencia.createdAt || ocorrencia.dataAbertura;

  const handleEnviarDespacho = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relato.trim()) {
      setErrorMsg('Escreva um relato ou instrução para atualizar a trilha do atendimento.');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    try {
      if (onDespachar) {
        await onDespachar({
          relato: relato.trim(),
          responsavelNovo: novoResponsavel,
          statusNovo: novoStatus,
          tipo: novoStatus === 'Resolvido' ? 'encerramento' : 'despacho',
        });
      }
      setRelato('');
      onVoltar();
    } catch (err) {
      console.error(err);
      setErrorMsg('Falha ao registrar despacho. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizarEfetivo = () => {
    if (!isSindica) {
      setErrorMsg('Somente a síndica ou administradora pode homologar e encerrar o chamado.');
      return;
    }
    setConfirmarEncerramentoModal(true);
  };

  const handleExecutarEncerramento = async () => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      if (onDespachar) {
        await onDespachar({
          relato: relato.trim() || 'Atendimento conferido e homologado pela administração. Chamado encerrado.',
          responsavelNovo: 'Síndica',
          statusNovo: 'Resolvido',
          tipo: 'encerramento',
        });
      }
      setRelato('');
      setConfirmarEncerramentoModal(false);
      onVoltar();
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao homologar encerramento.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReabrirOcorrencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivoReabertura.trim()) {
      setErrorMsg('Informe a justificativa para reabrir a ocorrência.');
      return;
    }
    if (!canReopen) {
      setErrorMsg('Apenas a síndica ou administradora pode reabrir um atendimento encerrado.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      if (onDespachar) {
        await onDespachar({
          relato: `[CHAMADO REABERTO PELO ADMINISTRADOR]\nMotivo: ${motivoReabertura.trim()}`,
          responsavelNovo: responsavelReabertura,
          statusNovo: 'Em Atendimento',
          tipo: 'reabertura',
        });
      }
      setReabrirFormOpen(false);
      setMotivoReabertura('');
      onVoltar();
    } catch (err) {
      console.error(err);
      setErrorMsg('Falha ao reabrir ocorrência.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200 pb-12">
      {/* HEADER DA PÁGINA */}
      <div className="p-4 sm:p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={onVoltar}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl shrink-0 border-slate-200 hover:bg-slate-100 text-slate-700"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-[11px] font-mono">
                Protocolo #{ocorrencia.id ? String(ocorrencia.id).slice(0, 8).toUpperCase() : 'NOVO'}
              </Badge>
              {ocorrencia.isEmergencia && (
                <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50 text-[10px] sm:text-xs px-2 shadow-none font-bold">
                  <AlertTriangle className="mr-1 h-3 w-3 fill-red-700 text-red-100" />
                  EMERGÊNCIA
                </Badge>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight line-clamp-2">
              {ocorrencia.titulo}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          <Badge variant="outline" className={`${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass} px-3 py-1 text-xs font-bold whitespace-nowrap shadow-xs`}>
            {statusCfg.label}
          </Badge>
          <Badge variant="outline" className={`${respCfg.bgClass} ${respCfg.textClass} ${respCfg.borderClass} px-3 py-1 text-xs font-bold whitespace-nowrap shadow-xs`}>
            {respCfg.label}
          </Badge>
        </div>
      </div>

      {/* MENSAGEM DE ERRO SE HOUVER */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm font-semibold text-red-800 leading-relaxed">{errorMsg}</p>
        </div>
      )}

      {/* GRID PRINCIPAL: DADOS DA ABERTURA + PAINEL DE DESPACHO E TRILHA DE HISTÓRICO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* COLUNA ESQUERDA: Detalhes Iniciais + Formulário de Despacho (Exclusivo da Administração) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-4">
              <FileText className="h-5 w-5 text-indigo-600" />
              Dados da Abertura
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Aberto por</span>
                <div className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                  <User className="h-4 w-4 text-slate-400" />
                  {autorNome}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1 font-medium bg-slate-50 w-fit px-2.5 py-1 rounded-md border border-slate-100">
                  <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                  Unidade: {unidadeNome} {ocorrencia.bloco ? `- ${ocorrencia.bloco}` : ''}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Data de Abertura</span>
                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <Clock className="h-4 w-4 text-slate-400" />
                  {formatarDataHora(dataCriacao)}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Categoria (Triagem)</span>
                <div className="text-sm font-semibold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg w-fit border border-slate-200">
                  {ocorrencia.categoria || 'Não classificada'}
                </div>
              </div>

              {ocorrencia.iaJustificativa && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    Triagem Inteligente (IA)
                  </span>
                  <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                    {ocorrencia.iaJustificativa}
                  </p>
                </div>
              )}

              {ocorrencia.descricao && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Relato Inicial do Morador</span>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-4 leading-relaxed border border-slate-100">
                    "{ocorrencia.descricao}"
                  </p>
                </div>
              )}
            </div>
          </div>

          <OcorrenciaTimelineForm
            isSindica={isSindica}
            canReopen={canReopen}
            isFechada={isFechada}
            statusCfg={statusCfg}
            respCfg={respCfg}
            relato={relato}
            setRelato={setRelato}
            novoResponsavel={novoResponsavel}
            setNovoResponsavel={setNovoResponsavel}
            novoStatus={novoStatus}
            setNovoStatus={setNovoStatus}
            submitting={submitting}
            handleEnviarDespacho={handleEnviarDespacho}
            handleFinalizarEfetivo={handleFinalizarEfetivo}
            reabrirFormOpen={reabrirFormOpen}
            setReabrirFormOpen={setReabrirFormOpen}
            motivoReabertura={motivoReabertura}
            setMotivoReabertura={setMotivoReabertura}
            responsavelReabertura={responsavelReabertura}
            setResponsavelReabertura={setResponsavelReabertura}
            handleReabrirOcorrencia={handleReabrirOcorrencia}
            userRole={userRole}
          />
        </div>

        {/* COLUNA DIREITA: Trilha de Atendimento (Histórico) */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs h-full flex flex-col">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Clock className="h-5 w-5 text-indigo-600" />
                Trilha de Atendimento
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {historico.length} {historico.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>

            <div className="flex-1">
              <OcorrenciaTimelineHistory historico={historico} />
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE HOMOLOGAÇÃO / ENCERRAMENTO */}
      {confirmarEncerramentoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-base font-bold text-slate-900">Confirmar Encerramento</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Você está prestes a homologar e encerrar formalmente esta ocorrência. O chamado será marcado como
              <strong> Resolvido</strong> e o morador será notificado.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmarEncerramentoModal(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleExecutarEncerramento}
                disabled={submitting}
              >
                {submitting ? 'Homologando...' : 'Confirmar Encerramento'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

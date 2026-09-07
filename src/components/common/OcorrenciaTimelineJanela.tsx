// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, max-lines-per-function, max-statements, complexity, quality/no-direct-console */ // FIXME: D�vida t�cnica (Quarentena)
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Building2,
  FileText,
} from 'lucide-react';
import {
  getStatusConfig,
  getResponsavelConfig,
  canCloseOcorrencia,
  canReopenOcorrencia,
  isOcorrenciaFechada,
  type ResponsavelOcorrencia,
  type StatusOcorrencia
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
  userName = 'Equipe',
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
    (ocorrencia?.responsavelAtual as ResponsavelOcorrencia) || 'S�ndica'
  );
  const [novoStatus, setNovoStatus] = useState<StatusOcorrencia>(
    (ocorrencia?.status as StatusOcorrencia) || 'Pendente'
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmarEncerramentoModal, setConfirmarEncerramentoModal] = useState(false);

  // Estados para reabertura exclusiva da s�ndica
  const [reabrirFormOpen, setReabrirFormOpen] = useState(false);
  const [motivoReabertura, setMotivoReabertura] = useState('');
  const [responsavelReabertura, setResponsavelReabertura] = useState<ResponsavelOcorrencia>('S�ndica');

  if (!ocorrencia) return null;

  const historico = Array.isArray(ocorrencia.historico) ? ocorrencia.historico : [];

  const handleEnviarDespacho = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relato.trim()) {
      setErrorMsg('Escreva um relato ou instru��o para atualizar a trilha do atendimento.');
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
      setErrorMsg('Somente a s�ndica ou administradora pode homologar e encerrar o chamado.');
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
          relato: relato.trim() || 'Atendimento conferido e homologado pela administra��o. Chamado encerrado.',
          responsavelNovo: 'S�ndica',
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
      setErrorMsg('Informe a justificativa para reabrir a ocorr�ncia.');
      return;
    }
    if (!canReopen) {
      setErrorMsg('Apenas a s�ndica ou administradora pode reabrir um atendimento encerrado.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      if (onDespachar) {
        await onDespachar({
          relato: `[CHAMADO REABERTO PELO ADMINISTRADOR]\nMotivo: ${motivoReabertura.trim()}`,
          responsavelNovo: responsavelReabertura,
          statusNovo: 'Em Andamento',
          tipo: 'reabertura',
        });
      }
      setReabrirFormOpen(false);
      setMotivoReabertura('');
      onVoltar();
    } catch (err) {
      console.error(err);
      setErrorMsg('Falha ao reabrir ocorr�ncia.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-50 w-full max-w-6xl rounded-3xl shadow-2xl flex flex-col max-h-[96vh] sm:max-h-[90vh] overflow-hidden border border-slate-200/60 mt-auto sm:mt-0 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex-none p-4 sm:p-6 bg-white border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onVoltar}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl shrink-0 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] sm:text-xs">
                  {ocorrencia.id || 'Nova'}
                </Badge>
                {ocorrencia.isEmergencia && (
                  <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50 text-[10px] sm:text-xs px-2 shadow-none font-bold">
                    <AlertTriangle className="mr-1 h-3 w-3 fill-red-700 text-red-100" />
                    EMERG�NCIA
                  </Badge>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight line-clamp-2">
                {ocorrencia.titulo}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
            <Badge variant="outline" className={`${statusCfg.color} ${statusCfg.border} ${statusCfg.bg} px-3 py-1 text-xs font-bold whitespace-nowrap shadow-sm`}>
              {statusCfg.icon && <statusCfg.icon className="mr-1.5 h-3.5 w-3.5" />}
              {statusCfg.label}
            </Badge>
            <Badge variant="outline" className={`${respCfg.color} ${respCfg.border} ${respCfg.bg} px-3 py-1 text-xs font-bold whitespace-nowrap shadow-sm`}>
              {respCfg.icon && <respCfg.icon className="mr-1.5 h-3.5 w-3.5" />}
              {respCfg.label}
            </Badge>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm font-semibold text-red-800 leading-relaxed">{errorMsg}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 max-w-7xl mx-auto">
            {/* COLUNA ESQUERDA: Detalhes Iniciais + Formul�rio de Despacho */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-0 h-fit">
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-4">
                  <FileText className="h-5 w-5 text-slate-400" />
                  Dados da Abertura
                </div>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Aberto por</span>
                    <div className="font-semibold text-slate-800 text-sm">{ocorrencia.moradorNome || 'N�o informado'}</div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-medium bg-slate-50 w-fit px-2 py-1 rounded-md border border-slate-100">
                      <Building2 className="h-3.5 w-3.5" />
                      Unidade {ocorrencia.unidade || 'N/A'} {ocorrencia.bloco && `- ${ocorrencia.bloco}`}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Data de Abertura</span>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      <Clock className="h-4 w-4 text-slate-400" />
                      {formatarDataHora(ocorrencia.dataAbertura)}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Categoria (Triagem)</span>
                    <div className="text-sm font-semibold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg w-fit border border-slate-200">
                      {ocorrencia.categoria || 'N�o classificada'}
                    </div>
                  </div>

                  {ocorrencia.descricao && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Relato Inicial</span>
                      <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 leading-relaxed border border-slate-100 italic">
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

            {/* COLUNA DIREITA: Timeline */}
            <div className="lg:col-span-8">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-lg mb-6 sm:mb-8 ml-2">
                <Clock className="h-5 w-5 text-slate-400" />
                Trilha de Atendimento
              </div>

              <OcorrenciaTimelineHistory historico={historico} />
            </div>
          </div>
        </div>

        {/* Modal Confirmar Encerramento (Sindica) */}
        {confirmarEncerramentoModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Homologar Encerramento</h3>
              </div>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Voc� est� prestes a <strong className="text-slate-900">encerrar definitivamente</strong> este chamado. A trilha ficar� imut�vel e a equipe n�o poder� mais alter�-lo. Confirma o encerramento do chamado?
              </p>
              
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setConfirmarEncerramentoModal(false)}
                  disabled={submitting}
                  className="text-xs font-semibold"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleExecutarEncerramento}
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm"
                >
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirmar Encerramento'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

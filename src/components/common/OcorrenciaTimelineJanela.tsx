import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Send,
  UserCheck,
  Building2,
  FileText,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Info,
  RefreshCw
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

export interface OcorrenciaTimelineJanelaProps {
  ocorrencia: any;
  userRole: string;
  userName: string;
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
          relato: `Chamado reaberto pela administração. Justificativa: ${motivoReabertura.trim()}`,
          responsavelNovo: responsavelReabertura,
          statusNovo: 'Em Atendimento',
          tipo: 'reabertura',
        });
      }
      setMotivoReabertura('');
      setReabrirFormOpen(false);
      onVoltar();
    } catch (err) {
      console.error('Erro ao reabrir ocorrência:', err);
      setErrorMsg('Falha ao reabrir ocorrência. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Barra de Navegação Superior Integrada */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 md:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onVoltar}
              className="bg-slate-800/80 hover:bg-slate-700 text-white border-slate-700 hover:text-white transition-all text-xs font-semibold"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Voltar à Lista
            </Button>
            <span className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">
              Ocorrência #{ocorrencia.id?.substring(0, 8)}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            {ocorrencia.titulo}
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1 font-medium text-slate-200">
              <Building2 className="h-3.5 w-3.5 text-indigo-400" />
              {ocorrencia.unidadeNome || 'Unidade'}
            </span>
            <span>•</span>
            <span>Aberto por: <strong className="text-white">{ocorrencia.autorNome || 'Morador'}</strong></span>
            {ocorrencia.createdAt && (
              <>
                <span>•</span>
                <span>{formatarDataHora(ocorrencia.createdAt)}</span>
              </>
            )}
          </div>
        </div>

        {/* Badges de Status e Responsabilidade */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}>
            {statusCfg.label}
          </span>
          <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${respCfg.bgClass} ${respCfg.textClass} ${respCfg.borderClass}`}>
            Responsável: {respCfg.label}
          </span>
          {ocorrencia.urgencia === 'Alta' && (
            <Badge variant="destructive" className="bg-rose-500/20 text-rose-300 border border-rose-400/40 text-xs font-semibold">
              <AlertTriangle className="mr-1 h-3 w-3" /> Alta Prioridade
            </Badge>
          )}
        </div>
      </div>

      {/* Grid Principal de Trabalho: 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna 1 (7 colunas): Detalhes, Triagem e Ações de Despacho */}
        <div className="lg:col-span-7 space-y-6">
          {/* Cartão de Detalhes da Triagem e Relato do Morador */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                Relato Detalhado do Chamado
              </h3>
              <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200">
                Categoria: {ocorrencia.categoria || 'Geral'}
              </Badge>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {ocorrencia.descricao}
            </div>

            {ocorrencia.iaJustificativa && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
                  <Info className="h-4 w-4 text-indigo-600" />
                  Parecer da Triagem
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {ocorrencia.iaJustificativa}
                </p>
              </div>
            )}
          </div>

          {/* Seção de Ação / Despacho / Reabertura */}
          {onDespachar ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* CENÁRIO 1: Ocorrência Fechada (Resolvida) */}
              {isFechada ? (
                <div className="space-y-4">
                  <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3.5">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-emerald-900 text-sm">
                        Atendimento Concluído e Homologado
                      </h4>
                      <p className="text-xs text-emerald-700 leading-relaxed">
                        Este chamado foi verificado e encerrado formalmente pela administração. Novos despachos comuns estão desabilitados.
                      </p>
                    </div>
                  </div>

                  {/* Reabertura Formal exclusiva para Síndica */}
                  {canReopen ? (
                    <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                      {!reabrirFormOpen ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <h5 className="text-xs font-bold text-slate-800">
                              Ocorrência reincidiu ou precisa de nova verificação?
                            </h5>
                            <p className="text-[11px] text-slate-500">
                              Como síndica, você pode reabrir o chamado com registro formal da justificativa.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setReabrirFormOpen(true)}
                            className="text-amber-800 border-amber-300 hover:bg-amber-50 hover:border-amber-400 font-semibold text-xs shrink-0"
                          >
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
                            Reabrir Chamado
                          </Button>
                        </div>
                      ) : (
                        <form onSubmit={handleReabrirOcorrencia} className="space-y-4">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
                              Reabertura Formal do Atendimento
                            </h5>
                            <button
                              type="button"
                              onClick={() => setReabrirFormOpen(false)}
                              className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                            >
                              Cancelar
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">
                              Justificativa da Reabertura *
                            </Label>
                            <textarea
                              rows={3}
                              value={motivoReabertura}
                              onChange={(e) => setMotivoReabertura(e.target.value)}
                              placeholder="Descreva por que o atendimento está sendo reaberto..."
                              className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                              required
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">
                              Delegar Novo Responsável
                            </Label>
                            <select
                              value={responsavelReabertura}
                              onChange={(e) => setResponsavelReabertura(e.target.value as ResponsavelOcorrencia)}
                              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-white font-medium text-slate-700 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                            >
                              <option value="Síndica">Síndica / Administração</option>
                              <option value="Zeladoria">Zeladoria</option>
                              <option value="Portaria">Portaria</option>
                              <option value="Prestador Externo">Prestador Externo</option>
                            </select>
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setReabrirFormOpen(false)}
                              disabled={submitting}
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="submit"
                              size="sm"
                              disabled={submitting}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                            >
                              {submitting ? (
                                <>
                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                  Reabrindo...
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                                  Confirmar Reabertura
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 text-center italic py-2">
                      Apenas a administração predial possui permissão para reabrir chamados encerrados.
                    </p>
                  )}
                </div>
              ) : (
                /* CENÁRIO 2: Ocorrência Aberta -> Painel de Despacho */
                <form onSubmit={handleEnviarDespacho} className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-indigo-600" />
                      Registrar Despacho ou Instrução
                    </h4>
                    <span className="text-xs text-slate-500">
                      Operador: <strong className="text-slate-700">{userName}</strong>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Relato da Intervenção / Instrução do Chamado *
                    </Label>
                    <textarea
                      rows={4}
                      value={relato}
                      onChange={(e) => setRelato(e.target.value)}
                      placeholder="Descreva as providências adotadas, laudos recebidos ou orientações para a equipe e morador..."
                      className="w-full p-3.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">
                        Transferir Responsável
                      </Label>
                      <select
                        value={novoResponsavel}
                        onChange={(e) => setNovoResponsavel(e.target.value as ResponsavelOcorrencia)}
                        className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-white font-medium text-slate-700 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Síndica">Síndica / Administração</option>
                        <option value="Zeladoria">Zeladoria</option>
                        <option value="Portaria">Portaria</option>
                        <option value="Prestador Externo">Prestador Externo</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">
                        Atualizar Status
                      </Label>
                      <select
                        value={novoStatus}
                        onChange={(e) => setNovoStatus(e.target.value as StatusOcorrencia)}
                        className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-white font-medium text-slate-700 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Em Atendimento">Em Atendimento</option>
                        <option value="Aguardando Validação da Síndica">
                          Aguardando Validação da Síndica
                        </option>
                        {isSindica && <option value="Resolvido">Resolvido (Fechar Chamado)</option>}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    {isSindica ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleFinalizarEfetivo}
                        disabled={submitting}
                        className="w-full sm:w-auto text-emerald-700 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 text-xs font-semibold"
                      >
                        <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-600" />
                        Homologar e Fechar Atendimento
                      </Button>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        Apenas a administração homologa o encerramento.
                      </span>
                    )}

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto text-xs font-semibold shadow-md shadow-indigo-100"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gravando Despacho...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Registrar Despacho
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* Modo Informativo para o Morador */
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                Andamento do Chamado
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                As intervenções, contatos com fornecedores e providências adotadas pela equipe são registradas na trilha ao lado.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                <Info className="h-4 w-4 text-indigo-500 shrink-0" />
                Caso precise complementar informações, contate a administração pelo mural ou portaria.
              </div>
            </div>
          )}
        </div>

        {/* Coluna 2 (5 colunas): Trilha Histórica Cronológica Transparente */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 sticky top-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600" />
              Trilha de Atendimento
            </h3>
            <span className="text-xs font-medium text-slate-400">
              {historico.length} registro(s)
            </span>
          </div>

          {historico.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-2 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6">
              <Clock className="h-8 w-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium text-slate-600">Aguardando primeiro despacho</p>
              <p className="text-[11px] text-slate-400">
                A equipe administrativa registrará as etapas do atendimento aqui.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 border-l-2 border-slate-200 ml-2 max-h-[600px] overflow-y-auto pr-1">
              {historico.map((item: any, idx: number) => {
                const isUltimo = idx === historico.length - 1;
                const isReabertura = item.tipo === 'reabertura';
                const isEncerramento = item.tipo === 'encerramento';

                return (
                  <div key={item.id || idx} className="relative group">
                    {/* Marcador da Linha do Tempo */}
                    <div
                      className={`absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white transition-transform group-hover:scale-125 ${
                        isReabertura
                          ? 'bg-amber-500 ring-4 ring-amber-100'
                          : isEncerramento
                          ? 'bg-emerald-600 ring-4 ring-emerald-100'
                          : isUltimo
                          ? 'bg-indigo-600 ring-4 ring-indigo-100'
                          : 'bg-slate-400'
                      }`}
                    />
                    <div
                      className={`p-3.5 rounded-xl border shadow-2xs space-y-1.5 transition-all ${
                        isReabertura
                          ? 'bg-amber-50/80 border-amber-200'
                          : isEncerramento
                          ? 'bg-emerald-50/80 border-emerald-200'
                          : 'bg-slate-50/80 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-slate-800">
                          {item.autorNome}{' '}
                          <span className="text-slate-400 font-normal">
                            ({item.autorPapel || 'Equipe'})
                          </span>
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatarDataHora(item.data)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {item.mensagem}
                      </p>
                      {(item.statusNovo || item.responsavelNovo) && (
                        <div className="pt-1.5 flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500">
                          {item.statusNovo && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-slate-200 bg-white">
                              Status: {item.statusNovo}
                            </Badge>
                          )}
                          {item.responsavelNovo && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-slate-200 bg-white">
                              Delegado para: {item.responsavelNovo}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Confirmar Encerramento de Ocorrência (Substitui confirm do browser) */}
      {confirmarEncerramentoModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Homologar Encerramento</h3>
                <p className="text-xs text-slate-500">Conclusão Definitiva do Chamado</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="text-xs font-bold text-slate-800">{ocorrencia.titulo}</p>
              <p className="text-xs text-slate-600">
                Local: <strong>{ocorrencia.local || ocorrencia.unidadeNome || 'Área Comum'}</strong>
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Deseja fechar este chamado como <strong>Resolvido</strong>? Esta ação homologa que os serviços foram prestados e conclui o atendimento.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmarEncerramentoModal(false)}
                disabled={submitting}
                className="cursor-pointer text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleExecutarEncerramento}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer text-xs flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Encerrando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Sim, Homologar e Fechar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

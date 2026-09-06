import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  X,
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Send,
  UserCheck,
  Building2,
  FileText,
  Loader2,
  RotateCcw
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

interface OcorrenciaTimelineModalProps {
  ocorrencia: any;
  userRole: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  onDespachar?: (params: {
    relato: string;
    responsavelNovo: ResponsavelOcorrencia;
    statusNovo: StatusOcorrencia;
    tipo?: 'despacho' | 'conclusao_equipe' | 'encerramento' | 'reabertura';
  }) => Promise<void>;
}

export function OcorrenciaTimelineModal({
  ocorrencia,
  userRole,
  userName = 'Equipe',
  isOpen,
  onClose,
  onDespachar,
}: OcorrenciaTimelineModalProps) {
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

  // Estados para reabertura exclusiva da síndica
  const [reabrirFormOpen, setReabrirFormOpen] = useState(false);
  const [motivoReabertura, setMotivoReabertura] = useState('');
  const [responsavelReabertura, setResponsavelReabertura] = useState<ResponsavelOcorrencia>('Síndica');

  if (!isOpen || !ocorrencia) return null;

  const historico = Array.isArray(ocorrencia.historico) ? ocorrencia.historico : [];

  const handleEnviarDespacho = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relato.trim()) {
      setErrorMsg('Escreva um relato ou observação para atualizar a trilha do atendimento.');
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
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Falha ao registrar despacho. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizarEfetivo = async () => {
    if (!isSindica) {
      alert('Somente a síndica ou administradora pode efetivamente encerrar o chamado.');
      return;
    }
    const confirmacao = confirm(
      'Deseja efetivamente fechar este atendimento como RESOLVIDO? Esta ação homologa a conclusão dos serviços.'
    );
    if (!confirmacao) return;

    setSubmitting(true);
    try {
      if (onDespachar) {
        await onDespachar({
          relato: relato.trim() || 'Atendimento conferido e homologado pela síndica. Chamado encerrado.',
          responsavelNovo: 'Síndica',
          statusNovo: 'Resolvido',
          tipo: 'encerramento',
        });
      }
      setRelato('');
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao homologar encerramento.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatarDataHora = (dataStr: string) => {
    if (!dataStr) return 'Recente';
    try {
      const d = new Date(dataStr);
      if (isNaN(d.getTime())) return dataStr;
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dataStr;
    }
  };

  const handleReabrirOcorrencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivoReabertura.trim()) {
      setErrorMsg('Informe a justificativa ou motivo para reabrir a ocorrência.');
      return;
    }
    if (!canReopen) {
      alert('Apenas a síndica ou administradora pode reabrir um atendimento encerrado.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      if (onDespachar) {
        await onDespachar({
          relato: `Chamado reaberto pela administração. Motivo: ${motivoReabertura.trim()}`,
          responsavelNovo: responsavelReabertura,
          statusNovo: 'Em Atendimento',
          tipo: 'reabertura',
        });
      }
      setMotivoReabertura('');
      setReabrirFormOpen(false);
      onClose();
    } catch (err) {
      console.error('Erro ao reabrir ocorrência:', err);
      setErrorMsg('Falha ao reabrir ocorrência. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Cabeçalho do Modal */}
        <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Ocorrência #{ocorrencia.id?.substring(0, 6)}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}>
                {statusCfg.label}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${respCfg.bgClass} ${respCfg.textClass} ${respCfg.borderClass}`}>
                Responsável: {respCfg.label}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 leading-snug">
              {ocorrencia.titulo}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span>{ocorrencia.unidadeNome || 'Unidade'}</span>
              <span>•</span>
              <span>Aberto por {ocorrencia.autorNome || 'Morador'}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-200/60 transition-colors"
            title="Fechar janela"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Corpo com Rolagem */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-700 text-sm">
          {/* Cartão de Triagem de IA e Detalhes do Chamado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
                Gravidade
              </span>
              <div className="mt-1">
                {ocorrencia.urgencia === 'Alta' && (
                  <Badge variant="destructive" className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200 text-xs font-semibold">
                    <AlertTriangle className="mr-1 h-3 w-3" /> Alta Prioridade
                  </Badge>
                )}
                {ocorrencia.urgencia === 'Média' && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 text-xs font-medium">
                    Média Prioridade
                  </Badge>
                )}
                {ocorrencia.urgencia === 'Baixa' && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 text-xs font-medium">
                    Baixa Prioridade
                  </Badge>
                )}
                {!ocorrencia.urgencia && (
                  <span className="text-xs text-slate-500">Normal</span>
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
                Categoria
              </span>
              <p className="mt-1 font-semibold text-slate-800 text-sm">
                {ocorrencia.categoria || 'Geral'}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
                Responsável Atual
              </span>
              <p className="mt-1 font-semibold text-indigo-900 text-sm flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                {respCfg.label}
              </p>
            </div>
          </div>

          {/* Relato Inicial do Morador */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-1.5">
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-600" />
              Relato Original do Morador
            </span>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {ocorrencia.descricao}
            </p>
            {ocorrencia.iaJustificativa && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 flex items-start gap-2 text-xs text-indigo-900 bg-indigo-50/60 p-2.5 rounded-lg">
                <Sparkles className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Parecer da Triagem por IA: </span>
                  <span className="text-indigo-800">{ocorrencia.iaJustificativa}</span>
                </div>
              </div>
            )}
          </div>

          {/* Linha do Tempo e Trilha de Atendimento */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-600" />
                Trilha de Atendimento Transparente
              </h4>
              <span className="text-xs text-slate-400">
                {historico.length} evento(s) registrado(s)
              </span>
            </div>

            {historico.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 bg-slate-50 rounded-xl border text-center">
                Aguardando primeiro despacho da administração.
              </p>
            ) : (
              <div className="relative pl-6 space-y-4 border-l-2 border-slate-200 ml-2">
                {historico.map((item: any, idx: number) => {
                  const isUltimo = idx === historico.length - 1;
                  const isReabertura = item.tipo === 'reabertura';
                  const isEncerramento = item.tipo === 'encerramento';

                  return (
                    <div key={item.id || idx} className="relative">
                      {/* Marcador da Linha do Tempo */}
                      <div
                        className={`absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white ${
                          isReabertura
                            ? 'bg-amber-500 ring-4 ring-amber-100'
                            : isEncerramento
                            ? 'bg-emerald-600 ring-4 ring-emerald-100'
                            : isUltimo
                            ? 'bg-indigo-600 ring-4 ring-indigo-100'
                            : 'bg-slate-400'
                        }`}
                      />
                      <div className={`p-3 rounded-xl border shadow-2xs space-y-1 ${
                        isReabertura
                          ? 'bg-amber-50/70 border-amber-200'
                          : isEncerramento
                          ? 'bg-emerald-50/70 border-emerald-200'
                          : 'bg-white border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="font-semibold text-slate-800">
                            {item.autorNome} <span className="text-slate-400 font-normal">({item.autorPapel || 'Equipe'})</span>
                          </span>
                          <span className="text-[11px] text-slate-400">{formatarDataHora(item.data)}</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {item.mensagem}
                        </p>
                        {(item.statusNovo || item.responsavelNovo) && (
                          <div className="pt-1 flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500">
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

          {/* Seção de Despacho OU Encerramento com Reabertura */}
          {onDespachar && (
            <div className="pt-4 border-t border-slate-200 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* CENÁRIO 1: Ocorrência Fechada (Resolvida) -> Despacho Comum Bloqueado */}
              {isFechada ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1 flex-1">
                      <h4 className="font-bold text-emerald-900 text-sm">
                        Atendimento Concluído e Homologado
                      </h4>
                      <p className="text-xs text-emerald-700 leading-relaxed">
                        Este chamado foi concluído pela administração predial. Novos despachos e apontamentos de rotina estão bloqueados.
                      </p>
                    </div>
                  </div>

                  {/* Fluxo de Reabertura Exclusiva pela Síndica (RN-007) */}
                  {canReopen ? (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      {!reabrirFormOpen ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold text-slate-800">
                              O problema reincidiu ou precisa de nova verificação?
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Como síndica, você pode reabrir o chamado com registro formal do motivo.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setReabrirFormOpen(true)}
                            className="text-amber-800 border-amber-300 hover:bg-amber-50 hover:border-amber-400 font-medium shrink-0"
                          >
                            <RotateCcw className="mr-1.5 h-4 w-4 text-amber-600" />
                            Reabrir Ocorrência
                          </Button>
                        </div>
                      ) : (
                        <form onSubmit={handleReabrirOcorrencia} className="space-y-3">
                          <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                            <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
                              Reabertura Formal do Chamado
                            </h5>
                            <button
                              type="button"
                              onClick={() => setReabrirFormOpen(false)}
                              className="text-xs text-slate-400 hover:text-slate-600"
                            >
                              Cancelar
                            </button>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">
                              Justificativa / Motivo da Reabertura *
                            </Label>
                            <textarea
                              rows={2}
                              value={motivoReabertura}
                              onChange={(e) => setMotivoReabertura(e.target.value)}
                              placeholder="Ex: Morador relatou persistência de goteira após chuvas recentes..."
                              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-700">
                              Reatribuir Responsável
                            </Label>
                            <select
                              value={responsavelReabertura}
                              onChange={(e) => setResponsavelReabertura(e.target.value as ResponsavelOcorrencia)}
                              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white font-medium text-slate-700 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                            >
                              <option value="Síndica">Síndica / Administração</option>
                              <option value="Zeladoria">Zeladoria</option>
                              <option value="Portaria">Portaria</option>
                              <option value="Prestador Externo">Prestador Externo</option>
                            </select>
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
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
                              className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
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
                    <p className="text-xs text-slate-500 italic text-center p-2">
                      Apenas a administração do condomínio possui permissão para reabrir chamados encerrados.
                    </p>
                  )}
                </div>
              ) : (
                /* CENÁRIO 2: Ocorrência Aberta / Em Andamento -> Despacho Habilitado */
                <form onSubmit={handleEnviarDespacho} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-indigo-600" />
                      Registrar Despacho <span className="text-xs font-normal text-slate-500">por {userName}</span>
                    </h4>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Relato ou Instrução do Atendimento *
                    </Label>
                    <textarea
                      rows={3}
                      value={relato}
                      onChange={(e) => setRelato(e.target.value)}
                      placeholder="Descreva o que foi verificado, orientações dadas ou o serviço executado..."
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Transferir para membro da equipe */}
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

                    {/* Alterar Status */}
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

                  {/* Ações do Despacho */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    {isSindica ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleFinalizarEfetivo}
                        disabled={submitting}
                        className="w-full sm:w-auto text-emerald-700 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                      >
                        <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-600" />
                        Homologar e Fechar Atendimento
                      </Button>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        Nota: Apenas a síndica pode efetivamente homologar e fechar o chamado.
                      </span>
                    )}

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Gravando...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Registrar Despacho
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

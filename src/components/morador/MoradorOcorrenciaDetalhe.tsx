import {
  ArrowLeft,
  Clock,
  Building2,
  Sparkles,
  CheckCircle2,
  FileText,
  MessageSquare,
  Shield,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatarDataHora } from '@/lib/date-utils';
import {
  getStatusConfig,
  type OcorrenciaData,
} from '@/lib/ocorrencia-helpers';

export interface MoradorOcorrenciaDetalheProps {
  ocorrencia: OcorrenciaData | any;
  onVoltar: () => void;
  onAtualizar?: () => void;
}

export function MoradorOcorrenciaDetalhe({
  ocorrencia,
  onVoltar,
  onAtualizar,
}: MoradorOcorrenciaDetalheProps) {
  if (!ocorrencia) return null;

  const statusCfg = getStatusConfig(ocorrencia.status);
  const unidadeNome = ocorrencia.unidadeNome || ocorrencia.unidade || 'Minha Unidade';
  const dataCriacao = ocorrencia.createdAt || ocorrencia.dataAbertura;
  const historico = Array.isArray(ocorrencia.historico) ? ocorrencia.historico : [];

  const statusStr = String(ocorrencia.status || '').toLowerCase().trim();
  const isResolvido = statusStr === 'resolvido';
  const isEmAtendimento =
    statusStr === 'em atendimento' ||
    statusStr === 'em andamento' ||
    statusStr === 'em análise' ||
    statusStr === 'em analise' ||
    statusStr.includes('validação') ||
    statusStr.includes('validacao');

  const urgencia = ocorrencia.urgencia || 'Média';
  const urgenciaColors = {
    Alta: 'bg-red-50 text-red-700 border-red-200',
    Média: 'bg-amber-50 text-amber-700 border-amber-200',
    Baixa: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }[urgencia as 'Alta' | 'Média' | 'Baixa'] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200 pb-12">
      {/* 1. HEADER INTEGRADO DA PÁGINA (Padrão Unificado) */}
      <div className="p-4 sm:p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={onVoltar}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl shrink-0 border-slate-200 hover:bg-slate-100 text-slate-700"
            title="Voltar para Minhas Ocorrências"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-[11px] font-mono">
                Protocolo #{ocorrencia.id ? String(ocorrencia.id).slice(0, 8).toUpperCase() : 'NOVO'}
              </Badge>
              <span className="text-xs text-slate-400 font-medium">
                • Aberto em {formatarDataHora(dataCriacao)}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight line-clamp-2">
              {ocorrencia.titulo}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar justify-start sm:justify-end">
          <Badge variant="outline" className={`${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass} px-3 py-1 text-xs font-bold whitespace-nowrap shadow-xs`}>
            {statusCfg.label}
          </Badge>
          <Badge variant="outline" className={`${urgenciaColors} px-3 py-1 text-xs font-bold whitespace-nowrap shadow-xs`}>
            Prioridade {urgencia}
          </Badge>
          {onAtualizar && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAtualizar}
              className="h-8 px-2.5 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shrink-0"
              title="Atualizar dados do chamado"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
              <span>Atualizar</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. CARD DO STEPPER DE PROGRESSO (Visual Limpo e Informativo) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
          <span>Andamento do Chamado</span>
          <span className="text-xs font-semibold text-slate-700">
            {isResolvido ? 'Concluído e Homologado' : isEmAtendimento ? 'Em Atendimento pela Equipe' : 'Fila de Análise'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 relative">
          <div className="absolute top-4 left-[16%] right-[16%] h-0.5 bg-slate-200 -z-0 hidden sm:block" />

          {/* Etapa 1: Registrado */}
          <div className="flex flex-col items-center text-center relative z-10">
            <div className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-xs mb-2">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-800">1. Registrado</span>
            <span className="text-[11px] text-slate-500 hidden sm:block mt-0.5">Recebido pelo sistema</span>
          </div>

          {/* Etapa 2: Em Atendimento */}
          <div className="flex flex-col items-center text-center relative z-10">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs mb-2 ${
                isResolvido
                  ? 'bg-emerald-500 text-white'
                  : isEmAtendimento
                  ? 'bg-indigo-600 text-white animate-pulse ring-4 ring-indigo-50'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {isResolvido ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
            </div>
            <span className={`text-xs font-bold ${isEmAtendimento || isResolvido ? 'text-indigo-900' : 'text-slate-500'}`}>
              2. Em Atendimento
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:block mt-0.5">
              {isEmAtendimento ? 'Equipe em ação' : isResolvido ? 'Atendimento feito' : 'Aguardando início'}
            </span>
          </div>

          {/* Etapa 3: Concluído */}
          <div className="flex flex-col items-center text-center relative z-10">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs mb-2 ${
                isResolvido ? 'bg-emerald-600 text-white ring-4 ring-emerald-50' : 'bg-slate-200 text-slate-400'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <span className={`text-xs font-bold ${isResolvido ? 'text-emerald-800' : 'text-slate-500'}`}>
              3. Concluído
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:block mt-0.5">
              {isResolvido ? 'Homologado pela síndica' : 'Finalização'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. GRID PRINCIPAL: DADOS DA SOLICITAÇÃO (ESQUERDA) + TRILHA DE ATENDIMENTO (DIREITA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* COLUNA ESQUERDA: Card Consolidado de Dados da Solicitação */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm pb-3 border-b border-slate-100">
              <FileText className="h-5 w-5 text-indigo-600" />
              Dados da Solicitação
            </div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Categoria</span>
                <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">
                  {ocorrencia.categoria || 'Geral'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Unidade</span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                  <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                  {unidadeNome}
                </div>
              </div>

              {/* Parecer da Triagem Inteligente (se houver) */}
              {ocorrencia.iaJustificativa && (
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1.5">
                  <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    Triagem Inteligente (IA)
                  </span>
                  <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                    {ocorrencia.iaJustificativa}
                  </p>
                </div>
              )}

              {/* Relato Inicial do Morador */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Seu Relato Inicial
                </span>
                <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 rounded-xl p-3.5 sm:p-4 leading-relaxed border border-slate-100 font-medium">
                  &quot;{ocorrencia.descricao || 'Sem descrição.'}&quot;
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: Trilha de Atendimento da Administração */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs h-full flex flex-col">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
                Atualizações da Administração
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {historico.length} {historico.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>

            <div className="flex-1">
              {historico.length === 0 ? (
                <div className="p-6 sm:p-10 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-800 text-sm">Chamado sob análise</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Sua ocorrência já foi disponibilizada para a gestão. Assim que houver um parecer ou ação da equipe, ele será registrado aqui.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative pl-6 sm:pl-8 py-2">
                  <div className="absolute left-2.5 sm:left-[19px] top-4 bottom-4 w-0.5 bg-slate-200" />

                  <div className="space-y-5 sm:space-y-6 relative">
                    {historico.map((item: any, idx: number) => {
                      let Icone = FileText;
                      let iconBg = 'bg-slate-100 text-slate-600';
                      let iconBorder = 'border-slate-200';

                      if (item.tipo === 'abertura') {
                        Icone = AlertTriangle;
                        iconBg = 'bg-amber-100 text-amber-600';
                        iconBorder = 'border-amber-200';
                      } else if (item.tipo === 'encerramento' || item.statusNovo === 'Resolvido') {
                        Icone = CheckCircle2;
                        iconBg = 'bg-emerald-100 text-emerald-600';
                        iconBorder = 'border-emerald-200';
                      } else if (item.tipo === 'reabertura') {
                        Icone = RotateCcw;
                        iconBg = 'bg-orange-100 text-orange-600';
                        iconBorder = 'border-orange-200';
                      } else if (item.responsavelNovo === 'Síndica') {
                        Icone = ShieldCheck;
                        iconBg = 'bg-indigo-100 text-indigo-600';
                        iconBorder = 'border-indigo-200';
                      } else if (item.tipo === 'despacho') {
                        Icone = UserCheck;
                        iconBg = 'bg-blue-100 text-blue-600';
                        iconBorder = 'border-blue-200';
                      }

                      const autor = item.autorNome || item.ator || 'Administração';
                      const papel = item.autorPapel || '';
                      const texto = item.mensagem || item.relato || '';

                      return (
                        <div key={idx} className="relative">
                          <div
                            className={`absolute -left-[35px] sm:-left-[43px] h-8 w-8 rounded-full border-2 bg-white flex items-center justify-center shadow-xs ${iconBorder}`}
                          >
                            <Icone className={`h-4 w-4 ${iconBg.split(' ')[1]}`} />
                          </div>

                          <div className="bg-slate-50/70 rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs transition-all hover:shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                              <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                                <span>{autor}</span>
                                {papel && (
                                  <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                    {papel}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium whitespace-nowrap bg-white px-2.5 py-0.5 rounded-full border border-slate-200 w-fit">
                                {formatarDataHora(item.data)}
                              </div>
                            </div>

                            <div className="text-xs sm:text-sm text-slate-700 bg-white rounded-xl p-3 sm:p-4 mb-2 border border-slate-200/60 leading-relaxed whitespace-pre-wrap font-medium">
                              {texto}
                            </div>

                            {item.statusNovo && (
                              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/50">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                                <Badge variant="outline" className="text-[11px] font-semibold bg-white text-slate-700 border-slate-200">
                                  {item.statusNovo}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* eslint-disable max-lines-per-function */ // FIXME: D�vida t�cnica (Quarentena)
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  Loader2,
  Send,
  Building2,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';

export interface NovaOcorrenciaJanelaProps {
  unidadeNome?: string;
  condominioNome?: string;
  submitting?: boolean;
  errorMessage?: string;
  onCriar: (data: { titulo: string; descricao: string }) => Promise<void> | void;
  onVoltar: () => void;
}

export function NovaOcorrenciaJanela({
  unidadeNome = 'Minha Unidade',
  condominioNome = 'Condomínio',
  submitting = false,
  errorMessage = '',
  onCriar,
  onVoltar,
}: NovaOcorrenciaJanelaProps) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setLocalError('Informe um título claro para a ocorrência.');
      return;
    }
    if (!descricao.trim()) {
      setLocalError('Descreva detalhadamente o ocorrido.');
      return;
    }

    setLocalError('');
    await onCriar({
      titulo: titulo.trim(),
      descricao: descricao.trim(),
    });
  };

  const displayError = localError || errorMessage;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Topbar Integrada */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onVoltar}
              className="bg-slate-800/80 hover:bg-slate-700 text-white border-slate-700 hover:text-white transition-all text-xs font-semibold min-h-[44px] sm:min-h-[36px] px-3.5"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5 shrink-0" />
              Voltar para Minhas Ocorrências
            </Button>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Novo Chamado
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-400 shrink-0" />
            Registrar Nova Ocorrência
          </h2>
          <p className="text-xs text-slate-300">
            Abra um chamado diretamente para a administração predial de {condominioNome}.
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 px-4 py-2.5 rounded-xl text-center self-start sm:self-auto">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-medium">
            Unidade Solicitante
          </span>
          <span className="font-semibold text-xs text-indigo-300 flex items-center justify-center gap-1 mt-0.5">
            <Building2 className="h-3.5 w-3.5" />
            {unidadeNome}
          </span>
        </div>
      </div>

      {/* Grid de 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna 1 (7 colunas): Formulário de Registro */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base">
              Detalhes do Chamado
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Informe a administração sobre reparos necessários, barulhos recorrentes ou solicitações gerais.
            </p>
          </div>

          {displayError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="titulo" className="text-xs font-semibold text-slate-700">
                Título ou Objeto da Solicitação *
              </Label>
              <Input
                id="titulo"
                placeholder="Ex: Vazamento sob a pia, Luz do corredor queimada, Barulho excessivo..."
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                className="rounded-xl border-slate-200 text-base sm:text-sm font-semibold h-11 sm:h-10"
              />
              <p className="text-[11px] text-slate-400">
                Um título objetivo facilita o direcionamento e atendimento pela equipe.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="descricao" className="text-xs font-semibold text-slate-700">
                  Descrição Completa dos Fatos *
                </Label>
                <span className="text-[11px] text-slate-400">
                  {descricao.length} caracteres
                </span>
              </div>
              <textarea
                id="descricao"
                rows={5}
                placeholder="Descreva o que está ocorrendo, local exato, horário e se há impacto em outras unidades..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                required
                className="w-full p-3.5 rounded-xl border border-slate-200 bg-white text-base sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 transition-all leading-relaxed"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={onVoltar}
                disabled={submitting}
                className="text-xs font-semibold border-slate-200 w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-100 w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando chamado...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Registrar Ocorrência
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Coluna 2 (5 colunas): Fluxo de Atendimento e Orientações */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card de Fluxo */}
          <div className="bg-slate-50 text-slate-800 rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div>
              <h4 className="font-bold text-sm text-slate-900">Como funciona o atendimento</h4>
              <p className="text-xs text-slate-500">Etapas após o envio do chamado</p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-start gap-2.5 shadow-2xs">
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md text-[11px] shrink-0">1</span>
                <span className="text-slate-700"><strong>Classificação imediata:</strong> O chamado é categorizado e priorizado automaticamente conforme o relato.</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-start gap-2.5 shadow-2xs">
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md text-[11px] shrink-0">2</span>
                <span className="text-slate-700"><strong>Encaminhamento:</strong> O chamado é atribuído ao responsável adequado (zeladoria, portaria ou administração).</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-start gap-2.5 shadow-2xs">
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md text-[11px] shrink-0">3</span>
                <span className="text-slate-700"><strong>Acompanhamento:</strong> Cada providência ou atualização de status é registrada na sua linha do tempo.</span>
              </div>
            </div>
          </div>

          {/* Dicas para um Bom Relato */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-indigo-600" />
              Orientações para o relato
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                <span><strong>Localização precisa:</strong> Indique o local exato (ex: vaga 12 do subsolo, escadaria do 3º andar).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                <span><strong>Horários:</strong> Se houver ruído recorrente, informe os períodos em que ocorre.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                <span><strong>Reincidência:</strong> Indique se o problema já aconteceu anteriormente ou se houve reparo recente.</span>
              </li>
            </ul>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-600 shrink-0" />
              Chamado registrado no histórico oficial da unidade.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

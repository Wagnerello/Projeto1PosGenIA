import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  AlertTriangle,
  Send,
  ShieldCheck,
  Loader2,
  RefreshCw,
  PlusCircle,
  X,
  CheckCircle2,
} from 'lucide-react';
import type { ResponsavelOcorrencia, StatusOcorrencia } from '@/lib/ocorrencia-helpers';

export interface OcorrenciaTimelineFormProps {
  isSindica: boolean;
  canReopen: boolean;
  isFechada: boolean;
  statusCfg: any;
  respCfg: any;
  relato: string;
  setRelato: (val: string) => void;
  novoResponsavel: ResponsavelOcorrencia;
  setNovoResponsavel: (val: ResponsavelOcorrencia) => void;
  novoStatus: StatusOcorrencia;
  setNovoStatus: (val: StatusOcorrencia) => void;
  submitting: boolean;
  handleEnviarDespacho: (e: React.FormEvent) => void;
  handleFinalizarEfetivo: () => void;
  reabrirFormOpen: boolean;
  setReabrirFormOpen: (val: boolean) => void;
  motivoReabertura: string;
  setMotivoReabertura: (val: string) => void;
  responsavelReabertura: ResponsavelOcorrencia;
  setResponsavelReabertura: (val: ResponsavelOcorrencia) => void;
  handleReabrirOcorrencia: (e: React.FormEvent) => void;
  userRole?: string;
}

export function OcorrenciaTimelineForm(props: OcorrenciaTimelineFormProps) {
  const {
    isSindica,
    canReopen,
    isFechada,
    relato,
    setRelato,
    novoResponsavel,
    setNovoResponsavel,
    novoStatus,
    setNovoStatus,
    submitting,
    handleEnviarDespacho,
    handleFinalizarEfetivo,
    reabrirFormOpen,
    setReabrirFormOpen,
    motivoReabertura,
    setMotivoReabertura,
    responsavelReabertura,
    setResponsavelReabertura,
    handleReabrirOcorrencia,
    userRole = '',
  } = props;

  const roleLower = userRole.toLowerCase().trim();
  const isMorador = roleLower === 'morador';

  // Controle de exibição sob demanda (Progressive Disclosure) para eliminar ruído visual
  const [despachoAberto, setDespachoAberto] = useState(false);

  if (isMorador) return null;

  // 1. Chamado Homologado e Fechado
  if (isFechada) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
          <CheckCircle2 className="h-5 w-5" />
          Chamado Homologado e Fechado
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Esta ocorrência foi concluída e homologada pela administração. A trilha de ações está registrada ao lado.
        </p>

        {canReopen && (
          <div className="pt-3 border-t border-slate-100">
            {!reabrirFormOpen ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReabrirFormOpen(true)}
                className="w-full text-xs font-semibold h-9 border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl"
              >
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Reabrir Chamado (Síndica)
              </Button>
            ) : (
              <form onSubmit={handleReabrirOcorrencia} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in fade-in">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Justificativa da Reabertura</Label>
                  <textarea
                    className="flex w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 min-h-[70px] resize-y"
                    placeholder="Motivo obrigatório para reabertura..."
                    value={motivoReabertura}
                    onChange={(e) => setMotivoReabertura(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Atribuir a:</Label>
                  <select
                    className="flex h-9 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    value={responsavelReabertura}
                    onChange={(e) => setResponsavelReabertura(e.target.value as ResponsavelOcorrencia)}
                  >
                    <option value="Síndica">Síndica (Gestão Direta)</option>
                    <option value="Zeladoria">Zeladoria</option>
                    <option value="Prestador Externo">Prestador Externo / Manutenção</option>
                    <option value="Portaria">Portaria</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReabrirFormOpen(false);
                      setMotivoReabertura('');
                    }}
                    className="text-xs h-8"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 rounded-lg"
                  >
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirmar Reabertura'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    );
  }

  // 2. Estado Recolhido: Card de Ações Rápidas (Zero ruído visual)
  if (!despachoAberto) {
    return (
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            Ações de Atendimento
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Gestão Predial</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Acione a equipe, atualize o parecer técnico ou avance o status do chamado.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <Button
            type="button"
            onClick={() => setDespachoAberto(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold h-10 px-4 rounded-xl shadow-xs shadow-indigo-100 flex items-center justify-center gap-2 flex-1"
          >
            <PlusCircle className="h-4 w-4" />
            Novo Despacho / Instrução
          </Button>

          {isSindica && (
            <Button
              type="button"
              variant="outline"
              onClick={handleFinalizarEfetivo}
              className="text-xs font-semibold h-10 px-3.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Homologar Fechamento
            </Button>
          )}
        </div>
      </div>
    );
  }

  // 3. Estado Expandido: Painel de Despacho Completo e Focado
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-indigo-500/30 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Send className="h-4 w-4 text-indigo-600" />
          Registrar Despacho de Atendimento
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => {
            setDespachoAberto(false);
            setRelato('');
          }}
          className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          title="Fechar painel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleEnviarDespacho} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700">
            Relato ou Parecer Técnico
          </Label>
          <textarea
            className="flex w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent min-h-[90px] resize-y"
            placeholder="Descreva a ação adotada, parecer técnico ou instrução para a equipe..."
            value={relato}
            onChange={(e) => setRelato(e.target.value)}
            autoFocus
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Responsável Atual</Label>
            <select
              className="flex h-9 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
              value={novoResponsavel}
              onChange={(e) => setNovoResponsavel(e.target.value as ResponsavelOcorrencia)}
            >
              <option value="Síndica">
                {isSindica ? 'Manter com a Síndica / Administração' : 'Elevar para a Síndica / Administração'}
              </option>
              <option value="Zeladoria">Atribuir à Zeladoria</option>
              <option value="Prestador Externo">Atribuir a Prestador Externo / Manutenção</option>
              <option value="Portaria">Atribuir à Portaria</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Status do Atendimento</Label>
            <select
              className="flex h-9 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
              value={novoStatus}
              onChange={(e) => setNovoStatus(e.target.value as StatusOcorrencia)}
            >
              <option value="Pendente">Marcar como Pendente</option>
              <option value="Em Andamento">Marcar como Em Andamento</option>
              {isSindica && <option value="Resolvido">Encerrar Chamado</option>}
            </select>
          </div>
        </div>

        {novoStatus === 'Resolvido' && isSindica && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2.5 text-amber-900 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold block">Homologação de Encerramento</span>
              O status &quot;Resolvido&quot; finalizará e travará o chamado. O morador será avisado da resolução.
            </div>
          </div>
        )}

        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setDespachoAberto(false);
              setRelato('');
            }}
            className="text-xs h-9 px-3 text-slate-600 hover:text-slate-900"
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            disabled={submitting}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold h-9 px-4 rounded-xl shadow-xs shadow-indigo-100"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <Send className="mr-1.5 h-3.5 w-3.5" />
                Salvar Despacho
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

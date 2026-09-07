// @ts-nocheck
/* eslint-disable max-lines-per-function, complexity, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */ // FIXME: D�vida t�cnica (Quarentena)
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Send, ShieldCheck, Loader2, RefreshCw } from 'lucide-react';
import type { ResponsavelOcorrencia, StatusOcorrencia } from '@/lib/ocorrencia-helpers';

export function OcorrenciaTimelineForm(props: any) {
  const {
    isSindica,
    canReopen,
    isFechada,
    statusCfg,
    respCfg,
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
    userRole
  } = props;

  return (
    <div className="space-y-6">
      {!isFechada && userRole !== 'Morador' ? (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <form onSubmit={handleEnviarDespacho} className="space-y-5">
            <div className="flex items-center gap-2 mb-4 text-slate-900 font-bold text-sm">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              Painel de Despacho
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Relato / Instru��o de Atendimento</Label>
              <textarea
                className="flex w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent min-h-[110px] resize-y"
                placeholder="Descreva a a��o tomada, parecer t�cnico ou instru��o para a equipe..."
                value={relato}
                onChange={(e) => setRelato(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">Avan�ar Responsabilidade</Label>
                <select
                  className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={novoResponsavel}
                  onChange={(e) => setNovoResponsavel(e.target.value as ResponsavelOcorrencia)}
                >
                  <option value="Zelador">Atribuir ao Zelador</option>
                  <option value="Manuten��o">Atribuir � Manuten��o</option>
                  <option value="Portaria">Atribuir � Portaria</option>
                  <option value="S�ndica">Elevar para S�ndica</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">Mudar Status</Label>
                <select
                  className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
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
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-900 mt-2">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                <div className="text-xs leading-relaxed">
                  <span className="font-bold block mb-1">Aten��o: Encerramento de Chamado</span>
                  Voc� selecionou o status "Resolvido". Isso ir� homologar e travar o chamado permanentemente contra novas edi��es da equipe. O morador ser� notificado da resolu��o final.
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100">
              {isSindica && novoStatus !== 'Resolvido' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFinalizarEfetivo}
                  className="w-full sm:w-auto text-xs font-semibold min-h-[44px] sm:min-h-[36px]"
                >
                  Homologar Fechamento Direto
                </Button>
              )}
              <Button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto text-xs font-semibold shadow-md shadow-indigo-100 min-h-[44px] sm:min-h-[36px]"
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
        </div>
      ) : (
        /* Fechada ou Morador */
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            {isFechada ? 'Chamado Homologado e Fechado' : 'Andamento do Chamado'}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {isFechada
              ? 'Este chamado passou por triagem, atendimento e foi homologado pela administra��o. A trilha de a��es est� imut�vel e documentada ao lado. Nenhuma nova a��o pode ser inserida.'
              : 'As interven��es, contatos com fornecedores e provid�ncias adotadas pela equipe s�o registradas na trilha ao lado.'}
          </p>

          {isFechada && canReopen && (
            <div className="pt-4 mt-2 border-t border-slate-100">
              {!reabrirFormOpen ? (
                <Button
                  variant="outline"
                  onClick={() => setReabrirFormOpen(true)}
                  className="w-full text-xs font-semibold min-h-[44px] border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reabrir Chamado (Fun��o Administrativa)
                </Button>
              ) : (
                <form onSubmit={handleReabrirOcorrencia} className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700">Justificativa da Reabertura</Label>
                    <textarea
                      className="flex w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 min-h-[80px] resize-y"
                      placeholder="Motivo para reabrir este chamado (obrigat�rio)..."
                      value={motivoReabertura}
                      onChange={(e) => setMotivoReabertura(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700">Devolver responsabilidade para:</Label>
                    <select
                      className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      value={responsavelReabertura}
                      onChange={(e) => setResponsavelReabertura(e.target.value as ResponsavelOcorrencia)}
                    >
                      <option value="Zelador">Zelador</option>
                      <option value="Manuten��o">Manuten��o</option>
                      <option value="Portaria">Portaria</option>
                      <option value="S�ndica">S�ndica</option>
                    </select>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setReabrirFormOpen(false);
                        setMotivoReabertura('');
                      }}
                      className="text-xs h-9"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 shadow-sm"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Reabertura'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */ // FIXME: D�vida t�cnica (Quarentena)
import React from 'react';
import { CheckCircle2, Clock, RotateCcw, AlertTriangle, FileText, UserCheck, ShieldCheck } from 'lucide-react';
import { formatarDataHora } from '@/lib/date-utils';

export function OcorrenciaTimelineHistory(props: any) {
  const { historico } = props;

  if (!historico || historico.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center">
        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <Clock className="h-6 w-6 text-slate-400" />
        </div>
        <div className="text-sm font-semibold text-slate-900 mb-1">Trilha Vazia</div>
        <p className="text-xs text-slate-500 max-w-[250px]">
          Nenhuma a��o foi registrada ainda. O chamado est� exatamente como foi aberto.
        </p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 sm:pl-8 py-2">
      <div className="absolute left-2.5 sm:left-[19px] top-4 bottom-4 w-0.5 bg-slate-200"></div>

      <div className="space-y-6 sm:space-y-8 relative">
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
          } else if (item.responsavelNovo === 'S�ndica') {
            Icone = ShieldCheck;
            iconBg = 'bg-indigo-100 text-indigo-600';
            iconBorder = 'border-indigo-200';
          } else if (item.tipo === 'despacho') {
            Icone = UserCheck;
            iconBg = 'bg-blue-100 text-blue-600';
            iconBorder = 'border-blue-200';
          }

          return (
            <div key={idx} className="relative">
              <div className={'absolute -left-[35px] sm:-left-[43px] h-8 w-8 rounded-full border-2 bg-white flex items-center justify-center shadow-sm ' + iconBorder}>
                <Icone className={'h-4 w-4 ' + iconBg.split(' ')[1]} />
              </div>
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-slate-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="font-bold text-slate-900 text-sm">{item.ator}</div>
                  <div className="text-xs text-slate-500 font-medium whitespace-nowrap bg-slate-100 px-2.5 py-1 rounded-full w-fit">
                    {formatarDataHora(item.data)}
                  </div>
                </div>

                <div className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3 sm:p-4 mb-3 border border-slate-100 leading-relaxed whitespace-pre-wrap">
                  {item.relato}
                </div>

                {(item.responsavelNovo || item.statusNovo) && (
                  <div className="flex flex-wrap items-center gap-2 mt-2 pt-3 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avan�o:</span>
                    {item.responsavelNovo && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <UserCheck className="h-3 w-3" />
                        {item.responsavelNovo}
                      </span>
                    )}
                    {item.statusNovo && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.statusNovo}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

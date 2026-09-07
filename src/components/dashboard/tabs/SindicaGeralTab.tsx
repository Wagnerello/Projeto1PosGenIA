// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unused-vars, max-lines-per-function, complexity, @typescript-eslint/no-explicit-any */ // FIXME: D�vida t�cnica (Quarentena)
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QRCodeSVG } from "qrcode.react";
import { Building2, Users, AlertTriangle, Megaphone, Plus, Search, RefreshCw, CheckCircle2, QrCode, UserCheck, UserX, Layers, Check } from "lucide-react";
import { formatarDataHora } from "@/lib/date-utils";
import { getStatusConfig, getResponsavelConfig } from "@/lib/ocorrencia-helpers";
import { getCategoriaAvisoConfig } from "@/lib/aviso-helpers";

export function SindicaGeralTab(props: any) {
  const { condo, unidadesStats, moradoresStats, ocorrenciasStats, avisosStats, setActiveTab, showToast } = props;
  return (
<TabsContent value="geral" className="space-y-5 mt-0">
              {/* Barra de Boas-Vindas e Ações Rápidas (Sem redundâncias de botões) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Olá, {appUser?.nome ? appUser.nome.split(' ')[0] : 'Síndica'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Resumo do condomínio em tempo real.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(moradorLink, 'home')}
                    className="h-9 text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer min-h-[44px] sm:min-h-[36px]"
                  >
                    {copiedField === 'home' ? (
                      <><Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Link Copiado</>
                    ) : (
                      <><Copy className="h-3.5 w-3.5 mr-1 text-slate-500" /> Copiar Convite</>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadAllData}
                    className="h-9 w-9 p-0 text-slate-500 hover:text-slate-800 rounded-xl min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center cursor-pointer"
                    title="Atualizar dados"
                    aria-label="Atualizar dados"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Alerta de Ações Prioritárias (Exibido apenas quando houver pendências reais) */}
              {pendingUsers.length > 0 || ocorrenciasStats.aguardandoValidacao > 0 ? (
                <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Ações Pendentes</p>
                      <p className="text-xs text-amber-800 mt-0.5">
                        {pendingUsers.length > 0 && `${pendingUsers.length} morador(es) aguardando aprovação`}
                        {pendingUsers.length > 0 && ocorrenciasStats.aguardandoValidacao > 0 && ' • '}
                        {ocorrenciasStats.aguardandoValidacao > 0 && `${ocorrenciasStats.aguardandoValidacao} chamado(s) para validar`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pendingUsers.length > 0 && (
                      <Button
                        size="sm"
                        onClick={() => setActiveTab('aprovacoes')}
                        className="h-8 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg cursor-pointer"
                      >
                        Aprovações ({pendingUsers.length})
                      </Button>
                    )}
                    {ocorrenciasStats.aguardandoValidacao > 0 && (
                      <Button
                        size="sm"
                        onClick={() => setActiveTab('ocorrencias')}
                        className="h-8 px-3 text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg cursor-pointer"
                      >
                        Validar ({ocorrenciasStats.aguardandoValidacao})
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3 bg-emerald-50/50 border border-emerald-200/60 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Nenhuma pendência urgente. Todos os cadastros e chamados estão em dia.</span>
                </div>
              )}

              {/* 4 Indicadores Principais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* 1. Solicitações Pendentes */}
                <div
                  onClick={() => setActiveTab('aprovacoes')}
                  className={`bg-white rounded-2xl p-4 border transition-all duration-150 cursor-pointer group space-y-2.5 ${
                    pendingUsers.length > 0
                      ? 'border-rose-200 bg-rose-50/20 hover:border-rose-300 shadow-xs'
                      : 'border-slate-200/80 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Aprovações</span>
                    <UserCheck className={`h-4 w-4 ${pendingUsers.length > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold tracking-tight ${pendingUsers.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                      {pendingUsers.length}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {pendingUsers.length > 0 ? 'Aguardando validação' : 'Nenhuma pendente'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-600 group-hover:text-indigo-600">
                    <span>Ver solicitações</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                {/* 2. Chamados Ativos */}
                <div
                  onClick={() => setActiveTab('ocorrencias')}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all duration-150 cursor-pointer group space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Chamados Ativos</span>
                    <FileText className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 tracking-tight">
                      {ocorrenciasStats.pendentes + ocorrenciasStats.emAtendimento + ocorrenciasStats.aguardandoValidacao}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {ocorrenciasStats.resolvidas} resolvidos de {ocorrencias.length}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-600 group-hover:text-indigo-600">
                    <span>Ver ocorrências</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                {/* 3. Moradores Ativos */}
                <div
                  onClick={() => setActiveTab('moradores')}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all duration-150 cursor-pointer group space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Moradores</span>
                    <Users className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 tracking-tight">{activeUsers.length}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {moradoresStats.inativos > 0 ? `${moradoresStats.inativos} inativo(s)` : 'Acesso liberado'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-600 group-hover:text-emerald-700">
                    <span>Gerenciar cadastros</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                {/* 4. Unidades Ocupadas */}
                <div
                  onClick={() => setActiveTab('unidades')}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all duration-150 cursor-pointer group space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Ocupação</span>
                    <Building2 className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 tracking-tight">
                      {unidades.length > 0 ? `${Math.round((unidadesOcupadas / unidades.length) * 100)}%` : '0%'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {unidadesOcupadas} de {unidades.length} unidades ocupadas
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-600 group-hover:text-indigo-600">
                    <span>Ver apartamentos</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Grid de Atividades: Ocorrências e Mural */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Coluna Esquerda: Ocorrências Recentes */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Ocorrências Recentes</h3>
                      <p className="text-xs text-slate-500">Chamados que exigem atenção ou despacho.</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('ocorrencias')}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 h-8 px-2.5 cursor-pointer"
                    >
                      Ver todas ({ocorrencias.length}) <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>

                  {chamadosAtencao.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-xl">
                      <CheckCircle2 className="h-7 w-7 text-emerald-500 mx-auto" />
                      <p className="text-xs font-semibold text-slate-700">Sem chamados pendentes</p>
                      <p className="text-[11px] text-slate-400">Todas as ocorrências registradas foram resolvidas.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {chamadosAtencao.map((oc) => {
                        const stCfg = getStatusConfig(oc.status);
                        const precisaValidacao = oc.status === 'Aguardando Validação da Síndica';

                        return (
                          <div
                            key={oc.id}
                            className={`p-3.5 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                              precisaValidacao
                                ? 'bg-purple-50/40 border-purple-200'
                                : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-xs text-slate-900 truncate max-w-[200px] sm:max-w-none">
                                  {oc.titulo}
                                </span>
                                {oc.urgencia === 'Alta' && (
                                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                                    Alta
                                  </span>
                                )}
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${stCfg.bgClass} ${stCfg.textClass} ${stCfg.borderClass}`}>
                                  {stCfg.label}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                {oc.unidadeNome || 'Geral'} • {oc.autorNome || 'Morador'}
                              </p>
                            </div>

                            <Button
                              size="sm"
                              onClick={() => abrirOcorrenciaDireta(oc)}
                              className={`h-7 px-2.5 text-xs font-medium shrink-0 cursor-pointer ${
                                precisaValidacao
                                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {precisaValidacao ? 'Validar' : 'Ver'}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Coluna Direita: Mural & Acesso Rápido */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Card Mural */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Megaphone className="h-4 w-4 text-indigo-600" />
                        <h4 className="font-bold text-slate-900 text-sm">Último Comunicado</h4>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab('mural')}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 h-8 px-2 cursor-pointer"
                      >
                        Mural ({avisos.length}) <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>

                    {ultimoAviso ? (
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <Badge variant="outline" className="text-[10px] font-semibold bg-white">
                            {ultimoAviso.categoria || 'Geral'}
                          </Badge>
                          <span className="text-slate-400">
                            {formatarDataHora(ultimoAviso.createdAt)}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 text-xs">{ultimoAviso.titulo}</p>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {ultimoAviso.mensagem}
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400 text-xs space-y-2">
                        <p>Nenhum comunicado publicado ainda.</p>
                        <Button
                          size="sm"
                          onClick={openNovoAviso}
                          className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                        >
                          Publicar Comunicado
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Card Atalho Convite & QR */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900">Convite aos Moradores</p>
                      <p className="text-[11px] text-slate-500">QR Code pronto para mural e portaria.</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveTab('qrcode')}
                      className="text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-50 h-8 cursor-pointer"
                    >
                      <QrCode className="h-3.5 w-3.5 mr-1 text-slate-500" /> Ver QR Code
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
  );
}


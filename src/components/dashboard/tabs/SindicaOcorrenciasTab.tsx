// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unused-vars, max-lines-per-function, @typescript-eslint/no-explicit-any */ // FIXME: D�vida t�cnica (Quarentena)
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

export function SindicaOcorrenciasTab(props: any) {
  const { ocorrencias, ocorrenciaSearch, setOcorrenciaSearch, ocorrenciaStatusFilter, setOcorrenciaStatusFilter, ocorrenciaRespFilter, setOcorrenciaRespFilter, ocorrenciasStats, filteredOcorrencias, abrirOcorrenciaDireta, showToast } = props;
  return (
<TabsContent value="ocorrencias" className="mt-4 space-y-4">
          {selectedOcorrencia ? (
            <OcorrenciaTimelineJanela
              ocorrencia={selectedOcorrencia}
              userRole="sindica"
              userName={appUser?.nome || 'Síndica'}
              onVoltar={() => setSelectedOcorrencia(null)}
              onDespachar={handleDespacharOcorrencia}
            />
          ) : (
            <>
              {/* Card principal com lista limpa e filtros */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="bg-white rounded-t-xl border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                        Ocorrências e Atendimentos
                      </CardTitle>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {ocorrencias.length} no total • {ocorrenciasStats.pendentes + ocorrenciasStats.emAtendimento} em andamento
                      </span>
                    </div>
                    <CardDescription className="text-xs text-slate-500 mt-1">
                      Acompanhe e despache os chamados abertos pelos moradores ou portaria.
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={loadAllData} className="self-end md:self-auto text-xs text-slate-500 hover:text-slate-800 cursor-pointer">
                    <RefreshCw className="h-3.5 w-3.5 mr-1" /> Atualizar
                  </Button>
                </CardHeader>

                <CardContent className="p-4 bg-white rounded-b-xl space-y-4">
                  {/* Pills de Filtro de Status com Contadores Integrados */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                    {[
                      { id: 'all', label: `Todas (${ocorrencias.length})` },
                      { id: 'Pendente', label: `Pendentes (${ocorrenciasStats.pendentes})` },
                      { id: 'Em Atendimento', label: `Em Atendimento (${ocorrenciasStats.emAtendimento})` },
                      { id: 'Aguardando Validação da Síndica', label: `Aguardando Validação (${ocorrenciasStats.aguardandoValidacao})` },
                      { id: 'Resolvido', label: `Resolvidos (${ocorrenciasStats.resolvidas})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setOcorrenciaStatusFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer text-xs ${
                          ocorrenciaStatusFilter === tab.id
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Barra de Busca e Responsável */}
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:w-80">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder="Buscar por chamado, morador ou unidade..."
                        value={ocorrenciaSearch}
                        onChange={(e) => setOcorrenciaSearch(e.target.value)}
                        className="pl-9 text-sm h-10 border-slate-200 rounded-xl"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Label className="text-xs text-slate-500 whitespace-nowrap">Responsável:</Label>
                      <select
                        value={ocorrenciaRespFilter}
                        onChange={(e) => setOcorrenciaRespFilter(e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white font-medium text-slate-700 shadow-xs cursor-pointer focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="all">Todos os Responsáveis</option>
                        <option value="Síndica">Síndica / Adm</option>
                        <option value="Zeladoria">Zeladoria</option>
                        <option value="Portaria">Portaria</option>
                        <option value="Prestador Externo">Prestador Externo</option>
                      </select>
                    </div>
                  </div>

                  {/* Tabela Limpa */}
                  {filteredOcorrenciasList.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 space-y-2">
                      <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                      <p className="font-semibold text-slate-700">Nenhum chamado encontrado</p>
                      <p className="text-sm">Não há ocorrências com os critérios de filtro selecionados.</p>
                    </div>
                  ) : (
                    <div className="border border-slate-100 rounded-lg overflow-hidden">
                      {/* Visão Desktop (>= 768px): Tabela Tradicional */}
                      <div className="hidden md:block overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-slate-50">
                            <TableRow>
                              <TableHead>Chamado & Local</TableHead>
                              <TableHead>Prioridade</TableHead>
                              <TableHead>Responsável Atual</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Ação</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredOcorrenciasList.map((oc) => {
                              const stCfg = getStatusConfig(oc.status);
                              const rsCfg = getResponsavelConfig(oc.responsavelAtual);
                              const precisaValidacao = oc.status === 'Aguardando Validação da Síndica';

                              return (
                                <TableRow key={oc.id} className={`hover:bg-slate-50/60 ${precisaValidacao ? 'bg-purple-50/30' : ''}`}>
                                  <TableCell className="font-medium text-slate-800">
                                    <div className="font-semibold text-slate-900">{oc.titulo}</div>
                                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                                      <span className="font-medium text-slate-700">{oc.unidadeNome || 'Geral'}</span>
                                      <span>•</span>
                                      <span>{oc.autorNome || 'Morador'}</span>
                                    </div>
                                  </TableCell>

                                  <TableCell>
                                    {oc.urgencia === 'Alta' && (
                                      <Badge variant="destructive" className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200 text-xs font-semibold">
                                        <AlertTriangle className="mr-1 h-3 w-3" /> Alta
                                      </Badge>
                                    )}
                                    {oc.urgencia === 'Média' && (
                                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 text-xs font-medium">
                                        Média
                                      </Badge>
                                    )}
                                    {oc.urgencia === 'Baixa' && (
                                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 text-xs font-medium">
                                        Baixa
                                      </Badge>
                                    )}
                                    {!oc.urgencia && (
                                      <span className="text-xs text-slate-400">Normal</span>
                                    )}
                                  </TableCell>

                                  <TableCell>
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border inline-flex items-center gap-1 ${rsCfg.bgClass} ${rsCfg.textClass} ${rsCfg.borderClass}`}>
                                      {rsCfg.label}
                                    </span>
                                  </TableCell>

                                  <TableCell>
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border inline-flex items-center gap-1 ${stCfg.bgClass} ${stCfg.textClass} ${stCfg.borderClass}`}>
                                      {stCfg.label}
                                    </span>
                                  </TableCell>

                                  <TableCell className="text-right">
                                    <Button
                                      size="sm"
                                      onClick={() => setSelectedOcorrencia(oc)}
                                      className={`font-medium cursor-pointer ${
                                        precisaValidacao
                                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                      }`}
                                    >
                                      <FileText className="h-3.5 w-3.5 mr-1.5" />
                                      {precisaValidacao ? 'Validar & Fechar' : 'Ver Trilha & Despachar'}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Visão Mobile (< 768px): Cards Táteis */}
                      <div className="block md:hidden divide-y divide-slate-100 bg-white">
                        {filteredOcorrenciasList.map((oc) => {
                          const stCfg = getStatusConfig(oc.status);
                          const rsCfg = getResponsavelConfig(oc.responsavelAtual);
                          const precisaValidacao = oc.status === 'Aguardando Validação da Síndica';

                          return (
                            <div
                              key={oc.id}
                              className={`p-4 space-y-3 ${precisaValidacao ? 'bg-purple-50/20' : ''}`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium border inline-flex items-center gap-1 ${stCfg.bgClass} ${stCfg.textClass} ${stCfg.borderClass}`}>
                                  {stCfg.label}
                                </span>
                                {oc.urgencia === 'Alta' ? (
                                  <Badge variant="destructive" className="bg-rose-100 text-rose-700 border-rose-200 text-[10px] font-semibold">
                                    <AlertTriangle className="mr-1 h-3 w-3" /> Alta
                                  </Badge>
                                ) : oc.urgencia === 'Média' ? (
                                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-medium">
                                    Média
                                  </Badge>
                                ) : oc.urgencia === 'Baixa' ? (
                                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-medium">
                                    Baixa
                                  </Badge>
                                ) : null}
                              </div>

                              <div>
                                <h4 className="font-bold text-slate-900 text-sm leading-snug">{oc.titulo}</h4>
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                                  <span className="font-medium text-slate-700">{oc.unidadeNome || 'Geral'}</span>
                                  <span>•</span>
                                  <span>{oc.autorNome || 'Morador'}</span>
                                </p>
                              </div>

                              <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <span>Responsável atual:</span>
                                <span className="font-medium text-slate-700">{rsCfg.label}</span>
                              </div>

                              <Button
                                size="sm"
                                onClick={() => setSelectedOcorrencia(oc)}
                                className={`w-full h-10 font-semibold text-xs rounded-xl touch-target cursor-pointer justify-center ${
                                  precisaValidacao
                                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                              >
                                <FileText className="h-4 w-4 mr-1.5" />
                                {precisaValidacao ? 'Validar & Fechar' : 'Ver Trilha & Despachar'}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
  );
}


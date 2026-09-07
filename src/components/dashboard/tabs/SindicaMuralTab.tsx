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

export function SindicaMuralTab(props: any) {
  const { avisos, searchAviso, setSearchAviso, filterAvisoCategoria, setFilterAvisoCategoria, filterAvisoDestinatario, setFilterAvisoDestinatario, avisosStats, filteredAvisos, openNovoAviso, openEditAviso, setDeletingAviso, showToast } = props;
  return (
<TabsContent value="mural" className="mt-4 space-y-4">
              {isCriandoAviso ? (
                <NovaPublicacaoJanela
                  key={editingAviso?.id || 'janela-nova-publicacao'}
                  initialData={editingAviso}
                  onVoltar={() => {
                    setIsCriandoAviso(false);
                    setEditingAviso(null);
                  }}
                  onSave={handleSaveAviso}
                  availableTorres={availableTorres}
                  condominioId={appUser?.condominioId || ''}
                  criadoPorNome={appUser?.nome || 'Síndica'}
                  criadoPorUid={appUser?.uid || ''}
                />
              ) : (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="bg-white rounded-t-xl border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                          Mural de Comunicados
                        </CardTitle>
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {avisosStats.total} avisos • {avisosStats.gerais} gerais • {avisosStats.blocos} por bloco
                        </span>
                      </div>
                      <CardDescription className="text-xs text-slate-500 mt-1">
                        Publique avisos gerais ou segmentados por bloco com notificação para os moradores.
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={openNovoAviso}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs h-9 self-start sm:self-auto cursor-pointer"
                    >
                      <Plus className="h-4 w-4 mr-1.5" /> Novo Comunicado
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4 bg-white rounded-b-xl space-y-4">
                    {/* Barra de Filtros e Métricas do Mural */}
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="relative flex-1 max-w-md">
                        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          placeholder="Buscar no mural por título, mensagem ou bloco..."
                          value={searchAviso}
                          onChange={(e) => setSearchAviso(e.target.value)}
                          className="pl-9 text-sm h-10 border-slate-200 rounded-xl"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={filterAvisoCategoria}
                          onChange={(e) => setFilterAvisoCategoria(e.target.value)}
                          className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="all">Todas as Categorias</option>
                          <option value="Geral">Geral</option>
                          <option value="Manutenção">Manutenção</option>
                          <option value="Assembleia">Assembleia</option>
                          <option value="Segurança">Segurança</option>
                          <option value="Convivência">Convivência</option>
                        </select>

                        <select
                          value={filterAvisoDestinatario}
                          onChange={(e) => setFilterAvisoDestinatario(e.target.value)}
                          className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="all">Todos os Públicos</option>
                          <option value="todos">Geral (Todos)</option>
                          <option value="bloco">Segmentado por Bloco</option>
                        </select>
                      </div>
                    </div>

                    {filteredAvisos.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 space-y-3">
                        <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
                          <Megaphone className="h-6 w-6" />
                        </div>
                        <p className="font-semibold text-slate-700">
                          {avisos.length === 0
                            ? 'Nenhum comunicado publicado ainda'
                            : 'Nenhum comunicado corresponde aos filtros selecionados'}
                        </p>
                        <p className="text-sm max-w-md mx-auto">
                          {avisos.length === 0
                            ? 'Utilize o mural para avisar sobre manutenções preventivas, assembleias, regras de convivência ou recados gerais.'
                            : 'Tente ajustar os termos de busca ou filtros de categoria e público-alvo.'}
                        </p>
                        {avisos.length === 0 && (
                          <Button
                            size="sm"
                            onClick={openNovoAviso}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white mt-2 cursor-pointer"
                          >
                            <Plus className="h-4 w-4 mr-1.5" /> Criar Primeiro Comunicado
                          </Button>
                        )}
                      </div>
                    ) : (
                    <div className="space-y-4">
                      {filteredAvisos.map((av) => {
                        const catConfig = getCategoriaAvisoConfig(av.categoria);
                        const isBloco = av.destinatarioTipo === 'bloco' && av.blocoDestino;
                        const dataFormatada = formatarDataHora(av.createdAt);

                        return (
                          <div
                            key={av.id}
                            className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-xs space-y-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className={`text-xs font-semibold ${catConfig.badgeClass}`}>
                                  {catConfig.label}
                                </Badge>
                                {isBloco ? (
                                  <Badge className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50 text-xs font-medium">
                                    <Building2 className="h-3 w-3 mr-1" />
                                    Exclusivo: {av.blocoDestino}
                                  </Badge>
                                ) : (
                                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50 text-xs font-medium">
                                    <Users className="h-3 w-3 mr-1" />
                                    Todos os Moradores
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 mr-1">{dataFormatada}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditAviso(av)}
                                  className="h-7 px-2.5 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 cursor-pointer"
                                  title="Editar comunicado"
                                  aria-label="Editar comunicado"
                                >
                                  <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setDeletingAviso(av)}
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                  title="Excluir comunicado"
                                  aria-label="Excluir comunicado"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-base font-bold text-slate-900">{av.titulo}</h4>
                              <p className="text-sm text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                                {av.mensagem}
                              </p>
                            </div>

                            <div className="text-xs text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                              <span>Publicado por: <strong>{av.criadoPorNome || 'Síndica'}</strong></span>
                              {av.updatedAt && (
                                <span className="text-[11px] text-slate-400 italic">
                                  Editado recentemente
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
  );
}


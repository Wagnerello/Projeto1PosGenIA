// @ts-nocheck
/* eslint-disable quality/max-lines, @typescript-eslint/no-unused-vars, max-lines-per-function, @typescript-eslint/no-explicit-any */ // FIXME: D�vida t�cnica (Quarentena)
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Search, Home, Check, X, UserX, UserCheck, Pencil, Trash2 } from "lucide-react";
import { MoradorEditorJanela } from "@/components/dashboard/MoradorEditorJanela";
import { formatarDataHora } from "@/lib/date-utils";
import { resolveMoradorStatus, getMoradorStatusConfig } from "@/lib/morador-helpers";

export function SindicaMoradoresTab(props: any) {
  const {
    moradores = [],
    editingMorador,
    unidades = [],
    savingMorador,
    setEditingMorador,
    handleSaveMorador,
    moradoresStats = { total: 0, ativos: 0, pendentes: 0, inativos: 0 },
    filterMoradorStatus,
    setFilterMoradorStatus,
    searchMorador,
    setSearchMorador,
    filterMoradorTorre,
    setFilterMoradorTorre,
    availableTorres = [],
    torres = [],
    filteredMoradores = [],
    openEditMorador,
    actionLoading,
    handleQuickStatusChange,
    setRejectingMorador,
    setDeletingMorador,
    showToast,
  } = props;
  return (
<TabsContent value="moradores" className="mt-4 space-y-4">
              {editingMorador ? (
                <MoradorEditorJanela
                  morador={editingMorador}
                  unidades={unidades}
                  saving={savingMorador}
                  onVoltar={() => setEditingMorador(null)}
                  onSalvar={handleSaveMorador}
                />
              ) : (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="bg-white rounded-t-xl border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                          <Users className="h-5 w-5 text-indigo-600" /> Moradores do Condomínio
                        </CardTitle>
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {moradoresStats.total} cadastrados • {moradoresStats.ativos} ativos
                          {moradoresStats.pendentes > 0 && ` • ${moradoresStats.pendentes} aguardando validação`}
                        </span>
                      </div>
                      <CardDescription className="text-xs text-slate-500 mt-1">
                        Consulte os moradores cadastrados, ajuste unidades e altere permissões de acesso.
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 bg-white rounded-b-xl space-y-4">
                    {/* Pills de Filtro de Status com Contadores Integrados */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                      {[
                        { id: 'all', label: `Todos (${moradoresStats.total})` },
                        { id: 'ativo', label: `Ativos (${moradoresStats.ativos})` },
                        { id: 'pendente', label: `Aguardando (${moradoresStats.pendentes})` },
                        { id: 'inativo', label: `Inativos (${moradoresStats.inativos})` },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setFilterMoradorStatus(tab.id)}
                          className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer text-xs ${
                            filterMoradorStatus === tab.id
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Barra de Filtros e Busca */}
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                      <div className="relative flex-1 max-w-md">
                        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          placeholder="Buscar por nome, e-mail, telefone ou apartamento..."
                          value={searchMorador}
                          onChange={(e) => setSearchMorador(e.target.value)}
                          className="pl-9 text-sm h-10 border-slate-200 rounded-xl"
                        />
                      </div>

                      {availableTorres.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-slate-500 whitespace-nowrap">Filtrar Bloco:</Label>
                          <select
                            value={filterMoradorTorre}
                            onChange={(e) => setFilterMoradorTorre(e.target.value)}
                            className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                          >
                            <option value="all">Todas as Torres/Blocos</option>
                            {availableTorres.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Tabela de Moradores */}
                    {filteredMoradores.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 space-y-2">
                        <Users className="h-10 w-10 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-700">
                          {moradores.length === 0 ? 'Nenhum morador cadastrado ainda.' : 'Nenhum morador encontrado com os filtros aplicados.'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {moradores.length === 0
                            ? 'Compartilhe o QR Code na portaria ou no grupo oficial para que os moradores se registrem.'
                            : 'Tente limpar a busca ou selecionar outro status/bloco.'}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-200 overflow-hidden">
                        {/* Visão Desktop (>= 768px): Tabela Tradicional */}
                        <div className="hidden md:block overflow-x-auto">
                          <Table>
                            <TableHeader className="bg-slate-50">
                              <TableRow>
                                <TableHead>Morador</TableHead>
                                <TableHead>Apartamento</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredMoradores.map((u) => {
                                const st = resolveMoradorStatus(u);
                                const stConfig = getMoradorStatusConfig(st);
                                const uid = u.uid || u.id || '';
                                const isLoadingItem = actionLoading === uid;

                                return (
                                  <TableRow key={uid} className="hover:bg-slate-50/60 transition-colors">
                                    <TableCell>
                                      <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold border border-indigo-100">
                                          {(u.nome || 'M').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                          <p className="font-semibold text-slate-900 text-sm">{u.nome || 'Nome não informado'}</p>
                                          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                            <span>{u.email}</span>
                                            {u.telefone && (
                                              <>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-slate-600 font-medium">{u.telefone}</span>
                                              </>
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 text-xs font-medium">
                                        <Home className="h-3 w-3 mr-1 text-slate-400" />
                                        {u.unidadeNome || 'Não vinculado'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className={`text-xs font-semibold ${stConfig.badgeClass} flex items-center gap-1.5 w-fit`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${stConfig.dotClass}`} />
                                        {stConfig.label}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        {st === 'pendente' && (
                                          <>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleQuickStatusChange(uid, 'ativo')}
                                              disabled={isLoadingItem}
                                              className="h-7 px-2 text-xs font-semibold text-emerald-700 border-emerald-200 bg-emerald-50/40 hover:bg-emerald-100 cursor-pointer"
                                              title="Aprovar e Liberar Acesso"
                                            >
                                              <Check className="h-3.5 w-3.5 mr-1" /> Aprovar
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => setRejectingMorador(u)}
                                              disabled={isLoadingItem}
                                              className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50 cursor-pointer"
                                              title="Recusar Acesso"
                                            >
                                              <X className="h-3.5 w-3.5 mr-1" /> Recusar
                                            </Button>
                                          </>
                                        )}

                                        {st === 'ativo' && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleQuickStatusChange(uid, 'inativo')}
                                            disabled={isLoadingItem}
                                            className="h-7 px-2 text-xs text-slate-500 hover:text-amber-700 hover:bg-amber-50 cursor-pointer"
                                            title="Suspender Acesso Temporariamente"
                                          >
                                            <UserX className="h-3.5 w-3.5 mr-1 text-amber-600" /> Suspender
                                          </Button>
                                        )}

                                        {st === 'inativo' && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleQuickStatusChange(uid, 'ativo')}
                                            disabled={isLoadingItem}
                                            className="h-7 px-2 text-xs text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                                            title="Reativar Acesso do Morador"
                                          >
                                            <UserCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Reativar
                                          </Button>
                                        )}

                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => openEditMorador(u)}
                                          disabled={isLoadingItem}
                                          className="h-7 px-2.5 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 cursor-pointer"
                                          title="Editar Dados Cadastrais e Unidade"
                                        >
                                          <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                                        </Button>

                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => setDeletingMorador(u)}
                                          disabled={isLoadingItem}
                                          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                          title="Excluir Morador do Condomínio"
                                          aria-label="Excluir Morador"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Visão Mobile (< 768px): Cards Táteis com Gestão Completa */}
                        <div className="block md:hidden divide-y divide-slate-100 bg-white">
                          {filteredMoradores.map((u) => {
                            const st = resolveMoradorStatus(u);
                            const stConfig = getMoradorStatusConfig(st);
                            const uid = u.uid || u.id || '';
                            const isLoadingItem = actionLoading === uid;

                            return (
                              <div key={uid} className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2.5">
                                    <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold border border-indigo-100 shrink-0">
                                      {(u.nome || 'M').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-900 text-sm leading-snug">{u.nome || 'Nome não informado'}</p>
                                      <p className="text-xs text-slate-500 mt-0.5">{u.email}</p>
                                      {u.telefone && (
                                        <p className="text-[11px] text-slate-600 font-medium mt-0.5">{u.telefone}</p>
                                      )}
                                    </div>
                                  </div>
                                  <Badge variant="outline" className={`text-[11px] font-semibold ${stConfig.badgeClass} flex items-center gap-1 shrink-0`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${stConfig.dotClass}`} />
                                    {stConfig.label}
                                  </Badge>
                                </div>

                                <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                  <span className="text-slate-500">Apartamento:</span>
                                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                                    <Home className="h-3.5 w-3.5 text-indigo-500" />
                                    {u.unidadeNome || 'Não vinculado'}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                  {st === 'pendente' && (
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={() => handleQuickStatusChange(uid, 'ativo')}
                                        disabled={isLoadingItem}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-semibold rounded-lg touch-target justify-center"
                                      >
                                        <Check className="h-3.5 w-3.5 mr-1" /> Aprovar
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setRejectingMorador(u)}
                                        disabled={isLoadingItem}
                                        className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs h-9 rounded-lg touch-target justify-center"
                                      >
                                        <X className="h-3.5 w-3.5 mr-1" /> Recusar
                                      </Button>
                                    </>
                                  )}

                                  {st === 'ativo' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleQuickStatusChange(uid, 'inativo')}
                                      disabled={isLoadingItem}
                                      className="text-amber-700 border-amber-200 hover:bg-amber-50 text-xs h-9 rounded-lg touch-target"
                                    >
                                      <UserX className="h-3.5 w-3.5 mr-1" /> Suspender
                                    </Button>
                                  )}

                                  {st === 'inativo' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleQuickStatusChange(uid, 'ativo')}
                                      disabled={isLoadingItem}
                                      className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs h-9 rounded-lg touch-target"
                                    >
                                      <UserCheck className="h-3.5 w-3.5 mr-1" /> Reativar
                                    </Button>
                                  )}

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditMorador(u)}
                                    disabled={isLoadingItem}
                                    className="flex-1 border-slate-300 text-slate-700 text-xs h-9 font-semibold rounded-lg touch-target justify-center"
                                  >
                                    <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setDeletingMorador(u)}
                                    disabled={isLoadingItem}
                                    className="h-9 w-9 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 touch-target"
                                    title="Excluir Morador"
                                    aria-label="Excluir Morador"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
  );
}


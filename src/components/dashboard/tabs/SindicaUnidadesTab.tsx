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

export function SindicaUnidadesTab(props: any) {
  const { unidades, setUnidades, searchUnit, setSearchUnit, filterTorre, setFilterTorre, torres, unidadesStats, filteredUnidades, openEditUnitModal, setDeletingUnit, openCreateUnitModal, setResetModalOpen, setRenomearBlocoModalOpen, showToast } = props;
  return (
<TabsContent value="unidades" className="mt-4 space-y-4">
              {unitModalOpen || editingUnit ? (
                <UnidadeEditorJanela
                  initialData={editingUnit}
                  saving={savingUnit}
                  errorMessage={unitFormError}
                  onSalvar={handleSaveUnit}
                  onVoltar={() => {
                    setUnitModalOpen(false);
                    setEditingUnit(null);
                    setUnitFormError('');
                  }}
                />
              ) : resetModalOpen ? (
                <RegerarEstruturaJanela
                  unidadesAtuaisCount={unidades.length}
                  resetting={resettingUnits}
                  onConfirmar={handleResetEstrutura}
                  onVoltar={() => setResetModalOpen(false)}
                />
              ) : renomearBlocoModalOpen ? (
                <RenomearBlocoJanela
                  availableTorres={availableTorres}
                  initialBloco={blocoAlvoRenomear || (availableTorres[0] ?? '')}
                  unitsCountByTorre={unitsCountByTorre}
                  renaming={isRenamingBloco}
                  onConfirmar={handleConfirmarRenameBloco}
                  onVoltar={() => {
                    setRenomearBlocoModalOpen(false);
                    setBlocoAlvoRenomear(null);
                  }}
                />
              ) : (
                <>
                  {/* Card principal com barra de ações e tabela */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="bg-white rounded-t-xl border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                            Unidades do Condomínio
                          </CardTitle>
                          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                            {unitStats.total} unidades • {unitStats.ocupadas} ocupadas ({unitStats.total > 0 ? Math.round((unitStats.ocupadas / unitStats.total) * 100) : 0}%) • {unitStats.vagas} vagas
                          </span>
                        </div>
                        <CardDescription className="text-xs text-slate-500 mt-1">
                          Gerencie os apartamentos cadastrados, renomeie blocos ou adicione novas unidades.
                        </CardDescription>
                      </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={openCreateUnitModal}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium cursor-pointer"
                    >
                      <Plus className="h-4 w-4 mr-1.5" /> Nova Unidade
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setBlocoAlvoRenomear(filterTorre !== 'all' ? filterTorre : (availableTorres[0] ?? null));
                        setRenomearBlocoModalOpen(true);
                      }}
                      disabled={availableTorres.length === 0}
                      className="text-amber-700 border-amber-300 hover:bg-amber-50 font-medium cursor-pointer"
                      title={availableTorres.length === 0 ? 'Nenhum bloco cadastrado' : 'Renomear Bloco e atualizar todas as unidades em cascata'}
                    >
                      <Layers className="h-4 w-4 mr-1.5 text-amber-600" /> Renomear Bloco
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setResetModalOpen(true);
                      }}
                      className="text-slate-700 border-slate-300 hover:bg-slate-50 font-medium cursor-pointer"
                    >
                      <RefreshCw className="h-4 w-4 mr-1.5 text-indigo-600" /> Regerar Grade
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 bg-white rounded-b-xl space-y-4">
                  {/* Chips de Gestão Rápida dos Blocos Cadastrados */}
                  {availableTorres.length > 0 && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mr-1">
                        <Layers className="h-3.5 w-3.5 text-indigo-600" /> Blocos:
                      </span>
                      {availableTorres.map((t) => {
                        const count = unitsCountByTorre[t] ?? 0;
                        const isSelectedInFilter = filterTorre === t;
                        return (
                          <div
                            key={t}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                              isSelectedInFilter
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                                : 'bg-white border-slate-200 text-slate-700 shadow-2xs hover:border-slate-300'
                            }`}
                          >
                            <span className="font-semibold">{t}</span>
                            <span className="text-[11px] text-slate-400">({count} un)</span>
                            <button
                              type="button"
                              title={`Renomear ${t} em cascata`}
                              onClick={() => {
                                setBlocoAlvoRenomear(t);
                                setRenomearBlocoModalOpen(true);
                              }}
                              className="text-slate-400 hover:text-amber-600 p-0.5 rounded hover:bg-amber-50 cursor-pointer ml-0.5 transition-colors"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Barra de Filtro e Busca */}
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:w-80">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder="Buscar por número, torre ou andar..."
                        value={searchUnit}
                        onChange={(e) => setSearchUnit(e.target.value)}
                        className="pl-9 text-sm"
                      />
                    </div>
                    {availableTorres.length > 1 && (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Label className="text-xs text-slate-500 whitespace-nowrap">Filtrar Bloco:</Label>
                        <select
                          value={filterTorre}
                          onChange={(e) => setFilterTorre(e.target.value)}
                          className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-700 shadow-xs cursor-pointer"
                        >
                          <option value="all">Todos os Blocos ({unidades.length})</option>
                          {availableTorres.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Tabela de Unidades */}
                  {filteredUnitsList.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 space-y-2">
                      <Building2 className="h-10 w-10 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-700">Nenhuma unidade encontrada</p>
                      <p className="text-sm">Tente ajustar o termo de busca ou adicione uma nova unidade.</p>
                    </div>
                  ) : (
                    <div className="border border-slate-100 rounded-lg overflow-hidden">
                      {/* Visão Desktop (>= 768px): Tabela Tradicional */}
                      <div className="hidden md:block overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-slate-50">
                            <TableRow>
                              <TableHead>Unidade / Apartamento</TableHead>
                              <TableHead>Torre / Bloco</TableHead>
                              <TableHead>Andar</TableHead>
                              <TableHead>Morador(es) Vinculado(s)</TableHead>
                              <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredUnitsList.map((unit) => {
                              const { ativos, pendentes } = getMoradoresDaUnidade(unit.id);
                              return (
                                <TableRow key={unit.id} className="hover:bg-slate-50/60">
                                  <TableCell className="font-semibold text-slate-800">
                                    Apto {unit.numero}
                                  </TableCell>
                                  <TableCell className="text-slate-600 text-sm">
                                    <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700">
                                      {unit.torre || 'Única'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-slate-600 text-sm">
                                    {unit.andar !== undefined && unit.andar !== null ? `${unit.andar}º andar` : '—'}
                                  </TableCell>
                                  <TableCell>
                                    {ativos.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {ativos.map((m) => (
                                          <Badge
                                            key={m.id}
                                            className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-normal text-xs"
                                          >
                                            {m.nome || m.email}
                                          </Badge>
                                        ))}
                                      </div>
                                    ) : pendentes.length > 0 ? (
                                      <Badge
                                        variant="secondary"
                                        className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 text-xs"
                                      >
                                        {pendentes.length} pendente(s) de aprovação
                                      </Badge>
                                    ) : (
                                      <span className="text-xs text-slate-400 font-medium">Vago</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right space-x-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => openEditUnitModal(unit)}
                                      className="h-8 px-2 text-slate-600 hover:text-indigo-600 cursor-pointer"
                                      title="Editar Unidade"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setDeletingUnit(unit)}
                                      className="h-8 px-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                      title="Excluir Unidade"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
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
                        {filteredUnitsList.map((unit) => {
                          const { ativos, pendentes } = getMoradoresDaUnidade(unit.id);
                          return (
                            <div key={unit.id} className="p-4 space-y-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 text-sm">
                                    Apto {unit.numero}
                                  </span>
                                  <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 text-xs">
                                    {unit.torre || 'Única'}
                                  </Badge>
                                  {unit.andar !== undefined && unit.andar !== null && (
                                    <span className="text-xs text-slate-500">
                                      {unit.andar}º andar
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditUnitModal(unit)}
                                    className="h-8 px-2.5 text-xs text-slate-600 border-slate-200 touch-target"
                                    title="Editar Unidade"
                                    aria-label="Editar Unidade"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setDeletingUnit(unit)}
                                    className="h-8 px-2.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 touch-target"
                                    title="Excluir Unidade"
                                    aria-label="Excluir Unidade"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>

                              <div className="pt-1">
                                {ativos.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 items-center">
                                    <span className="text-[11px] text-slate-400 mr-1">Moradores:</span>
                                    {ativos.map((m) => (
                                      <Badge
                                        key={m.id}
                                        className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-normal text-xs"
                                      >
                                        {m.nome || m.email}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : pendentes.length > 0 ? (
                                  <Badge
                                    variant="secondary"
                                    className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 text-xs"
                                  >
                                    {pendentes.length} pendente(s) de aprovação
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-slate-400 font-medium">Unidade vaga</span>
                                )}
                              </div>
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


// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unused-vars, max-lines-per-function, @typescript-eslint/no-explicit-any */ // FIXME: D�vida t�cnica (Quarentena)
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Search, Plus, MapPin, Users, Activity, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, KeyRound, UserCog, RefreshCw, X, Mail, Check, Copy } from "lucide-react";
import { Label } from "@/components/ui/label";

export function SuperAdminCondominiosTab(props: any) {
  const {
    condominios = [],
    filteredCondos = [],
    searchTerm = '',
    setSearchTerm,
    stats = { total: 0, ativos: 0, pendentes: 0 },
    loadingList = false,
    loadCondominios,
    setActiveTab,
    setLastCreated,
    copyToClipboard,
    copiedField,
  } = props;
  return (
<TabsContent value="condominios" className="mt-0 space-y-5">
            {/* 3 Indicadores Macro */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Total de Condomínios</span>
                  <Building2 className="h-4 w-4 text-indigo-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.total}</p>
                <p className="text-[11px] text-slate-500">Bases ativas na plataforma</p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Síndicos(as) Ativos</span>
                  <UserCog className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.ativos}</p>
                <p className="text-[11px] text-slate-500">Contas com acesso configurado</p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Acessos Pendentes</span>
                  <KeyRound className="h-4 w-4 text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.pendentes}</p>
                <p className="text-[11px] text-slate-500">Aguardando ativação por convite</p>
              </div>
            </div>

            {/* Card Principal com Tabela e Filtro */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-white rounded-t-xl border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                      Bases de Condomínios
                    </CardTitle>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {filteredCondos.length} de {condominios.length} condomínio(s)
                    </span>
                  </div>
                  <CardDescription className="text-xs text-slate-500 mt-1">
                    Visualize o status de ativação, síndicos responsáveis e códigos de convite.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadCondominios}
                    className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer h-9"
                    title="Atualizar lista"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loadingList ? 'animate-spin text-indigo-600' : ''}`} />
                    Atualizar
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 bg-white rounded-b-xl space-y-4">
                {/* Barra de Busca */}
                <div className="relative max-w-md w-full">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Buscar por condomínio, síndico, e-mail ou código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-8 text-sm h-10 border-slate-200 rounded-xl"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                      title="Limpar busca"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Tabela de Condomínios */}
                {loadingList ? (
                  <div className="py-16 text-center text-slate-400 space-y-2">
                    <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 mx-auto" />
                    <p className="text-xs font-medium text-slate-600">Carregando condomínios...</p>
                  </div>
                ) : filteredCondos.length === 0 ? (
                  <div className="py-14 text-center text-slate-400 space-y-3">
                    <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700 text-sm">
                        {condominios.length === 0
                          ? 'Nenhum condomínio cadastrado ainda'
                          : 'Nenhum resultado para a busca'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {condominios.length === 0
                          ? 'Cadastre a primeira base de condomínio para liberar acessos.'
                          : 'Tente buscar com outros termos ou limpe o campo de busca.'}
                      </p>
                    </div>
                    {condominios.length === 0 ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          setLastCreated(null);
                          setActiveTab('novo');
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 px-3 rounded-lg cursor-pointer mt-1"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Cadastrar Primeiro Condomínio
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSearchTerm('')}
                        className="text-xs h-8 px-3 rounded-lg cursor-pointer"
                      >
                        Limpar Busca
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    {/* Visão Desktop (>= 768px): Tabela Tradicional */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow className="border-slate-100">
                            <TableHead className="font-semibold text-slate-700 text-xs">Condomínio</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-xs">Síndico(a) Responsável</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-xs">Status Síndica</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-xs">Código Moradores</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-xs text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCondos.map((c) => {
                            const moradorLink = `${window.location.origin}/registro?condoId=${c.id}&invite=${c.codigoConviteMorador}&role=morador`;
                            const hasSindicaUid = Boolean(c.sindicaUid);

                            return (
                              <TableRow key={c.id} className="hover:bg-slate-50/70 border-slate-100">
                                {/* Nome e CNPJ */}
                                <TableCell>
                                  <div>
                                    <p className="font-semibold text-slate-900 text-sm">{c.nome}</p>
                                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                                      {c.cnpj ? `CNPJ: ${c.cnpj}` : 'Sem CNPJ'}
                                    </p>
                                  </div>
                                </TableCell>

                                {/* Síndica */}
                                <TableCell>
                                  <div className="text-sm font-medium text-slate-800">
                                    {c.sindicaNome || 'Não informado'}
                                  </div>
                                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                    <Mail className="h-3 w-3 text-slate-400" />
                                    <span>{c.sindicaEmail || '—'}</span>
                                  </div>
                                </TableCell>

                                {/* Status Síndica */}
                                <TableCell>
                                  {hasSindicaUid ? (
                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs font-medium">
                                      <Check className="h-3 w-3 mr-1" /> Ativa
                                    </Badge>
                                  ) : (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-xs font-medium">
                                        Convite: {c.codigoConviteSindica}
                                      </Badge>
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(c.codigoConviteSindica, `sind-code-${c.id}`, 'Código de convite copiado!')}
                                        className="text-slate-400 hover:text-indigo-600 p-1 rounded cursor-pointer"
                                        title="Copiar código de convite da síndica"
                                        aria-label="Copiar código de convite da síndica"
                                      >
                                        {copiedField === `sind-code-${c.id}` ? (
                                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        ) : (
                                          <Copy className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </TableCell>

                                {/* Código Moradores */}
                                <TableCell>
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800">
                                    <span>{c.codigoConviteMorador || '—'}</span>
                                    {c.codigoConviteMorador && (
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(c.codigoConviteMorador, `morador-code-${c.id}`, 'Código de moradores copiado!')}
                                        className="text-slate-400 hover:text-indigo-600 p-0.5 rounded cursor-pointer ml-1"
                                        title="Copiar código do mural"
                                        aria-label="Copiar código do mural"
                                      >
                                        {copiedField === `morador-code-${c.id}` ? (
                                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        ) : (
                                          <Copy className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </TableCell>

                                {/* Ações */}
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToClipboard(moradorLink, `morador-link-${c.id}`, 'Link de cadastro de moradores copiado!')}
                                    className="h-8 px-2.5 text-xs text-slate-600 hover:text-indigo-600 cursor-pointer"
                                    title="Copiar link de convite dos moradores"
                                  >
                                    {copiedField === `morador-link-${c.id}` ? (
                                      <><Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Copiado</>
                                    ) : (
                                      <><Copy className="h-3.5 w-3.5 mr-1" /> Link Morador</>
                                    )}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Visão Mobile (< 768px): Cartões Táteis Verticais */}
                    <div className="block md:hidden divide-y divide-slate-100 bg-white">
                      {filteredCondos.map((c) => {
                        const moradorLink = `${window.location.origin}/registro?condoId=${c.id}&invite=${c.codigoConviteMorador}&role=morador`;
                        const hasSindicaUid = Boolean(c.sindicaUid);

                        return (
                          <div key={c.id} className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm">{c.nome}</h4>
                                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                  {c.cnpj ? `CNPJ: ${c.cnpj}` : 'Sem CNPJ'}
                                </p>
                              </div>
                              {hasSindicaUid ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold shrink-0">
                                  <Check className="h-3 w-3 mr-1" /> Ativa
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-xs font-medium shrink-0">
                                  Pendente
                                </Badge>
                              )}
                            </div>

                            <div className="bg-slate-50 p-2.5 rounded-lg space-y-1.5 text-xs text-slate-600 border border-slate-100">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Síndica:</span>
                                <span className="font-medium text-slate-800">{c.sindicaNome || 'Não informado'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">E-mail:</span>
                                <span className="text-slate-700 truncate max-w-[180px]">{c.sindicaEmail || '—'}</span>
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                                <span className="text-slate-400">Código Mural:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-slate-800">{c.codigoConviteMorador || '—'}</span>
                                  {c.codigoConviteMorador && (
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(c.codigoConviteMorador, `morador-code-${c.id}`, 'Código de moradores copiado!')}
                                      className="text-slate-400 hover:text-indigo-600 p-1 rounded touch-target"
                                      aria-label="Copiar código do mural"
                                    >
                                      {copiedField === `morador-code-${c.id}` ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(moradorLink, `morador-link-${c.id}`, 'Link de cadastro de moradores copiado!')}
                              className="w-full h-10 border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-semibold touch-target justify-center"
                            >
                              {copiedField === `morador-link-${c.id}` ? (
                                <><Check className="h-4 w-4 mr-1.5 text-emerald-600" /> Link de Morador Copiado</>
                              ) : (
                                <><Copy className="h-4 w-4 mr-1.5" /> Copiar Link de Cadastro de Moradores</>
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
  );
}


// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */ // FIXME: D�vida t�cnica (Quarentena)
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

export function SindicaAprovacoesTab(props: any) {
  const {
    pendingUsers = [],
    actionLoading,
    handleApprove,
    setRejectingMorador,
    loadAllData,
    showToast,
  } = props;
  return (
<TabsContent value="aprovacoes" className="mt-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="bg-white rounded-t-xl border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                        Fila de Liberação de Acesso
                      </CardTitle>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {pendingUsers.length === 0 ? 'Nenhuma pendência' : `${pendingUsers.length} morador(es) aguardando`}
                      </span>
                    </div>
                    <CardDescription className="text-xs text-slate-500 mt-1">
                      Cadastros de moradores que aguardam confirmação para acessar a plataforma.
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={loadAllData} className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer self-end sm:self-auto">
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Atualizar
                  </Button>
                </CardHeader>
                <CardContent className="p-0 bg-white rounded-b-xl">
                  {pendingUsers.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 space-y-2">
                      <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                      <p className="font-semibold text-slate-700">Fila em dia</p>
                      <p className="text-xs text-slate-500">Nenhum morador aguardando liberação de acesso no momento.</p>
                    </div>
                  ) : (
                    <div>
                      {/* Visão Desktop (>= 768px): Tabela Tradicional */}
                      <div className="hidden md:block overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-slate-50">
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>E-mail</TableHead>
                              <TableHead>Apartamento Requisitado</TableHead>
                              <TableHead className="text-right">Ação</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingUsers.map((u) => (
                              <TableRow key={u.id} className="hover:bg-slate-50/60">
                                <TableCell className="font-semibold text-slate-800 text-sm">{u.nome || 'Não informado'}</TableCell>
                                <TableCell className="text-slate-600 text-xs">{u.email}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-indigo-50 border-indigo-200 text-indigo-700 font-medium text-xs">
                                    {u.unidadeNome || `Unidade ${u.unidadeId || 'N/A'}`}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                  <Button
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 rounded-lg cursor-pointer"
                                    disabled={actionLoading === u.id}
                                    onClick={() => handleApprove(u.id)}
                                  >
                                    <UserCheck className="h-3.5 w-3.5 mr-1" />
                                    {actionLoading === u.id ? 'Aprovando...' : 'Aprovar'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs h-8 px-3 rounded-lg cursor-pointer"
                                    disabled={actionLoading === u.id}
                                    onClick={() => setRejectingMorador(u)}
                                  >
                                    <UserX className="h-3.5 w-3.5 mr-1" />
                                    Recusar
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Visão Mobile (< 768px): Cards Táteis com Ações Rápidas */}
                      <div className="block md:hidden divide-y divide-slate-100 bg-white">
                        {pendingUsers.map((u) => (
                          <div key={u.id} className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm">{u.nome || 'Não informado'}</h4>
                                <p className="text-xs text-slate-500 mt-0.5">{u.email}</p>
                              </div>
                              <Badge variant="outline" className="bg-indigo-50 border-indigo-200 text-indigo-700 font-medium text-xs shrink-0">
                                {u.unidadeNome || `Unidade ${u.unidadeId || 'N/A'}`}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <Button
                                size="sm"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-10 rounded-xl cursor-pointer touch-target font-semibold justify-center"
                                disabled={actionLoading === u.id}
                                onClick={() => handleApprove(u.id)}
                              >
                                <UserCheck className="h-4 w-4 mr-1.5" />
                                {actionLoading === u.id ? 'Aprovando...' : 'Aprovar'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 text-xs h-10 rounded-xl cursor-pointer touch-target font-semibold justify-center"
                                disabled={actionLoading === u.id}
                                onClick={() => setRejectingMorador(u)}
                              >
                                <UserX className="h-4 w-4 mr-1.5" />
                                Recusar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
  );
}


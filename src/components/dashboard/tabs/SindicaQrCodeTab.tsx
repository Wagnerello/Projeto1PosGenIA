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

export function SindicaQrCodeTab(props: any) {
  const { condo, rotatingQr, setRotateQrModalOpen, qrCodeUrl, showToast } = props;
  return (
<TabsContent value="qrcode" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Coluna Esquerda: Instruções e Boas Práticas */}
                <Card className="lg:col-span-7 border-0 shadow-sm">
                  <CardHeader className="bg-white rounded-t-xl border-b border-slate-100">
                    <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                      Como Funciona o Convite de Moradores
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-1">
                      Orientações para disponibilizar o cadastro de condôminos de forma rápida e segura.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 bg-white rounded-b-xl space-y-4 text-sm text-slate-600">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                        <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          1
                        </div>
                        <div className="text-xs space-y-0.5">
                          <p className="font-semibold text-slate-800">Afixe ou envie o convite</p>
                          <p className="text-slate-500 leading-relaxed">
                            Imprima o QR Code para colocar no mural do elevador e portaria, ou copie o link direto para enviar no grupo oficial de moradores.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                        <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          2
                        </div>
                        <div className="text-xs space-y-0.5">
                          <p className="font-semibold text-slate-800">Cadastro sem atrito</p>
                          <p className="text-slate-500 leading-relaxed">
                            O morador aponta a câmera do celular, digita seu nome, e-mail e seleciona o apartamento. Não há solicitação de documentos ou dados invasivos.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                        <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          3
                        </div>
                        <div className="text-xs space-y-0.5">
                          <p className="font-semibold text-slate-800">Liberação pela administração</p>
                          <p className="text-slate-500 leading-relaxed">
                            A solicitação vai direto para a aba <strong>Aprovações</strong>. Você valida a unidade e libera o acesso com um clique.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 text-xs text-indigo-900 space-y-1">
                      <p className="font-semibold">Privacidade e Segurança (LGPD)</p>
                      <p className="text-indigo-700 leading-relaxed">
                        Nenhum dado desnecessário é exigido no cadastro. Nenhum morador acessa o sistema sem a sua autorização formal.
                      </p>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const msg = `Olá! Para acessar o sistema do condomínio ${condo?.nome || ''}, use o link de cadastro: ${moradorLink} ou o código de convite: ${condo?.codigoConviteMorador || ''}`;
                          copyToClipboard(msg, 'whatsapp-msg');
                        }}
                        className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50 h-9 rounded-xl cursor-pointer"
                      >
                        {copiedField === 'whatsapp-msg' ? (
                          <><Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> Mensagem Copiada!</>
                        ) : (
                          <><Copy className="mr-1.5 h-3.5 w-3.5 text-slate-500" /> Copiar Mensagem para WhatsApp</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Coluna Direita: Bloco do QR Code */}
                <Card className="lg:col-span-5 border-0 shadow-sm flex flex-col items-center text-center">
                  <CardHeader className="bg-white rounded-t-xl border-b border-slate-100 w-full p-4">
                    <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-center gap-1.5">
                      <QrCode className="h-4 w-4 text-indigo-600" /> QR Code de Acesso
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center space-y-4 w-full p-5 bg-white rounded-b-xl">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                      <QRCodeSVG value={moradorLink} size={160} />
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-mono">
                      <span className="text-slate-400 font-sans">Código do Mural:</span>
                      <strong className="text-slate-900">{condo?.codigoConviteMorador}</strong>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(condo?.codigoConviteMorador || '', 'mural-code')}
                        className="text-slate-400 hover:text-indigo-600 p-0.5 rounded cursor-pointer"
                        title="Copiar código"
                        aria-label="Copiar código"
                      >
                        {copiedField === 'mural-code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="w-full space-y-2">
                      <Button
                        size="sm"
                        className="w-full text-xs h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl cursor-pointer"
                        onClick={() => copyToClipboard(moradorLink, 'morador')}
                      >
                        {copiedField === 'morador' ? (
                          <><Check className="mr-1.5 h-3.5 w-3.5 text-emerald-300" /> Link de Convite Copiado!</>
                        ) : (
                          <><Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar Link de Convite</>
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-slate-500 hover:text-indigo-600 cursor-pointer h-8"
                        onClick={() => setRotateQrModalOpen(true)}
                      >
                        <RefreshCw className="mr-1.5 h-3 w-3" /> Gerar novo código de segurança
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
  );
}


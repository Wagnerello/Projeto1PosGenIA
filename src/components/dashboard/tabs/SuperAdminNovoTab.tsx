// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unused-vars, max-lines-per-function, @typescript-eslint/no-explicit-any */ // FIXME: D�vida t�cnica (Quarentena)
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Search, Plus, MapPin, Users, Activity, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, KeyRound, UserCog, Check, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Label } from "@/components/ui/label";

export function SuperAdminNovoTab(props: any) {
  const {
    nome,
    setNome,
    cnpj,
    setCnpj,
    sindicaNome,
    setSindicaNome,
    sindicaEmail,
    setSindicaEmail,
    sindicaSenha,
    setSindicaSenha,
    error,
    loading,
    handleCreateCondominio,
    setActiveTab,
    lastCreated,
    setLastCreated,
    copyToClipboard,
    copiedField,
  } = props;
  return (
<TabsContent value="novo" className="mt-0">
            {lastCreated ? (
              /* Tela de Conclusão / Credenciais Geradas */
              <Card className="border-0 shadow-sm">
                <CardHeader className="bg-emerald-50/70 border-b border-emerald-100 rounded-t-xl p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg font-bold text-emerald-950">
                          Condomínio "{lastCreated.nome}" cadastrado com sucesso!
                        </CardTitle>
                        <CardDescription className="text-xs text-emerald-800 mt-0.5">
                          As credenciais de acesso da administração e os links de convite foram gerados.
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLastCreated(null)}
                        className="text-xs border-emerald-300 text-emerald-900 hover:bg-emerald-100/60 h-8 rounded-lg cursor-pointer"
                      >
                        Cadastrar Outro
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setLastCreated(null);
                          setActiveTab('condominios');
                        }}
                        className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold h-8 rounded-lg cursor-pointer"
                      >
                        Ver Lista
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 bg-white rounded-b-xl">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Bloco Síndica */}
                    <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                      <div className="flex items-center gap-2">
                        <UserCog className="h-5 w-5 text-indigo-600" />
                        <h4 className="font-bold text-slate-900 text-sm">Credenciais da Síndica</h4>
                      </div>

                      {lastCreated.sindicaCriadaDireto ? (
                        <div className="space-y-2 text-xs bg-white p-4 rounded-xl border border-slate-200">
                          <div>
                            <span className="text-slate-400">Nome:</span>{' '}
                            <strong className="text-slate-800">{lastCreated.sindicaNome}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">E-mail:</span>{' '}
                            <strong className="text-slate-800 font-mono">{lastCreated.sindicaEmail}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Senha Inicial:</span>{' '}
                            <strong className="text-indigo-700 font-mono text-sm">{lastCreated.sindicaSenha}</strong>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-600 bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                          <p className="font-semibold text-slate-800">Código de Convite da Síndica:</p>
                          <p className="font-mono text-sm font-bold text-indigo-700">{lastCreated.codigoConviteSindica}</p>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-9 rounded-xl border-slate-300 text-slate-700 hover:bg-white cursor-pointer"
                        onClick={() =>
                          copyToClipboard(
                            `Acesso da Administração - ${lastCreated.nome}\nLogin: ${lastCreated.sindicaEmail}\nSenha: ${lastCreated.sindicaSenha || 'Defina pelo convite'}\nLink: ${window.location.origin}/login`,
                            'cred',
                            'Dados de login copiados!'
                          )
                        }
                      >
                        {copiedField === 'cred' ? (
                          <><Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> Credenciais Copiadas!</>
                        ) : (
                          <><Copy className="mr-1.5 h-3.5 w-3.5 text-slate-500" /> Copiar Dados de Acesso da Síndica</>
                        )}
                      </Button>
                    </div>

                    {/* Bloco Moradores */}
                    <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col items-center text-center space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-indigo-600" />
                        <h4 className="font-bold text-slate-900 text-sm">QR Code dos Moradores</h4>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                        <QRCodeSVG
                          value={`${window.location.origin}/registro?condoId=${lastCreated.id}&invite=${lastCreated.codigoConviteMorador}&role=morador`}
                          size={140}
                        />
                      </div>

                      <div className="font-mono text-xs bg-white px-3 py-1.5 rounded-lg text-slate-800 border border-slate-200">
                        Código do Mural: <strong>{lastCreated.codigoConviteMorador}</strong>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-9 rounded-xl border-slate-300 text-slate-700 hover:bg-white cursor-pointer"
                        onClick={() =>
                          copyToClipboard(
                            `${window.location.origin}/registro?condoId=${lastCreated.id}&invite=${lastCreated.codigoConviteMorador}&role=morador`,
                            'morador-new',
                            'Link de cadastro copiado!'
                          )
                        }
                      >
                        {copiedField === 'morador-new' ? (
                          <><Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> Link Copiado!</>
                        ) : (
                          <><Copy className="mr-1.5 h-3.5 w-3.5 text-slate-500" /> Copiar Link de Cadastro de Moradores</>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Formulário de Cadastro Limpo */
              <Card className="border-0 shadow-sm max-w-3xl mx-auto">
                <CardHeader className="bg-white rounded-t-xl border-b border-slate-100 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-indigo-600" /> Cadastrar Novo Condomínio
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-1">
                        Cadastre os dados do condomínio e defina as credenciais para acesso da síndica.
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('condominios')}
                      className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer h-8"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Voltar à lista
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-6 bg-white rounded-b-xl">
                  <form onSubmit={handleCreateCondominio} className="space-y-6">
                    {error && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                        {error}
                      </div>
                    )}

                    {/* Seção 1: Dados do Condomínio */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        1. Dados do Condomínio
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label htmlFor="nome" className="text-xs font-medium text-slate-700">
                            Nome do Condomínio *
                          </Label>
                          <Input
                            id="nome"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                            placeholder="Ex: Residencial Mirante da Serra"
                            className="text-sm h-10 border-slate-200 rounded-xl"
                          />
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                          <Label htmlFor="cnpj" className="text-xs font-medium text-slate-700">
                            CNPJ (Opcional)
                          </Label>
                          <Input
                            id="cnpj"
                            value={cnpj}
                            onChange={(e) => setCnpj(e.target.value)}
                            placeholder="00.000.000/0001-00"
                            className="text-sm h-10 border-slate-200 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Seção 2: Acesso da Síndica */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        2. Acesso do(a) Síndico(a) Responsável
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="sindicaNome" className="text-xs font-medium text-slate-700">
                            Nome Completo *
                          </Label>
                          <Input
                            id="sindicaNome"
                            value={sindicaNome}
                            onChange={(e) => setSindicaNome(e.target.value)}
                            required
                            placeholder="Ex: Dra. Mariana Costa"
                            className="text-sm h-10 border-slate-200 rounded-xl"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="sindicaEmail" className="text-xs font-medium text-slate-700">
                            E-mail de Acesso *
                          </Label>
                          <Input
                            id="sindicaEmail"
                            type="email"
                            value={sindicaEmail}
                            onChange={(e) => setSindicaEmail(e.target.value)}
                            required
                            placeholder="sindica@condominio.com"
                            className="text-sm h-10 border-slate-200 rounded-xl"
                          />
                        </div>

                        {/* Senha Inicial */}
                        <div className="space-y-2 sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="sindicaSenha" className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                              <KeyRound className="h-3.5 w-3.5 text-indigo-600" /> Senha Inicial de Acesso
                            </Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 h-7 px-2 cursor-pointer font-medium"
                              onClick={() => setSindicaSenha('Sindica@' + Math.floor(1000 + Math.random() * 9000))}
                            >
                              Gerar Senha Automática
                            </Button>
                          </div>
                          <Input
                            id="sindicaSenha"
                            type="text"
                            value={sindicaSenha}
                            onChange={(e) => setSindicaSenha(e.target.value)}
                            placeholder="Mínimo 6 caracteres (ex: Sindica@1234)"
                            className="bg-white border-slate-200 text-sm h-10 rounded-xl font-mono"
                          />
                          <p className="text-[11px] text-slate-500">
                            Ao definir a senha, a conta de síndica é criada e ativada imediatamente.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setActiveTab('condominios')}
                        className="text-xs text-slate-600 hover:text-slate-900 cursor-pointer h-10 px-4"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-10 px-6 rounded-xl shadow-xs cursor-pointer"
                      >
                        {loading ? 'Cadastrando...' : 'Cadastrar Condomínio'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>
  );
}

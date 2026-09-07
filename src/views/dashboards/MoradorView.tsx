import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  FileText,
  Megaphone,
  PlusCircle,
  Clock,
  CheckCircle2,
  LogOut,
  Loader2,
  Home,
  RefreshCw,
  Building2,
  Users
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { getOcorrencias, createOcorrencia, getCondominio, getAvisos, getUnidade, type AvisoData } from '@/lib/firestore';
import { classificarOcorrenciaComIA } from '@/lib/ai-triagem';
import { getStatusConfig, getResponsavelConfig } from '@/lib/ocorrencia-helpers';
import { getCategoriaAvisoConfig } from '@/lib/aviso-helpers';
import { NovaOcorrenciaJanela } from '@/components/dashboard/NovaOcorrenciaJanela';
import { OcorrenciaTimelineJanela } from '@/components/common/OcorrenciaTimelineJanela';
import { formatarDataHora } from '@/lib/date-utils';

export default function MoradorView() {
  const { appUser } = useAuth();
  const [condoNome, setCondoNome] = useState('');
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [avisos, setAvisos] = useState<AvisoData[]>([]);
  const [blocoMorador, setBlocoMorador] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOcorrencia, setSelectedOcorrencia] = useState<any | null>(null);

  // Janela Nova Ocorrência
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  useEffect(() => {
    if (appUser?.condominioId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [appUser]);

  const loadData = async () => {
    if (!appUser?.condominioId) return;
    setLoading(true);
    try {
      // 1. Identifica o bloco da unidade do morador
      let moradorBloco: string | null = null;
      if (appUser.unidadeId) {
        try {
          const un = await getUnidade(appUser.condominioId, appUser.unidadeId);
          if (un?.torre) {
            moradorBloco = un.torre;
          }
        } catch (errUnidade) {
          console.warn('Não foi possível carregar detalhes da unidade:', errUnidade);
        }
      }

      // Fallback: tentar extrair bloco a partir do nome da unidade (ex: "Bloco A - Apto 101")
      if (!moradorBloco && appUser.unidadeNome) {
        const parts = appUser.unidadeNome.split(/[-–—/]/);
        if (parts.length > 1 && parts[0].trim()) {
          moradorBloco = parts[0].trim();
        }
      }
      setBlocoMorador(moradorBloco);

      // 2. Carrega condomínio, ocorrências e comunicados do mural
      const [c, oc, avList] = await Promise.all([
        getCondominio(appUser.condominioId),
        getOcorrencias(appUser.condominioId, 'morador', appUser.unidadeId),
        getAvisos(appUser.condominioId, moradorBloco || undefined),
      ]);

      if (c) setCondoNome((c as any).nome || 'Meu Condomínio');
      setOcorrencias(oc);
      setAvisos(avList);
    } catch (e) {
      console.error('Erro ao carregar dados do morador:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const handleCriarOcorrencia = async (data: { titulo: string; descricao: string }) => {
    setErrorForm('');
    setSubmitting(true);
    try {
      const triagem = await classificarOcorrenciaComIA(data.titulo, data.descricao);
      await createOcorrencia({
        titulo: data.titulo,
        descricao: data.descricao,
        categoria: triagem.categoria,
        urgencia: triagem.urgencia,
        iaJustificativa: triagem.justificativa,
        triagemPorIA: triagem.triagemPorIA,
        condominioId: appUser?.condominioId,
        unidadeId: appUser?.unidadeId || '',
        unidadeNome: appUser?.unidadeNome || 'Minha Unidade',
        autorNome: appUser?.nome || 'Morador',
        autorEmail: appUser?.email || '',
        status: 'Pendente',
      });
      setModalOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
      setErrorForm('Erro ao registrar ocorrência. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header exclusivo do Morador */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-100">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">
                  {condoNome || 'Portal do Morador'}
                </span>
                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 text-xs">
                  MORADOR
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                {appUser?.unidadeNome ? `${appUser.unidadeNome} • ` : ''}{appUser?.nome}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium h-9"
              title="Atualizar dados"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs font-semibold text-xs h-9 px-3.5"
              onClick={() => setModalOpen(true)}
            >
              <PlusCircle className="h-4 w-4 mr-1.5" /> Nova Ocorrência
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="border-slate-300 text-xs h-9">
              <LogOut className="h-4 w-4 mr-1.5" /> Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal do Morador */}
      <main className="max-w-6xl mx-auto w-full p-6 md:p-8 space-y-6 flex-1">
        {/* Tabs: Minhas Ocorrências e Mural de Avisos */}
        <Tabs defaultValue="ocorrencias" className="w-full">
          <div className="flex items-center justify-between pb-1">
            <TabsList className="bg-slate-200/80 p-1 rounded-xl">
              <TabsTrigger value="ocorrencias" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 font-semibold text-xs px-4">
                <FileText className="mr-1.5 h-4 w-4" />
                Minhas Ocorrências ({ocorrencias.length})
              </TabsTrigger>
              <TabsTrigger value="avisos" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 font-semibold text-xs px-4">
                <Megaphone className="mr-1.5 h-4 w-4" />
                Mural ({avisos.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Minhas Ocorrências */}
          <TabsContent value="ocorrencias" className="mt-4">
            {modalOpen ? (
              <NovaOcorrenciaJanela
                unidadeNome={appUser?.unidadeNome || 'Minha Unidade'}
                condominioNome={condoNome || 'Condomínio'}
                submitting={submitting}
                errorMessage={errorForm}
                onCriar={handleCriarOcorrencia}
                onVoltar={() => {
                  setModalOpen(false);
                  setErrorForm('');
                }}
              />
            ) : selectedOcorrencia ? (
              <OcorrenciaTimelineJanela
                ocorrencia={selectedOcorrencia}
                userRole="morador"
                userName={appUser?.nome || 'Morador'}
                onVoltar={() => setSelectedOcorrencia(null)}
              />
            ) : (
              <Card className="border-0 shadow-sm">
              <CardHeader className="bg-white rounded-t-xl border-b border-slate-100">
                <CardTitle className="text-lg font-bold text-slate-800">Ocorrências da Unidade</CardTitle>
                <CardDescription>
                  Chamados registrados e andamento do atendimento pela administração.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 bg-white rounded-b-xl">
                {loading ? (
                  <div className="p-8 text-center text-slate-400">Carregando seus chamados...</div>
                ) : ocorrencias.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-3">
                    <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                    <p className="font-semibold text-slate-700">Nenhum chamado aberto</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Sua unidade não possui ocorrências registradas no momento. Use o botão "Nova Ocorrência" caso precise solicitar algo.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Assunto / Relato</TableHead>
                        <TableHead>Responsável & Status</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ocorrencias.map((oc) => {
                        const stCfg = getStatusConfig(oc.status);
                        const rsCfg = getResponsavelConfig(oc.responsavelAtual);
                        return (
                          <TableRow key={oc.id} className="hover:bg-slate-50/60">
                            <TableCell className="font-medium text-slate-800">
                              <div className="font-semibold text-slate-900">{oc.titulo}</div>
                              {oc.descricao && (
                                <div className="text-xs text-slate-500 mt-1 line-clamp-2">{oc.descricao}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1 items-start">
                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border inline-flex items-center gap-1 ${stCfg.bgClass} ${stCfg.textClass} ${stCfg.borderClass}`}>
                                  {stCfg.label}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  Com: <strong className="text-slate-700">{rsCfg.label}</strong>
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedOcorrencia(oc)}
                                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-medium"
                              >
                                <Clock className="mr-1.5 h-3.5 w-3.5" />
                                Ver Trilha
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

          {/* Tab 2: Mural de Avisos */}
          <TabsContent value="avisos" className="mt-4 space-y-4">
            {/* Barra informativa com identificação de bloco */}
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">
                  Mural de Comunicados do Condomínio
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {blocoMorador ? (
                    <>Exibindo comunicados gerais e avisos direcionados para o <strong>{blocoMorador}</strong>.</>
                  ) : (
                    <>Exibindo comunicados oficiais emitidos pela administração do condomínio.</>
                  )}
                </p>
              </div>
            </div>

            {loading ? (
              <Card className="border-0 shadow-sm p-10 text-center text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
                Carregando comunicados do condomínio...
              </Card>
            ) : avisos.length === 0 ? (
              <Card className="border-0 shadow-sm p-12 text-center text-slate-400 space-y-3 bg-white rounded-xl">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                <p className="font-semibold text-slate-700">Nenhum comunicado no momento</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  A administração do condomínio não publicou novos avisos para o seu bloco ou comunicados gerais recentemente.
                </p>
              </Card>
            ) : (
              <div className="space-y-3.5">
                {avisos.map((av) => {
                  const catCfg = getCategoriaAvisoConfig(av.categoria);
                  const dataFormatada = formatarDataHora(av.createdAt, 'Data recente');

                  const isBloco = av.destinatarioTipo === 'bloco';

                  return (
                    <Card
                      key={av.id}
                      className={`shadow-sm rounded-xl transition-all border-y border-r ${
                        isBloco
                          ? 'border-l-4 border-l-purple-600 border-purple-100 bg-gradient-to-r from-purple-50/20 to-white'
                          : 'border-l-4 border-l-indigo-600 border-slate-200 bg-white'
                      }`}
                    >
                      <CardHeader className="pb-2 pt-4 px-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${catCfg.badgeClass}`}>
                              {catCfg.label}
                            </span>
                            {isBloco ? (
                              <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[11px] font-medium flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                Aviso para seu {av.blocoDestino || 'Bloco'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-[11px] font-medium flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                Comunicado Geral
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 font-medium">
                            {dataFormatada}
                          </span>
                        </div>
                        <CardTitle className="text-base font-bold text-slate-900 mt-2">
                          {av.titulo}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-5 pb-4 pt-1">
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                          {av.mensagem}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
                          <span>Publicado por: <strong className="text-slate-600 font-medium">{av.criadoPorNome}</strong></span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

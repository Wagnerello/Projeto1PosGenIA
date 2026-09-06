import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  X,
  Send,
  Loader2,
  Home,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { getOcorrencias, createOcorrencia, getCondominio } from '@/lib/firestore';
import { classificarOcorrenciaComIA } from '@/lib/ai-triagem';

export default function MoradorView() {
  const { appUser } = useAuth();
  const [condoNome, setCondoNome] = useState('');
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulário Nova Ocorrência (sem categoria nem gravidade manuais)
  const [modalOpen, setModalOpen] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const avisos = [
    {
      id: '1',
      titulo: 'Manutenção Preventiva do Elevador Social',
      data: 'Hoje, 09:00',
      mensagem: 'O elevador social passará por revisão das 10h às 14h. Por favor, utilize o elevador de serviço ou as escadas durante o período.'
    },
    {
      id: '2',
      titulo: 'Coleta Seletiva e Descarte Consciente',
      data: 'Ontem',
      mensagem: 'Lembramos a todos os moradores que o lixo reciclável deve ser depositado devidamente separado nas lixeiras identificadas no subsolo.'
    }
  ];

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
      const [c, oc] = await Promise.all([
        getCondominio(appUser.condominioId),
        getOcorrencias(appUser.condominioId, 'morador', appUser.unidadeId),
      ]);
      if (c) setCondoNome((c as any).nome || 'Meu Condomínio');
      setOcorrencias(oc);
    } catch (e) {
      console.error('Erro ao carregar dados do morador:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !descricao.trim()) {
      setErrorForm('Preencha os campos obrigatórios.');
      return;
    }
    setErrorForm('');
    setSubmitting(true);

    try {
      // Motor de IA classifica categoria e gravidade automaticamente
      const triagem = await classificarOcorrenciaComIA(titulo.trim(), descricao.trim());

      await createOcorrencia({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
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

      setTitulo('');
      setDescricao('');
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

          <div className="flex items-center gap-3">
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100"
              onClick={() => setModalOpen(true)}
            >
              <PlusCircle className="h-4 w-4 mr-1.5" /> Nova Ocorrência
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="border-slate-300">
              <LogOut className="h-4 w-4 mr-1.5" /> Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal do Morador */}
      <main className="max-w-6xl mx-auto w-full p-6 md:p-8 space-y-6 flex-1">
        {/* Banner de Boas-vindas */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Olá, {appUser?.nome || 'Morador'}! 👋</h2>
            <p className="text-indigo-100 text-sm mt-1 max-w-xl">
              Este é o seu portal no <strong>{condoNome || 'Condomínio'}</strong>. Registre solicitações para o síndico e acompanhe comunicados importantes.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur px-4 py-3 rounded-xl border border-white/20 text-center shrink-0">
            <span className="text-xs text-indigo-200 block uppercase tracking-wider font-semibold">Sua Unidade</span>
            <span className="text-lg font-bold text-white">{appUser?.unidadeNome || 'Não vinculada'}</span>
          </div>
        </div>

        {/* Modal / Card para Registro de Ocorrência */}
        {modalOpen && (
          <Card className="border-indigo-200 shadow-xl bg-white animate-in fade-in zoom-in-95 duration-150">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <div>
                <CardTitle className="text-lg text-indigo-950">Registrar Chamado / Ocorrência</CardTitle>
                <CardDescription>
                  Informe a administração sobre reparos, barulho ou solicitações da sua unidade.
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </Button>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={handleCreate} className="space-y-4">
                {errorForm && (
                  <p className="text-sm text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                    {errorForm}
                  </p>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="titulo">Título da Solicitação *</Label>
                  <Input
                    id="titulo"
                    placeholder="Ex: Vazamento de água na pia ou Lâmpada queimada"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="descricao">Descrição dos Fatos *</Label>
                  <textarea
                    id="descricao"
                    rows={4}
                    className="w-full p-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Descreva com detalhes o que está acontecendo para a administração atuar..."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    required
                  />
                </div>

                {/* Nota da Triagem por IA */}
                <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-900">
                  <Sparkles className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Triagem e Priorização Inteligente</p>
                    <p className="text-indigo-700 mt-0.5 leading-relaxed">
                      A inteligência artificial analisa o seu relato para definir automaticamente a categoria e o nível de gravidade para a equipe da síndica.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {submitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analisando com IA e enviando...</>
                    ) : (
                      <><Send className="mr-2 h-4 w-4" /> Enviar Chamado</>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Tabs: Minhas Ocorrências e Mural de Avisos */}
        <Tabs defaultValue="ocorrencias" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-sm bg-slate-200/80 p-1 rounded-xl">
            <TabsTrigger value="ocorrencias" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700">
              <FileText className="mr-1.5 h-4 w-4" />
              Minhas Ocorrências ({ocorrencias.length})
            </TabsTrigger>
            <TabsTrigger value="avisos" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700">
              <Megaphone className="mr-1.5 h-4 w-4" />
              Mural de Avisos
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Minhas Ocorrências */}
          <TabsContent value="ocorrencias" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-white rounded-t-xl border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800">Histórico de Ocorrências da Unidade</CardTitle>
                  <CardDescription>
                    Acompanhe em tempo real o status dos seus chamados pela administração predial.
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={loadData} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                </Button>
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
                        <TableHead className="text-right">Status do Chamado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ocorrencias.map((oc) => (
                        <TableRow key={oc.id} className="hover:bg-slate-50/60">
                          <TableCell className="font-medium text-slate-800">
                            <div className="font-semibold text-slate-900">{oc.titulo}</div>
                            {oc.descricao && (
                              <div className="text-xs text-slate-500 mt-1 line-clamp-2">{oc.descricao}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {oc.status === 'Pendente' && (
                              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                                <Clock className="mr-1 h-3 w-3" /> Aguardando Análise
                              </Badge>
                            )}
                            {oc.status === 'Em Análise' && (
                              <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200">
                                <Clock className="mr-1 h-3 w-3" /> Em Andamento
                              </Badge>
                            )}
                            {oc.status === 'Resolvido' && (
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                                <CheckCircle2 className="mr-1 h-3 w-3" /> Resolvido
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Mural de Avisos */}
          <TabsContent value="avisos" className="mt-4 space-y-4">
            {avisos.map((av) => (
              <Card key={av.id} className="border-l-4 border-l-indigo-600 shadow-sm rounded-xl">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-bold text-slate-800">{av.titulo}</CardTitle>
                    <span className="text-xs text-slate-400 font-medium">{av.data}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 leading-relaxed">{av.mensagem}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

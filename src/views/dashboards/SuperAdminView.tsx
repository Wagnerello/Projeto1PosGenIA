import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { QRCodeSVG } from 'qrcode.react';
import {
  Building2,
  UserCog,
  ShieldCheck,
  KeyRound,
  LogOut,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
  Search
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { getCondominios, createCondominio, createSindicaUser } from '@/lib/firestore';

type CreatedCondo = {
  id: string;
  nome: string;
  sindicaEmail: string;
  sindicaNome: string;
  sindicaSenha?: string;
  sindicaCriadaDireto: boolean;
  codigoConviteSindica: string;
  codigoConviteMorador: string;
};

export default function SuperAdminView() {
  const { appUser } = useAuth();
  const [condominios, setCondominios] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Formulário
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [sindicaEmail, setSindicaEmail] = useState('');
  const [sindicaNome, setSindicaNome] = useState('');
  const [sindicaSenha, setSindicaSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastCreated, setLastCreated] = useState<CreatedCondo | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const loadCondominios = async () => {
    setLoadingList(true);
    try {
      const data = await getCondominios();
      setCondominios(data);
    } catch (e) {
      console.error('Erro ao carregar condomínios:', e);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadCondominios();
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  const handleCreateCondominio = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLastCreated(null);

    try {
      const created = await createCondominio({
        nome,
        cnpj,
        sindicaEmail,
        sindicaNome,
      });

      let sindicaCriada = false;

      if (sindicaSenha.trim().length >= 6) {
        try {
          await createSindicaUser({
            email: sindicaEmail.trim(),
            password: sindicaSenha.trim(),
            nome: sindicaNome.trim(),
            condominioId: created.id,
          });
          sindicaCriada = true;
        } catch (authErr: any) {
          console.error('Erro ao criar login da síndica:', authErr);
          if (authErr?.code === 'auth/email-already-in-use') {
            setError('Condomínio criado, mas o e-mail da síndica já está em uso.');
          } else {
            setError(`Condomínio criado, mas houve falha ao gerar login da síndica: ${authErr?.message || 'senha inválida'}`);
          }
        }
      }

      setLastCreated({
        id: created.id,
        nome: created.nome,
        sindicaEmail: created.sindicaEmail,
        sindicaNome: created.sindicaNome,
        sindicaSenha: sindicaCriada ? sindicaSenha.trim() : undefined,
        sindicaCriadaDireto: sindicaCriada,
        codigoConviteSindica: created.codigoConviteSindica,
        codigoConviteMorador: created.codigoConviteMorador,
      });

      setNome('');
      setCnpj('');
      setSindicaEmail('');
      setSindicaNome('');
      setSindicaSenha('');
      await loadCondominios();
    } catch (err) {
      console.error(err);
      setError('Erro ao criar condomínio. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      console.error('Falha ao copiar', e);
    }
  };

  const filteredCondos = condominios.filter((c) =>
    c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.sindicaNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.sindicaEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Navbar exclusiva do Super Admin */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 font-bold">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">CondoApp SaaS</span>
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs">
                  SUPER ADMIN
                </Badge>
              </div>
              <p className="text-xs text-slate-400">Gestão global da plataforma e governança de condomínios</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400">Logado como</p>
              <p className="text-sm font-medium text-slate-200">{appUser?.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-slate-700 bg-slate-800/60 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-800 text-slate-200"
            >
              <LogOut className="h-4 w-4 mr-1.5" /> Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto w-full p-6 md:p-8 space-y-8 flex-1">
        {/* Cards de Métricas do Sistema */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="bg-slate-800/80 border-slate-700 text-slate-100">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Condomínios Ativos</p>
                <p className="text-3xl font-extrabold text-white mt-1">{condominios.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Building2 className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 border-slate-700 text-slate-100">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Síndicos Vinculados</p>
                <p className="text-3xl font-extrabold text-white mt-1">
                  {condominios.filter((c) => c.sindicaEmail).length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <UserCog className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 border-slate-700 text-slate-100">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Status da Plataforma</p>
                <p className="text-lg font-bold text-emerald-400 mt-1 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  Operacional Multi-tenant
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Sparkles className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formulário de Cadastro de Novo Condomínio + Síndica */}
        <Card className="bg-slate-800/90 border-slate-700 text-slate-100 shadow-xl">
          <CardHeader className="border-b border-slate-700/60 pb-4">
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-400" /> Cadastrar Condomínio e Criar Síndico(a)
            </CardTitle>
            <CardDescription className="text-slate-400 text-sm">
              Cadastre a nova base do condomínio e defina a senha para liberar o acesso imediato do síndico.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreateCondominio} className="space-y-6">
              {error && (
                <div className="p-4 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-slate-300 font-medium">Nome do Condomínio *</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    placeholder="Ex: Residencial Mirante da Serra"
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj" className="text-slate-300 font-medium">CNPJ (Opcional)</Label>
                  <Input
                    id="cnpj"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sindicaNome" className="text-slate-300 font-medium">Nome da Síndica *</Label>
                  <Input
                    id="sindicaNome"
                    value={sindicaNome}
                    onChange={(e) => setSindicaNome(e.target.value)}
                    required
                    placeholder="Ex: Dra. Mariana Costa"
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sindicaEmail" className="text-slate-300 font-medium">E-mail da Síndica *</Label>
                  <Input
                    id="sindicaEmail"
                    type="email"
                    value={sindicaEmail}
                    onChange={(e) => setSindicaEmail(e.target.value)}
                    required
                    placeholder="sindica@condominio.com"
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>

                {/* Box de Senha Inicial */}
                <div className="space-y-2 md:col-span-2 bg-slate-900/90 p-5 rounded-xl border border-slate-700">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sindicaSenha" className="font-semibold text-indigo-300 flex items-center gap-2">
                      <KeyRound className="h-4 w-4" /> Senha Inicial de Acesso da Síndica (Recomendado)
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-indigo-400 hover:text-indigo-200 hover:bg-indigo-950 h-7"
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
                    placeholder="Digite uma senha inicial ou use o botão acima para gerar uma aleatória"
                    className="bg-slate-950 border-slate-700 text-indigo-200 font-mono"
                  />
                  <p className="text-xs text-slate-400">
                    Ao definir a senha, a conta de síndica é ativada imediatamente. Você poderá repassar as credenciais a ela.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 font-semibold shadow-lg shadow-indigo-600/30"
                >
                  {loading ? 'Cadastrando no banco...' : 'Cadastrar Condomínio e Acesso'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Card de Sucesso / Confirmação */}
        {lastCreated && (
          <Card className="bg-slate-800 border-emerald-500/40 text-slate-100 shadow-xl">
            <CardHeader className="bg-emerald-950/40 border-b border-emerald-900/50 pb-4">
              <CardTitle className="text-emerald-300 text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Condomínio "{lastCreated.nome}" criado com sucesso!
              </CardTitle>
              <CardDescription className="text-slate-300">
                Os dados de acesso da síndica e os links de convite dos moradores foram gerados.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bloco Síndica */}
              <div className="bg-slate-900 p-5 rounded-xl border border-slate-700 space-y-4">
                <div className="flex items-center gap-2 font-semibold text-slate-200">
                  <UserCog className="h-5 w-5 text-indigo-400" />
                  Credenciais da Síndica
                </div>
                {lastCreated.sindicaCriadaDireto ? (
                  <div className="space-y-2 font-mono text-sm bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <div><span className="text-slate-500 font-sans text-xs">E-mail:</span> <span className="text-white">{lastCreated.sindicaEmail}</span></div>
                    <div><span className="text-slate-500 font-sans text-xs">Senha:</span> <span className="text-emerald-400">{lastCreated.sindicaSenha}</span></div>
                    <div><span className="text-slate-500 font-sans text-xs">Nome:</span> <span className="text-white">{lastCreated.sindicaNome}</span></div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 bg-slate-950 p-4 rounded-lg border border-slate-800">
                    Código de Convite: <strong>{lastCreated.codigoConviteSindica}</strong>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-slate-700 bg-slate-800 text-slate-200"
                  onClick={() =>
                    copyToClipboard(
                      `Acesso Síndica - ${lastCreated.nome}\nLogin: ${lastCreated.sindicaEmail}\nSenha: ${lastCreated.sindicaSenha}\nURL: ${window.location.origin}/login`,
                      'cred'
                    )
                  }
                >
                  {copiedField === 'cred' ? <><Check className="mr-1.5 h-4 w-4 text-emerald-400" /> Copiado!</> : <><Copy className="mr-1.5 h-4 w-4" /> Copiar Dados de Login</>}
                </Button>
              </div>

              {/* Bloco Moradores */}
              <div className="bg-slate-900 p-5 rounded-xl border border-slate-700 flex flex-col items-center text-center space-y-3">
                <div className="flex items-center gap-2 font-semibold text-slate-200">
                  <Building2 className="h-5 w-5 text-indigo-400" />
                  QR Code dos Moradores
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <QRCodeSVG
                    value={`${window.location.origin}/registro?condoId=${lastCreated.id}&invite=${lastCreated.codigoConviteMorador}&role=morador`}
                    size={130}
                  />
                </div>
                <div className="font-mono text-xs bg-slate-950 px-3 py-1 rounded text-slate-300">
                  Código Mural: <strong>{lastCreated.codigoConviteMorador}</strong>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabela de Gestão de Condomínios e Síndicos */}
        <Card className="bg-slate-800/90 border-slate-700 text-slate-100">
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-700/60 pb-4">
            <div>
              <CardTitle className="text-lg font-bold text-white">Condomínios Registrados</CardTitle>
              <CardDescription className="text-slate-400 text-sm">
                Lista de todos os condomínios e síndicos provisionados na plataforma.
              </CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
              <Input
                placeholder="Buscar condomínio ou síndico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-900 border-slate-700 text-sm placeholder:text-slate-500 text-white"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingList ? (
              <div className="p-8 text-center text-slate-400">Carregando lista de condomínios...</div>
            ) : filteredCondos.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                Nenhum condomínio encontrado.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-900/80">
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-slate-400">Nome do Condomínio</TableHead>
                    <TableHead className="text-slate-400">CNPJ</TableHead>
                    <TableHead className="text-slate-400">Síndico(a) Responsável</TableHead>
                    <TableHead className="text-slate-400">Status Síndica</TableHead>
                    <TableHead className="text-slate-400 text-right">Código Morador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCondos.map((c) => (
                    <TableRow key={c.id} className="border-slate-700/60 hover:bg-slate-700/30">
                      <TableCell className="font-semibold text-white">{c.nome}</TableCell>
                      <TableCell className="text-slate-400 text-xs font-mono">{c.cnpj || '-'}</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-slate-200">{c.sindicaNome || '-'}</div>
                        <div className="text-xs text-slate-400">{c.sindicaEmail}</div>
                      </TableCell>
                      <TableCell>
                        {c.sindicaUid ? (
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                            Ativa
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                            Convite: {c.codigoConviteSindica}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-300 text-right">
                        {c.codigoConviteMorador || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

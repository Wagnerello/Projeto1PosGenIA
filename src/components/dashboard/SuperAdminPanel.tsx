import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Building2, UserCog, KeyRound, ShieldCheck, CheckCircle2 } from 'lucide-react';
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

export default function SuperAdminPanel() {
  const [condominios, setCondominios] = useState<any[]>([]);
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
    try {
      const data = await getCondominios();
      setCondominios(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCondominios();
  }, []);

  const handleCreateCondominio = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLastCreated(null);

    try {
      // 1. Cria o condomínio no Firestore
      const created = await createCondominio({
        nome,
        cnpj,
        sindicaEmail,
        sindicaNome,
      });

      let sindicaCriada = false;

      // 2. Se informou senha para a síndica, já cria a conta dela no Firebase Auth
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
          console.error("Erro ao criar conta da síndica no Auth:", authErr);
          if (authErr?.code === 'auth/email-already-in-use') {
            setError('O condomínio foi criado, mas este e-mail de síndica já está cadastrado no sistema.');
          } else {
            setError(`Condomínio criado, mas houve erro ao criar login da síndica: ${authErr?.message || 'verifique a senha.'}`);
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
      setError('Erro ao criar condomínio. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const buildSindicaInviteLink = (condoId: string, code: string) => {
    return `${window.location.origin}/registro?condoId=${condoId}&invite=${code}&role=sindica`;
  };

  const buildMoradorInviteLink = (condoId: string, code: string) => {
    return `${window.location.origin}/registro?condoId=${condoId}&invite=${code}&role=morador`;
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

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600" /> Cadastrar Condomínio e Síndico(a)
          </CardTitle>
          <CardDescription>
            Como Super Admin, você cadastra o condomínio e pode definir a senha da síndica diretamente
            ou gerar o convite para ela se cadastrar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateCondominio} className="space-y-4">
            {error && <div className="text-rose-600 text-sm bg-rose-50 p-3 rounded-lg border border-rose-200">{error}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Condomínio *</Label>
                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Ex: Residencial Flores" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ (Opcional)</Label>
                <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sindicaNome">Nome da Síndica *</Label>
                <Input id="sindicaNome" value={sindicaNome} onChange={(e) => setSindicaNome(e.target.value)} required placeholder="Ex: Maria Silva" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sindicaEmail">E-mail da Síndica *</Label>
                <Input id="sindicaEmail" type="email" value={sindicaEmail} onChange={(e) => setSindicaEmail(e.target.value)} required placeholder="sindica@email.com" />
              </div>
              <div className="space-y-2 md:col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sindicaSenha" className="font-semibold text-slate-800 flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-indigo-600" /> Senha de Acesso da Síndica (Opcional)
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-indigo-600 hover:text-indigo-800 h-7"
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
                  placeholder="Se preencher, a conta da síndica será ativada imediatamente (mínimo 6 caracteres)"
                  className="bg-white font-mono mt-1.5"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Se preencher, a síndica já poderá fazer login diretamente com esse e-mail e senha. Se deixar em branco, ela receberá o link de auto-cadastro.
                </p>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
              {loading ? 'Cadastrando...' : 'Cadastrar Condomínio e Acesso'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Card de sucesso: mostra os links/QR Codes e dados de acesso */}
      {lastCreated && (
        <Card className="border-emerald-200 bg-emerald-50/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Condomínio "{lastCreated.nome}" criado com sucesso!
            </CardTitle>
            <CardDescription>
              {lastCreated.sindicaCriadaDireto
                ? 'A conta da síndica foi criada e está pronta para uso imediato.'
                : 'Envie o link exclusivo abaixo para a síndica completar seu cadastro.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Bloco da Síndica: se já criada direto, mostra os dados de login */}
            {lastCreated.sindicaCriadaDireto ? (
              <div className="bg-white p-5 rounded-lg border border-emerald-100 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 font-semibold text-slate-800 mb-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    Conta da Síndica Ativada
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Repasse os dados de acesso abaixo para a síndica realizar o login:
                  </p>
                  <div className="space-y-2 bg-slate-50 p-3 rounded text-sm font-mono border">
                    <div><span className="text-slate-500 font-sans text-xs">E-mail:</span> <strong>{lastCreated.sindicaEmail}</strong></div>
                    <div><span className="text-slate-500 font-sans text-xs">Senha:</span> <strong>{lastCreated.sindicaSenha}</strong></div>
                    <div><span className="text-slate-500 font-sans text-xs">Nome:</span> {lastCreated.sindicaNome}</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    copyToClipboard(
                      `Acesso Síndica - ${lastCreated.nome}\nLogin: ${lastCreated.sindicaEmail}\nSenha: ${lastCreated.sindicaSenha}\nURL: ${window.location.origin}/login`,
                      'credenciais'
                    )
                  }
                >
                  {copiedField === 'credenciais' ? <><Check className="mr-1.5 h-4 w-4" /> Dados Copiados!</> : <><Copy className="mr-1.5 h-4 w-4" /> Copiar Dados de Acesso</>}
                </Button>
              </div>
            ) : (
              /* QR da Síndica (caso opte por convite) */
              <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-col items-center text-center space-y-3">
                <div className="flex items-center gap-2 font-semibold text-slate-700">
                  <UserCog className="h-4 w-4" /> Link de Convite da Síndica
                </div>
                <QRCodeSVG
                  value={buildSindicaInviteLink(lastCreated.id, lastCreated.codigoConviteSindica)}
                  size={140}
                />
                <div className="text-xs text-slate-500">Para: {lastCreated.sindicaNome} ({lastCreated.sindicaEmail})</div>
                <div className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                  Código: {lastCreated.codigoConviteSindica}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    copyToClipboard(
                      buildSindicaInviteLink(lastCreated.id, lastCreated.codigoConviteSindica),
                      'sindica'
                    )
                  }
                >
                  {copiedField === 'sindica' ? <><Check className="mr-1.5 h-4 w-4" /> Copiado!</> : <><Copy className="mr-1.5 h-4 w-4" /> Copiar Link</>}
                </Button>
              </div>
            )}

            {/* QR do Morador */}
            <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-col items-center text-center space-y-3">
              <div className="flex items-center gap-2 font-semibold text-slate-700">
                <Building2 className="h-4 w-4" /> Convite dos Moradores
              </div>
              <QRCodeSVG
                value={buildMoradorInviteLink(lastCreated.id, lastCreated.codigoConviteMorador)}
                size={140}
              />
              <div className="text-xs text-slate-500">Afixe este QR Code no elevador/mural</div>
              <div className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                Código: {lastCreated.codigoConviteMorador}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() =>
                  copyToClipboard(
                    buildMoradorInviteLink(lastCreated.id, lastCreated.codigoConviteMorador),
                    'morador'
                  )
                }
              >
                {copiedField === 'morador' ? <><Check className="mr-1.5 h-4 w-4" /> Copiado!</> : <><Copy className="mr-1.5 h-4 w-4" /> Copiar Link</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Condomínios e Síndicos */}
      <Card>
        <CardHeader>
          <CardTitle>Condomínios e Síndicos Ativos</CardTitle>
          <CardDescription>
            Visão centralizada de todos os condomínios cadastrados na plataforma e status do síndico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Condomínio</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Síndico(a) Responsável</TableHead>
                <TableHead>Status Acesso Síndica</TableHead>
                <TableHead>Cód. Morador</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {condominios.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-slate-800">{c.nome}</TableCell>
                  <TableCell>{c.cnpj || '-'}</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-slate-700">{c.sindicaNome || '-'}</div>
                    <div className="text-xs text-slate-500">{c.sindicaEmail}</div>
                  </TableCell>
                  <TableCell>
                    {c.sindicaUid ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                        Ativa
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        Convite: {c.codigoConviteSindica}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">{c.codigoConviteMorador || '-'}</TableCell>
                </TableRow>
              ))}
              {condominios.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-6">
                    Nenhum condomínio cadastrado no momento.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { getCondominioByInviteCode, getUnidades, getCondominio } from '@/lib/firestore';
import { isSuperAdminEmail } from '@/lib/auth-helpers';
import { Building2, UserCog, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

type InviteContext = {
  condominioId: string;
  condominioNome: string;
  role: 'sindica' | 'morador';
  codigoConvite: string;
};

export default function RegisterView() {
  const searchParamsHook = useSearchParams();
  const searchParams = searchParamsHook[0];
  const navigate = useNavigate();

  // Campos do formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [unidadeId, setUnidadeId] = useState('');
  const [unidades, setUnidades] = useState<any[]>([]);

  // Estado do submit do formulário
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Estado de validação do convite
  const [inviteCtx, setInviteCtx] = useState<InviteContext | null>(null);
  const [validating, setValidating] = useState(true);
  const [inviteError, setInviteError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [validatingManual, setValidatingManual] = useState(false);

  // ==========================================================================
  // Validação do convite (executa uma vez ao montar)
  // ==========================================================================
  useEffect(() => {
    const validateInvite = async () => {
      const condoId = searchParams.get('condoId');
      const code = searchParams.get('invite');
      const roleParam = searchParams.get('role') as 'sindica' | 'morador' | null;

      // Caso 1: sem parâmetros -> usuário abriu direto pelo botão, permite digitar código
      if (!condoId && !code) {
        setValidating(false);
        return;
      }

      // Caso 2: só temos o código (alguém digitou ou link curto)
      if (!condoId && code) {
        try {
          const result = await getCondominioByInviteCode(code);
          if (!result) {
            setInviteError('Código de convite não encontrado.');
            setValidating(false);
            return;
          }
          setInviteCtx({
            condominioId: result.id,
            condominioNome: (result as any).nome || 'Condomínio',
            role: (result as any).matchedRole || roleParam || 'morador',
            codigoConvite: code.toUpperCase(),
          });

          // Se for morador, já carrega as unidades do condomínio
          if ((result as any).matchedRole === 'morador') {
            const us = await getUnidades(result.id);
            setUnidades(us);
          }
          setValidating(false);
        } catch (e) {
          console.error(e);
          setInviteError('Erro ao validar código. Tente novamente.');
          setValidating(false);
        }
        return;
      }

      // Caso 3: temos condoId + código
      if (condoId && code) {
        try {
          const condo = await getCondominio(condoId);
          if (!condo) {
            setInviteError('Condomínio não encontrado.');
            setValidating(false);
            return;
          }
          const upperCode = code.toUpperCase();
          let role: 'sindica' | 'morador' | null = null;
          const condoData = condo as any;
          if (condoData.codigoConviteSindica === upperCode) role = 'sindica';
          else if (condoData.codigoConviteMorador === upperCode) role = 'morador';

          if (!role) {
            setInviteError('Código de convite inválido para este condomínio.');
            setValidating(false);
            return;
          }

          const finalRole = roleParam && roleParam !== role ? role : role;

          setInviteCtx({
            condominioId: condo.id,
            condominioNome: condoData.nome,
            role: finalRole,
            codigoConvite: upperCode,
          });

          if (finalRole === 'morador') {
            const us = await getUnidades(condo.id);
            setUnidades(us);
          }
          setValidating(false);
        } catch (e) {
          console.error(e);
          setInviteError('Erro ao validar convite.');
          setValidating(false);
        }
        return;
      }
    };

    validateInvite();
  }, [searchParams]);

  const handleManualCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    setValidatingManual(true);
    setInviteError('');
    try {
      const code = manualCode.trim().toUpperCase();
      const result = await getCondominioByInviteCode(code);
      if (!result) {
        setInviteError('Código de convite não encontrado. Confira o código no mural do condomínio.');
        setValidatingManual(false);
        return;
      }
      setInviteCtx({
        condominioId: result.id,
        condominioNome: (result as any).nome || 'Condomínio',
        role: (result as any).matchedRole || 'morador',
        codigoConvite: code,
      });

      if ((result as any).matchedRole === 'morador') {
        const us = await getUnidades(result.id);
        setUnidades(us);
      }
    } catch (err) {
      console.error(err);
      setInviteError('Falha ao verificar código. Tente novamente.');
    } finally {
      setValidatingManual(false);
    }
  };

  // ==========================================================================
  // Submit
  // ==========================================================================
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCtx) return;
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (inviteCtx.role === 'morador' && !unidadeId) {
      setError('Selecione sua unidade.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // superadmin (você) tem prioridade absoluta
      const isSuperAdmin = isSuperAdminEmail(email, import.meta.env.VITE_SUPERADMIN_EMAIL);
      const finalRole: 'superadmin' | 'sindica' | 'pending' = isSuperAdmin
        ? 'superadmin'
        : inviteCtx.role === 'sindica'
        ? 'sindica'
        : 'pending';

      const userDoc: any = {
        uid: user.uid,
        nome,
        email,
        role: finalRole,
        condominioId: inviteCtx.condominioId,
        createdAt: new Date(),
      };

      if (inviteCtx.role === 'morador' && unidadeId) {
        userDoc.unidadeId = unidadeId;
        const selectedU = unidades.find((u) => u.id === unidadeId);
        if (selectedU) {
          userDoc.unidadeNome = `${selectedU.torre ? selectedU.torre + ' - ' : ''}Apto ${selectedU.numero}`;
        }
      }

      // Se for a síndica que está se cadastrando via convite,
      // vincula o uid dela ao doc do condomínio.
      if (finalRole === 'sindica') {
        const { updateCondominio } = await import('@/lib/firestore');
        await updateCondominio(inviteCtx.condominioId, { sindicaUid: user.uid });
      }

      await setDoc(doc(db, 'users', user.uid), userDoc);

      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está cadastrado. Tente fazer login.');
      } else if (err?.code === 'auth/weak-password') {
        setError('Senha muito fraca. Use pelo menos 6 caracteres.');
      } else {
        setError('Falha no cadastro. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // Renderização
  // ==========================================================================
  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" /> Validando convite...
        </div>
      </div>
    );
  }

  if (!inviteCtx) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-sm">
          <CardHeader className="text-center space-y-1">
            <div className="mx-auto w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-1">
              <Building2 className="h-5 w-5" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">Acesso ao Condomínio</CardTitle>
            <CardDescription>
              Digite o código de 8 caracteres informado no mural, elevador ou abaixo do QR Code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualCodeSubmit} className="space-y-4">
              {inviteError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{inviteError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="manualCode">Código do Condomínio</Label>
                <Input
                  id="manualCode"
                  type="text"
                  maxLength={12}
                  className="uppercase font-mono text-center tracking-widest text-lg font-bold h-12"
                  placeholder="EX: ABC2XYZ9"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={validatingManual}>
                {validatingManual ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Localizando condomínio...</>
                ) : (
                  'Continuar Cadastro'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <Button variant="ghost" className="text-sm text-slate-500" onClick={() => navigate('/login')}>
              Voltar para o Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> Cadastro realizado!
            </CardTitle>
            <CardDescription>
              {inviteCtx?.role === 'sindica'
                ? 'Bem-vinda, Síndica! Redirecionando para o painel...'
                : 'Aguardando aprovação da síndica. Você será avisado assim que liberado.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isSindica = inviteCtx.role === 'sindica';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {isSindica ? (
              <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200">
                <UserCog className="mr-1 h-3 w-3" /> Cadastro de Síndica
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
                <Building2 className="mr-1 h-3 w-3" /> Cadastro de Morador
              </Badge>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {isSindica ? 'Bem-vinda, Síndica!' : 'Bem-vindo ao condomínio'}
          </CardTitle>
          <CardDescription>
            <span className="font-medium text-slate-700">{inviteCtx.condominioNome}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                type="text"
                placeholder="Seu nome"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@exemplo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {!isSindica && unidades.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="unidade">Unidade</Label>
                <select
                  id="unidade"
                  className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={unidadeId}
                  onChange={(e) => setUnidadeId(e.target.value)}
                  required
                >
                  <option value="">Selecione sua unidade...</option>
                  {unidades.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.torre ? `${u.torre} - ` : ''}Apto {u.numero}
                      {u.andar ? ` (${u.andar}º andar)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!isSindica && unidades.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  A síndica ainda não mapeou as unidades deste condomínio.
                  Entre em contato com ela antes de continuar.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || (!isSindica && unidades.length === 0)}>
              {loading ? 'Cadastrando...' : isSindica ? 'Assumir Condomínio' : 'Solicitar Acesso'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center text-sm">
          <p className="text-gray-500">Já possui acesso liberado?</p>
          <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>
            Voltar para o Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

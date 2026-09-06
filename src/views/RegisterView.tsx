import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { getCondominioByInviteCode, getUnidades, getCondominio, createUnidade } from '@/lib/firestore';
import { isSuperAdminEmail } from '@/lib/auth-helpers';
import { UnitSelector, type UnitItem } from '@/components/common/UnitSelector';
import {
  Building2,
  UserCog,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estados de Unidade
  const [unidadeId, setUnidadeId] = useState('');
  const [selectedUnidadeNome, setSelectedUnidadeNome] = useState('');
  const [unidades, setUnidades] = useState<UnitItem[]>([]);
  const [manualMode, setManualMode] = useState(false);
  const [manualTorre, setManualTorre] = useState('');
  const [manualNumero, setManualNumero] = useState('');

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
          const role = (result as any).matchedRole || roleParam || 'morador';
          setInviteCtx({
            condominioId: result.id,
            condominioNome: (result as any).nome || 'Condomínio',
            role: role,
            codigoConvite: code.toUpperCase(),
          });

          // Se for morador, já carrega as unidades do condomínio
          if (role === 'morador') {
            const us = await getUnidades(result.id);
            setUnidades(us as UnitItem[]);
            if (us.length === 0) setManualMode(true);
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
            setUnidades(us as UnitItem[]);
            if (us.length === 0) setManualMode(true);
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
      const role = (result as any).matchedRole || 'morador';
      setInviteCtx({
        condominioId: result.id,
        condominioNome: (result as any).nome || 'Condomínio',
        role: role,
        codigoConvite: code,
      });

      if (role === 'morador') {
        const us = await getUnidades(result.id);
        setUnidades(us as UnitItem[]);
        if (us.length === 0) setManualMode(true);
      }
    } catch (err) {
      console.error(err);
      setInviteError('Falha ao verificar código. Tente novamente.');
    } finally {
      setValidatingManual(false);
    }
  };

  const handleSelectUnit = (unit: UnitItem & { nomeCompleto: string }) => {
    setUnidadeId(unit.id);
    setSelectedUnidadeNome(unit.nomeCompleto);
    setError('');
  };

  // ==========================================================================
  // Submit
  // ==========================================================================
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCtx) return;
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    // Validações de unidade para morador
    let finalUnidadeId = unidadeId;
    let finalUnidadeNome = selectedUnidadeNome;

    if (inviteCtx.role === 'morador') {
      if (manualMode || unidades.length === 0) {
        if (!manualNumero.trim()) {
          setError('Por favor, informe o número do seu apartamento.');
          return;
        }
        try {
          const created = await createUnidade(inviteCtx.condominioId, {
            torre: manualTorre.trim() || undefined,
            numero: manualNumero.trim(),
          });
          finalUnidadeId = created.id;
          finalUnidadeNome = `${manualTorre ? manualTorre.trim() + ' - ' : ''}Apto ${manualNumero.trim()}`;
        } catch (uErr) {
          console.error('Falha ao registrar unidade avulsa:', uErr);
          finalUnidadeNome = `${manualTorre ? manualTorre.trim() + ' - ' : ''}Apto ${manualNumero.trim()}`;
        }
      } else {
        if (!unidadeId) {
          setError('Selecione seu apartamento no mapa de unidades.');
          return;
        }
      }
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const isSuperAdmin = isSuperAdminEmail(email, import.meta.env.VITE_SUPERADMIN_EMAIL);
      const finalRole: 'superadmin' | 'sindica' | 'pending' = isSuperAdmin
        ? 'superadmin'
        : inviteCtx.role === 'sindica'
        ? 'sindica'
        : 'pending';

      const userDoc: any = {
        uid: user.uid,
        nome: nome.trim(),
        email: email.trim(),
        role: finalRole,
        condominioId: inviteCtx.condominioId,
        createdAt: new Date(),
      };

      if (inviteCtx.role === 'morador') {
        if (finalUnidadeId) userDoc.unidadeId = finalUnidadeId;
        if (finalUnidadeNome) userDoc.unidadeNome = finalUnidadeNome;
      }

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
        setError('Este e-mail já possui cadastro. Faça login ou use outro.');
      } else if (err?.code === 'auth/weak-password') {
        setError('Senha muito fraca. Escolha ao menos 6 dígitos.');
      } else {
        setError('Falha ao concluir cadastro. Tente novamente.');
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-slate-600 font-medium">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          Conectando ao condomínio...
        </div>
      </div>
    );
  }

  if (!inviteCtx) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md shadow-sm border-slate-200 bg-white">
          <CardHeader className="text-center space-y-1">
            <div className="mx-auto w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-1 border border-indigo-100">
              <Building2 className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">Acesso ao Condomínio</CardTitle>
            <CardDescription className="text-slate-500 text-sm">
              Digite o código de 8 caracteres informado no mural, portaria ou convite oficial.
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
                <Label htmlFor="manualCode" className="text-xs font-semibold text-slate-700">
                  Código do Convite
                </Label>
                <Input
                  id="manualCode"
                  type="text"
                  maxLength={12}
                  className="uppercase font-mono text-center tracking-widest text-lg font-bold h-12 border-slate-300"
                  placeholder="EX: ABC2XYZ9"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-11"
                disabled={validatingManual}
              >
                {validatingManual ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando código...</>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    Continuar para Cadastro <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-slate-100 pt-4">
            <Button variant="ghost" className="text-sm text-slate-500 hover:text-slate-700" onClick={() => navigate('/login')}>
              Já tem conta? Voltar ao Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md shadow-md border-emerald-200 bg-white text-center p-6 space-y-4">
          <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Cadastro Enviado!</h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {inviteCtx?.role === 'sindica'
                ? 'Sua conta de síndica foi ativada. Carregando painel...'
                : 'Sua solicitação de acesso foi enviada à administração do condomínio. Você será liberado(a) após a conferência da unidade.'}
            </p>
          </div>
          <div className="pt-2">
            <div className="inline-flex items-center text-xs text-indigo-600 font-medium">
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Redirecionando...
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const isSindica = inviteCtx.role === 'sindica';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-6">
      <Card className="w-full max-w-xl shadow-md border-slate-200 bg-white">
        {/* Cabeçalho do Onboarding */}
        <CardHeader className="space-y-2 text-center pb-6 border-b border-slate-100">
          <div className="flex items-center justify-center gap-2">
            {isSindica ? (
              <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-indigo-200 text-xs px-2.5 py-0.5">
                <UserCog className="mr-1.5 h-3.5 w-3.5" /> Painel da Síndica
              </Badge>
            ) : (
              <Badge className="bg-amber-50 text-amber-800 hover:bg-amber-50 border-amber-200 text-xs px-2.5 py-0.5">
                <Building2 className="mr-1.5 h-3.5 w-3.5" /> Cadastro de Morador
              </Badge>
            )}
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {isSindica ? 'Assumir Gestão' : 'Solicitar Acesso ao Condomínio'}
          </CardTitle>
          <CardDescription className="text-slate-500 text-sm">
            Condomínio <span className="font-semibold text-slate-800">{inviteCtx.condominioNome}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleRegister} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* SEÇÃO 1: DADOS DO USUÁRIO */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <User className="h-3.5 w-3.5 text-indigo-600" />
                <span>1. Dados Pessoais</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nome" className="text-xs font-semibold text-slate-700">
                    Nome Completo *
                  </Label>
                  <div className="relative">
                    <User className="h-4 w-4 absolute left-3 top-3.5 text-slate-400" />
                    <Input
                      id="nome"
                      type="text"
                      placeholder="Ex: João da Silva"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="pl-9 h-11 border-slate-300"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                    E-mail para Login *
                  </Label>
                  <div className="relative">
                    <Mail className="h-4 w-4 absolute left-3 top-3.5 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-11 border-slate-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: SELEÇÃO DA UNIDADE (EXCLUSIVA DE MORADOR) */}
            {!isSindica && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                    <span>2. Sua Unidade no Condomínio *</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {unidades.length > 0 ? `${unidades.length} unidades listadas` : 'Cadastro direto'}
                  </span>
                </div>

                <UnitSelector
                  unidades={unidades}
                  selectedId={unidadeId}
                  onSelect={handleSelectUnit}
                  manualMode={manualMode}
                  onManualModeChange={setManualMode}
                  manualTorre={manualTorre}
                  onManualTorreChange={setManualTorre}
                  manualNumero={manualNumero}
                  onManualNumeroChange={setManualNumero}
                />
              </div>
            )}

            {/* SEÇÃO 3: SENHA E SEGURANÇA */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Lock className="h-3.5 w-3.5 text-indigo-600" />
                <span>{isSindica ? '2. Senha de Acesso' : '3. Segurança & Acesso'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                    Senha (mínimo 6 dígitos) *
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10 h-11 border-slate-300 font-mono text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-700">
                    Confirmar Senha *
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`pr-10 h-11 font-mono text-sm border-slate-300 ${
                        confirmPassword && confirmPassword === password
                          ? 'border-emerald-500 focus:ring-emerald-400'
                          : confirmPassword && confirmPassword !== password
                          ? 'border-rose-400 focus:ring-rose-400'
                          : ''
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {confirmPassword && password && confirmPassword === password && (
                <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5" /> As senhas conferem
                </p>
              )}
            </div>

            {/* BOTÃO DE SUBMISSÃO */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base shadow-sm active:scale-[0.99] transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Registrando...
                  </span>
                ) : isSindica ? (
                  'Ativar Acesso de Síndica'
                ) : (
                  'Enviar Solicitação de Acesso'
                )}
              </Button>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2 text-center text-sm border-t border-slate-100 pt-4 pb-6">
          <p className="text-slate-500 text-xs">Já possui acesso liberado ao condomínio?</p>
          <Button
            variant="outline"
            className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 h-10"
            onClick={() => navigate('/login')}
          >
            Fazer Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}


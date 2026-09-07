/* eslint-disable quality/max-lines, quality/no-direct-data-access, import-x/no-restricted-paths, max-lines-per-function, max-statements, complexity, @typescript-eslint/no-explicit-any, quality/no-direct-console */ // FIXME: D�vida t�cnica (Quarentena)
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { getCondominioByInviteCode, getUnidades, getCondominio, createUnidade } from '@/lib/firestore';
import { isSuperAdminEmail } from '@/lib/auth-helpers';
import { UnitSelector, type UnitItem } from '@/components/common/UnitSelector';
import {
  Building2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  UserCheck
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

      // Caso 1: sem parâmetros -> permite digitar código
      if (!condoId && !code) {
        setValidating(false);
        return;
      }

      // Caso 2: só temos o código
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
        setInviteError('Código de convite não encontrado. Confira o código no mural ou com a portaria.');
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
      setError('As senhas digitadas não conferem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
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
          setError('Selecione seu apartamento na lista.');
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
        setError('Este e-mail já está cadastrado. Faça login para acessar.');
      } else if (err?.code === 'auth/weak-password') {
        setError('Senha muito fraca. Use pelo menos 6 caracteres.');
      } else {
        setError('Falha ao concluir cadastro. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // Render: Carregando convite
  // ==========================================================================
  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/70 p-4">
        <div className="flex items-center gap-2.5 text-slate-600 text-sm font-medium">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          Conectando ao condomínio...
        </div>
      </div>
    );
  }

  // ==========================================================================
  // Render: Digitação do Código de Convite (quando acessado sem parâmetros)
  // ==========================================================================
  if (!inviteCtx) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/70 p-4">
        <Card className="w-full max-w-md shadow-xl shadow-slate-200/50 border border-slate-200/80 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="text-center pt-8 pb-4 px-6 space-y-2">
            <div className="mx-auto w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-1 border border-indigo-100/60 shadow-xs">
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Código de Convite
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Digite o código fornecido pelo condomínio ou portaria para acessar o cadastro.
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleManualCodeSubmit} className="space-y-4">
              {inviteError && (
                <Alert variant="destructive" className="py-2.5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{inviteError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="manualCode" className="text-xs font-semibold text-slate-700">
                  Código de Acesso
                </Label>
                <Input
                  id="manualCode"
                  type="text"
                  maxLength={12}
                  className="uppercase font-mono text-center tracking-widest text-lg font-bold h-12 border-slate-300 rounded-xl focus:border-indigo-500"
                  placeholder="EX: ABC2XYZ9"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  required
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-11 rounded-xl shadow-sm transition-all active:scale-[0.99]"
                disabled={validatingManual}
              >
                {validatingManual ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Verificando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    Acessar Cadastro <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-slate-100 py-4 bg-slate-50/50">
            <button
              type="button"
              className="text-xs text-slate-500 hover:text-indigo-600 transition-colors"
              onClick={() => navigate('/login')}
            >
              Já possui cadastro? <span className="font-semibold text-indigo-600 hover:underline">Fazer login</span>
            </button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ==========================================================================
  // Render: Tela de Sucesso
  // ==========================================================================
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/70 p-4">
        <Card className="w-full max-w-md shadow-xl shadow-slate-200/50 border border-emerald-200/70 bg-white rounded-2xl text-center p-8 space-y-4">
          <div className="mx-auto w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-xs">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Solicitação Enviada!</h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {inviteCtx?.role === 'sindica'
                ? 'Sua conta de gestão foi ativada. Carregando o painel...'
                : 'Seus dados foram enviados. A portaria liberará seu acesso após a verificação da unidade.'}
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <span className="inline-flex items-center text-xs text-indigo-600 font-medium">
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Redirecionando...
            </span>
          </div>
        </Card>
      </div>
    );
  }

  const isSindica = inviteCtx.role === 'sindica';

  // ==========================================================================
  // Render: Formulário Principal Refatorado (Ultra Limpo e Fluido)
  // ==========================================================================
  return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-50/70 p-3 sm:p-6 pb-safe pt-safe">
      <Card className="w-full max-w-lg shadow-xl shadow-slate-200/50 border border-slate-200/80 bg-white rounded-2xl overflow-hidden">
        {/* Cabeçalho minimalista e contextual */}
        <CardHeader className="text-center pt-6 sm:pt-7 pb-4 sm:pb-5 px-4 sm:px-8 border-b border-slate-100 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 mx-auto">
            {isSindica ? (
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            ) : (
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            )}
            <span className="truncate max-w-[220px] sm:max-w-xs">Condomínio {inviteCtx.condominioNome}</span>
          </div>

          <h1 className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {isSindica ? 'Assumir Gestão' : 'Solicitar Acesso'}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto">
            {isSindica
              ? 'Crie seu login administrativo para gerenciar o condomínio.'
              : 'Informe seus dados para identificação e liberação da sua unidade.'}
          </p>
        </CardHeader>

        <CardContent className="pt-5 sm:pt-6 px-4 sm:px-8 pb-4">
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}

            {/* Nome Completo */}
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-xs font-medium text-slate-700">
                Nome completo <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="nome"
                type="text"
                placeholder="Ex: Maria Silva"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="h-11 sm:h-10 border-slate-300 rounded-xl text-base sm:text-sm focus:border-indigo-500"
              />
            </div>

            {/* E-mail de Login */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-slate-700">
                E-mail de acesso <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 sm:h-10 border-slate-300 rounded-xl text-base sm:text-sm focus:border-indigo-500"
              />
            </div>

            {/* Seleção da Unidade (Exclusivo de Morador) */}
            {!isSindica && (
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs font-medium text-slate-700">
                  Sua Unidade <span className="text-rose-500">*</span>
                </Label>
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

            {/* Senha e Confirmação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium text-slate-700">
                  Senha <span className="text-slate-400 font-normal">(mín. 6 dígitos)</span> <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 h-11 sm:h-10 border-slate-300 rounded-xl text-base sm:text-sm focus:border-indigo-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors touch-target"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-medium text-slate-700">
                  Confirmar senha <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`pr-10 h-11 sm:h-10 rounded-xl text-base sm:text-sm border-slate-300 focus:border-indigo-500 ${
                      confirmPassword && confirmPassword === password
                        ? 'border-emerald-400 focus:border-emerald-500'
                        : confirmPassword && confirmPassword !== password
                        ? 'border-rose-400 focus:border-rose-500'
                        : ''
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Exibir confirmação de senha'}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-1 top-1 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors touch-target"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {confirmPassword && password && confirmPassword === password && (
              <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                <ShieldCheck className="h-3.5 w-3.5" /> As senhas conferem
              </p>
            )}

            {/* Botão de Envio */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 sm:h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-xs transition-all active:scale-[0.99] cursor-pointer touch-target"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Enviando dados...
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

        {/* Rodapé Simplificado */}
        <CardFooter className="pt-2 pb-5 sm:pb-6 px-4 sm:px-8 border-t border-slate-100 flex justify-center">
          <p className="text-xs text-slate-500">
            Já possui acesso liberado?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors cursor-pointer"
            >
              Fazer login
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';

export default function AuthView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('Falha no login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-50 p-4 sm:p-6 pb-safe pt-safe">
      <Card className="w-full max-w-md shadow-md border-slate-200/80 bg-white">
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-2 border border-indigo-100 shadow-xs">
            <span className="font-bold text-xl">🏢</span>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Portal do Condomínio</CardTitle>
          <CardDescription className="text-xs sm:text-sm text-slate-500">Entre com suas credenciais para acessar</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && <div className="text-rose-600 text-xs sm:text-sm text-center font-medium bg-rose-50 border border-rose-200 p-2.5 rounded-lg">{error}</div>}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs sm:text-sm font-semibold text-slate-700">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nome@exemplo.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 sm:h-10 text-base sm:text-sm border-slate-200 focus-visible:ring-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs sm:text-sm font-semibold text-slate-700">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 sm:h-10 text-base sm:text-sm border-slate-200 focus-visible:ring-indigo-500"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 sm:h-10 text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer touch-target shadow-xs" 
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center text-xs sm:text-sm pt-2 border-t border-slate-100">
          <p className="text-slate-500 text-xs">
            É morador e ainda não tem acesso?
          </p>
          <Button 
            variant="outline" 
            className="w-full h-11 sm:h-10 text-xs sm:text-sm font-medium border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer touch-target" 
            onClick={() => navigate('/registro')}
          >
            Digitar Código de Convite / Cadastrar-se
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

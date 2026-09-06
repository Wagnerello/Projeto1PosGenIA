import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  UserCheck,
  AlertTriangle,
  Loader2,
  Save,
  CheckCircle2,
  Mail,
  Phone,
  ShieldCheck,
  UserX,
  Clock,
  ShieldAlert
} from 'lucide-react';
import {
  resolveMoradorStatus,
  getMoradorStatusConfig,
  validateMoradorData,
  type MoradorItem,
  type MoradorStatus
} from '@/lib/morador-helpers';

export interface MoradorEditorJanelaProps {
  morador: MoradorItem | null;
  unidades: Array<{ id: string; numero: string; torre?: string; andar?: number }>;
  saving?: boolean;
  errorMessage?: string;
  onSalvar: (dados: {
    uid: string;
    nome: string;
    unidadeId: string;
    unidadeNome: string;
    telefone?: string;
    status: MoradorStatus;
  }) => Promise<void> | void;
  onVoltar: () => void;
}

export function MoradorEditorJanela({
  morador,
  unidades,
  saving = false,
  errorMessage = '',
  onSalvar,
  onVoltar,
}: MoradorEditorJanelaProps) {
  const [nome, setNome] = useState(morador?.nome || '');
  const [telefone, setTelefone] = useState(morador?.telefone || '');
  const [unidadeId, setUnidadeId] = useState(morador?.unidadeId || '');
  const [status, setStatus] = useState<MoradorStatus>(
    resolveMoradorStatus(morador)
  );
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (morador) {
      setNome(morador.nome || '');
      setTelefone(morador.telefone || '');
      setUnidadeId(morador.unidadeId || '');
      setStatus(resolveMoradorStatus(morador));
    }
    setLocalError('');
  }, [morador]);

  // Busca o nome legível da unidade selecionada
  const selectedUnidade = unidades.find((u) => u.id === unidadeId);
  const getUnidadeFormatada = (u?: { torre?: string; numero: string }) => {
    if (!u) return '';
    return `${u.torre ? u.torre + ' - ' : ''}Apto ${u.numero}`;
  };

  const statusConfig = getMoradorStatusConfig(status);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    const validation = validateMoradorData({ nome, unidadeId });
    if (!validation.valid) {
      setLocalError(validation.error || 'Preencha os campos obrigatórios.');
      return;
    }

    if (!morador?.uid && !morador?.id) {
      setLocalError('Identificador do morador não encontrado.');
      return;
    }

    const uid = morador.uid || morador.id || '';
    const unidadeNome = selectedUnidade
      ? getUnidadeFormatada(selectedUnidade)
      : morador.unidadeNome || 'Apartamento';

    await onSalvar({
      uid,
      nome: nome.trim(),
      unidadeId,
      unidadeNome,
      telefone: telefone.trim() || undefined,
      status,
    });
  };

  const displayError = localError || errorMessage;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Barra de Ação Superior */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 md:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onVoltar}
              disabled={saving}
              className="bg-slate-800/80 hover:bg-slate-700 text-white border-slate-700 hover:text-white transition-all text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Voltar para Moradores
            </Button>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Gestão de Acesso & Perfil
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-indigo-400" />
            Editar Cadastro: {morador?.nome || 'Morador'}
          </h2>
          <p className="text-xs text-slate-300">
            Altere os dados de identificação, unidade vinculada e status de liberação do morador.
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 px-4 py-2.5 rounded-xl text-center self-start sm:self-auto">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-medium">
            ID do Usuário
          </span>
          <span className="font-mono text-xs text-indigo-300 font-semibold">
            #{(morador?.uid || morador?.id || '').substring(0, 10)}
          </span>
        </div>
      </div>

      {/* Grid de Edição: 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna 1 (7 colunas): Formulário */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-indigo-600" />
              Dados do Morador e Apartamento
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Campos essenciais para conferência de moradia e comunicação no condomínio.
            </p>
          </div>

          {displayError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nome Completo */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Nome Completo do Morador *
              </Label>
              <Input
                placeholder="Ex: Carlos Eduardo da Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                disabled={saving}
              />
            </div>

            {/* E-mail (apenas leitura) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700">
                  E-mail de Acesso
                </Label>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-indigo-500" /> Identificador único do Firebase Auth
                </span>
              </div>
              <div className="relative">
                <Input
                  value={morador?.email || ''}
                  disabled
                  className="bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed pl-9 font-mono text-xs"
                />
                <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Telefone / WhatsApp */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Telefone / WhatsApp (opcional)
              </Label>
              <div className="relative">
                <Input
                  placeholder="Ex: (11) 98765-4321"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  disabled={saving}
                  className="pl-9 text-sm"
                />
                <Phone className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Apartamento / Unidade Vinculada */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Unidade Residencial Vinculada *
              </Label>
              <select
                value={unidadeId}
                onChange={(e) => setUnidadeId(e.target.value)}
                disabled={saving}
                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                required
              >
                <option value="">Selecione o apartamento...</option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.torre ? `${u.torre} - ` : ''}Apto {u.numero}
                    {u.andar ? ` (${u.andar}º andar)` : ''}
                  </option>
                ))}
              </select>
              {morador?.unidadeNome && !selectedUnidade && (
                <p className="text-[11px] text-amber-600 mt-1">
                  Unidade registrada anteriormente: <strong>{morador.unidadeNome}</strong>
                </p>
              )}
            </div>

            {/* Status do Morador */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <Label className="text-xs font-semibold text-slate-700">
                Status de Acesso ao Sistema *
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Ativo */}
                <button
                  type="button"
                  onClick={() => setStatus('ativo')}
                  disabled={saving}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    status === 'ativo'
                      ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Ativo
                    </span>
                    {status === 'ativo' && (
                      <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Acesso total ao app, chamados e mural.
                  </p>
                </button>

                {/* Pendente */}
                <button
                  type="button"
                  onClick={() => setStatus('pendente')}
                  disabled={saving}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    status === 'pendente'
                      ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-amber-600" /> Pendente
                    </span>
                    {status === 'pendente' && (
                      <span className="h-2 w-2 rounded-full bg-amber-600 animate-pulse" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Aguardando liberação pela síndica.
                  </p>
                </button>

                {/* Inativo */}
                <button
                  type="button"
                  onClick={() => setStatus('inativo')}
                  disabled={saving}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    status === 'inativo'
                      ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                      <UserX className="h-4 w-4 text-rose-600" /> Inativo
                    </span>
                    {status === 'inativo' && (
                      <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Acesso bloqueado ou suspenso.
                  </p>
                </button>
              </div>
            </div>

            {/* Ações */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onVoltar}
                disabled={saving}
                className="border-slate-200 text-slate-600 cursor-pointer text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 shadow-sm cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando Dados...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Coluna 2 (5 colunas): Crachá e Informações */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card Pré-visualização do Morador */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Crachá Digital do Morador
              </span>
              <span className="text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
                Pré-visualização
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-lg space-y-4 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-indigo-600/40 border border-indigo-400/30 flex items-center justify-center text-lg font-bold text-white shadow-inner">
                    {(nome || 'M').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base leading-tight">
                      {nome || 'Nome do Morador'}
                    </h4>
                    <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3 text-indigo-400" />
                      {morador?.email || 'email@exemplo.com'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
                <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Apartamento
                  </span>
                  <p className="text-xs font-bold text-indigo-300 mt-0.5 truncate">
                    {selectedUnidade ? getUnidadeFormatada(selectedUnidade) : morador?.unidadeNome || 'Não vinculado'}
                  </p>
                </div>

                <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Situação
                  </span>
                  <Badge variant="outline" className={`mt-0.5 text-[10px] font-semibold border ${statusConfig.badgeClass}`}>
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>

              {telefone && (
                <div className="text-[11px] text-slate-300 flex items-center gap-1.5 pt-1">
                  <Phone className="h-3 w-3 text-emerald-400" />
                  <span>{telefone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dicas e Políticas de Acesso */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-indigo-600" />
              Diretrizes de Segurança & LGPD
            </h4>
            <ul className="text-xs text-indigo-800 space-y-2 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-indigo-600 font-bold">•</span>
                <span>
                  <strong>Status Inativo:</strong> Bloqueia imediatamente o acesso do morador às ocorrências e ao mural. Usado quando o morador desocupa a unidade ou tem acesso revogado.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-indigo-600 font-bold">•</span>
                <span>
                  <strong>Mudança de Unidade:</strong> Ao alterar a unidade residencial, o morador passa a enxergar somente os chamados da nova unidade vinculada.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-indigo-600 font-bold">•</span>
                <span>
                  <strong>Reativação:</strong> Moradores inativos podem ter seu status revertido para Ativo a qualquer momento pela síndica.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

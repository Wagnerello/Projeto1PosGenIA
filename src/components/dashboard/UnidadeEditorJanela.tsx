/* eslint-disable max-lines-per-function, complexity */ // FIXME: D�vida t�cnica (Quarentena)
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Building2,
  AlertTriangle,
  Loader2,
  Save,
  CheckCircle2,
  Info,
  ShieldCheck,
  Hash
} from 'lucide-react';

export interface UnidadeEditorData {
  id?: string;
  numero: string;
  torre?: string;
  andar?: number;
}

export interface UnidadeEditorJanelaProps {
  initialData?: UnidadeEditorData | null;
  saving?: boolean;
  errorMessage?: string;
  onSalvar: (data: { numero: string; torre: string; andar?: number }) => Promise<void> | void;
  onVoltar: () => void;
}

export function UnidadeEditorJanela({
  initialData,
  saving = false,
  errorMessage = '',
  onSalvar,
  onVoltar,
}: UnidadeEditorJanelaProps) {
  const isEditing = Boolean(initialData?.id);
  const [torre, setTorre] = useState(initialData?.torre || 'Torre 1');
  const [andar, setAndar] = useState(initialData?.andar ? String(initialData.andar) : '');
  const [numero, setNumero] = useState(initialData?.numero || '');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (initialData) {
      setTorre(initialData.torre || 'Torre 1');
      setAndar(initialData.andar ? String(initialData.andar) : '');
      setNumero(initialData.numero || '');
    } else {
      setTorre('Torre 1');
      setAndar('');
      setNumero('');
    }
    setLocalError('');
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!torre.trim()) {
      setLocalError('Informe a Torre ou Bloco da unidade.');
      return;
    }
    if (!numero.trim()) {
      setLocalError('Informe o número ou identificador do apartamento.');
      return;
    }

    setLocalError('');
    await onSalvar({
      torre: torre.trim(),
      numero: numero.trim(),
      andar: andar.trim() ? Number(andar) : undefined,
    });
  };

  const displayError = localError || errorMessage;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Barra de Ação Superior */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onVoltar}
              className="bg-slate-800/80 hover:bg-slate-700 text-white border-slate-700 hover:text-white transition-all text-xs font-semibold min-h-[44px] sm:min-h-[36px] px-3.5"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5 shrink-0" />
              Voltar para Unidades
            </Button>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              {isEditing ? 'Edição Cadastral' : 'Novo Cadastro'}
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Building2 className="h-6 w-6 text-indigo-400 shrink-0" />
            {isEditing ? `Editar Unidade ${initialData?.numero}` : 'Cadastrar Nova Unidade'}
          </h2>
          <p className="text-xs text-slate-300">
            {isEditing
              ? 'Atualize os dados de identificação física do apartamento no condomínio.'
              : 'Adicione uma nova unidade residencial ou comercial à grade do condomínio.'}
          </p>
        </div>

        {isEditing && (
          <div className="bg-slate-800/80 border border-slate-700 px-4 py-2.5 rounded-xl text-center self-start sm:self-auto">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-medium">
              ID do Imóvel
            </span>
            <span className="font-mono text-xs text-indigo-300 font-semibold">
              #{initialData?.id?.substring(0, 8)}
            </span>
          </div>
        )}
      </div>

      {/* Grid de Edição: 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna 1 (7 colunas): Formulário de Edição */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-600" />
              Dados de Endereçamento da Unidade
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Certifique-se de que os dados coincidam com a convenção do condomínio.
            </p>
          </div>

          {displayError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Torre / Bloco / Edifício *
              </Label>
              <Input
                placeholder="Ex: Torre 1, Bloco A, Edifício Solar ou Torre Única"
                value={torre}
                onChange={(e) => setTorre(e.target.value)}
                required
                className="rounded-xl border-slate-200 text-base sm:text-sm h-11 sm:h-10"
              />
              <p className="text-[11px] text-slate-400">
                Permite segmentar comunicados do mural exclusivamente para moradores desta torre.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Número do Apartamento / Sala *
                </Label>
                <Input
                  placeholder="Ex: 101, 102, Cobertura 01"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  required
                  className="rounded-xl border-slate-200 text-base sm:text-sm font-semibold h-11 sm:h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Andar (opcional)
                </Label>
                <Input
                  type="number"
                  placeholder="Ex: 1, 5, 10"
                  value={andar}
                  onChange={(e) => setAndar(e.target.value)}
                  className="rounded-xl border-slate-200 text-base sm:text-sm h-11 sm:h-10"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={onVoltar}
                disabled={saving}
                className="text-xs font-semibold border-slate-200 w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-100 w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando Unidade...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditing ? 'Atualizar Unidade' : 'Cadastrar Unidade'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Coluna 2 (5 colunas): Visualização da Plaqueta e Informações */}
        <div className="lg:col-span-5 space-y-6">
          {/* Prévia da Identificação do Apartamento */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 border border-slate-800 shadow-md space-y-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300 block">
              Prévia da Identificação
            </span>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/15 text-center space-y-2">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Hash className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-2xl font-black tracking-tight text-white">
                  Apto {numero || '000'}
                </h4>
                <p className="text-xs text-indigo-200 mt-0.5">
                  {torre || 'Bloco não definido'}
                  {andar ? ` • ${andar}º Andar` : ''}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Esta é a assinatura visual utilizada para associar moradores, autorizar acessos e direcionar ocorrências e comunicados específicos.
            </p>
          </div>

          {/* Diretrizes de Governança */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Governança Condominial
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>O morador que se cadastrar com este apartamento precisará da sua validação formal na aba de moradores pendentes.</span>
              </li>
              <li className="flex items-start gap-2">
                <Info className="h-3.5 w-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>Ao alterar o número ou torre, todos os moradores e ocorrências atreladas a este registro manterão a integridade cadastral.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Building2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Sparkles,
  Info,
  Layers,
  Users,
  Megaphone
} from 'lucide-react';
import { validateRenameBloco } from '@/lib/unit-helpers';

export interface RenomearBlocoJanelaProps {
  initialBloco?: string | null;
  availableTorres: string[];
  unitsCountByTorre: Record<string, number>;
  renaming?: boolean;
  onConfirmar: (blocoAntigo: string, blocoNovo: string) => Promise<void> | void;
  onVoltar: () => void;
}

export function RenomearBlocoJanela({
  initialBloco,
  availableTorres,
  unitsCountByTorre,
  renaming = false,
  onConfirmar,
  onVoltar,
}: RenomearBlocoJanelaProps) {
  const [blocoAntigo, setBlocoAntigo] = useState(
    initialBloco || availableTorres[0] || 'Bloco A'
  );
  const [blocoNovo, setBlocoNovo] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (initialBloco) {
      setBlocoAntigo(initialBloco);
    } else if (availableTorres.length > 0 && !availableTorres.includes(blocoAntigo)) {
      setBlocoAntigo(availableTorres[0]);
    }
  }, [initialBloco, availableTorres]);

  const unidadesAfetadas = useMemo(() => {
    return unitsCountByTorre[blocoAntigo] || 0;
  }, [unitsCountByTorre, blocoAntigo]);

  const validacao = useMemo(() => {
    if (!blocoNovo.trim()) return { valid: false };
    return validateRenameBloco(blocoAntigo, blocoNovo, availableTorres);
  }, [blocoAntigo, blocoNovo, availableTorres]);

  // Sugestões inteligentes rápidas baseadas no nome atual
  const sugestoesRapidas = useMemo(() => {
    const atual = blocoAntigo.trim();
    const matchesNumero = atual.match(/\d+/);
    const matchesLetra = atual.match(/[a-zA-Z]/);

    const s = new Set<string>();

    if (matchesLetra) {
      const l = matchesLetra[0].toUpperCase();
      s.add(`Bloco 1`);
      s.add(`Torre 1`);
      s.add(`1`);
      s.add(`Torre ${l}`);
      s.add(l);
    }
    if (matchesNumero) {
      const n = matchesNumero[0];
      s.add(`Bloco A`);
      s.add(`Torre A`);
      s.add(`A`);
      s.add(`Torre ${n}`);
      s.add(n);
    }

    // Padrões universais
    s.add('Bloco 1');
    s.add('Bloco A');
    s.add('Torre 1');
    s.add('Torre A');
    s.add('Torre Única');

    return Array.from(s).filter((item) => item.toLowerCase() !== atual.toLowerCase()).slice(0, 5);
  }, [blocoAntigo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = validateRenameBloco(blocoAntigo, blocoNovo, availableTorres);
    if (!val.valid) {
      setFormError(val.error || 'Nome de bloco inválido.');
      return;
    }

    setFormError('');
    await onConfirmar(blocoAntigo.trim(), blocoNovo.trim());
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Topbar Integrada */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 md:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onVoltar}
              className="bg-slate-800/80 hover:bg-slate-700 text-white border-slate-700 hover:text-white transition-all text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Voltar para Unidades
            </Button>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Gestão de Estrutura
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Building2 className="h-6 w-6 text-indigo-400" />
            Renomear Bloco / Torre em Cascata
          </h2>
          <p className="text-xs text-slate-300">
            Altere a nomenclatura de um bloco existente (números, letras ou nomes livres). Todas as unidades cadastradas, moradores e comunicados serão atualizados automaticamente.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulário Principal (8 colunas) */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Seleção do Bloco a ser alterado */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  1. Bloco / Torre de Origem a ser Alterado
                </Label>
                {availableTorres.length > 1 ? (
                  <select
                    value={blocoAntigo}
                    onChange={(e) => {
                      setBlocoAntigo(e.target.value);
                      setFormError('');
                    }}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {availableTorres.map((t) => (
                      <option key={t} value={t}>
                        {t} ({unitsCountByTorre[t] || 0} apartamentos)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">{blocoAntigo}</span>
                    <Badge variant="outline" className="bg-white text-slate-700 text-xs">
                      {unidadesAfetadas} unidades cadastradas
                    </Badge>
                  </div>
                )}
                <p className="text-xs text-slate-500">
                  Selecione o bloco cujas unidades e vínculos serão renomeados.
                </p>
              </div>

              {/* Novo nome do bloco */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Novo Nome / Número do Bloco
                </Label>
                <Input
                  placeholder="Ex: Bloco 1, Torre B, 1, 2, A ou Edifício Sul"
                  value={blocoNovo}
                  onChange={(e) => {
                    setBlocoNovo(e.target.value);
                    setFormError('');
                  }}
                  className="text-base h-11 border-slate-300 font-semibold text-slate-900 bg-slate-50/50 focus:bg-white"
                  autoFocus
                  required
                />
                <p className="text-xs text-slate-500">
                  O bloco pode ser identificado por <strong>números</strong> (ex: "Bloco 1", "1"), <strong>letras</strong> (ex: "Bloco A", "A") ou <strong>nomes livres</strong>.
                </p>

                {/* Sugestões rápidas em chips */}
                {sugestoesRapidas.length > 0 && (
                  <div className="pt-2 flex items-center gap-1.5 flex-wrap text-xs text-slate-500">
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-indigo-500" /> Sugestões:
                    </span>
                    {sugestoesRapidas.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => {
                          setBlocoNovo(sug);
                          setFormError('');
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-700 rounded-lg border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Alerta de Fusão de Blocos */}
              {validacao.isMerging && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-amber-900 text-xs animate-in fade-in-50">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    Atenção: Mesclagem de Blocos Existentes
                  </p>
                  <p className="leading-relaxed">
                    Já existe um bloco chamado <strong>"{blocoNovo.trim()}"</strong> no condomínio. Ao confirmar, as {unidadesAfetadas} unidades do <strong>"{blocoAntigo}"</strong> serão unificadas no bloco existente <strong>"{blocoNovo.trim()}"</strong>.
                  </p>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onVoltar}
                  disabled={renaming}
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={renaming || !blocoNovo.trim() || !validacao.valid}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer min-w-[200px]"
                >
                  {renaming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Atualizando em Cascata...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Confirmar Renomeação
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Painel Lateral com Resumo de Impacto (4 colunas) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Info className="h-4 w-4 text-indigo-600" />
              Impacto da Atualização em Cascata
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start gap-2.5 text-indigo-950">
                <Layers className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Unidades Afetadas</p>
                  <p className="text-indigo-800 mt-0.5">
                    <strong>{unidadesAfetadas} apartamentos</strong> do bloco <strong>{blocoAntigo}</strong> terão o campo de torre atualizado para <strong>{blocoNovo.trim() || 'novo nome'}</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-start gap-2.5 text-emerald-950">
                <Users className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Moradores Vinculados</p>
                  <p className="text-emerald-800 mt-0.5">
                    O nome da unidade nos perfis dos moradores cadastrados (ex: "Bloco A - Apto 101") será sincronizado automaticamente.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 flex items-start gap-2.5 text-purple-950">
                <Megaphone className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Mural de Avisos</p>
                  <p className="text-purple-800 mt-0.5">
                    Comunicados já publicados no mural direcionados para este bloco continuarão acessíveis aos moradores com o novo nome.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

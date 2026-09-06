import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Building2,
  Layers,
  Calculator,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { generateBlockName, type BlocoEstilo } from '@/lib/unit-helpers';

export interface RegerarEstruturaJanelaProps {
  unidadesAtuaisCount: number;
  resetting?: boolean;
  onConfirmar: (params: {
    torres: number;
    andares: number;
    aptosPorAndar: number;
    estiloBloco?: BlocoEstilo;
  }) => Promise<void> | void;
  onVoltar: () => void;
}

export function RegerarEstruturaJanela({
  unidadesAtuaisCount,
  resetting = false,
  onConfirmar,
  onVoltar,
}: RegerarEstruturaJanelaProps) {
  const [torres, setTorres] = useState('1');
  const [andares, setAndares] = useState('4');
  const [aptosPorAndar, setAptosPorAndar] = useState('4');
  const [estiloBloco, setEstiloBloco] = useState<BlocoEstilo>('bloco_letras');
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const numTorres = parseInt(torres, 10) || 0;
  const numAndares = parseInt(andares, 10) || 0;
  const numAptos = parseInt(aptosPorAndar, 10) || 0;
  const totalPrevisto = numTorres * numAndares * numAptos;

  // Prévia das primeiras unidades que serão geradas
  const amostraUnidades = useMemo(() => {
    if (numTorres <= 0 || numAndares <= 0 || numAptos <= 0) return [];
    const amostra: string[] = [];
    for (let t = 1; t <= Math.min(numTorres, 2); t++) {
      const nomeTorre = generateBlockName(t, numTorres, estiloBloco);
      for (let a = 1; a <= Math.min(numAndares, 2); a++) {
        for (let ap = 1; ap <= Math.min(numAptos, 2); ap++) {
          const numeroApto = a * 100 + ap;
          amostra.push(`${nomeTorre} - Apto ${numeroApto}`);
        }
      }
    }
    return amostra;
  }, [numTorres, numAndares, numAptos, estiloBloco]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numTorres < 1 || numAndares < 1 || numAptos < 1) {
      setErrorMsg('Todos os campos numéricos devem ser maiores ou iguais a 1.');
      return;
    }
    if (!confirmChecked) {
      setErrorMsg('Marque a caixa confirmando que está ciente da substituição das unidades atuais.');
      return;
    }

    setErrorMsg('');
    await onConfirmar({
      torres: numTorres,
      andares: numAndares,
      aptosPorAndar: numAptos,
      estiloBloco,
    });
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
              className="bg-slate-800/80 hover:bg-slate-700 text-white border-slate-700 hover:text-white transition-all text-xs font-semibold"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Voltar para Unidades
            </Button>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Gerador em Massa
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <RefreshCw className="h-6 w-6 text-indigo-400" />
            Regerar Estrutura Predial em Lote
          </h2>
          <p className="text-xs text-slate-300">
            Reconfigure a quantidade de blocos, andares e apartamentos por pavimento do condomínio de forma automatizada.
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 px-4 py-2.5 rounded-xl text-center self-start sm:self-auto">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-medium">
            Grade Atual
          </span>
          <span className="font-mono text-xs text-indigo-300 font-semibold">
            {unidadesAtuaisCount} unidade(s) cadastradas
          </span>
        </div>
      </div>

      {/* Grid de 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna 1 (7 colunas): Formulário de Parâmetros */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-600" />
              Parâmetros da Nova Estrutura
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Defina a arquitetura física para que o sistema gere as unidades com a numeração padrão (101, 102, 201...).
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Quantidade de Torres ou Blocos *
              </Label>
              <Input
                type="number"
                min="1"
                max="50"
                value={torres}
                onChange={(e) => setTorres(e.target.value)}
                required
                className="rounded-xl border-slate-200 text-sm font-semibold"
              />
              <p className="text-[11px] text-slate-400">
                Se for apenas um prédio, mantenha o valor 1.
              </p>
            </div>

            {/* Formato dos Blocos: Letras ou Números */}
            {numTorres > 1 && (
              <div className="space-y-1.5 p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <Label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  Padrão de Nomenclatura dos Blocos / Torres
                </Label>
                <select
                  value={estiloBloco}
                  onChange={(e) => setEstiloBloco(e.target.value as BlocoEstilo)}
                  className="w-full text-xs border border-indigo-200 rounded-lg px-3 py-2 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="bloco_letras">Letras: Bloco A, Bloco B, Bloco C...</option>
                  <option value="bloco_numeros">Números: Bloco 1, Bloco 2, Bloco 3...</option>
                  <option value="torre_letras">Letras: Torre A, Torre B, Torre C...</option>
                  <option value="torre_numeros">Números: Torre 1, Torre 2, Torre 3...</option>
                  <option value="apenas_letras">Apenas Letras: A, B, C...</option>
                  <option value="apenas_numeros">Apenas Números: 1, 2, 3...</option>
                </select>
                <p className="text-[11px] text-indigo-700">
                  Escolha se os blocos serão identificados por letras ou números. Você também poderá renomear qualquer bloco individualmente depois.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Andares por Torre *
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={andares}
                  onChange={(e) => setAndares(e.target.value)}
                  required
                  className="rounded-xl border-slate-200 text-sm font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Apartamentos por Pavimento *
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={aptosPorAndar}
                  onChange={(e) => setAptosPorAndar(e.target.value)}
                  required
                  className="rounded-xl border-slate-200 text-sm font-semibold"
                />
              </div>
            </div>

            {/* Caixa de Aviso Crítico e Consentimento */}
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-start gap-2.5 text-amber-900 text-xs">
                <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Substituição da grade predial existente</p>
                  <p className="text-amber-800 leading-relaxed">
                    Esta ação excluirá as {unidadesAtuaisCount} unidades anteriores e criará {totalPrevisto} novas unidades padronizadas. Os cadastros de moradores que já estavam vinculados precisarão de reassociação.
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer pt-2 border-t border-amber-200/80">
                <input
                  type="checkbox"
                  checked={confirmChecked}
                  onChange={(e) => setConfirmChecked(e.target.checked)}
                  className="mt-0.5 rounded border-amber-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium">
                  Estou ciente de que as unidades atuais serão substituídas pela nova grade de {totalPrevisto} unidades.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={onVoltar}
                disabled={resetting}
                className="text-xs font-semibold border-slate-200"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={resetting || !confirmChecked || totalPrevisto <= 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-100"
              >
                {resetting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Regerando Grade...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Confirmar e Regerar Grade ({totalPrevisto} Unidades)
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Coluna 2 (5 colunas): Resumo da Simulação */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card de Cálculo Total */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 border border-indigo-950 shadow-md space-y-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300 block flex items-center gap-1.5">
              <Calculator className="h-4 w-4 text-indigo-400" />
              Resumo do Dimensionamento
            </span>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/15 text-center space-y-1">
              <span className="text-4xl font-black tracking-tight text-white block">
                {totalPrevisto}
              </span>
              <span className="text-xs text-indigo-200 uppercase tracking-wider font-semibold">
                Unidades Totais Geradas
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                <span className="block text-[11px] text-slate-400">Torres</span>
                <span className="font-bold text-white text-sm">{numTorres}</span>
              </div>
              <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                <span className="block text-[11px] text-slate-400">Andares</span>
                <span className="font-bold text-white text-sm">{numAndares}</span>
              </div>
              <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                <span className="block text-[11px] text-slate-400">Aptos/Andar</span>
                <span className="font-bold text-white text-sm">{numAptos}</span>
              </div>
            </div>
          </div>

          {/* Amostra da Numeração */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-600" />
              Amostra da Grade Predial Gerada
            </h4>
            <p className="text-xs text-slate-500">
              Exemplo das primeiras unidades geradas automaticamente:
            </p>

            {amostraUnidades.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                {amostraUnidades.slice(0, 6).map((item, idx) => (
                  <div
                    key={idx}
                    className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono font-medium"
                  >
                    {item}
                  </div>
                ))}
                {totalPrevisto > 6 && (
                  <p className="text-[11px] text-slate-400 text-center pt-1 italic">
                    ... e mais {totalPrevisto - 6} unidade(s)
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Insira valores válidos acima para visualizar a amostra.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatUnitName, filterUnits, groupUnitsByFloor, type UnitData } from '@/lib/unit-helpers';
import {
  Building2,
  Search,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Edit3,
  Layers,
  Info
} from 'lucide-react';

export type UnitItem = UnitData & { id: string };

interface UnitSelectorProps {
  unidades: UnitItem[];
  selectedId: string;
  onSelect: (unit: UnitItem & { nomeCompleto: string }) => void;
  manualMode: boolean;
  onManualModeChange: (manual: boolean) => void;
  manualTorre: string;
  onManualTorreChange: (val: string) => void;
  manualNumero: string;
  onManualNumeroChange: (val: string) => void;
}

export function UnitSelector({
  unidades,
  selectedId,
  onSelect,
  manualMode,
  onManualModeChange,
  manualTorre,
  onManualTorreChange,
  manualNumero,
  onManualNumeroChange,
}: UnitSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTorre, setActiveTorre] = useState<string>('all');

  // Encontra unidade selecionada na lista
  const selectedUnit = useMemo(() => {
    return unidades.find((u) => u.id === selectedId);
  }, [unidades, selectedId]);

  // Lista única de torres disponíveis
  const torres = useMemo(() => {
    const set = new Set<string>();
    unidades.forEach((u) => {
      if (u.torre && u.torre.trim()) set.add(u.torre.trim());
    });
    return Array.from(set).sort();
  }, [unidades]);

  // Filtragem das unidades por pesquisa e por torre
  const filteredUnidades = useMemo(() => {
    return filterUnits(unidades, search, activeTorre) as UnitItem[];
  }, [unidades, search, activeTorre]);

  // Agrupamento por andar para exibição estruturada
  const groupedByAndar = useMemo(() => {
    return groupUnitsByFloor(filteredUnidades) as { andar: string; itens: UnitItem[] }[];
  }, [filteredUnidades]);

  const handleUnitClick = (u: UnitItem) => {
    const nomeCompleto = formatUnitName(u);
    onSelect({ ...u, nomeCompleto });
    setIsOpen(false);
    onManualModeChange(false);
  };

  // Se o condomínio não tiver unidades mapeadas
  if (unidades.length === 0) {
    return (
      <div className="space-y-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
        <div className="flex items-start gap-2.5 text-indigo-900">
          <Info className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Identificação da sua Unidade</p>
            <p className="text-xs text-indigo-700 leading-relaxed mt-0.5">
              O condomínio ainda não possui um mapa predial pré-carregado. Informe o número da sua unidade abaixo para solicitar a liberação.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="manualTorre" className="text-xs font-medium text-slate-700">
              Torre ou Bloco (Opcional)
            </Label>
            <Input
              id="manualTorre"
              placeholder="Ex: Bloco B, Torre 1"
              value={manualTorre}
              onChange={(e) => {
                onManualTorreChange(e.target.value);
                onManualModeChange(true);
              }}
              className="bg-white border-slate-300 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="manualNumero" className="text-xs font-medium text-slate-700">
              Número do Apartamento *
            </Label>
            <Input
              id="manualNumero"
              placeholder="Ex: 302, 12, Cobertura"
              required
              value={manualNumero}
              onChange={(e) => {
                onManualNumeroChange(e.target.value);
                onManualModeChange(true);
              }}
              className="bg-white border-slate-300 text-sm"
            />
          </div>
        </div>
      </div>
    );
  }

  // Se estiver no modo manual (escolhido pelo usuário como alternativa)
  if (manualMode) {
    return (
      <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Edit3 className="h-4 w-4 text-indigo-600" /> Preenchimento Manual da Unidade
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-indigo-600 hover:text-indigo-800 h-7"
            onClick={() => onManualModeChange(false)}
          >
            Voltar para a lista do condomínio
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="manualTorre" className="text-xs font-medium text-slate-700">
              Torre / Bloco (Opcional)
            </Label>
            <Input
              id="manualTorre"
              placeholder="Ex: Bloco B"
              value={manualTorre}
              onChange={(e) => onManualTorreChange(e.target.value)}
              className="bg-white border-slate-300 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="manualNumero" className="text-xs font-medium text-slate-700">
              Número do Apartamento *
            </Label>
            <Input
              id="manualNumero"
              placeholder="Ex: 104"
              required
              value={manualNumero}
              onChange={(e) => onManualNumeroChange(e.target.value)}
              className="bg-white border-slate-300 text-sm"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Botão Gatilho / Card da Unidade Selecionada */}
      {selectedUnit ? (
        <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200 flex items-center justify-between transition-all">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-base">
                  Apto {selectedUnit.numero}
                </span>
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 text-xs font-semibold">
                  <Check className="h-3 w-3 mr-0.5" /> Selecionado
                </Badge>
              </div>
              <p className="text-xs text-slate-600">
                {selectedUnit.torre ? `${selectedUnit.torre} • ` : ''}
                {selectedUnit.andar ? `${selectedUnit.andar}º andar` : 'Unidade residencial'}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-100/50 text-xs h-9"
          >
            {isOpen ? 'Fechar mapa' : 'Alterar unidade'}
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between text-left ${
            isOpen
              ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-500/20'
              : 'border-dashed border-slate-300 bg-slate-50 hover:bg-indigo-50/40 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                Selecione seu Apartamento
              </p>
              <p className="text-xs text-slate-500">
                Clique para visualizar o mapa de unidades do condomínio
              </p>
            </div>
          </div>
          <div className="text-slate-400 pr-1">
            {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </button>
      )}

      {/* Painel do Seletor Interativo */}
      {isOpen && (
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-md space-y-4 animate-in fade-in-50 duration-150">
          {/* Barra de Pesquisa Rápida */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <Input
              type="text"
              placeholder="Digite o número (ex: 201) ou bloco..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 bg-slate-50 border-slate-200 text-sm focus:bg-white"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Abas / Filtro de Torres (se houver mais de uma torre) */}
          {torres.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTorre('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors min-h-[36px] ${
                  activeTorre === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas as Torres ({unidades.length})
              </button>
              {torres.map((t) => {
                const count = unidades.filter((u) => u.torre === t).length;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActiveTorre(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors min-h-[36px] ${
                      activeTorre === t
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Lista de Unidades Agrupadas por Andar */}
          <div className="max-h-64 overflow-y-auto space-y-4 pr-1">
            {groupedByAndar.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-sm font-medium text-slate-600">
                  Nenhum apartamento encontrado para "{search}"
                </p>
                <p className="text-xs text-slate-400">
                  Verifique a digitação ou informe sua unidade manualmente.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onManualModeChange(true);
                    setIsOpen(false);
                  }}
                  className="mt-2 text-xs"
                >
                  Informar manualmente
                </Button>
              </div>
            ) : (
              groupedByAndar.map((grupo) => (
                <div key={grupo.andar} className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 bg-white py-1">
                    <Layers className="h-3.5 w-3.5 text-indigo-500" />
                    {grupo.andar === 'Outros' ? 'Unidades' : `${grupo.andar}º Andar`}
                    <span className="text-[10px] font-normal text-slate-400">
                      ({grupo.itens.length} {grupo.itens.length === 1 ? 'unidade' : 'unidades'})
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {grupo.itens.map((u) => {
                      const isSelected = selectedId === u.id;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleUnitClick(u)}
                          className={`p-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center min-h-[48px] active:scale-95 ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm font-bold ring-2 ring-indigo-300'
                              : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-indigo-50/60 hover:border-indigo-200'
                          }`}
                        >
                          <span className="text-sm font-semibold">
                            {u.numero}
                          </span>
                          {u.torre && activeTorre === 'all' && torres.length > 1 && (
                            <span
                              className={`text-[10px] truncate max-w-[70px] ${
                                isSelected ? 'text-indigo-100' : 'text-slate-400'
                              }`}
                            >
                              {u.torre}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Rodapé do Seletor */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Total: {filteredUnidades.length} unidades encontradas
            </span>
            <button
              type="button"
              onClick={() => {
                onManualModeChange(true);
                setIsOpen(false);
              }}
              className="text-indigo-600 hover:underline font-medium"
            >
              Não encontrou seu apto? Digite manualmente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

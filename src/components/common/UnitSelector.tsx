import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatUnitName, filterUnits, groupUnitsByFloor, type UnitData } from '@/lib/unit-helpers';
import {
  Building2,
  Search,
  Check,
  X,
  Edit3,
  Layers,
  ChevronRight,
  RotateCcw
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

  // Fecha modal com Escape e trava scroll do body
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Unidade atualmente selecionada
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

  // Filtragem das unidades
  const filteredUnidades = useMemo(() => {
    return filterUnits(unidades, search, activeTorre) as UnitItem[];
  }, [unidades, search, activeTorre]);

  // Agrupamento por andar
  const groupedByAndar = useMemo(() => {
    return groupUnitsByFloor(filteredUnidades) as { andar: string; itens: UnitItem[] }[];
  }, [filteredUnidades]);

  const handleUnitClick = (u: UnitItem) => {
    const nomeCompleto = formatUnitName(u);
    onSelect({ ...u, nomeCompleto });
    setIsOpen(false);
    onManualModeChange(false);
  };

  // Se o condomínio não tem unidades cadastradas, exibe campos diretos e limpos
  if (unidades.length === 0) {
    return (
      <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-xs text-slate-600 leading-relaxed">
          Informe os dados da sua residência para solicitar liberação de acesso:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="manualTorre" className="text-xs font-medium text-slate-700">
              Torre / Bloco <span className="text-slate-400 font-normal">(opcional)</span>
            </Label>
            <Input
              id="manualTorre"
              placeholder="Ex: Bloco B"
              value={manualTorre}
              onChange={(e) => {
                onManualTorreChange(e.target.value);
                onManualModeChange(true);
              }}
              className="h-10 bg-white border-slate-200 rounded-lg text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="manualNumero" className="text-xs font-medium text-slate-700">
              Apartamento <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="manualNumero"
              placeholder="Ex: 302"
              required
              value={manualNumero}
              onChange={(e) => {
                onManualNumeroChange(e.target.value);
                onManualModeChange(true);
              }}
              className="h-10 bg-white border-slate-200 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>
    );
  }

  // Modo manual escolhido pelo morador
  if (manualMode) {
    return (
      <div className="space-y-3 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
            Digitação manual da unidade
          </span>
          <button
            type="button"
            onClick={() => onManualModeChange(false)}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Escolher na lista
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="manualTorre" className="text-xs font-medium text-slate-700">
              Torre / Bloco <span className="text-slate-400 font-normal">(opcional)</span>
            </Label>
            <Input
              id="manualTorre"
              placeholder="Ex: Bloco B"
              value={manualTorre}
              onChange={(e) => onManualTorreChange(e.target.value)}
              className="h-10 bg-white border-slate-200 rounded-lg text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="manualNumero" className="text-xs font-medium text-slate-700">
              Apartamento <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="manualNumero"
              placeholder="Ex: 104"
              required
              value={manualNumero}
              onChange={(e) => onManualNumeroChange(e.target.value)}
              className="h-10 bg-white border-slate-200 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {/* Visualização do Campo: Selecionado vs Não Selecionado */}
      {selectedUnit ? (
        <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200/90 flex items-center justify-between transition-all">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Building2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 text-sm">
                  Apto {selectedUnit.numero}
                </span>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> Selecionado
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {selectedUnit.torre ? `${selectedUnit.torre} • ` : ''}
                {selectedUnit.andar ? `${selectedUnit.andar}º andar` : 'Unidade residencial'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-100/60 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Trocar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full h-11 px-3.5 rounded-xl border border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-white text-left flex items-center justify-between transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <Building2 className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            <span className="text-sm text-slate-500 group-hover:text-slate-700 transition-colors">
              Toque para escolher seu apartamento...
            </span>
          </div>
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 group-hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors flex items-center gap-1">
            Escolher <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </button>
      )}

      {/* Opção discreta para digitação manual */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onManualModeChange(true)}
          className="text-[11px] text-slate-400 hover:text-indigo-600 transition-colors"
        >
          Não encontrou seu apartamento? Digitar manualmente
        </button>
      </div>

      {/* DIÁLOGO MODAL: Escolha Rápida e Focada */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in-0 duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            {/* Header do Modal */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="modal-title" className="text-base font-bold text-slate-900">
                    Escolha seu Apartamento
                  </h3>
                  <p className="text-xs text-slate-500">
                    {unidades.length} unidades cadastradas no condomínio
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Fechar"
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Barra de Pesquisa */}
            <div className="p-4 pb-2 space-y-3 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar pelo número (ex: 201) ou bloco..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-8 h-10 bg-slate-50 border-slate-200 rounded-xl text-sm focus:bg-white"
                  autoFocus
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label="Limpar busca"
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filtro por Torres / Blocos */}
              {torres.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTorre('all')}
                    className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors min-h-[32px] cursor-pointer ${
                      activeTorre === 'all'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Todas ({unidades.length})
                  </button>
                  {torres.map((t) => {
                    const count = unidades.filter((u) => u.torre === t).length;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setActiveTorre(t)}
                        className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors min-h-[32px] cursor-pointer ${
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
            </div>

            {/* Lista de Unidades Agrupadas por Andar */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {groupedByAndar.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <p className="text-sm font-medium text-slate-600">
                    Nenhum apartamento encontrado para "{search}"
                  </p>
                  <p className="text-xs text-slate-400">
                    Você pode cadastrar o número manualmente se não estiver listado.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onManualModeChange(true);
                      setIsOpen(false);
                    }}
                    className="text-xs"
                  >
                    Digitar número manualmente
                  </Button>
                </div>
              ) : (
                groupedByAndar.map((grupo) => (
                  <div key={grupo.andar} className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider sticky top-0 bg-white py-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      {grupo.andar === 'Outros' ? 'Unidades' : `${grupo.andar}º Andar`}
                      <span className="text-[10px] font-normal text-slate-400">
                        ({grupo.itens.length})
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {grupo.itens.map((u) => {
                        const isSelected = selectedId === u.id;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => handleUnitClick(u)}
                            className={`p-2.5 rounded-xl text-center border transition-all flex flex-col items-center justify-center min-h-[46px] cursor-pointer active:scale-95 ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm font-bold ring-2 ring-indigo-200'
                                : 'bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-indigo-50 hover:border-indigo-300'
                            }`}
                          >
                            <span className="text-sm font-semibold">{u.numero}</span>
                            {u.torre && activeTorre === 'all' && torres.length > 1 && (
                              <span
                                className={`text-[10px] truncate max-w-[80px] ${
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

            {/* Rodapé do Modal */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {filteredUnidades.length} unidades encontradas
              </span>
              <button
                type="button"
                onClick={() => {
                  onManualModeChange(true);
                  setIsOpen(false);
                }}
                className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
              >
                Digitar manualmente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

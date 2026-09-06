export type UnitData = {
  id?: string;
  torre?: string;
  andar?: number;
  numero: string;
};

/**
 * Formata o nome amigável e padronizado da unidade.
 * Ex: "Bloco A - Apto 302 (3º andar)" ou "Apto 104"
 */
export function formatUnitName(unit: { torre?: string; numero?: string; andar?: number }): string {
  const numero = unit.numero ? unit.numero.trim() : '';
  if (!numero) return '';

  const torre = unit.torre ? unit.torre.trim() : '';
  const prefixoTorre = torre ? `${torre} - ` : '';
  const sufixoAndar = unit.andar !== undefined && unit.andar !== null ? ` (${unit.andar}º andar)` : '';

  return `${prefixoTorre}Apto ${numero}${sufixoAndar}`.trim();
}

/**
 * Filtra unidades por termo de busca (número, bloco/torre ou andar)
 * e opcionalmente por uma torre específica.
 */
export function filterUnits(
  units: UnitData[],
  searchTerm: string = '',
  targetTorre: string = 'all'
): UnitData[] {
  if (!Array.isArray(units)) return [];

  const term = searchTerm.trim().toLowerCase();

  return units.filter((u) => {
    if (!u || !u.numero) return false;

    // Filtro por torre específica
    if (targetTorre !== 'all') {
      const unitTorre = u.torre ? u.torre.trim() : '';
      if (unitTorre !== targetTorre) return false;
    }

    if (!term) return true;

    const numMatch = u.numero.toLowerCase().includes(term);
    const torreMatch = u.torre ? u.torre.toLowerCase().includes(term) : false;
    const andarMatch = u.andar !== undefined && u.andar !== null ? `${u.andar}`.includes(term) : false;

    return numMatch || torreMatch || andarMatch;
  });
}

/**
 * Agrupa unidades por andar de forma decrescente (andares superiores primeiro).
 */
export function groupUnitsByFloor(units: UnitData[]): { andar: string; itens: UnitData[] }[] {
  if (!Array.isArray(units) || units.length === 0) return [];

  const groups: { [andar: string]: UnitData[] } = {};

  units.forEach((u) => {
    const andarKey = u.andar !== undefined && u.andar !== null ? `${u.andar}` : 'Outros';
    if (!groups[andarKey]) groups[andarKey] = [];
    groups[andarKey].push(u);
  });

  const sortedKeys = Object.keys(groups).sort((a, b) => {
    if (a === 'Outros') return 1;
    if (b === 'Outros') return -1;
    return parseInt(b, 10) - parseInt(a, 10);
  });

  return sortedKeys.map((key) => ({
    andar: key,
    itens: groups[key].sort((a, b) =>
      a.numero.localeCompare(b.numero, undefined, { numeric: true })
    ),
  }));
}

/* eslint-disable complexity */ // FIXME: D�vida t�cnica (Quarentena)
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
 * Compara duas unidades para ordenação:
 * 1º Critério: Torre/Bloco (ordem alfanumérica natural, ex: "Bloco 1" antes de "Bloco 2", "Bloco A" antes de "Bloco B")
 * 2º Critério: Número do apartamento (do menor para o maior em ordem numérica natural: 11 < 12 < 101 < 102 < 1001)
 * 3º Critério (desempate): Andar (do menor para o maior)
 */
export function compareUnits(a: UnitData, b: UnitData): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  // 1º critério: Torre / Bloco
  const torreA = (a.torre || '').trim();
  const torreB = (b.torre || '').trim();
  const compTorre = torreA.localeCompare(torreB, undefined, { numeric: true, sensitivity: 'base' });
  if (compTorre !== 0) return compTorre;

  // 2º critério: Número do apartamento (ordem numérica natural crescente: 1, 2, 10, 101, 102, 201)
  const numA = (a.numero || '').trim();
  const numB = (b.numero || '').trim();
  const compNumero = numA.localeCompare(numB, undefined, { numeric: true, sensitivity: 'base' });
  if (compNumero !== 0) return compNumero;

  // 3º critério (desempate): Andar
  const andarA = a.andar ?? 0;
  const andarB = b.andar ?? 0;
  return andarA - andarB;
}

/**
 * Ordena unidades de forma imutável por Torre/Bloco e pelo número do apartamento do MENOR para o MAIOR.
 */
export function sortUnits<T extends UnitData>(units: T[]): T[] {
  if (!Array.isArray(units)) return [];
  return [...units].sort(compareUnits);
}

/**
 * Filtra unidades por termo de busca (número, bloco/torre ou andar)
 * e opcionalmente por uma torre específica, retornando os itens ordenados
 * por torre e número de apartamento do menor para o maior.
 */
export function filterUnits(
  units: UnitData[],
  searchTerm: string = '',
  targetTorre: string = 'all'
): UnitData[] {
  if (!Array.isArray(units)) return [];

  const term = searchTerm.trim().toLowerCase();

  const filtered = units.filter((u) => {
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

  return sortUnits(filtered);
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

/**
 * Verifica se já existe uma unidade com a mesma combinação de torre e número.
 * Permite passar excludeId para cenários de edição da própria unidade.
 */
export function isUnitDuplicate(
  units: UnitData[],
  newUnit: { torre?: string; numero: string },
  excludeId?: string
): boolean {
  if (!Array.isArray(units) || !newUnit || !newUnit.numero) return false;

  const targetNumero = newUnit.numero.trim().toLowerCase();
  const targetTorre = (newUnit.torre || '').trim().toLowerCase();

  return units.some((u) => {
    if (excludeId && u.id === excludeId) return false;
    const uNumero = (u.numero || '').trim().toLowerCase();
    const uTorre = (u.torre || '').trim().toLowerCase();
    return uNumero === targetNumero && uTorre === targetTorre;
  });
}

/**
 * Retorna a contagem de unidades agrupadas por torre/bloco.
 */
export function countUnitsByTower(units: UnitData[]): Record<string, number> {
  if (!Array.isArray(units)) return {};
  const counts: Record<string, number> = {};
  units.forEach((u) => {
    const torre = (u.torre || 'Geral').trim();
    counts[torre] = (counts[torre] || 0) + 1;
  });
  return counts;
}

export type BlocoEstilo =
  | 'bloco_letras'
  | 'bloco_numeros'
  | 'torre_letras'
  | 'torre_numeros'
  | 'apenas_letras'
  | 'apenas_numeros';

/**
 * Gera o nome padronizado do bloco/torre conforme o estilo e o índice (1-indexed).
 * Suporta blocos como números (Bloco 1, Torre 1, 1) ou letras (Bloco A, Torre A, A).
 */
export function generateBlockName(
  index: number,
  totalTorres: number,
  estilo: BlocoEstilo = 'bloco_letras'
): string {
  if (totalTorres === 1 && estilo !== 'apenas_letras' && estilo !== 'apenas_numeros') {
    return 'Torre Única';
  }

  const letra = String.fromCharCode(64 + Math.max(1, index)); // 1 -> A, 2 -> B...
  const numero = String(Math.max(1, index)); // 1 -> 1, 2 -> 2...

  switch (estilo) {
    case 'bloco_numeros':
      return `Bloco ${numero}`;
    case 'torre_letras':
      return `Torre ${letra}`;
    case 'torre_numeros':
      return `Torre ${numero}`;
    case 'apenas_letras':
      return letra;
    case 'apenas_numeros':
      return numero;
    case 'bloco_letras':
    default:
      return `Bloco ${letra}`;
  }
}

/**
 * Atualiza todas as unidades que pertencem ao blocoAntigo para o blocoNovo.
 * Preserva as demais unidades inalteradas.
 */
export function renameBlocoInUnits(
  units: UnitData[],
  blocoAntigo: string,
  blocoNovo: string
): UnitData[] {
  if (!Array.isArray(units)) return [];

  const antigoNorm = blocoAntigo.trim().toLowerCase();
  const novoTrim = blocoNovo.trim();

  return units.map((u) => {
    const torreAtualNorm = (u.torre || '').trim().toLowerCase();
    if (torreAtualNorm === antigoNorm) {
      return {
        ...u,
        torre: novoTrim,
      };
    }
    return u;
  });
}

/**
 * Atualiza o nome composto da unidade (ex: "Bloco A - Apto 101")
 * substituindo o nome do bloco antigo pelo novo nome de bloco.
 */
export function updateUnitNameWithNewBlock(
  oldUnitName: string,
  blocoAntigo: string,
  blocoNovo: string
): string {
  if (!oldUnitName || !blocoAntigo || !blocoNovo) return oldUnitName || '';

  const antigoTrim = blocoAntigo.trim();
  const novoTrim = blocoNovo.trim();

  if (antigoTrim === novoTrim) return oldUnitName;

  // Se o nome começar com "Bloco Antigo - ..."
  const regexPrefix = new RegExp(`^${escapeRegex(antigoTrim)}\\s*-\\s*`, 'i');
  if (regexPrefix.test(oldUnitName)) {
    return oldUnitName.replace(regexPrefix, `${novoTrim} - `);
  }

  // Se for exatamente o nome do bloco
  if (oldUnitName.trim().toLowerCase() === antigoTrim.toLowerCase()) {
    return novoTrim;
  }

  // Caso contenha o bloco entre delimitadores ou espaços
  const regexWord = new RegExp(`\\b${escapeRegex(antigoTrim)}\\b`, 'i');
  if (regexWord.test(oldUnitName)) {
    return oldUnitName.replace(regexWord, novoTrim);
  }

  return oldUnitName;
}

/**
 * Valida a operação de renomeação de um bloco.
 */
export function validateRenameBloco(
  blocoAntigo: string,
  blocoNovo: string,
  blocosExistentes: string[] = []
): { valid: boolean; error?: string; isMerging?: boolean } {
  const antigo = (blocoAntigo || '').trim();
  const novo = (blocoNovo || '').trim();

  if (!antigo) {
    return { valid: false, error: 'O bloco de origem não foi informado.' };
  }

  if (!novo) {
    return { valid: false, error: 'Informe o novo nome ou número para o bloco.' };
  }

  if (antigo.toLowerCase() === novo.toLowerCase()) {
    return { valid: false, error: 'O novo nome do bloco deve ser diferente do nome atual.' };
  }

  const jaExiste = blocosExistentes.some(
    (b) => b.trim().toLowerCase() === novo.toLowerCase() && b.trim().toLowerCase() !== antigo.toLowerCase()
  );

  return {
    valid: true,
    isMerging: jaExiste,
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}



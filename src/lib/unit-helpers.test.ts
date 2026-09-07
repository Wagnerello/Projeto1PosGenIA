import { describe, it, expect } from 'vitest';
import {
  formatUnitName,
  filterUnits,
  groupUnitsByFloor,
  isUnitDuplicate,
  countUnitsByTower,
  generateBlockName,
  renameBlocoInUnits,
  updateUnitNameWithNewBlock,
  validateRenameBloco,
  sortUnits,
  type UnitData
} from './unit-helpers';

describe('formatUnitName', () => {
  it('deve formatar unidade completa com torre, andar e número', () => {
    const unit = { torre: 'Bloco B', andar: 3, numero: '302' };
    expect(formatUnitName(unit)).toBe('Bloco B - Apto 302 (3º andar)');
  });

  it('deve formatar unidade apenas com número', () => {
    const unit = { numero: '101' };
    expect(formatUnitName(unit)).toBe('Apto 101');
  });

  it('deve formatar unidade sem andar especificado', () => {
    const unit = { torre: 'Torre Norte', numero: '501' };
    expect(formatUnitName(unit)).toBe('Torre Norte - Apto 501');
  });

  it('deve retornar string vazia se o número for vazio ou nulo', () => {
    expect(formatUnitName({ numero: '' })).toBe('');
    expect(formatUnitName({ numero: undefined })).toBe('');
    expect(formatUnitName({ torre: 'Bloco A' })).toBe('');
  });

  it('deve fazer trim em espaços em branco no número e na torre', () => {
    const unit = { torre: '  Bloco C  ', numero: '  204  ', andar: 2 };
    expect(formatUnitName(unit)).toBe('Bloco C - Apto 204 (2º andar)');
  });
});

describe('filterUnits', () => {
  const mockUnits: UnitData[] = [
    { id: '1', torre: 'Bloco A', andar: 1, numero: '101' },
    { id: '2', torre: 'Bloco A', andar: 1, numero: '102' },
    { id: '3', torre: 'Bloco A', andar: 2, numero: '201' },
    { id: '4', torre: 'Bloco B', andar: 1, numero: '101' },
    { id: '5', torre: 'Bloco B', andar: 2, numero: '202' },
  ];

  it('deve retornar todas as unidades quando o termo for vazio e targetTorre for all', () => {
    const result = filterUnits(mockUnits, '', 'all');
    expect(result).toHaveLength(5);
  });

  it('deve filtrar por número de apartamento', () => {
    const result = filterUnits(mockUnits, '201');
    expect(result).toHaveLength(1);
    expect(result[0].numero).toBe('201');
  });

  it('deve filtrar por torre específica', () => {
    const result = filterUnits(mockUnits, '', 'Bloco B');
    expect(result).toHaveLength(2);
    expect(result.every((u) => u.torre === 'Bloco B')).toBe(true);
  });

  it('deve filtrar por termo e torre simultaneamente', () => {
    const result = filterUnits(mockUnits, '101', 'Bloco B');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('4');
  });

  it('deve lidar com busca case-insensitive e espaços extras', () => {
    const result = filterUnits(mockUnits, '  bloco a  ', 'all');
    expect(result).toHaveLength(3);
    expect(result.every((u) => u.torre === 'Bloco A')).toBe(true);
  });

  it('deve lidar com arrays vazios ou inválidos com segurança', () => {
    expect(filterUnits([], '101')).toEqual([]);
    expect(filterUnits(null as any, '101')).toEqual([]);
  });
});

describe('groupUnitsByFloor', () => {
  const mockUnits: UnitData[] = [
    { id: '1', torre: 'Bloco A', andar: 1, numero: '102' },
    { id: '2', torre: 'Bloco A', andar: 1, numero: '101' },
    { id: '3', torre: 'Bloco A', andar: 3, numero: '301' },
    { id: '4', torre: 'Bloco A', andar: 2, numero: '201' },
  ];

  it('deve agrupar por andares em ordem decrescente', () => {
    const groups = groupUnitsByFloor(mockUnits);
    expect(groups).toHaveLength(3);
    expect(groups[0].andar).toBe('3');
    expect(groups[1].andar).toBe('2');
    expect(groups[2].andar).toBe('1');
  });

  it('deve ordenar apartamentos numericamente dentro de cada andar', () => {
    const groups = groupUnitsByFloor(mockUnits);
    const andar1 = groups.find((g) => g.andar === '1');
    expect(andar1?.itens[0].numero).toBe('101');
    expect(andar1?.itens[1].numero).toBe('102');
  });

  it('deve agrupar unidades sem andar em categoria Outros no final', () => {
    const unitsWithNoFloor: UnitData[] = [
      { id: '1', numero: 'Portaria' },
      { id: '2', andar: 2, numero: '201' },
    ];
    const groups = groupUnitsByFloor(unitsWithNoFloor);
    expect(groups).toHaveLength(2);
    expect(groups[0].andar).toBe('2');
    expect(groups[1].andar).toBe('Outros');
  });

  it('deve retornar array vazio se não houver unidades', () => {
    expect(groupUnitsByFloor([])).toEqual([]);
    expect(groupUnitsByFloor(undefined as any)).toEqual([]);
  });
});

describe('isUnitDuplicate', () => {
  const units: UnitData[] = [
    { id: 'u1', torre: 'Bloco A', numero: '101' },
    { id: 'u2', torre: 'Bloco A', numero: '102' },
    { id: 'u3', torre: 'Bloco B', numero: '101' },
  ];

  it('deve identificar duplicata na mesma torre com mesmo número', () => {
    expect(isUnitDuplicate(units, { torre: 'Bloco A', numero: '101' })).toBe(true);
    expect(isUnitDuplicate(units, { torre: 'bloco a', numero: ' 101 ' })).toBe(true);
  });

  it('não deve considerar duplicata se a torre for diferente', () => {
    expect(isUnitDuplicate(units, { torre: 'Bloco C', numero: '101' })).toBe(false);
  });

  it('não deve considerar duplicata se o número for diferente', () => {
    expect(isUnitDuplicate(units, { torre: 'Bloco A', numero: '103' })).toBe(false);
  });

  it('deve ignorar o próprio ID ao editar uma unidade', () => {
    expect(isUnitDuplicate(units, { torre: 'Bloco A', numero: '101' }, 'u1')).toBe(false);
    expect(isUnitDuplicate(units, { torre: 'Bloco A', numero: '102' }, 'u1')).toBe(true);
  });

  it('deve retornar false para entradas inválidas ou vazias', () => {
    expect(isUnitDuplicate([], { numero: '101' })).toBe(false);
    expect(isUnitDuplicate(units, { numero: '' })).toBe(false);
  });
});

describe('countUnitsByTower', () => {
  it('deve contar corretamente as unidades por torre', () => {
    const units: UnitData[] = [
      { id: '1', torre: 'Bloco A', numero: '101' },
      { id: '2', torre: 'Bloco A', numero: '102' },
      { id: '3', torre: 'Bloco B', numero: '101' },
      { id: '4', numero: 'Casa 1' },
    ];
    const counts = countUnitsByTower(units);
    expect(counts['Bloco A']).toBe(2);
    expect(counts['Bloco B']).toBe(1);
    expect(counts['Geral']).toBe(1);
  });

  it('deve retornar objeto vazio se a lista for vazia', () => {
    expect(countUnitsByTower([])).toEqual({});
    expect(countUnitsByTower(undefined as any)).toEqual({});
  });
});

describe('generateBlockName', () => {
  it('deve retornar Torre Única se totalTorres for 1 em estilos padrão', () => {
    expect(generateBlockName(1, 1, 'bloco_letras')).toBe('Torre Única');
    expect(generateBlockName(1, 1, 'bloco_numeros')).toBe('Torre Única');
  });

  it('deve gerar blocos com letras (Bloco A, Bloco B)', () => {
    expect(generateBlockName(1, 3, 'bloco_letras')).toBe('Bloco A');
    expect(generateBlockName(2, 3, 'bloco_letras')).toBe('Bloco B');
    expect(generateBlockName(3, 3, 'bloco_letras')).toBe('Bloco C');
  });

  it('deve gerar blocos com números (Bloco 1, Bloco 2)', () => {
    expect(generateBlockName(1, 3, 'bloco_numeros')).toBe('Bloco 1');
    expect(generateBlockName(2, 3, 'bloco_numeros')).toBe('Bloco 2');
  });

  it('deve gerar torres com letras e números', () => {
    expect(generateBlockName(1, 2, 'torre_letras')).toBe('Torre A');
    expect(generateBlockName(1, 2, 'torre_numeros')).toBe('Torre 1');
  });

  it('deve gerar apenas letras ou apenas números', () => {
    expect(generateBlockName(1, 1, 'apenas_letras')).toBe('A');
    expect(generateBlockName(1, 1, 'apenas_numeros')).toBe('1');
    expect(generateBlockName(3, 5, 'apenas_numeros')).toBe('3');
  });
});

describe('renameBlocoInUnits', () => {
  const units: UnitData[] = [
    { id: '1', torre: 'Bloco A', numero: '101' },
    { id: '2', torre: 'Bloco A', numero: '102' },
    { id: '3', torre: 'Bloco B', numero: '201' },
  ];

  it('deve renomear todas as unidades do bloco alvo preservando os demais', () => {
    const atualizados = renameBlocoInUnits(units, 'Bloco A', 'Bloco 1');
    expect(atualizados[0].torre).toBe('Bloco 1');
    expect(atualizados[1].torre).toBe('Bloco 1');
    expect(atualizados[2].torre).toBe('Bloco B');
  });

  it('deve ignorar diferenças de maiúsculas/minúsculas no bloco antigo', () => {
    const atualizados = renameBlocoInUnits(units, 'bloco a', 'Torre 1');
    expect(atualizados[0].torre).toBe('Torre 1');
    expect(atualizados[1].torre).toBe('Torre 1');
  });

  it('deve retornar lista vazia se input for inválido', () => {
    expect(renameBlocoInUnits([], 'A', 'B')).toEqual([]);
    expect(renameBlocoInUnits(null as any, 'A', 'B')).toEqual([]);
  });
});

describe('updateUnitNameWithNewBlock', () => {
  it('deve substituir o prefixo do bloco mantendo o número do apartamento', () => {
    expect(updateUnitNameWithNewBlock('Bloco A - Apto 101', 'Bloco A', 'Bloco 1')).toBe('Bloco 1 - Apto 101');
    expect(updateUnitNameWithNewBlock('Bloco A - Apto 101 (2º andar)', 'Bloco A', 'Torre Sul')).toBe('Torre Sul - Apto 101 (2º andar)');
  });

  it('deve substituir quando a string for exatamente o nome do bloco', () => {
    expect(updateUnitNameWithNewBlock('Bloco A', 'Bloco A', 'Bloco 1')).toBe('Bloco 1');
  });

  it('deve retornar o próprio nome caso o bloco antigo seja igual ao novo', () => {
    expect(updateUnitNameWithNewBlock('Bloco A - Apto 101', 'Bloco A', 'Bloco A')).toBe('Bloco A - Apto 101');
  });
});

describe('validateRenameBloco', () => {
  it('deve rejeitar blocos vazios', () => {
    expect(validateRenameBloco('', 'Bloco 1').valid).toBe(false);
    expect(validateRenameBloco('Bloco A', '').valid).toBe(false);
  });

  it('deve rejeitar se o novo nome for igual ao atual', () => {
    const res = validateRenameBloco('Bloco A', 'bloco a');
    expect(res.valid).toBe(false);
    expect(res.error).toContain('diferente');
  });

  it('deve alertar isMerging se o novo nome já existir entre os blocos', () => {
    const res = validateRenameBloco('Bloco A', 'Bloco B', ['Bloco A', 'Bloco B', 'Bloco C']);
    expect(res.valid).toBe(true);
    expect(res.isMerging).toBe(true);
  });

  it('deve aprovar renomeação válida sem mesclagem', () => {
    const res = validateRenameBloco('Bloco A', 'Bloco 1', ['Bloco A', 'Bloco B']);
    expect(res.valid).toBe(true);
    expect(res.isMerging).toBe(false);
  });
});

describe('compareUnits / sortUnits', () => {
  const mockUnits: UnitData[] = [
    { id: '1', torre: 'Bloco B', andar: 1, numero: '102' },
    { id: '2', torre: 'Bloco A', andar: 2, numero: '201' },
    { id: '3', torre: 'Bloco A', andar: 1, numero: '102' },
    { id: '4', torre: 'Bloco A', andar: 1, numero: '101' },
    { id: '5', torre: 'Bloco B', andar: 1, numero: '101' },
    { id: '6', torre: 'Bloco B', andar: 2, numero: '201' },
  ];

  it('deve ordenar por bloco e depois por número crescente', () => {
    const sorted = sortUnits(mockUnits);
    expect(sorted[0].torre).toBe('Bloco A');
    expect(sorted[sorted.length - 1].torre).toBe('Bloco B');
  });

  it('deve ordenar por número crescente dentro do mesmo bloco (101 < 102 < 201)', () => {
    const sorted = sortUnits(mockUnits).filter((u) => u.torre === 'Bloco A');
    expect(sorted.map((u) => u.numero)).toEqual(['101', '102', '201']);
  });

  it('deve ordenar numericamente, não alfabeticamente (9 < 10 < 11, não "10" < "11" < "9")', () => {
    const units: UnitData[] = [
      { id: 'a', numero: '11' },
      { id: 'b', numero: '9' },
      { id: 'c', numero: '101' },
      { id: 'd', numero: '10' },
    ];
    const sorted = sortUnits(units);
    expect(sorted.map((u) => u.numero)).toEqual(['9', '10', '11', '101']);
  });

  it('deve colocar unidades sem bloco antes das com bloco (bloco vazio = string vazia = menor)', () => {
    const units: UnitData[] = [
      { id: 'x', torre: 'Bloco A', numero: '101' },
      { id: 'y', torre: '', numero: '101' },
      { id: 'z', numero: '101' },
    ];
    const sorted = sortUnits(units);
    expect(sorted[0].torre ?? '').toBe('');
    expect(sorted[sorted.length - 1].torre).toBe('Bloco A');
  });

  it('sortUnits não deve mutar o array original', () => {
    const original = [...mockUnits];
    sortUnits(mockUnits);
    expect(mockUnits).toEqual(original);
  });

  it('sortUnits deve retornar array vazio para entradas inválidas', () => {
    expect(sortUnits([])).toEqual([]);
    expect(sortUnits(null as any)).toEqual([]);
  });

  it('filterUnits deve retornar resultados já ordenados', () => {
    const units: UnitData[] = [
      { id: '1', torre: 'Bloco B', numero: '101' },
      { id: '2', torre: 'Bloco A', numero: '201' },
      { id: '3', torre: 'Bloco A', numero: '101' },
    ];
    const result = filterUnits(units, '', 'all');
    expect(result[0]).toMatchObject({ torre: 'Bloco A', numero: '101' });
    expect(result[1]).toMatchObject({ torre: 'Bloco A', numero: '201' });
    expect(result[2]).toMatchObject({ torre: 'Bloco B', numero: '101' });
  });
});

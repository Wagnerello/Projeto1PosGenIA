import { describe, it, expect } from 'vitest';
import { formatUnitName, filterUnits, groupUnitsByFloor, isUnitDuplicate, countUnitsByTower, type UnitData } from './unit-helpers';

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


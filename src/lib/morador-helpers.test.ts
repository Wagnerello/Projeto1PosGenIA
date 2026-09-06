import { describe, it, expect } from 'vitest';
import {
  resolveMoradorStatus,
  getMoradorStatusConfig,
  filterMoradores,
  calcMoradoresStats,
  validateMoradorData,
  type MoradorItem,
} from './morador-helpers';

describe('resolveMoradorStatus', () => {
  it('deve priorizar o campo status quando informado', () => {
    expect(resolveMoradorStatus({ status: 'ativo', role: 'pending' })).toBe('ativo');
    expect(resolveMoradorStatus({ status: 'inativo', role: 'morador' })).toBe('inativo');
    expect(resolveMoradorStatus({ status: 'pendente', role: 'morador' })).toBe('pendente');
    expect(resolveMoradorStatus({ status: 'bloqueado' })).toBe('inativo');
  });

  it('deve fazer fallback para role quando status não estiver definido', () => {
    expect(resolveMoradorStatus({ role: 'morador' })).toBe('ativo');
    expect(resolveMoradorStatus({ role: 'pending' })).toBe('pendente');
    expect(resolveMoradorStatus({ role: 'rejected' })).toBe('inativo');
  });

  it('deve retornar pendente para nulo ou indefinido', () => {
    expect(resolveMoradorStatus(null)).toBe('pendente');
    expect(resolveMoradorStatus(undefined)).toBe('pendente');
    expect(resolveMoradorStatus({})).toBe('ativo');
  });
});

describe('getMoradorStatusConfig', () => {
  it('deve retornar configuração correta para Ativo', () => {
    const config = getMoradorStatusConfig('ativo');
    expect(config.label).toBe('Ativo');
    expect(config.badgeClass).toContain('emerald');
    expect(config.dotClass).toContain('emerald-500');
  });

  it('deve retornar configuração correta para Pendente', () => {
    const config = getMoradorStatusConfig('pendente');
    expect(config.label).toBe('Pendente');
    expect(config.badgeClass).toContain('amber');
    expect(config.dotClass).toContain('amber-500');
  });

  it('deve retornar configuração correta para Inativo', () => {
    const config = getMoradorStatusConfig('inativo');
    expect(config.label).toBe('Inativo');
    expect(config.badgeClass).toContain('rose');
    expect(config.dotClass).toContain('rose-500');
  });
});

describe('filterMoradores', () => {
  const listaExemplo: MoradorItem[] = [
    {
      id: '1',
      nome: 'Carlos Silva',
      email: 'carlos@exemplo.com',
      telefone: '11999990001',
      unidadeNome: 'Bloco A - Apto 101',
      role: 'morador',
      status: 'ativo',
    },
    {
      id: '2',
      nome: 'Mariana Lima',
      email: 'mariana@exemplo.com',
      unidadeNome: 'Bloco B - Apto 204',
      role: 'pending',
      status: 'pendente',
    },
    {
      id: '3',
      nome: 'Roberto Souza',
      email: 'roberto@exemplo.com',
      unidadeNome: 'Bloco A - Apto 302',
      role: 'rejected',
      status: 'inativo',
    },
  ];

  it('deve retornar todos os moradores quando nenhum filtro for aplicado', () => {
    const res = filterMoradores(listaExemplo, '', 'all', 'all');
    expect(res).toHaveLength(3);
  });

  it('deve filtrar por termo de busca em nome, email e unidade', () => {
    expect(filterMoradores(listaExemplo, 'carlos')).toHaveLength(1);
    expect(filterMoradores(listaExemplo, 'mariana@exemplo.com')).toHaveLength(1);
    expect(filterMoradores(listaExemplo, 'Apto 302')).toHaveLength(1);
    expect(filterMoradores(listaExemplo, '999990001')).toHaveLength(1);
    expect(filterMoradores(listaExemplo, 'inexistente')).toHaveLength(0);
  });

  it('deve filtrar por status', () => {
    expect(filterMoradores(listaExemplo, '', 'ativo')).toHaveLength(1);
    expect(filterMoradores(listaExemplo, '', 'pendente')).toHaveLength(1);
    expect(filterMoradores(listaExemplo, '', 'inativo')).toHaveLength(1);
  });

  it('deve filtrar por torre/bloco', () => {
    expect(filterMoradores(listaExemplo, '', 'all', 'Bloco A')).toHaveLength(2);
    expect(filterMoradores(listaExemplo, '', 'all', 'Bloco B')).toHaveLength(1);
  });

  it('deve lidar com lista vazia com segurança', () => {
    expect(filterMoradores([], 'teste')).toEqual([]);
  });
});

describe('calcMoradoresStats', () => {
  it('deve totalizar corretamente os status dos moradores', () => {
    const lista: MoradorItem[] = [
      { id: '1', role: 'morador' },
      { id: '2', status: 'ativo' },
      { id: '3', role: 'pending' },
      { id: '4', status: 'inativo' },
      { id: '5', role: 'rejected' },
    ];
    const stats = calcMoradoresStats(lista);
    expect(stats.total).toBe(5);
    expect(stats.ativos).toBe(2);
    expect(stats.pendentes).toBe(1);
    expect(stats.inativos).toBe(2);
  });

  it('deve retornar zeros para lista vazia', () => {
    expect(calcMoradoresStats([])).toEqual({ total: 0, ativos: 0, pendentes: 0, inativos: 0 });
  });
});

describe('validateMoradorData', () => {
  it('deve validar nome obrigatório', () => {
    expect(validateMoradorData({ nome: '', unidadeId: 'u1' }).valid).toBe(false);
    expect(validateMoradorData({ nome: 'ab', unidadeId: 'u1' }).valid).toBe(false);
  });

  it('deve validar unidadeId obrigatório', () => {
    expect(validateMoradorData({ nome: 'João da Silva', unidadeId: '' }).valid).toBe(false);
  });

  it('deve aprovar dados válidos', () => {
    expect(validateMoradorData({ nome: 'João da Silva', unidadeId: 'u1' }).valid).toBe(true);
  });
});

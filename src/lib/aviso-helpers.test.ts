/* eslint-disable @typescript-eslint/no-explicit-any */ // FIXME: D�vida t�cnica (Quarentena)
import { describe, it, expect } from 'vitest';
import {
  filterAvisosParaMorador,
  formatAvisoPublicoAlvo,
  getCategoriaAvisoConfig,
  filterAvisosParaSindica,
  calcAvisosStats
} from './aviso-helpers';
import type { AvisoData } from './firestore';

describe('aviso-helpers', () => {
  const mockAvisos: AvisoData[] = [
    {
      id: '1',
      condominioId: 'condo1',
      titulo: 'Manutenção da Piscina',
      mensagem: 'Fechada na segunda',
      destinatarioTipo: 'todos',
      criadoPorNome: 'Síndica',
      criadoPorUid: 'sind1',
    },
    {
      id: '2',
      condominioId: 'condo1',
      titulo: 'Pintura do Bloco A',
      mensagem: 'Início às 8h',
      destinatarioTipo: 'bloco',
      blocoDestino: 'Bloco A',
      criadoPorNome: 'Síndica',
      criadoPorUid: 'sind1',
    },
    {
      id: '3',
      condominioId: 'condo1',
      titulo: 'Elevador do Bloco B',
      mensagem: 'Revisão das 14h às 16h',
      destinatarioTipo: 'bloco',
      blocoDestino: 'Bloco B',
      criadoPorNome: 'Síndica',
      criadoPorUid: 'sind1',
    },
  ];

  describe('filterAvisosParaMorador', () => {
    it('deve retornar comunicados gerais para qualquer morador', () => {
      const res = filterAvisosParaMorador(mockAvisos, 'Bloco C');
      expect(res).toHaveLength(1);
      expect(res[0].id).toBe('1');
    });

    it('deve incluir avisos específicos do bloco do morador', () => {
      const resA = filterAvisosParaMorador(mockAvisos, 'Bloco A');
      expect(resA).toHaveLength(2);
      expect(resA.map((a) => a.id)).toEqual(['1', '2']);

      const resB = filterAvisosParaMorador(mockAvisos, 'Bloco B');
      expect(resB).toHaveLength(2);
      expect(resB.map((a) => a.id)).toEqual(['1', '3']);
    });

    it('deve fazer correspondência case-insensitive e com espaços no bloco', () => {
      const res = filterAvisosParaMorador(mockAvisos, '  bloco a  ');
      expect(res).toHaveLength(2);
      expect(res.map((a) => a.id)).toEqual(['1', '2']);
    });

    it('deve retornar apenas comunicados gerais se o morador não tiver bloco informado', () => {
      const res = filterAvisosParaMorador(mockAvisos, '');
      expect(res).toHaveLength(1);
      expect(res[0].id).toBe('1');
    });

    it('deve retornar array vazio se não houver comunicados', () => {
      expect(filterAvisosParaMorador([], 'Bloco A')).toEqual([]);
      expect(filterAvisosParaMorador(undefined as any, 'Bloco A')).toEqual([]);
    });
  });

  describe('formatAvisoPublicoAlvo', () => {
    it('deve retornar formato geral quando destinatarioTipo for todos', () => {
      expect(formatAvisoPublicoAlvo('todos')).toBe('Geral - Todos os Blocos');
      expect(formatAvisoPublicoAlvo('todos', 'Bloco A')).toBe('Geral - Todos os Blocos');
    });

    it('deve retornar nome do bloco quando destinatarioTipo for bloco', () => {
      expect(formatAvisoPublicoAlvo('bloco', 'Bloco B')).toBe('Exclusivo para Bloco B');
    });

    it('deve retornar fallback geral se destinatarioTipo for bloco mas o nome estiver vazio', () => {
      expect(formatAvisoPublicoAlvo('bloco', '')).toBe('Geral - Todos os Blocos');
      expect(formatAvisoPublicoAlvo('bloco', undefined)).toBe('Geral - Todos os Blocos');
    });
  });

  describe('getCategoriaAvisoConfig', () => {
    it('deve retornar configuração correta para cada categoria', () => {
      expect(getCategoriaAvisoConfig('Manutenção').label).toBe('Manutenção');
      expect(getCategoriaAvisoConfig('Assembleia').label).toBe('Assembleia');
      expect(getCategoriaAvisoConfig('Segurança').label).toBe('Segurança');
      expect(getCategoriaAvisoConfig('Convivência').label).toBe('Convivência');
      expect(getCategoriaAvisoConfig('Geral').label).toBe('Geral');
      expect(getCategoriaAvisoConfig(undefined).label).toBe('Geral');
    });
  });

  describe('filterAvisosParaSindica', () => {
    const listaSindica: AvisoData[] = [
      {
        id: '1',
        condominioId: 'c1',
        titulo: 'Manutenção Hidráulica',
        mensagem: 'Fechamento do registro geral',
        categoria: 'Manutenção',
        destinatarioTipo: 'todos',
        criadoPorNome: 'Síndica',
        criadoPorUid: 's1',
      },
      {
        id: '2',
        condominioId: 'c1',
        titulo: 'Reunião de Assembleia Extraordinária',
        mensagem: 'Eleição de subsíndico',
        categoria: 'Assembleia',
        destinatarioTipo: 'todos',
        criadoPorNome: 'Síndica',
        criadoPorUid: 's1',
      },
      {
        id: '3',
        condominioId: 'c1',
        titulo: 'Limpeza de Caixas de Gordura',
        mensagem: 'Acesso aos apartamentos térreos do Bloco A',
        categoria: 'Manutenção',
        destinatarioTipo: 'bloco',
        blocoDestino: 'Bloco A',
        criadoPorNome: 'Síndica',
        criadoPorUid: 's1',
      },
    ];

    it('deve retornar todos os comunicados sem filtros', () => {
      expect(filterAvisosParaSindica(listaSindica)).toHaveLength(3);
    });

    it('deve filtrar por busca de texto no título e mensagem', () => {
      expect(filterAvisosParaSindica(listaSindica, 'hidráulica')).toHaveLength(1);
      expect(filterAvisosParaSindica(listaSindica, 'subsíndico')).toHaveLength(1);
      expect(filterAvisosParaSindica(listaSindica, 'bloco a')).toHaveLength(1);
      expect(filterAvisosParaSindica(listaSindica, 'termo_inexistente')).toHaveLength(0);
    });

    it('deve filtrar por categoria', () => {
      expect(filterAvisosParaSindica(listaSindica, '', 'Manutenção')).toHaveLength(2);
      expect(filterAvisosParaSindica(listaSindica, '', 'Assembleia')).toHaveLength(1);
      expect(filterAvisosParaSindica(listaSindica, '', 'Segurança')).toHaveLength(0);
    });

    it('deve filtrar por destinatário (todos vs bloco)', () => {
      expect(filterAvisosParaSindica(listaSindica, '', 'all', 'todos')).toHaveLength(2);
      expect(filterAvisosParaSindica(listaSindica, '', 'all', 'bloco')).toHaveLength(1);
    });

    it('deve lidar com arrays vazios', () => {
      expect(filterAvisosParaSindica([])).toEqual([]);
    });
  });

  describe('calcAvisosStats', () => {
    it('deve contabilizar corretamente totais, gerais e por bloco', () => {
      const stats = calcAvisosStats([
        { id: '1', condominioId: 'c1', titulo: 'T1', mensagem: 'M1', destinatarioTipo: 'todos', criadoPorNome: '', criadoPorUid: '' },
        { id: '2', condominioId: 'c1', titulo: 'T2', mensagem: 'M2', destinatarioTipo: 'bloco', blocoDestino: 'B1', criadoPorNome: '', criadoPorUid: '' },
        { id: '3', condominioId: 'c1', titulo: 'T3', mensagem: 'M3', destinatarioTipo: 'bloco', blocoDestino: 'B2', criadoPorNome: '', criadoPorUid: '' },
      ]);

      expect(stats.total).toBe(3);
      expect(stats.gerais).toBe(1);
      expect(stats.blocos).toBe(2);
    });

    it('deve retornar zeros para array vazio', () => {
      expect(calcAvisosStats([])).toEqual({ total: 0, gerais: 0, blocos: 0 });
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  filterAvisosParaMorador,
  formatAvisoPublicoAlvo,
  getCategoriaAvisoConfig
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
});

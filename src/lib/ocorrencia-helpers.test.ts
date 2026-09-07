/* eslint-disable @typescript-eslint/no-explicit-any */ // FIXME: D�vida t�cnica (Quarentena)
import { describe, it, expect } from 'vitest';
import {
  canCloseOcorrencia,
  canReopenOcorrencia,
  isOcorrenciaFechada,
  criarItemHistorico,
  getStatusConfig,
  getResponsavelConfig,
  filterOcorrencias,
} from './ocorrencia-helpers';

describe('canCloseOcorrencia', () => {
  it('deve permitir fechamento para síndica e superadmin', () => {
    expect(canCloseOcorrencia('sindica')).toBe(true);
    expect(canCloseOcorrencia('SINDICA')).toBe(true);
    expect(canCloseOcorrencia('superadmin')).toBe(true);
  });

  it('não deve permitir fechamento para morador, zelador, portaria ou nulo', () => {
    expect(canCloseOcorrencia('morador')).toBe(false);
    expect(canCloseOcorrencia('zelador')).toBe(false);
    expect(canCloseOcorrencia('portaria')).toBe(false);
    expect(canCloseOcorrencia(null)).toBe(false);
    expect(canCloseOcorrencia(undefined)).toBe(false);
  });
});

describe('canReopenOcorrencia', () => {
  it('deve permitir reabertura exclusivamente para síndica e superadmin', () => {
    expect(canReopenOcorrencia('sindica')).toBe(true);
    expect(canReopenOcorrencia('SINDICA')).toBe(true);
    expect(canReopenOcorrencia('superadmin')).toBe(true);
  });

  it('não deve permitir reabertura para morador, zelador, portaria ou nulo', () => {
    expect(canReopenOcorrencia('morador')).toBe(false);
    expect(canReopenOcorrencia('zelador')).toBe(false);
    expect(canReopenOcorrencia('portaria')).toBe(false);
    expect(canReopenOcorrencia(null)).toBe(false);
    expect(canReopenOcorrencia(undefined)).toBe(false);
  });
});

describe('isOcorrenciaFechada', () => {
  it('deve retornar true apenas quando status for Resolvido', () => {
    expect(isOcorrenciaFechada('Resolvido')).toBe(true);
    expect(isOcorrenciaFechada('Pendente')).toBe(false);
    expect(isOcorrenciaFechada('Em Atendimento')).toBe(false);
    expect(isOcorrenciaFechada('Aguardando Validação da Síndica')).toBe(false);
    expect(isOcorrenciaFechada(null)).toBe(false);
  });
});

describe('criarItemHistorico', () => {
  it('deve gerar item estruturado com id, data e autor', () => {
    const item = criarItemHistorico({
      autorNome: 'Maria Síndica',
      autorPapel: 'Síndica',
      mensagem: 'Encaminhado para a zeladoria averiguar o registro.',
      responsavelNovo: 'Zeladoria',
      statusNovo: 'Em Atendimento',
      tipo: 'despacho',
    });

    expect(item.id).toBeDefined();
    expect(item.data).toBeDefined();
    expect(item.autorNome).toBe('Maria Síndica');
    expect(item.autorPapel).toBe('Síndica');
    expect(item.mensagem).toBe('Encaminhado para a zeladoria averiguar o registro.');
    expect(item.responsavelNovo).toBe('Zeladoria');
    expect(item.statusNovo).toBe('Em Atendimento');
  });

  it('deve aparar espaços vazios da mensagem', () => {
    const item = criarItemHistorico({
      autorNome: 'Zelador',
      autorPapel: 'Zeladoria',
      mensagem: '  Serviço efetuado no telhado.  ',
    });
    expect(item.mensagem).toBe('Serviço efetuado no telhado.');
  });
});

describe('getStatusConfig', () => {
  it('deve retornar estilo correto para cada status', () => {
    expect(getStatusConfig('Resolvido').label).toBe('Resolvido');
    expect(getStatusConfig('Resolvido').textClass).toContain('text-emerald-700');

    expect(getStatusConfig('Aguardando Validação da Síndica').label).toBe('Aguardando Validação');
    expect(getStatusConfig('Aguardando Validação da Síndica').textClass).toContain('text-purple-700');

    expect(getStatusConfig('Em Atendimento').label).toBe('Em Atendimento');
    expect(getStatusConfig('Pendente').label).toBe('Pendente');
  });
});

describe('getResponsavelConfig', () => {
  it('deve retornar estilo correto para cada responsável', () => {
    expect(getResponsavelConfig('Zeladoria').label).toBe('Zeladoria');
    expect(getResponsavelConfig('Portaria').label).toBe('Portaria');
    expect(getResponsavelConfig('Síndica').label).toBe('Síndica / Adm');
  });
});

describe('filterOcorrencias', () => {
  const ocorrencias = [
    {
      id: 'oc1',
      titulo: 'Vazamento no banheiro',
      descricao: 'Goteira vindo do teto',
      categoria: 'Manutenção',
      status: 'Pendente',
      responsavelAtual: 'Síndica',
      unidadeNome: 'Apto 101',
      autorNome: 'Carlos',
    },
    {
      id: 'oc2',
      titulo: 'Barulho de salto alto',
      descricao: 'Após as 22h',
      categoria: 'Barulho',
      status: 'Em Atendimento',
      responsavelAtual: 'Portaria',
      unidadeNome: 'Apto 202',
      autorNome: 'Ana',
    },
    {
      id: 'oc3',
      titulo: 'Portão da garagem travando',
      descricao: 'Motor não responde',
      categoria: 'Manutenção',
      status: 'Aguardando Validação da Síndica',
      responsavelAtual: 'Zeladoria',
      unidadeNome: 'Geral',
      autorNome: 'Marcos',
    },
  ];

  it('deve filtrar por termo de busca em múltiplos campos', () => {
    expect(filterOcorrencias(ocorrencias, 'vazamento')).toHaveLength(1);
    expect(filterOcorrencias(ocorrencias, '202')).toHaveLength(1);
    expect(filterOcorrencias(ocorrencias, 'Manutenção')).toHaveLength(2);
  });

  it('deve filtrar por status', () => {
    expect(filterOcorrencias(ocorrencias, '', 'Em Atendimento')).toHaveLength(1);
    expect(filterOcorrencias(ocorrencias, '', 'Pendente')).toHaveLength(1);
  });

  it('deve filtrar por responsável', () => {
    expect(filterOcorrencias(ocorrencias, '', 'all', 'Zeladoria')).toHaveLength(1);
    expect(filterOcorrencias(ocorrencias, '', 'all', 'Portaria')).toHaveLength(1);
  });

  it('deve retornar array vazio se a lista for inválida', () => {
    expect(filterOcorrencias(null as any)).toEqual([]);
  });
});

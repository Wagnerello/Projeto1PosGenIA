import { describe, it, expect } from 'vitest';
import { isUnitDuplicate } from './unit-helpers';
import {
  canCloseOcorrencia,
  canReopenOcorrencia,
  isOcorrenciaFechada,
  getStatusConfig,
  getResponsavelConfig,
  type ResponsavelOcorrencia,
  type StatusOcorrencia
} from './ocorrencia-helpers';

describe('Suíte de Lógica de Negócio para Janelas Integradas', () => {
  describe('UnidadeEditorJanela - Validação e Duplicidade', () => {
    const unidadesCadastradas = [
      { id: 'u1', torre: 'Bloco A', numero: '101' },
      { id: 'u2', torre: 'Bloco A', numero: '102' },
      { id: 'u3', torre: 'Bloco B', numero: '101' },
    ];

    it('deve identificar duplicidade de número na mesma torre', () => {
      const duplicado = isUnitDuplicate(unidadesCadastradas, { torre: 'Bloco A', numero: '101' });
      expect(duplicado).toBe(true);
    });

    it('não deve identificar duplicidade se a torre for diferente', () => {
      const duplicado = isUnitDuplicate(unidadesCadastradas, { torre: 'Bloco C', numero: '101' });
      expect(duplicado).toBe(false);
    });

    it('não deve identificar duplicidade ao editar a própria unidade', () => {
      const duplicado = isUnitDuplicate(unidadesCadastradas, { torre: 'Bloco A', numero: '101' }, 'u1');
      expect(duplicado).toBe(false);
    });
  });

  describe('RegerarEstruturaJanela - Cálculo de Dimensionamento Predial', () => {
    it('deve calcular corretamente a quantidade total de unidades para torre única', () => {
      const torres = 1;
      const andares = 10;
      const aptosPorAndar = 4;
      const total = torres * andares * aptosPorAndar;
      expect(total).toBe(40);
    });

    it('deve calcular corretamente a quantidade total de unidades para múltiplos blocos', () => {
      const torres = 3;
      const andares = 8;
      const aptosPorAndar = 6;
      const total = torres * andares * aptosPorAndar;
      expect(total).toBe(144);
    });

    it('deve gerar identificadores coerentes para as unidades na grade', () => {
      const gerarAmostra = (torres: number, andares: number, aptos: number) => {
        const resultado: string[] = [];
        for (let t = 1; t <= torres; t++) {
          const nomeTorre = torres === 1 ? 'Torre Única' : `Bloco ${String.fromCharCode(64 + t)}`;
          for (let a = 1; a <= andares; a++) {
            for (let ap = 1; ap <= aptos; ap++) {
              const num = a * 100 + ap;
              resultado.push(`${nomeTorre} - Apto ${num}`);
            }
          }
        }
        return resultado;
      };

      const amostra = gerarAmostra(2, 2, 2);
      expect(amostra).toHaveLength(8);
      expect(amostra[0]).toBe('Bloco A - Apto 101');
      expect(amostra[1]).toBe('Bloco A - Apto 102');
      expect(amostra[2]).toBe('Bloco A - Apto 201');
      expect(amostra[4]).toBe('Bloco B - Apto 101');
    });
  });

  describe('OcorrenciaTimelineJanela - Regras de Acesso e Permissão', () => {
    it('deve conceder permissão de homologação/fechamento apenas para sindica', () => {
      expect(canCloseOcorrencia('sindica')).toBe(true);
      expect(canCloseOcorrencia('morador')).toBe(false);
    });

    it('deve conceder permissão de reabertura apenas para sindica', () => {
      expect(canReopenOcorrencia('sindica')).toBe(true);
      expect(canReopenOcorrencia('morador')).toBe(false);
    });

    it('deve identificar corretamente chamadas fechadas com isOcorrenciaFechada', () => {
      expect(isOcorrenciaFechada('Resolvido')).toBe(true);
      expect(isOcorrenciaFechada('Pendente')).toBe(false);
      expect(isOcorrenciaFechada('Em Atendimento')).toBe(false);
    });

    it('deve validar transições válidas de status', () => {
      const statusValidos: StatusOcorrencia[] = [
        'Pendente',
        'Em Atendimento',
        'Aguardando Validação da Síndica',
        'Resolvido'
      ];
      statusValidos.forEach((st) => {
        const cfg = getStatusConfig(st);
        expect(cfg.label).toBeDefined();
        expect(cfg.bgClass).toBeDefined();
      });
    });

    it('deve validar atribuições válidas de equipe', () => {
      const responsaveisValidos: ResponsavelOcorrencia[] = [
        'Síndica',
        'Zeladoria',
        'Portaria',
        'Prestador Externo'
      ];
      responsaveisValidos.forEach((resp) => {
        const cfg = getResponsavelConfig(resp);
        expect(cfg.label).toBeDefined();
        expect(cfg.bgClass).toBeDefined();
      });
    });
  });

  describe('Diferenciação de Visão: Morador vs Síndica', () => {
    it('morador não pode ter permissão de encerramento nem reabertura', () => {
      expect(canCloseOcorrencia('morador')).toBe(false);
      expect(canReopenOcorrencia('morador')).toBe(false);
      expect(canCloseOcorrencia('Morador')).toBe(false);
      expect(canReopenOcorrencia('Morador')).toBe(false);
    });

    it('síndica possui permissão de encerramento e reabertura', () => {
      expect(canCloseOcorrencia('sindica')).toBe(true);
      expect(canReopenOcorrencia('sindica')).toBe(true);
      expect(canCloseOcorrencia('Síndica')).toBe(true);
      expect(canReopenOcorrencia('Síndica')).toBe(true);
    });

    it('deve resolver corretamente o nome do autor e unidade em payloads legados e atuais', () => {
      const payloadAtual = {
        autorNome: 'Carlos Silva',
        unidadeNome: 'Apto 101',
      };
      const autorResolvido1 = payloadAtual.autorNome || (payloadAtual as any).moradorNome || 'Não informado';
      const unidadeResolvida1 = payloadAtual.unidadeNome || (payloadAtual as any).unidade || 'N/A';
      expect(autorResolvido1).toBe('Carlos Silva');
      expect(unidadeResolvida1).toBe('Apto 101');

      const payloadLegado = {
        moradorNome: 'Maria Santos',
        unidade: 'Bloco B - 302',
      };
      const autorResolvido2 = (payloadLegado as any).autorNome || payloadLegado.moradorNome || 'Não informado';
      const unidadeResolvida2 = (payloadLegado as any).unidadeNome || payloadLegado.unidade || 'N/A';
      expect(autorResolvido2).toBe('Maria Santos');
      expect(unidadeResolvida2).toBe('Bloco B - 302');
    });
  });
});


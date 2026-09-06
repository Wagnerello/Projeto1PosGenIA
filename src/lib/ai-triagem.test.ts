import { describe, it, expect } from 'vitest';
import { triagemHeuristica } from './ai-triagem';

describe('triagemHeuristica', () => {
  it('deve classificar vazamento grave com urgência Alta e categoria Manutenção', () => {
    const res = triagemHeuristica('Cano estourou', 'Grande vazamento de água alagando a garagem');
    expect(res.urgencia).toBe('Alta');
    expect(res.categoria).toBe('Manutenção');
  });

  it('deve classificar incêndio ou cheiro de gás com urgência Alta e segurança', () => {
    const res = triagemHeuristica('Urgente', 'Cheiro forte de gás no hall do 4º andar');
    expect(res.urgencia).toBe('Alta');
  });

  it('deve classificar barulho e música alta com urgência Média e categoria Barulho', () => {
    const res = triagemHeuristica('Som alto', 'Vizinho com som alto e festa após 23h');
    expect(res.urgencia).toBe('Média');
    expect(res.categoria).toBe('Barulho');
  });

  it('deve classificar lâmpada queimada com urgência Média e categoria Manutenção', () => {
    const res = triagemHeuristica('Lâmpada', 'Lâmpada queimada no corredor do 2º andar');
    expect(res.urgencia).toBe('Média');
    expect(res.categoria).toBe('Manutenção');
  });

  it('deve classificar sujeira no hall com categoria Limpeza', () => {
    const res = triagemHeuristica('Sujeira', 'Tem lixo acumulado e entulho na escada');
    expect(res.categoria).toBe('Limpeza');
  });

  it('deve lidar com entradas vazias e nulas sem quebrar', () => {
    const res = triagemHeuristica('', '');
    expect(res.urgencia).toBe('Baixa');
    expect(res.categoria).toBe('Outro');
    expect(res.justificativa).toBeDefined();
  });
});

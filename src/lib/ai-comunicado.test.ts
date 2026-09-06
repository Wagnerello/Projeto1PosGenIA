import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  refinarComunicadoHeuristico,
  refinarComunicadoComIA,
  corrigirEReestruturarTexto,
  TOMS_CONFIG,
  type TomComunicado,
} from './ai-comunicado';

describe('ai-comunicado', () => {
  describe('corrigirEReestruturarTexto', () => {
    it('deve corrigir termos informais, gírias e erros gramaticais frequentes', () => {
      const texto = 'vai te manutensao no bloco a amanha e agua vai falta';
      const corrigido = corrigirEReestruturarTexto(texto);
      expect(corrigido).toContain('Haverá');
      expect(corrigido).toContain('manutenção');
      expect(corrigido).toContain('Bloco A');
      expect(corrigido).toContain('água');
      expect(corrigido.endsWith('.')).toBe(true);
    });

    it('deve corrigir num pode e ta quebrado', () => {
      const texto = 'não pode lixo aqui porque portao ta quebrado';
      const corrigido = corrigirEReestruturarTexto(texto);
      expect(corrigido.toLowerCase()).toContain('não é permitido');
      expect(corrigido).toContain('portão');
      expect(corrigido).toContain('fora de funcionamento');
    });

    it('deve retornar texto padrão seguro se a entrada for vazia', () => {
      const corrigido = corrigirEReestruturarTexto('');
      expect(corrigido).toContain('Informamos');
    });
  });
  describe('TOMS_CONFIG', () => {
    it('deve possuir as 5 opções de tom configuradas', () => {
      const tons: TomComunicado[] = ['formal', 'educativo', 'firme', 'direto', 'acolhedor'];
      tons.forEach((t) => {
        expect(TOMS_CONFIG[t]).toBeDefined();
        expect(TOMS_CONFIG[t].label).toBeTruthy();
        expect(TOMS_CONFIG[t].descricao).toBeTruthy();
      });
    });
  });

  describe('refinarComunicadoHeuristico (Fallback Determinístico)', () => {
    it('deve formatar comunicado no tom formal', () => {
      const resultado = refinarComunicadoHeuristico({
        titulo: 'Interrupção de água',
        categoria: 'Manutenção',
        mensagem: 'Amanhã das 14h às 17h para troca de válvula.',
        tom: 'formal',
      });

      expect(resultado.geradoPorIA).toBe(false);
      expect(resultado.tituloSugerido).toContain('COMUNICADO OFICIAL');
      expect(resultado.mensagemSugerida).toContain('Prezados Condôminos');
      expect(resultado.mensagemSugerida).toContain('Convenção Condominial');
      expect(resultado.justificativaTom).toContain('institucional');
    });

    it('deve formatar comunicado no tom educativo', () => {
      const resultado = refinarComunicadoHeuristico({
        titulo: 'Barulho após as 22h',
        categoria: 'Convivência',
        mensagem: 'Muitas reclamações de som alto no bloco A.',
        tom: 'educativo',
      });

      expect(resultado.tituloSugerido).toContain('Convivência & Harmonia');
      expect(resultado.mensagemSugerida).toContain('Olá, vizinhos!');
      expect(resultado.mensagemSugerida).toContain('bem-estar coletivo');
      expect(resultado.justificativaTom).toContain('conscientização');
    });

    it('deve formatar comunicado no tom firme', () => {
      const resultado = refinarComunicadoHeuristico({
        titulo: 'Lixo no corredor',
        categoria: 'Convivência',
        mensagem: 'Deixar sacos de lixo nas portas é proibido.',
        tom: 'firme',
      });

      expect(resultado.tituloSugerido).toContain('AVISO IMPORTANTE');
      expect(resultado.mensagemSugerida).toContain('Regulamento Interno');
      expect(resultado.mensagemSugerida).toContain('penalidades');
      expect(resultado.justificativaTom).toContain('assertivo');
    });

    it('deve formatar comunicado no tom direto', () => {
      const resultado = refinarComunicadoHeuristico({
        titulo: 'Limpeza de caixas de água',
        categoria: 'Manutenção',
        mensagem: 'Quarta-feira todo o dia.',
        tom: 'direto',
      });

      expect(resultado.tituloSugerido).toContain('[Aviso Rápido]');
      expect(resultado.mensagemSugerida).toContain('• Categoria: Manutenção');
      expect(resultado.mensagemSugerida).toContain('Limpeza de caixas de água');
      expect(resultado.justificativaTom).toContain('leitura rápida');
    });

    it('deve formatar comunicado no tom acolhedor', () => {
      const resultado = refinarComunicadoHeuristico({
        titulo: 'Festa da Primavera',
        categoria: 'Geral',
        mensagem: 'Convidamos todos no salão no próximo sábado.',
        tom: 'acolhedor',
      });

      expect(resultado.tituloSugerido).toContain('Mensagem à Comunidade');
      expect(resultado.mensagemSugerida).toContain('Queridos vizinhos');
      expect(resultado.justificativaTom).toContain('calorosa');
    });

    it('deve lidar com campos vazios sem lançar exceção', () => {
      const resultado = refinarComunicadoHeuristico({
        titulo: '',
        categoria: 'Geral',
        mensagem: '',
        tom: 'formal',
      });

      expect(resultado.tituloSugerido).toBeTruthy();
      expect(resultado.mensagemSugerida).toBeTruthy();
      expect(resultado.justificativaTom).toBeTruthy();
    });
  });

  describe('refinarComunicadoComIA', () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
      vi.restoreAllMocks();
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('deve usar retorno da IA quando a API responder com sucesso', async () => {
      // Mock de fetch retornando resposta JSON simulando Groq
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  tituloSugerido: 'Manutenção Preventiva dos Elevadores da Torre A',
                  mensagemSugerida: 'Prezados moradores da Torre A, informamos que...',
                  justificativaTom: 'Texto calibrado com clareza e formalidade.',
                }),
              },
            },
          ],
        }),
      } as any);

      // Injeta temporariamente a chave no env
      const originalKey = import.meta.env.VITE_GROQ_API_KEY;
      (import.meta.env as any).VITE_GROQ_API_KEY = 'gsk_valid_mock_key_123';

      const res = await refinarComunicadoComIA({
        titulo: 'Elevador torre A',
        categoria: 'Manutenção',
        mensagem: 'Elevador vai parar amanha',
        tom: 'formal',
      });

      expect(res.geradoPorIA).toBe(true);
      expect(res.tituloSugerido).toBe('Manutenção Preventiva dos Elevadores da Torre A');
      expect(res.mensagemSugerida).toContain('Prezados moradores');

      (import.meta.env as any).VITE_GROQ_API_KEY = originalKey;
    });

    it('deve acionar fallback determinístico caso a API retorne erro HTTP e não haja Gemini', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      } as any);

      const originalKey = import.meta.env.VITE_GROQ_API_KEY;
      const originalGemini = import.meta.env.VITE_GEMINI_API_KEY;
      (import.meta.env as any).VITE_GROQ_API_KEY = 'gsk_valid_mock_key_123';
      (import.meta.env as any).VITE_GEMINI_API_KEY = undefined;

      const res = await refinarComunicadoComIA({
        titulo: 'Reunião de condomínio',
        categoria: 'Assembleia',
        mensagem: 'Apareçam na quadra sexta às 19h',
        tom: 'formal',
      });

      expect(res.geradoPorIA).toBe(false);
      expect(res.tituloSugerido).toContain('COMUNICADO OFICIAL');

      (import.meta.env as any).VITE_GROQ_API_KEY = originalKey;
      (import.meta.env as any).VITE_GEMINI_API_KEY = originalGemini;
    });

    it('deve usar Gemini prioritariamente quando configurado', async () => {
      let chamouGemini = false;
      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('generativelanguage.googleapis.com')) {
          chamouGemini = true;
          return {
            ok: true,
            json: async () => ({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: JSON.stringify({
                          tituloSugerido: 'Convocação para Assembleia Extraordinária',
                          mensagemSugerida: 'Prezados condôminos, convocamos a todos para a assembleia extraordinária...',
                          justificativaTom: 'Ajustado com tom formal via Gemini.',
                        }),
                      },
                    ],
                  },
                },
              ],
            }),
          };
        }
        return { ok: false, status: 500 };
      });

      const originalKey = import.meta.env.VITE_GROQ_API_KEY;
      const originalGemini = import.meta.env.VITE_GEMINI_API_KEY;
      (import.meta.env as any).VITE_GROQ_API_KEY = 'gsk_valid_mock_key_123';
      (import.meta.env as any).VITE_GEMINI_API_KEY = 'AIzaSy_fake_gemini_key';

      const res = await refinarComunicadoComIA({
        titulo: 'Reunião condomínio',
        categoria: 'Assembleia',
        mensagem: 'Compareçam na sexta às 19h',
        tom: 'formal',
      });

      expect(res.geradoPorIA).toBe(true);
      expect(res.tituloSugerido).toBe('Convocação para Assembleia Extraordinária');
      expect(res.mensagemSugerida).toContain('Prezados condôminos');
      expect(chamouGemini).toBe(true);

      (import.meta.env as any).VITE_GROQ_API_KEY = originalKey;
      (import.meta.env as any).VITE_GEMINI_API_KEY = originalGemini;
    });

    it('deve fazer fallback para a Groq caso o Gemini falhe com 503', async () => {
      let chamouGroq = false;
      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('generativelanguage.googleapis.com')) {
          return { ok: false, status: 503 };
        }
        if (url.includes('groq.com')) {
          chamouGroq = true;
          return {
            ok: true,
            json: async () => ({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      tituloSugerido: 'Aviso da Administração: Limpeza da Caixa',
                      mensagemSugerida: 'Prezados moradores, informamos que haverá limpeza...',
                      justificativaTom: 'Ajustado via Groq.',
                    }),
                  },
                },
              ],
            }),
          };
        }
        return { ok: false, status: 500 };
      });

      const originalKey = import.meta.env.VITE_GROQ_API_KEY;
      const originalGemini = import.meta.env.VITE_GEMINI_API_KEY;
      (import.meta.env as any).VITE_GROQ_API_KEY = 'gsk_valid_mock_key_123';
      (import.meta.env as any).VITE_GEMINI_API_KEY = 'AIzaSy_fake_gemini_key';

      const res = await refinarComunicadoComIA({
        titulo: 'Limpeza de caixa',
        categoria: 'Manutenção',
        mensagem: 'Amanhã de manhã',
        tom: 'formal',
      });

      expect(res.geradoPorIA).toBe(true);
      expect(res.tituloSugerido).toBe('Aviso da Administração: Limpeza da Caixa');
      expect(chamouGroq).toBe(true);

      (import.meta.env as any).VITE_GROQ_API_KEY = originalKey;
      (import.meta.env as any).VITE_GEMINI_API_KEY = originalGemini;
    });
  });
});

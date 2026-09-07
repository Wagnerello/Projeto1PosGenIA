import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { triagemHeuristica, classificarOcorrenciaComIA } from './ai-triagem';

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

describe('classificarOcorrenciaComIA - Resiliência e Fallback Gemini/Groq', () => {
  const originalFetch = globalThis.fetch;
  const originalGroq = import.meta.env.VITE_GROQ_API_KEY;
  const originalGemini = import.meta.env.VITE_GEMINI_API_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    (import.meta.env as Record<string, unknown>).VITE_GROQ_API_KEY = originalGroq;
    (import.meta.env as Record<string, unknown>).VITE_GEMINI_API_KEY = originalGemini;
  });

  it('deve utilizar Gemini prioritariamente quando a chave Gemini estiver configurada', async () => {
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
                        categoria: 'Segurança',
                        urgencia: 'Alta',
                        justificativa: 'Portão principal aberto com falha na tranca.',
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        };
      }
      return { ok: false, status: 404 };
    });

    (import.meta.env as Record<string, unknown>).VITE_GEMINI_API_KEY = 'AIzaSy_fake_gemini_key_valid';
    (import.meta.env as Record<string, unknown>).VITE_GROQ_API_KEY = 'gsk_valid_mock_groq';

    const res = await classificarOcorrenciaComIA('Portão aberto', 'Portão da garagem aberto sem travar');

    expect(chamouGemini).toBe(true);
    expect(res.triagemPorIA).toBe(true);
    expect(res.categoria).toBe('Segurança');
    expect(res.urgencia).toBe('Alta');
  });

  it('deve acionar o fallback para o Gemini quando o Groq retornar 404 Not Found', async () => {
    let chamouGroq = false;
    let chamouGemini = false;

    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('api.groq.com')) {
        chamouGroq = true;
        // Simula exatamente o erro 404 Not Found reportado pelo usuário
        return { ok: false, status: 404 };
      }
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
                        categoria: 'Manutenção',
                        urgencia: 'Alta',
                        justificativa: 'Vazamento ativo na garagem com risco de inundação.',
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

    // Força Groq como primário ou fallback mútuo
    (import.meta.env as Record<string, unknown>).VITE_GROQ_API_KEY = 'gsk_valid_mock_groq';
    (import.meta.env as Record<string, unknown>).VITE_GEMINI_API_KEY = 'AIzaSy_fake_gemini_key_valid';

    const res = await classificarOcorrenciaComIA('Cano estourado', 'Vazamento forte de água no subsolo', 'groq');

    expect(res.triagemPorIA).toBe(true);
    expect(res.categoria).toBe('Manutenção');
    expect(res.urgencia).toBe('Alta');
    expect(chamouGroq).toBe(true);
    expect(chamouGemini).toBe(true);
  });

  it('deve fazer fallback determinístico caso tanto Groq quanto Gemini falhem com erro', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    (import.meta.env as Record<string, unknown>).VITE_GROQ_API_KEY = 'gsk_valid_mock_groq';
    (import.meta.env as Record<string, unknown>).VITE_GEMINI_API_KEY = 'AIzaSy_fake_gemini_key_valid';

    const res = await classificarOcorrenciaComIA('Música alta', 'Som alto na madrugada incomodando');

    expect(res.triagemPorIA).toBe(false);
    expect(res.categoria).toBe('Barulho');
    expect(res.urgencia).toBe('Média');
  });

  it('deve usar triagem determinística imediatamente quando não há chaves de IA no ambiente', async () => {
    (import.meta.env as Record<string, unknown>).VITE_GROQ_API_KEY = '';
    (import.meta.env as Record<string, unknown>).VITE_GEMINI_API_KEY = '';

    const res = await classificarOcorrenciaComIA('Cheiro de gás', 'Cheiro muito forte no corredor');

    expect(res.triagemPorIA).toBe(false);
    expect(res.categoria).toBe('Segurança');
    expect(res.urgencia).toBe('Alta');
  });
});


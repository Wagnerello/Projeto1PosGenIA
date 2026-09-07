/* eslint-disable complexity, max-statements */
export type TriagemResultado = {
  categoria: 'Manutenção' | 'Barulho' | 'Segurança' | 'Limpeza' | 'Convivência' | 'Outro';
  urgencia: 'Baixa' | 'Média' | 'Alta';
  justificativa: string;
  triagemPorIA: boolean;
};

/**
 * Classificação heurística determinística (usada como fallback de alta confiabilidade
 * caso a API do Groq esteja inacessível ou sem chave).
 */
export function triagemHeuristica(titulo: string = '', descricao: string = ''): TriagemResultado {
  const texto = `${titulo} ${descricao}`.toLowerCase();

  // 1. Detecção de Urgência Alta (Riscos estruturais, segurança, vazamentos, pânico)
  const palavrasAlta = [
    'vazamento', 'vazando água', 'inundação', 'alagamento', 'cano estourou',
    'fogo', 'fumaça', 'incêndio', 'curto-circuito', 'choque', 'faísca',
    'sem energia', 'sem luz geral', 'falta de água geral', 'gás', 'cheiro de gás',
    'preso no elevador', 'arrombamento', 'invasão', 'assalto', 'ladrão', 'roubo',
    'desabamento', 'rachadura', 'portão aberto', 'risco de queda'
  ];

  // 2. Detecção de Urgência Média (Incômodos pontuais, avarias comuns, barulho)
  const palavrasMedia = [
    'barulho', 'som alto', 'música alta', 'festa', 'gritos', 'latido', 'cachorro',
    'infiltração', 'goteira', 'portão quebrado', 'elevador quebrado', 'elevador parado',
    'interfone não funciona', 'lâmpada queimada', 'luz apagada', 'vaga ocupada',
    'carro na minha vaga', 'lixo fora do lugar', 'mau cheiro'
  ];

  let urgencia: 'Baixa' | 'Média' | 'Alta' = 'Baixa';
  let justificativa = 'Demanda rotineira para acompanhamento da administração.';

  if (palavrasAlta.some((p) => texto.includes(p))) {
    urgencia = 'Alta';
    justificativa = 'Identificado risco de dano patrimonial, falha estrutural ou urgência de segurança.';
  } else if (palavrasMedia.some((p) => texto.includes(p))) {
    urgencia = 'Média';
    justificativa = 'Incômodo operacional ou perturbação moderada que requer verificação.';
  }

  // 3. Detecção de Categoria
  let categoria: TriagemResultado['categoria'] = 'Outro';

  if (
    texto.includes('vazamento') ||
    texto.includes('cano') ||
    texto.includes('lâmpada') ||
    texto.includes('elevador') ||
    texto.includes('infiltração') ||
    texto.includes('elétrica') ||
    texto.includes('hidráulica') ||
    texto.includes('pintura') ||
    texto.includes('reparo') ||
    texto.includes('conserto') ||
    texto.includes('quebrado') ||
    texto.includes('curto-circuito')
  ) {
    categoria = 'Manutenção';
  } else if (
    texto.includes('segurança') ||
    texto.includes('invasão') ||
    texto.includes('câmera') ||
    texto.includes('estranho') ||
    texto.includes('arrombamento') ||
    texto.includes('tranca') ||
    texto.includes('assalto') ||
    texto.includes('ladrão') ||
    texto.includes('fogo') ||
    texto.includes('incêndio') ||
    texto.includes('gás')
  ) {
    categoria = 'Segurança';
  } else if (
    texto.includes('barulho') ||
    texto.includes('som') ||
    texto.includes('música') ||
    texto.includes('festa') ||
    texto.includes('grito') ||
    texto.includes('latido')
  ) {
    categoria = 'Barulho';
  } else if (
    texto.includes('lixo') ||
    texto.includes('limpeza') ||
    texto.includes('sujeira') ||
    texto.includes('vômito') ||
    texto.includes('mau cheiro') ||
    texto.includes('entulho')
  ) {
    categoria = 'Limpeza';
  } else if (
    texto.includes('vaga') ||
    texto.includes('garagem') ||
    texto.includes('vizinho') ||
    texto.includes('animais') ||
    texto.includes('área comum') ||
    texto.includes('salão de festas')
  ) {
    categoria = 'Convivência';
  }

  return {
    categoria,
    urgencia,
    justificativa,
    triagemPorIA: false,
  };
}

/**
 * Envia o chamado para inferência com o Groq (Llama 3),
 * retornando categoria e urgência calibradas.
 */
import { sanitizePromptInput } from './input-sanitizer';

const CATEGORIAS_VALIDAS = ['Manutenção', 'Barulho', 'Segurança', 'Limpeza', 'Convivência', 'Outro'] as const;
const URGENCIAS_VALIDAS = ['Baixa', 'Média', 'Alta'] as const;

const MODELOS_GEMINI_TRIAGEM = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
];

const MODELOS_GROQ_TRIAGEM = [
  'llama-3.3-70b-versatile',
];

const SYSTEM_INSTRUCTION_TRIAGEM = `Você é o motor de triagem inteligente de um condomínio residencial.
Analise o chamado do morador e retorne EXCLUSIVAMENTE um objeto JSON no formato:
{
  "categoria": "Manutenção" | "Barulho" | "Segurança" | "Limpeza" | "Convivência" | "Outro",
  "urgencia": "Baixa" | "Média" | "Alta",
  "justificativa": "frase curta e técnica de até 15 palavras explicando a prioridade para o síndico"
}
Regras de Urgência:
- "Alta": risco de vida, segurança, incêndio, choque elétrico, vazamento ativo de água, vazamento de gás, elevador travado com pessoa.
- "Média": barulho excessivo, elevador quebrado sem passageiro, infiltração pontual, lâmpada de área comum, portão falhando.
- "Baixa": dúvidas, sugestões, itens estéticos, reparos não urgentes.`;

function normalizarTriagemJSON(raw: unknown): TriagemResultado | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const categoria = CATEGORIAS_VALIDAS.includes(obj.categoria as (typeof CATEGORIAS_VALIDAS)[number])
    ? (obj.categoria as TriagemResultado['categoria'])
    : 'Outro';

  const urgencia = URGENCIAS_VALIDAS.includes(obj.urgencia as (typeof URGENCIAS_VALIDAS)[number])
    ? (obj.urgencia as TriagemResultado['urgencia'])
    : 'Média';

  const justificativa = typeof obj.justificativa === 'string' && obj.justificativa.trim().length > 0
    ? obj.justificativa.trim()
    : 'Classificado pelo motor de IA.';

  return {
    categoria,
    urgencia,
    justificativa,
    triagemPorIA: true,
  };
}

/**
 * Tenta classificar a ocorrência utilizando a API do Google Gemini.
 */
export async function classificarComGemini(
  cleanTitulo: string,
  cleanDescricao: string,
  apiKey: string
): Promise<TriagemResultado | null> {
  const prompt = `${SYSTEM_INSTRUCTION_TRIAGEM}\n\nChamado do morador:\nTítulo: ${cleanTitulo}\nDescrição: ${cleanDescricao}`;

  for (const modelo of MODELOS_GEMINI_TRIAGEM) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 200,
            responseMimeType: 'application/json',
          },
        }),
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const parsed = JSON.parse(rawText);
      const resultado = normalizarTriagemJSON(parsed);
      if (resultado) return resultado;
    } catch {
      clearTimeout(timeoutId);
      continue;
    }
  }

  return null;
}

/**
 * Tenta classificar a ocorrência utilizando a API do Groq.
 */
export async function classificarComGroq(
  cleanTitulo: string,
  cleanDescricao: string,
  apiKey: string
): Promise<TriagemResultado | null> {
  for (const modelo of MODELOS_GROQ_TRIAGEM) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: modelo,
          messages: [
            { role: 'system', content: SYSTEM_INSTRUCTION_TRIAGEM },
            { role: 'user', content: `Título: ${cleanTitulo}\nDescrição: ${cleanDescricao}` },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 150,
        }),
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) continue;

      const parsed = JSON.parse(content);
      const resultado = normalizarTriagemJSON(parsed);
      if (resultado) return resultado;
    } catch {
      clearTimeout(timeoutId);
      continue;
    }
  }

  return null;
}

/**
 * Envia o chamado para inferência de IA com esteira de resiliência ultra-rápida:
 * 1. Prioriza o provedor preferencial com timeout estrito;
 * 2. Faz fallback transparente para o provedor secundário;
 * 3. Trava máxima de 2.5 segundos: se a rede oscilar, recai instantaneamente no motor determinístico local (0ms).
 */
export async function classificarOcorrenciaComIA(
  titulo: string,
  descricao: string,
  provedorPreferencial?: 'gemini' | 'groq'
): Promise<TriagemResultado> {
  const cleanTitulo = sanitizePromptInput(titulo || '', 100).cleanText;
  const cleanDescricao = sanitizePromptInput(descricao || '', 500).cleanText;

  const rawGroqKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
  const rawGeminiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

  const apiKeyGroq = rawGroqKey && typeof rawGroqKey === 'string' && !rawGroqKey.startsWith('gsk_sua_chave')
    ? rawGroqKey.trim()
    : '';

  const apiKeyGemini = rawGeminiKey && typeof rawGeminiKey === 'string' && !rawGeminiKey.startsWith('AIza_sua_chave')
    ? rawGeminiKey.trim()
    : '';

  const temGemini = apiKeyGemini.length > 0;
  const temGroq = apiKeyGroq.length > 0;

  const tentarGemini = async () => (temGemini ? classificarComGemini(cleanTitulo, cleanDescricao, apiKeyGemini) : null);
  const tentarGroq = async () => (temGroq ? classificarComGroq(cleanTitulo, cleanDescricao, apiKeyGroq) : null);

  const primario = provedorPreferencial === 'groq'
    ? (temGroq ? tentarGroq : tentarGemini)
    : (temGemini ? tentarGemini : tentarGroq);

  const secundario = primario === tentarGemini ? tentarGroq : tentarGemini;

  const inferenciaIA = async (): Promise<TriagemResultado | null> => {
    try {
      const resPrimario = await primario();
      if (resPrimario) return resPrimario;
    } catch {
      // Segue para fallback secundário
    }

    try {
      const resSecundario = await secundario();
      if (resSecundario) return resSecundario;
    } catch {
      // Segue para fallback determinístico
    }

    return null;
  };

  // Trava rígida: nunca deixa a criação do chamado travar por mais de 2.5s se a rede falhar
  const timeoutPromise = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), 2500);
  });

  try {
    const res = await Promise.race([inferenciaIA(), timeoutPromise]);
    if (res) return res;
  } catch {
    // Silencia qualquer exceção e recorre à heurística local
  }

  return triagemHeuristica(titulo, descricao);
}


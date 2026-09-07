/* eslint-disable quality/max-lines, no-useless-escape, max-statements, complexity, quality/no-direct-console */ // FIXME: Dvida tcnica (Quarentena)
import { sanitizePromptInput } from './input-sanitizer';

export type TomComunicado = 'formal' | 'educativo' | 'firme' | 'direto' | 'acolhedor';

export type CategoriaComunicado = 'Geral' | 'Manutenção' | 'Assembleia' | 'Segurança' | 'Convivência';

export interface SugestaoComunicado {
  tituloSugerido: string;
  mensagemSugerida: string;
  justificativaTom: string;
  geradoPorIA: boolean;
  avisoOrigem?: string;
}

export interface RefinarComunicadoParams {
  titulo: string;
  categoria: CategoriaComunicado;
  mensagem: string;
  tom: TomComunicado;
}

export const TOMS_CONFIG: Record<TomComunicado, { label: string; badge: string; descricao: string }> = {
  formal: {
    label: 'Formal e Institucional',
    badge: 'Formal',
    descricao: 'Linguagem solene, fundamentada nas normas condominiais e comunicados oficiais.',
  },
  educativo: {
    label: 'Educativo e Construtivo',
    badge: 'Educativo',
    descricao: 'Conscientização coletiva, harmonia e respeito às regras de convivência.',
  },
  firme: {
    label: 'Firme e Enfático',
    badge: 'Firme',
    descricao: 'Linguagem assertiva para advertências, segurança e cumprimento do regimento.',
  },
  direto: {
    label: 'Direto e Objetivo',
    badge: 'Direto',
    descricao: 'Comunicação pontual e pragmática, ideal para prazos e manutenções rápidas.',
  },
  acolhedor: {
    label: 'Empático e Acolhedor',
    badge: 'Acolhedor',
    descricao: 'Tom humano e integrativo para comunicados sociais e boas-vindas.',
  },
};

/**
 * Corrige ortografia, concordância e vícios de escrita comuns em rascunhos informais de comunicados.
 */
export function corrigirEReestruturarTexto(textoBruto: string): string {
  if (!textoBruto || !textoBruto.trim()) {
    return 'Informamos as recentes orientações de interesse coletivo para todos os condôminos.';
  }

  let s = ' ' + textoBruto.trim() + ' ';

  // Correções ortográficas e concordância (expressões compostas antes de palavras isoladas)
  const substituicoes: [RegExp, string][] = [
    // Expressões e regência
    [/\bvai\s+te\b|\bvai\s+ter\b/gi, 'haverá'],
    [/\bvai\s+acontece\b|\bvai\s+acontecer\b/gi, 'ocorrerá'],
    [/\bvai\s+falta\b|\bvai\s+faltar\b/gi, 'haverá interrupção temporária no fornecimento de'],
    [/\bvai\s+para\b|\bvai\s+parar\b/gi, 'ficará temporariamente fora de operação'],
    [/\bnum\s+pode\b|\bnao\s+pode\b|\bnão\s+pode\b/gi, 'não é permitido'],
    [/\b(ta|tá|está)\s+quebrado\b|\b(ta|tá|está)\s+com\s+defeito\b/gi, 'está temporariamente fora de funcionamento'],
    [/\btem\s+que\b/gi, 'deve-se'],
    [/\bdesculpe\s+o\s+transtorno\b|\bdesculpem\s+o\s+transtorno\b/gi, 'agradecemos a compreensão pelos eventuais transtornos'],
    [/\bqualquer\s+duvida\b|\bqualquer\s+dúvida\b/gi, 'em caso de dúvidas'],

    // Crases em intervalos de horários (ex: "das 8 as 12" -> "das 8 às 12")
    [/\bdas\s+(\d{1,2}(?:h|\:\d{2})?)\s+as\s+(\d{1,2}(?:h|\:\d{2})?)\b/gi, 'das $1 às $2'],
    [/\bde\s+(\d{1,2}(?:h|\:\d{2})?)\s+as\s+(\d{1,2}(?:h|\:\d{2})?)\b/gi, 'de $1 às $2'],

    // Contrações coloquiais
    [/\btá\b|\bta\b/gi, 'está'],
    [/\btão\b/gi, 'estão'],
    [/\bpra\b/gi, 'para'],
    [/\bpro\b/gi, 'para o'],
    [/\bpros\b/gi, 'para os'],
    [/\bpras\b/gi, 'para as'],
    [/\bpq\b|\bpor que\b/gi, 'porque'],
    [/\bvc\b/gi, 'você'],
    [/\bvcs\b/gi, 'vocês'],
    [/\bnao\b/gi, 'não'],
    [/\bja\b/gi, 'já'],
    [/\bate\b/gi, 'até'],
    [/\btambem\b/gi, 'também'],

    // Termos temporais e dias da semana
    [/\bmanha\b/gi, 'manhã'],
    [/\bamanha\b/gi, 'amanhã'],
    [/\bsabado\b/gi, 'sábado'],
    [/\bhorario\b/gi, 'horário'],
    [/\bhorarios\b/gi, 'horários'],
    [/\bperiodo\b/gi, 'período'],
    [/\binicio\b/gi, 'início'],
    [/\btermino\b/gi, 'término'],
    [/\bproximo\b/gi, 'próximo'],
    [/\bproxima\b/gi, 'próxima'],

    // Termos condominiais frequentes
    [/\bcaixa\s+d\s*agua\b|\bcaixa\s+dagua\b|\bcaixa\s+d'agua\b/gi, "caixa d'água"],
    [/\bmanutensao\b|\bmanutencao\b/gi, 'manutenção'],
    [/\blimpesa\b/gi, 'limpeza'],
    [/\breuniao\b/gi, 'reunião'],
    [/\bassembleia\b/gi, 'assembleia'],
    [/\bagua\b/gi, 'água'],
    [/\beletrica\b/gi, 'elétrica'],
    [/\bgas\b/gi, 'gás'],
    [/\bportao\b/gi, 'portão'],
    [/\bgaragem\b/gi, 'garagem'],
    [/\binfiltracao\b/gi, 'infiltração'],
    [/\bsindico\b/gi, 'síndico'],
    [/\bsindica\b/gi, 'síndica'],
    [/\bcondominio\b/gi, 'condomínio'],
    [/\bcondominos\b/gi, 'condôminos'],
    [/\barea\b/gi, 'área'],
    [/\bareas\b/gi, 'áreas'],
    [/\bveiculo\b/gi, 'veículo'],
    [/\bveiculos\b/gi, 'veículos'],
    [/\bsilencio\b/gi, 'silêncio'],
    [/\bmusica\b/gi, 'música'],
    [/\bpertubacao\b|\bpertubação\b/gi, 'perturbação'],
    [/\bduvida\b/gi, 'dúvida'],
    [/\bduvidas\b/gi, 'dúvidas'],
    [/\bsalao\b/gi, 'salão'],
    [/\breciclavel\b/gi, 'reciclável'],
    [/\breciclaveis\b/gi, 'recicláveis'],
  ];

  for (const [padrao, substituto] of substituicoes) {
    s = s.replace(padrao, substituto);
  }

  // Bloco em maiúsculo (ex: Bloco A, Bloco 1)
  s = s.replace(/\bbloco\s+([a-zA-Z0-9]+)/gi, (_, g1) => `Bloco ${g1.toUpperCase()}`);

  // Limpeza de pontuação duplicada e espaços múltiplos
  s = s.replace(/[!]{2,}/g, '!').replace(/[?]{2,}/g, '?').replace(/\s{2,}/g, ' ').trim();

  // Garante inicial maiúscula e ponto final
  if (s.length > 0) {
    s = s.charAt(0).toUpperCase() + s.slice(1);
    if (!/[.!?]$/.test(s)) {
      s += '.';
    }
  }

  return s;
}

/**
 * Motor heurístico inteligente que reescreve o comunicado de ponta a ponta,
 * corrigindo gramática e aplicando estrutura profissional correspondente ao tom.
 */
export function refinarComunicadoHeuristico(params: RefinarComunicadoParams, avisoOrigem?: string): SugestaoComunicado {
  const { titulo, categoria, mensagem, tom } = params;

  // Corrige gramática e pontuação do rascunho
  const textoCorrigido = corrigirEReestruturarTexto(mensagem);

  // Padronização e enriquecimento do título
  let tituloFormatado = titulo.trim();
  if (!tituloFormatado) {
    tituloFormatado = `Aviso sobre ${categoria}`;
  } else {
    tituloFormatado = corrigirEReestruturarTexto(tituloFormatado).replace(/\.$/, '');
  }

  let mensagemFinal = '';
  let justificativa = '';

  switch (tom) {
    case 'formal':
      tituloFormatado = `COMUNICADO OFICIAL: ${tituloFormatado.toUpperCase()}`;
      mensagemFinal = [
        'Prezados Condôminos e Moradores,',
        '',
        `Comunicamos que ${textoCorrigido.charAt(0).toLowerCase() + textoCorrigido.slice(1)}`,
        '',
        'Solicitamos a colaboração e a costumeira atenção de todos para o fiel cumprimento das diretrizes previstas na Convenção Condominial e no Regulamento Interno.',
        '',
        'Certos de contar com a compreensão de todos, renovamos nossos protestos de consideração.',
        '',
        'Atenciosamente,',
        'Administração do Condomínio'
      ].join('\n');
      justificativa = 'Redação reestruturada em tom institucional e sóbrio, com introdução formal e respaldo nas normas condominiais.';
      break;

    case 'educativo':
      tituloFormatado = `Convivência & Harmonia: ${tituloFormatado}`;
      mensagemFinal = [
        'Olá, vizinhos!',
        '',
        'Para mantermos a tranquilidade, o respeito e o bem-estar coletivo em nosso condomínio, gostaríamos de compartilhar um lembrete importante:',
        '',
        `${textoCorrigido}`,
        '',
        'Pequenas atitudes no dia a dia preservam a harmonia de toda a nossa comunidade. A cooperação de cada morador faz toda a diferença para o nosso convívio.',
        '',
        'Contamos com a gentileza e o apoio de todos!',
        '',
        'Com consideração,',
        'Gestão e Convivência Condominial'
      ].join('\n');
      justificativa = 'Texto reescrito com foco em conscientização mútua, empatia e valorização do bom relacionamento comunitário.';
      break;

    case 'firme':
      tituloFormatado = `AVISO IMPORTANTE: ${tituloFormatado.toUpperCase()}`;
      mensagemFinal = [
        'Aos Moradores e Responsáveis pelas Unidades,',
        '',
        'Reforçamos com a devida seriedade a determinação a respeito do seguinte ponto:',
        '',
        `${textoCorrigido}`,
        '',
        'Ressaltamos que o descumprimento das normas vigentes compromete a ordem do condomínio, sujeitando a unidade infratora às penalidades e advertências previstas no Regulamento Interno.',
        '',
        'Zelar pelo cumprimento das regras é dever de todos.',
        '',
        'Administração do Condomínio'
      ].join('\n');
      justificativa = 'Reestruturado com tom assertivo e resoluto, com ênfase no cumprimento obrigatório das regras e penalidades cabíveis.';
      break;

    case 'direto':
      tituloFormatado = `[Aviso Rápido] ${tituloFormatado}`;
      mensagemFinal = [
        `• Categoria: ${categoria}`,
        `• Assunto: ${tituloFormatado}`,
        '',
        'Informações e Orientações:',
        `${textoCorrigido}`,
        '',
        'Dúvidas podem ser direcionadas diretamente aos canais oficiais da administração predial.'
      ].join('\n');
      justificativa = 'Formato em tópicos limpos e de leitura rápida, eliminando rodeios e pontuando as orientações com exatidão.';
      break;

    case 'acolhedor':
      tituloFormatado = `Mensagem à Comunidade: ${tituloFormatado}`;
      mensagemFinal = [
        'Queridos vizinhos,',
        '',
        'Esperamos que todos estejam muito bem.',
        '',
        `Gostaríamos de compartilhar uma mensagem com a nossa comunidade: ${textoCorrigido.charAt(0).toLowerCase() + textoCorrigido.slice(1)}`,
        '',
        'Agradecemos calorosamente a presença, o carinho e o cuidado que cada um dedica ao nosso condomínio.',
        '',
        'Com apreço,',
        'Síndica e Equipe Administrativa'
      ].join('\n');
      justificativa = 'Linguagem calorosa e integrativa, acolhendo a comunidade de forma humana e afetuosa.';
      break;
  }

  return {
    tituloSugerido: tituloFormatado,
    mensagemSugerida: mensagemFinal,
    justificativaTom: justificativa,
    geradoPorIA: false,
    avisoOrigem,
  };
}

/**
 * Modelos prioritários ativos da Groq para inferência textual.
 */
const MODELOS_GROQ_PRIORITARIOS = [
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b'
];

/**
 * Modelos suportados da API Gemini ordenados por disponibilidade comprovada e menor latência.
 */
const MODELOS_GEMINI_FALLBACK = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
  'gemini-3.7-flash',
];

/**
 * Executa refinamento de comunicado utilizando a API do Google Gemini (Google AI Studio).
 */
export async function refinarComunicadoComGemini(params: RefinarComunicadoParams): Promise<SugestaoComunicado | null> {
  const geminiKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim();
  if (!geminiKey || geminiKey.startsWith('AIza_sua_chave')) {
    return null;
  }

  const { titulo, categoria, mensagem, tom } = params;
  const configTom = TOMS_CONFIG[tom];

  const systemInstruction = `Você é um consultor e redator de gestão condominial de alto nível.
Sua tarefa é REESCREVER e APRIMORAR completamente o comunicado rascunhado pela síndica, corrigindo quaisquer erros gramaticais ou de concordância do português e ajustando ao tom solicitado.

Categoria: ${categoria}
Tom desejado: ${configTom.label} - ${configTom.descricao}

Regras Mandatórias:
1. Gramática e ortografia impecáveis em Português do Brasil (sem erros, sem gírias, sem informalidades inadequadas).
2. Não invente dados factuais (datas, números de apartamentos ou valores) que não estejam no rascunho original. Se faltar dado crítico, use "[inserir data/horário]".
3. Respeite as políticas condominiais: respeito mútuo, clareza e civilidade.
4. Responda ESTRITAMENTE em formato JSON com o seguinte schema:
{
  "tituloSugerido": "Título conciso, elegante e impactante (máximo 70 caracteres)",
  "mensagemSugerida": "Mensagem completa reescrita com estrutura clara: saudação, contextualização, orientações e encerramento",
  "justificativaTom": "Explicação em até 20 palavras de como o tom foi calibrado para este comunicado"
}`;

  const prompt = `${systemInstruction}\n\nDados do Rascunho:\nTítulo: ${titulo || '(não informado)'}\nCategoria: ${categoria}\nRascunho original: ${mensagem || '(não informado)'}\nTom exigido: ${configTom.label}`;

  for (const modelo of MODELOS_GEMINI_FALLBACK) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${geminiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 800,
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
      if (parsed.tituloSugerido && parsed.mensagemSugerida) {
        return {
          tituloSugerido: String(parsed.tituloSugerido).trim(),
          mensagemSugerida: String(parsed.mensagemSugerida).trim(),
          justificativaTom: String(parsed.justificativaTom || `Ajustado com IA para o tom ${configTom.label}.`).trim(),
          geradoPorIA: true,
        };
      }
    } catch {
      clearTimeout(timeoutId);
      continue;
    }
  }

  return null;
}

/**
 * Executa refinamento via Groq API.
 */
async function tentarRefinamentoGroq(
  apiKey: string,
  params: RefinarComunicadoParams,
  systemPrompt: string,
  userContent: string
): Promise<{ sugestao: SugestaoComunicado | null; bloqueioProjeto: boolean }> {
  const { tom } = params;
  const configTom = TOMS_CONFIG[tom];

  for (const modelo of MODELOS_GROQ_PRIORITARIOS) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelo,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 700,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          return { sugestao: null, bloqueioProjeto: true };
        }
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) continue;

      const parsed = JSON.parse(content);
      if (parsed.tituloSugerido && parsed.mensagemSugerida) {
        return {
          sugestao: {
            tituloSugerido: String(parsed.tituloSugerido).trim(),
            mensagemSugerida: String(parsed.mensagemSugerida).trim(),
            justificativaTom: String(parsed.justificativaTom || `Ajustado para o tom ${configTom.label}.`).trim(),
            geradoPorIA: true,
          },
          bloqueioProjeto: false,
        };
      }
    } catch {
      break;
    }
  }

  return { sugestao: null, bloqueioProjeto: false };
}

/**
 * Envia o comunicado para inferência na IA:
 * 1. Prioriza o provedor com chave ativa e sem restrições (Gemini quando configurado, ou Groq);
 * 2. Faz chaveamento transparente (fallback) caso o provedor primário falhe ou retorne erro;
 * 3. Se nenhuma IA em nuvem estiver acessível, aciona o motor heurístico local garantindo 100% de disponibilidade.
 */
export async function refinarComunicadoComIA(params: RefinarComunicadoParams): Promise<SugestaoComunicado> {
  const apiKeyGroq = (import.meta.env.VITE_GROQ_API_KEY as string | undefined)?.trim();
  const apiKeyGemini = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim();
  const { titulo, categoria, mensagem, tom } = params;
  const configTom = TOMS_CONFIG[tom];

  const cleanTitulo = sanitizePromptInput(titulo || '', 100).cleanText;
  const cleanMensagem = sanitizePromptInput(mensagem || '', 1500).cleanText;

  const temGemini = !!apiKeyGemini && !apiKeyGemini.startsWith('AIza_sua_chave');
  const temGroq = !!apiKeyGroq && !apiKeyGroq.startsWith('gsk_sua_chave');

  const systemPrompt = `Você é um consultor e redator de gestão condominial de alto nível.
Sua tarefa é REESCREVER e APRIMORAR completamente o comunicado rascunhado pela síndica, corrigindo quaisquer erros gramaticais ou de concordância do português e ajustando ao tom solicitado.

Categoria: ${categoria}
Tom desejado: ${configTom.label} - ${configTom.descricao}

Regras Mandatórias:
1. Gramática e ortografia impecáveis em Português do Brasil (sem erros, sem gírias, sem informalidades inadequadas).
2. Não invente dados factuais (datas, números de apartamentos ou valores) que não estejam no rascunho original. Se faltar dado crítico, use "[inserir data/horário]".
3. Respeite as políticas condominiais: respeito mútuo, clareza e civilidade.
4. Responda ESTRITAMENTE em formato JSON com o seguinte schema:
{
  "tituloSugerido": "Título conciso, elegante e impactante (máximo 70 caracteres)",
  "mensagemSugerida": "Mensagem completa reescrita com estrutura clara: saudação, contextualização, orientações e encerramento",
  "justificativaTom": "Explicação em até 20 palavras de como o tom foi calibrado para este comunicado"
}`;

  const userContent = `Título do rascunho: ${cleanTitulo || '(não informado)'}\nCategoria: ${categoria}\nRascunho original para reescrever: ${cleanMensagem || '(não informado)'}\nTom exigido: ${configTom.label}`;

  let teveBloqueioGroq = false;

  // Se o usuário configurou chave do Gemini, priorizamos o Gemini (evita erros 403 no console do navegador)
  if (temGemini) {
    try {
      const sugestaoGemini = await refinarComunicadoComGemini(params);
      if (sugestaoGemini) {
        return sugestaoGemini;
      }
    } catch (err) {
      console.warn('Falha na inferência Gemini, tentando provedor alternativo:', err);
    }
  }

  // Se o Gemini falhou ou não estava configurado, tenta a Groq
  if (temGroq) {
    const { sugestao, bloqueioProjeto } = await tentarRefinamentoGroq(apiKeyGroq, params, systemPrompt, userContent);
    if (sugestao) {
      return sugestao;
    }
    if (bloqueioProjeto) {
      teveBloqueioGroq = true;
    }
  }

  // Se a Groq foi tentada primeiro e falhou, e ainda não havíamos tentado o Gemini, tenta agora
  if (!temGemini && temGroq) {
    const sugestaoGemini = await refinarComunicadoComGemini(params);
    if (sugestaoGemini) {
      return sugestaoGemini;
    }
  }

  // Fallback Heurístico Local (0ms, sempre disponível)
  const aviso = teveBloqueioGroq && !temGemini
    ? 'Motor de contingência ativado: A chave da Groq retornou HTTP 403 (modelos bloqueados no projeto). Habilite os modelos em console.groq.com/settings/project/limits ou utilize VITE_GEMINI_API_KEY no .env.'
    : undefined;

  return refinarComunicadoHeuristico(params, aviso);
}

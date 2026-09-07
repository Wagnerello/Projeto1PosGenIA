/* eslint-disable complexity, quality/no-direct-console */ // FIXME: D�vida t�cnica (Quarentena)
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

export async function classificarOcorrenciaComIA(
  titulo: string,
  descricao: string
): Promise<TriagemResultado> {
  const cleanTitulo = sanitizePromptInput(titulo || '', 100).cleanText;
  const cleanDescricao = sanitizePromptInput(descricao || '', 500).cleanText;
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '' || apiKey.startsWith('gsk_sua_chave')) {
    return triagemHeuristica(cleanTitulo, cleanDescricao);
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `Você é o motor de triagem inteligente de um condomínio residencial.
Analise o chamado do morador e retorne EXCLUSIVAMENTE um objeto JSON no formato:
{
  "categoria": "Manutenção" | "Barulho" | "Segurança" | "Limpeza" | "Convivência" | "Outro",
  "urgencia": "Baixa" | "Média" | "Alta",
  "justificativa": "frase curta e técnica de até 15 palavras explicando a prioridade para o síndico"
}
Regras de Urgência:
- "Alta": risco de vida, segurança, incêndio, choque elétrico, vazamento ativo de água, vazamento de gás, elevador travado com pessoa.
- "Média": barulho excessivo, elevador quebrado sem passageiro, infiltração pontual, lâmpada de área comum, portão falhando.
- "Baixa": dúvidas, sugestões, itens estéticos, reparos não urgentes.`,
          },
          {
            role: 'user',
            content: `Título: ${cleanTitulo}\nDescrição: ${cleanDescricao}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      console.warn('Groq API retornou status não-OK:', response.status);
      return triagemHeuristica(titulo, descricao);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return triagemHeuristica(titulo, descricao);
    }

    const parsed = JSON.parse(content);

    const categoriasValidas = ['Manutenção', 'Barulho', 'Segurança', 'Limpeza', 'Convivência', 'Outro'];
    const urgenciasValidas = ['Baixa', 'Média', 'Alta'];

    const categoriaFinal = categoriasValidas.includes(parsed.categoria)
      ? (parsed.categoria as TriagemResultado['categoria'])
      : 'Outro';

    const urgenciaFinal = urgenciasValidas.includes(parsed.urgencia)
      ? (parsed.urgencia as TriagemResultado['urgencia'])
      : 'Média';

    return {
      categoria: categoriaFinal,
      urgencia: urgenciaFinal,
      justificativa: parsed.justificativa || 'Classificado pelo motor de IA.',
      triagemPorIA: true,
    };
  } catch (error) {
    console.error('Falha na triagem com Groq, aplicando fallback determinístico:', error);
    return triagemHeuristica(titulo, descricao);
  }
}

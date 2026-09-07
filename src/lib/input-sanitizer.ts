/**
 * Utilitários de sanitização, defesa em profundidade e prevenção de Prompt Injection / XSS.
 * Aplicado antes de enviar entradas para LLMs e persistência.
 */

// Padrões comuns de ataque de injeção de prompt
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+(instructions|prompts|rules)/gi,
  /ignore\s+as\s+instruções\s+(anteriores|prévias)/gi,
  /esqueça\s+(tudo|todas\s+as\s+instruções)/gi,
  /desconsidere\s+as\s+instruções/gi,
  /system\s*prompt/gi,
  /you\s+are\s+now\s+(in\s+)?dan\s+mode/gi,
  /modo\s+dan/gi,
  /jailbreak/gi,
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /data:text\/html/gi,
];

/**
 * Higieniza strings de entrada removendo caracteres de controle perigosos e limitando o tamanho.
 */
export function sanitizeString(input: unknown, maxLength = 2000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // remove ASCII control chars
    .slice(0, maxLength)
    .trim();
}

/**
 * Detecta se uma string contém vetores explícitos de Prompt Injection ou escape de instruções.
 */
export function hasPromptInjection(input: string): boolean {
  if (!input) return false;
  return PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Higieniza o texto para consumo seguro em prompts de IA, neutralizando tags e padrões de injeção.
 */
export function sanitizePromptInput(input: string, maxLength = 1000): { cleanText: string; injected: boolean } {
  const sanitized = sanitizeString(input, maxLength);
  const detected = hasPromptInjection(sanitized);

  // Remove caracteres que poderiam forçar quebra de delimitadores em JSON/Prompts
  const cleanText = sanitized
    .replace(/```/g, "'''")
    .replace(/[\r\n]{3,}/g, '\n\n');

  return {
    cleanText,
    injected: detected,
  };
}

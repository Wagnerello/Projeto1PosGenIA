/* eslint-disable complexity, @typescript-eslint/no-explicit-any */ // FIXME: D�vida t�cnica (Quarentena)
/**
 * Utilitários centralizados e seguros para formatação e manipulação de datas no sistema.
 * Trata nativamente:
 * - Timestamps do Firestore (com método .toDate())
 * - Objetos serializados do Firestore ({ seconds: number, nanoseconds?: number })
 * - Instâncias Date do JavaScript
 * - Strings ISO / números (epoch millis)
 *
 * Garante que o retorno seja SEMPRE do tipo primitivo string, evitando erros
 * 'Objects are not valid as a React child (found: object with keys {seconds, nanoseconds})'.
 */

export function parseDataSegura(val: any): Date | null {
  if (!val) return null;

  // 1. Instância nativa Date
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }

  // 2. Timestamp do SDK do Firestore com método toDate()
  if (typeof val.toDate === 'function') {
    try {
      const d = val.toDate();
      if (d instanceof Date && !isNaN(d.getTime())) {
        return d;
      }
    } catch {
      // continua para os próximos fallbacks
    }
  }

  // 3. Objeto Timestamp serializado ({ seconds, nanoseconds })
  if (typeof val === 'object' && typeof val.seconds === 'number' && !isNaN(val.seconds)) {
    const d = new Date(val.seconds * 1000);
    return isNaN(d.getTime()) ? null : d;
  }

  // 4. Número (timestamp epoch)
  if (typeof val === 'number' && !isNaN(val)) {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  // 5. String (ISO ou formato padrão)
  if (typeof val === 'string' && val.trim()) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }

  return null;
}

/**
 * Formata data e hora para exibição em UI (ex: '06/09/2026, 14:30').
 * SEMPRE retorna uma string primitiva.
 */
export function formatarDataHora(val: any, fallback = 'Recente'): string {
  const d = parseDataSegura(val);
  if (!d) {
    return typeof val === 'string' && val.trim() ? val : fallback;
  }
  try {
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return fallback;
  }
}

/**
 * Formata data simples (ex: '06/09/2026').
 * SEMPRE retorna uma string primitiva.
 */
export function formatarDataSimples(val: any, fallback = 'Hoje'): string {
  const d = parseDataSegura(val);
  if (!d) {
    return typeof val === 'string' && val.trim() ? val : fallback;
  }
  try {
    return d.toLocaleDateString('pt-BR');
  } catch {
    return fallback;
  }
}

/**
 * Retorna o timestamp em milissegundos para ordenações confiáveis (.sort).
 */
export function getTimestampMillis(val: any): number {
  const d = parseDataSegura(val);
  return d ? d.getTime() : 0;
}

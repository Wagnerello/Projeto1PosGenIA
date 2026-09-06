import type { AvisoData } from './firestore';

/**
 * Filtra os comunicados que são pertinentes para um morador específico.
 * Um morador sempre visualiza:
 * 1. Comunicados com destinatarioTipo === 'todos' (ou sem bloco definido).
 * 2. Comunicados direcionados especificamente para o bloco dele.
 */
export function filterAvisosParaMorador(
  avisos: AvisoData[],
  moradorBloco?: string
): AvisoData[] {
  if (!Array.isArray(avisos) || avisos.length === 0) return [];

  const blocoNorm = (moradorBloco || '').trim().toLowerCase();

  return avisos.filter((av) => {
    if (!av) return false;
    if (av.destinatarioTipo === 'todos' || !av.blocoDestino) return true;
    if (!blocoNorm) return false;
    return av.blocoDestino.trim().toLowerCase() === blocoNorm;
  });
}

/**
 * Formata o texto do selo de público-alvo do comunicado.
 */
export function formatAvisoPublicoAlvo(
  destinatarioTipo: 'todos' | 'bloco' | string,
  blocoDestino?: string
): string {
  if (destinatarioTipo === 'bloco' && blocoDestino && blocoDestino.trim()) {
    return `Exclusivo para ${blocoDestino.trim()}`;
  }
  return 'Geral - Todos os Blocos';
}

/**
 * Retorna as classes visuais de badge para a categoria do aviso.
 */
export function getCategoriaAvisoConfig(categoria?: string) {
  switch (categoria) {
    case 'Manutenção':
      return { label: 'Manutenção', badgeClass: 'bg-amber-50 text-amber-800 border-amber-200' };
    case 'Assembleia':
      return { label: 'Assembleia', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    case 'Segurança':
      return { label: 'Segurança', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' };
    case 'Convivência':
      return { label: 'Convivência', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'Geral':
    default:
      return { label: categoria || 'Geral', badgeClass: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
}

/**
 * Filtra a lista de comunicados para o painel administrativo da síndica
 * com base em busca textual (título e mensagem), categoria e escopo de destinatário.
 */
export function filterAvisosParaSindica(
  avisos: AvisoData[],
  buscaTexto: string = '',
  categoriaFiltro: string = 'all',
  destinatarioFiltro: string = 'all'
): AvisoData[] {
  if (!Array.isArray(avisos) || avisos.length === 0) return [];

  const busca = buscaTexto.trim().toLowerCase();

  return avisos.filter((av) => {
    if (!av) return false;

    // Filtro por categoria
    if (categoriaFiltro !== 'all') {
      const cat = av.categoria || 'Geral';
      if (cat !== categoriaFiltro) return false;
    }

    // Filtro por destinatário ('todos' | 'bloco')
    if (destinatarioFiltro !== 'all') {
      if (destinatarioFiltro === 'todos' && av.destinatarioTipo !== 'todos') return false;
      if (destinatarioFiltro === 'bloco' && av.destinatarioTipo !== 'bloco') return false;
    }

    // Filtro por busca textual (título ou mensagem ou blocoDestino)
    if (busca) {
      const titulo = (av.titulo || '').toLowerCase();
      const mensagem = (av.mensagem || '').toLowerCase();
      const bloco = (av.blocoDestino || '').toLowerCase();

      const bateTitulo = titulo.includes(busca);
      const bateMensagem = mensagem.includes(busca);
      const bateBloco = bloco.includes(busca);

      if (!bateTitulo && !bateMensagem && !bateBloco) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Calcula contadores estatísticos dos comunicados do mural.
 */
export function calcAvisosStats(avisos: AvisoData[]): {
  total: number;
  gerais: number;
  blocos: number;
} {
  if (!Array.isArray(avisos)) {
    return { total: 0, gerais: 0, blocos: 0 };
  }

  let gerais = 0;
  let blocos = 0;

  for (const av of avisos) {
    if (av.destinatarioTipo === 'bloco') {
      blocos++;
    } else {
      gerais++;
    }
  }

  return {
    total: avisos.length,
    gerais,
    blocos,
  };
}


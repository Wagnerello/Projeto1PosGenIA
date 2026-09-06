export type ResponsavelOcorrencia =
  | 'Síndica'
  | 'Zeladoria'
  | 'Portaria'
  | 'Prestador Externo';

export type StatusOcorrencia =
  | 'Pendente'
  | 'Em Atendimento'
  | 'Aguardando Validação da Síndica'
  | 'Resolvido';

export interface OcorrenciaHistoricoItem {
  id: string;
  data: string;
  autorNome: string;
  autorPapel: string;
  mensagem: string;
  responsavelNovo?: string;
  statusNovo?: string;
  tipo?: 'abertura' | 'despacho' | 'conclusao_equipe' | 'encerramento' | 'reabertura';
}

export interface OcorrenciaData {
  id: string;
  titulo: string;
  descricao: string;
  categoria?: string;
  urgencia?: 'Baixa' | 'Média' | 'Alta';
  iaJustificativa?: string;
  triagemPorIA?: boolean;
  condominioId?: string;
  unidadeId?: string;
  unidadeNome?: string;
  autorNome?: string;
  autorEmail?: string;
  status: StatusOcorrencia | string;
  responsavelAtual: ResponsavelOcorrencia | string;
  historico?: OcorrenciaHistoricoItem[];
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Regra de negócio (RN-005): Somente a síndica (ou superadmin) pode efetivamente fechar o chamado.
 */
export function canCloseOcorrencia(userRole: string | undefined | null): boolean {
  if (!userRole) return false;
  const role = userRole.toLowerCase().trim();
  return role === 'sindica' || role === 'superadmin';
}

/**
 * Regra de negócio (RN-007): Somente a síndica (ou superadmin) pode reabrir uma ocorrência já fechada.
 */
export function canReopenOcorrencia(userRole: string | undefined | null): boolean {
  if (!userRole) return false;
  const role = userRole.toLowerCase().trim();
  return role === 'sindica' || role === 'superadmin';
}

/**
 * Regra de negócio (RN-006): Determina se a ocorrência está fechada.
 */
export function isOcorrenciaFechada(status: string | undefined | null): boolean {
  return status === 'Resolvido';
}

/**
 * Gera um item padronizado para a linha do tempo de histórico.
 */
export function criarItemHistorico(params: {
  autorNome: string;
  autorPapel: string;
  mensagem: string;
  responsavelNovo?: string;
  statusNovo?: string;
  tipo?: 'abertura' | 'despacho' | 'conclusao_equipe' | 'encerramento';
}): OcorrenciaHistoricoItem {
  return {
    id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    data: new Date().toISOString(),
    autorNome: params.autorNome || 'Usuário',
    autorPapel: params.autorPapel || 'Equipe',
    mensagem: params.mensagem.trim(),
    responsavelNovo: params.responsavelNovo,
    statusNovo: params.statusNovo,
    tipo: params.tipo || 'despacho',
  };
}

/**
 * Retorna classes visuais e rótulo amigável para o status da ocorrência.
 */
export function getStatusConfig(status: string | undefined): {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
} {
  switch (status) {
    case 'Resolvido':
      return {
        label: 'Resolvido',
        bgClass: 'bg-emerald-50',
        textClass: 'text-emerald-700',
        borderClass: 'border-emerald-200',
      };
    case 'Aguardando Validação da Síndica':
      return {
        label: 'Aguardando Validação',
        bgClass: 'bg-purple-50',
        textClass: 'text-purple-700',
        borderClass: 'border-purple-200',
      };
    case 'Em Atendimento':
    case 'Em Análise':
      return {
        label: 'Em Atendimento',
        bgClass: 'bg-blue-50',
        textClass: 'text-blue-700',
        borderClass: 'border-blue-200',
      };
    case 'Pendente':
    default:
      return {
        label: 'Pendente',
        bgClass: 'bg-amber-50',
        textClass: 'text-amber-700',
        borderClass: 'border-amber-200',
      };
  }
}

/**
 * Retorna classes visuais e rótulo amigável para o responsável atual.
 */
export function getResponsavelConfig(responsavel: string | undefined): {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
} {
  switch (responsavel) {
    case 'Zeladoria':
      return {
        label: 'Zeladoria',
        bgClass: 'bg-orange-50',
        textClass: 'text-orange-700',
        borderClass: 'border-orange-200',
      };
    case 'Portaria':
      return {
        label: 'Portaria',
        bgClass: 'bg-cyan-50',
        textClass: 'text-cyan-700',
        borderClass: 'border-cyan-200',
      };
    case 'Prestador Externo':
      return {
        label: 'Prestador Externo',
        bgClass: 'bg-slate-100',
        textClass: 'text-slate-700',
        borderClass: 'border-slate-300',
      };
    case 'Síndica':
    default:
      return {
        label: 'Síndica / Adm',
        bgClass: 'bg-indigo-50',
        textClass: 'text-indigo-700',
        borderClass: 'border-indigo-200',
      };
  }
}

/**
 * Filtra a lista de ocorrências com base em busca textual, status e responsável.
 */
export function filterOcorrencias(
  ocorrencias: any[],
  termoBusca: string = '',
  statusFiltro: string = 'all',
  responsavelFiltro: string = 'all'
): any[] {
  if (!Array.isArray(ocorrencias)) return [];

  const query = termoBusca.trim().toLowerCase();

  return ocorrencias.filter((oc) => {
    // Filtro por status
    if (statusFiltro !== 'all') {
      const ocStatus = oc.status || 'Pendente';
      if (ocStatus !== statusFiltro) return false;
    }

    // Filtro por responsável
    if (responsavelFiltro !== 'all') {
      const ocResp = oc.responsavelAtual || 'Síndica';
      if (ocResp !== responsavelFiltro) return false;
    }

    // Filtro por termo de busca
    if (!query) return true;

    const titulo = (oc.titulo || '').toLowerCase();
    const desc = (oc.descricao || '').toLowerCase();
    const unidade = (oc.unidadeNome || '').toLowerCase();
    const autor = (oc.autorNome || '').toLowerCase();
    const categoria = (oc.categoria || '').toLowerCase();

    return (
      titulo.includes(query) ||
      desc.includes(query) ||
      unidade.includes(query) ||
      autor.includes(query) ||
      categoria.includes(query)
    );
  });
}

export type MoradorStatus = 'ativo' | 'pendente' | 'inativo';

export interface MoradorItem {
  id?: string;
  uid?: string;
  nome?: string;
  email?: string;
  telefone?: string;
  role?: string;
  status?: MoradorStatus | string;
  condominioId?: string;
  unidadeId?: string;
  unidadeNome?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface MoradorStatusConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
  description: string;
}

/**
 * Normaliza e resolve o status do morador a partir do campo status ou role.
 */
export function resolveMoradorStatus(user?: { role?: string; status?: string } | null): MoradorStatus {
  if (!user) return 'pendente';

  const statusNorm = (user.status || '').toLowerCase().trim();
  if (statusNorm === 'ativo' || statusNorm === 'active') return 'ativo';
  if (statusNorm === 'inativo' || statusNorm === 'inactive' || statusNorm === 'bloqueado') return 'inativo';
  if (statusNorm === 'pendente' || statusNorm === 'pending') return 'pendente';

  const roleNorm = (user.role || '').toLowerCase().trim();
  if (roleNorm === 'morador') return 'ativo';
  if (roleNorm === 'rejected') return 'inativo';
  if (roleNorm === 'pending') return 'pendente';

  return 'ativo';
}

/**
 * Retorna as classes de estilo e rótulo amigável para o status do morador.
 */
export function getMoradorStatusConfig(statusOuRole?: string): MoradorStatusConfig {
  const status = resolveMoradorStatus({ status: statusOuRole, role: statusOuRole });

  switch (status) {
    case 'ativo':
      return {
        label: 'Ativo',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50',
        dotClass: 'bg-emerald-500',
        description: 'Acesso liberado ao condomínio',
      };
    case 'pendente':
      return {
        label: 'Pendente',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50',
        dotClass: 'bg-amber-500',
        description: 'Aguardando validação da síndica',
      };
    case 'inativo':
      return {
        label: 'Inativo',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50',
        dotClass: 'bg-rose-500',
        description: 'Acesso suspenso / bloqueado',
      };
  }
}

/**
 * Filtra a lista de moradores por busca textual, status e torre/bloco.
 */
export function filterMoradores(
  moradores: MoradorItem[],
  termoBusca: string = '',
  statusFiltro: string = 'all',
  torreFiltro: string = 'all'
): MoradorItem[] {
  if (!Array.isArray(moradores)) return [];

  const busca = termoBusca.trim().toLowerCase();

  return moradores.filter((m) => {
    if (!m) return false;

    // Filtro por status
    if (statusFiltro !== 'all') {
      const statusReal = resolveMoradorStatus(m);
      if (statusReal !== statusFiltro) return false;
    }

    // Filtro por torre/bloco
    if (torreFiltro !== 'all') {
      const uNome = (m.unidadeNome || '').toLowerCase();
      const tFiltroNorm = torreFiltro.toLowerCase().trim();
      if (!uNome.includes(tFiltroNorm)) return false;
    }

    // Filtro textual (Nome, E-mail, Unidade, Telefone)
    if (busca) {
      const nome = (m.nome || '').toLowerCase();
      const email = (m.email || '').toLowerCase();
      const unidade = (m.unidadeNome || '').toLowerCase();
      const telefone = (m.telefone || '').toLowerCase();

      const bateNome = nome.includes(busca);
      const bateEmail = email.includes(busca);
      const bateUnidade = unidade.includes(busca);
      const bateTelefone = telefone.includes(busca);

      if (!bateNome && !bateEmail && !bateUnidade && !bateTelefone) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Calcula os contadores estatísticos dos moradores.
 */
export function calcMoradoresStats(moradores: MoradorItem[]): {
  total: number;
  ativos: number;
  pendentes: number;
  inativos: number;
} {
  if (!Array.isArray(moradores)) {
    return { total: 0, ativos: 0, pendentes: 0, inativos: 0 };
  }

  let ativos = 0;
  let pendentes = 0;
  let inativos = 0;

  for (const m of moradores) {
    const st = resolveMoradorStatus(m);
    if (st === 'ativo') ativos++;
    else if (st === 'pendente') pendentes++;
    else if (st === 'inativo') inativos++;
  }

  return {
    total: moradores.length,
    ativos,
    pendentes,
    inativos,
  };
}

/**
 * Validação dos dados cadastrais do morador antes de salvar.
 */
export function validateMoradorData(dados: {
  nome?: string;
  unidadeId?: string;
}): { valid: boolean; error?: string } {
  if (!dados.nome || !dados.nome.trim()) {
    return { valid: false, error: 'Por favor, informe o nome completo do morador.' };
  }
  if (dados.nome.trim().length < 3) {
    return { valid: false, error: 'O nome do morador deve ter pelo menos 3 caracteres.' };
  }
  if (!dados.unidadeId || !dados.unidadeId.trim()) {
    return { valid: false, error: 'Selecione uma unidade/apartamento para vincular o morador.' };
  }
  return { valid: true };
}

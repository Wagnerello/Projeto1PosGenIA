# Regras de Negócio: MVP SaaS Gestão Condominial

## 1. Visão Geral
Este documento define as regras de negócio para a plataforma SaaS Multi-Tenant de Gestão Condominial (Livro de Registros de Ocorrências e Mural de Avisos com inteligência artificial para triagem). O sistema opera com isolamento estrito de dados por condomínio.

## 2. Atores e Papéis (Hierarquia RBAC)
- **Super Admin (Admin da Plataforma):** Possui acesso global ao painel mestre invisível. Sua única função é registrar novos condomínios na plataforma e convidar/cadastrar as respectivas Síndicas, enviando o link mágico/senha de primeiro acesso.
- **Síndica (Admin Local):** Administradora do seu próprio condomínio. Responsável por:
  - Configurar a infraestrutura predial (criar o "mapa" com número de torres, andares e apartamentos/unidades).
  - Gerar o QR Code/Código de Convite do condomínio para afixar em áreas comuns.
  - Aprovar ou rejeitar o cadastro de novos moradores para o seu condomínio.
  - Visualizar, classificar e alterar status de todas as ocorrências exclusivas do seu condomínio.
  - Postar avisos no Mural.
- **Zelador / Portaria:** Funcionários locais cadastrados pela Síndica. Podem visualizar e atuar em todas as ocorrências do condomínio e ver o Mural de Avisos.
- **Morador:** Vinculado a uma unidade específica de um condomínio. Acesso concedido via "Self-Registration com Aprovação" (Gated Access) disparado por leitura de QR Code. Pode abrir ocorrências para a sua unidade e visualizar o andamento delas. Mais de um morador pode pertencer à mesma unidade (ex: casal).

## 3. Ocorrências, Triagem por IA e Trilha de Atendimento
- **RN-001 (Abertura sem Viés Técnico):** O morador registra o chamado informando apenas Título e Descrição dos Fatos. Campos de categoria técnica e gravidade/urgência são ocultados no formulário do morador para evitar autodiagnósticos imprecisos.
- **RN-002 (Triagem Inteligente por IA):** Ao registrar a ocorrência, o texto é processado pelo motor de inteligência artificial (Groq API com modelo LLaMA 3.1 ou fallback heurístico determinístico), gerando automaticamente:
  - Categoria (`Manutenção`, `Barulho`, `Segurança`, `Limpeza`, `Convivência`, `Outro`);
  - Grau de urgência/gravidade (`Baixa`, `Média`, `Alta`);
  - Justificativa técnica do enquadramento.
- **RN-003 (Visibilidade Diferenciada):** A gravidade e o parecer da IA são visíveis apenas para a Síndica e equipe administrativa, permitindo a priorização de atendimentos de risco antes de demandas rotineiras.
- **RN-004 (Despacho e Delegação para Equipe):** A Síndica pode encaminhar a ocorrência para membros da equipe local (**Zeladoria**, **Portaria**, **Prestador Externo** ou manter na **Síndica**), adicionando relato explicativo e instruções de serviço.
- **RN-005 (Fechamento Exclusivo pela Síndica):** Quando a equipe física conclui o serviço, o status passa para `Aguardando Validação da Síndica`. Somente a Síndica (ou Super Admin) possui permissão de homologar e encerrar efetivamente o chamado como `Resolvido`.
- **RN-006 (Bloqueio de Despacho após Fechamento):** Uma vez que a ocorrência atinge o status `Resolvido`, o botão e o formulário de despacho comum são bloqueados para novos apontamentos de equipe ou morador.
- **RN-007 (Reabertura Exclusiva pela Síndica):** Caso um problema persista ou haja recorrência, **apenas a Síndica** pode reabrir um chamado fechado. É obrigatório registrar a justificativa da reabertura. Ao reabrir, o status retorna para `Em Atendimento` e um evento de reabertura é anexado à trilha cronológica imutável.
- **RN-008 (Trilha Transparente de Atendimento):** Todo o histórico de eventos (abertura, despachos, transferências de responsável, conclusão da equipe, homologação e eventual reabertura) é público e transparente para os envolvidos da unidade e administração.

## 4. Segurança, LGPD e Privacidade
- **Dados Mínimos (LGPD):** O sistema não exigirá CPF para cadastro do morador. A autenticidade baseia-se na validação do E-mail e no fluxo de aprovação manual pela Síndica (que já detém os dados de posse legais fora do sistema).
- **Mural:** Público para leitura por todos os usuários autenticados e aprovados daquele condomínio específico.
- **Ocorrências (Isolamento Multi-Tenant):** 
  - Um morador só tem permissão de leitura e escrita nas ocorrências onde o `unidadeId` seja o dele, dentro do seu respectivo `condominioId`.
  - Síndica/Zelador têm permissão de leitura de todas as ocorrências dentro do seu `condominioId`.
  - Dados de diferentes condomínios nunca se misturam ou vazam, protegidos por Firestore RLS (Row Level Security).

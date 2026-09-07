# Changelog Técnico

Todas as alterações técnicas relevantes deste projeto são documentadas aqui, no momento em que ocorrem — antes e independentemente de qualquer decisão de release.

## [Unreleased]
- [refactor] refactor(ui): implementar responsividade mobile menus hamburguer e cortar v1.1.4 (commit: b4144cb) — Refs: nenhuma

## [v1.1.4] - 2026-09-07
- [refactor] responsividade mobile em todas as visões, navegação por drawer hambúrguer e eliminação de redundâncias — Refs: RN-001, spec §2, spec §3
  - Adiciona suporte a safe area insets (`pb-safe`, `pt-safe`, `h-dvh`, `min-h-dvh`) e desativa zoom forçado no viewport em `index.html` e `index.css`
  - Implementa Bottom Navigation Bar no mobile para o Morador com alternância tátil e botão central de ação
  - Oculta Bottom Bar do Morador dinamicamente ao abrir modal de nova ocorrência ou timeline para evitar concorrência de toques
  - Remove botões redundantes de "Novo" no header da lista de chamados e no empty state móvel do Morador
  - Transforma abas de navegação da Síndica e Super Admin em menu hambúrguer com gaveta lateral móvel e áreas de toque >= 48px
  - Adiciona barra contextual móvel exibindo o módulo em foco e atalho para abertura da gaveta em Síndica e Super Admin
  - Elimina botões duplicados de criação avulsa em Síndica (Novo Comunicado na Home) e Super Admin (Cadastrar Condomínio ao lado da aba)
  - Refatora todas as janelas modais (`NovaOcorrenciaJanela`, `NovaPublicacaoJanela`, `MoradorEditorJanela`, `UnidadeEditorJanela`, `UnitSelector`, `OcorrenciaTimelineJanela`) com comportamento adaptativo bottom sheet no mobile
  - Ajusta formulários de login e cadastro (`AuthView`, `RegisterView`) para container flexível em `min-h-dvh` com inputs `text-base sm:text-sm` prevenindo auto-zoom no iOS Safari
- [refactor] refatoração de UI e eliminação de redundâncias na visão do Morador — Refs: RN-001, spec §2, spec §3
  - Remove card intermediário redundante que duplicava nome, unidade, condomínio e ações no MoradorView
  - Consolida ações primárias no header com botão de Atualizar (Refresh), Nova Ocorrência e Sair
  - Elimina botões duplicados de recarregamento em Ocorrências da Unidade e no Mural de Avisos
  - Remove elementos de AI-slop, ícones de faísca (Sparkles) e textos promocionais de LLM em NovaOcorrenciaJanela
  - Substitui coluna lateral de autopromoção de IA por fluxo objetivo de atendimento em 3 etapas
  - Atualiza OcorrenciaTimelineJanela com rótulo neutro "Parecer da Triagem" e microcopy factual de acompanhamento

## [v1.1.2] - 2026-09-07
- [refactor] refatoração completa de UI e UX do painel Super Admin — Refs: RN-001, spec §2, spec §3
  - Implementa arquitetura em abas operacionais (Condomínios Registrados e Novo Condomínio) eliminando formulário estático que empurrava a listagem
  - Remove cards decorativos artificiais ("Status Operacional" com animação de pulso) e consolida 3 indicadores reais (Total, Síndicos Ativos, Acessos Pendentes)
  - Adiciona barra de busca em tempo real com contador dinâmico de resultados e atalho para limpar a consulta
  - Implementa ações rápidas por linha com cópia em 1 clique do código de convite da síndica, código do mural e link direto de cadastro de moradores
  - Estrutura novo fluxo de cadastro em duas seções claras (Condomínio e Síndica) e tela de conclusão com credenciais geradas e QR Code SVG
  - Adiciona feedback tátil por componente toast flutuante para ações de cópia e notificações operacionais

## [v1.1.1] - 2026-09-07
- [refactor] refatoração completa de UI/UX da visão da Síndica e todos os seus menus — Refs: RN-001, spec §2, spec §3
  - Redesenha o Header da Síndica com layout SaaS minimalista, pill de status "Administração" e atalho tátil para cópia do código do condomínio
  - Reorganiza TabsList por prioridade operacional e remove badges numéricos estáticos, ativando alertas visuais apenas quando houver pendências reais (aprovações ou validações)
  - Transforma aba Visão Geral (Home) em central de ação com faixa de alerta unificada, 4 KPIs limpos clicáveis e grid em duas colunas com feed de chamados prioritários e mural
  - Erradica duplicação de cards de métricas nas abas Unidades, Ocorrências e Moradores, economizando mais de 150px verticais e trazendo as tabelas para a primeira dobra de tela
  - Implementa pílulas de filtro interativo com contadores em tempo real para status de ocorrências e de moradores
  - Aprimora aba de Convites e QR Code com guia de ingresso em 3 etapas, conformidade LGPD, botão de cópia de mensagem para WhatsApp e rotação de código de segurança
  - Atualiza UnitSelector e tela de registro com feedback visual consistente
- [feat] renomear blocos em cascata e ordenação por número crescente (commit: 516d741) — Refs: nenhuma

## [v1.1.0] - 2026-09-06
- [feat] renomeacao de blocos em cascata com suporte a numeros, letras e nomes livres — Refs: RN-001, spec §2
  - Adiciona tipo BlocoEstilo e funções generateBlockName, renameBlocoInUnits, updateUnitNameWithNewBlock, validateRenameBloco, sortUnits, compareUnits em unit-helpers.ts
  - Implementa renameBlocoEmCascata em firestore.ts com atualização atômica em lote de unidades, moradores, comunicados do mural e ocorrências
  - Cria componente RenomearBlocoJanela com seletor de bloco, campo livre para novo nome, atalhos de sugestão e painel de impacto em cascata
  - Atualiza RegerarEstruturaJanela com seletor de estilo de nomenclatura (letras ou números) e prévia em tempo real
  - Integra em SindicaView: botão "Renomear Bloco", chips rápidos de blocos com lápis de edição e toast de confirmação com métricas de atualização
  - Eleva a suíte de testes de 130 para 137 testes automatizados aprovados (7 novos testes para os helpers de bloco)
- [fix] ordenacao de unidades por bloco e numero crescente em toda a aplicacao — Refs: RN-001, spec §2
  - Adiciona compareUnits e sortUnits em unit-helpers.ts com comparação alfanumérica natural (9 < 10 < 11 < 101, Bloco A < Bloco B)
  - Aplica sortUnits em getUnidades (firestore.ts) e em filterUnits (unit-helpers.ts) garantindo ordem consistente em todos os pontos de consumo
  - Adiciona 7 testes unitários cobrindo ordenação numérica, imutabilidade do array original e filtragem com resultado ordenado
- [refactor] simplificação visual da aba Visão Geral da Síndica — Refs: RN-001, spec §2
  - Remove botão redundante "Nova Unidade" da barra de Ações Rápidas, mantendo foco nas rotinas de publicação e aprovação
  - Remove card de convite dos moradores com mini QR Code da coluna secundária da Visão Geral, eliminando poluição visual e centralizando o recurso na aba dedicada "Convites & QR Code"
  - Valida suíte de testes com 130 testes aprovados e compilação de produção bem-sucedida
- [fix] erradicação de popups nativos de navegador (confirm/alert) e adoção de modais e toasts integrados — Refs: RN-001, spec §2, spec §3
  - Remove 100% das chamadas a window.confirm e alert em SindicaView, OcorrenciaTimelineJanela e SindicaPanel
  - Implementa modais integrados com backdrop blur para confirmação de rotação de QR Code de convite, recusa de morador e homologação de encerramento de chamado
  - Implementa componente Toast/banner flutuante em SindicaView para feedbacks de sucesso, erro e status operacionais
  - Corrige importações no unit-helpers.test.ts elevando a suíte para 130 testes automatizados aprovados (0 falhas)
- [refactor] redesign de UX/UI do painel da Síndica com aba Visão Geral e desacoplamento de KPIs — Refs: RN-001, spec §2, spec §3
  - Centraliza os 4 KPIs macro executivos exclusivamente na nova aba inicial "Visão Geral", permitindo navegação contextual direta ao clicar em cada indicador
  - Remove a duplicação e persistência de KPIs fixos sobre as ferramentas de trabalho (Ocorrências, Mural, Unidades, Moradores, Aprovações, QR Code)
  - Implementa Hero Executivo com callouts de atenção imediata (aprovações pendentes e encerramentos a homologar) e barra de atalhos operacionais rápidos
  - Adiciona listas contextuais de chamados prioritários e último comunicado na Home para rápida tomada de decisão
  - Garante 100% de conformidade com os testes automatizados (115 testes aprovados) e build limpo
- [fix] sanitização e formatação universal de Timestamps Firestore evitando erro de objeto como filho React — Refs: RN-003, spec §3
  - Cria utilitário date-utils.ts com conversão resiliente de objetos {seconds, nanoseconds}, .toDate(), Date e strings ISO
  - Corrige regressão em OcorrenciaTimelineJanela onde formatarDataHora retornava o próprio objeto Timestamp para o React
  - Integra formatarDataHora e getTimestampMillis em SindicaView, MoradorView e firestore.ts garantindo retorno string em todos os elementos JSX
  - Adiciona suíte de testes unitários para date-utils totalizando 115 testes automatizados aprovados no projeto
- [feat] CRUD no Mural de Avisos e gestao completa de status e dados de Moradores — Refs: RN-001, spec §2, spec §3
  - Adiciona suporte completo a edição e exclusão de comunicados no Mural com componente NovaPublicacaoJanela adaptado
  - Implementa busca textual e filtros combinados por categoria e público-alvo no Mural de Avisos da síndica
  - Cria componente MoradorEditorJanela para edição cadastral de moradores, reatribuição de unidade e alteração de status
  - Implementa utilitários puros morador-helpers.ts e aviso-helpers.ts com filtros, métricas e configurações visuais
  - Atualiza firestore.rules para permitir exclusão segura de usuários pela síndica e realiza deploy automatizado no Firebase
  - Adiciona tratamento no DashboardView para exibição de tela de bloqueio quando morador for inativo ou rejeitado
  - Adiciona suítes de testes unitários para morador-helpers e aviso-helpers totalizando 109 testes com 100% de aprovação
- [feat] gestao completa de unidades, mural de comunicados segmentado e linha do tempo — Refs: RN-001, RN-003, spec §3
  - Adiciona gestão de unidades prediais pela síndica (criação, edição, exclusão segura e regerar grade)
  - Implementa Mural de Comunicados segmentado com opção geral (todos) ou por bloco específico para Síndica e Morador
  - Adiciona regras no Firestore para coleção avisos com deploy automatizado
  - Implementa componente modal OcorrenciaTimelineModal com trilha cronológica do atendimento
  - Adiciona suítes de testes unitários para unit-helpers, aviso-helpers e ocorrencia-helpers (61 testes passando)
  - Atualiza governança em .agents/AGENTS.md com deploy obrigatório de regras e incorporação permanente de skills
- [feat] triagem inteligente por IA em chamados e seletor visual de unidades — Refs: RN-003, spec §3
  - Remove campos manuais de categoria e urgência no formulário de ocorrência do morador (MoradorView)
  - Implementa módulo ai-triagem.ts com integração à API Groq (llama-3.1-8b-instant) e fallback heurístico determinístico
  - Persiste categoria, urgência, justificativa e flag triagemPorIA no documento do Firestore
  - Exibe justificativa e badges de prioridade (Alta, Média, Baixa) no painel de ocorrências da síndica (SindicaView)
  - Adiciona componente UnitSelector com busca em tempo real, agrupamento por andar e chips de bloco
  - Adiciona suítes de testes unitários para ai-triagem e unit-helpers com 100% de aprovação (32 testes totais)
- [feat] isolamento de dashboards por perfil, criacao direta de sindica e correcao de permissoes firestore — Refs: spec §2, RN-001
  - Adiciona visões dedicadas e isoladas: SuperAdminView, SindicaView e MoradorView
  - Adiciona suporte no SuperAdminView para criação direta de contas de síndica com senha inicial
  - Cria auth-helpers com validação de papéis e detecção prioritária de superadmin
  - Configura e faz deploy das Security Rules completas no Firestore para o projeto condominio-mvp-2026
  - Adiciona suíte de testes unitários para resolução de RBAC (12 testes passando)
- [feat] fluxo de convite duplo (Síndica + Morador) com QR Codes reais — Refs: nenhuma
  - Adiciona `codigoConviteSindica` e `codigoConviteMorador` ao criar condomínio
  - `getCondominioByInviteCode` valida o código e retorna o papel correspondente
  - `RegisterView` lê `?condoId=&invite=&role=` da URL e seta o role correto
  - `SuperAdminPanel` exibe link + QR Code para a síndica após criar o condomínio
  - `SindicaPanel` busca códigos reais do condomínio e permite rotacionar
  - Adiciona `updateCondominio` e `rotateInviteCode` em `src/lib/firestore.ts`
  - Removido `src/firebase.ts` duplicado (órfão, ninguém importava)
- [feat] feat: integra Groq API, corrige avisos de CSS e ajusta rota inicial (commit: bec90ea) — Refs: nenhuma
- [feat] feat: setup inicial de UI, Firebase, roteamento e regras de negocio (commit: 0568cae) — Refs: nenhuma
- [feat] Setup inicial do projeto React com Vite, TypeScript, Tailwind v3 e shadcn/ui — Refs: spec §1
- [feat] Configuração da conexão com o Firebase (Firestore/Auth) via variáveis de ambiente — Refs: spec §4
- [docs] Definição de regras de negócio (REGRAS_DE_NEGOCIO.md) e arquitetura de integração do Motor de Inteligência Artificial (Groq) — Refs: REGRAS_DE_NEGOCIO.md
- [feat] Roteamento ajustado para direcionar a rota raiz diretamente ao DashboardView — Refs: spec §1

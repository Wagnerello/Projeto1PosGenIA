# Changelog Técnico

Todas as alterações técnicas relevantes deste projeto são documentadas aqui, no momento em que ocorrem — antes e independentemente de qualquer decisão de release.

## [Unreleased]
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

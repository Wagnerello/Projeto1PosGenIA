# Sistema de Gestão Condominial com Triagem Inteligente via IA

> **Projeto 1 — Pós-Graduação em Engenharia de Inteligência Artificial**  
> Aplicação web para registro e gestão de ocorrências condominiais com classificação automática de urgência por IA e mural comunitário de avisos.

---

## 1. O que o projeto resolve?

Em condomínios residenciais e comerciais, o fluxo tradicional de comunicação de problemas (livros físicos na portaria, mensagens dispersas em aplicativos de mensagens ou e-mails) gera atrasos na triagem de incidentes críticos, falta de rastreabilidade para os moradores e sobrecarga na gestão da síndica e da equipe de manutenção.

Este projeto resolve esse gargalo através de:
- **Centralização do Livro de Ocorrências:** Canal unificado para moradores registrarem chamados com descrição detalhada e categorização.
- **Triagem e Priorização Inteligente com IA:** O texto da ocorrência é avaliado semanticamente por um modelo de IA via **Groq** (inferência de altíssima velocidade utilizando LLMs como Llama 3), que classifica o grau de urgência (**Baixa, Média, Alta ou Crítica**), permitindo que a administração atue prioritariamente em falhas graves (vazamentos, panes elétricas, segurança) antes de demandas rotineiras.
- **Controle de Acesso por Papéis (RBAC):**
  - **Morador:** Registra ocorrências da sua unidade e acompanha o histórico e status exclusivamente dos seus chamados, além de visualizar o Mural de Avisos.
  - **Síndica / Administração:** Visualiza todas as ocorrências com a urgência atribuída pela IA, altera status e publica comunicados oficiais no mural.
  - **Zelador / Portaria:** Acessa chamados operacionais para atualização de status conforme execução dos reparos.
- **Mural de Avisos Oficial:** Espaço em tempo real para avisos de manutenções preventivas, convocações de assembleias e informes gerais.

---

## 2. Como instalar e executar?

### Pré-requisitos
- **Node.js** (versão 18 LTS ou superior, recomendado Node.js 20+)
- **npm** (ou gerenciador de pacotes equivalente como yarn ou pnpm)

### Passo a passo de instalação

1. **Clonar o repositório:**
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd Projeto1PosEngIA
   ```

2. **Instalar as dependências:**
   ```bash
   npm install
   ```

3. **Configurar as variáveis de ambiente:**
   Crie um arquivo `.env` na raiz do projeto a partir do modelo `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Preencha as credenciais do seu projeto Firebase e a chave de API do Groq no arquivo `.env`:
   ```env
   VITE_FIREBASE_API_KEY="sua_api_key"
   VITE_FIREBASE_AUTH_DOMAIN="seu_projeto.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="seu_projeto_id"
   VITE_FIREBASE_STORAGE_BUCKET="seu_projeto.appspot.com"
   VITE_FIREBASE_MESSAGING_SENDER_ID="seu_sender_id"
   VITE_FIREBASE_APP_ID="seu_app_id"
   VITE_GROQ_API_KEY="gsk_sua_chave_groq"
   ```

4. **Executar em modo de desenvolvimento:**
   ```bash
   npm run dev
   ```
   A aplicação estará acessível em `http://localhost:5173`.

5. **Gerar build para produção:**
   ```bash
   npm run build
   ```
   Para testar o build localmente:
   ```bash
   npm run preview
   ```

---

## 3. Como rodar testes e validações?

O projeto possui esteira de qualidade com testes automatizados, verificação estática e gates de integridade técnica.

- **Executar a suíte de testes unitários (Vitest):**
  ```bash
  npm test
  ```

- **Executar testes em modo interativo / contínuo (Watch):**
  ```bash
  npx vitest
  ```

- **Executar a auditoria completa da esteira (SAST, Governança, Testes e Segurança):**
  ```bash
  npm run audit:all
  ```
  *(Ou diretamente via `node scripts/audit-esteira.mjs .`)*

- **Executar a análise estática de código (Linter):**
  ```bash
  npm run lint
  ```

### Mecanismos de Governança e Git Hooks (Husky)
- `pre-commit`: Executa testes automatizados e varredura estática antes de permitir a confirmação de código.
- `commit-msg`: Valida o padrão **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, etc.).
- `post-commit`: Atualiza automaticamente a memória técnica do projeto em `docs/CHANGELOG_TECH.md` na seção `[Unreleased]`.

---

## 4. Quais limites existem?

O escopo atual do MVP possui os seguintes limites técnicos e operacionais:

1. **Dependência de Conectividade com a API de IA:** A classificação automática de urgência depende da disponibilidade e latência do serviço do Groq Cloud. Caso haja indisponibilidade de rede ou erro na requisição, o chamado é registrado com status padrão pendente de triagem.
2. **Cotas de Requisição (Rate Limits do Groq):** O processamento de inferência está condicionado aos limites de requisições por minuto (RPM) e tokens por minuto (TPM) da camada de uso da API do Groq.
3. **Persistência Offline:** A sincronização de dados exige conexão ativa com o Firebase Firestore; operações offline com fila de sincronização em segundo plano não estão contempladas neste MVP.
4. **Armazenamento de Anexos Pesados:** A versão inicial prioriza dados textuais estruturados e categorização, não incluindo envio de vídeos em alta resolução no formulário de ocorrências.
5. **Regras de Segurança no Backend (Firestore Rules):** O isolamento estrito de dados entre moradores e administração depende da correta aplicação das regras de segurança configuradas no Firebase Console / CLI.

---

## 5. Como a IA foi usada no processo?

O uso de Inteligência Artificial ocorreu em duas frentes fundamentais:

### 5.1 No Produto (Runtime / Aplicação)
- **Motor de Classificação Semântica com Groq:** Utilização da infraestrutura de inferência ultra-rápida do **Groq** (com modelos LLM como Llama 3 / Mixtral) para Processamento de Linguagem Natural (PLN). A IA analisa a descrição da ocorrência enviada pelo morador, extrai as entidades contextuais de gravidade e classifica instantaneamente a urgência para guiar a atuação da equipe predial.

### 5.2 No Processo de Desenvolvimento (Engenharia e Governança)
- **Desenvolvimento Guiado por Especificação (Spec-Driven Development):** Arquitetura construída com base em documento de regras de negócio (`docs/REGRAS_DE_NEGOCIO.md`) e especificação de governança técnica.
- **Rastreabilidade e Memória Técnica:** Uso de agentes de IA para manutenção da memória técnica desacoplada (`docs/CHANGELOG_TECH.md`), automação de scripts de auditoria estática (`audit-esteira.mjs`) e geração de testes unitários anti-regressão.
- **Padronização e Qualidade de Código:** Refatoração, estruturação de componentes desacoplados com React + TypeScript e aplicação de políticas de escrita técnica objetiva (sem termos vagos ou clichês gerados por IA).

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Estilização e Componentes:** [Tailwind CSS v3](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/)
- **Backend & Database:** [Firebase](https://firebase.google.com/) (Authentication & Cloud Firestore)
- **Inteligência Artificial:** [Groq API](https://groq.com/) (LPU Inference Engine / Llama 3)
- **Testes & Qualidade:** [Vitest](https://vitest.dev/), [Testing Library](https://testing-library.com/), [Husky](https://typicode.github.io/husky/), [Commitlint](https://commitlint.js.org/), [Oxlint](https://oxc.rs/)

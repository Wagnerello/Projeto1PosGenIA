# Livro Digital de Ocorrências Condominiais com Triagem via IA

> Projeto 1 da Pós-Graduação em Engenharia de Inteligência Artificial.  
> Aplicação web para registro de ocorrências condominiais, classificação de urgência por modelos de linguagem e mural de comunicados.

---

## 1. O que o projeto resolve?

O registro de problemas prediais em cadernos de portaria ou mensagens soltas de aplicativos gera perda de histórico, atraso no atendimento de emergências e falta de retorno aos moradores.

A aplicação resolve esse problema com:
- **Registro unificado de chamados:** Moradores abrem ocorrências com título, descrição detalhada, categoria e acompanham o status em tempo real.
- **Classificação de urgência por IA:** O texto da ocorrência é enviado para modelos de linguagem (Groq Cloud/Llama 3 ou Google Gemini), que definem o nível de urgência (Baixa, Média ou Alta) e geram uma justificativa técnica curta para a equipe do condomínio. Caso a rede ou as APIs falhem, um mecanismo determinístico local assume a classificação com base em regras predefinidas.
- **Assistente para comunicados:** A administração digita um rascunho de aviso e seleciona o tom desejado (formal, educativo, firme, direto ou acolhedor). O sistema gera uma sugestão revisada usando Gemini ou Groq, mantendo um motor determinístico local como reserva.
- **Controle de acesso por papel:**
  - **Morador:** Registra chamados da própria unidade, consulta o histórico pessoal e lê os avisos do mural.
  - **Síndica / Administração:** Gerencia ocorrências filtradas por urgência, renomeia blocos com atualização em cascata, aprova novos moradores e publica avisos.
  - **Super Admin:** Cadastra condomínios, gera chaves de acesso, acompanha métricas operacionais e exporta links de cadastro com QR Code.
  - **Zelador / Portaria:** Visualiza as demandas do condomínio e altera o status das tarefas em execução.
- **Mural de comunicados:** Painel de recados oficiais para avisos de manutenção, regras e assembleias.
- **Navegação móvel dedicada:** Interface com menu lateral retrátil para gestão e barra de navegação inferior para moradores em telas pequenas.

---

## 2. Como instalar e executar?

### Pré-requisitos
- Node.js 18 LTS ou superior (recomendado 20+)
- npm 9 ou superior

### Instalação

1. Clone o repositório:
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd Projeto1PosEngIA
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   Crie o arquivo `.env` a partir do modelo `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Preencha as credenciais do Firebase, as chaves de API dos provedores de IA e o e-mail do administrador:
   ```env
   VITE_FIREBASE_API_KEY="sua_api_key"
   VITE_FIREBASE_AUTH_DOMAIN="seu_projeto.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="seu_projeto_id"
   VITE_FIREBASE_STORAGE_BUCKET="seu_projeto.appspot.com"
   VITE_FIREBASE_MESSAGING_SENDER_ID="seu_sender_id"
   VITE_FIREBASE_APP_ID="seu_app_id"
   VITE_GROQ_API_KEY="gsk_sua_chave_groq"
   VITE_GEMINI_API_KEY="sua_chave_gemini"
   VITE_SUPERADMIN_EMAIL="admin@empresa.com"
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   A aplicação roda por padrão em `http://localhost:5173`.

5. Gere o pacote de produção:
   ```bash
   npm run build
   ```
   Para testar a versão compilada localmente:
   ```bash
   npm run preview
   ```

---

## 3. Como rodar testes e validações?

O repositório possui suíte de testes unitários, análise estática e travas no Git para impedir envio de código quebrado:

- **Executar testes unitários (Vitest):**
  ```bash
  npm test
  ```
  Executa os 141 testes automatizados cobrindo regras de negócio, ordenação, sanitização e fallbacks.

- **Executar testes em modo contínuo (Watch):**
  ```bash
  npx vitest
  ```

- **Executar a auditoria completa da esteira:**
  ```bash
  npm run audit:all
  ```
  *(Equivalente a `node scripts/audit-esteira.mjs .`)*

- **Executar linter (ESLint 9):**
  ```bash
  npm run lint
  ```
  - Verificação com checagem de tipos: `npm run lint:types`
  - Verificação rápida via Oxlint: `npm run lint:ox`

### Travas no Git (Husky)
- `pre-commit`: Executa a suíte de testes e o linter antes de autorizar o commit.
- `commit-msg`: Valida se a mensagem segue o padrão Conventional Commits (`feat:`, `fix:`, `docs:`, etc.).
- `post-commit`: Insere o registro técnico da alteração em `docs/CHANGELOG_TECH.md` na seção `[Unreleased]`.

---

## 4. Quais limites existem?

1. **Dependência de conexão para chamadas de IA:** A classificação por modelos generativos exige internet e resposta das APIs externas (Groq ou Gemini). Quando houver falha de rede ou cota excedida, o sistema ativa o motor determinístico local.
2. **Limites de requisições (Rate Limits):** As chamadas estão restritas às cotas de RPM e TPM das chaves configuradas em cada provedor.
3. **Persistência estritamente online:** A aplicação grava e lê dados diretamente no Cloud Firestore. Não há fila local para sincronização posterior em modo offline.
4. **Restrição de anexos:** O formulário aceita dados textuais e campos estruturados, sem suporte para upload direto de arquivos de vídeo.
5. **Permissões no banco de dados:** O isolamento das informações entre moradores e condomínios depende das regras ativas em `firestore.rules`.

---

## 5. Como a IA foi usada no processo?

### 5.1 No Produto (Execução)
- **Classificação semântica de ocorrências:** Modelos Llama 3 (via Groq) analisam o texto para identificar a área do problema (Manutenção, Barulho, Segurança, Limpeza, Convivência) e estimar o nível de urgência operacional.
- **Refinamento de comunicados com dois provedores:** O sistema envia o rascunho da síndica para o Google Gemini ou para o Groq. Se o provedor principal falhar ou atingir limite de uso, o secundário é acionado automaticamente.
- **Sanitização de texto:** As entradas dos usuários passam por filtros de limpeza para remover caracteres de controle e mitigar tentativas de injeção de prompt antes do envio às APIs.

### 5.2 No Processo de Desenvolvimento
- **Desenvolvimento guiado por especificação:** O código foi implementado com base nos requisitos descritos em `docs/REGRAS_DE_NEGOCIO.md`.
- **Rastreabilidade técnica:** As modificações no código são registradas no arquivo `docs/CHANGELOG_TECH.md` de forma independente das notas de versão publicadas no `CHANGELOG.md`.
- **Prevenção de regressões:** 141 testes unitários validam cálculos, ordenação de blocos, restrições de formulário e contingências de erro.

---

## 6. Tecnologias Utilizadas

- **Frontend:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite 8](https://vitejs.dev/), [React Router](https://reactrouter.com/)
- **Estilização e Componentes:** [Tailwind CSS v3](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/), [QRCode.react](https://github.com/zpao/qrcode.react)
- **Backend e Autenticação:** [Firebase Authentication](https://firebase.google.com/), [Cloud Firestore](https://firebase.google.com/products/firestore)
- **Provedores de IA:** [Groq Cloud](https://groq.com/) (Llama 3), [Google Gemini API](https://ai.google.dev/)
- **Testes e Qualidade:** [Vitest](https://vitest.dev/), [Testing Library](https://testing-library.com/), [ESLint 9](https://eslint.org/), [Oxlint](https://oxc.rs/), [Husky](https://typicode.github.io/husky/), [Commitlint](https://commitlint.js.org/)

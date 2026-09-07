Aqui está o **roteiro exato de gravação (3 a 5 minutos)** para você seguir na sua demonstração técnica, baseado exatamente nos 5 tópicos do slide do professor:

---

### Visão Geral do Tempo (Meta: 4 minutos)
- **Minuto 0:00 a 0:45** — 1. Problema e Escopo
- **Minuto 0:45 a 1:30** — 2. Arquitetura Resumida
- **Minuto 1:30 a 2:15** — 3. Execução da API de IA
- **Minuto 2:15 a 3:30** — 4. Fluxo CRUD e Prioridade (Demo ao vivo)
- **Minuto 3:30 a 4:15** — 5. Evidência de Testes e Qualidade

---

### Passo a Passo da Gravação:

#### 1. Problema e Escopo (45 segundos)
* **O que mostrar:** A tela inicial da aplicação ou o README do repositório no GitHub.
* **O que falar:**
  > "O problema que atacamos é o fluxo caótico de comunicação de problemas em condomínios, tradicionalmente feito por livro de papel na portaria ou grupos de WhatsApp. Isso gera perda de histórico e atraso no atendimento de emergências.  
  > Nosso escopo foi delimitado como um **mini app web**: focado no Livro Digital de Ocorrências com triagem automática de urgência e mural oficial, sem inflar o projeto com módulos de boletos ou cobrança."

#### 2. Arquitetura Resumida (45 segundos)
* **O que mostrar:** O diagrama em tela cheia no navegador ([docs/arquitetura.html](file:///c:/Users/wagne/OneDrive/Área%20de%20Trabalho/IA2/Projeto1PósEngIA/docs/arquitetura.html) ou [docs/arquitetura.svg](file:///c:/Users/wagne/OneDrive/Área%20de%20Trabalho/IA2/Projeto1PósEngIA/docs/arquitetura.svg)).
* **O que falar:**
  > "Na arquitetura, o acesso segue uma hierarquia estrita de papéis (RBAC):
  > Começa no topo com o **Super Admin**, que faz a gestão multi-condomínio e gera os QR Codes; passa pela **Síndica**, responsável pela triagem de chamados, blocos e avisos; segue para a **Portaria e Zeladoria**, que acompanha a execução operacional; e chega ao nível mais atômico, o **Morador**, que registra os chamados da sua unidade.
  >
  > Essa hierarquia se conecta a três camadas:
  > 1. **Frontend:** React 19 com TypeScript, Vite e Tailwind CSS, incluindo sanitização de entradas contra injeção de prompt.
  > 2. **Camada de IA:** Arquitetura multi-provedor que prioriza Groq (Llama 3.1) para velocidade, possui fallback para Google Gemini e contingência em um motor determinístico local para tolerância a falhas offline.
  > 3. **Backend e Dados:** Firebase Authentication para gestão de sessão e Cloud Firestore com regras de segurança isolando os dados por condomínio."

#### 3. Execução da API (45 segundos)
* **O que mostrar:** O arquivo [`src/lib/ai-triagem.ts`](file:///c:/Users/wagne/OneDrive/Área%20de%20Trabalho/IA2/Projeto1PósEngIA/src/lib/ai-triagem.ts) no VS Code e a aba *Network* (Rede) no DevTools do navegador.
* **O que falar:**
  > "Aqui em `ai-triagem.ts`, a chamada de inferência envia o título e a descrição higienizados para o Groq (Llama 3). A IA retorna um JSON estrito contendo categoria, nível de urgência (Baixa, Média ou Alta) e uma justificativa técnica de até 15 palavras.  
  > Antes da requisição, aplicamos sanitização de texto para prevenir injeção de prompt. Se a API atingir limite de cota (HTTP 429 ou 403), o código aciona automaticamente nosso fallback determinístico local para a aplicação nunca travar."

#### 4. Fluxo CRUD e Prioridade na Prática (1 minuto e 15 segundos)
* **O que mostrar:** A aplicação rodando no navegador (`localhost:5173`).
* **O que fazer e falar:**
  1. **Abertura de Chamado (Morador):**  
     - Clique em "Nova Ocorrência".
     - Digite um caso grave: *"Cano principal estourou na garagem do subsolo e está alagando"* e envie.
     - Mostre na tela: a ocorrência é salva no Firestore e classificada na hora como urgência **Alta** (com badge vermelho e o parecer técnico gerado).
  2. **Gestão e Resolução (Síndica):**  
     - Alterne para a visão da Síndica.
     - Mostre o chamado filtrado no topo da fila de atendimento por ordem de prioridade.
     - Altere o status de "Pendente" para "Em Atendimento" e depois "Resolvido" (comprovando o CRUD completo).
  3. **Mural com IA:**  
     - Mostre a criação rápida de um comunicado institucional onde a IA ajusta o tom do aviso (formal/educativo) antes de publicar.

#### 5. Evidência de Testes (45 segundos)
* **O que mostrar:** O terminal integrado no VS Code.
* **O que fazer e falar:**
  - Execute ao vivo no terminal:
    ```bash
    npm test
    ```
  - Aponte para o resultado na tela:
    > "Como evidência da garantia de qualidade, temos **141 testes unitários automatizados** rodando com Vitest, cobrindo 100% das regras de negócio, ordenações em cascata, sanitização de inputs e fallbacks de IA."
  - Execute em seguida:
    ```bash
    npm run audit:all
    ```
    > "Também executamos a auditoria estática da esteira, integrada a travas de `pre-commit` no Husky que bloqueiam qualquer commit com código quebrado."
  - Encerre:
    > "Com isso, concluímos o ciclo de empacotamento, documentação técnica no README e validação do projeto."

---

### Dicas práticas para a gravação:
1. **Deixe o terminal e o navegador já abertos:** Rode `npm run dev` antes de iniciar a gravação para não perder tempo esperando carregar.
2. **Deixe um morador e uma síndica já logados:** (pode usar uma janela normal e uma janela anônima para alternar rápido entre os papéis).
3. **Não improvise no tempo:** Siga esses 5 passos pontuais; o vídeo ficará entre 3:30 e 4:30 minutos, dentro da faixa exata solicitada pelo professor.
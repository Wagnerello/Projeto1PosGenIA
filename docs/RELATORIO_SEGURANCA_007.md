# Relatório de Auditoria e Hardening de Segurança — 007

**Data:** 07/09/2026  
**Sistema:** Plataforma de Gestão Condominial (React 19 + TypeScript + Vite + Firebase Firestore + Google AI Studio / Groq API)  
**Metodologia:** Skill 007 (STRIDE + OWASP Top 10 + Red/Blue Team + Matriz Quantitativa)

---

## 1. Resumo do Sistema

O sistema é uma Single Page Application (SPA) para gestão condominial que orquestra três papéis principais de acesso (Super Admin, Síndica e Moradores/Portaria), com persistência em nuvem (Firebase Firestore) e inteligência artificial generativa em tempo de execução (Groq Llama 3 e Google Gemini 3.5/3.1 Flash) para triagem automática de ocorrências e refinamento de comunicados institucionais.

### Escopo Auditado
1. **Controle de Acesso e RBAC**: Regras do Firestore (`firestore.rules`), resolução de papéis em cliente (`src/lib/auth-helpers.ts`) e contexto de autenticação (`src/contexts/AuthContext.tsx`).
2. **Camada de Dados e Isolamento Multi-inquilino**: Coleções `condominios`, `users`, `ocorrencias`, `avisos` e subcoleção `unidades`.
3. **Módulos de Inteligência Artificial**: `src/lib/ai-triagem.ts` e `src/lib/ai-comunicado.ts` contra Prompt Injection, abuso de payload e vazamento de prompt do sistema.
4. **Armazenamento e Trânsito de Segredos**: Arquivos `.env`, `.env.example`, bundles compilados no Vite e histórico Git.
5. **Dependências da Aplicação**: Vulnerabilidades conhecidas de supply-chain via `npm audit`.

---

## 2. Mapa de Superfície de Ataque

```
[ Usuário / Atacante Web ]
           │
           ├── (1) Cadastro / Login (Firebase Auth)
           │
           ├── (2) Manipulação de Documentos (Firestore Direct SDK)
           │       ├── /users/{uid} ── [VETOR DE ESCALAÇÃO DE PRIVILÉGIO]
           │       ├── /condominios/{id} ── [CONSULTA DE CÓDIGOS DE CONVITE]
           │       ├── /ocorrencias/{id} ── [TRIAGEM E COMENTÁRIOS]
           │       └── /avisos/{id} ── [MURAL DO CONDOMÍNIO]
           │
           └── (3) Chamadas Diretas de IA pelo Navegador (Frontend Client Fetch)
                   ├── api.groq.com (Bearer Token exposto no cliente)
                   └── generativelanguage.googleapis.com (API Key na Query String)
```

### Limites de Confiança (Trust Boundaries)
- **Frontend SPA ↔ Provedores de LLM**: O frontend atualmente consome diretamente as chaves de API (`VITE_GROQ_API_KEY`, `VITE_GEMINI_API_KEY`) para realizar inferência em tempo de execução no cliente.
- **Frontend SPA ↔ Firebase Firestore**: Todas as escritas e leituras passam exclusivamente pelas `firestore.rules`. O cliente nunca deve ditar regras de segurança por conta própria.

---

## 3. Vulnerabilidades Encontradas e Status

| # | Severidade | Vulnerabilidade | Vetor | Impacto | Status |
|---|------------|-----------------|-------|---------|--------|
| **01** | **ALTA** | Escalação de Privilégio no Firestore (`users/{userId}`) | Chamada `setDoc`/`updateDoc` direta pelo SDK client permitia o usuário alterar seu próprio campo `role` | Morador comum podia se promover a `sindica` ou `superadmin` | **CORRIGIDO E DEPLOYADO** |
| **02** | **MÉDIA** | Falta de Sanitização / Prompt Injection em LLM | Inputs maliciosos em títulos/descrições de chamados ou avisos (`ai-triagem.ts` e `ai-comunicado.ts`) | Jailbreak do motor de IA, falha de classificação ou custos excessivos de inferência | **CORRIGIDO COM TESTES** |
| **03** | **ALTA** | Chaves de Provedores de IA Expostas no Frontend | Bundles SPA (`dist/assets/*.js`) contêm as chaves `VITE_GROQ_API_KEY` e `VITE_GEMINI_API_KEY` | Qualquer usuário técnico pode inspecionar o bundle e roubar a cota/chave das APIs | **REQUER ATENÇÃO (BFF)** |
| **04** | **MÉDIA** | E-mail Super Admin Hardcoded em Código Aberto | E-mail explícito `wagnertecnoia@gmail.com` no código e nas regras | Enumeration e phishing direcionado contra o administrador mestre | **REQUER ATENÇÃO** |
| **05** | **BAIXA** | Código de Convite da Síndica Exposto na Leitura de Condomínio | `allow read: if true` na coleção `condominios` permite leitura de `codigoConviteSindica` | Visitante que conheça o ID do condomínio pode obter o código de acesso de síndica | **REQUER ATENÇÃO** |

---

## 4. Threat Model (STRIDE)

| Categoria STRIDE | Componente | Risco Específico | Mitigação Aplicada / Recomendada |
|------------------|------------|------------------|-----------------------------------|
| **Spoofing** | Cadastro de Moradores | Invasor forjar ser morador de uma unidade sem aprovação | Mantida a fila de liberação de acesso com status `pending` sob aprovação obrigatória da síndica. |
| **Tampering** | Firestore Rules (`users`) | Usuário autenticado modificar seu próprio perfil para `role: "sindica"` | **Blindado nas regras do Firestore**: O usuário comum não tem mais permissão de alterar o atributo `role`. |
| **Repudiation** | Ações de Exclusão e Modificação | Exclusão de condomínios ou expulsão de moradores sem log de auditoria imutável | Recomendada a criação de coleção `/audit_logs` imutável com Cloud Functions. |
| **Information Disclosure** | Chaves de IA no Client | Extração de tokens de terceiros inspecionando o Network do navegador | Recomendado criar rotas de Backend-for-Frontend (Cloud Function / API Route) para manter as chaves em servidor. |
| **Denial of Service** | Consumo de LLM | Usuário malicioso submeter strings de 100KB em chamados para exaurir cota do Groq/Gemini | **Blindado**: Implantação de `input-sanitizer.ts` cortando strings em tamanhos seguros antes da chamada. |
| **Elevation of Privilege** | Registro de Usuário | Atacante enviar payload com privilégios administrativos no auto-cadastro | **Blindado**: Regras do Firestore rejeitam cadastros que não iniciem com perfil legítimo (`pending`). |

---

## 5. Correções Imediatas Implementadas Nesta Sessão

1. **Hardening Rigoroso no `firestore.rules`**:
   - Bloqueada a alteração do atributo `role` pelo próprio usuário autenticado. Somente o `superadmin` ou a `sindica` do condomínio correspondente podem alterar status/papéis de terceiros.
   - Restrito o `create` em `/users/{userId}`: apenas papéis legítimos de entrada (`pending` ou fluxo de convite de síndica) são aceitos.
   - **Deploy efetuado com sucesso** em produção (`npx firebase deploy --only firestore:rules`).

2. **Módulo de Defesa em Profundidade (`src/lib/input-sanitizer.ts`)**:
   - Remoção de caracteres de controle ASCII perigosos.
   - Truncamento rígido de tamanho de entrada para evitar estouro de tokens em LLMs.
   - Detecção e neutralização de padrões comuns de *Prompt Injection* (ex: "ignore previous instructions", "modo DAN", delimitadores de markdown).
   - Suíte de testes unitários dedicada (`src/lib/input-sanitizer.test.ts`) integrada e passando 100%.

3. **Integração do Sanitizador aos Motores de IA**:
   - `src/lib/ai-triagem.ts`: Sanitização de títulos e descrições antes do envio ao Llama 3 (Groq).
   - `src/lib/ai-comunicado.ts`: Higienização de mensagens antes do envio ao Gemini ou Groq.

4. **Correção de Tipagem e Sintaxe de Produção**:
   - Resolvida a pendência de desestruturação em `SindicaGeralTab.tsx` garantindo que `npm run build` (tsc + vite) passe 100% sem falhas.

---

## 6. Coisas que Precisam de Atenção para Serem Melhoradas (Recomendações Futuras)

As seguintes melhorias requerem decisões de arquitetura ou infraestrutura de backend:

### 1. Migração das Chamadas de IA para Cloud Functions (Backend-For-Frontend - BFF)
- **Problema**: Atualmente as chaves `VITE_GROQ_API_KEY` e `VITE_GEMINI_API_KEY` trafegam no código cliente. Qualquer usuário que inspecione a aba *Sources* ou o tráfego HTTP do navegador pode copiar essas chaves.
- **Melhoria recomendada**: Mover `classificarOcorrenciaComIA` e `refinarComunicadoComIA` para uma Firebase Cloud Function (ex: `/api/triagem` e `/api/comunicado`). O frontend faz uma requisição autenticada com Firebase Auth Token para a função, que então consome as chaves secretas armazenadas no Google Cloud Secret Manager.

### 2. Segregação do Código de Convite da Síndica
- **Problema**: A regra atual permite leitura pública de `condominios/{condoId}` (`allow read: if true;`) para que o convidado valide o nome do condomínio. Contudo, o documento do condomínio armazena tanto o `codigoConviteMorador` quanto o `codigoConviteSindica`.
- **Melhoria recomendada**: Mover os códigos de convite para uma subcoleção privada (`/condominios/{condoId}/segredos/convites`) ou usar uma Cloud Function para validação de código, evitando expor o código da administração para quem só possui o link de morador.

### 3. Remoção Completa de E-mails Hardcoded em Código
- **Problema**: O e-mail `wagnertecnoia@gmail.com` está fixado como fallback no código e em `firestore.rules`.
- **Melhoria recomendada**: Utilizar Firebase Custom Claims para definir o papel `superadmin` diretamente no token JWT de autenticação (`request.auth.token.superadmin == true`), eliminando qualquer dependência de verificação por string de e-mail.

### 4. Criação de Coleção de Auditoria Imutável (`audit_logs`)
- **Problema**: Operações críticas como exclusão de condomínios, exclusão de moradores e alteração de blocos em lote geram alterações imediatas sem histórico indelével.
- **Melhoria recomendada**: Criar uma coleção `/audit_logs` no Firestore configurada como *append-only* (`allow create: if isAuthenticated(); allow update, delete: if false;`) para registrar autor, data, IP e operação realizada em ações sensíveis.

---

## 7. Scoring Quantitativo de Segurança (007)

| Domínio | Peso | Nota (0-100) | Nota Ponderada |
|---------|------|--------------|----------------|
| **Segredos & Credenciais** | 20% | 75 | 15.0 |
| **Input Validation** | 15% | 95 | 14.25 |
| **Autenticação & Autorização** | 15% | 90 | 13.5 |
| **Proteção de Dados & Multi-tenant** | 15% | 85 | 12.75 |
| **Resiliência & Fallbacks** | 10% | 95 | 9.5 |
| **Monitoramento & Audit Trail** | 10% | 70 | 7.0 |
| **Supply Chain & Dependências** | 10% | 100 | 10.0 |
| **Compliance (OWASP / LGPD)** | 5% | 85 | 4.25 |
| **TOTAL** | **100%** | — | **86.25 / 100** |

---

## 8. Veredito Final

**Veredito:** **APROVADO COM RESSALVAS (Score: 86.25/100)**

**Justificativa Técnica:**  
As vulnerabilidades críticas de autorização no banco de dados (escalação de privilégios via Firestore) e os riscos imediatos de Prompt Injection / DoS por payload excessivo nas rotinas de IA foram integralmente corrigidos, testados com suíte unitária automatizada e validados em compilação e deploy das regras em produção.  
O sistema é seguro para operação, com a ressalva documentada de que as chaves de API de terceiros (Groq/Gemini) devem ser encapsuladas em um Backend-for-Frontend (Firebase Cloud Functions) na próxima evolução arquitetural da esteira para prevenir abuso de cota externa.

# Roteiro de Vídeo Faceless (Demo Técnica com IA)

> **Duração Total Estimada:** 4 minutos e 15 segundos (Limite máximo da banca: 5 minutos)  
> **Gerador de Imagens:** Google Gemini / Google Imagen / ImageFX / Google Flow (Prompts em linguagem natural otimizados para o modelo de imagem do Google).  
> **Voz de IA (TTS):** ElevenLabs, Clipchamp, CapCut ou Gemini Voice.

---

## Tabela de Cronometragem (Timestamps)

| Cena | Etapa | Início | Fim | Duração | Foco Visual |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Cena 1** | 1. Problema e Escopo | 00:00 | 00:45 | 45s | Contraste: Livro de papel vs App móvel |
| **Cena 2** | 2. Arquitetura Resumida | 00:45 | 01:30 | 45s | Diagrama de camadas e hierarquia RBAC |
| **Cena 3** | 3. Execução da API e Resiliência | 01:30 | 02:20 | 50s | Código da API, Sanitização e Fallback |
| **Cena 4** | 4. Fluxo CRUD e Prioridade | 02:20 | 03:35 | 1m 15s | Telas reais: Morador, Síndica e Mural |
| **Cena 5** | 5. Evidência de Testes e Governança | 03:35 | 04:15 | 40s | Terminal com 141 testes e esteira Husky |

---

## Cena 1: Problema e Escopo (00:00 - 00:45 | 45 segundos)

### Visual da Cena:
- Alternância entre a imagem gerada pelo Gemini (mostrando a dor do livro físico) e captura de tela real da tela de login do app (`http://localhost:5173`).

### Prompt Otimizado para o Google Gemini / Imagen:
> Uma fotografia profissional e cinematográfica em proporção widescreen 16:9, ângulo fechado sobre o balcão de madeira de uma portaria de condomínio residencial. Em primeiro plano, um caderno de papel antigo e desgastado, aberto com anotações manuais e papéis de recados colados. Ao lado do caderno, um smartphone moderno apoiado exibindo na tela uma interface limpa de aplicativo móvel com um botão azul de Nova Ocorrência. Iluminação realista e quente de ambiente interno, profundidade de campo suave com o fundo desfocado, estilo fotográfico autêntico e sem textos ilegíveis.

### Texto para a Voz de IA (Locução):
> "Em condomínios residenciais, o registro de problemas prediais costuma ser caótico: livros físicos de papel na portaria ou dezenas de mensagens perdidas em grupos de WhatsApp. O resultado é a perda de histórico, sobrecarga da administração e atraso no atendimento de emergências como vazamentos e panes elétricas.  
> Para resolver esse gargalo, desenvolvemos o Livro Digital de Ocorrências com Triagem via IA. Delimitamos o escopo estritamente como um mini aplicativo focado em dois fluxos centrais: o registro imediato de chamados com classificação automática de urgência e um mural oficial para comunicados da síndica, sem o inchaço de módulos financeiros ou boletos."

---

## Cena 2: Arquitetura Resumida (00:45 - 01:30 | 45 segundos)

### Visual da Cena:
- Exibir a página do diagrama em tela cheia (`docs/arquitetura.html` ou `docs/arquitetura.svg`), dando zoom suave da hierarquia superior (Super Admin) descendo pelas camadas de Frontend, IA e Backend.

### Prompt Otimizado para o Google Gemini / Imagen (Card Conceitual de Transição):
> Ilustração 3D isométrica e futurista em proporção widescreen 16:9, representando a arquitetura de um sistema em nuvem moderno em modo escuro. Mostra quatro níveis de acesso conectados em fluxo vertical: ícones elegantes representando Super Admin, Síndico, Portaria e Moradores com smartphones. Esses usuários se conectam a uma interface web limpa, que se comunica com um nó central de inteligência artificial emitindo luz suave em tons de ciano e magenta, ligado a um banco de dados seguro na nuvem. Renderização 3D minimalista, estilo tech corporativo de alto nível, iluminação volumétrica elegante.

### Texto para a Voz de IA (Locução):
> "A arquitetura do sistema foi desenhada em torno de uma hierarquia estrita de controle de acesso. No topo, o Super Admin faz a gestão multi-condomínio e gera os convites com QR Code. Abaixo, a Síndica gerencia blocos, aprovações e triagem. A Portaria atua no acompanhamento operacional dos reparos, e, no nível mais atômico, o Morador registra as demandas da sua unidade.  
> Essa hierarquia opera sobre três camadas técnicas: um frontend em React 19 com TypeScript e Vite, projetado para uso móvel; uma camada de IA resiliente com chaveamento entre Groq e Gemini mais um motor determinístico local; e o backend na nuvem com Firebase Authentication e Cloud Firestore, com isolamento estrito de dados garantido por regras de segurança."

---

## Cena 3: Execução da API e Resiliência (01:30 - 02:20 | 50 segundos)

### Visual da Cena:
- Gravação de tela do VS Code aberta em `src/lib/ai-triagem.ts`, mostrando a chamada de inferência, a sanitização contra prompt injection e a função de fallback local.

### Prompt Otimizado para o Google Gemini / Imagen (Card de Segurança e IA):
> Imagem conceitual cinematográfica em proporção 16:9, interface de programação moderna em tema escuro com estética limpa. Um escudo digital translúcido e brilhante em tom âmbar e azul protege um fluxo de dados de texto que entra em um processador neural de inteligência artificial. Na tela de código estilizada ao fundo, é possível ver uma estrutura de validação JSON com as palavras 'Baixa', 'Média' e 'Alta' destacadas em tags sutis e elegantes. Composição sofisticada, visual de engenharia de software de ponta, sem elementos poluídos.

### Texto para a Voz de IA (Locução):
> "Na execução da inteligência artificial, o chamado do morador passa primeiro por um sanitizador de texto para neutralizar potenciais ataques de injeção de prompt. Em seguida, a requisição é enviada à API do Groq Cloud utilizando o modelo Llama 3.1, configurado para responder exclusivamente em JSON estruturado com categoria, nível de urgência e uma justificativa técnica sucinta.  
> Para que a aplicação nunca trave em produção, implementamos resiliência em camadas: caso o Groq atinja limites de cota ou erro de rede, o sistema tenta automaticamente a API do Google Gemini. Se a conexão falhar completamente, entra em ação um motor heurístico determinístico local, classificando o chamado no próprio navegador com base em regras de segurança e criticidade."

---

## Cena 4: Fluxo CRUD e Prioridade na Prática (02:20 - 03:35 | 1m 15s)

### Visual da Cena (Gravações de Tela da Aplicação Real em `localhost:5173`):
1. **[02:20 - 02:45] Visão do Morador:** Preenchimento de chamado grave (*"Cano rompido na garagem, água subindo"*) e exibição imediata do badge vermelho de urgência Alta com o parecer da IA.
2. **[02:45 - 03:10] Visão da Síndica:** Chamado prioritário no topo da fila, transição de status para *Em Atendimento* e depois *Resolvido*.
3. **[03:10 - 03:35] Mural de Comunicados:** Síndica criando aviso e clicando no botão para a IA refinar o tom do texto.

### Prompt Otimizado para o Google Gemini / Imagen (Se desejar B-Roll de transição):
> Fotografia realista em proporção 16:9 em primeira pessoa segurando um smartphone moderno. Na tela do celular, vê-se a interface de um aplicativo limpo de condomínio em tema escuro com um cartão de alerta em destaque contendo o selo vermelho 'Urgência Alta' e um botão de confirmação. Ao fundo, o corredor bem iluminado de um edifício residencial moderno com acabamento em concreto e madeira, iluminação natural suave, realismo fotográfico impecável.

### Texto para a Voz de IA (Locução):
> "Na prática, o fluxo começa quando o morador abre o aplicativo e relata um incidente, como um cano rompido com alagamento. Ao enviar, a inferência roda em segundo plano e classifica o chamado imediatamente como urgência Alta, exibindo o parecer técnico na linha do tempo.  
> Na central da síndica, a ocorrência entra com destaque no topo da fila de atendimento. A administração atualiza o status de pendente para em atendimento e concluído, fechando o ciclo completo do chamado.  
> Além do livro de ocorrências, a administração conta com o mural comunitário. Ao redigir um aviso, a síndica pode selecionar o tom institucional desejado, formal ou educativo, e a IA faz a revisão ortográfica e estilística do comunicado antes da publicação oficial."

---

## Cena 5: Evidência de Testes e Governança (03:35 - 04:15 | 40 segundos)

### Visual da Cena:
- Gravação do terminal rodando `npm test` (mostrando os 141 testes unitários passando em verde) e `npm run audit:all` (100% OK), finalizando no arquivo `docs/CHANGELOG_TECH.md`.

### Prompt Otimizado para o Google Gemini / Imagen (Card de Encerramento):
> Imagem cinematográfica de tela de monitor ultrawide em formato 16:9, exibindo um terminal de desenvolvedor com tema escuro. Linhas de código e relatórios de testes automatizados com múltiplos marcadores verdes de verificação 'Passou', com um selo sutil de auditoria e qualidade de engenharia no canto. Ambiente de trabalho minimalista com teclado mecânico sutilmente iluminado em azul suave, atmosfera de precisão técnica e maturidade de software.

### Texto para a Voz de IA (Locução):
> "A confiabilidade da aplicação é garantida por uma esteira com 141 testes unitários automatizados rodando com Vitest, cobrindo regras de negócio, ordenação de unidades, sanitização de dados e as contingências de IA.  
> Antes de qualquer confirmação de código, travas de pré-commit no Husky executam a suíte completa e barram alterações com falhas. Cada mudança é registrada na memória técnica do projeto em nosso changelog técnico.  
> Dessa forma, entregamos um mini app enxuto, testado contra regressões e preparado para o ambiente operacional de condomínios."

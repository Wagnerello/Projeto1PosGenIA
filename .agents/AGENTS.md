# Regras de Governança de Commit, Memória Técnica, Versionamento e Changelog

<RULE[commit_and_changelog_policy]>
1. **NUNCA EXECUTAR COMMIT OU PUSH AUTOMATICAMENTE**:
   - É estritamente proibido realizar git commit ou git push por iniciativa própria ou atos de proatividade.
   - O commit e push somente devem ser executados quando o USUÁRIO pedir ou der o comando explícito (ex: "faça o commit", "pode commitar").

2. **CONVENTIONAL COMMITS OBRIGATÓRIO**:
   - Toda mensagem de commit DEVE seguir o padrão Conventional Commits: `<tipo>(<escopo opcional>): <descrição curta>`.
   - Tipos permitidos: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `security`, `ci`.
   - O hook `commit-msg` (commitlint) bloqueia qualquer commit fora do padrão. Ver Seção 5.

3. **MEMÓRIA TÉCNICA É INDEPENDENTE DE VERSIONAMENTO**:
   - Todo commit, COM OU SEM bump de versão, gera obrigatoriamente uma entrada em `docs/CHANGELOG_TECH.md`, na seção `## [Unreleased]`.
   - Essa entrada é gerada automaticamente pelo hook `post-commit` (Seção 5) a partir da mensagem de commit, arquivos alterados e, se aplicável, referência a `RN-XXX` / `REQ-SXX` / seção do `SYSTEM_SPEC.md`.
   - Esta etapa NUNCA é opcional e NUNCA depende de decisão do usuário. A decisão do usuário afeta apenas o corte de release (item 4), nunca o registro do que foi feito.

4. **PERGUNTA OBRIGATÓRIA SOBRE CORTE DE RELEASE (NÃO SOBRE REGISTRO)**:
   - Sempre que o usuário solicitar um commit, a IA deve perguntar se aquele commit também deve **cortar uma release** (promover o conteúdo de `## [Unreleased]` para uma nova versão SemVer + `CHANGELOG.md` de negócio) ou se deve permanecer acumulando em `## [Unreleased]` para uma release futura.
   - Se o usuário optar por não cortar release, a entrada técnica already gerada no item 3 permanece em `## [Unreleased]` — nada é perdido, apenas o lançamento formal é adiado.

5. **FLUXO DE LANÇAMENTO (CORTE DE RELEASE), AUDITORIA DE SEGURANÇA E ATUALIZAÇÃO DO CHANGELOG**:
   - Toda alteração de versão (bump version) se dá exclusivamente no momento em que o usuário decide cortar uma release.
   - **AUDITORIA DE SEGURANÇA OBRIGATÓRIA (SECURITY GATE)**:
     - Antes de qualquer commit e push, é obrigatório executar a suíte completa de testes e a auditoria estática (`npm run audit:all` ou `node scripts/audit-esteira.mjs .`).
     - A análise deve verificar:
       a) Suíte completa de testes unitários passando 100% sem erros (`npm test`).
       b) Regras de acesso e autorização (Firestore/SQL Security Rules, RBAC, controle de papéis).
       c) Exposição de segredos, tokens ou chaves de API (checagem automatizada por regex + `git-secrets`).
       d) Validação de dados de entrada, injeções e vetores de escalada de privilégios.
       e) Imutabilidade de logs de auditoria e consistência de integridade.
       f) `npm audit --audit-level=high` sem vulnerabilidades pendentes.
     - Se houver qualquer vulnerabilidade ou teste quebrado, o problema DEVE ser corrigido e validado antes de prosseguir com o commit.
   - Ao cortar uma release:
     a) Realizar e aprovar a suíte de testes unitários e a Auditoria de Segurança obrigatória.
     b) Incrementar a versão no `package.json` seguindo SemVer (MAJOR, MINOR, PATCH ou pré-release — ver Seção 4.4).
     c) Promover todo o conteúdo de `docs/CHANGELOG_TECH.md` (`## [Unreleased]`) para uma nova seção `## [vX.Y.Z] - AAAA-MM-DD` no mesmo arquivo, preservando a granularidade técnica.
     d) Traduzir esse conteúdo técnico para linguagem amigável de negócio e escrever o topo do `CHANGELOG.md` com a nova versão, a data do dia e a descrição dos recursos.
     e) Reabrir uma seção `## [Unreleased]` vazia em `docs/CHANGELOG_TECH.md` para os próximos commits.
     f) Somente após os passos acima e da aprovação de segurança/testes, executar o `git commit` e `git push`.
     g) Disparar `python context_manager.py save` para gerar o snapshot de sessão vinculado à release.
</RULE[commit_and_changelog_policy]>

<RULE[technical_memory_policy]>
1. **`docs/CHANGELOG_TECH.md` É FONTE DE VERDADE TÉCNICA, NÃO NEGOCIÁVEL**:
   - Este arquivo é a memória técnica primária do projeto e existe independentemente de haver releases.
   - Nenhum commit é considerado completo sem uma entrada correspondente em `## [Unreleased]`.
2. **FORMATO OBRIGATÓRIO DA ENTRADA**:
   ```
   - [<tipo>] <descrição técnica objetiva> (commit: <hash curto>) — Refs: <RN-XXX | REQ-SXX | spec §N | nenhuma>
   ```
3. **PROIBIDO REESCREVER OU APAGAR HISTÓRICO**:
   - Entradas já promovidas para uma versão (`## [vX.Y.Z]`) nunca são editadas ou removidas retroativamente.
   - Correções sobre releases anteriores geram nova entrada (`fix`) referenciando a versão corrigida, nunca alteram o passado.
</RULE[technical_memory_policy]>

<RULE[unit_testing_and_anti_regression_policy]>
1. **TESTES UNITÁRIOS OBRIGATÓRIOS A CADA NOVA IMPLEMENTAÇÃO**:
   - Toda nova funcionalidade, novo hook, novo utilitário, novo endpoint/schema ou correção de bug DEVE obrigatoriamente vir acompanhada de testes unitários automatizados (`*.test.ts` / `*.spec.ts`).
   - Os testes devem cobrir tanto o fluxo principal (caminho feliz) quanto casos de borda (*edge cases*, valores nulos, strings vazias, falhas de rede, limites numéricos).

2. **PROTEÇÃO ANTI-REGRESSÃO ESTREITA**:
   - NUNCA submeter alterações no código-fonte sem antes rodar a suíte completa de testes com `npm test`. O hook `pre-commit` enforça isso mecanicamente.
   - Se uma nova alteração quebrar qualquer teste unitário pré-existente, a alteração é considerada INVÁLIDA até que a regressão seja corrigida ou o teste seja adaptado justificadamente.
</RULE[unit_testing_and_anti_regression_policy]>

<RULE[human_copywriting_and_anti_slop_policy]>
1. **PROIBIDO USO DE CLICHÊS E VÍCIOS DE ESCRITA DE IA (ANTI-AI SLOP)**:
   - Em Landing Pages, modais, banners, Onboarding, `CHANGELOG.md` (negócio), documentações de regras de negócio (`docs/REGRAS_DE_NEGOCIO.md`) e microcopy de UI, a IA NUNCA deve usar escrita robótica, empolgação falsa ou clichês corporativos vazios.
   - **Termos banidos**: "robusto", "ecossistema inovador", "revolucionário", "divisor de águas", "virada de chave", "fomentar", "desvendar", "mergulhar fundo", "empoderar", "alavancar", "leverage", "delve", "streamline", "cutting-edge".
   - **Exceção explícita**: `docs/CHANGELOG_TECH.md` é um artefato técnico interno, não literário. Suas entradas devem ser objetivas e telegráficas.
</RULE[human_copywriting_and_anti_slop_policy]>

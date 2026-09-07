# Changelog

## [1.1.3] - 2026-09-07

### Melhorias de Usabilidade e Interface
- **Painel do Morador sem redundâncias:** Eliminado o bloco intermediário que repetia as informações do morador e os botões de ação logo abaixo do cabeçalho, trazendo a lista de chamados e o mural para a primeira dobra de tela.
- **Ações claras e centralizadas:** Unificado o botão de "Nova Ocorrência" e adicionado botão de atualização geral no topo da página, removendo botões de recarregamento duplicados no histórico e no mural.
- **Formulário de chamado mais direto e prático:** Substituídos jargões e explicações técnicas sobre inteligência artificial por orientações objetivas sobre o fluxo de atendimento da administração e dicas para descrever o problema.
- **Trilha de ocorrência com parecer neutro:** O parecer da triagem agora é apresentado em formato institucional e discreto, com foco no acompanhamento das vistorias e providências adotadas pela equipe predial.

---

## [1.1.2] - 2026-09-07

### Melhorias de Usabilidade e Interface
- **Painel Super Admin organizado por abas:** A tela inicial agora separa a lista de condomínios do formulário de cadastro, permitindo consultar e gerenciar bases sem rolagens excessivas.
- **Métricas operacionais reais:** Removidos cartões com status puramente decorativos, mantendo contadores diretos de condomínios totais, síndicos ativos e convites pendentes.
- **Ações rápidas na tabela de condomínios:** Adicionados botões para copiar com um clique o código de convite da síndica, o código de mural de moradores e o link direto de cadastro.
- **Busca dinâmica de condomínios:** O campo de busca localiza instantaneamente condomínios por nome, CNPJ, síndico ou código de convite, com contador dinâmico e opção de limpar o filtro.
- **Cadastro com exibição limpa de credenciais:** O fluxo de cadastro agora exibe um painel de conclusão com as credenciais geradas da administração e o QR Code dos moradores pronto para compartilhamento.

---

## [1.1.1] - 2026-09-07

### Melhorias de Usabilidade e Interface
- **Painel da Síndica mais limpo e direto:** A tela inicial da administração foi redesenhada para eliminar excesso de elementos visuais e focar no que exige atenção imediata.
- **Navegação sem alarmes falsos:** A barra de abas não exibe mais números estáticos em todas as opções. Indicadores coloridos surgem apenas quando há moradores aguardando aprovação ou chamados precisando de validação.
- **Tabelas visíveis sem rolagem excessiva:** Foram removidos os cards repetitivos que ocupavam o topo das abas de Unidades, Ocorrências e Moradores. Agora a tabela de dados aparece imediatamente na tela.
- **Filtros rápidos por status:** Adicionados botões de filtro direto com contadores para alternar rapidamente entre chamados pendentes, em atendimento e resolvidos, bem como entre moradores ativos e pendentes.
- **Central de Convites e QR Code explicativa:** A aba de convite agora inclui orientações passo a passo para afixar nos elevadores ou compartilhar no WhatsApp, com botão para copiar a mensagem pronta aos moradores.

---

## [1.1.0] - 2026-09-06

### Novas funcionalidades
- **Renomear Blocos com atualização automática:** A síndica pode renomear qualquer bloco/torre do condomínio. Ao confirmar, o sistema atualiza imediatamente todas as unidades, os dados dos moradores e os comunicados do mural vinculados ao bloco antigo.
- **Escolha do formato dos blocos:** Ao regerar a estrutura predial, é possível definir se os blocos serão gerados com letras (Bloco A, B, C…) ou com números (Bloco 1, 2, 3…).
- **Chips de blocos com edição rápida:** A lista de unidades passa a exibir os blocos cadastrados como chips clicáveis. Cada um tem um botão de lápis para abrir diretamente a janela de renomeação daquele bloco.

### Correções
- **Ordenação de unidades:** A tabela de unidades agora exibe os apartamentos em ordem crescente — primeiro por bloco/torre, depois pelo número do apartamento (ex.: 101, 102, 201, 202, e não mais em ordem aleatória de inserção).

---

## [1.0.0] - 2026-09-05
### Adicionado
- Estrutura inicial do projeto (Vite + React + TypeScript) para o MVP do Condomínio.

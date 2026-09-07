# Changelog

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

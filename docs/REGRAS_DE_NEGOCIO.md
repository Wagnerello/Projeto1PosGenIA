# Regras de Negócio: MVP SaaS Gestão Condominial

## 1. Visão Geral
Este documento define as regras de negócio para a plataforma SaaS Multi-Tenant de Gestão Condominial (Livro de Registros de Ocorrências e Mural de Avisos com inteligência artificial para triagem). O sistema opera com isolamento estrito de dados por condomínio.

## 2. Atores e Papéis (Hierarquia RBAC)
- **Super Admin (Admin da Plataforma):** Possui acesso global ao painel mestre invisível. Sua única função é registrar novos condomínios na plataforma e convidar/cadastrar as respectivas Síndicas, enviando o link mágico/senha de primeiro acesso.
- **Síndica (Admin Local):** Administradora do seu próprio condomínio. Responsável por:
  - Configurar a infraestrutura predial (criar o "mapa" com número de torres, andares e apartamentos/unidades).
  - Gerar o QR Code/Código de Convite do condomínio para afixar em áreas comuns.
  - Aprovar ou rejeitar o cadastro de novos moradores para o seu condomínio.
  - Visualizar, classificar e alterar status de todas as ocorrências exclusivas do seu condomínio.
  - Postar avisos no Mural.
- **Zelador / Portaria:** Funcionários locais cadastrados pela Síndica. Podem visualizar e atuar em todas as ocorrências do condomínio e ver o Mural de Avisos.
- **Morador:** Vinculado a uma unidade específica de um condomínio. Acesso concedido via "Self-Registration com Aprovação" (Gated Access) disparado por leitura de QR Code. Pode abrir ocorrências para a sua unidade e visualizar o andamento delas. Mais de um morador pode pertencer à mesma unidade (ex: casal).

## 3. Ocorrências e Motor de IA
- Quando um morador registrar uma ocorrência (ex: "Vazamento no teto", "Lâmpada queimada"), o sistema enviará o texto para uma IA (**Groq API** com Llama 3).
- A IA classificará o grau de urgência da ocorrência (ex: Baixa, Média, Alta, Crítica).
- A ocorrência será salva no Firestore contendo o ID do condomínio, a unidade, a descrição, e o grau de urgência definido pela IA.
- Apenas a Síndica e sua equipe (Zelador) verão o grau de urgência no painel administrativo para priorizar o atendimento.

## 4. Segurança, LGPD e Privacidade
- **Dados Mínimos (LGPD):** O sistema não exigirá CPF para cadastro do morador. A autenticidade baseia-se na validação do E-mail e no fluxo de aprovação manual pela Síndica (que já detém os dados de posse legais fora do sistema).
- **Mural:** Público para leitura por todos os usuários autenticados e aprovados daquele condomínio específico.
- **Ocorrências (Isolamento Multi-Tenant):** 
  - Um morador só tem permissão de leitura e escrita nas ocorrências onde o `unidadeId` seja o dele, dentro do seu respectivo `condominioId`.
  - Síndica/Zelador têm permissão de leitura de todas as ocorrências dentro do seu `condominioId`.
  - Dados de diferentes condomínios nunca se misturam ou vazam, protegidos por Firestore RLS (Row Level Security).

# Regras de Negócio: MVP Condomínio

## 1. Visão Geral
Este documento define as regras de negócio para o sistema do Condomínio (Livro de Registros de Ocorrências e Mural de Avisos).

## 2. Atores e Papéis
- **Morador**: Pode registrar novas ocorrências para a sua unidade, visualizar o andamento exclusivo das suas próprias ocorrências e visualizar o Mural de Avisos.
- **Síndica (Admin)**: Tem acesso total. Pode visualizar todas as ocorrências de todos os moradores, alterar o status de qualquer ocorrência, visualizar a urgência classificada pela IA e postar novos avisos no Mural.
- **Zelador / Portaria**: Podem visualizar todas as ocorrências (para atuar nelas) e alterar o status. Podem visualizar o Mural de Avisos (e dependendo da configuração, postar).

## 3. Ocorrências e Motor de IA
- Quando um morador registrar uma ocorrência (ex: "Vazamento no teto", "Lâmpada queimada"), o sistema enviará o texto para uma IA (Google Gemini).
- A IA classificará o grau de urgência da ocorrência (ex: Baixa, Média, Alta, Crítica).
- A ocorrência será salva no Firestore contendo os dados do morador, a descrição, e o grau de urgência definido pela IA.
- Apenas a Síndica e sua equipe verão o grau de urgência no painel administrativo para priorizar o atendimento.

## 4. Segurança e Privacidade
- **Mural**: Público para leitura por todos os usuários autenticados.
- **Ocorrências**: 
  - Morador: Permissão de leitura e escrita restrita ao seu próprio `userId`.
  - Síndica/Zelador: Permissão de leitura de todas as ocorrências.
- **Regras do Firestore**: O RLS (Row Level Security) via Firebase Security Rules garantirá o isolamento dos dados dos moradores.

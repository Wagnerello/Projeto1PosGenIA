

<p><strong>Link do repositório no GitHub:</strong><br>
<a href="https://github.com/Wagnerello/Projeto1PosGenIA" target="_blank" rel="noopener noreferrer">https://github.com/Wagnerello/Projeto1PosGenIA</a></p>

<p><strong>Link do vídeo de demonstração (3-5 min):</strong><br>
<a href="#" target="_blank" rel="noopener noreferrer">[COLE AQUI O LINK DO VÍDEO DO YOUTUBE / GOOGLE DRIVE]</a></p>

<hr>

<p>Olá, pessoal! Compartilho aqui o projeto que desenvolvi nesta etapa: o <strong>Livro Digital de Ocorrências Condominiais com Triagem via IA</strong>.</p>

<p>A proposta foi criar um mini app direto ao ponto para substituir o velho livro físico da portaria e as mensagens soltas de WhatsApp quando surge algum problema no condomínio, como vazamentos, elevador quebrado ou barulho excessivo.</p>

<h3>Como a IA entrou no projeto:</h3>
<p>A IA participou tanto dentro do funcionamento do aplicativo quanto no meu fluxo de desenvolvimento:</p>
<ul>
  <li><strong>No app:</strong> integrei chamadas para o Groq (Llama 3) e para o Gemini para fazer a triagem da mensagem do morador. A IA lê a descrição, define a categoria do problema, marca se a urgência é Baixa, Média ou Alta e gera uma justificativa técnica curta para a equipe de manutenção. Também criei um assistente simples para a síndica passar o rascunho de um aviso e ajustar o tom (formal, direto ou educativo) antes de publicar no mural.</li>
  <li><strong>No código:</strong> usei a IA como apoio para estruturar a base dos componentes, acelerar a escrita dos testes unitários e desenhar a lógica de renomeação de blocos com atualização em cascata no banco de dados.</li>
</ul>

<h3>O que deu mais trabalho (desafios):</h3>
<p>O principal desafio foi <strong>segurar o escopo</strong>. A cada comando ou pedido de sugestão, a IA tentava expandir a aplicação para um sistema condominial completo, sugerindo módulos de boletos, cobranças financeiras e reservas de espaços. Precisei cortar essas ideias várias vezes para manter o foco restrito ao livro de ocorrências e à triagem semântica.</p>

<p>Outro ponto que exigiu bastante atenção foi o excesso de textos inflados gerados pela IA. O README e a própria interface vinham cheios de adjetivos como "plataforma inovadora" e "sistema robusto", além de explicações desnecessárias sobre inteligência artificial em telas simples. Tive que revisar toda a documentação e as mensagens da tela para deixar a linguagem enxuta, técnica e sem enrolação.</p>

<h3>Cuidados, testes e validações:</h3>
<p>Minha regra foi não subir nada gerado pela IA sem validação estrita:</p>
<ol>
  <li><strong>Bateria de testes:</strong> fechei o projeto com 141 testes unitários rodando com Vitest, cobrindo regras de negócio, ordenações e tratamento de falhas.</li>
  <li><strong>Fallback obrigatório:</strong> como APIs externas estão sujeitas a queda e limites de cota, criei um mecanismo de contingência determinístico local. Se o Groq ou o Gemini falharem ou demorarem para responder, o sistema não trava; ele classifica a urgência localmente por regras de palavras-chave no navegador.</li>
  <li><strong>Travas automáticas no Git:</strong> configurei hooks com Husky no <code>pre-commit</code>. Se algum teste quebrar ou o linter acusar erro, o commit é bloqueado na hora.</li>
</ol>

<p>No fim das contas, a IA ajudou muito a acelerar tarefas mecânicas, mas a parte crítica do trabalho, como definir limites de escopo, garantir resiliência e conferir se o código funciona de verdade, continuou sendo totalmente manual.</p>



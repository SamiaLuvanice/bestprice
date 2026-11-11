# Plano

- Em `frontend/src/App.tsx`, use o estado de carregamento ou erro como elemento alternativo das rotas que dependem da sessão. A rota curinga monta a página pública diretamente. Preserve o caminho literal em cada declaração, como exige a verificação das reescritas da spec 0051.
- Use o mesmo casamento de caminhos do roteador para o título do login. Agende o foco do formulário apenas quando o visitante puder acessá-lo.
- Em `NotFoundPage.tsx`, aplique o título e o foco quando a página for montada. Isso elimina a lista paralela de caminhos usada para adivinhar quando o 404 aparece.
- Em `App.test.tsx`, simule a consulta de sessão pendente e a falha na fronteira HTTP. Verifique título, conteúdo, foco e destino do link. Reutilize o teste da rota protegida.
- O contrato REST e o status HTTP da hospedagem seguem a configuração existente.

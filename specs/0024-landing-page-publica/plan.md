# Plano — 0024

## Camadas e rotas

Somente `frontend/` e documentação. Não há contrato REST novo. `/` mostra a landing a visitantes e mantém o painel para sessões autenticadas, preservando links existentes e o retorno após login. `/login` permanece entrada; `/produtos`, `/produtos/:id` e `/alertas` continuam protegidas.

## Visual

Tokens: branco `#fff`, superfície `#f8fafc`, azul escuro `#0b172b`, verde de ação `#39ff14` do catálogo, rosa de leitura `#c7005e` do catálogo e cinza `#64748b`. Texto verde sobre fundos claros usa `#087c1e` para contraste; o verde de ação continua com texto escuro. Tipografia sans do sistema existente. Conteúdo alinhado à esquerda; hero em texto + recorte visual da direita da arte, sem mostrar o texto gravado na esquerda. Benefícios ficam em faixa única; etapas formam sequência; categorias recebem imagens entregues. Banner usa arte panorâmica com conteúdo React no espaço livre.

O pedido visual usa verde e magenta vibrantes. O catálogo governa os tokens funcionais para contraste. A combinação de recorte fotográfico, selo tricolor e imagem final entregue diferencia esta página de um kit SaaS genérico; sombras e movimento ficam restritos.

## Arquivos

- `frontend/src/App.tsx`: entrada pública condicionada à sessão, sem alterar destinos internos.
- `frontend/src/landing/LandingPage.tsx`, `LandingPage.css`: seções, menu e aviso de cadastro.
- `frontend/src/assets/landing/`: versões WebP dos arquivos fornecidos.
- `frontend/index.html`: descrição de busca.
- Testes de navegação e landing na fronteira React.
- `designsystem/README.md`, `docs/apps/frontend.md`, `docs/PROGRESS.md`, `specs/0024.../verification.md`: documentação após gates.

## Riscos e decisões

- Não há rota de cadastro; o botão abre aviso local acessível.
- A arte hero traz texto incorporado apesar da descrição do pedido; seu lado esquerdo será ocultado por enquadramento CSS, para que só o texto React apareça.
- Ilustrações contêm produtos/preços de exemplo; não representam dados reais da API.
- Não instalar dependência de ícones ou animação; SVGs simples e CSS local atendem.

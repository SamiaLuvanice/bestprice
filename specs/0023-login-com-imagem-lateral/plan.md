# Plano — 0023 Login com imagem lateral de referência

## Escopo e contrato

Mudança restrita ao frontend. O contrato de `POST /api/auth/login` e a consulta de
sessão existentes permanecem intactos. Nenhuma rota, DTO, status ou erro novo.
O formulário continua com a validação e os estados das specs 0011, 0017 e 0020.

## Direção visual

- **Cores:** branco `#ffffff` e superfície clara do catálogo para a área de entrada;
  verde de ação `#39ff14`, rosa de leitura `#c7005e`, texto e bordas já definidos
  pelo design system. A arte fornecida concentra a cor e a mensagem promocional.
- **Tipo:** manter a família de sistema e os tokens da aplicação. Aumentar a
  hierarquia do título e do espaço entre grupos para se aproximar da imagem 1,
  preservando o contraste e a legibilidade.
- **Composição:** acima de 840 px, duas metades lado a lado; imagem 2 à esquerda,
  formulário centralizado na metade direita. Em até 840 px, marca compacta e
  formulário primeiro, sem a arte longa. A imagem não recebe logo, frase ou card
  adicionais por cima. Sua proporção original é preservada ao cobrir a coluna;
  priorizar a região superior, que contém marca e mensagem principal, em janelas
  baixas. Conferir o recorte no navegador antes de fixar a posição final.
- **Princípio:** a arte é o único elemento expressivo; o formulário usa superfície
  calma, hierarquia e ação verde. Sem controles sem destino.

```text
>840 px                    <=840 px
+----------------+----------------+   +-------------------+
| imagem 2       | Bem-vindo...   |   | marca             |
| sem overlays   | E-mail         |   | Bem-vindo...      |
|                | Senha          |   | E-mail            |
|                | Entrar         |   | Senha / Entrar    |
+----------------+----------------+   +-------------------+
```

Essa composição substitui o card de vidro e o conteúdo decorativo da esquerda
apenas na entrada. O catálogo visual continua a reger cores, tipografia, logo e
controles. A referência 1 é guia de composição, e a imagem 2 é o ativo visual
fornecido pelo responsável. Não reproduzir os controles extras da referência 1.

## Arquivos e responsabilidades

| Local | Mudança |
|---|---|
| `frontend/src/LoginForm.tsx` | Trocar a ilustração gerada na coluna visual pela imagem fornecida e manter o formulário e seus estados. |
| `frontend/src/styles.css` | Aplicar composição em duas áreas, recorte responsivo da arte e tratamento da área do formulário; retirar estilos exclusivos da ilustração substituída. |
| `frontend/src/assets/` | Incluir a imagem fornecida como ativo da interface. |
| `frontend/src/LoginForm.test.tsx` | Cobrir presença da arte, ausência de sobreposições e controles inexistentes; manter as regressões funcionais atuais. |
| `designsystem/README.md` | Registrar o uso da arte fornecida e as regras visuais específicas da entrada. |
| `docs/apps/frontend.md` | Sincronizar a descrição da tela após QA e gates. |

## Acessibilidade e conteúdo

A imagem incorpora marca, texto promocional e exemplos visuais. Uma descrição
curta comunica marca e proposta sem tratar os preços como dados de usuário.
A marca compacta continua disponível na versão estreita; em cada largura,
apenas uma apresentação da marca deve ter nome acessível. O título principal,
campos, mensagens e controles mantêm sua semântica e foco. Texto alternativo
deve ser verificado com os dois breakpoints para evitar duplicação da marca.

## Verificação e riscos

1. Red de teste de comportamento: arte esperada e textos decorativos antigos
   ausentes. Green após trocar o ativo; regressões de login continuam verdes.
2. Lint, testes e build do frontend com contagem positiva.
3. Conferência visual em 320, 768 e 1280 px, incluindo uma janela baixa, erros
   visíveis, teclado e ausência de rolagem horizontal. Verificar recorte da marca
   e mensagem principal, contraste e área de toque.
4. Revisão independente do diff e QA dos critérios; registrar limites reais.

O risco principal é cortar informação importante da arte vertical em janelas
largas e baixas. Se o recorte prejudicar a mensagem, ajustar escala ou posição
antes de aceitar AC02, sem distorcer a imagem. A arte contém preços ilustrativos;
não devem ser interpretados nem implementados como dados reais.

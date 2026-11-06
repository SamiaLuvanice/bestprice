# Quadros Figma — Cadastro (spec 0048)

Status: **aprovados pela responsável em 06/11/2026** (AC13), com o pedido de incluir
"Criar conta" na landing (feito no mesmo dia, ver abaixo).

Arquivo: [BestPrice IA](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA).
Edição feita no Chrome (Claude in Chrome, perfil Windows), pela Plugin API do editor,
com autorização expressa da responsável em 06/11/2026. Base: login `59:44` e `59:602`
(spec 0046), duplicados; logo, arte lateral, campos, ícone de olho, botão e textos
reaproveitam os nós do login (mesmas cores, fonte Arimo, raios e espaçamentos).

Exportação: PNG nativo (`exportAsync`, escala 1×) em 06/11/2026, salvo em
`specs/0048-cadastro-self-service-usuarios/evidence/`.

## Login ajustado (quadros existentes)

| Quadro | node-id | Dimensões | PNG |
|---|---|---|---|
| 02 · Entrar · Desktop | [`59:44`](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=59-44) | 1440 × 1040 | `0048-figma-login-desktop.png` |
| 02 · Entrar · Mobile | [`59:602`](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=59-602) | 390 × 844 | `0048-figma-login-mobile.png` |

Alteração: nó de texto "Link para criar conta" — "Ainda não tem conta? **Criar conta**"
24 px abaixo do botão Entrar; o texto do Mercado Livre e "Voltar para o início" desceram
41 px. Nada mais foi alterado.

## Landing ajustada (quadro existente)

| Quadro | node-id | Dimensões | PNG |
|---|---|---|---|
| 01 · Landing · Desktop | [`16:2`](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=16-2) | 1440 × 2880 | `0048-figma-landing-desktop.png` |

Alteração: no cabeçalho (`160:1868`), botão secundário "Criar conta" (`222:2` fundo,
`222:3` texto) à esquerda de "Entrar", 128 × 44, 12 px de distância: fundo branco,
contorno 1,5 px e texto Inter Bold 13 no magenta `#c7005e`. "Entrar" continua igual.

| Quadro novo | node-id | Dimensões | PNG |
|---|---|---|---|
| 01 · Landing · Menu aberto · Mobile | [`224:2`](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=224-2) | 390 × 844 | `0048-figma-landing-menu-aberto-mobile.png` |

Duplicado de `12:2` (sem alterar o original), na linha y = 4500 da página mobile. O
cabeçalho cresce para 308 px e empurra o conteúdo, como no CSS (`nav.is-open` em
coluna dentro do cabeçalho): ícone ☰ trocado por X ("Fechar menu"), links "Assistente
IA" e "Monitoramento" (Inter 15, alvo de 44 px), depois "Entrar" (preenchido magenta) e
"Criar conta" (contornado magenta), 350 × 44 cada, 12 px entre si. Os links seguem o
cabeçalho desktop do Figma; o código atual usa "Como funciona", "Comparador" e
"Começar com IA" — divergência pré-existente, não resolvida aqui. O quadro recorta a
página em 844 px.

## Cadastro — Desktop (página "01 · BestPrice IA — Desktop", linha y = 1240)

| Quadro | node-id | Dimensões | PNG |
|---|---|---|---|
| 02b · Criar conta · Desktop | [`220:347`](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=220-347) | 1440 × 1040 | `0048-figma-cadastro-desktop.png` |
| 02b · Criar conta · Foco · Desktop | [`220:382`](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=220-382) | 1440 × 1040 | `0048-figma-cadastro-foco-desktop.png` |
| 02b · Criar conta · Enviando · Desktop | [`220:421`](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=220-421) | 1440 × 1040 | `0048-figma-cadastro-enviando-desktop.png` |
| 02b · Criar conta · Erros · Campos · Desktop | [`220:459`](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=220-459) | 1440 × 1040 | `0048-figma-cadastro-erros-campos-desktop.png` |
| 02b · Criar conta · Erros · E-mail já cadastrado · Desktop | [`220:505`](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=220-505) | 1440 × 1040 | `0048-figma-cadastro-erros-e-mail-ja-cadastrado-desktop.png` |
| 02b · Criar conta · Erros · Limite de tentativas · Desktop | [`220:546`](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=220-546) | 1440 × 1040 | `0048-figma-cadastro-erros-limite-de-tentativas-desktop.png` |
| 02b · Criar conta · Erros · Falha de rede · Desktop | [`220:588`](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=220-588) | 1440 × 1040 | `0048-figma-cadastro-erros-falha-de-rede-desktop.png` |

## Cadastro — Mobile (página "02 · BestPrice IA — Mobile", linha y = 4500)

| Quadro | node-id | Dimensões | PNG |
|---|---|---|---|
| 02b · Criar conta · Mobile | [`220:871`](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=220-871) | 390 × 899 | `0048-figma-cadastro-mobile.png` |
| 02b · Criar conta · Foco · Mobile | [`220:900`](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=220-900) | 390 × 899 | `0048-figma-cadastro-foco-mobile.png` |
| 02b · Criar conta · Enviando · Mobile | [`220:933`](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=220-933) | 390 × 899 | `0048-figma-cadastro-enviando-mobile.png` |
| 02b · Criar conta · Erros · Campos · Mobile | [`220:965`](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=220-965) | 390 × 947 | `0048-figma-cadastro-erros-campos-mobile.png` |
| 02b · Criar conta · Erros · E-mail já cadastrado · Mobile | [`220:1005`](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=220-1005) | 390 × 923 | `0048-figma-cadastro-erros-e-mail-ja-cadastrado-mobile.png` |
| 02b · Criar conta · Erros · Limite de tentativas · Mobile | [`220:1040`](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=220-1040) | 390 × 973 | `0048-figma-cadastro-erros-limite-de-tentativas-mobile.png` |
| 02b · Criar conta · Erros · Falha de rede · Mobile | [`220:1076`](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=220-1076) | 390 × 973 | `0048-figma-cadastro-erros-falha-de-rede-mobile.png` |

## Decisões de desenho

- Ordem: marca → título → subtítulo → E-mail → Senha (+ dica) → Confirmar senha →
  aviso de privacidade → alerta (quando houver) → botão → "Já tem uma conta? Entrar" →
  "Voltar para o início". A frase do Mercado Livre do login não entra no cadastro.
- Desktop: conteúdo centralizado verticalmente em 1040 px. Mobile: mesmo topo do login
  (marca em y = 130); a altura cresce além de 844 px conforme o estado (brief permite).
- Cores de erro dos tokens existentes: texto/borda `--color-danger-text` #a61b1b,
  alerta com fundo #fff0f0 e borda #ffd4d4 (`.error-box`). Ícone circular "!" + texto,
  não só cor. Foco: anel 2 px `--ring` #c7005e, mostrado em "Confirmar senha".
- Enviando: botão a 45% de opacidade com "Criando conta…"; valores dos campos esmaecidos.
- Erros · Campos: a mensagem de erro da senha substitui a dica (mesma regra, evita
  texto duplicado). Nos outros estados a dica fica visível.
- Limite de tentativas usa "15 minutos" como exemplo de N.

## Limites observados

- Os quadros são grupos com posição absoluta, como o login de origem; não há auto
  layout nem componentes/variants do Figma. Os estados são quadros separados.
- O conector MCP do Figma não foi usado; a edição e a exportação foram feitas pelo
  editor no Chrome. Os PNGs foram baixados pelo navegador e movidos para `evidence/`.
- Landing mobile (`12:2`) não foi alterada: as ações ficam no menu, desenhado aberto
  no quadro novo `224:2`.
- Contraste e alvos não foram medidos por ferramenta no Figma; cores e alturas
  (campos 48 px, botão 50 px) vêm dos tokens e do login aprovado.
- `node-id`s ainda não copiados para `verification.md` (sessão restrita ao design).

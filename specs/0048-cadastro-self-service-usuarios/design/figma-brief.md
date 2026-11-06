# Brief Figma — Cadastro (spec 0048)

Status: **proposta, aguardando criação e aprovação no Figma**. A tela de cadastro não
existe no arquivo (confirmado pelo responsável em 06/11/2026). Este brief deriva dos
quadros aprovados de login `59:44` (desktop 1440 × 1040) e `59:602` (mobile 390 × 844),
exportados na spec 0046 (`specs/0046-login-stage-sem-rodape/evidence/`). Ele não
substitui o Figma: a implementação só começa depois dos quadros aprovados e exportados.

Arquivo: https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA (página de
telas desktop/mobile, ao lado de "02 · Entrar").

## Quadros a criar

| Quadro | Dimensões | Base |
|---|---|---|
| `02b · Criar conta · Desktop` | 1440 × 1040 | duplicar `59:44` |
| `02b · Criar conta · Mobile` | 390 × 844 (altura pode crescer) | duplicar `59:602` |
| `02b · Criar conta · Erros · Desktop/Mobile` | idem | variante de estado |
| `02 · Entrar` (ajuste) | existentes | adicionar link "Criar conta" |

Landing: adicionar "Criar conta" junto à ação de entrar existente, sem nova seção.

## Composição (igual ao login)

Desktop: imagem lateral à esquerda (mesma arte), coluna do formulário à direita com a
mesma largura, alinhamento e espaçamentos. Mobile: só a coluna, sem imagem. Sem rodapé.
Mesmos tokens: título, subtítulo cinza, rótulos em negrito, campos com borda
arredondada, botão primário verde de largura total e link de apoio magenta.

## Conteúdo (pt-BR)

1. Marca BestPrice (logo oficial + nome).
2. Título: **Criar sua conta**
3. Subtítulo: Comece a acompanhar preços do Mercado Livre em poucos segundos.
4. Campo **E-mail** (tipo e-mail, `autocomplete=email`).
5. Campo **Senha** com botão de mostrar/ocultar (ícone olho, como no login) e dica
   persistente abaixo: "Use pelo menos 12 caracteres."
6. Campo **Confirmar senha** com mostrar/ocultar.
7. Aviso de privacidade (texto pequeno, cinza, antes do botão): "Usamos seu e-mail só
   para identificar sua conta e permitir seu acesso. Não enviamos mensagens."
8. Botão primário: **Criar conta**
9. Linha de apoio: "Já tem uma conta? **Entrar**" (link magenta para o login,
   preservando o destino de retorno).
10. "Voltar para o início" (igual ao login).

No login, abaixo do botão Entrar: "Ainda não tem conta? **Criar conta**".

## Estados a desenhar

| Estado | Comportamento visual |
|---|---|
| Padrão | campos vazios |
| Foco | anel de foco do design system em campo e botão |
| Enviando | botão desabilitado com "Criando conta…" |
| Erro de campo | borda e texto de erro abaixo do campo, ícone + texto (não só cor): "Informe um e-mail válido.", "A senha precisa ter pelo menos 12 caracteres.", "As senhas não conferem." |
| E-mail já cadastrado | erro no campo e-mail: "Já existe uma conta com este e-mail." + link "Entrar" |
| Limite de tentativas | alerta acima do botão: "Muitas tentativas de cadastro. Tente novamente em N minutos." |
| Falha de rede/servidor | alerta: "Não foi possível criar a conta agora. Tente novamente." |

As mensagens finais são revistas no plano; o desenho mostra a posição e o estilo.

## Aceite do design

- Quadros desktop e mobile editáveis com os estados acima, nomeados e com `node-id`
  registrados em `specs/0048-cadastro-self-service-usuarios/verification.md`.
- Exportação PNG nativa de cada quadro em `specs/0048-.../evidence/`.
- Rótulos visíveis, contraste AA, alvos ≥ 44 px, ordem de teclado lógica.
- Aprovação do responsável antes da implementação do frontend (AC13).

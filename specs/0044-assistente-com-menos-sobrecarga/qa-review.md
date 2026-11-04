# Revisão independente de design — 0044

Data: 03/11/2026. Papéis: QA e revisão de arquitetura, restritos à etapa visual.
Escopo: quatro PNGs antes, quatro PNGs depois e quadro de estados. Nenhuma edição
da aplicação ou do Figma foi feita nesta revisão.

## Parecer

Não foi observado bloqueio de composição nas exportações finais: não há corte ou
sobreposição visível nos textos e controles principais. A proposta reduz a
apresentação inicial, torna o campo prioritário e representa as duas escolhas
confirmadas: exemplos sob “Ver exemplos” e recentes recolhidos na conversa,
tanto no desktop quanto no mobile.

Aceitação desta etapa é **visual e estática**, para apresentar a proposta à
responsável pelo produto. Não equivale a aprovação da implementação, da spec
inteira, de acessibilidade ou de comportamento executável.

## Observações

- O aviso junto ao envio conserva Google, possível uso do conteúdo gratuito e
  orientação sobre dados pessoais ou confidenciais nas quatro telas.
- A conversa conserva identificação de IA e dados de mercado não verificados.
  Exemplos de mensagens e dados ilustrativos não são apresentados como ofertas
  verificadas ou integração real.
- O quadro auxiliar contém os três exemplos, quatro conversas recentes e acesso
  ao histórico, política de 90 dias desde a criação, não renovação ao editar,
  limites de exclusão sobre backups/Google, cota e uso do contexto recente.
- Não aparece comparador nas imagens inspecionadas. A identidade e os assets
  permanecem visualmente coerentes com o antes. A confirmação de IDs e de texto
  nativo foi fornecida pelo responsável pela edição; este revisor não acessou a
  árvore remota do Figma.
- **P2 editorial resolvido:** o PNG final do quadro auxiliar substitui os termos
  “banco ativo/API em execução” por “A remoção ocorre na limpeza automática, a
  cada hora, enquanto o serviço está ativo.” O prazo, a ressalva operacional e
  os limites de exclusão sobre backups/Google permanecem. Não há corte ou
  sobreposição observado nesse trecho.
- Os dois PNGs mobile finais agora mostram ícones e rótulos completos
  “Assistente”, “Histórico” e “Monitorar”. Os rótulos cabem na barra inferior,
  sem corte ou colisão visível. Isso melhora o reconhecimento da navegação,
  sem demonstrar operação por teclado ou leitor de tela.
- A chave Figma na seção histórica de `review.md` foi corrigida para
  `LZVtUEAycEzfbwL0H5YL3r`, consistente com o link de `plan.md`.

## Conferência do delta final

Foram reinspecionados somente `after/mobile-initial.png`,
`after/mobile-conversation.png` e `after/disclosures-and-states.png` após os
ajustes. Os três PNGs abriram, mantiveram suas dimensões e tiveram os hashes
conferidos contra `export-manifest.json`. Não se observam objetos temporários
no quadro auxiliar. **Delta visual aceito, sem bloqueios ou achados visuais
pendentes nesta revisão.** Os limites de validação funcional abaixo permanecem.

## Evidência local

Todos os nove PNGs abriram com Pillow e foram inspecionados visualmente com
`view_image`. Dimensões verificadas:

| Artefato | Antes | Depois |
|---|---|---|
| Desktop inicial | 1440 × 960 | 1440 × 960 |
| Desktop conversa | 1440 × 960 | 1440 × 960 |
| Mobile inicial | 390 × 1190 | 390 × 844 |
| Mobile conversa | 390 × 1320 | 390 × 844 |
| Conteúdo sob demanda e estados | — | 1440 × 1280 |

Os arquivos depois verificados nesta revisão têm SHA-256:

| Arquivo | SHA-256 |
|---|---|
| `after/desktop-initial.png` | `62cae6aeb161a98433a76c42c5cac9d7a639ce9027576442c39bc04fb778fbc4` |
| `after/desktop-conversation.png` | `21473c21df0e93134c4ca183966681b8fa854fe39fafa66a3336f7a37c83c1a4` |
| `after/mobile-initial.png` | `a431be6e44f5073de02eb9f76cda2390a7e64b4c8e5592ecc4ec2a4dc56086f4` |
| `after/mobile-conversation.png` | `5280e201a31045a522a650ec9c349005c4a99c0fe0c32f4bba3c3e4eb6e3e388` |
| `after/disclosures-and-states.png` | `c55ae30d675ad782b4a901eb56c6550f9715f517f70f66d84bcfd3361a1f08ae` |

## Limites

Não foram testados 320, 768 ou 1280 px, teclado virtual, foco, leitor de tela,
zoom, persistência de rascunho, seleção de exemplos, abertura de controles,
envio, integração, API, banco ou IA real. Contraste e áreas de toque não foram
medidos para emitir conformidade. PNG não demonstra vínculos com tokens ou
instâncias, nem funcionamento de um protótipo.

Não houve alteração de código a auditar: radon, lint, testes, build, health e
doc-sync-onboarding não foram executados e não são alegados como aprovados.
Issue, Project, PR, CI e deploy não foram verificados nem publicados por este
revisor. A spec deve manter pendentes os critérios funcionais correspondentes.

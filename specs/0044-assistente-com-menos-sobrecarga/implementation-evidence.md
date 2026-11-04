# Evidência da implementação — 0044

Worktree: `.worktrees/codex-0044-assistente-simples`, base origin/develop
`9d3b482a924d14fa8ff9f33cfb1fdac4a5044acb`. A responsável confirmou aplicar
os mesmos cortes de texto no desktop e no mobile.

## Ciclos TDD do implementador

Registro devolvido pelo implementador a partir das execuções reais, em frontend/:

| Comando | Red observado | Green observado |
|---|---|---|
| `npm test -- --run src/assistant.test.tsx -t 'recentes começam recolhidos'` | 2 falharam, 9 ignorados: botão Conversas recentes inexistente nas duas rotas | 2 passaram, 9 ignorados; recolhimento, teclado/foco, rascunho, URL e ausência de POST |
| `npm test -- --run src/assistant.test.tsx -t 'mostra pergunta e exemplo únicos'` | 1 falhou, 11 ignorados: heading aprovado inexistente | execução conjunta com recentes: 3 passaram, 9 ignorados |
| `npm test -- --run src/assistant.test.tsx -t 'mostra contador apenas'` | 1 falhou, 12 ignorados: ausência da descrição de 200 restantes com 1800 caracteres | passou na execução posterior dos dois arquivos; a suíte conjunta ainda tinha uma falha de transição |

O teste intermediário de Escape foi corrigido para Tab até o link real, em vez
de clicar num heading não interativo. O contador intermediário concatenava os
textos; separar IDs no aria-describedby corrigiu a descrição. Na execução
`npm test -- --run src/assistant.test.tsx src/research.test.tsx`, 27 passaram e
1 falhou: abertura de recentes durante transição da primeira conversa. Esse
resultado não é registrado como gate verde.

## Escopo e referência

Exportações atuais em figma-current/; conteúdo desktop governa ambos os tamanhos
por confirmação expressa. Layout responsivo com robô original, Button, tokens e
useDisclosure existentes. API, autorização, retenção, quota e comparação
compartilhada preservadas. Nenhuma geração de IA real nos testes controlados.

Issue não publicada: revisão automática rejeitou a criação externa. Nenhum PR,
push, CI, merge ou deploy comprovado por esta evidência local.

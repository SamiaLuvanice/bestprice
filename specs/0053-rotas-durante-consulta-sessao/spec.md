---
numero: 0053
titulo: Rotas durante a consulta de sessão
tipo: bug
prioridade: P2
status: pronta
toca: [frontend]
depende_de: []
---

# 0053 — Rotas durante a consulta de sessão

[Issue #290](https://github.com/SamiaLuvanice/bestprice/issues/290)

## Problema

Quem abre o login enquanto a sessão está pendente ou indisponível vê um título de página inexistente. Quem abre um endereço desconhecido nessas condições vê a interface global de sessão e pode confundir um link inválido com uma indisponibilidade do serviço.

## Como reproduzir

1. Intercepte a consulta da sessão e mantenha a resposta pendente. Abra `/login` e confira o título da aba.
2. Faça a consulta falhar e confira novamente o título.
3. Abra `/pagina-que-nao-existe` com a consulta pendente ou falhando e confira o conteúdo da página.

## Critérios de aceite

- AC01. Em `/login`, o título é “Entrar · BestPrice” durante a consulta, após uma falha e quando o formulário aparece. Os estados de carregamento, erro e nova tentativa continuam disponíveis.
- AC02. Um endereço desconhecido fora da área `/app` exibe imediatamente a página “Este endereço saiu do radar.” e o título “Página não encontrada · BestPrice”, inclusive durante falhas de sessão. Sem sessão confirmada, a ação aponta para o login.
- AC03. Uma rota protegida continua a aguardar a sessão e oferece nova tentativa em caso de falha, sem exibir conteúdo privado.

## Escopo

Comportamento do roteamento da SPA. A política HTTP dos servidores e o roteamento interno de `/app` ficam fora da tarefa.

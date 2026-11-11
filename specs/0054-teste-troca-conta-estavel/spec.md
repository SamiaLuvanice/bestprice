---
numero: 0054
titulo: Teste estável de troca de conta
tipo: bug
prioridade: P2
status: pronta
toca: [frontend]
depende_de: []
---

# 0054 — Teste estável de troca de conta

[Issue #296](https://github.com/SamiaLuvanice/bestprice/issues/296)

O teste que protege rascunhos privados falha intermitentemente no CI de mudanças sem relação com o fluxo de sessão. Isso atrasa a validação dos PRs e reduz a confiança na cobertura.

## Como reproduzir

1. Abra a primeira tentativa da execução 42845036553 e consulte a falha do job Frontend.
2. Confira que a tela permaneceu no login com a validação “Informe seu e-mail.” após a tentativa de entrar na segunda conta.

## Critérios de aceite

- O teste confirma que a segunda conta entrou antes de voltar à entrada anterior do histórico.
- Ao voltar à entrada antiga, a caixa de mensagem está vazia. O preenchimento das credenciais de teste independe do foco e a duração das esperas permanece a mesma.

Mudanças no produto e no contrato da API estão fora do escopo.

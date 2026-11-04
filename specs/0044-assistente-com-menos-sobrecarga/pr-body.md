O Assistente IA acumulava orientações e uma coluna permanente de recentes que
competiam com o campo de mensagem. A tela agora segue os cortes aprovados no
Figma em desktop e mobile: pergunta direta, um exemplo no campo, robô compacto
e recentes recolhidos com acesso por teclado. O aviso essencial do Google fica
junto ao envio; o contador aparece nos últimos 200 caracteres.

Abrir ou fechar recentes conserva o rascunho e não envia mensagem. Estados de
carga, vazio, falha e IA desativada permanecem distintos. Não há alteração de
API, autorização, retenção ou quota.

Spec: `specs/0044-assistente-com-menos-sobrecarga/spec.md`.

Validação local:

- Lint e build do frontend passaram.
- Vitest: 381 testes em 34 arquivos passaram com `--maxWorkers=2`.
- Playwright do Assistente: 32 testes nos quatro viewports, mais captura 390 × 844.
- Detector local: zero ocorrências nos três arquivos de UI alterados.
- Scripts GitHub: 50 testes passaram.

Revisão independente e QA: consultar implementation-review.md e
implementation-qa.md. Onboarding: consultar o registro final em verification.md.
Testes de interface usam API controlada; não representam geração real ou deploy.

Closes #231

CI externo deve passar antes da integração. Implementação entregue; aguarda revisão.

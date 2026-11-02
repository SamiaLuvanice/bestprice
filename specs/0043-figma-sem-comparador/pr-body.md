O Figma ainda apresentava um comparador manual e um histórico misto. A proposta
agora usa Assistente, Histórico de conversas e Monitoramento por link, com os
quadros do comparador retirados de desktop e mobile.

Esta PR registra a entrega de design e suas evidências. Inclui 18 quadros finais,
busca global sem ocorrências de `Compar`, histórico como texto/vetores editáveis e
mestre mobile preservado com uma instância na biblioteca. Sem alteração da aplicação.

Spec: `specs/0043-figma-sem-comparador/spec.md`.
Verificação: `specs/0043-figma-sem-comparador/verification.md`.
Figma: https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=132-27

Validação: conferência visual dos 18 quadros, correção de sobreposição na landing
mobile, 50 PNGs válidos com dimensões/SHA-256 e `git diff --check` sem erros.
Lint/testes/build não aplicáveis: somente documentação e artefatos de design.

Pendências: validação da responsável e revisão independente. AC01/AC07 têm
evidência inicial parcial: a referência anterior é a 0042; não houve captura nova
de todos os quadros nem versão nomeada antes da primeira edição. As duas versões
nomeadas registradas no Figma foram salvas após as alterações. A spec fica rascunho.

Closes #223

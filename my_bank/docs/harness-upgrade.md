# Evolução e atualização

A base inicial é distribuída por cópia. Registre a versão instalada em
`harness.yaml` e compare as mudanças do template antes de atualizar.

Antes de aplicar uma atualização:

1. faça backup ou commit das customizações locais;
2. compare `.agents`, `scripts` e `config`;
3. preserve arquivos específicos do projeto (`sources.md`, `modules.yaml`);
4. valide referências, links e permissões (`.claude/settings.json`);
5. rode os portões locais (`quality-gates`);
6. documente incompatibilidades e decisões no changelog do projeto.

Nunca substitua automaticamente `sources.md`, configurações locais ou regras de domínio.

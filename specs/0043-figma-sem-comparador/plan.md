# Plano — Figma sem comparador

Etapa exclusiva de design no [arquivo BestPrice IA](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA).
Não há contrato REST, SPA, API, banco ou integração envolvidos; portanto não há
divisão backend/frontend nem gates de lint/teste/build aplicáveis ao código.

## Referência de partida

A vistoria da 0042 (`specs/0042-telas-figma-padrao-consistente/verification.md`)
registrou 20 quadros. Os que citam ou dependem do comparador, a confirmar no
inventário:

| Quadro | ID | Ação prevista |
|---|---|---|
| Comparador desktop | 59:153 | Apagar |
| Comparador mobile | 59:681 | Apagar |
| Histórico desktop | 59:204 | Só conversas; sem filtro de tipo |
| Histórico mobile | 59:716 | Só conversas; sem filtro de tipo |
| Landing desktop / mobile | 16:2 / 12:2 | Texto e prévia sem comparador |
| Assistente, conversa, monitoramento (desktop e mobile) | vários | Navegação com 3 destinos; remover atalhos "comparar" |
| Fundamentos / Biblioteca | 6:11 / 6:805 | Navegação mestre com 3 destinos |
| Estados auxiliares | 137:43 / 152:535 | Conferir menções |

O componente mestre `Navegação/Mobile` é editado uma vez; as instâncias herdam.
Header e sidebar desktop são conferidos quadro a quadro, pois a 0042 os replicou.

## Sequência

1. Inventário: buscar "Compar" em todas as páginas e listar quadros, camadas e
   componentes afetados (AC01). Exportar os quadros afetados para `before/`.
2. Navegação: atualizar o mestre mobile para três destinos distribuídos sem
   lacuna; remover o item Comparar da sidebar/header desktop (AC03).
3. Histórico: remover filtro de tipo e itens "Comparação"; ajustar descrição e
   estado vazio para conversas (AC04).
4. Landing e prévia: reescrever trechos que prometem comparação, mantendo fotos,
   marca e estrutura (AC05).
5. Assistente/Monitoramento/estados: remover sugestões e atalhos de comparação.
6. Apagar os quadros do Comparador e componentes exclusivos dele (AC02). Último
   passo de edição, para que nada dependa deles durante o trabalho.
7. Exportar `after/`, repetir a busca por "Compar", conferir sobreposição/corte e
   registrar em `verification.md` (AC02, AC06, AC07).

## Ferramenta

O MCP do Figma tem cota limitada no plano Starter (registrado na 0042). A edição
ocorre pela interface do Figma no navegador, com a sessão autenticada da pessoa
responsável. Sem acesso a uma dessas vias, a etapa de edição fica bloqueada e é
reportada como pendência.

## Entrega

Commits com spec, plano, tarefas e evidências na branch
`feature/0043-issue-223-figma-sem-comparador`; PR para `develop` com `Closes #223`.
O `doc-sync-onboarding` só é exigido se houver alteração de código; confira mesmo
assim se `docs/` cita o Figma com quatro destinos.

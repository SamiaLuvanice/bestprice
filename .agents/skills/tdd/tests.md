# Testes observáveis

Um teste descreve uma capacidade ou regra que importa a quem chama a API ou usa a tela.
Seu nome e suas asserções devem continuar válidos se a implementação interna for refatorada.

## Bom foco

- comportamento da resposta HTTP e formato de erro, sem inspecionar método privado do controller;
- resultado e erro de domínio do service, sem verificar quantidade/ordem de chamadas a cada
  colaborador interno;
- estado visível da tela após interação, consultado por papel e texto acessível, não por classe
  CSS ou detalhes do componente;
- entrada/saída conhecida da spec comparada a um literal independente da implementação.

## Sinais de teste frágil

- falha quando uma chamada interna é reorganizada, embora o resultado observado continue igual;
- reproduz no expected a mesma fórmula usada pelo código sob teste;
- consulta estado interno ou banco por fora da interface que a funcionalidade oferece;
- não contém asserção útil ou foi desativado para manter o build verde.

Prefira uma asserção lógica clara por teste. Para a estrutura e comandos reais de execução,
consulte `.agents/rules/testing.md` e `quality-gates`.

---
name: solid-principles
description: Aplicar SOLID ao escrever ou revisar código Java/Spring e Angular — uma responsabilidade por classe, extensão sem edição, interfaces estreitas, injeção de dependência. Use ao criar classe ou componente, ao refatorar algo que cresceu demais, ou ao revisar código.
---

# SOLID na prática

A **organização de pacotes e camadas** está em `.agents/rules/architecture.md`. Aqui é o que fazer *dentro* de cada classe.

## Backend (Java/Spring)

- **S** — uma classe, uma razão para mudar. `AccountService` cuida de contas; envio de e-mail vira outro bean.
  Service com dezenas de métodos e muitas dependências está fazendo coisa demais: divida por caso de uso.
- **O** — comportamento novo entra por nova implementação/estratégia (ex.: `FeePolicy` com várias implementações),
  não por mais um `if/else` num método que já cresce.
- **L** — qualquer implementação de uma interface funciona no lugar de outra sem o chamador perceber.
- **I** — interface pequena e específica; não force a implementar método que não usa.
- **D** — dependa de abstração e receba por **construtor**; o Spring monta o grafo.

| Cheiro | Corrigir para |
|---|---|
| controller com regra de negócio | mover para o service |
| `@Entity` devolvida pela API | DTO `record` + conversão |
| service chamando `new OutroService()` | injetar pelo construtor |
| método `process(...)` com 6 parâmetros e flags booleanas | dividir em métodos/casos de uso com nome de intenção |
| herança "para reaproveitar" | composição (injetar o colaborador) |

## Frontend (Angular)

- **S** — um componente = uma responsabilidade visual; um service = uma fonte de dados/regra de tela.
- **O** — varie por `input()`/projeção de conteúdo (`ng-content`), não por `if (variant === 'x')` espalhado.
- **I** — inputs específicos; evite passar objeto gigante "por garantia".
- **D** — componente recebe dados por `input()` e emite eventos por `output()`; quem conhece a API é o service injetado com `inject()`.

| Cheiro | Corrigir para |
|---|---|
| `HttpClient` dentro do componente | mover para o service da feature |
| componente que busca, calcula, formata e navega | página (orquestra) + componentes de apresentação |
| lógica de negócio no template | `computed()` ou método no service |

## Duas perguntas que decidem quase tudo

1. Esta classe tem **um motivo** para mudar? Se não, divida.
2. Dá para testá-la sem subir o Spring inteiro / sem montar a árvore de componentes? Se não, há dependência escondida.

Nomes: `.agents/rules/naming.md`.

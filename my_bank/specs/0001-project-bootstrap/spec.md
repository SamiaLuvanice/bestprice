---
numero: 0001
titulo: Esqueleto executável do projeto (backend, frontend e banco)
tipo: feature
prioridade: P1
status: implementada
toca: [backend, frontend]
depende_de: []
retroativa: true   # escrita depois da implementação
---

# 0001 — Esqueleto executável do projeto

## Problema

Quem desenvolve o `my_bank` (hoje, uma pessoa estudando) não tem onde construir a primeira
feature: não há aplicação de servidor, aplicação web nem banco de dados. Sem um esqueleto
que sobe e se testa de forma repetível, cada feature futura começaria resolvendo
infraestrutura em vez de comportamento, e o ambiente variaria de máquina para máquina.

## Comportamento esperado

Existe um projeto com três partes que funcionam juntas, ainda sem nenhuma regra de negócio:

- uma **API** que informa se está saudável (consultada diretamente na API, não pela interface);
- uma **interface web** aberta no navegador, que consegue falar com a API;
- um **banco de dados** relacional usado pela API.

Convenção que as próximas features herdam: todo endereço da API de domínio fica sob o
prefixo `/api`.

Quem desenvolve consegue subir o sistema inteiro com um único comando, ou rodar API e
interface separadamente durante o desenvolvimento, e rodar os testes de cada parte
com um comando por parte, sem precisar de Docker nem de senha de banco. Informações
sensíveis, como a senha do banco, não ficam no repositório.

## Critérios de aceite

- [x] Dado um ambiente com a senha do banco informada, quando se executa o comando único de
      subida, então banco, API e interface web ficam de pé sem intervenção manual.
- [x] Dado o sistema no ar, quando se consulta a saúde da API diretamente, então ela
      responde que está ativa.
- [x] Dado o sistema no ar, quando a API inicia, então o log de inicialização mostra que ela
      está conectada a um banco relacional servidor (e não a um banco temporário em memória).
- [x] Dado o sistema no ar, quando se abre a interface web no navegador, então a página inicial
      carrega; e abrir diretamente o endereço de uma rota que a interface não conhece
      (por exemplo `/qualquer-coisa`) também carrega a página inicial, sem erro.
- [x] Dado o sistema no ar, quando se faz uma requisição a um endereço inexistente sob `/api`
      pela porta da interface, então a resposta é o erro da própria API (e não a página da
      interface), provando que a requisição chegou à API.
- [x] Dado o modo de desenvolvimento (API e interface rodando separadas), quando se faz essa
      mesma requisição pela porta da interface, então o resultado é o mesmo.
- [x] Dado que a senha do banco não foi informada, quando se tenta subir o sistema, então a
      subida falha e a mensagem, exibida no terminal de quem executou o comando, cita o nome
      da variável ausente.
- [x] Dado o repositório sem Docker e sem variável de ambiente alguma definida, quando se roda
      o comando de testes de cada parte, então os testes da API e os da interface passam, e a
      contagem de testes executados é maior que zero em cada uma.
- [x] Dado o repositório, quando se busca por valores literais de senha, token ou credencial
      nos arquivos versionados e nos novos, então nenhum é encontrado (só referências a
      variáveis de ambiente).

## Evidência (verificação de 2026-10-03)

| Critério | Como foi demonstrado |
|---|---|
| Subida com um comando | `docker compose up --build -d`: 3 containers de pé, banco `healthy` |
| Saúde da API | `GET localhost:8080/actuator/health` → `{"status":"UP"}` |
| Banco relacional | log da API: perfil `docker`, `Database driver: PostgreSQL JDBC Driver`, `Database version: 17.11` |
| Rota desconhecida da interface | `localhost:4200/contas` → 200 (página inicial) |
| `/api` pelo nginx | `localhost:4200/api/nada` → 404 `application/json` do Spring |
| `/api` pelo modo dev | `localhost:4300/api/nada` (`ng serve`) → 404 `application/json` do Spring; `/contas` → 200 |
| Senha ausente | `docker compose config` → `required variable POSTGRES_PASSWORD is missing a value` |
| Testes | API: 1 teste, 0 falhas (H2, sem Docker, sem variáveis); interface: 2 testes passando |
| Sem segredo literal | busca por `password/senha/secret/token = valor` sem ocorrências |

Limite desta evidência: os testes rodaram na cópia de trabalho, não num clone limpo. O teste de interface
agora confere o título "My Bank" (e foi visto falhar quando quebrado de propósito). Os
critérios foram demonstrados pelo autor; houve revisão estática do `arch-reviewer` (sem executar nada).

## Fora de escopo

- Qualquer regra de negócio, entidade, tela ou endpoint de domínio (contas, transferências...).
- Autenticação e autorização.
- Versionamento do schema do banco (migrations).
- Integração contínua, publicação de imagens e implantação em nuvem.
- HTTPS e domínio próprio.
- Garantir que os dados do banco sobrevivam a reinícios (não há dados para persistir ainda).
- A saúde da API refletir o estado do banco (hoje só informa que a API está de pé).
- Comportamento com **banco indisponível ou lento** e **ordem de subida/retentativa**.
- O que a interface mostra quando a API está fora do ar.
- Observabilidade além da saúde (métricas, logs estruturados).
- Reprodutibilidade em outra máquina ou sistema operacional (só foi demonstrado nesta).

## Perguntas em aberto

- **Spec retroativa.** Foi escrita depois de o esqueleto existir. Os critérios descrevem o que já foi
  entregue. A dona do repositório autorizou promover o `status` para `implementada` (2026-10-03).
- **Persistência dos dados.** Quando a primeira entidade existir, vale um critério: dados
  gravados continuam lá depois de parar e subir o sistema de novo.
- **Arquivo de exemplo de configuração.** Resolvido: o `.env.example` está versionado.
  Ainda pendente: a regra de permissão do assistente que o bloqueia (ver `plan.md`).
- **Escolhas de versão e tecnologia** (linguagem, frameworks, banco) estão registradas em
  `plan.md`, pois são decisões de como, não de o quê.
- **Cabeçalho divergente.** O template (`specs/0000-template`) e `po-intake/reference.md`
  definiam cabeçalhos e valores de `status` diferentes. Resolvido: o template agora segue a referência.

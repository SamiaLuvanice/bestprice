---
numero: 0049
titulo: Design system 2026 no código e telas internas fiéis ao Figma
tipo: melhoria
prioridade: P2
status: implementada
toca: [frontend, docs]
depende_de: [0016, 0039, 0040, 0041, 0042, 0044, 0045, 0048]
issue: https://github.com/SamiaLuvanice/bestprice/issues/267
---

# 0049 — Design system 2026 no código e telas internas fiéis ao Figma

Issue: https://github.com/SamiaLuvanice/bestprice/issues/267

## Problema e público

Em 07/11/2026, o Figma aprovado ganhou um design system novo. O arquivo é o
[BestPrice IA](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice-IA?node-id=0-1),
página "00 · BestPrice IA — Design system", versão "Design system 2026 · shadcn/ui" do
histórico do arquivo. A página reúne:

- **Fundamentos e tokens:** a seção 1.
- **Biblioteca de componentes com variantes e estados:** a seção 2.
- **Componentes da marca:** a seção 3.

As telas internas do mesmo arquivo também passaram para a nova linguagem (páginas 01 e
02). O produto continua com os tokens e componentes anteriores e ainda não tem vários
componentes que o Figma define. Por isso, o Figma aprovado e o que a pessoa usuária vê
divergem, e cada tela nova precisa recriar estilos por conta própria. O resultado é mais
inconsistência e mais custo de manutenção.

O problema afeta:

- **Pessoas usuárias:** percebem um produto menos coeso.
- **Quem implementa:** não tem uma fonte única de estilo e de componentes.

## Resultado esperado

O design system do Figma passa a ser, no produto, a fonte única de cores, tipografia,
espaço, raios, elevação, foco e movimento. Todos os componentes da seção 2 ficam
disponíveis com os mesmos nomes, variantes e estados, prontos para as próximas telas,
e podem ser consultados num catálogo de referência.

Nada muda no que o produto faz:

- rotas, textos, dados exibidos, regras e contratos com a API continuam iguais;
- muda apenas a aparência.

Elementos de um quadro do Figma que dependem de comportamento ou de dado que o produto
ainda não tem não são implementados. Por exemplo: os indicadores de queda, de alertas
ativos e de sem estoque, a busca, os filtros por situação, o seletor de período e o
resumo por situação do quadro de monitoramento. A tela mantém o conteúdo atual com o
visual novo, e cada omissão é registrada na verificação.

### Telas abrangidas

Lista fechada. "Telas alteradas", nos critérios, significa as listas A e B.

**A. Telas com quadro no Figma.** Ficam fiéis ao quadro, conforme o AC08. Identificador
do quadro na página 01 (desktop) / página 02 (mobile):

| Tela / estado | Desktop | Mobile |
|---|---|---|
| Entrar | 59:44 | 59:602 |
| Criar conta (padrão, foco, enviando, erros de campo, e-mail já cadastrado, limite de tentativas, falha de rede) | 220:347, 220:382, 220:421, 220:459, 220:505, 220:546, 220:588 | 220:871, 220:900, 220:933, 220:965, 220:1005, 220:1040, 220:1076 |
| Assistente — início | 132:27 | 132:361 |
| Assistente — conversa | 133:169 | 132:468 |
| Histórico de conversas | 59:204 | 59:716 |
| Monitoramento — sem produtos | 59:254 | 59:752 |
| Monitoramento — com produtos | 151:11 | 152:312 |
| Estados do assistente (indisponível, recuperação) | 137:43 (página 00) | 184:200 |
| Estados do monitoramento (indisponível, recuperação) | 152:535 (página 00) | — |

**B. Páginas sem quadro atualizado.** Recebem os tokens e componentes novos, sem
redesenho próprio, e as diferenças entram na revisão do AC13:

- lista de produtos;
- detalhe do produto;
- alertas;
- comparador;
- estados de carregamento sem quadro;
- landing pública atual;
- página "não encontrada".

### Quem pode ver o catálogo

- **No servidor de desenvolvimento local:** o catálogo abre.
- **Em qualquer build de distribuição, inclusive um build feito localmente:** o endereço
  do catálogo mostra a página "não encontrada" e o conteúdo do catálogo não vai junto
  nos arquivos entregues.

### Linguagem visual a preservar

- **Verde de ação:** usado só na ação principal de cada tela, sempre com texto preto.
- **Rosa:** reservado à leitura, aos links, aos itens ativos e ao foco.
- **Barra lateral:** escura.
- **Títulos:** largos e expressivos quando a fonte larga existe no aparelho.
- **Dados** (preços, horários, identificadores e contadores): em fonte monoespaçada,
  com algarismos de largura fixa.
- **Mascote e logo:** usam a arte original, sem redesenho.

## Decisões do responsável (07/11/2026)

- **Escopo:** design system no código e telas internas existentes. A landing pública nova
  (nova narrativa, textos e robô narrativo) fica para uma spec separada.
- **Cor da ação principal (substitui a spec 0042, AC05):**
  - a ação principal é verde `#39FF14` com texto preto, como no Figma 2026;
  - a direção "ação principal rosa com texto branco" da 0042 deixa de valer;
  - a Issue #222 (0042) é fechada junto com esta spec, porque a harmonização das telas
    passa a ser feita aqui;
  - o rosa continua como cor primária da marca para leitura, links, itens ativos e foco.
- **Precedência:** o Figma atualizado prevalece sobre os valores atuais do código
  (spec 0039). Em especial:
  - cards com fundo branco e borda;
  - hover da ação principal no tom do Figma.
- **Landing atual e "não encontrada":** recebem os tokens novos sem redesenho até a spec
  da landing nova.
- **Tema:** o produto continua com tema claro fixo (spec 0016). Os valores "Noite" valem
  só para superfícies escuras fixas, como a barra lateral. Com o sistema operacional em
  modo escuro, a aparência é a mesma.
- **Fontes:**
  - **Títulos:** usam a variação larga ("Expanded") da fonte de sistema da Apple quando
    ela existe no aparelho e caem para a fonte do sistema nos demais. Essa fonte não é
    distribuída.
  - **Dados:** usam a fonte monoespaçada do Figma, Geist Mono, de licença aberta (SIL
    Open Font License), distribuída junto com o produto, sem serviço externo, com a
    licença registrada.
- **Catálogo:** traz todos os componentes da seção 2 do Figma, inclusive os que as telas
  atuais ainda não usam.

## Critérios de aceite

- [ ] **AC01 — Tokens:** dada a coleção de variáveis "shadcn/ui · BestPrice" do Figma (67 variáveis de cor, raio e espaço), quando ela é comparada com os tokens do produto, então a verificação traz uma tabela 1:1 (variável, token, valor esperado, valor obtido) e todos os valores claros coincidem. Os valores "Noite" usados em superfícies escuras fixas também coincidem. Divergência só com motivo e aprovação registrados.
- [ ] **AC02 — Sem cor solta:** dadas as telas das listas A e B e os componentes do catálogo, quando o estilo é inspecionado, então as cores vêm dos tokens, sem valores de cor escritos diretamente. A exceção são as artes originais (logo e mascote).
- [ ] **AC03 — Tipografia:** dadas as telas da lista A, quando são comparadas com o Figma, então:
  - títulos, corpo, rótulos e botões seguem tamanho, peso, entrelinha e espaçamento dos estilos de texto do Figma;
  - a família pode ser a substituta decidida para aparelhos sem a fonte larga, e a verificação informa em qual sistema a comparação foi feita;
  - preços, horários, IDs de publicação e contadores usam a fonte monoespaçada com algarismos de largura fixa.
- [ ] **AC04 — Forma, elevação, foco e movimento:** dados botões, campos, cards, menus e diálogos do catálogo, quando os estilos calculados são inspecionados, então raio, sombra, espessura e cor do anel de foco e duração das transições são os valores do quadro "Espaço, raio, elevação e movimento" do Figma (seção 1). A verificação lista o valor esperado e o obtido.
- [ ] **AC05 — Biblioteca completa:** dado o inventário da seção 2 do Figma (componente, variantes, estados e identificador do nó), quando ele é conferido no catálogo local, então cada item está presente e cada variante e estado pode ser exibido. A verificação traz o inventário marcado item a item.
- [ ] **AC06 — Catálogo restrito:** no servidor de desenvolvimento local, o catálogo abre. Dado qualquer build de distribuição, inclusive local, quando alguém abre o endereço do catálogo, então vê a página "não encontrada", e o conteúdo do catálogo não aparece nos arquivos gerados.
- [ ] **AC07 — Ação principal única:** dada qualquer tela da lista A, quando ela é exibida, então há no máximo uma ação em verde de ação, com texto preto. As demais ações usam outras variantes.
- [ ] **AC08 — Telas fiéis ao Figma:** para cada tela e estado da lista A, a verificação traz a captura da implementação ao lado do quadro do Figma (identificador e data), em 1440 px e 390 px. A comparação confere ordem e hierarquia dos blocos, componentes usados, tokens de cor, de texto e de espaço e o conteúdo. Divergência só é aceita se cair em uma destas categorias, com o motivo e a aprovação explícita da pessoa responsável:
  - fonte substituta;
  - elemento sem comportamento ou dado existente;
  - limite técnico descrito.
- [ ] **AC09 — Navegação:** dada a área logada em desktop, quando a navegação é exibida, então a barra lateral é escura e o destino ativo fica realçado em rosa, como no Figma. No mobile, a navegação inferior mantém os três destinos e rótulos atuais (Assistente, Histórico e Monitorar) com ícone, e o destino ativo fica realçado em rosa.
- [ ] **AC10 — Gráfico de histórico:** dado um produto com histórico, quando o gráfico é exibido, então:
  - a série aparece em degraus, com linha escura e área verde;
  - o último degrau termina na última leitura registrada;
  - o ponto atual, em verde, é essa leitura;
  - com preço-alvo, ele aparece tracejado em rosa; sem preço-alvo, a linha tracejada não aparece;
  - com uma única leitura, aparece só o ponto, sem degrau;
  - nenhum ponto inexistente no histórico é desenhado;
  - produto sem histórico e produto indisponível mantêm o comportamento atual.
- [ ] **AC11 — Comportamento preservado:** dadas as suítes de teste do frontend, quando são executadas, então passam sem mudar asserções de comportamento: textos, rotas, dados, estados e chamadas à API continuam iguais. Asserções sobre valores visuais (cor, raio, dimensão de token) podem ser atualizadas para os valores do Figma, cada mudança listada na verificação. As contagens de testes são positivas. A suíte do backend roda como sanidade e continua verde.
- [ ] **AC12 — Acessibilidade:** dadas as telas das listas A e B, em 320, 390, 768 e 1280 px, quando são verificadas, então:
  - todo alvo interativo tem pelo menos 44 × 44 px;
  - os pares de texto e fundo atingem contraste AA, e limites de controles e foco atingem 3:1;
  - o foco é visível em todo controle e o fluxo funciona só com o teclado;
  - com movimento reduzido, as animações não essenciais param;
  - nenhum desses tamanhos de tela causa rolagem horizontal.
- [ ] **AC13 — Regressão visual revisada:** dada a suíte de regressão visual, quando as referências são atualizadas, então cada diferença foi apresentada e aprovada explicitamente, sem atualização em massa sem revisão. Isso inclui a landing atual e a página "não encontrada". As falhas visuais preexistentes da Issue #259 estão resolvidas ou explicitamente separadas antes da atualização.
- [ ] **AC14 — Fontes sem serviço externo:** dado o produto em execução e as suítes de teste, quando as páginas carregam, então nenhuma fonte é buscada em serviço externo. A fonte monoespaçada distribuída tem a licença registrada no repositório.
- [ ] **AC15 — Documentação do design system:** dada a documentação do design system no repositório, quando ela é consultada, então registra:
  - os tokens novos e alterados;
  - as variantes próprias do BestPrice, como a ação verde e os status de preço;
  - a substituição da direção de ação rosa da 0042;
  - as divergências resolvidas a favor do Figma;
  - a decisão sobre fontes e sua licença;
  - o vínculo com a versão do Figma usada.

## Fora de escopo

- A landing pública nova: nova narrativa, novos textos, demonstração e robô narrativo.
  Ela terá uma spec própria.
- Qualquer mudança de comportamento, texto, rota, regra de negócio, dado ou contrato da API.
- Elementos do Figma sem comportamento existente, entre eles:
  - os indicadores, a busca, os filtros por situação, o seletor de período e o resumo
    por situação do monitoramento;
  - a seleção de produtos em tabela;
  - novas ações no menu de produto.
- Tema escuro alternável ou automático.
- Mudanças no backend.
- Edições no Figma. Esta spec consome a versão aprovada; ajustes de design voltam ao Figma
  antes da implementação.

## Perguntas em aberto

- **Fatiamento:** o `/plan` pode dividir a entrega em mais de uma PR. Por exemplo, uma
  para fundamentos e componentes e outra para a adoção nas telas. Cada PR precisa manter
  os critérios já atingidos.
- **Quadros "Estados" na página 00:** os quadros 137:43 e 152:535 ficam na seção
  "Legado" da página do design system, mas foram atualizados para a linguagem nova em
  07/11/2026. Suposição: continuam valendo como referência dos estados.

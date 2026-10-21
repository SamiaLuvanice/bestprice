# Redesign BestPrice para Figma

Quadros vetoriais editáveis para o [arquivo Figma BestPrice](https://www.figma.com/design/LZVtUEAycEzfbwL0H5YL3r/BestPrice). A identidade reaproveita a logo oficial, as cores e a tipografia do designsystem/index.html. Produtos, valores, horários e métricas são exemplos visuais, não dados reais.

O arquivo contém três páginas: **00 · Design system**, **01 · Telas desktop** e **02 · Telas mobile**. São 17 quadros editáveis no total: dois de fundamentos e biblioteca, oito desktop e sete mobile. A biblioteca também contém sete componentes Figma reutilizáveis. A coleção **BestPrice · Base** reúne 30 variáveis nativas: 19 cores, sete espaçamentos e quatro raios.

Cobertura: landing e login; início, produtos, detalhe e alertas; estados vazio/erro/carregamento; página não encontrada; versões móveis dos fluxos principais. O estudo original não alterou o código da SPA; sua implementação está na spec 0027.

As landings desktop e mobile incorporam as artes fornecidas em 21/10/2026: [hero com pessoa](assets/hero-person.png) e [banner com celular](assets/footer-phone.png). Os PNGs de origem estão preservados nesta pasta; as versões usadas nos SVGs estão incorporadas aos próprios arquivos. O texto principal fica fora das áreas com fotografia e interface ilustrada para manter a leitura em ambos os tamanhos.

O [login desktop](02-login-desktop.svg) usa a [imagem de monitoramento em neon](assets/login-left.png) em toda a faixa esquerda. A marca fica sobre a área clara da foto e o formulário permanece em uma superfície branca separada. O login mobile mantém o layout de formulário, sem uma coluna lateral.

Decisões: hierarquia de preço com moeda explícita, rosa para informação e foco, verde para ação, navegação reduzida às rotas reais, alvos de toque de 44 px e estados recuperáveis. A spec 0027 implementa essa direção no frontend com shadcn/ui e Recharts/shadcn Chart, usando o histórico carregado da API. As amostras dos quadros continuam ilustrativas e não preenchem a conta. A comparação usou estes SVGs locais porque o conector Figma repetiu autenticação; eventuais alterações posteriores no arquivo remoto não foram conferidas. Ver [evidências da implementação](../../../specs/0027-redesign-figma-shadcn/verification.md).

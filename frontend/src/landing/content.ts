/**
 * Conteúdo fixo e dados ilustrativos da landing (spec 0050). Os textos vêm do snapshot do Figma
 * `designsystem/landing/figma-landing-texts-2026-11.json` (quadros 238:294 e 239:180); o teste
 * `LandingPage.content.test.tsx` compara o texto renderizado com ele. Nenhum dado aqui é real:
 * a landing não consulta preços, anúncios nem o assistente.
 */

/** Título da aba aprovado pela spec 0051 (termo de busca antes da marca). */
export const pageTitle = 'Monitor de preços do Mercado Livre · BestPrice'

/** Selo do hero ajustado pela spec 0050 ("Ajuste de texto aprovado"). */
export const approvedSeal = 'Só o link, nada para preencher'

/**
 * Valores ilustrativos em reais dos quadros do Figma. Todo "R$ …" da landing fica neste arquivo
 * (exceção única de `src/content.test.tsx`, spec 0050); as seções importam daqui.
 */
export const sample = {
  price: 'R$ 1.849,00',
  previous: 'R$ 1.949,00',
  highest: 'R$ 2.199,00',
  target: 'R$ 1.900,00',
  targetShort: 'R$ 1.900',
  seenLater: 'R$ 2.049,00',
  momentCompact: 'R$ 1.849 → R$ 2.049',
} as const

export const assistantCopy = {
  question: 'Quero um notebook para estudar e trabalhar, até R$ 4.000. O que devo priorizar?',
  webRange: 'Na web, encontrei modelos nessa faixa entre R$ 3.599 e R$ 3.999.',
  questionMobile: 'Notebook para estudar e trabalhar, até R$ 4.000. O que priorizar?',
  answerMobile: 'Priorize 16 GB de RAM, SSD de 512 GB e boa bateria. Na web, achei modelos entre R$ 3.599 e R$ 3.999.',
} as const

export const emptyLinkMessage = 'Informe o link completo de um anúncio do Mercado Livre Brasil.'

export const anchors = [
  { id: 'como-funciona', label: 'Como funciona' },
  { id: 'demonstracao', label: 'Demonstração' },
  { id: 'assistente', label: 'Assistente' },
  { id: 'perguntas', label: 'Perguntas' },
] as const

/** Consultas recentes do cartão do hero. */
export const recentChecks = [
  { when: 'há 3 h', price: 'R$ 1.949,00', change: 'sem mudança', down: false },
  { when: 'há 1 h', price: 'R$ 1.949,00', change: 'sem mudança', down: false },
  { when: 'há 12 min', price: 'R$ 1.849,00', change: '↓ R$ 100,00', down: true },
] as const

/** Degraus ilustrativos do hero, em reais (o último é o preço atual, no alvo). */
export const heroSteps = [1999, 1979, 1979, 1999, 1949, 1899, 1849]
export const heroTarget = 1900

/** Degraus ilustrativos da Demonstração, coerentes com as mudanças listadas abaixo do gráfico. */
export const demoSteps = [2149, 2099, 2199, 2189, 2099, 1999, 1949, 1849]
export const demoTarget = 1900
export const demoMonths = ['ago', 'set', 'out', 'nov'] as const

export const demoChanges = [
  { when: 'hoje, 10:42', change: 'R$ 1.949 → R$ 1.849' },
  { when: 'seg, 08:15', change: 'R$ 1.999 → R$ 1.949' },
  { when: 'qui, 21:03', change: 'R$ 2.189 → R$ 2.099' },
] as const

export const benefits = [
  {
    icon: 'clock',
    title: 'Seu tempo de volta',
    desktop: 'Nada de abrir o mesmo anúncio todos os dias. As consultas acontecem sem você precisar lembrar.',
    mobile: 'Nada de abrir o mesmo anúncio todos os dias.',
  },
  {
    icon: 'history',
    title: 'Desconto com contexto',
    desktop: 'Compare o preço de hoje com o menor e o maior já registrados e veja se a oferta é boa de verdade.',
    mobile: 'Compare o preço de hoje com o menor e o maior já registrados.',
  },
  {
    icon: 'shield',
    title: 'Dados da fonte oficial',
    desktop: 'Os preços vêm da API oficial do Mercado Livre. Sem scraping e sem leitura de páginas.',
    mobile: 'Preços da API oficial do Mercado Livre. Sem scraping.',
  },
  {
    icon: 'target',
    title: 'Aviso só quando importa',
    desktop: 'Você define o preço-alvo. O BestPrice só chama sua atenção quando ele é atingido.',
    mobile: 'O aviso aparece quando seu preço-alvo é atingido.',
  },
] as const

export const recentConversations = [
  { title: 'Notebook para estudar e trabalhar', updated: 'Atualizada agora', active: true },
  { title: 'Fone para academia até R$ 300', updated: 'Atualizada há 2 dias', active: false },
  { title: 'Air fryer para 2 pessoas', updated: 'Atualizada há 5 dias', active: false },
  { title: 'Presente de aniversário — gamer', updated: 'Atualizada há 2 semanas', active: false },
] as const

export const assistantFeatures = [
  {
    icon: 'question',
    title: 'Pergunte do seu jeito',
    desktop: 'Uso, prioridades e orçamento. Você não precisa chegar sabendo o modelo ideal.',
    mobile: 'Uso, prioridades e orçamento.',
  },
  {
    icon: 'sparkles',
    title: 'Preços da web, com fontes',
    desktop: 'Quando a pesquisa está disponível, cada referência mostra de onde veio e quando foi consultada.',
    mobile: 'Cada referência mostra de onde veio e quando.',
  },
  {
    icon: 'history',
    title: 'Retome de onde parou',
    desktop: 'Conversas salvas por até 90 dias, com busca pelo título no histórico.',
    mobile: 'Conversas salvas por até 90 dias.',
  },
] as const

/** Perguntas frequentes; as respostas vêm de `faqAnswers` do snapshot. */
export const faq = [
  {
    question: 'De onde vêm os preços?',
    answer: 'Da API oficial do Mercado Livre, consultada pelo BestPrice. Não lemos páginas da loja nem usamos scraping. O preço considerado é o de uma unidade, sem frete, cupom ou benefício pessoal.',
  },
  {
    question: 'Preciso preencher os dados do produto?',
    answer: 'Não. Você cola o link do anúncio e o BestPrice busca título, imagem, preço e disponibilidade sozinho.',
  },
  {
    question: 'Como fico sabendo que o preço caiu?',
    answer: 'Defina um preço-alvo. Quando o preço atual ficar igual ou abaixo dele, uma notificação aparece no sino do BestPrice.',
  },
  {
    question: 'O BestPrice compra por mim?',
    answer: 'Não. Ele acompanha e avisa. A decisão e a compra continuam com você, direto no Mercado Livre.',
  },
  {
    question: 'Funciona com outras lojas?',
    answer: 'Nesta fase, apenas anúncios do Mercado Livre Brasil.',
  },
] as const

/** Frases do companheiro de rolagem por seção (nota 238:771; tabela da spec). */
export const companionPhrases: Record<string, string | null> = {
  inicio: null,
  problema: 'Tô de olho',
  'como-funciona': 'Tô de olho',
  demonstracao: 'Achei uma queda',
  'por-que': 'Achei uma queda',
  assistente: 'Pode deixar',
  perguntas: 'Pode deixar',
  comecar: null,
}
